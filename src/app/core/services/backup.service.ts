import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../../environments/environment';

export interface BackupTableInfo {
  name: string;
  rows: number;
  sizeBytes: number;
}

export interface BackupInfo {
  database: string;
  tables: BackupTableInfo[];
  totalTables: number;
  totalRows: number;
  totalSizeBytes: number;
  suggestedFileName: string;
  generatedAt: string;
}

export interface BackupResult {
  fileName: string;
  bytes: number;
  /**
   * How the file was saved:
   * - `server` — written by the API into the configured folder
   * - `folder` — written by the browser into a folder the user picked
   * - `download` — handed to the browser's downloads folder
   */
  via: 'server' | 'folder' | 'download';
  /** Absolute path, only for `server`. */
  filePath?: string;
  /** Set when the name was adjusted to avoid overwriting an existing backup. */
  renamedFrom?: string;
}

export interface BackupFolder {
  path: string;
  configured: boolean;
  ok: boolean;
  exists: boolean;
  writable: boolean;
  message: string;
}

export interface FolderCheck {
  path: string;
  ok: boolean;
  exists: boolean;
  writable: boolean;
  created: boolean;
  message: string;
}

/**
 * Outcome of the native dialog. `picked` carries the folder plus the same
 * writability fields as a FolderCheck, so the caller needs no second call.
 */
export interface NativePickResult extends Partial<FolderCheck> {
  status: 'picked' | 'cancelled' | 'unsupported';
  message?: string;
}

export interface BrowseEntry {
  name: string;
  path: string;
}

export interface BrowseResult {
  /** Folder being listed. Empty means "the roots". */
  path: string;
  parent: string | null;
  /** Drive roots, for jumping between them. */
  roots: BrowseEntry[];
  folders: BrowseEntry[];
  /** Whether this folder could be used as a backup destination. */
  writable: boolean;
  error?: string;
}

/**
 * Minimal shape of the File System Access API this service uses. Typed here
 * because it is absent from the TypeScript DOM lib at the version this project
 * builds against.
 */
interface FsDirectoryHandle {
  name: string;
  entries(): AsyncIterableIterator<[string, { kind: 'file' | 'directory' }]>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FsFileHandle>;
}
interface FsFileHandle {
  createWritable(): Promise<WritableStream<any>>;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly API_URL = `${environment.apiUrl}/backup`;
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  /**
   * True when the browser can let the user pick a real folder to write into.
   *
   * The File System Access API is the only way a web page can write to a
   * location the user chose; without it the file can only go to the browser's
   * download folder. Chromium-based browsers have it, which covers the Chrome
   * the POS runs in — Firefox and Safari do not, hence the fallback.
   */
  public get canChooseFolder(): boolean {
    return typeof (window as any).showDirectoryPicker === 'function';
  }

  public getInfo(): Promise<ApiResponse<BackupInfo>> {
    return firstValueFrom(this.http.get<ApiResponse<BackupInfo>>(`${this.API_URL}/info`));
  }

  /** The configured destination folder and whether it is usable right now. */
  public getFolder(): Promise<ApiResponse<BackupFolder>> {
    return firstValueFrom(this.http.get<ApiResponse<BackupFolder>>(`${this.API_URL}/folder`));
  }

  /** Whether the server can open Windows' native Select Folder dialog. */
  public pickerAvailable(): Promise<ApiResponse<{ available: boolean; platform: string }>> {
    return firstValueFrom(
      this.http.get<ApiResponse<{ available: boolean; platform: string }>>(`${this.API_URL}/folder/picker`)
    );
  }

  /**
   * Opens Windows' own Select Folder dialog on the POS server's desktop.
   *
   * The request stays open while the dialog is up, so no timeout is applied —
   * someone browsing their drives is not a stalled request.
   */
  public pickFolderNatively(initialPath?: string): Promise<ApiResponse<NativePickResult>> {
    return firstValueFrom(
      this.http.post<ApiResponse<NativePickResult>>(`${this.API_URL}/folder/pick`, { initialPath })
    );
  }

  /**
   * Lists folders on the machine running the API.
   *
   * Server-side because the destination must be a path the API can write to,
   * and the browser's own picker never exposes a path — only a folder name.
   * Omit `folderPath` to list the drive roots.
   */
  public browse(folderPath?: string): Promise<ApiResponse<BrowseResult>> {
    const params = folderPath ? { path: folderPath } : undefined;
    return firstValueFrom(
      this.http.get<ApiResponse<BrowseResult>>(`${this.API_URL}/folder/browse`, { params })
    );
  }

  /** Creates a subfolder from inside the browse dialog. */
  public createFolder(parent: string, name: string): Promise<ApiResponse<FolderCheck>> {
    return firstValueFrom(
      this.http.post<ApiResponse<FolderCheck>>(`${this.API_URL}/folder/create`, { parent, name })
    );
  }

  /** Checks a folder without saving it. */
  public verifyFolder(folderPath: string, create = false): Promise<ApiResponse<FolderCheck>> {
    return firstValueFrom(
      this.http.post<ApiResponse<FolderCheck>>(`${this.API_URL}/folder/verify`, { path: folderPath, create })
    );
  }

  /** Validates and saves the folder all future backups are written to. */
  public saveFolder(folderPath: string, create = false): Promise<ApiResponse<FolderCheck>> {
    return firstValueFrom(
      this.http.post<ApiResponse<FolderCheck>>(`${this.API_URL}/folder`, { path: folderPath, create })
    );
  }

  /**
   * Runs the backup on the server, into the configured folder.
   *
   * This is the path used once a folder is set: the API writes the file itself,
   * so nothing downloads and no location has to be picked each time.
   */
  public async backupToConfiguredFolder(): Promise<BackupResult> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<{ fileName: string; filePath: string; bytes: number; renamedFrom?: string }>>(
        `${this.API_URL}/run`,
        {}
      )
    );

    if (!res.success || !res.data) {
      throw new Error(res.message || 'The backup could not be completed.');
    }

    return {
      fileName: res.data.fileName,
      filePath: res.data.filePath,
      bytes: res.data.bytes,
      via: 'server',
      renamedFrom: res.data.renamedFrom,
    };
  }

  /** `11-10-2025.sql` — today's date, hyphenated so it is a legal file name. */
  public suggestedFileName(at: Date = new Date()): string {
    const dd = String(at.getDate()).padStart(2, '0');
    const mm = String(at.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${at.getFullYear()}.sql`;
  }

  /**
   * Runs a backup into a folder the user picks.
   *
   * The response body is piped straight into the chosen file rather than being
   * buffered into a Blob first, so the size of the database does not become
   * the size of a string held in the tab.
   *
   * Throws `BACKUP_CANCELLED` if the user dismisses the folder picker, which
   * the caller should treat as "nothing happened" rather than as a failure.
   */
  public async backupToFolder(): Promise<BackupResult> {
    if (!this.canChooseFolder) {
      throw new Error('FOLDER_PICKER_UNSUPPORTED');
    }

    let directory: FsDirectoryHandle;
    try {
      directory = await (window as any).showDirectoryPicker({
        id: '-pos-backup',
        mode: 'readwrite',
        // Reopens where the last backup went, so repeat backups are two clicks.
        startIn: 'documents',
      });
    } catch {
      // The picker rejects on dismissal; there is no separate cancel signal.
      throw new Error('BACKUP_CANCELLED');
    }

    const preferred = this.suggestedFileName();
    const fileName = await this.nonClashingName(directory, preferred);

    const response = await this.fetchDump();

    const handle = await directory.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();

    let bytes = 0;
    try {
      const reader = response.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        await (writable as any).write(value);
      }
      await (writable as any).close();
    } catch (err) {
      // Leaving a half-written file in the user's folder would look like a
      // successful backup, so it is abandoned rather than kept.
      try {
        await (writable as any).abort();
      } catch {
        /* the stream may already be unusable */
      }
      throw err;
    }

    return {
      fileName,
      bytes,
      via: 'folder',
      renamedFrom: fileName === preferred ? undefined : preferred,
    };
  }

  /**
   * Fallback for browsers without the folder picker: a normal download.
   *
   * The destination is whatever the browser is configured to do — its download
   * folder, or a Save As dialog if the user has that enabled. The caller is
   * told which route was taken so the UI can say so honestly instead of
   * implying the location was chosen.
   */
  public async backupToDownloads(): Promise<BackupResult> {
    const response = await this.fetchDump();
    const blob = await response.blob();
    const fileName = this.headerFileName(response) ?? this.suggestedFileName();

    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      // Revoked on a tick so the click has started the transfer first.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }

    return { fileName, bytes: blob.size, via: 'download' };
  }

  /**
   * `11-10-2025.sql`, or `11-10-2025_2.sql` when that is taken.
   *
   * Two backups on one day must not silently replace each other, and the
   * folder handle is what makes this checkable — the download fallback cannot
   * see the folder and leaves de-duplication to the browser.
   */
  private async nonClashingName(directory: FsDirectoryHandle, preferred: string): Promise<string> {
    const existing = new Set<string>();
    try {
      for await (const [name] of directory.entries()) {
        existing.add(name.toLowerCase());
      }
    } catch {
      // Cannot enumerate: fall back to the preferred name and let the browser
      // prompt about replacing it.
      return preferred;
    }

    if (!existing.has(preferred.toLowerCase())) return preferred;

    const base = preferred.replace(/\.sql$/i, '');
    for (let n = 2; n < 1000; n += 1) {
      const candidate = `${base}_${n}.sql`;
      if (!existing.has(candidate.toLowerCase())) return candidate;
    }

    // A thousand backups in one day; timestamp it and move on.
    return `${base}_${Date.now()}.sql`;
  }

  /**
   * Fetches the dump with the auth header the interceptor would normally add.
   *
   * `fetch` is used rather than HttpClient because the body has to be consumed
   * as a stream to write it out progressively, and HttpClient buffers the
   * whole response. That means the auth interceptor does not run, so the token
   * is attached here.
   */
  private async fetchDump(): Promise<Response> {
    const token = this.authToken();
    const response = await fetch(`${this.API_URL}/database`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      let message = `The server refused the backup (HTTP ${response.status}).`;
      try {
        const body = await response.json();
        if (body?.message) message = body.message;
      } catch {
        /* not a JSON error body */
      }
      throw new Error(message);
    }

    if (!response.body) {
      throw new Error('The server returned an empty backup.');
    }

    return response;
  }

  private headerFileName(response: Response): string | null {
    const header = response.headers.get('X-Backup-Filename');
    if (header) return header;

    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : null;
  }

  /** The same token the HTTP interceptor attaches, from the same source. */
  private authToken(): string | null {
    return this.auth.getToken();
  }
}

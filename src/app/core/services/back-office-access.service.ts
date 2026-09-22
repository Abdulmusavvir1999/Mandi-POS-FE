import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

export interface BackOfficeAccessStatus {
  /** Whether a Back-Office password has been set on this account yet. */
  configured: boolean;
  unlockTtlMinutes: number;
  minLength: number;
}

export interface BackOfficeUnlockGrant {
  unlockToken: string;
  expiresAt: string;
  unlockTtlMinutes: number;
}

/** Header the grant travels in; matched by `requireBackOfficeUnlock` server-side. */
export const UNLOCK_HEADER = 'X-Back-Office-Unlock';

/**
 * The Back-Office password — setting it, and unlocking with it.
 *
 * The grant returned by a successful unlock is kept in `sessionStorage`, not
 * `localStorage`: closing the tab should re-lock the Back-Office. Signing out
 * clears it too, since `AuthService.logout()` empties both stores.
 *
 * It is held here rather than in a component so a full page reload at
 * `/admin/back-office` does not throw away an unlock that is still good.
 */
@Injectable({
  providedIn: 'root',
})
export class BackOfficeAccessService {
  private readonly API_URL = `${environment.apiUrl}/back-office/access`;
  private readonly UNLOCK_KEY = '_pos_back_office_unlock';

  private http = inject(HttpClient);

  /** Mirrors the stored grant so the Back-Office screen can react to it. */
  public readonly isUnlocked = signal<boolean>(this.readToken() !== null);

  /** Whether this account has a Back-Office password configured. */
  public getStatus(): Observable<ApiResponse<BackOfficeAccessStatus>> {
    return this.http.get<ApiResponse<BackOfficeAccessStatus>>(`${this.API_URL}/status`);
  }

  /**
   * Sets the Back-Office password for the first time, or replaces it.
   *
   * The current password is not asked for — an active super administrator
   * session is the whole gate.
   */
  public setPassword(data: {
    newPassword: string;
    confirmPassword: string;
  }): Observable<ApiResponse<{ configured: boolean }>> {
    return this.http.put<ApiResponse<{ configured: boolean }>>(`${this.API_URL}/password`, data).pipe(
      // Changing the password invalidates every grant issued against the old
      // one, server-side. Drop the local copy so the screen re-locks here too
      // instead of holding a token that will be refused on the next request.
      tap(() => this.lock())
    );
  }

  /** Checks the password typed on the unlock screen and stores the grant. */
  public unlock(password: string): Observable<ApiResponse<BackOfficeUnlockGrant>> {
    return this.http.post<ApiResponse<BackOfficeUnlockGrant>>(`${this.API_URL}/verify`, { password }).pipe(
      tap((res) => {
        if (res.success && res.data?.unlockToken) {
          sessionStorage.setItem(this.UNLOCK_KEY, res.data.unlockToken);
          this.isUnlocked.set(true);
        }
      })
    );
  }

  /** Forgets the grant, so the Back-Office asks for the password again. */
  public lock(): void {
    sessionStorage.removeItem(this.UNLOCK_KEY);
    this.isUnlocked.set(false);
  }

  /** The stored grant, for the interceptor to attach. */
  public readToken(): string | null {
    try {
      return sessionStorage.getItem(this.UNLOCK_KEY);
    } catch {
      return null;
    }
  }
}

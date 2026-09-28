import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';

/** What a picked file hands back: the change event and the input, so the caller can clear it. */
export interface ImageUploadPick {
  event: Event;
  picker: HTMLInputElement;
}

/**
 * The one image picker every form uses: a dashed drop box with a square
 * preview tile, Upload / Remove buttons and the format hint.
 *
 * It only presents. Reading, validating and uploading the file stay with the
 * form that owns the image, which gets the pick through (fileChange) and sets
 * [imageUrl] once the upload lands.
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-box" [class.has-image]="!!imageUrl" [class.is-busy]="uploading">
      <button
        type="button"
        class="iu-tile"
        [disabled]="uploading"
        [title]="imageUrl ? 'Change image' : pickerTitle"
        (click)="picker.click()"
      >
        <img *ngIf="imageUrl" [src]="settings.assetUrl(imageUrl)" [alt]="alt" />
        <span *ngIf="!imageUrl" class="material-symbols-outlined">{{ emptyIcon }}</span>
      </button>

      <div class="iu-actions">
        <input
          type="file"
          hidden
          #picker
          [accept]="accept"
          [title]="pickerTitle"
          (change)="fileChange.emit({ event: $event, picker: picker })"
        />
        <div class="iu-btn-row">
          <button type="button" class="iu-btn iu-upload" [disabled]="uploading" (click)="picker.click()">
            <span class="material-symbols-outlined" [class.iu-spin]="uploading">{{ uploading ? 'progress_activity' : 'upload' }}</span>
            <span>{{ uploading ? 'Uploading…' : (imageUrl ? 'Change Image' : uploadLabel) }}</span>
          </button>
          <button *ngIf="imageUrl && !uploading" type="button" class="iu-btn iu-remove" (click)="removed.emit()">
            <span class="material-symbols-outlined">delete</span>
            <span>Remove</span>
          </button>
        </div>
        <p class="iu-hint">{{ hint }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .iu-box {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1rem;
        background: var(--bg-app, #faf5ff);
        border: 1.5px dashed var(--card-border, #e9d5ff);
        border-radius: 1rem;
        transition: border-color 0.2s ease;
      }
      .iu-box:hover:not(.is-busy) {
        border-color: var(--primary, #7e22ce);
      }
      .iu-tile {
        width: 4.75rem;
        height: 4.75rem;
        flex-shrink: 0;
        padding: 0;
        border-radius: 1rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        color: var(--primary, #7e22ce);
        box-shadow: 0 4px 12px -2px rgba(var(--primary-rgb, 126, 34, 206), 0.15);
        cursor: pointer;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .iu-tile:hover:not(:disabled) {
        border-color: var(--primary, #7e22ce);
        transform: translateY(-1px);
      }
      .iu-tile:disabled {
        cursor: progress;
      }
      .iu-tile img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .iu-tile .material-symbols-outlined {
        font-size: 2.25rem;
        opacity: 0.6;
      }
      .iu-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }
      .iu-btn-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-wrap: wrap;
      }
      .iu-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.45rem 0.875rem;
        border-radius: 0.625rem;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .iu-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .iu-upload {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--primary, #7e22ce);
        color: var(--primary, #7e22ce);
      }
      .iu-upload:hover:not(:disabled) {
        background: var(--primary, #7e22ce);
        color: #ffffff;
      }
      .iu-upload:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .iu-remove {
        background: transparent;
        border: 1px solid var(--danger, #ef4444);
        color: var(--danger, #ef4444);
      }
      .iu-remove:hover {
        background: rgba(239, 68, 68, 0.1);
      }
      .iu-hint {
        margin: 0;
        font-size: 0.6875rem;
        color: var(--text-muted, #64748b);
      }
      .iu-spin {
        animation: iu-spin 0.9s linear infinite;
      }
      @keyframes iu-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (max-width: 480px) {
        .iu-box {
          gap: 0.875rem;
          padding: 0.75rem;
        }
      }
    `,
  ],
})
export class ImageUploadComponent {
  protected readonly settings = inject(SettingsService);

  /** Stored path or URL of the current image; empty shows the placeholder icon. */
  @Input() imageUrl: string | null | undefined = '';
  @Input() uploading = false;
  @Input() emptyIcon = 'add_photo_alternate';
  @Input() uploadLabel = 'Upload Image';
  @Input() hint = 'PNG, JPG, WEBP or GIF · up to 2 MB';
  @Input() accept = 'image/png,image/jpeg,image/webp,image/gif';
  @Input() alt = 'Image preview';
  @Input() pickerTitle = 'Choose image';

  @Output() fileChange = new EventEmitter<ImageUploadPick>();
  @Output() removed = new EventEmitter<void>();
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

/**
 * The single loading / error surface for every data-backed page.
 *
 * Pages used to signal loading only through whatever their empty state happened
 * to say, so a slow request looked like an empty page and a failed one looked
 * the same as a successful one with no rows. This renders the three states the
 * flow actually has — fetching, failed, and neither — so a page is never blank
 * or ambiguous while a request is in flight.
 *
 * Usage: place it as the first child of the page wrapper.
 *
 *   <app-page-loader
 *     [loading]="isLoading"
 *     [error]="loadError"
 *     (retry)="loadData()"
 *   ></app-page-loader>
 *
 * It overlays the wrapper (which `.page-loader-host` makes a positioning
 * context), so the page keeps its layout underneath and no template has to be
 * restructured around it.
 */
@Component({
  selector: 'app-page-loader',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <!-- Loading -->
    <div
      *ngIf="loading"
      class="page-loader-overlay"
      [class.is-inline]="inline"
      role="status"
      aria-live="polite"
      [attr.aria-label]="message"
    >
      <div class="loader-card">
        <div class="loader-spinner" aria-hidden="true">
          <span class="spinner-ring"></span>
          <span class="material-symbols-outlined spinner-glyph">{{ icon }}</span>
        </div>
        <div class="loader-title">{{ message }}</div>
        <div class="loader-subtitle">{{ subMessage }}</div>
        <div class="loader-track" aria-hidden="true"><span class="loader-bar"></span></div>
      </div>
    </div>

    <!-- Error -->
    <div
      *ngIf="!loading && error"
      class="page-loader-overlay is-error"
      [class.is-inline]="inline"
      role="alert"
    >
      <div class="loader-card">
        <div class="error-icon-wrap" aria-hidden="true">
          <span class="material-symbols-outlined">cloud_off</span>
        </div>
        <div class="loader-title">{{ errorTitle }}</div>
        <div class="loader-subtitle">{{ error }}</div>

        <div class="error-actions">
          <button *ngIf="showRetry" type="button" class="retry-btn" (click)="retry.emit()">
            <span class="material-symbols-outlined">refresh</span>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .page-loader-overlay {
        position: absolute;
        inset: 0;
        z-index: 40;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: clamp(2rem, 14vh, 8rem);
        background: color-mix(in srgb, var(--bg-app, #f8fafc) 78%, transparent);
        backdrop-filter: blur(2px);
        animation: loaderFadeIn 0.18s ease-out;
      }

      /* Fallback for engines without color-mix; harmless where it is supported
         because the rule above wins on cascade order when it parses. */
      @supports not (background: color-mix(in srgb, red 50%, transparent)) {
        .page-loader-overlay {
          background: rgba(248, 250, 252, 0.82);
        }
      }

      /* For containers that are not positioning contexts (modals, cards): sits
         in the flow instead of covering the parent. */
      .page-loader-overlay.is-inline {
        position: static;
        inset: auto;
        padding: 2.5rem 1rem;
        background: transparent;
        backdrop-filter: none;
      }

      @keyframes loaderFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .loader-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        width: min(340px, calc(100% - 2rem));
        padding: 1.5rem 1.5rem 1.25rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-radius: 18px;
        box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.16),
          0 6px 12px -2px rgba(0, 0, 0, 0.08);
        text-align: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }

      /* Spinner */
      .loader-spinner {
        position: relative;
        width: 54px;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.35rem;
      }

      .spinner-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 3px solid var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
        border-top-color: var(--primary, #7e22ce);
        animation: loaderSpin 0.8s linear infinite;
      }

      .spinner-glyph {
        font-size: 22px;
        color: var(--primary, #7e22ce);
        animation: loaderPulse 1.6s ease-in-out infinite;
      }

      @keyframes loaderSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes loaderPulse {
        0%,
        100% {
          opacity: 0.55;
          transform: scale(0.94);
        }
        50% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .loader-title {
        font-size: 0.9375rem;
        font-weight: 800;
        color: var(--text-main, #2e1065);
        letter-spacing: -0.01em;
      }

      .loader-subtitle {
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.45;
        color: var(--text-muted, #6b7280);
      }

      /* Indeterminate progress track */
      .loader-track {
        position: relative;
        width: 100%;
        height: 4px;
        margin-top: 0.85rem;
        border-radius: 9999px;
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
        overflow: hidden;
      }

      .loader-bar {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        border-radius: 9999px;
        background: linear-gradient(
          90deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        animation: loaderSlide 1.15s cubic-bezier(0.65, 0, 0.35, 1) infinite;
      }

      @keyframes loaderSlide {
        0% {
          left: -40%;
        }
        100% {
          left: 100%;
        }
      }

      /* Error state */
      .error-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        margin-bottom: 0.35rem;
        border-radius: 50%;
        background: var(--danger-light, rgba(var(--danger-rgb, 220, 38, 38), 0.12));
      }

      .error-icon-wrap .material-symbols-outlined {
        font-size: 26px;
        color: var(--danger, #dc2626);
      }

      .is-error .loader-title {
        color: var(--danger, #dc2626);
      }

      .error-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.9rem;
      }

      .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        height: 36px;
        padding: 0 0.95rem;
        border: none;
        border-radius: 10px;
        background: linear-gradient(
          135deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        color: #ffffff;
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .retry-btn:hover {
        box-shadow: 0 6px 18px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
        transform: translateY(-1px);
      }

      .retry-btn .material-symbols-outlined {
        font-size: 18px;
      }

      /* Respect a reduced-motion preference: keep the state legible, drop the
         spinning and sliding. */
      @media (prefers-reduced-motion: reduce) {
        .spinner-ring,
        .spinner-glyph,
        .loader-bar,
        .page-loader-overlay {
          animation: none;
        }
        .loader-bar {
          left: 0;
          width: 100%;
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class PageLoaderComponent {
  /** True while the page's request is in flight. */
  @Input() loading = false;

  /** Message from the failed request; null/'' when there is no error. */
  @Input() error: string | null = null;

  @Input() message = 'Loading…';
  @Input() subMessage = 'Fetching the latest records from the server.';
  @Input() errorTitle = 'Could not load this page';

  /** Material symbol shown inside the spinner. */
  @Input() icon = 'sync';

  /** Renders in the document flow rather than covering the parent. */
  @Input() inline = false;

  @Input() showRetry = true;

  @Output() retry = new EventEmitter<void>();
}

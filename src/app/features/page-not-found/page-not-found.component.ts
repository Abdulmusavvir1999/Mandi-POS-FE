import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import {
  PageNotFoundModule,
  PAGE_NOT_FOUND_DEFAULT,
  resolvePageNotFoundModule,
} from '../../core/config/page-not-found.config';

/**
 * The one 404 page in the app. It renders inside the main layout, so the
 * sidebar stays put, and picks its illustration and copy from the module the
 * failed URL belongs to - `/orders/9999` shows the Orders artwork, an unknown
 * first segment falls back to the generic one.
 */
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-wrapper">
      <div class="not-found-card">
        <!-- Module illustration -->
        <div class="illustration-stage">
          <img
            [src]="module().image"
            [alt]="module().label + ' illustration'"
            class="illustration"
            (error)="onIllustrationMissing()"
          />
        </div>

        <span class="code-badge">404</span>

        <h1 class="not-found-title">{{ module().title }}</h1>
        <p class="not-found-message">{{ module().message }}</p>

        <!-- Shows which URL failed, which saves a support round trip. -->
        <code class="failed-path" *ngIf="attemptedUrl() as url">{{ url }}</code>

        <div class="not-found-actions">
          <a
            *ngIf="module().backRoute as backRoute; else historyBack"
            [routerLink]="backRoute"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">arrow_back</span>
            <span>{{ module().backLabel }}</span>
          </a>
          <ng-template #historyBack>
            <button type="button" (click)="goBack()" class="action-btn btn-gradient-purple">
              <span class="material-symbols-outlined">arrow_back</span>
              <span>{{ module().backLabel }}</span>
            </button>
          </ng-template>

          <a routerLink="/dashboard" class="action-btn btn-outline-purple">
            <span class="material-symbols-outlined">space_dashboard</span>
            <span>Go to Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        padding: 2rem 1rem 3rem;
      }

      .not-found-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.65rem;
        max-width: 560px;
        width: 100%;
      }

      /* ─── Illustration ─── */
      .illustration-stage {
        position: relative;
        width: 100%;
        max-width: 340px;
        margin-bottom: 0.5rem;
      }

      /* A soft halo behind the art, so every module keeps the same footprint
         whatever its subject happens to be. */
      .illustration-stage::before {
        content: '';
        position: absolute;
        inset: 8% 6% 12%;
        border-radius: 50%;
        background: radial-gradient(
          circle at 50% 45%,
          var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12)) 0%,
          transparent 70%
        );
        pointer-events: none;
      }

      .illustration {
        display: block;
        width: 100%;
        height: auto;
        animation: floatArt 6s ease-in-out infinite;
      }

      @keyframes floatArt {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .illustration { animation: none; }
      }

      /* ─── Copy ─── */
      .code-badge {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(2.75rem, 9vw, 3.75rem);
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.04em;
        background: linear-gradient(
          135deg,
          var(--primary, #7E22CE) 0%,
          var(--primary-hover, #9333EA) 55%,
          var(--secondary-hover, #A855F7) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: var(--primary, #7E22CE);
      }

      .not-found-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: clamp(1.1rem, 3.5vw, 1.4rem);
        font-weight: 900;
        letter-spacing: -0.02em;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .not-found-message {
        font-size: 0.85rem;
        line-height: 1.55;
        font-weight: 500;
        color: var(--text-muted, #6B7280);
        max-width: 420px;
        margin: 0;
      }

      .failed-path {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 8px;
        padding: 0.3rem 0.65rem;
        max-width: 100%;
        overflow-wrap: anywhere;
      }

      /* ─── Actions ─── */
      .not-found-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 0.85rem;
      }

      /* .action-btn / .btn-gradient-purple / .btn-outline-purple come from the
         global module design system; anchors just need the link reset. */
      .not-found-actions .action-btn {
        text-decoration: none;
      }

      @media (max-width: 480px) {
        .not-found-actions {
          flex-direction: column;
          width: 100%;
        }

        .not-found-actions .action-btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class PageNotFoundComponent {
  private router = inject(Router);
  private location = inject(Location);

  public readonly module = signal<PageNotFoundModule>(PAGE_NOT_FOUND_DEFAULT);
  public readonly attemptedUrl = signal<string>('');

  constructor() {
    this.resolve(this.router.url);

    // The router reuses this component between one bad URL and the next, so
    // the module has to be re-resolved on every navigation, not just on init.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => this.resolve(event.urlAfterRedirects));
  }

  private resolve(url: string): void {
    this.attemptedUrl.set((url || '').split(/[?#]/)[0]);
    this.module.set(resolvePageNotFoundModule(url));
  }

  /** A missing artwork file must not leave an empty frame on the page. */
  public onIllustrationMissing(): void {
    if (this.module().image !== PAGE_NOT_FOUND_DEFAULT.image) {
      this.module.set({ ...this.module(), image: PAGE_NOT_FOUND_DEFAULT.image });
    }
  }

  public goBack(): void {
    this.location.back();
  }
}

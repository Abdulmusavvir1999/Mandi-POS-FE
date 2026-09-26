import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpActivityService } from '../../../core/services/http-activity.service';

/**
 * One loading indicator for the whole application.
 *
 * It lights up for two things and needs no wiring from any page:
 *
 *  - **Any API call.** Every request is registered by httpActivityInterceptor
 *    and removed in a `finalize`, so the bar appears when work starts and goes
 *    away on success, API error, validation error, network failure and
 *    cancellation alike.
 *  - **Any navigation.** NavigationStart raises it; End, Cancel and Error all
 *    lower it, so a blocked guard or a failed lazy chunk cannot leave it up.
 *
 * It is a top bar rather than a blocking overlay on purpose. Several screens
 * poll in the background — the orders list refreshes every 20 seconds — and a
 * full-screen overlay would freeze the app on a timer the operator never asked
 * for. The bar shows the same information without taking the UI away.
 *
 * `SHOW_DELAY_MS` keeps a fast call from flashing the bar. `MAX_VISIBLE_MS` is
 * a backstop: even if something escapes both mechanisms above, the bar clears
 * itself rather than sticking.
 *
 * Per-page `<app-page-loader>` is unaffected — that reports a page fetching its
 * own data, which is a different question from "is anything happening".
 */
const SHOW_DELAY_MS = 120;
const MAX_VISIBLE_MS = 30000;

@Component({
  selector: 'app-global-loader',
  standalone: true,
  template: `
    <div
      class="global-loader"
      [class.is-visible]="visible()"
      role="status"
      aria-live="polite"
      [attr.aria-label]="visible() ? 'Loading' : null"
    >
      <div class="global-loader-bar"></div>
    </div>
  `,
  styles: [
    `
      .global-loader {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 160ms ease-out;
      }
      .global-loader.is-visible {
        opacity: 1;
      }
      .global-loader-bar {
        height: 100%;
        width: 100%;
        transform-origin: 0 50%;
        /* Follows the active theme rather than a hard-coded purple. */
        background: linear-gradient(
          90deg,
          transparent,
          var(--primary-hover, var(--primary, #7e22ce)),
          var(--primary, #7e22ce)
        );
        animation: global-loader-sweep 1.1s ease-in-out infinite;
      }
      @keyframes global-loader-sweep {
        0% {
          transform: scaleX(0);
          opacity: 1;
        }
        60% {
          transform: scaleX(1);
          opacity: 1;
        }
        100% {
          transform: scaleX(1);
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .global-loader-bar {
          animation-duration: 2.4s;
        }
      }
    `,
  ],
})
export class GlobalLoaderComponent implements OnDestroy {
  private readonly activity = inject(HttpActivityService);
  private readonly router = inject(Router);

  readonly visible = signal(false);

  private navigating = false;
  private showTimer: any = null;
  private maxTimer: any = null;
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.navigating = true;
        this.sync();
      } else if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      ) {
        this.navigating = false;
        this.sync();
      }
    });

    // Re-evaluated whenever a request starts or finishes.
    effect(() => {
      this.activity.version();
      this.sync();
    });
  }

  private sync(): void {
    const active = this.navigating || this.activity.count() > 0;

    if (active) {
      if (this.visible() || this.showTimer) return;
      this.showTimer = setTimeout(() => {
        this.showTimer = null;
        this.visible.set(true);
        this.maxTimer = setTimeout(() => this.hide(), MAX_VISIBLE_MS);
      }, SHOW_DELAY_MS);
      return;
    }

    this.hide();
  }

  private hide(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.maxTimer) {
      clearTimeout(this.maxTimer);
      this.maxTimer = null;
    }
    if (this.visible()) this.visible.set(false);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.hide();
  }
}

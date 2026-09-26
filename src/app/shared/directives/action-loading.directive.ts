import {
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  Renderer2,
  effect,
  inject,
} from '@angular/core';
import { HttpActivityService } from '../../core/services/http-activity.service';

/**
 * Gives every button a consistent in-flight state without any change to the
 * handlers behind them.
 *
 * On click it marks the button busy and blocks further clicks. It then watches
 * which HTTP requests start as a result: if none do within `DETECT_WINDOW_MS`
 * the click was a local action (open a modal, add a row, reset filters) and the
 * button is released immediately; if some do, the button stays busy until every
 * one of them settles.
 *
 * Release is driven by HttpActivityService, which removes a request in a
 * `finalize`, so success, API error, validation error, network failure and
 * cancellation all release the button. `MAX_BUSY_MS` is a final backstop so a
 * button can never be left stuck by something outside that path.
 *
 * Duplicate clicks are swallowed in the capture phase, which runs before the
 * template's own `(click)` binding on the same element, so the handler is never
 * entered twice. The busy look is applied with a class rather than the
 * `disabled` property, so it cannot fight a `[disabled]` binding a component
 * already has.
 *
 * Opt out with `data-no-loading` on the button.
 */
const DETECT_WINDOW_MS = 250;
/**
 * Deliberately longer than DETECT_WINDOW_MS. A local action — picking a
 * dropdown option, switching a tab, opening a modal — is released at the end
 * of the detect window, so with a shorter delay every one of those buttons
 * flashed a spinner for the difference. Waiting until after detection means
 * the spinner only ever appears once there is a real request to wait for.
 */
const SPINNER_DELAY_MS = 300;
const MAX_BUSY_MS = 20000;

@Directive({
  selector: 'button:not([data-no-loading])',
  standalone: true,
})
export class ActionLoadingDirective implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement as HTMLButtonElement;
  private readonly renderer = inject(Renderer2);
  private readonly zone = inject(NgZone);
  private readonly activity = inject(HttpActivityService);

  private busy = false;
  private watched: Set<number> | null = null;
  private detectTimer: any = null;
  private spinnerTimer: any = null;
  private maxTimer: any = null;

  private readonly onCaptureClick = (event: Event) => {
    if (this.busy) {
      // Second click while the first is still running.
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (this.host.disabled) return;
    this.start();
  };

  constructor() {
    // Capture phase: fires before the bubble listener Angular installs for
    // (click) on this same element, which is what makes blocking possible.
    this.zone.runOutsideAngular(() => {
      this.host.addEventListener('click', this.onCaptureClick, true);
    });

    // Re-checked whenever a request begins or ends.
    effect(() => {
      this.activity.version();
      if (!this.busy || !this.watched) return;
      if (!this.activity.anyPending(this.watched)) this.stop();
    });
  }

  private start(): void {
    this.busy = true;
    this.watched = null;
    const before = this.activity.snapshot();

    // Only show the spinner if the work outlasts a moment, so a local action
    // does not make every button flicker.
    this.spinnerTimer = setTimeout(() => {
      if (this.busy) this.renderer.addClass(this.host, 'is-action-busy');
    }, SPINNER_DELAY_MS);

    this.detectTimer = setTimeout(() => {
      const started = this.activity.startedSince(before);
      if (started.size === 0) {
        // Nothing went to the server — release it.
        this.stop();
        return;
      }
      this.watched = started;
      if (!this.activity.anyPending(started)) this.stop();
    }, DETECT_WINDOW_MS);

    this.maxTimer = setTimeout(() => {
      if (this.busy) this.stop();
    }, MAX_BUSY_MS);
  }

  private stop(): void {
    this.busy = false;
    this.watched = null;
    this.clearTimers();
    this.renderer.removeClass(this.host, 'is-action-busy');
  }

  private clearTimers(): void {
    for (const t of [this.detectTimer, this.spinnerTimer, this.maxTimer]) {
      if (t) clearTimeout(t);
    }
    this.detectTimer = this.spinnerTimer = this.maxTimer = null;
  }

  ngOnDestroy(): void {
    this.host.removeEventListener('click', this.onCaptureClick, true);
    this.clearTimers();
  }
}

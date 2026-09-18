import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

/**
 * Horizontal scrolling for a rail, by every input a till actually has.
 *
 * Touch already scrolls an `overflow-x: auto` element natively, with momentum,
 * so touch is left alone — intercepting it would replace something good with
 * something worse. A mouse has no such gesture, so it gets click-and-drag. The
 * arrow buttons a caller renders drive `step()`.
 *
 * Exported as `dragScroll` so a template can read `canScrollLeft` /
 * `canScrollRight` to disable its arrows and hide them when nothing overflows:
 *
 *   <button [disabled]="!rail.canScrollLeft" (click)="rail.step(-280)">…</button>
 *   <div appDragScroll #rail="dragScroll"> … </div>
 */
@Directive({
  selector: '[appDragScroll]',
  standalone: true,
  exportAs: 'dragScroll',
})
export class DragScrollDirective implements OnInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  /** True when the content is wider than the rail. */
  public canScroll = false;
  public canScrollLeft = false;
  public canScrollRight = false;

  @HostBinding('class.is-dragging') public isDragging = false;

  private startX = 0;
  private startScroll = 0;
  private distance = 0;
  private pointerId: number | null = null;
  private suppressClick = false;
  private observer?: ResizeObserver;

  /** Movement under this is a click, not a drag. */
  private static readonly THRESHOLD_PX = 5;

  ngOnInit(): void {
    window.addEventListener('resize', this.measure);

    // Content can change without the element resizing (a tab added, products
    // filtered), so watch the element itself rather than only the window.
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this.host);
      for (const child of Array.from(this.host.children)) this.observer.observe(child);
    }

    // Capture phase, so a drag that ends on a button is swallowed before that
    // button's own handler runs. Doing it here keeps every caller free of
    // drag-versus-click bookkeeping.
    this.host.addEventListener('click', this.onCaptureClick, true);

    // The first measure has to wait for layout.
    setTimeout(() => this.measure());
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.measure);
    this.host.removeEventListener('click', this.onCaptureClick, true);
    this.observer?.disconnect();
  }

  private readonly measure = (): void => {
    // Sub-pixel layout means scrollLeft rarely hits the exact maximum, so the
    // ends are treated as reached within a pixel or two.
    const EPS = 2;
    const max = this.host.scrollWidth - this.host.clientWidth;
    this.canScroll = max > EPS;
    this.canScrollLeft = this.host.scrollLeft > EPS;
    this.canScrollRight = this.host.scrollLeft < max - EPS;
  };

  private readonly onCaptureClick = (event: MouseEvent): void => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    event.stopPropagation();
    event.preventDefault();
  };

  /** Steps the rail; CSS scroll-behavior handles the easing. */
  public step(amount: number): void {
    this.host.scrollBy({ left: amount, behavior: 'smooth' });
    this.measure();
  }

  @HostListener('scroll')
  onScroll(): void {
    this.measure();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    // Touch and pen keep their native scrolling; left mouse button only.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    this.isDragging = true;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startScroll = this.host.scrollLeft;
    this.distance = 0;

    // The pointer is deliberately not captured here. A capture held at
    // pointerup retargets the click that follows to the capturing element, so
    // a button inside the rail would never receive its own click and its
    // handler would never run. Capture is taken in onPointerMove instead, once
    // the movement is past the threshold and the gesture is really a drag.
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;

    const dx = event.clientX - this.startX;
    this.distance = Math.max(this.distance, Math.abs(dx));
    this.host.scrollLeft = this.startScroll - dx;

    // Past the threshold the gesture is a drag, not a click, so the rail takes
    // the pointer and the drag survives the cursor leaving the rail.
    if (
      this.pointerId !== null &&
      this.distance > DragScrollDirective.THRESHOLD_PX &&
      !this.host.hasPointerCapture(this.pointerId)
    ) {
      this.host.setPointerCapture(this.pointerId);
    }

    // Stops the browser starting a native text or image drag mid-swipe.
    event.preventDefault();
  }

  // On the window, because a press is only captured once it crosses the drag
  // threshold — a press that ends off the rail before then would otherwise
  // leave the rail stuck in its dragging state.
  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onPointerEnd(event: PointerEvent): void {
    if (!this.isDragging || event.pointerId !== this.pointerId) return;
    this.isDragging = false;
    this.pointerId = null;

    if (this.host.hasPointerCapture(event.pointerId)) {
      this.host.releasePointerCapture(event.pointerId);
    }

    if (this.distance > DragScrollDirective.THRESHOLD_PX) {
      this.suppressClick = true;
      // Cleared on the next macrotask, which runs after the click this drag
      // produced — so a drag ending off the rail, where no click ever reaches
      // the guard, cannot swallow the user's next real click.
      setTimeout(() => (this.suppressClick = false));
    }

    this.measure();
  }
}

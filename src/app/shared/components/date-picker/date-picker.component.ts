import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
  HostBinding,
  OnInit,
  OnDestroy,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { openFloatingPanel, releaseFloatingPanel } from '../floating-panel-registry';

interface DayCell {
  date: Date;
  label: number;
  key: string;
  outside: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

/**
 * Themed replacement for <input type="date">.
 *
 * The native control renders the operating system's own calendar popup, which
 * cannot be styled at all — so the panel here is drawn from scratch. The value
 * contract is unchanged: it reads and writes the same 'YYYY-MM-DD' strings the
 * native input used, so callers and the API layer need no changes.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="date-picker-container"
      [class.is-open]="isOpen"
      [class.w-full]="minWidth === '100%'"
      [style.min-width]="minWidth === '100%' ? '100%' : (minWidth || '165px')"
      [style.width]="minWidth === '100%' ? '100%' : 'auto'"
    >
      <!-- Trigger -->
      <button
        #triggerEl
        type="button"
        class="date-trigger"
        [class.has-value]="!!selectedDate"
        [disabled]="disabled"
        [attr.aria-expanded]="isOpen"
        [attr.aria-label]="label || placeholder"
        [title]="label || placeholder"
        (click)="toggleOpen($event)"
      >
        <span class="material-symbols-outlined trigger-icon">calendar_today</span>

        <span class="trigger-text" [class.is-placeholder]="!selectedDate">
          {{ selectedDate ? displayValue : placeholder }}
        </span>

        <span
          *ngIf="selectedDate && clearable && !disabled"
          class="material-symbols-outlined trigger-clear"
          role="button"
          title="Clear date"
          (click)="clear($event)"
        >
          close
        </span>
        <span *ngIf="!selectedDate || !clearable || disabled" class="material-symbols-outlined trigger-chevron" [class.rotated]="isOpen">
          expand_more
        </span>
      </button>

      <!-- Calendar panel -->
      <div
        *ngIf="isOpen"
        #panelEl
        class="calendar-panel"
        [class.is-positioned]="isPositioned"
        [class.is-flipped]="isFlipped"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="cal-header">
          <button type="button" class="cal-nav-btn" title="Previous" (click)="step(-1)">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <button type="button" class="cal-title-btn" (click)="cycleView()">
            <span>{{ headerLabel }}</span>
            <span class="material-symbols-outlined cal-title-chevron">expand_more</span>
          </button>

          <button type="button" class="cal-nav-btn" title="Next" (click)="step(1)">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <!-- Day grid -->
        <ng-container *ngIf="view === 'days'">
          <div class="cal-weekdays">
            <span *ngFor="let d of weekdays">{{ d }}</span>
          </div>

          <div class="cal-grid">
            <button
              *ngFor="let cell of days; trackBy: trackByKey"
              type="button"
              class="cal-day"
              [class.is-outside]="cell.outside"
              [class.is-today]="cell.today"
              [class.is-selected]="cell.selected"
              [disabled]="cell.disabled"
              (click)="pick(cell)"
            >
              {{ cell.label }}
            </button>
          </div>
        </ng-container>

        <!-- Month grid -->
        <div class="cal-grid-3" *ngIf="view === 'months'">
          <button
            *ngFor="let m of monthNames; let i = index"
            type="button"
            class="cal-chip"
            [class.is-selected]="isSelectedMonth(i)"
            [class.is-today]="isCurrentMonth(i)"
            (click)="pickMonth(i)"
          >
            {{ m }}
          </button>
        </div>

        <!-- Year grid -->
        <div class="cal-grid-3" *ngIf="view === 'years'">
          <button
            *ngFor="let y of yearRange"
            type="button"
            class="cal-chip"
            [class.is-selected]="isSelectedYear(y)"
            [class.is-today]="y === today.getFullYear()"
            (click)="pickYear(y)"
          >
            {{ y }}
          </button>
        </div>

        <!-- Footer -->
        <div class="cal-footer">
          <button type="button" class="cal-foot-btn" (click)="clear($event)">Clear</button>
          <button type="button" class="cal-foot-btn is-primary" (click)="selectToday()">Today</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        vertical-align: middle;
      }

      :host(.w-full),
      :host-context(.form-group),
      :host-context(.form-group-box),
      :host-context(.form-grid),
      :host-context(.form-control-wrapper),
      :host-context(.modal-form-group) {
        display: block;
        width: 100%;
      }

      .date-picker-container {
        position: relative;
        display: inline-block;
        width: 100%;
        font-family: 'Plus Jakarta Sans', sans-serif;
        user-select: none;
      }

      .date-picker-container.w-full {
        display: block;
        width: 100%;
      }

      /* ── Trigger ───────────────────────────────────────────────── */
      .date-trigger {
        width: 100%;
        height: 42px;
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0 0.75rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-radius: var(--radius-md, 12px);
        color: var(--text-main, #2e1065);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        box-sizing: border-box;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 1px 3px rgba(var(--text-main-rgb, 46, 16, 101), 0.04);
      }

      .date-trigger:hover:not(:disabled) {
        border-color: var(--primary, #7e22ce);
        box-shadow: 0 2px 8px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
      }

      .date-trigger:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .date-picker-container.is-open .date-trigger {
        border-color: var(--primary, #7e22ce);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15)),
          0 4px 12px rgba(var(--text-main-rgb, 46, 16, 101), 0.06);
      }

      .trigger-icon {
        font-size: 18px;
        color: var(--primary, #7e22ce);
        flex-shrink: 0;
      }

      .trigger-text {
        flex: 1 1 auto;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .trigger-text.is-placeholder {
        color: var(--text-dim, #94a3b8);
        font-weight: 500;
      }

      .trigger-chevron {
        font-size: 19px;
        color: var(--text-muted, #6b7280);
        flex-shrink: 0;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .trigger-chevron.rotated {
        transform: rotate(180deg);
        color: var(--primary, #7e22ce);
      }

      .trigger-clear {
        font-size: 16px;
        color: var(--text-dim, #94a3b8);
        flex-shrink: 0;
        border-radius: 9999px;
        padding: 1px;
        transition: all 0.15s ease;
      }

      .trigger-clear:hover {
        color: var(--danger, #dc2626);
        background: var(--danger-light, rgba(var(--danger-rgb, 220, 38, 38), 0.12));
      }

      /* ── Panel ─────────────────────────────────────────────────── */
      /* Fixed, not absolute — matching app-custom-dropdown: an absolute panel
         is part of its scroll container's content, so opening it inside a
         scrollable toolbar or modal both grows that scrollbar and clips the
         calendar. positionPanel() measures and writes the exact top/left. */
      .calendar-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 292px;
        padding: 0.6rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-radius: 16px;
        z-index: 2000;
        box-shadow: 0 16px 36px -4px rgba(var(--text-main-rgb, 46, 16, 101), 0.16),
          0 6px 12px -2px rgba(var(--text-main-rgb, 46, 16, 101), 0.08);
        visibility: hidden;
      }

      .calendar-panel.is-positioned {
        visibility: visible;
        animation: calSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .calendar-panel.is-flipped.is-positioned {
        animation: calSlideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes calSlideIn {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes calSlideInUp {
        from {
          opacity: 0;
          transform: translateY(6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* ── Header ────────────────────────────────────────────────── */
      .cal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.35rem;
        padding: 0.1rem 0.15rem 0.5rem;
        margin-bottom: 0.4rem;
        border-bottom: 1px solid var(--card-border, #f1e8fb);
      }

      .cal-nav-btn {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: var(--text-muted, #6b7280);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .cal-nav-btn:hover {
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
        color: var(--primary, #7e22ce);
      }

      .cal-nav-btn .material-symbols-outlined {
        font-size: 20px;
      }

      .cal-title-btn {
        display: flex;
        align-items: center;
        gap: 0.15rem;
        padding: 0.3rem 0.55rem;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: var(--text-main, #2e1065);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 800;
        letter-spacing: -0.01em;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .cal-title-btn:hover {
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
        color: var(--primary, #7e22ce);
      }

      .cal-title-chevron {
        font-size: 17px;
      }

      /* ── Grids ─────────────────────────────────────────────────── */
      .cal-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 0.2rem;
      }

      .cal-weekdays span {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-dim, #94a3b8);
      }

      .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }

      .cal-day {
        position: relative;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--text-main, #2e1065);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .cal-day:hover:not(:disabled):not(.is-selected) {
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
        color: var(--primary, #7e22ce);
      }

      .cal-day.is-outside {
        color: var(--text-dim, #cbd5e1);
        font-weight: 500;
      }

      .cal-day.is-today:not(.is-selected) {
        color: var(--primary, #7e22ce);
        font-weight: 800;
        box-shadow: inset 0 0 0 1.5px var(--primary, #7e22ce);
      }

      .cal-day.is-selected {
        background: linear-gradient(
          135deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        color: #ffffff;
        font-weight: 800;
        box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      .cal-day:disabled {
        color: var(--text-dim, #cbd5e1);
        opacity: 0.45;
        cursor: not-allowed;
      }

      .cal-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 0.15rem 0;
      }

      .cal-chip {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--text-main, #2e1065);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .cal-chip:hover:not(.is-selected) {
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
        color: var(--primary, #7e22ce);
      }

      .cal-chip.is-today:not(.is-selected) {
        box-shadow: inset 0 0 0 1.5px var(--primary, #7e22ce);
        color: var(--primary, #7e22ce);
        font-weight: 800;
      }

      .cal-chip.is-selected {
        background: linear-gradient(
          135deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        color: #ffffff;
        font-weight: 800;
        box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      /* ── Footer ────────────────────────────────────────────────── */
      .cal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--card-border, #f1e8fb);
      }

      .cal-foot-btn {
        flex: 1 1 0;
        height: 32px;
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-radius: 9px;
        background: var(--card-bg, #ffffff);
        color: var(--text-muted, #6b7280);
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .cal-foot-btn:hover {
        border-color: var(--primary, #7e22ce);
        color: var(--primary, #7e22ce);
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.08));
      }

      .cal-foot-btn.is-primary {
        background: linear-gradient(
          135deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        border-color: var(--primary, #7e22ce);
        color: #ffffff;
      }

      .cal-foot-btn.is-primary:hover {
        box-shadow: 0 4px 14px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
        color: #ffffff;
      }

      /* ─── Touch sizing ───────────────────────────────────────────────
         Section 109 of styles.css raises every button to a 44px minimum
         on a touch-capable device, and a day cell is a button. Seven of
         them plus the gaps need 332px of content box, which the 292px
         panel above cannot give — the grid would spill out of its own
         card. So the panel is widened to match the cells rather than the
         cells being exempted: a 37px day target is the single worst hit
         area in the app, and it is the one people tap most when filtering
         a report or backdating an entry.

         positionPanel() measures offsetWidth at open time, so the new
         width is picked up with no change to the positioning logic. */
      @media (any-pointer: coarse) {
        .calendar-panel {
          width: 344px;
        }

        .cal-day {
          height: 44px;
          font-size: 0.9rem;
        }

        /* The weekday header has to keep step with the widened grid or
           the letters drift out of line with the columns they label. */
        .cal-weekdays {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class DatePickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /** Text shown when no date is chosen. */
  @Input() placeholder = 'Select date';
  /** Accessible name / tooltip for the trigger. */
  @Input() label = '';
  @Input() minWidth = '165px';
  @Input() disabled = false;
  /** Shows the inline ✕ on the trigger once a date is picked. */
  @Input() clearable = true;
  /** Earliest selectable date, as 'YYYY-MM-DD'. */
  @Input() min = '';
  /** Latest selectable date, as 'YYYY-MM-DD'. */
  @Input() max = '';

  @Output() valueChange = new EventEmitter<string>();

  @HostBinding('class.w-full')
  get isFullWidth(): boolean {
    return this.minWidth === '100%';
  }

  public isOpen = false;
  public isPositioned = false;
  public isFlipped = false;

  public view: 'days' | 'months' | 'years' = 'days';
  public selectedDate: Date | null = null;
  public viewDate: Date = this.startOfDay(new Date());
  public readonly today: Date = this.startOfDay(new Date());

  public readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  public readonly monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  @ViewChild('triggerEl') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panelEl') private panelRef?: ElementRef<HTMLElement>;

  private innerValue = '';
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  private readonly reposition = (): void => {
    if (this.isOpen) this.positionPanel();
  };

  ngOnInit(): void {
    window.addEventListener('resize', this.reposition);
    document.addEventListener('scroll', this.reposition, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('scroll', this.reposition, true);
    releaseFloatingPanel(this);
  }

  // ── Display ───────────────────────────────────────────────────────

  get displayValue(): string {
    if (!this.selectedDate) return '';
    const d = this.selectedDate;
    return `${String(d.getDate()).padStart(2, '0')} ${this.monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }

  get headerLabel(): string {
    if (this.view === 'years') {
      const start = this.yearRangeStart;
      return `${start} – ${start + 11}`;
    }
    if (this.view === 'months') return `${this.viewDate.getFullYear()}`;
    return `${this.fullMonth(this.viewDate.getMonth())} ${this.viewDate.getFullYear()}`;
  }

  get days(): DayCell[] {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    // Back up to the Sunday on or before the 1st, then lay out six full weeks
    // so the grid never changes height as the user pages through months.
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push({
        date,
        label: date.getDate(),
        key: this.toIso(date),
        outside: date.getMonth() !== month,
        today: this.sameDay(date, this.today),
        selected: !!this.selectedDate && this.sameDay(date, this.selectedDate),
        disabled: this.isOutOfRange(date),
      });
    }
    return cells;
  }

  get yearRangeStart(): number {
    const y = this.viewDate.getFullYear();
    return y - ((y % 12) + 12) % 12;
  }

  get yearRange(): number[] {
    const start = this.yearRangeStart;
    return Array.from({ length: 12 }, (_, i) => start + i);
  }

  isSelectedMonth(index: number): boolean {
    return (
      !!this.selectedDate &&
      this.selectedDate.getFullYear() === this.viewDate.getFullYear() &&
      this.selectedDate.getMonth() === index
    );
  }

  isCurrentMonth(index: number): boolean {
    return this.today.getFullYear() === this.viewDate.getFullYear() && this.today.getMonth() === index;
  }

  isSelectedYear(year: number): boolean {
    return !!this.selectedDate && this.selectedDate.getFullYear() === year;
  }

  trackByKey(_: number, cell: DayCell): string {
    return cell.key;
  }

  // ── Interaction ───────────────────────────────────────────────────

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (this.isOpen) {
      this.close();
      this.onTouched();
      return;
    }
    openFloatingPanel(this);
    this.isOpen = true;
    this.view = 'days';
    this.viewDate = this.startOfDay(this.selectedDate ? new Date(this.selectedDate) : new Date());
    this.isPositioned = false;
    // The panel has to exist in the DOM before it can be measured.
    setTimeout(() => this.positionPanel());
  }

  cycleView(): void {
    this.view = this.view === 'days' ? 'months' : this.view === 'months' ? 'years' : 'days';
    setTimeout(() => this.positionPanel());
  }

  step(direction: number): void {
    const d = this.viewDate;
    if (this.view === 'days') {
      this.viewDate = new Date(d.getFullYear(), d.getMonth() + direction, 1);
    } else if (this.view === 'months') {
      this.viewDate = new Date(d.getFullYear() + direction, d.getMonth(), 1);
    } else {
      this.viewDate = new Date(d.getFullYear() + direction * 12, d.getMonth(), 1);
    }
  }

  pick(cell: DayCell): void {
    if (cell.disabled) return;
    this.commit(cell.date);
  }

  pickMonth(index: number): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), index, 1);
    this.view = 'days';
    setTimeout(() => this.positionPanel());
  }

  pickYear(year: number): void {
    this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
    this.view = 'months';
    setTimeout(() => this.positionPanel());
  }

  selectToday(): void {
    if (this.isOutOfRange(this.today)) return;
    this.commit(new Date(this.today));
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDate = null;
    this.innerValue = '';
    this.onChange('');
    this.onTouched();
    this.valueChange.emit('');
    this.close();
  }

  private commit(date: Date): void {
    this.selectedDate = this.startOfDay(date);
    this.innerValue = this.toIso(this.selectedDate);
    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
    this.close();
  }

  /** Public so the shared registry can dismiss this panel when another opens. */
  public close(): void {
    this.isOpen = false;
    this.isPositioned = false;
    this.view = 'days';
    releaseFloatingPanel(this);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
      this.onTouched();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.close();
  }

  // ── Positioning ───────────────────────────────────────────────────

  /**
   * Anchors the fixed panel under (or over) the trigger.
   *
   * A filtered or transformed ancestor becomes the containing block for
   * position: fixed — a modal backdrop's backdrop-filter does exactly that — so
   * the panel's origin is not reliably the viewport. Rather than assume, the
   * panel is parked at 0,0 and measured: wherever that lands IS the origin.
   */
  private positionPanel(): void {
    const trigger = this.triggerRef?.nativeElement;
    const panel = this.panelRef?.nativeElement;
    if (!trigger || !panel) return;

    const GAP = 6;
    const MARGIN = 12;

    panel.style.top = '0px';
    panel.style.left = '0px';
    const origin = panel.getBoundingClientRect();
    const height = panel.offsetHeight;
    const width = panel.offsetWidth;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;

    this.isFlipped = spaceBelow < height && spaceAbove > spaceBelow;

    let top = this.isFlipped ? rect.top - GAP - height : rect.bottom + GAP;
    if (top < MARGIN) top = MARGIN;
    if (top + height + MARGIN > window.innerHeight) {
      top = Math.max(MARGIN, window.innerHeight - height - MARGIN);
    }

    let left = rect.left;
    const overflowRight = left + width + MARGIN - window.innerWidth;
    if (overflowRight > 0) left -= overflowRight;
    if (left < MARGIN) left = MARGIN;

    panel.style.top = `${top - origin.top}px`;
    panel.style.left = `${left - origin.left}px`;

    this.isPositioned = true;
  }

  // ── Date helpers ──────────────────────────────────────────────────

  /** 'YYYY-MM-DD' built from local parts — never toISOString(), which shifts to UTC. */
  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Parses 'YYYY-MM-DD' as a local date; new Date(str) would parse it as UTC. */
  private fromIso(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
    if (!match) return null;
    const date = new Date(+match[1], +match[2] - 1, +match[3]);
    return isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private isOutOfRange(date: Date): boolean {
    const minDate = this.fromIso(this.min);
    const maxDate = this.fromIso(this.max);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  private fullMonth(index: number): string {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ][index];
  }

  // ── ControlValueAccessor ──────────────────────────────────────────

  writeValue(val: string): void {
    this.innerValue = val || '';
    this.selectedDate = this.fromIso(this.innerValue);
    if (this.selectedDate) this.viewDate = new Date(this.selectedDate);
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

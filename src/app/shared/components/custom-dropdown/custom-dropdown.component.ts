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
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { openFloatingPanel, releaseFloatingPanel } from '../floating-panel-registry';

export interface DropdownOption {
  value: any;
  label: string;
  icon?: string;
  badge?: string;
  description?: string;
  color?: string;
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="custom-dropdown-container"
      [class.is-open]="isOpen"
      [class.w-full]="minWidth === '100%'"
      [style.min-width]="minWidth === '100%' ? '100%' : (minWidth || '160px')"
      [style.width]="minWidth === '100%' ? '100%' : 'auto'"
    >
      <!-- Dropdown Trigger Button -->
      <button
        #triggerEl
        type="button"
        class="dropdown-trigger"
        (click)="toggleOpen($event)"
        [attr.aria-expanded]="isOpen"
        [disabled]="disabled"
      >
        <div class="trigger-left">
          <span *ngIf="selectedOption?.icon" class="material-symbols-outlined trigger-icon">
            {{ selectedOption?.icon }}
          </span>
          <span class="trigger-label">
            {{ selectedOption?.label || placeholder }}
          </span>
        </div>

        <div class="trigger-right">
          <span *ngIf="selectedOption?.badge" class="trigger-badge">
            {{ selectedOption?.badge }}
          </span>
          <span class="material-symbols-outlined chevron-icon" [class.rotated]="isOpen">
            expand_more
          </span>
        </div>
      </button>

      <!-- Dropdown Menu Floating Panel -->
      <div
        *ngIf="isOpen"
        #panelEl
        class="dropdown-menu-panel shadow-elevation"
        [class.is-positioned]="isPositioned"
        [class.is-flipped]="isFlipped"
      >
        <!-- Optional Search Bar inside dropdown for quick filtering -->
        <div *ngIf="searchable || options.length > 7" class="dropdown-search-wrapper" (click)="$event.stopPropagation()">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            title="Search options"
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onOptionSearchChange()"
            (click)="$event.stopPropagation()"
            placeholder="Search options..."
            class="dropdown-search-input"
            autofocus
          />
          <button
            *ngIf="searchQuery"
            type="button"
            class="search-clear-btn"
            (click)="searchQuery = ''; onOptionSearchChange(); $event.stopPropagation()"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Options List -->
        <div class="options-list-scroll">
          <button
            *ngFor="let opt of filteredOptions"
            type="button"
            class="option-item"
            [class.is-selected]="opt.value === innerValue"
            (click)="selectOption(opt, $event)"
          >
            <div class="option-left">
              <span *ngIf="opt.icon" class="material-symbols-outlined option-icon">
                {{ opt.icon }}
              </span>
              <div class="option-text-group">
                <span class="option-label">{{ opt.label }}</span>
                <span *ngIf="opt.description" class="option-desc">{{ opt.description }}</span>
              </div>
            </div>

            <div class="option-right">
              <span *ngIf="opt.badge" class="option-badge">{{ opt.badge }}</span>
              <span *ngIf="opt.value === innerValue" class="material-symbols-outlined check-icon">
                check
              </span>
            </div>
          </button>

          <!-- Empty State if no matching search -->
          <div *ngIf="filteredOptions.length === 0" class="empty-options">
            <span class="material-symbols-outlined empty-icon">filter_alt_off</span>
            <span>No options found</span>
          </div>
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

      .custom-dropdown-container {
        position: relative;
        display: inline-block;
        width: 100%;
        font-family: 'Plus Jakarta Sans', sans-serif;
        user-select: none;
      }

      .custom-dropdown-container.w-full {
        display: block;
        width: 100%;
      }

      /* Trigger Button */
      .dropdown-trigger {
        width: 100%;
        height: 42px;
        min-height: 42px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.65rem;
        padding: 0 0.875rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: var(--radius-md, 12px);
        color: var(--text-main, #2E1065);
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        box-sizing: border-box;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 1px 3px rgba(var(--text-main-rgb, 46, 16, 101), 0.04);
      }

      .dropdown-trigger:hover:not(:disabled) {
        border-color: var(--primary, #7E22CE);
        background: var(--card-bg, #ffffff);
        box-shadow: 0 2px 8px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
      }

      .custom-dropdown-container.is-open .dropdown-trigger {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15)), 0 4px 12px rgba(var(--text-main-rgb, 46, 16, 101), 0.06);
      }

      .trigger-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .trigger-icon {
        font-size: 18px;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .trigger-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .trigger-right {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-shrink: 0;
      }

      .trigger-badge {
        font-size: 0.6875rem;
        font-weight: 700;
        padding: 0.15rem 0.45rem;
        border-radius: 9999px;
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
      }

      .chevron-icon {
        font-size: 19px;
        color: var(--text-muted, #6B7280);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chevron-icon.rotated {
        transform: rotate(180deg);
        color: var(--primary, #7E22CE);
      }

      /* Floating Dropdown Panel */
      /* Fixed, not absolute. An absolutely positioned panel is part of its
         scroll container's content, so opening it inside a modal that has
         overflow-y: auto both grew the modal's scrollbar and clipped the list
         at the modal's edge. Fixed leaves that box entirely; the exact top/left
         are measured and written by positionPanel(). */
      .dropdown-menu-panel {
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 14px;
        padding: 0.4rem;
        z-index: 2000;
        box-shadow: 0 16px 36px -4px rgba(var(--text-main-rgb, 46, 16, 101), 0.16), 0 6px 12px -2px rgba(var(--text-main-rgb, 46, 16, 101), 0.08);
        /* Hidden for the one frame between being rendered and being measured,
           so it never flashes at the top-left corner. */
        visibility: hidden;
      }

      .dropdown-menu-panel.is-positioned {
        visibility: visible;
        animation: dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .dropdown-menu-panel.is-flipped.is-positioned {
        animation: dropdownSlideInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes dropdownSlideInUp {
        from {
          opacity: 0;
          transform: translateY(6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Search Inside Dropdown */
      .dropdown-search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        padding: 0.35rem 0.5rem;
        margin-bottom: 0.35rem;
        border-bottom: 1px solid var(--card-border, #E2E8F0);
      }

      .dropdown-search-wrapper .search-icon {
        position: absolute;
        left: 0.85rem;
        font-size: 16px;
        color: var(--text-dim, #94A3B8);
        pointer-events: none;
      }

      .dropdown-search-input {
        width: 100%;
        padding: 0.4rem 1.8rem 0.4rem 2rem;
        background: var(--bg-app, #F8FAFC);
        border: 1px solid var(--card-border, #E2E8F0);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.775rem;
        color: var(--text-main, #1E293B);
        outline: none;
        transition: all 0.15s ease;
      }

      .dropdown-search-input:focus {
        border-color: var(--primary, #7E22CE);
        background: var(--card-bg, #ffffff);
      }

      .dropdown-search-wrapper .search-clear-btn {
        position: absolute;
        right: 0.85rem;
        background: none;
        border: none;
        color: var(--text-dim, #94A3B8);
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
      }

      .dropdown-search-wrapper .search-clear-btn .material-symbols-outlined {
        font-size: 14px;
      }

      /* Options Scroll Area */
      .options-list-scroll {
        max-height: 280px;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        /* Reaching the end of this list must not start scrolling the modal
           underneath it. */
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .options-list-scroll::-webkit-scrollbar {
        width: 5px;
      }

      .options-list-scroll::-webkit-scrollbar-thumb {
        background: var(--card-border, #CBD5E1);
        border-radius: 9999px;
      }

      /* Option Item */
      .option-item {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.55rem 0.75rem;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: var(--text-main, #1E293B);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        outline: none;
      }

      .option-item:hover {
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
        transform: translateX(2px);
      }

      .option-item.is-selected {
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
        font-weight: 700;
      }

      .option-left {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        overflow: hidden;
      }

      .option-icon {
        font-size: 18px;
        color: var(--text-muted, #64748B);
        transition: color 0.15s;
        flex-shrink: 0;
      }

      .option-item:hover .option-icon,
      .option-item.is-selected .option-icon {
        color: var(--primary, #7E22CE);
      }

      .option-text-group {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .option-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .option-desc {
        font-size: 0.6875rem;
        color: var(--text-muted, #64748B);
      }

      .option-right {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-shrink: 0;
      }

      .option-badge {
        font-size: 0.675rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 9999px;
        background: var(--bg-app, #F1F5F9);
        color: var(--text-muted, #64748B);
      }

      .check-icon {
        font-size: 17px;
        font-weight: 800;
        color: var(--primary, #7E22CE);
      }

      /* Empty State */
      .empty-options {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 1.25rem 0.75rem;
        color: var(--text-dim, #94A3B8);
        font-size: 0.75rem;
        font-weight: 500;
      }

      .empty-icon {
        font-size: 24px;
      }
    `,
  ],
})
export class CustomDropdownComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder = 'Select an option';
  @Input() minWidth = '160px';
  @Input() searchable = false;
  @Input() disabled = false;

  @HostBinding('class.w-full')
  get isFullWidth(): boolean {
    return this.minWidth === '100%';
  }

  @Output() valueChange = new EventEmitter<any>();

  public isOpen = false;
  public searchQuery = '';
  public innerValue: any = null;

  /** False for the frame between the panel rendering and being measured. */
  public isPositioned = false;
  /** True when the panel had to open upwards for lack of room below. */
  public isFlipped = false;

  @ViewChild('triggerEl') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('panelEl') private panelRef?: ElementRef<HTMLElement>;

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  private readonly reposition = (): void => {
    if (this.isOpen) this.positionPanel();
  };

  ngOnInit(): void {
    window.addEventListener('resize', this.reposition);
    // Capture phase: a scroll inside the modal body does not bubble to window,
    // so this is the only way to follow the trigger when the modal scrolls.
    document.addEventListener('scroll', this.reposition, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('scroll', this.reposition, true);
    releaseFloatingPanel(this);
  }

  /** Closes the panel and forgets any in-panel option search. */
  public close(): void {
    this.isOpen = false;
    this.isPositioned = false;
    this.searchQuery = '';
    releaseFloatingPanel(this);
  }

  /**
   * Anchors the fixed panel under (or over) the trigger.
   *
   * A filtered or transformed ancestor becomes the containing block for
   * position: fixed — the modal backdrop's backdrop-filter does exactly that —
   * so the panel's origin is not reliably the viewport. Rather than assume, the
   * panel is parked at 0,0 and measured: wherever that lands IS the origin, and
   * everything else is expressed relative to it. Correct in both cases.
   */
  private positionPanel(): void {
    const trigger = this.triggerRef?.nativeElement;
    const panel = this.panelRef?.nativeElement;
    if (!trigger || !panel) return;

    const GAP = 6;
    const MARGIN = 12;
    const MIN_PANEL = 180;

    panel.style.top = '0px';
    panel.style.left = '0px';
    panel.style.maxHeight = '';
    const origin = panel.getBoundingClientRect();
    const naturalHeight = panel.offsetHeight;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;

    // Only flip when below genuinely cannot hold a usable panel and above is roomier.
    this.isFlipped = spaceBelow < Math.min(naturalHeight, MIN_PANEL) && spaceAbove > spaceBelow;

    const available = Math.max(MIN_PANEL, this.isFlipped ? spaceAbove : spaceBelow);
    const height = Math.min(naturalHeight, available);
    const top = this.isFlipped ? rect.top - GAP - height : rect.bottom + GAP;

    // Keep the panel inside the viewport horizontally.
    let left = rect.left;
    const overflowRight = left + rect.width + MARGIN - window.innerWidth;
    if (overflowRight > 0) left -= overflowRight;
    if (left < MARGIN) left = MARGIN;

    panel.style.top = `${top - origin.top}px`;
    panel.style.left = `${left - origin.left}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.maxHeight = `${available}px`;

    this.isPositioned = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.close();
  }

  /** The option list just changed length, so the panel needs re-measuring. */
  onOptionSearchChange(): void {
    setTimeout(() => this.positionPanel());
  }

  get selectedOption(): DropdownOption | undefined {
    return this.options.find((opt) => opt.value === this.innerValue);
  }

  get filteredOptions(): DropdownOption[] {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    const q = this.searchQuery.toLowerCase();
    return this.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (this.isOpen) {
      this.close();
      return;
    }
    openFloatingPanel(this);
    this.isOpen = true;
    this.searchQuery = '';
    this.isPositioned = false;
    // The panel has to exist in the DOM before it can be measured.
    setTimeout(() => this.positionPanel());
  }

  selectOption(opt: DropdownOption, event: MouseEvent): void {
    event.stopPropagation();
    this.innerValue = opt.value;
    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
    this.close();
  }

  // ControlValueAccessor methods
  writeValue(val: any): void {
    this.innerValue = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

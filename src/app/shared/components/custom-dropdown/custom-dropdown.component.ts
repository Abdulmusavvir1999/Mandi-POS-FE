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
          <!-- Single Select Icon -->
          <span *ngIf="!multiple && selectedOption?.icon" class="material-symbols-outlined trigger-icon">
            {{ selectedOption?.icon }}
          </span>

          <!-- Multi Select Mode with chips or label -->
          <ng-container *ngIf="multiple">
            <span *ngIf="selectedOptions.length === 1 && selectedOptions[0].icon" class="material-symbols-outlined trigger-icon">
              {{ selectedOptions[0].icon }}
            </span>
            <span *ngIf="selectedOptions.length > 1" class="material-symbols-outlined trigger-icon">
              checklist
            </span>
          </ng-container>

          <span class="trigger-label" [class.is-placeholder]="isPlaceholderVisible">
            {{ displayLabel }}
          </span>
        </div>

        <div class="trigger-right">
          <!-- Multi Select Count Badge -->
          <span *ngIf="multiple && selectedOptions.length > 1" class="trigger-multi-badge">
            {{ selectedOptions.length }}
          </span>

          <!-- Single Select Badge -->
          <span *ngIf="!multiple && selectedOption?.badge" class="trigger-badge">
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
        <!-- Search / Custom Value Input inside dropdown -->
        <div *ngIf="searchable || allowCustom || options.length > 6" class="dropdown-search-wrapper" (click)="$event.stopPropagation()">
          <span class="material-symbols-outlined search-icon">{{ allowCustom ? 'edit_note' : 'search' }}</span>
          <input
            title="Search or enter custom option"
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onOptionSearchChange()"
            (keydown.enter)="onSearchEnter($event)"
            (click)="$event.stopPropagation()"
            [placeholder]="allowCustom ? 'Search or type new custom value...' : 'Search options...'"
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

        <!-- Multi-Select Action Header Bar -->
        <div *ngIf="multiple" class="multi-actions-header" (click)="$event.stopPropagation()">
          <span class="multi-selected-text">
            {{ selectedOptions.length }} of {{ options.length }} selected
          </span>
          <div class="multi-header-btns">
            <button type="button" class="multi-header-btn" (click)="selectAll($event)">
              Select All
            </button>
            <span class="multi-dot-sep">•</span>
            <button type="button" class="multi-header-btn" (click)="clearAll($event)">
              Clear
            </button>
          </div>
        </div>

        <!-- Add Custom Value Action Item (when allowCustom is true & input is typed) -->
        <div *ngIf="allowCustom && searchQuery.trim() && !hasExactMatch" class="custom-add-container" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="custom-add-btn"
            (click)="addCustomOption(searchQuery.trim(), $event)"
          >
            <span class="material-symbols-outlined custom-add-icon">add_circle</span>
            <div class="custom-add-text">
              <span class="custom-add-label">Add "<strong>{{ searchQuery.trim() }}</strong>"</span>
              <span class="custom-add-sub">Create & select new custom value</span>
            </div>
            <span class="custom-add-pill">NEW</span>
          </button>
        </div>

        <!-- Options List -->
        <div class="options-list-scroll">
          <button
            *ngFor="let opt of filteredOptions"
            type="button"
            class="option-item"
            [class.is-selected]="isOptionSelected(opt)"
            [class.is-multi-item]="multiple"
            (click)="selectOption(opt, $event)"
          >
            <div class="option-left">
              <!-- Multi-select Checkbox Square -->
              <div *ngIf="multiple" class="multi-chk-box" [class.is-checked]="isOptionSelected(opt)">
                <span class="material-symbols-outlined multi-chk-tick">check</span>
              </div>

              <!-- Option Icon -->
              <span *ngIf="opt.icon" class="material-symbols-outlined option-icon">
                {{ opt.icon }}
              </span>

              <!-- Label & Description -->
              <div class="option-text-group">
                <span class="option-label">{{ opt.label }}</span>
                <span *ngIf="opt.description" class="option-desc">{{ opt.description }}</span>
              </div>
            </div>

            <div class="option-right">
              <span *ngIf="opt.badge" class="option-badge">{{ opt.badge }}</span>
              <!-- Single Select Right Checkmark -->
              <span *ngIf="!multiple && isOptionSelected(opt)" class="material-symbols-outlined check-icon">
                check
              </span>
            </div>
          </button>

          <!-- Empty State if no matching search and not custom -->
          <div *ngIf="filteredOptions.length === 0 && (!allowCustom || !searchQuery.trim())" class="empty-options">
            <span class="material-symbols-outlined empty-icon">filter_alt_off</span>
            <span>No matching options found</span>
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
        flex: 1;
        min-width: 0;
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
      .trigger-label.is-placeholder {
        color: var(--text-muted, #94A3B8);
        font-weight: 500;
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

      .trigger-multi-badge {
        font-size: 0.6875rem;
        font-weight: 800;
        padding: 0.12rem 0.5rem;
        border-radius: 9999px;
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
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
        color: var(--primary, #7E22CE);
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

      /* Custom Add Item Button */
      .custom-add-container {
        padding: 0.25rem 0.35rem;
        margin-bottom: 0.35rem;
        border-bottom: 1px dashed var(--card-border, #E2E8F0);
      }

      .custom-add-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.55rem 0.75rem;
        border-radius: 10px;
        border: 1.5px dashed var(--primary, #7E22CE);
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.08);
        color: var(--primary, #7E22CE);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        text-align: left;
      }

      .custom-add-btn:hover {
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
        border-style: solid;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.3));
      }

      .custom-add-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .custom-add-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }

      .custom-add-label {
        font-size: 0.8125rem;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .custom-add-sub {
        font-size: 0.6875rem;
        opacity: 0.85;
      }

      .custom-add-pill {
        font-size: 0.625rem;
        font-weight: 800;
        padding: 0.1rem 0.4rem;
        border-radius: 9999px;
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
      }
      .custom-add-btn:hover .custom-add-pill {
        background: #FFFFFF;
        color: var(--primary, #7E22CE);
      }

      /* Multi-select Header Bar */
      .multi-actions-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.4rem 0.6rem;
        margin-bottom: 0.25rem;
        border-bottom: 1px solid var(--card-border, #E2E8F0);
        background: var(--bg-app, #F8FAFC);
        border-radius: 8px;
      }

      .multi-selected-text {
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
      }

      .multi-header-btns {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .multi-header-btn {
        background: none;
        border: none;
        padding: 0.15rem 0.35rem;
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--text-muted, #64748B);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s ease;
      }
      .multi-header-btn:hover {
        color: var(--primary, #7E22CE);
        background: var(--primary-light, #F3E8FF);
      }
      .multi-dot-sep {
        font-size: 0.6875rem;
        color: var(--card-border, #CBD5E1);
      }

      /* Options Scroll Area */
      .options-list-scroll {
        max-height: 280px;
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
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
        flex: 1;
      }

      /* Multi-select Checkbox Icon Box */
      .multi-chk-box {
        width: 18px;
        height: 18px;
        min-width: 18px;
        border-radius: 5px;
        border: 1.5px solid var(--card-border, #CBD5E1);
        background: var(--card-bg, #FFFFFF);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .multi-chk-box.is-checked {
        background: var(--primary, #7E22CE);
        border-color: var(--primary, #7E22CE);
      }

      .multi-chk-tick {
        font-size: 13px;
        font-weight: 900;
        color: #FFFFFF;
        opacity: 0;
        transform: scale(0.6);
        transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .multi-chk-box.is-checked .multi-chk-tick {
        opacity: 1;
        transform: scale(1);
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
        min-width: 0;
      }

      .option-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .option-desc {
        font-size: 0.6875rem;
        color: var(--text-muted, #64748B);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
  @Input() multiple = false;
  @Input() allowCustom = false;

  @HostBinding('class.w-full')
  get isFullWidth(): boolean {
    return this.minWidth === '100%';
  }

  @Output() valueChange = new EventEmitter<any>();
  @Output() optionCreated = new EventEmitter<DropdownOption>();

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
    document.addEventListener('scroll', this.reposition, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.reposition);
    document.removeEventListener('scroll', this.reposition, true);
    releaseFloatingPanel(this);
  }

  public close(): void {
    this.isOpen = false;
    this.isPositioned = false;
    this.searchQuery = '';
    releaseFloatingPanel(this);
  }

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

    this.isFlipped = spaceBelow < Math.min(naturalHeight, MIN_PANEL) && spaceAbove > spaceBelow;

    const available = Math.max(MIN_PANEL, this.isFlipped ? spaceAbove : spaceBelow);
    const height = Math.min(naturalHeight, available);
    const top = this.isFlipped ? rect.top - GAP - height : rect.bottom + GAP;

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

  onOptionSearchChange(): void {
    setTimeout(() => this.positionPanel());
  }

  onSearchEnter(event: Event): void {
    event.preventDefault();
    if (this.allowCustom && this.searchQuery.trim() && !this.hasExactMatch) {
      this.addCustomOption(this.searchQuery.trim(), event as MouseEvent);
    }
  }

  get hasExactMatch(): boolean {
    if (!this.searchQuery.trim()) return false;
    const q = this.searchQuery.trim().toLowerCase();
    return this.options.some(
      (opt) =>
        opt.label.toLowerCase() === q ||
        String(opt.value).toLowerCase() === q
    );
  }

  get selectedOption(): DropdownOption | undefined {
    let opt = this.options.find((o) => o.value === this.innerValue);
    if (!opt && this.innerValue !== null && this.innerValue !== undefined && this.innerValue !== '') {
      // Ensure custom or newly bound values still render cleanly
      opt = { value: this.innerValue, label: String(this.innerValue), icon: 'edit_note' };
    }
    return opt;
  }

  private getSelectedValuesArray(): any[] {
    if (Array.isArray(this.innerValue)) {
      return this.innerValue;
    }
    if (typeof this.innerValue === 'string' && this.innerValue.trim()) {
      return this.innerValue.split(',').map((s) => s.trim());
    }
    return [];
  }

  get selectedOptions(): DropdownOption[] {
    if (!this.multiple) {
      const opt = this.selectedOption;
      return opt ? [opt] : [];
    }
    const currentValues = this.getSelectedValuesArray();
    return this.options.filter(
      (opt) => currentValues.includes(opt.value) || currentValues.includes(String(opt.value))
    );
  }

  get isPlaceholderVisible(): boolean {
    if (this.multiple) {
      return this.selectedOptions.length === 0;
    }
    return !this.selectedOption;
  }

  get displayLabel(): string {
    if (!this.multiple) {
      return this.selectedOption?.label || this.placeholder;
    }
    const selected = this.selectedOptions;
    if (selected.length === 0) return this.placeholder;
    if (selected.length === 1) return selected[0].label;
    if (selected.length === 2) return `${selected[0].label}, ${selected[1].label}`;
    return `${selected[0].label}, ${selected[1].label} (+${selected.length - 2} more)`;
  }

  isOptionSelected(opt: DropdownOption): boolean {
    if (!this.multiple) {
      return opt.value === this.innerValue || String(opt.value) === String(this.innerValue);
    }
    const currentValues = this.getSelectedValuesArray();
    return currentValues.includes(opt.value) || currentValues.includes(String(opt.value));
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
    setTimeout(() => this.positionPanel());
  }

  selectOption(opt: DropdownOption, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.multiple) {
      this.innerValue = opt.value;
      this.onChange(this.innerValue);
      this.onTouched();
      this.valueChange.emit(this.innerValue);
      this.close();
      return;
    }

    // Multi-select toggle logic
    let currentValues = this.getSelectedValuesArray();
    const isAlreadySelected =
      currentValues.includes(opt.value) || currentValues.includes(String(opt.value));

    if (isAlreadySelected) {
      currentValues = currentValues.filter((v) => v !== opt.value && v !== String(opt.value));
    } else {
      currentValues.push(opt.value);
    }

    if (Array.isArray(this.innerValue)) {
      this.innerValue = currentValues;
    } else if (typeof this.innerValue === 'string') {
      this.innerValue = currentValues.join(',');
    } else {
      this.innerValue = currentValues;
    }

    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
  }

  addCustomOption(customText: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const trimmed = customText.trim();
    if (!trimmed) return;

    // Check if already in options
    let existing = this.options.find(
      (o) => o.label.toLowerCase() === trimmed.toLowerCase() || String(o.value).toLowerCase() === trimmed.toLowerCase()
    );

    if (!existing) {
      existing = {
        value: trimmed,
        label: trimmed,
        icon: 'edit_calendar',
        description: 'Custom added term',
        badge: 'Custom',
      };
      this.options.unshift(existing);
      this.optionCreated.emit(existing);
    }

    this.selectOption(existing, event);
    this.searchQuery = '';
  }

  selectAll(event: MouseEvent): void {
    event.stopPropagation();
    const allValues = this.options.map((o) => o.value);
    if (typeof this.innerValue === 'string') {
      this.innerValue = allValues.join(',');
    } else {
      this.innerValue = allValues;
    }
    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
  }

  clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this.innerValue = typeof this.innerValue === 'string' ? '' : [];
    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
  }

  // ControlValueAccessor methods
  writeValue(val: any): void {
    this.innerValue = val;
    if (val && this.allowCustom && !Array.isArray(val)) {
      const match = this.options.find((o) => o.value === val || String(o.value) === String(val));
      if (!match && typeof val === 'string' && val.trim()) {
        this.options.push({
          value: val,
          label: val,
          icon: 'edit_calendar',
          description: 'Custom terms',
          badge: 'Custom',
        });
      }
    }
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

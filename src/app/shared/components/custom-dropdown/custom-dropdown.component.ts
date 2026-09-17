import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  HostBinding,
  forwardRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
      <div *ngIf="isOpen" class="dropdown-menu-panel shadow-elevation">
        <!-- Optional Search Bar inside dropdown for quick filtering -->
        <div *ngIf="searchable || options.length > 7" class="dropdown-search-wrapper" (click)="$event.stopPropagation()">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            title="Search options"
            type="text"
            [(ngModel)]="searchQuery"
            (click)="$event.stopPropagation()"
            placeholder="Search options..."
            class="dropdown-search-input"
            autofocus
          />
          <button
            *ngIf="searchQuery"
            type="button"
            class="search-clear-btn"
            (click)="searchQuery = ''; $event.stopPropagation()"
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
        box-shadow: 0 1px 3px rgba(46, 16, 101, 0.04);
      }

      .dropdown-trigger:hover:not(:disabled) {
        border-color: var(--primary, #7E22CE);
        background: var(--card-bg, #ffffff);
        box-shadow: 0 2px 8px rgba(126, 34, 206, 0.08);
      }

      .custom-dropdown-container.is-open .dropdown-trigger {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.15)), 0 4px 12px rgba(46, 16, 101, 0.06);
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
      .dropdown-menu-panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        min-width: 100%;
        max-width: 480px;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 14px;
        padding: 0.4rem;
        z-index: 1000;
        box-shadow: 0 16px 36px -4px rgba(46, 16, 101, 0.16), 0 6px 12px -2px rgba(46, 16, 101, 0.08);
        animation: dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
        overflow-y: auto;
        overflow-x: hidden;
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
export class CustomDropdownComponent implements ControlValueAccessor {
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

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchQuery = '';
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.searchQuery = '';
    }
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
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchQuery = '';
    }
  }

  selectOption(opt: DropdownOption, event: MouseEvent): void {
    event.stopPropagation();
    this.innerValue = opt.value;
    this.onChange(this.innerValue);
    this.onTouched();
    this.valueChange.emit(this.innerValue);
    this.isOpen = false;
    this.searchQuery = '';
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

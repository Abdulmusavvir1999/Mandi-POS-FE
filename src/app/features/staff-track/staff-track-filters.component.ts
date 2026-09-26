import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { StaffTrackService, StaffTrackFilters } from '../../core/services/staff-track.service';

/**
 * The single filter bar for every Staff Track view.
 *
 * Built once and reused by the workspace tabs and the staff detail page, so a
 * date range means the same thing everywhere and there is one place to change
 * when a filter is added. Which controls appear is driven by the `show` inputs
 * rather than by forking the component per screen.
 *
 * Filters the POS has no data for — branch, shift and department — are absent
 * by design: this system has no such tables, and a control that silently
 * matches everything is worse than no control.
 */
@Component({
  selector: 'app-staff-track-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent, DatePickerComponent],
  template: `
    <div class="filter-toolbar-card">
      <div class="filter-controls-group">
        <!-- Quick date presets -->
        <div class="st-preset-group" role="group" aria-label="Quick date range">
          <button
            type="button"
            *ngFor="let p of presets"
            class="st-preset-btn"
            [class.is-active]="activePreset === p.key"
            (click)="applyPreset(p.key)"
          >
            {{ p.label }}
          </button>
        </div>

        <app-date-picker
          [(ngModel)]="filters.dateFrom"
          (valueChange)="onManualDate()"
          label="From date"
          placeholder="From"
          minWidth="150px"
        ></app-date-picker>

        <app-date-picker
          [(ngModel)]="filters.dateTo"
          (valueChange)="onManualDate()"
          label="To date"
          placeholder="To"
          minWidth="150px"
        ></app-date-picker>

        <!--
          Both pickers are hidden for a self-scoped viewer. The server pins
          userId to them regardless of what is sent, so a staff dropdown holding
          only their own name — and a role filter that can only ever match or
          empty the view — would suggest a choice that does not exist.
        -->
        <app-custom-dropdown
          *ngIf="showStaff && !selfScoped"
          [options]="staffOptions"
          [(ngModel)]="filters.userId"
          (valueChange)="emit()"
          placeholder="All Staff"
          [searchable]="true"
          minWidth="180px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          *ngIf="showRole && !selfScoped"
          [options]="roleOptions"
          [(ngModel)]="filters.roleId"
          (valueChange)="emit()"
          placeholder="All Roles"
          minWidth="150px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          *ngIf="showOrderStatus"
          [options]="orderStatusOptions"
          [(ngModel)]="filters.orderStatus"
          (valueChange)="emit()"
          placeholder="All Order Status"
          minWidth="170px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          *ngIf="showPaymentStatus"
          [options]="paymentStatusOptions"
          [(ngModel)]="filters.paymentStatus"
          (valueChange)="emit()"
          placeholder="All Payment Status"
          minWidth="180px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          *ngIf="showTable"
          [options]="tableOptions"
          [(ngModel)]="filters.tableId"
          (valueChange)="emit()"
          placeholder="All Tables"
          [searchable]="true"
          minWidth="150px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          *ngIf="showActivityType"
          [options]="moduleOptions"
          [(ngModel)]="filters.module"
          (valueChange)="emit()"
          placeholder="All Activity Types"
          [searchable]="true"
          minWidth="180px"
        ></app-custom-dropdown>

        <div class="search-input-wrapper" *ngIf="showSearch">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            title="Search"
            [(ngModel)]="filters.search"
            (ngModelChange)="onSearchTyped()"
            [placeholder]="searchPlaceholder"
            class="toolbar-search-input"
          />
          <button
            *ngIf="filters.search"
            type="button"
            (click)="filters.search = ''; emitNow()"
            class="search-clear-btn"
            title="Clear search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div class="filter-actions-group">
        <span class="st-filter-count" *ngIf="activeFilterCount() > 0">
          {{ activeFilterCount() }} active
        </span>
        <button type="button" class="audit-btn btn-outline-purple" (click)="reset()" title="Clear all filters">
          <span class="material-symbols-outlined">filter_alt_off</span>
          <span>Clear All</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .st-preset-group {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: 12px;
        background: var(--bg-app, #F5F3FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      :host-context(.dark-theme) .st-preset-group,
      .dark-theme .st-preset-group {
        background: rgba(139, 92, 246, 0.1) !important;
        border-color: rgba(139, 92, 246, 0.25) !important;
      }
      .st-preset-btn {
        border: 0;
        background: transparent;
        padding: 6px 11px;
        border-radius: 9px;
        font-size: 11px;
        font-weight: 700;
        color: var(--primary-variant, #6B21A8);
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s ease, color 0.15s ease;
      }
      :host-context(.dark-theme) .st-preset-btn,
      .dark-theme .st-preset-btn {
        color: #C4B5FD;
      }
      .st-preset-btn:hover {
        background: rgba(139, 92, 246, 0.15);
      }
      .st-preset-btn.is-active {
        background: var(--primary, #7E22CE) !important;
        color: #FFFFFF !important;
      }
      .st-filter-count {
        font-size: 11px;
        font-weight: 700;
        color: var(--primary-variant, #6B21A8);
        background: var(--primary-light, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        padding: 5px 10px;
        border-radius: 999px;
        white-space: nowrap;
      }
      :host-context(.dark-theme) .st-filter-count,
      .dark-theme .st-filter-count {
        background: rgba(139, 92, 246, 0.16) !important;
        border-color: rgba(139, 92, 246, 0.35) !important;
        color: #C4B5FD !important;
      }
    `,
  ],
})
export class StaffTrackFiltersComponent implements OnInit {
  private staffTrackService = inject(StaffTrackService);

  @Input() filters: StaffTrackFilters = {};
  @Input() showStaff = true;
  @Input() showRole = true;
  @Input() showOrderStatus = false;
  @Input() showPaymentStatus = false;
  @Input() showTable = false;
  @Input() showActivityType = false;
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search staff…';

  @Output() filtersChange = new EventEmitter<StaffTrackFilters>();

  public activePreset: string | null = 'today';

  /** Debounce handle for the free-text search box. */
  private searchTimer: any = null;

  public presets = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  /**
   * True when the API reported it is serving this caller their own rows only.
   * Read from the response rather than from a local permission check, so the
   * UI and the server can never disagree about which view is in force.
   */
  @Output() scopeChange = new EventEmitter<'ALL' | 'SELF'>();
  public selfScoped = false;

  public staffOptions: DropdownOption[] = [{ value: null, label: 'All Staff', icon: 'groups' }];
  public roleOptions: DropdownOption[] = [{ value: null, label: 'All Roles', icon: 'badge' }];
  public tableOptions: DropdownOption[] = [{ value: null, label: 'All Tables', icon: 'table_restaurant' }];
  public moduleOptions: DropdownOption[] = [{ value: '', label: 'All Activity Types', icon: 'dataset' }];

  public orderStatusOptions: DropdownOption[] = [
    { value: '', label: 'All Order Status', icon: 'dataset' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: 'skillet' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'cancel' },
  ];

  public paymentStatusOptions: DropdownOption[] = [
    { value: '', label: 'All Payment Status', icon: 'dataset' },
    { value: 'PAID', label: 'Paid', icon: 'paid' },
    { value: 'PENDING', label: 'Pending', icon: 'pending' },
    { value: 'REFUNDED', label: 'Refunded', icon: 'undo' },
    { value: 'UNBILLED', label: 'Not yet billed', icon: 'receipt' },
  ];

  ngOnInit(): void {
    this.loadOptions();
  }

  /** Dropdown sources come from the API so roles and tables are never hardcoded. */
  private loadOptions(): void {
    this.staffTrackService.getFilterOptions().subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        this.selfScoped = res.data.scope === 'SELF';
        this.scopeChange.emit(this.selfScoped ? 'SELF' : 'ALL');
        this.staffOptions = [
          { value: null, label: 'All Staff', icon: 'groups' },
          ...(res.data.staff || []).map((s: any) => ({
            value: s.id,
            label: s.name,
            icon: 'person',
            description: '@' + s.username,
          })),
        ];
        this.roleOptions = [
          { value: null, label: 'All Roles', icon: 'badge' },
          ...(res.data.roles || []).map((r: any) => ({ value: r.id, label: r.name, icon: 'badge' })),
        ];
        this.tableOptions = [
          { value: null, label: 'All Tables', icon: 'table_restaurant' },
          ...(res.data.tables || []).map((t: any) => ({
            value: t.id,
            label: t.table_number + ' — ' + t.name,
            icon: 'table_restaurant',
          })),
        ];
        this.moduleOptions = [
          { value: '', label: 'All Activity Types', icon: 'dataset' },
          ...(res.data.modules || []).map((m: string) => ({ value: m, label: this.humanise(m), icon: 'bolt' })),
        ];
      },
      // A failed options fetch leaves the "All …" defaults in place; the page
      // still works, it simply cannot offer the narrowed choices.
      error: () => {},
    });
  }

  private humanise(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Local calendar date — `toISOString` would shift the day near midnight. */
  private toLocalDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  applyPreset(key: string): void {
    this.activePreset = key;
    const now = new Date();

    if (key === 'all') {
      this.filters.dateFrom = '';
      this.filters.dateTo = '';
    } else if (key === 'today') {
      const t = this.toLocalDate(now);
      this.filters.dateFrom = t;
      this.filters.dateTo = t;
    } else if (key === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const t = this.toLocalDate(y);
      this.filters.dateFrom = t;
      this.filters.dateTo = t;
    } else if (key === 'week') {
      const start = new Date(now);
      // Monday-first, matching how the shop's week is read locally.
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      this.filters.dateFrom = this.toLocalDate(start);
      this.filters.dateTo = this.toLocalDate(now);
    } else if (key === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filters.dateFrom = this.toLocalDate(start);
      this.filters.dateTo = this.toLocalDate(now);
    }

    this.emit();
  }

  /** Typing a date by hand takes the bar off any preset. */
  onManualDate(): void {
    this.activePreset = null;
    this.emit();
  }

  activeFilterCount(): number {
    const f = this.filters;
    let n = 0;
    if (f.userId) n++;
    if (f.roleId) n++;
    if (f.orderStatus) n++;
    if (f.paymentStatus) n++;
    if (f.tableId) n++;
    if (f.module) n++;
    if (f.search) n++;
    return n;
  }

  reset(): void {
    this.filters.userId = null;
    this.filters.roleId = null;
    this.filters.orderStatus = '';
    this.filters.paymentStatus = '';
    this.filters.tableId = null;
    this.filters.module = '';
    this.filters.search = '';
    clearTimeout(this.searchTimer);
    this.applyPreset('today');
  }

  /**
   * Waits for a pause in typing before emitting.
   *
   * Each emit costs the parent several requests - the header pair plus the
   * active tab - so firing one per keystroke both floods the server and lets
   * an early, slower response land after a later one.
   */
  onSearchTyped(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.emit(), 350);
  }

  /** Emits at once, cancelling any pending debounce. For discrete actions. */
  emitNow(): void {
    clearTimeout(this.searchTimer);
    this.emit();
  }

  emit(): void {
    this.filtersChange.emit({ ...this.filters });
  }
}

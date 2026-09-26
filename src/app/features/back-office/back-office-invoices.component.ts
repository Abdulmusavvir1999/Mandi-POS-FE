import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackOfficeService, BulkResult } from '../../core/services/back-office.service';
import { NotificationService } from '../../core/services/notification.service';
import { Bill } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import {
  CustomDropdownComponent,
  DropdownOption,
} from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { BackOfficeResultComponent } from './back-office-result.component';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';

/**
 * Invoice management for the Back-Office.
 *
 * Invoices can be searched, filtered, opened and deleted individually or in
 * bulk. Deleting an invoice cancels the order it belonged to so no order is
 * left reading as settled with nothing to settle against.
 */
@Component({
  selector: 'app-back-office-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppCurrencyPipe,
    CustomDropdownComponent,
    DatePickerComponent,
    BackOfficeResultComponent,ActionLoadingDirective],
  template: `
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- FILTER & SEARCH TOOLBAR                                          -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="filter-toolbar-card">
      <div class="filter-controls-group">
        <div class="search-input-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            title="Search invoices"
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChanged()"
            placeholder="Search invoice #, order #, customer..."
            class="toolbar-search-input"
          />
          <button
            *ngIf="searchQuery"
            (click)="searchQuery = ''; onFilterChange()"
            class="search-clear-btn"
            title="Clear search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <app-custom-dropdown
          [options]="paymentOptions"
          [(ngModel)]="selectedPayment"
          (valueChange)="onFilterChange()"
          placeholder="All Payment Modes"
          minWidth="185px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          [options]="orderTypeOptions"
          [(ngModel)]="selectedOrderType"
          (valueChange)="onFilterChange()"
          placeholder="All Order Types"
          minWidth="175px"
        ></app-custom-dropdown>

        <app-date-picker
          [(ngModel)]="selectedDate"
          (valueChange)="onFilterChange()"
          label="Filter by date"
          placeholder="All Dates"
          minWidth="165px"
        ></app-date-picker>

        <span class="toolbar-meta-count hidden lg:inline-block">
          {{ pagination?.total || invoices.length }} invoices
        </span>
      </div>

      <div class="toolbar-actions-group">
        <button type="button" (click)="loadInvoices(currentPage)" class="action-btn btn-outline-purple" title="Refresh">
          <span class="material-symbols-outlined">refresh</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- SELECTION TOOLBAR — only rendered while something is selected    -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="bo-selection-bar" *ngIf="selectedIds.size > 0">
      <div class="bo-selection-count">
        <span class="material-symbols-outlined">check_circle</span>
        <strong>{{ selectedIds.size }}</strong>
        <span>Selected</span>
      </div>

      <div class="bo-selection-actions">
        <button type="button" class="action-btn bo-btn-danger" (click)="confirmBulkDelete()" [disabled]="isBusy">
          <span class="material-symbols-outlined">delete_sweep</span>
          <span>Delete Selected</span>
        </button>
        <button type="button" class="action-btn btn-outline-purple" (click)="clearSelection()">
          <span class="material-symbols-outlined">close</span>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- INVOICES TABLE                                                   -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="table-container-card">
      <div class="table-responsive-wrapper">
        <table class="saas-data-table">
          <thead>
            <tr>
              <th style="width: 46px; text-align: center;">
                <input
                  type="checkbox"
                  class="bo-checkbox"
                  title="Select all visible invoices"
                  [checked]="allVisibleSelected"
                  [indeterminate]="someVisibleSelected"
                  (change)="toggleSelectAll($any($event.target).checked)"
                />
              </th>
              <th style="width: 20%;">Invoice # &amp; Date</th>
              <th style="width: 15%;">Order #</th>
              <th style="width: 18%;">Customer</th>
              <th style="width: 12%;">Payment</th>
              <th style="width: 11%;">Status</th>
              <th style="width: 12%;">Total</th>
              <th style="width: 96px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let invoice of invoices" [class.bo-row-selected]="selectedIds.has(invoice.id)">
              <td style="text-align: center;">
                <input
                  type="checkbox"
                  class="bo-checkbox"
                  [title]="'Select invoice ' + invoice.bill_number"
                  [checked]="selectedIds.has(invoice.id)"
                  (change)="toggleOne(invoice.id, $any($event.target).checked)"
                />
              </td>

              <td>
                <div class="flex items-center gap-2.5">
                  <div class="bo-row-icon">
                    <span class="material-symbols-outlined" style="font-size: 19px;">description</span>
                  </div>
                  <div class="min-w-0">
                    <div class="font-mono font-bold text-xs text-[#7E22CE]">{{ invoice.bill_number }}</div>
                    <div class="text-[10px] text-[#6B7280] font-mono">
                      {{ invoice.created_at | date: 'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <span class="font-mono text-[11px] font-bold bo-text-main">{{ invoice.order_number || '—' }}</span>
              </td>

              <td>
                <div class="font-bold text-xs bo-text-main truncate">{{ invoice.customer_name || 'Walk-In Guest' }}</div>
                <div class="text-[10px] text-[#6B7280] font-mono">
                  {{ invoice.customer_phone || 'Cashier: ' + (invoice.cashier_name || 'Counter') }}
                </div>
              </td>

              <td>
                <span class="bo-invoice-link">{{ invoice.payment_method }}</span>
              </td>

              <td>
                <span class="bo-status-pill" [ngClass]="invoice.is_voided ? 'is-cancelled' : 'is-done'">
                  {{ invoice.is_voided ? 'VOIDED' : invoice.payment_status }}
                </span>
              </td>

              <td>
                <span class="font-mono font-black text-xs text-[#16A34A]">
                  {{ invoice.total_amount | appCurrency: '1.2-2' }}
                </span>
              </td>

              <td style="text-align: center;">
                <div class="flex items-center justify-center gap-1.5">
                  <button type="button" class="btn-action-icon" title="Open invoice details" (click)="openDetails(invoice.id)">
                    <span class="material-symbols-outlined" style="font-size: 17px;">visibility</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-icon is-danger"
                    title="Delete this invoice"
                    [disabled]="isBusy"
                    (click)="confirmSingleDelete(invoice)"
                  >
                    <span class="material-symbols-outlined" style="font-size: 17px;">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr *ngIf="invoices.length === 0">
              <td colspan="8" class="empty-state-cell">
                <div class="empty-state-box">
                  <span class="material-symbols-outlined empty-icon">
                    {{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'description' }}
                  </span>
                  <div class="empty-title">
                    {{ isLoading ? 'Loading…' : loadError ? 'Could not load invoices' : 'No Invoices Found' }}
                  </div>
                  <p class="empty-desc">
                    {{
                      isLoading
                        ? 'Fetching the invoice register…'
                        : loadError
                        ? loadError
                        : 'No invoices match the current search or filters.'
                    }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-footer-bar" *ngIf="pagination && pagination.total > 0">
        <div class="pagination-info">
          Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of
          <strong>{{ pagination.total }}</strong> invoices
        </div>
        <div class="pagination-controls">
          <button
            type="button"
            class="page-nav-btn"
            title="Previous page"
            [disabled]="currentPage <= 1"
            (click)="loadInvoices(currentPage - 1)"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            class="page-num-btn"
            *ngFor="let page of pageNumbers"
            [class.is-active]="currentPage === page"
            (click)="loadInvoices(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="page-nav-btn"
            title="Next page"
            [disabled]="currentPage >= pagination.totalPages"
            (click)="loadInvoices(currentPage + 1)"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- INVOICE DETAILS DRAWER                                           -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="detailsInvoice">
      <div class="modal-content p-6 md:p-7 w-full max-w-2xl shadow-2xl bo-card">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div class="flex items-start gap-3.5">
            <span class="modal-icon-badge is-warning">
              <span class="material-symbols-outlined text-2xl">description</span>
            </span>
            <div>
              <h3 class="text-lg font-black bo-text-main">{{ detailsInvoice.bill_number }}</h3>
              <p class="text-xs mt-0.5 font-medium bo-text-muted">
                {{ detailsInvoice.created_at | date: 'dd MMM yyyy, HH:mm' }} ·
                {{ detailsInvoice.customer_name || 'Walk-In Guest' }}
              </p>
            </div>
          </div>
          <span class="bo-status-pill" [ngClass]="detailsInvoice.is_voided ? 'is-cancelled' : 'is-done'">
            {{ detailsInvoice.is_voided ? 'VOIDED' : detailsInvoice.payment_status }}
          </span>
        </div>

        <div class="bo-detail-grid">
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Order</span>
            <span class="bo-detail-value">{{ detailsInvoice.order_number || '—' }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Order Type</span>
            <span class="bo-detail-value">{{ detailsInvoice.order_type }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Payment</span>
            <span class="bo-detail-value">{{ detailsInvoice.payment_method }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Cashier</span>
            <span class="bo-detail-value">{{ detailsInvoice.cashier_name || '—' }}</span>
          </div>
        </div>

        <div class="bo-result-scroll mt-4">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 70px; text-align: center;">Qty</th>
                <th style="width: 110px; text-align: right;">Rate</th>
                <th style="width: 120px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of detailsInvoice.items">
                <td class="text-xs font-semibold bo-text-main">{{ item.product_name }}</td>
                <td class="text-xs font-mono" style="text-align: center;">{{ item.quantity }}</td>
                <td class="text-xs font-mono" style="text-align: right;">{{ item.unit_price | appCurrency: '1.2-2' }}</td>
                <td class="text-xs font-mono font-bold" style="text-align: right;">
                  {{ item.total_amount | appCurrency: '1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="!detailsInvoice.items?.length">
                <td colspan="4" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">inventory_2</span>
                    <div class="empty-title">No line items</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bo-summary">
          <div class="bo-summary-row">
            <span>Subtotal</span><strong>{{ detailsInvoice.subtotal | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row">
            <span>Discount</span
            ><strong class="bo-discount-on">- {{ detailsInvoice.discount_amount | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row">
            <span>Tax</span><strong>{{ detailsInvoice.tax_amount | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row is-total">
            <span>Grand Total</span><strong>{{ detailsInvoice.total_amount | appCurrency: '1.2-2' }}</strong>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6 pt-4 bo-divider">
          <button type="button" class="btn btn-secondary" (click)="detailsInvoice = null">Close</button>
        </div>
      </div>
    </div>

    <app-back-office-result
      [result]="bulkResult"
      [title]="bulkResultTitle"
      (close)="bulkResult = null"
    ></app-back-office-result>
  `,
  styles: [
    `
      .bo-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        color: var(--text-main, #2e1065);
      }
      .bo-text-main {
        color: var(--text-main, #2e1065);
      }
      .bo-text-muted {
        color: var(--text-muted, #6b7280);
      }
      .bo-divider {
        border-top: 1px solid var(--card-border, #e9d5ff);
      }
      .bo-discount-on {
        color: var(--danger, #DC2626);
      }

      .bo-selection-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.7rem 1rem;
        border-radius: 0.9rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        box-shadow: 0 8px 22px -6px rgba(var(--primary-rgb, 126, 34, 206), 0.5);
      }
      .bo-selection-count {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: #ffffff;
        font-size: 0.82rem;
        font-weight: 700;
      }
      .bo-selection-count strong {
        font-size: 1rem;
        font-weight: 900;
      }
      .bo-selection-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .bo-selection-bar .action-btn {
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.35);
        color: #ffffff;
      }
      .bo-selection-bar .action-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.24);
        color: #ffffff;
      }
      .bo-selection-bar .bo-btn-danger {
        background: var(--danger, #DC2626);
        border-color: var(--danger, #B91C1C);
      }
      .bo-selection-bar .bo-btn-danger:hover:not(:disabled) {
        background: var(--danger, #B91C1C);
      }

      .bo-checkbox {
        width: 16px;
        height: 16px;
        accent-color: var(--primary, #7E22CE);
        cursor: pointer;
      }
      .bo-row-selected {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.06) !important;
      }
      .bo-row-icon {
        width: 34px;
        height: 34px;
        border-radius: 0.7rem;
        background: var(--primary-light, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .bo-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid transparent;
      }
      .bo-status-pill.is-done {
        background: var(--success-light, #DCFCE7);
        color: #166534;
        border-color: var(--success-light, #BBF7D0);
      }
      .bo-status-pill.is-cancelled {
        background: var(--danger-light, #FEE2E2);
        color: #991b1b;
        border-color: var(--danger-light, #FECACA);
      }
      .bo-invoice-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 0.4rem;
        padding: 0.12rem 0.4rem;
      }

      .bo-detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.6rem;
      }
      .bo-detail-cell {
        padding: 0.5rem 0.7rem;
        border-radius: 0.6rem;
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.05);
        border: 1px solid var(--card-border, #e9d5ff);
      }
      .bo-detail-label {
        display: block;
        font-size: 0.6rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6b7280);
      }
      .bo-detail-value {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-main, #2e1065);
        margin-top: 0.1rem;
      }
      .bo-result-scroll {
        max-height: 34vh;
        overflow-y: auto;
      }
      .bo-summary {
        margin-top: 1rem;
        border-top: 1px solid var(--card-border, #e9d5ff);
        padding-top: 0.7rem;
      }
      .bo-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        color: var(--text-muted, #6b7280);
        padding: 0.18rem 0;
      }
      .bo-summary-row strong {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--text-main, #2e1065);
      }
      .bo-summary-row.is-total {
        font-weight: 800;
        color: var(--text-main, #2e1065);
        border-top: 1px dashed var(--card-border, #e9d5ff);
        margin-top: 0.3rem;
        padding-top: 0.5rem;
      }
      .bo-summary-row.is-total strong {
        color: var(--success, #16A34A);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class BackOfficeInvoicesComponent implements OnInit {
  private backOffice = inject(BackOfficeService);
  public notify = inject(NotificationService);

  public invoices: Bill[] = [];
  public pagination: any = null;
  public isLoading = false;
  public isBusy = false;
  public loadError: string | null = null;

  public pageSize = 20;
  public currentPage = 1;

  /** Debounce for the search box, so typing is not one request per key. */
  private searchTimer: any = null;
  /** Identifies the newest request, so a slow earlier one cannot overwrite it. */
  private loadToken = 0;

  public searchQuery = '';
  public selectedPayment: any = '';
  public selectedOrderType: any = '';
  public selectedDate = '';

  public selectedIds = new Set<number>();
  public detailsInvoice: Bill | null = null;

  public bulkResult: BulkResult | null = null;
  public bulkResultTitle = 'Operation complete';

  /** Raised after a delete, because the deleted invoices' orders were cancelled. */
  @Output() ordersNeedRefresh = new EventEmitter<void>();

  public paymentOptions: DropdownOption[] = [
    { value: '', label: 'All Payment Modes', icon: 'payments' },
    { value: 'CASH', label: 'Cash', icon: 'payments' },
    { value: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
    { value: 'CARD', label: 'Card', icon: 'credit_card' },
    { value: 'OTHER', label: 'Other', icon: 'wallet' },
  ];

  public orderTypeOptions: DropdownOption[] = [
    { value: '', label: 'All Order Types', icon: 'filter_list' },
    { value: 'DINING', label: 'Dine In', icon: 'restaurant' },
    { value: 'TAKEAWAY', label: 'Takeaway', icon: 'takeout_dining' },
  ];

  ngOnInit(): void {
    this.loadInvoices(1);
  }

  public loadInvoices(page = 1): void {
    // A filter or page change supersedes a pending debounce, which would
    // otherwise fire a second, redundant request straight after this one.
    clearTimeout(this.searchTimer);
    this.isLoading = true;
    this.loadError = null;
    this.currentPage = page;
    const token = ++this.loadToken;

    this.backOffice
      .getInvoices({
        page,
        limit: this.pageSize,
        search: this.searchQuery || undefined,
        paymentMethod: this.selectedPayment || '',
        orderType: this.selectedOrderType || '',
        dateFrom: this.selectedDate || undefined,
        dateTo: this.selectedDate || undefined,
      })
      .subscribe({
        next: (res) => {
          if (token !== this.loadToken) return;
          this.isLoading = false;
          if (res.success) {
            this.invoices = res.data || [];
            this.pagination = res.pagination;
            this.pruneSelection();
          }
        },
        error: (err) => {
          if (token !== this.loadToken) return;
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load invoices from the server.';
        },
      });
  }

  public onFilterChange(): void {
    this.loadInvoices(1);
  }

  /** Waits for a pause in typing before querying the server. */
  public onSearchChanged(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadInvoices(1), 300);
  }

  /** Keeps ids from other pages; only drops them when this is the whole set. */
  private pruneSelection(): void {
    if (this.selectedIds.size === 0) return;
    const total = this.pagination?.total ?? this.invoices.length;
    if (total > this.invoices.length) return;

    const stillListed = new Set(this.invoices.map((b) => b.id));
    for (const id of Array.from(this.selectedIds)) {
      if (!stillListed.has(id)) this.selectedIds.delete(id);
    }
  }

  public get pageNumbers(): number[] {
    if (!this.pagination) return [1];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }

  public get paginationStart(): number {
    if (!this.pagination || this.pagination.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  public get paginationEnd(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total);
  }

  // ── Selection ─────────────────────────────────────────────────────────

  public get allVisibleSelected(): boolean {
    return this.invoices.length > 0 && this.invoices.every((b) => this.selectedIds.has(b.id));
  }

  public get someVisibleSelected(): boolean {
    return !this.allVisibleSelected && this.invoices.some((b) => this.selectedIds.has(b.id));
  }

  public toggleOne(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  public toggleSelectAll(checked: boolean): void {
    for (const invoice of this.invoices) {
      if (checked) this.selectedIds.add(invoice.id);
      else this.selectedIds.delete(invoice.id);
    }
  }

  public clearSelection(): void {
    this.selectedIds.clear();
  }

  // ── Details ───────────────────────────────────────────────────────────

  public openDetails(id: number): void {
    this.backOffice.getInvoiceById(id).subscribe({
      next: (res) => {
        if (res.success) this.detailsInvoice = res.data;
      },
      error: () => {},
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────

  public confirmSingleDelete(invoice: Bill): void {
    this.notify.confirm({
      title: 'Delete 1 Invoice?',
      message: `Invoice ${invoice.bill_number} will be permanently removed and order ${
        invoice.order_number || 'it belongs to'
      } will be cancelled.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => this.runDelete([invoice.id]),
    });
  }

  public confirmBulkDelete(): void {
    const count = this.selectedIds.size;
    if (count === 0) return;

    this.notify.confirm({
      title: `Delete ${count} ${count === 1 ? 'Invoice' : 'Invoices'}?`,
      message: 'Are you sure you want to delete the selected invoices?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => this.runDelete(Array.from(this.selectedIds)),
    });
  }

  private runDelete(ids: number[]): void {
    this.isBusy = true;
    this.backOffice.deleteInvoices(ids).subscribe({
      next: (res) => {
        this.isBusy = false;
        const result = res.data;
        for (const row of result.succeeded) this.selectedIds.delete(row.id);
        this.loadInvoices(this.currentPage);
        this.ordersNeedRefresh.emit();

        if (result.failed.length > 0) {
          this.bulkResultTitle = 'Invoices deleted';
          this.bulkResult = result;
          return;
        }
        this.notify.success(res.message || 'Invoices deleted.');
      },
      error: () => {
        this.isBusy = false;
      },
    });
  }
}

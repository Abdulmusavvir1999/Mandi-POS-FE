import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../core/services/bill.service';
import { Bill, PaymentMethod, OrderType } from '../../core/models';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal/receipt-modal.component';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, ReceiptModalComponent, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Point of Sale</span>
        <span class="breadcrumb-separator">›</span>
        <span>Invoices & Billing</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Sales Register</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Sales Bills & Invoices</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ pagination?.total || bills.length }} Settled Invoices</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">payments</span>
                <span>Gross Revenue: <strong>{{ totalSalesAmount | appCurrency:'1.0-0' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">point_of_sale</span>
                <span>Register: <strong>Live Real-time</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadBills(1)"
            class="action-btn btn-outline-purple"
            title="Refresh Invoices"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-gradient-purple"
            title="Export CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export Invoices</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION TABS                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="selectedOrderType = ''; currentPage = 1; loadBills(1)"
          class="module-tab-btn"
          [class.is-active]="selectedOrderType === ''"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          <span>All Orders</span>
          <span class="tab-count-badge">{{ pagination?.total || bills.length }}</span>
        </button>

        <button
          type="button"
          (click)="selectedOrderType = 'DINING'; currentPage = 1; loadBills(1)"
          class="module-tab-btn"
          [class.is-active]="selectedOrderType === 'DINING'"
        >
          <span class="material-symbols-outlined">table_restaurant</span>
          <span>Dine-In Orders</span>
        </button>

        <button
          type="button"
          (click)="selectedOrderType = 'TAKEAWAY'; currentPage = 1; loadBills(1)"
          class="module-tab-btn"
          [class.is-active]="selectedOrderType === 'TAKEAWAY'"
        >
          <span class="material-symbols-outlined">takeout_dining</span>
          <span>Takeaway / Parcel</span>
        </button>

        <button
          type="button"
          (click)="selectedOrderType = 'WALK_IN'; currentPage = 1; loadBills(1)"
          class="module-tab-btn"
          [class.is-active]="selectedOrderType === 'WALK_IN'"
        >
          <span class="material-symbols-outlined">storefront</span>
          <span>Quick Counter</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Bills</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">receipt</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ pagination?.total || bills.length }}</span>
            <span class="kpi-pill pill-purple">Invoices</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Gross Sales</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ totalSalesAmount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-live">● Revenue</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Bill Size</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-blue-700">{{ avgBillAmount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-blue">Average</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Tax Collected</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">percent</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-amber-700">{{ totalTaxCollected | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-amber">GST</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Digital UPI</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">qr_code_2</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ upiSharePercent | number:'1.0-1' }}%</span>
            <span class="kpi-pill pill-purple">Instant</span>
          </div>
        </div>

        <!-- KPI 6 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Settlement</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">verified</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ settledSharePercent | number:'1.0-1' }}%</span>
            <span class="kpi-pill pill-success">✓ Settled</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. FILTER & SEARCH ACTION TOOLBAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <!-- Search Box -->
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search bills"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1; loadBills(1)"
              placeholder="Search bill #, guest name, cashier..."
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; currentPage = 1; loadBills(1)"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Payment Mode Filter -->
          <app-custom-dropdown
            [options]="paymentOptions"
            [(ngModel)]="selectedPayment"
            (valueChange)="currentPage = 1; loadBills(1)"
            placeholder="All Payment Modes"
            minWidth="190px"
          ></app-custom-dropdown>

          <!-- Date Filter -->
          <input
            title="Filter by date"
            type="date"
            [(ngModel)]="selectedDate"
            (ngModelChange)="currentPage = 1; loadBills(1)"
            class="toolbar-search-input !w-auto"
          />

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ pagination?.total || bills.length }} records
          </span>
        </div>

        <div class="toolbar-actions-group">
          <button
            type="button"
            (click)="loadBills(1)"
            class="action-btn btn-outline-purple"
            title="Refresh"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline-purple"
            title="Download CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. INVOICES DATA TABLE                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 20%;">Invoice # & Date</th>
                <th style="width: 20%;">Guest / Customer</th>
                <th style="width: 14%;">Order Type</th>
                <th style="width: 12%;">Payment Mode</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 12%;">Subtotal</th>
                <th style="width: 14%;">Grand Total</th>
                <th style="width: 60px; text-align: center;">Receipt</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of bills">
                <!-- Bill Number & Date -->
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-bold text-xs text-[#7E22CE] shrink-0 shadow-xs">
                      <span class="material-symbols-outlined" style="font-size: 20px;">receipt</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-mono font-bold text-xs text-[#7E22CE]">#{{ bill.bill_number }}</div>
                      <div class="text-[10px] text-[#6B7280] font-mono">{{ bill.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                  </div>
                </td>

                <!-- Customer -->
                <td>
                  <div class="font-bold text-xs text-[#2E1065] truncate">{{ bill.customer_name || 'Walk-In Guest' }}</div>
                  <div class="text-[10px] text-[#6B7280] font-mono">{{ bill.customer_phone || ('Cashier: ' + (bill.cashier_name || 'Counter')) }}</div>
                </td>

                <!-- Order Type -->
                <td>
                  <span
                    class="badge"
                    [ngClass]="{
                      'badge-info': bill.order_type === 'WALK_IN',
                      'badge-warning': bill.order_type === 'TAKEAWAY',
                      'badge-primary': bill.order_type === 'DINING'
                    }"
                  >
                    {{ bill.order_type }}
                  </span>
                </td>

                <!-- Payment -->
                <td>
                  <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">
                    {{ bill.payment_method }}
                  </span>
                </td>

                <!-- Status Pill -->
                <td>
                  <span class="status-dot-pill is-active">
                    <span class="status-dot"></span>
                    Paid
                  </span>
                </td>

                <!-- Subtotal -->
                <td>
                  <span class="font-mono text-xs text-[#6B7280]">{{ bill.subtotal | appCurrency:'1.0-0' }}</span>
                </td>

                <!-- Grand Total -->
                <td>
                  <span class="font-mono font-black text-xs text-[#16A34A]">
                    {{ bill.total_amount | appCurrency:'1.2-2' }}
                  </span>
                </td>

                <!-- Receipt Action -->
                <td style="text-align: center;">
                  <button
                    type="button"
                    (click)="printReceipt(bill.id)"
                    class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                    title="Print Thermal Receipt"
                  >
                    <span class="material-symbols-outlined" style="font-size: 16px;">print</span>
                    <span>Print</span>
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="bills.length === 0">
                <td colspan="8" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'receipt_long' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Invoices Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No billing transactions match your filter criteria or selected date.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="pagination-footer-bar" *ngIf="pagination && pagination.total > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ pagination.total }}</strong> settled invoices
          </div>

          <div class="pagination-controls">
            <button
              type="button"
              [disabled]="currentPage <= 1"
              (click)="changePage(currentPage - 1)"
              class="page-nav-btn"
              title="Previous Page"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              *ngFor="let page of pageNumbers"
              (click)="changePage(page)"
              class="page-num-btn"
              [class.is-active]="currentPage === page"
            >
              {{ page }}
            </button>

            <button
              type="button"
              [disabled]="currentPage >= pagination.totalPages"
              (click)="changePage(currentPage + 1)"
              class="page-nav-btn"
              title="Next Page"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Receipt Modal -->
      <app-receipt-modal
        [isOpen]="showReceiptModal"
        [printData]="receiptData"
        (close)="showReceiptModal = false"
      ></app-receipt-modal>
    </div>
  `,
})
export class BillsComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private billService = inject(BillService);

  public bills: Bill[] = [];
  public pagination: any = null;

  public searchQuery = '';
  public selectedPayment: any = '';
  public selectedOrderType: any = '';
  public selectedDate = '';

  public paymentOptions: DropdownOption[] = [
    { value: '', label: 'All Payment Modes', icon: 'payments' },
    { value: 'CASH', label: 'Cash Only', icon: 'payments', description: 'Hard cash transactions' },
    { value: 'UPI', label: 'UPI QR / Digital', icon: 'qr_code_2', description: 'GPay, PhonePe, Paytm' },
    { value: 'CARD', label: 'Card (POS Machine)', icon: 'credit_card', description: 'Debit & credit swipe' },
    { value: 'OTHER', label: 'Other Methods', icon: 'wallet', description: 'Vouchers, credits' },
  ];

  public pageSize = 10;
  public currentPage = 1;

  public showReceiptModal = false;
  public receiptData: any = null;

  ngOnInit(): void {
    this.loadBills(1);
  }

  loadBills(page = 1): void {
    this.isLoading = true;
    this.loadError = null;
    this.currentPage = page;
    this.billService
      .getBills(
        page,
        this.pageSize,
        this.searchQuery,
        this.selectedPayment || undefined,
        this.selectedOrderType || undefined,
        this.selectedDate || undefined,
        this.selectedDate || undefined
      )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.bills = res.data;
            this.pagination = res.pagination;
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  get totalSalesAmount(): number {
    return this.bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  }

  get avgBillAmount(): number {
    return this.bills.length === 0 ? 0 : this.totalSalesAmount / this.bills.length;
  }

  /** Share of the loaded bills paid digitally via UPI. */
  get upiSharePercent(): number {
    if (this.bills.length === 0) return 0;
    const upiCount = this.bills.filter((b) => b.payment_method === 'UPI').length;
    return (upiCount / this.bills.length) * 100;
  }

  /** Share of the loaded bills whose payment has been settled. */
  get settledSharePercent(): number {
    if (this.bills.length === 0) return 0;
    const paidCount = this.bills.filter((b) => b.payment_status === 'PAID').length;
    return (paidCount / this.bills.length) * 100;
  }

  get totalTaxCollected(): number {
    return this.bills.reduce((sum, b) => sum + (Number(b.tax_amount) || 0), 0);
  }

  get pageNumbers(): number[] {
    if (!this.pagination) return [1];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    if (!this.pagination || this.pagination.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total);
  }

  changePage(p: number): void {
    this.loadBills(p);
  }

  exportCSV(): void {
    const items = this.bills;
    const headers = ['Bill #', 'Date', 'Type', 'Customer', 'Phone', 'Payment', 'Subtotal', 'Tax', 'Grand Total'];
    const rows = items.map((b) => [
      b.bill_number,
      b.created_at,
      b.order_type,
      `"${b.customer_name || 'Walk-In'}"`,
      b.customer_phone || '',
      b.payment_method,
      b.subtotal,
      b.tax_amount,
      b.total_amount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReceipt(id: number): void {
    this.billService.getPrintData(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.receiptData = res.data;
          this.showReceiptModal = true;
        }
      },
    });
  }
}

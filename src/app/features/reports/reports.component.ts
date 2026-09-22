import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent, DatePickerComponent, PageLoaderComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Generating report…"
        subMessage="Aggregating sales records for the selected period."
        icon="analytics"
        (retry)="loadActiveReport()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Analytics & BI</span>
        <span class="breadcrumb-separator">›</span>
        <span>Financial Intelligence</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Executive Dashboard</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">query_stats</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Financial & Sales Intelligence</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>Live Analytics</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">insights</span>
                <span>Reporting Engine: <strong>Real-time Ledger</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">verified_user</span>
                <span>Audit Verified: <strong>GAAP Compliant</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadActiveReport()"
            class="action-btn btn-outline-purple"
            title="Refresh Report Data"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportToCSV()"
            class="action-btn btn-outline-purple"
            title="Export CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            (click)="printReport()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">print</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION REPORT TABS                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="activeTab = 'SALES'; loadActiveReport()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'SALES'"
        >
          <span class="material-symbols-outlined">payments</span>
          <span>Consolidated Sales</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'PRODUCTS'; loadActiveReport()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'PRODUCTS'"
        >
          <span class="material-symbols-outlined">restaurant_menu</span>
          <span>Product Performance</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'CATEGORIES'; loadActiveReport()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'CATEGORIES'"
        >
          <span class="material-symbols-outlined">category</span>
          <span>Category Breakdown</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'STOCK'; loadActiveReport()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'STOCK'"
        >
          <span class="material-symbols-outlined">warehouse</span>
          <span>Stock Valuation Ledger</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid" *ngIf="salesData?.summary as s">
        <!-- KPI 1: Net Revenue -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Net Revenue</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ s.total_sales | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-purple">{{ s.total_bills }} Bills</span>
          </div>
        </div>

        <!-- KPI 2: Gross Subtotal -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Gross Subtotal</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">point_of_sale</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ s.total_subtotal | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-blue">Pre-Tax</span>
          </div>
        </div>

        <!-- KPI 3: Discounts -->
        <div class="kpi-card card-accent-rose">
          <div class="kpi-header-row">
            <span class="kpi-title">Discounts</span>
            <span class="kpi-icon-bubble bg-rose-tint">
              <span class="material-symbols-outlined">loyalty</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-[#E11D48]">{{ s.total_discount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-rose">Conceded</span>
          </div>
        </div>

        <!-- KPI 4: GST Collected -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">GST Tax</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ s.total_tax | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-success">Collected</span>
          </div>
        </div>

        <!-- KPI 5: Avg Order Value -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Ticket</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-amber-700">
              {{ (s.total_bills > 0 ? (s.total_sales / s.total_bills) : 0) | appCurrency:'1.0-0' }}
            </span>
            <span class="kpi-pill pill-amber">Per Bill</span>
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. FILTER & SEARCH ACTION TOOLBAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <!-- Date From -->
          <div class="toolbar-date-wrapper" *ngIf="isSalesFilterable">
            <span class="toolbar-date-label">From:</span>
            <app-date-picker
              [(ngModel)]="dateFrom"
              (valueChange)="loadActiveReport()"
              [max]="dateTo"
              label="From date"
              placeholder="Start date"
              minWidth="160px"
            ></app-date-picker>
          </div>

          <!-- Date To -->
          <div class="toolbar-date-wrapper" *ngIf="isSalesFilterable">
            <span class="toolbar-date-label">To:</span>
            <app-date-picker
              [(ngModel)]="dateTo"
              (valueChange)="loadActiveReport()"
              [min]="dateFrom"
              label="To date"
              placeholder="End date"
              minWidth="160px"
            ></app-date-picker>
          </div>

          <!-- Payment Channel Filter -->
          <app-custom-dropdown
            *ngIf="isSalesFilterable"
            [options]="paymentOptions"
            [(ngModel)]="selectedPayment"
            (valueChange)="loadActiveReport()"
            placeholder="All Payment Modes"
            minWidth="180px"
          ></app-custom-dropdown>

          <!-- Order Type Filter -->
          <app-custom-dropdown
            *ngIf="isSalesFilterable"
            [options]="orderTypeOptions"
            [(ngModel)]="selectedOrderType"
            (valueChange)="loadActiveReport()"
            placeholder="All Order Types"
            minWidth="175px"
          ></app-custom-dropdown>
        </div>

        <div class="toolbar-actions-group">
          <button
            type="button"
            (click)="loadActiveReport()"
            class="action-btn btn-outline-purple"
            title="Refresh"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. REPORT DATA TABLES                                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->

      <!-- REPORT 1: Consolidated Sales -->
      <div *ngIf="activeTab === 'SALES'" class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 20%;">Sale Date</th>
                <th style="width: 16%;">Invoices Settled</th>
                <th style="width: 16%;">Gross Subtotal</th>
                <th style="width: 16%;">Discount Conceded</th>
                <th style="width: 16%;">GST / Tax</th>
                <th style="width: 16%;">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of salesData?.dailyBreakdown">
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#7E22CE]" style="font-size: 18px;">calendar_today</span>
                    <span class="font-bold text-[#2E1065] font-mono text-xs">{{ d.sale_date }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-primary font-mono">{{ d.bills_count }} invoices</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#2E1065]">{{ d.subtotal | appCurrency:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#DC2626] font-bold">- {{ d.discount | appCurrency:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#6B7280]">{{ d.tax | appCurrency:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#7E22CE]">{{ d.total_revenue | appCurrency:'1.2-2' }}</span>
                </td>
              </tr>
              <tr *ngIf="!salesData?.dailyBreakdown?.length">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">query_stats</span>
                    <div class="empty-title">No Sales Records Found</div>
                    <p class="empty-desc">No settled transactions match your selected date range.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- REPORT 2: Product Performance -->
      <div *ngIf="activeTab === 'PRODUCTS'" class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 28%;">Dish Name</th>
                <th style="width: 16%;">SKU</th>
                <th style="width: 18%;">Category</th>
                <th style="width: 12%;">Quantity Sold</th>
                <th style="width: 13%;">Total Revenue</th>
                <th style="width: 13%;">Food Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of productData">
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-bold text-xs text-[#7E22CE] shrink-0">
                      <span class="material-symbols-outlined" style="font-size: 18px;">restaurant</span>
                    </div>
                    <span class="font-bold text-[#2E1065] text-xs">{{ p.product_name }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">{{ p.sku }}</span>
                </td>
                <td>
                  <span
                    class="category-pill-badge"
                    [ngStyle]="getCategoryBadgeStyle(p.category_name)"
                  >
                    <span class="material-symbols-outlined cat-icon">{{ getCategoryIcon(p.category_name) }}</span>
                    <span>{{ p.category_name || 'General' }}</span>
                  </span>
                </td>
                <td>
                  <span class="font-mono font-bold text-xs text-[#2E1065]">{{ p.total_units_sold || p.quantity_sold }} units</span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#7E22CE]">{{ (p.total_revenue || p.revenue_generated) | appCurrency:'1.0-0' }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#6B7280]">{{ p.total_cost | appCurrency:'1.0-0' }}</span>
                </td>
              </tr>
              <tr *ngIf="!productData?.length">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">restaurant_menu</span>
                    <div class="empty-title">No Product Performance Data</div>
                    <p class="empty-desc">No item sales recorded in this interval.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- REPORT 3: Category Breakdown -->
      <div *ngIf="activeTab === 'CATEGORIES'" class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 35%;">Category</th>
                <th style="width: 20%;">Total Orders</th>
                <th style="width: 20%;">Units Sold</th>
                <th style="width: 25%;">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of categoryData">
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-bold text-xs text-[#7E22CE] shrink-0">
                      <span class="material-symbols-outlined" style="font-size: 18px;">category</span>
                    </div>
                    <span class="font-bold text-[#2E1065] text-xs">{{ c.category_name }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#2E1065]">{{ c.orders_count }} orders</span>
                </td>
                <td>
                  <span class="badge badge-primary font-mono font-bold">{{ c.total_units_sold }} units</span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#7E22CE]">{{ c.total_revenue | appCurrency:'1.0-0' }}</span>
                </td>
              </tr>
              <tr *ngIf="!categoryData?.length">
                <td colspan="4" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">category</span>
                    <div class="empty-title">No Category Data</div>
                    <p class="empty-desc">No category breakdown data available for this range.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- REPORT 4: Stock Valuation Ledger -->
      <div *ngIf="activeTab === 'STOCK'" class="space-y-4">
        <div class="kpi-cards-grid" *ngIf="stockData?.totals as t">
          <div class="kpi-card card-accent-purple">
            <div class="kpi-header-row">
              <span class="kpi-title">Total Units</span>
              <span class="kpi-icon-bubble bg-purple-tint">
                <span class="material-symbols-outlined">inventory_2</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ t.total_items_in_stock }}</span>
              <span class="kpi-pill pill-purple">Units</span>
            </div>
          </div>

          <div class="kpi-card card-accent-blue">
            <div class="kpi-header-row">
              <span class="kpi-title">Cost Valuation</span>
              <span class="kpi-icon-bubble bg-blue-tint">
                <span class="material-symbols-outlined">account_balance_wallet</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ t.total_valuation_cost | appCurrency:'1.0-0' }}</span>
              <span class="kpi-pill pill-blue">Cost Basis</span>
            </div>
          </div>

          <div class="kpi-card card-accent-green">
            <div class="kpi-header-row">
              <span class="kpi-title">Retail Potential</span>
              <span class="kpi-icon-bubble bg-green-tint">
                <span class="material-symbols-outlined">trending_up</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number text-green">{{ t.total_valuation_retail | appCurrency:'1.0-0' }}</span>
              <span class="kpi-pill pill-success">Gross Value</span>
            </div>
          </div>
        </div>

        <div class="table-container-card">
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Dish / Product</th>
                  <th style="width: 14%;">SKU</th>
                  <th style="width: 12%;">Stock Units</th>
                  <th style="width: 12%;">Cost Price</th>
                  <th style="width: 12%;">Selling Price</th>
                  <th style="width: 12%;">Cost Valuation</th>
                  <th style="width: 13%;">Retail Valuation</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of stockData?.items">
                  <td class="font-bold text-[#2E1065] text-xs">{{ s.product_name }}</td>
                  <td>
                    <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">{{ s.sku }}</span>
                  </td>
                  <td>
                    <span class="font-mono font-bold text-xs" [ngClass]="s.is_low_stock ? 'text-[#DC2626]' : 'text-[#2E1065]'">
                      {{ s.current_stock }}
                    </span>
                  </td>
                  <td class="font-mono text-xs text-[#6B7280]">{{ s.cost_price | appCurrency:'1.0-0' }}</td>
                  <td class="font-mono text-xs text-[#2E1065]">{{ s.selling_price | appCurrency:'1.0-0' }}</td>
                  <td class="font-mono text-xs text-[#6B7280]">{{ s.stock_valuation_cost | appCurrency:'1.0-0' }}</td>
                  <td class="font-mono font-bold text-xs text-[#7E22CE]">{{ s.stock_valuation_retail | appCurrency:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private reportService = inject(ReportService);

  public activeTab: 'SALES' | 'PRODUCTS' | 'CATEGORIES' | 'STOCK' = 'SALES';

  public dateFrom = '';
  public dateTo = '';
  public selectedPayment = '';
  public selectedOrderType = '';

  public paymentOptions: DropdownOption[] = [
    { value: '', label: 'All Payment Modes', icon: 'payments' },
    { value: 'CASH', label: 'CASH', icon: 'payments', description: 'Hard cash receipts' },
    { value: 'UPI', label: 'UPI / Digital', icon: 'qr_code_2', description: 'PhonePe, GPay, Paytm' },
    { value: 'CARD', label: 'CARD', icon: 'credit_card', description: 'POS card transactions' },
  ];

  public orderTypeOptions: DropdownOption[] = [
    { value: '', label: 'All Order Types', icon: 'receipt_long' },
    { value: 'DINING', label: 'Dine In', icon: 'table_restaurant', description: 'Table service' },
    { value: 'TAKEAWAY', label: 'Takeaway', icon: 'takeout_dining', description: 'Parcels, pickup & counter' },
  ];

  public salesData: any = null;
  public productData: any[] = [];
  public categoryData: any[] = [];
  public stockData: any = null;

  public isLoading = false;
  public loadError: string | null = null;

  /**
   * Whether the toolbar's filters mean anything on the current tab.
   *
   * The stock report reads current shelf levels rather than sales history,
   * so no date range or payment channel applies to it.
   */
  get isSalesFilterable(): boolean {
    return this.activeTab !== 'STOCK';
  }

  ngOnInit(): void {
    this.loadActiveReport();
  }

  loadActiveReport(): void {
    // One loader per report tab. Every branch below settles it in both the next
    // and error callbacks, so a failed report stops the spinner and shows why
    // instead of leaving the page spinning on an empty table.
    this.isLoading = true;
    this.loadError = null;

    const onError = (err: any) => {
      this.isLoading = false;
      this.loadError = err?.error?.message || 'Failed to generate this report. Please try again.';
    };

    if (this.activeTab === 'SALES') {
      this.reportService
        .getSalesReport(
          this.dateFrom || undefined,
          this.dateTo || undefined,
          this.selectedPayment || undefined,
          this.selectedOrderType || undefined
        )
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) this.salesData = res.data;
          },
          error: onError,
        });
    } else if (this.activeTab === 'PRODUCTS') {
      this.reportService
        .getProductSalesReport(
          this.dateFrom || undefined,
          this.dateTo || undefined,
          undefined,
          this.selectedPayment || undefined,
          this.selectedOrderType || undefined
        )
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) this.productData = res.data;
          },
          error: onError,
        });
    } else if (this.activeTab === 'CATEGORIES') {
      this.reportService
        .getCategorySalesReport(
          this.dateFrom || undefined,
          this.dateTo || undefined,
          this.selectedPayment || undefined,
          this.selectedOrderType || undefined
        )
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            if (res.success) this.categoryData = res.data;
          },
          error: onError,
        });
    } else if (this.activeTab === 'STOCK') {
      this.reportService.getStockReport().subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) this.stockData = res.data;
        },
        error: onError,
      });
    } else {
      this.isLoading = false;
    }
  }

  printReport(): void {
    window.print();
  }

  exportToCSV(): void {
    let csv = '';
    if (this.activeTab === 'SALES' && this.salesData?.dailyBreakdown) {
      csv = 'Date,Invoices,Subtotal,Discount,Tax,TotalRevenue\n';
      for (const d of this.salesData.dailyBreakdown) {
        csv += `${d.sale_date},${d.bills_count},${d.subtotal},${d.discount},${d.tax},${d.total_revenue}\n`;
      }
    } else if (this.activeTab === 'PRODUCTS') {
      csv = 'Dish,SKU,Category,QuantitySold,Revenue,Cost\n';
      for (const p of this.productData) {
        csv += `"${p.product_name}",${p.sku},"${p.category_name}",${p.total_units_sold || p.quantity_sold},${p.total_revenue || p.revenue_generated},${p.total_cost}\n`;
      }
    } else {
      csv = 'Report Export\nGenerated at ' + new Date().toISOString() + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `_pos_report_${this.activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getCategoryBadgeStyle(categoryName?: string): { [key: string]: string } {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
      return {
        'background-color': '#FFFBEB',
        'color': '#B45309',
        'border': '1px solid #FDE68A'
      };
    }
    if (cat.includes('chicken') || cat.includes('meat') || cat.includes('mutton') || cat.includes('beef') || cat.includes('grill')) {
      return {
        'background-color': '#FAF5FF',
        'color': '#7E22CE',
        'border': '1px solid #E9D5FF'
      };
    }
    if (cat.includes('appetizer') || cat.includes('salad') || cat.includes('soup') || cat.includes('veg')) {
      return {
        'background-color': '#F0FDF4',
        'color': '#15803D',
        'border': '1px solid #BBF7D0'
      };
    }
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('cake') || cat.includes('ice')) {
      return {
        'background-color': '#FFF1F2',
        'color': '#BE123C',
        'border': '1px solid #FECDD3'
      };
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee')) {
      return {
        'background-color': '#F0FDFA',
        'color': '#0F766E',
        'border': '1px solid #99F6E4'
      };
    }
    if (cat.includes('sea') || cat.includes('fish') || cat.includes('prawn')) {
      return {
        'background-color': '#EFF6FF',
        'color': '#1D4ED8',
        'border': '1px solid #BFDBFE'
      };
    }
    return {
      'background-color': '#EEF2FF',
      'color': '#4338CA',
      'border': '1px solid #C7D2FE'
    };
  }

  getCategoryIcon(categoryName?: string): string {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
      return 'rice_bowl';
    }
    if (cat.includes('chicken') || cat.includes('meat') || cat.includes('mutton') || cat.includes('beef') || cat.includes('grill')) {
      return 'kebab_dining';
    }
    if (cat.includes('appetizer') || cat.includes('salad') || cat.includes('soup') || cat.includes('veg')) {
      return 'lunch_dining';
    }
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('cake') || cat.includes('ice')) {
      return 'icecream';
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee')) {
      return 'local_cafe';
    }
    if (cat.includes('sea') || cat.includes('fish') || cat.includes('prawn')) {
      return 'set_meal';
    }
    return 'category';
  }
}

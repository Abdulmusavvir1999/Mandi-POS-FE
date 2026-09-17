import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
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
          <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span class="font-bold">From:</span>
            <input
              title="From date"
              type="date"
              [(ngModel)]="dateFrom"
              (ngModelChange)="loadActiveReport()"
              class="toolbar-search-input !w-auto"
            />
          </div>

          <!-- Date To -->
          <div class="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span class="font-bold">To:</span>
            <input
              title="To date"
              type="date"
              [(ngModel)]="dateTo"
              (ngModelChange)="loadActiveReport()"
              class="toolbar-search-input !w-auto"
            />
          </div>

          <!-- Payment Channel Filter -->
          <app-custom-dropdown
            [options]="paymentOptions"
            [(ngModel)]="selectedPayment"
            (valueChange)="loadActiveReport()"
            placeholder="All Payment Modes"
            minWidth="180px"
          ></app-custom-dropdown>

          <!-- Order Type Filter -->
          <app-custom-dropdown
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
                  <span class="badge badge-primary">{{ p.category_name }}</span>
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
    { value: 'WALK_IN', label: 'Walk-In Counter', icon: 'storefront', description: 'Takeaway counter' },
    { value: 'TAKEAWAY', label: 'Takeaway Parcel', icon: 'takeout_dining', description: 'Packed orders' },
    { value: 'DINING', label: 'Dine-In Restaurant', icon: 'table_restaurant', description: 'Table seating' },
  ];

  public salesData: any = null;
  public productData: any[] = [];
  public categoryData: any[] = [];
  public stockData: any = null;

  ngOnInit(): void {
    this.loadActiveReport();
  }

  loadActiveReport(): void {
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
            if (res.success) this.salesData = res.data;
          },
        });
    } else if (this.activeTab === 'PRODUCTS') {
      this.reportService.getProductSalesReport(this.dateFrom || undefined, this.dateTo || undefined).subscribe({
        next: (res) => {
          if (res.success) this.productData = res.data;
        },
      });
    } else if (this.activeTab === 'CATEGORIES') {
      this.reportService.getCategorySalesReport(this.dateFrom || undefined, this.dateTo || undefined).subscribe({
        next: (res) => {
          if (res.success) this.categoryData = res.data;
        },
      });
    } else if (this.activeTab === 'STOCK') {
      this.reportService.getStockReport().subscribe({
        next: (res) => {
          if (res.success) this.stockData = res.data;
        },
      });
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
    a.download = `mandi_pos_report_${this.activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockItem, StockTransaction, Product } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Inventory Management</span>
        <span class="breadcrumb-separator">›</span>
        <span>Stock Levels</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Ledger & Alerts</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">warehouse</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Stock & Inventory Control</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ totalStockUnits }} Total Units Live</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">inventory_2</span>
                <span>Tracked SKUs: <strong>{{ stockItems.length }} Items</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">payments</span>
                <span>Valuation: <strong>{{ stockValuation | appCurrency:'1.0-0' }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="refreshActiveTab()"
            class="action-btn btn-outline-purple"
            title="Refresh Stock Ledger"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="openAdjustModal()"
            class="action-btn btn-outline-purple"
            title="Perform Audit Adjustment"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>⚖ Adjust Audit</span>
          </button>

          <button
            type="button"
            (click)="openStockInModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>+ Stock In (Purchase)</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION TABS                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="activeTab = 'INVENTORY'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'INVENTORY'"
        >
          <span class="material-symbols-outlined">inventory_2</span>
          <span>Inventory Ledger</span>
          <span class="tab-count-badge">{{ stockItems.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'LOW_STOCK'; currentPage = 1; loadLowStock()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'LOW_STOCK'"
        >
          <span class="material-symbols-outlined">warning</span>
          <span>Low Stock Alerts</span>
          <span class="tab-count-badge" [class.text-[#DC2626]]="lowStockList.length > 0">{{ lowStockList.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'TRANSACTIONS'; currentPage = 1; loadTransactions()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'TRANSACTIONS'"
        >
          <span class="material-symbols-outlined">history</span>
          <span>Movement Logs</span>
          <span class="tab-count-badge">{{ transactions.length }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Tracked Items</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">inventory_2</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ stockItems.length }}</span>
            <span class="kpi-pill pill-purple">SKUs</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Units In Stock</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">warehouse</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ totalStockUnits }}</span>
            <span class="kpi-pill pill-live">● Live</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Low Stock</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">warning</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number" [ngClass]="lowStockList.length > 0 ? 'text-[#DC2626]' : ''">{{ lowStockList.length }}</span>
            <span class="kpi-pill pill-amber">Alerts</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Valuation</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ stockValuation | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-purple">Value</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Transactions</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">swap_horiz</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ transactions.length }}</span>
            <span class="kpi-pill pill-blue">Audited</span>
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
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              placeholder="Search items by SKU, name, or category..."
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; currentPage = 1"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ getCurrentTotal() }} records
          </span>
        </div>

        <div class="toolbar-actions-group">
          <button
            type="button"
            (click)="refreshActiveTab()"
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
      <!-- 5. STOCK DATA TABLES                                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->

      <!-- TAB 1: Inventory Table -->
      <div class="table-container-card" *ngIf="activeTab === 'INVENTORY'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 28%;">Product & SKU</th>
                <th style="width: 16%;">SKU Code</th>
                <th style="width: 16%;">Category</th>
                <th style="width: 14%;">Stock Status</th>
                <th style="width: 14%;">Selling Price</th>
                <th style="width: 14%;">Current Stock</th>
                <th style="width: 60px; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of paginatedStockItems">
                <!-- Product Name & Avatar -->
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[var(--primary-light)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs text-[var(--primary)] shrink-0 shadow-xs">
                      <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--text-main)] text-xs truncate">{{ s.product_name }}</div>
                      <div class="text-[10px] text-[var(--text-muted)]">Min Alert: {{ s.min_stock_alert }} units</div>
                    </div>
                  </div>
                </td>

                <!-- SKU -->
                <td>
                  <span class="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--bg-app)] px-2 py-0.5 rounded-md border border-[var(--card-border)]">
                    {{ s.sku }}
                  </span>
                </td>

                <!-- Category -->
                <td>
                  <span class="badge badge-primary">
                    {{ s.category_name || 'General' }}
                  </span>
                </td>

                <!-- Status Pill -->
                <td>
                  <span class="status-dot-pill" [ngClass]="s.is_low_stock ? 'is-danger' : 'is-active'">
                    <span class="status-dot"></span>
                    {{ s.is_low_stock ? 'Low Stock' : 'Optimal' }}
                  </span>
                </td>

                <!-- Selling Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-[var(--text-main)]">
                    {{ s.selling_price | appCurrency:'1.0-0' }}
                  </span>
                </td>

                <!-- Stock Level Progress -->
                <td>
                  <div class="space-y-1 max-w-[120px]">
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="font-mono font-bold" [ngClass]="s.is_low_stock ? 'text-[#DC2626]' : 'text-[var(--text-main)]'">
                        {{ s.current_stock }} units
                      </span>
                    </div>
                    <div class="w-full bg-[var(--card-border)] rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [style.width.%]="calcStockPercent(s.current_stock, s.min_stock_alert)"
                        [ngClass]="{
                          '!bg-[#DC2626]': s.current_stock <= 0,
                          '!bg-[#EA580C]': s.current_stock > 0 && s.current_stock <= s.min_stock_alert,
                          '!bg-[#16A34A]': s.current_stock > s.min_stock_alert
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Action Button -->
                <td style="text-align: center;">
                  <button
                    type="button"
                    (click)="quickStockIn(s)"
                    class="action-btn btn-outline-purple !py-1 !px-2 !text-xs !text-[#16A34A] hover:!bg-[#DCFCE7]"
                  >
                    + In
                  </button>
                </td>
              </tr>

              <tr *ngIf="filteredStockItems.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'warehouse' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Stock Items Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No inventory records match your query.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: Low Stock Alerts Table -->
      <div class="table-container-card" *ngIf="activeTab === 'LOW_STOCK'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 35%;">Product & SKU</th>
                <th style="width: 20%;">SKU Code</th>
                <th style="width: 20%;">Category</th>
                <th style="width: 15%;">Stock Level vs Min Threshold</th>
                <th style="width: 10%; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of paginatedLowStockList">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center font-bold text-xs text-[#DC2626] shrink-0 shadow-xs">
                      <span class="material-symbols-outlined" style="font-size: 20px;">warning</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--text-main)] text-xs truncate">{{ s.product_name }}</div>
                      <div class="text-[10px] text-[#DC2626] font-semibold">Immediate attention needed</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="font-mono text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-md border border-[#FECACA]">
                    {{ s.sku }}
                  </span>
                </td>
                <td>
                  <span class="text-xs text-[var(--text-muted)]">{{ s.category_name || 'General' }}</span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#DC2626]">
                    {{ s.current_stock }} / Min {{ s.min_stock_alert }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <button
                    type="button"
                    (click)="quickStockIn(s)"
                    class="action-btn btn-gradient-purple !py-1 !px-3 !text-xs"
                  >
                    Restock
                  </button>
                </td>
              </tr>

              <tr *ngIf="lowStockList.length === 0">
                <td colspan="5" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon !text-[#16A34A]">verified</span>
                    <div class="empty-title text-[#16A34A]">All Stock Healthy</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'All tracked products are currently stocked above their minimum alert levels.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: Movement Logs Table -->
      <div class="table-container-card" *ngIf="activeTab === 'TRANSACTIONS'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 20%;">Date & Time</th>
                <th style="width: 24%;">Product / Item</th>
                <th style="width: 14%;">Transaction Type</th>
                <th style="width: 14%;">Quantity Changed</th>
                <th style="width: 14%;">Stock Shift</th>
                <th style="width: 14%; text-align: right;">Author / Staff</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of paginatedTransactions">
                <td class="text-xs text-[#6B7280] font-mono">
                  {{ tx.created_at | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
                <td class="font-bold text-xs text-[#2E1065]">
                  {{ tx.product_name }}
                </td>
                <td>
                  <span class="badge"
                    [ngClass]="{
                      'badge-success': tx.transaction_type === 'STOCK_IN',
                      'badge-danger': tx.transaction_type === 'SALE',
                      'badge-warning': tx.transaction_type === 'ADJUSTMENT',
                      'badge-info': tx.transaction_type === 'RETURN'
                    }"
                  >
                    {{ tx.transaction_type }}
                  </span>
                </td>
                <td class="font-mono font-bold text-xs" [ngClass]="tx.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'">
                  {{ tx.quantity > 0 ? '+' + tx.quantity : tx.quantity }} units
                </td>
                <td class="font-mono text-xs text-[#2E1065]">
                  {{ tx.previous_stock }} → <strong>{{ tx.new_stock }}</strong>
                </td>
                <td style="text-align: right;" class="text-xs font-semibold text-[#2E1065]">
                  {{ tx.created_by_name || 'System Auto' }}
                </td>
              </tr>

              <tr *ngIf="filteredTransactions.length === 0">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'history' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Movement Logs' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No stock adjustment or sale logs match your query.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. BOTTOM PAGINATION BAR                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pagination-footer-bar" *ngIf="getCurrentTotal() > 0">
        <div class="pagination-info">
          Showing <strong>{{ paginationStart(getCurrentTotal()) }}</strong> to <strong>{{ paginationEnd(getCurrentTotal()) }}</strong> of <strong>{{ getCurrentTotal() }}</strong> records
        </div>

        <div class="pagination-controls">
          <button
            type="button"
            [disabled]="currentPage <= 1"
            (click)="currentPage = currentPage - 1"
            class="page-nav-btn"
            title="Previous Page"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <button
            type="button"
            *ngFor="let page of getPageNumbers(getCurrentTotal())"
            (click)="currentPage = page"
            class="page-num-btn"
            [class.is-active]="currentPage === page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            [disabled]="currentPage >= getTotalPages(getCurrentTotal())"
            (click)="currentPage = currentPage + 1"
            class="page-nav-btn"
            title="Next Page"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 7. STOCK IN (PURCHASE) MODAL                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showStockInModal">
        <div class="modal-content p-6 max-w-md">
          <div class="flex items-center justify-between pb-3 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[#16A34A] text-2xl">add_shopping_cart</span>
              <h3 class="text-lg font-black text-[#2E1065]">Stock Addition (Purchase)</h3>
            </div>
            <button
              type="button"
              (click)="showStockInModal = false"
              class="text-[#6B7280] hover:text-[#2E1065] p-1 rounded-lg hover:bg-[#F3E8FF]"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitStockIn()" class="space-y-4 py-4">
            <div class="form-group">
              <label class="form-label">Select Dish / Product</label>
              <select [(ngModel)]="stockInForm.productId" name="productId" class="form-control" required>
                <option *ngFor="let p of allProducts" [ngValue]="p.id">{{ p.name }} (Current: {{ p.current_stock }})</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Quantity to Add</label>
              <input
                type="number"
                min="1"
                [(ngModel)]="stockInForm.quantity"
                name="quantity"
                class="form-control font-mono font-bold text-[#16A34A] text-lg"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Supplier Name</label>
                <input
                  type="text"
                  [(ngModel)]="stockInForm.supplier"
                  name="supplier"
                  placeholder="e.g. Al-Madina Farms"
                  class="form-control"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Invoice #</label>
                <input
                  type="text"
                  [(ngModel)]="stockInForm.invoiceNumber"
                  name="invoiceNumber"
                  placeholder="e.g. PO-8921"
                  class="form-control font-mono"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showStockInModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Add Stock ✓
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 8. STOCK ADJUSTMENT MODAL                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showAdjustModal">
        <div class="modal-content p-6 max-w-md">
          <div class="flex items-center justify-between pb-3 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[#7E22CE] text-2xl">tune</span>
              <h3 class="text-lg font-black text-[#2E1065]">Stock Audit Adjustment</h3>
            </div>
            <button
              type="button"
              (click)="showAdjustModal = false"
              class="text-[#6B7280] hover:text-[#2E1065] p-1 rounded-lg hover:bg-[#F3E8FF]"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitAdjust()" class="space-y-4 py-4">
            <div class="form-group">
              <label class="form-label">Select Dish / Product</label>
              <select [(ngModel)]="adjustForm.productId" name="productId" class="form-control" required>
                <option *ngFor="let p of allProducts" [ngValue]="p.id">{{ p.name }} (Current: {{ p.current_stock }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Action Type</label>
                <select [(ngModel)]="adjustForm.adjustmentType" name="adjustmentType" class="form-control">
                  <option value="INCREASE">INCREASE (+)</option>
                  <option value="DECREASE">DECREASE (-)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="adjustForm.quantity"
                  name="quantity"
                  class="form-control font-mono font-bold text-[#7E22CE]"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Mandatory Audit Reason</label>
              <input
                type="text"
                [(ngModel)]="adjustForm.reason"
                name="reason"
                placeholder="e.g. Physical count correction, wastage, breakage"
                class="form-control"
                required
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showAdjustModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .action-icon-btn {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
      }
    `
  ]
})
export class StockComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private stockService = inject(StockService);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);

  public activeTab: 'INVENTORY' | 'LOW_STOCK' | 'TRANSACTIONS' = 'INVENTORY';

  public stockItems: StockItem[] = [];
  public lowStockList: any[] = [];
  public transactions: StockTransaction[] = [];
  public allProducts: Product[] = [];

  public searchQuery = '';
  public pageSize = 10;
  public currentPage = 1;

  public showStockInModal = false;
  public showAdjustModal = false;

  public stockInForm: any = {
    productId: 1,
    quantity: 10,
    supplier: '',
    invoiceNumber: '',
  };

  public adjustForm: any = {
    productId: 1,
    adjustmentType: 'INCREASE',
    quantity: 1,
    reason: '',
  };

  ngOnInit(): void {
    this.loadInventory();
    this.loadAllProducts();
  }

  refreshActiveTab(): void {
    if (this.activeTab === 'INVENTORY') this.loadInventory();
    else if (this.activeTab === 'LOW_STOCK') this.loadLowStock();
    else this.loadTransactions();
  }

  loadInventory(): void {
    this.isLoading = true;
    this.loadError = null;
    this.stockService.getStock(1, 200).subscribe({
      next: (res) => {
          this.isLoading = false;
        if (res.success) this.stockItems = res.data;
      },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  loadLowStock(): void {
    this.stockService.getLowStockAlerts().subscribe({
      next: (res) => {
        if (res.success) this.lowStockList = res.data;
      },
    });
  }

  loadTransactions(): void {
    this.stockService.getTransactions(1, 200).subscribe({
      next: (res) => {
        if (res.success) this.transactions = res.data;
      },
    });
  }

  loadAllProducts(): void {
    this.productService.getProducts(1, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.allProducts = res.data;
          if (this.allProducts.length > 0) {
            this.stockInForm.productId = this.allProducts[0].id;
            this.adjustForm.productId = this.allProducts[0].id;
          }
        }
      },
    });
  }

  get totalStockUnits(): number {
    return this.stockItems.reduce((sum, s) => sum + s.current_stock, 0);
  }

  get stockValuation(): number {
    return this.stockItems.reduce((sum, s) => sum + (s.current_stock * s.selling_price), 0);
  }

  get filteredStockItems(): StockItem[] {
    if (!this.searchQuery) return this.stockItems;
    const q = this.searchQuery.toLowerCase();
    return this.stockItems.filter(
      (s) => s.product_name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q)
    );
  }

  get paginatedStockItems(): StockItem[] {
    const list = this.filteredStockItems;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get paginatedLowStockList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.lowStockList.slice(start, start + this.pageSize);
  }

  get filteredTransactions(): StockTransaction[] {
    if (!this.searchQuery) return this.transactions;
    const q = this.searchQuery.toLowerCase();
    return this.transactions.filter(
      (t) => t.product_name.toLowerCase().includes(q) || (t.reference_id && t.reference_id.toLowerCase().includes(q))
    );
  }

  get paginatedTransactions(): StockTransaction[] {
    const list = this.filteredTransactions;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  getCurrentTotal(): number {
    if (this.activeTab === 'INVENTORY') return this.filteredStockItems.length;
    if (this.activeTab === 'LOW_STOCK') return this.lowStockList.length;
    return this.filteredTransactions.length;
  }

  getTotalPages(totalItems: number): number {
    return Math.ceil(totalItems / this.pageSize) || 1;
  }

  getPageNumbers(totalItems: number): number[] {
    return Array.from({ length: this.getTotalPages(totalItems) }, (_, i) => i + 1);
  }

  paginationStart(totalItems: number): number {
    return totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  paginationEnd(totalItems: number): number {
    return Math.min(this.currentPage * this.pageSize, totalItems);
  }

  calcStockPercent(curr: number, low: number): number {
    const max = Math.max(low * 3, 50);
    return Math.min(100, Math.max(0, (curr / max) * 100));
  }

  exportCSV(): void {
    const items = this.filteredStockItems;
    const headers = ['SKU', 'Product Name', 'Category', 'Selling Price', 'Current Stock', 'Min Alert'];
    const rows = items.map((s) => [s.sku, `"${s.product_name}"`, `"${s.category_name || ''}"`, s.selling_price, s.current_stock, s.min_stock_alert]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openStockInModal(): void {
    this.showStockInModal = true;
  }

  quickStockIn(item: any): void {
    this.stockInForm.productId = item.product_id || item.id;
    this.showStockInModal = true;
  }

  openAdjustModal(): void {
    this.showAdjustModal = true;
  }

  submitStockIn(): void {
    if (!this.stockInForm.quantity || this.stockInForm.quantity <= 0) {
      this.notify.error('Please enter valid quantity');
      return;
    }

    this.stockService.stockIn(this.stockInForm).subscribe({
      next: (res) => {
        this.notify.success(`Added ${res.data.addedQuantity} units to ${res.data.productName}`);
        this.showStockInModal = false;
        this.loadInventory();
        this.loadAllProducts();
      },
    });
  }

  submitAdjust(): void {
    if (!this.adjustForm.reason) {
      this.notify.error('Please provide an adjustment reason');
      return;
    }

    this.stockService.adjustStock(this.adjustForm).subscribe({
      next: () => {
        this.notify.success('Stock adjusted successfully');
        this.showAdjustModal = false;
        this.loadInventory();
        this.loadAllProducts();
      },
    });
  }
}

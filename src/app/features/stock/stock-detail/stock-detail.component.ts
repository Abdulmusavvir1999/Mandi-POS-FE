import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { StockService } from '../../../core/services/stock.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { VendorService } from '../../../core/services/vendor.service';
import { StockItem, StockEntry, StockMovement, Vendor, StockUnitType } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe, PageLoaderComponent, ActionLoadingDirective],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading stock item…"
        subMessage="Fetching purchase entries and movement history."
        icon="inventory_2"
        (retry)="loadItemData()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & NAVIGATION                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>Inventory</span>
        <span class="breadcrumb-separator">›</span>
        <a routerLink="/stock" class="breadcrumb-link">Stock Management</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ stockItem?.name || 'Item Ledger Details' }}</span>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. HERO ITEM HEADER CARD                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-header-card">
        <div class="header-left">
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="back-btn"
              title="Back to Stock List"
              aria-label="Back to Stock List"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>

            <div class="header-icon-box !w-12 !h-12 !rounded-2xl">
              <span class="material-symbols-outlined !text-2xl">inventory_2</span>
            </div>
          </div>

          <div>
            <div class="header-title-flex flex-wrap items-center gap-2">
              <h1 class="page-title text-2xl font-black text-[var(--text-main)]">{{ stockItem?.name || 'Loading Stock Item...' }}</h1>
              
              <span *ngIf="stockItem?.stock_code" class="font-mono text-xs font-bold text-[var(--primary)] bg-purple-50 px-2.5 py-1 rounded-md border border-[var(--card-border)]">
                {{ stockItem?.stock_code }}
              </span>

              <span *ngIf="stockItem?.unit_type" class="badge badge-primary uppercase font-mono text-[10px]">
                {{ stockItem?.unit_type }}
              </span>

              <span
                *ngIf="stockItem"
                class="status-dot-pill"
                [ngClass]="{
                  'is-active': (stockItem.current_quantity || 0) > (stockItem.min_stock_alert || 0),
                  '!bg-[#FEF2F2] !border-[#FECACA] !text-[#DC2626]': (stockItem.current_quantity || 0) <= (stockItem.min_stock_alert || 0)
                }"
              >
                <span
                  class="status-dot"
                  [ngClass]="(stockItem.current_quantity || 0) <= (stockItem.min_stock_alert || 0) ? '!bg-[#DC2626]' : ''"
                ></span>
                <span>
                  {{ (stockItem.current_quantity || 0) <= (stockItem.min_stock_alert || 0) ? 'Low Stock Warning' : 'Healthy Stock Level' }}
                </span>
              </span>
            </div>

            <div class="header-meta-row mt-1">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">tune</span>
                <span>Min Alert Threshold: <strong>{{ stockItem?.min_stock_alert || 0 }} {{ stockItem?.unit_type || 'units' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">calculate</span>
                <span>Multiplier: <strong>{{ stockItem?.default_multiplier || 1 }}x</strong></span>
              </span>
              <span class="meta-dot" *ngIf="stockItem?.category_name">•</span>
              <span class="meta-item" *ngIf="stockItem?.category_name">
                <span class="material-symbols-outlined meta-icon">category</span>
                <span>Category: <strong>{{ stockItem?.category_name }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">receipt_long</span>
                <span>Ledger Batches: <strong>{{ entries.length }} recorded</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadItemData()"
            class="action-btn btn-outline-purple"
            title="Refresh Data"
          >
            <span class="material-symbols-outlined" [class.animate-spin]="isLoading">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportItemCSV()"
            class="action-btn btn-outline-purple"
            title="Export Item Ledger to CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            (click)="openAdjustModal()"
            class="action-btn btn-outline-purple"
            title="Adjust Stock or Record Wastage"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>Adjust / Wastage</span>
          </button>

          <button
            type="button"
            (click)="openPurchaseModal()"
            class="action-btn btn-gradient-purple"
            title="Add Purchase Entry Batch"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>Purchase Entry (Stock In)</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. KPI METRIC MINI CARDS STRIP                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1: Current Live Quantity -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Current Stock Balance</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">warehouse</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">
              {{ (stockItem?.current_quantity || 0) | number:'1.0-3' }}
            </span>
            <span class="kpi-pill pill-live">● Live Balance</span>
          </div>
        </div>

        <!-- KPI 2: Total Valuation -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Inventory Valuation</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">
              {{ (stockItem?.current_value || 0) | appCurrency:'1.0-2' }}
            </span>
            <span class="kpi-pill pill-purple">Total Worth</span>
          </div>
        </div>

        <!-- KPI 3: Weighted Avg Unit Cost -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Weighted Average Cost</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-950 font-black">
              {{ (stockItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}
            </span>
            <span class="kpi-pill pill-purple">/ {{ stockItem?.unit_type || 'unit' }}</span>
          </div>
        </div>

        <!-- KPI 4: Total Batches Logged -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Purchase Batches In</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ entries.length }}</span>
            <span class="kpi-pill pill-blue">Invoices Logged</span>
          </div>
        </div>

        <!-- KPI 5: Total Movements -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Audit Trail Events</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">history</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ movements.length }}</span>
            <span class="kpi-pill pill-amber">Audit Logs</span>
          </div>
        </div>

        <!-- KPI 6: Min Alert Threshold -->
        <div class="kpi-card card-accent-rose">
          <div class="kpi-header-row">
            <span class="kpi-title">Min Alert Threshold</span>
            <span class="kpi-icon-bubble bg-rose-tint">
              <span class="material-symbols-outlined">notification_important</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-rose-700">{{ stockItem?.min_stock_alert || 0 }}</span>
            <span class="kpi-pill pill-rose">{{ stockItem?.unit_type || 'units' }}</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. SUB-NAVIGATION TABS (LEDGER vs AUDIT vs PROFILE)             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <!-- Tab 1: Purchase Entries (Ledger History) -->
        <button
          type="button"
          (click)="activeTab = 'ENTRIES'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'ENTRIES'"
        >
          <span class="material-symbols-outlined">shopping_cart_checkout</span>
          <span>1. Purchase Entries (Ledger History)</span>
          <span class="tab-count-badge">{{ entries.length }}</span>
        </button>

        <!-- Tab 2: Movements (Audit Trail) -->
        <button
          type="button"
          (click)="activeTab = 'MOVEMENTS'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'MOVEMENTS'"
        >
          <span class="material-symbols-outlined">history</span>
          <span>2. Stock Movements (Audit Trail)</span>
          <span class="tab-count-badge">{{ movements.length }}</span>
        </button>

        <!-- Tab 3: Item Master Profile & Settings -->
        <button
          type="button"
          (click)="activeTab = 'PROFILE'"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'PROFILE'"
        >
          <span class="material-symbols-outlined">badge</span>
          <span>3. Master Item Specifications</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. FILTER & SEARCH TOOLBAR                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card" *ngIf="activeTab !== 'PROFILE'">
        <div class="filter-controls-group">
          <!-- Search Box -->
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search logs"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              [placeholder]="activeTab === 'ENTRIES' ? 'Search entries by number, vendor...' : 'Search movements by reference, notes, author...'"
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

          <!-- Movement Type Filter (Only for Movements Tab) -->
          <app-custom-dropdown
            *ngIf="activeTab === 'MOVEMENTS'"
            [options]="movementFilterOptions"
            [(ngModel)]="selectedMovementType"
            (valueChange)="currentPage = 1"
            placeholder="All Movement Types"
            minWidth="240px"
          ></app-custom-dropdown>

          <!-- Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ getCurrentTotal() }} records
          </span>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. TAB CONTENT: PURCHASE ENTRIES LEDGER                         -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card" *ngIf="activeTab === 'ENTRIES'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Entry # & Date</th>
                <th style="width: 18%;">Formula (Qty × Multiplier)</th>
                <th style="width: 14%;">Total Units Added</th>
                <th style="width: 14%;">Total Batch Price</th>
                <th style="width: 14%;">Resulting Unit Cost</th>
                <th style="width: 16%;">Source & Vendor</th>
                <th style="width: 10%;">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedEntries" (click)="viewEntryDetail(entry)" class="cursor-pointer hover:bg-[#FAF5FF] transition-colors" title="Click to view full entry details">
                <!-- Entry # & Date -->
                <td>
                  <div class="font-mono text-xs font-bold text-[#2E1065]">{{ entry.entry_number }}</div>
                  <div class="text-[10px] text-[#6B7280] font-mono">{{ entry.entry_date | date:'dd/MM/yyyy HH:mm' }}</div>
                </td>

                <!-- Formula -->
                <td>
                  <div class="font-mono text-xs text-[#2E1065]">
                    <strong>{{ entry.quantity }}</strong> × {{ entry.multiplier }}
                  </div>
                  <div class="text-[10px] text-[var(--text-muted)]">Base Qty × Multiplier</div>
                </td>

                <!-- Total Units Added -->
                <td>
                  <span class="font-mono font-black text-xs text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-md border border-[#BBF7D0]">
                    +{{ entry.total_quantity | number:'1.0-3' }} {{ stockItem?.unit_type }}s
                  </span>
                </td>

                <!-- Total Batch Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-purple-900">
                    {{ entry.total_price | appCurrency:'1.0-2' }}
                  </span>
                </td>

                <!-- Resulting Unit Cost -->
                <td>
                  <span class="font-mono font-bold text-xs text-[#2E1065]">
                    {{ entry.unit_price | appCurrency:'1.0-4' }} <span class="text-[10px] text-[var(--text-muted)]">/ {{ stockItem?.unit_type }}</span>
                  </span>
                </td>

                <!-- Source, and the vendor behind it when there is one. -->
                <td>
                  <span class="stock-source-chip" [class.is-vendor]="entry.supplier === 'Vendor'">
                    <span class="material-symbols-outlined text-[13px]">{{ entry.supplier === 'Vendor' ? 'local_shipping' : 'inventory_2' }}</span>
                    {{ entry.supplier || 'Initial Setup' }}
                  </span>
                  <div class="text-[10px] text-[var(--text-muted)] truncate mt-1" *ngIf="entry.vendor_name">{{ entry.vendor_name }}</div>
                </td>

                <!-- Recorded By -->
                <td class="text-xs font-semibold text-[#6B21A8]">
                  {{ entry.created_by_name || 'System' }}
                </td>
              </tr>

              <tr *ngIf="filteredEntries.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : 'receipt_long' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : 'No Purchase Entries Recorded' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from server…' : 'No purchase entries recorded for this stock item yet.' }}</p>
                    <button
                      *ngIf="!isLoading"
                      type="button"
                      (click)="openPurchaseModal()"
                      class="action-btn btn-gradient-purple mt-3"
                    >
                      Record First Purchase Batch
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 7. TAB CONTENT: STOCK MOVEMENTS AUDIT TRAIL                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card" *ngIf="activeTab === 'MOVEMENTS'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Date & Time</th>
                <th style="width: 12%;">Movement Type</th>
                <th style="width: 16%;">Reference / Cause</th>
                <th style="width: 14%;">Quantity Moved</th>
                <th style="width: 14%;">Unit Cost & Impact</th>
                <th style="width: 16%;">Stock Balance After</th>
                <th style="width: 14%;">Author & Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let move of paginatedMovements" (click)="viewMovementDetail(move)" class="cursor-pointer hover:bg-[#FAF5FF] transition-colors" title="Click to view movement audit details">
                <!-- Date & Time -->
                <td class="text-xs text-[#6B7280] font-mono">
                  {{ move.movement_date | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>

                <!-- Movement Type -->
                <td>
                  <span
                    class="badge uppercase font-bold text-[10px]"
                    [ngClass]="{
                      'badge-success': move.movement_type === 'in',
                      'badge-danger': move.movement_type === 'out',
                      'badge-warning': move.movement_type === 'adjustment',
                      'badge-info': move.movement_type === 'return',
                      'bg-rose-100 text-rose-800 border border-rose-200': move.movement_type === 'wastage',
                      'bg-cyan-100 text-cyan-800 border border-cyan-200': move.movement_type === 'transfer_in' || move.movement_type === 'transfer_out'
                    }"
                  >
                    {{ move.movement_type }}
                  </span>
                </td>

                <!-- Reference / Cause -->
                <td>
                  <div class="font-mono text-xs font-bold text-[#2E1065]">{{ move.reference_type || 'DIRECT_ACTION' }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ move.reference_id || 'ID: #' + move.id }}</div>
                </td>

                <!-- Quantity Moved -->
                <td class="font-mono font-bold text-xs" [ngClass]="move.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'">
                  {{ move.quantity > 0 ? '+' + (move.quantity | number:'1.0-3') : (move.quantity | number:'1.0-3') }} {{ stockItem?.unit_type }}
                </td>

                <!-- Unit Cost & Impact -->
                <td>
                  <div class="font-mono text-xs font-semibold text-[var(--text-main)]">{{ move.unit_price | appCurrency:'1.0-2' }}/unit</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">Impact: {{ move.total_value | appCurrency:'1.0-2' }}</div>
                </td>

                <!-- Stock Balance After -->
                <td>
                  <div class="font-mono text-xs font-black text-purple-950">
                    {{ move.balance_quantity | number:'1.0-3' }} {{ stockItem?.unit_type }}
                  </div>
                  <div class="text-[10px] text-purple-700 font-mono font-medium">
                    Val: {{ move.balance_value | appCurrency:'1.0-2' }}
                  </div>
                </td>

                <!-- Author & Notes -->
                <td>
                  <div class="text-xs font-semibold text-[#2E1065]">{{ move.created_by_name || 'System' }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">{{ move.notes || '—' }}</div>
                </td>
              </tr>

              <tr *ngIf="filteredMovements.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : 'history' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : 'No Movement Logs Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching audit logs…' : 'No movements match your search filter.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 8. TAB CONTENT: MASTER ITEM PROFILE SPECIFICATIONS              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" *ngIf="activeTab === 'PROFILE' && stockItem">
        <!-- Card 1: Core Master Info -->
        <div class="p-6 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-[#E9D5FF]">
            <span class="material-symbols-outlined text-[#7E22CE] text-xl">inventory_2</span>
            <h3 class="text-base font-black text-[#2E1065]">Master Item Profile</h3>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-[var(--text-muted)] block">Item Name</span>
              <strong class="text-[#2E1065] text-sm">{{ stockItem.name }}</strong>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Stock Code / SKU</span>
              <strong class="font-mono text-sm text-[var(--primary)]">{{ stockItem.stock_code }}</strong>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Unit of Measurement</span>
              <span class="badge badge-primary uppercase font-mono text-[10px] mt-0.5">{{ stockItem.unit_type }}</span>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Default Multiplier</span>
              <strong class="font-mono text-sm text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-0.5 rounded border border-[#DDD6FE] inline-block mt-0.5">
                {{ stockItem.default_multiplier || 1 }}x
              </strong>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Low Stock Alert Level</span>
              <strong class="text-sm font-mono text-[#DC2626]">{{ stockItem.min_stock_alert }} {{ stockItem.unit_type }}s</strong>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Status</span>
              <span class="badge badge-success uppercase text-[10px] mt-0.5">{{ stockItem.status }}</span>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Linked Menu Product</span>
              <strong class="text-[#2E1065]">{{ stockItem.product_name || 'None (Direct Raw Material)' }}</strong>
            </div>
            <div>
              <span class="text-[var(--text-muted)] block">Default Supplier / Vendor</span>
              <strong class="text-[#2E1065]">{{ stockItem.default_vendor_name || 'None' }}</strong>
            </div>
          </div>
        </div>

        <!-- Card 2: Costing & Valuation Summary -->
        <div class="p-6 bg-white border border-[#E9D5FF] rounded-2xl shadow-xs space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-[#E9D5FF]">
            <span class="material-symbols-outlined text-[#16A34A] text-xl">analytics</span>
            <h3 class="text-base font-black text-[#2E1065]">Costing & Inventory Analytics</h3>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <span class="text-purple-700 block text-[10px] uppercase font-bold">Current Quantity</span>
              <strong class="text-purple-950 text-base font-mono font-black">{{ stockItem.current_quantity | number:'1.0-3' }} {{ stockItem.unit_type }}s</strong>
            </div>
            <div class="p-3 bg-green-50 border border-green-100 rounded-xl">
              <span class="text-green-700 block text-[10px] uppercase font-bold">Total Inventory Valuation</span>
              <strong class="text-green-900 text-base font-mono font-black">{{ stockItem.current_value | appCurrency:'1.0-2' }}</strong>
            </div>
            <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <span class="text-amber-700 block text-[10px] uppercase font-bold">Weighted Average Unit Cost</span>
              <strong class="text-amber-900 text-base font-mono font-black">{{ stockItem.average_unit_price | appCurrency:'1.0-4' }}</strong>
            </div>
            <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span class="text-blue-700 block text-[10px] uppercase font-bold">Total Batches Ingested</span>
              <strong class="text-blue-950 text-base font-mono font-black">{{ entries.length }} Batches</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 9. BOTTOM PAGINATION BAR                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pagination-footer-bar" *ngIf="activeTab !== 'PROFILE' && getCurrentTotal() > 0">
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
      <!-- 10. MODAL: QUICK PURCHASE ENTRY (For this item)                 -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 10. MODAL: PURCHASE ENTRY (From Detail Page)                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showPurchaseModal">
        <div class="modal-content shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge is-success">
                <span class="material-symbols-outlined">add_shopping_cart</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Stock Purchase: {{ stockItem?.name }}</h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Quantity × Multiplier = Total Quantity, recalculates Weighted Average Cost</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showPurchaseModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitPurchaseEntry()" class="space-y-4">
            <!-- Vendor (Optional) Selection (First) -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Vendor (Optional)
              </label>
              <app-custom-dropdown
                [options]="vendorPickerOptions"
                [(ngModel)]="purchaseForm.vendorId"
                name="vendorId"
                [searchable]="true"
                minWidth="100%"
                placeholder="Select Vendor..."
              ></app-custom-dropdown>
            </div>

            <!-- Formula Section: Quantity × Multiplier -->
            <div class="pt-3.5 border-t border-[#E9D5FF] space-y-3">
              <div class="flex items-center justify-between pb-1.5">
                <div class="text-xs font-bold text-[#6B21A8] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#7E22CE]" style="font-size: 18px;">calculate</span>
                  <span class="uppercase tracking-wider">Purchase Formula: Quantity × Multiplier</span>
                </div>
                <span class="text-[10px] font-bold text-[#7E22CE] bg-[#F3E8FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  3-Tier Stock Ledger
                </span>
              </div>

              <!-- Base Quantity & Multiplier Grid -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-1 min-h-[22px]">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider !mb-0 block">
                      Base Quantity
                    </label>
                  </div>
                  <input
                    title="Base Quantity"
                    type="number"
                    min="0.001"
                    step="any"
                    [(ngModel)]="purchaseForm.quantity"
                    name="quantity"
                    class="form-control font-mono font-bold text-base w-full h-[42px]"
                    placeholder="e.g. 5"
                    required
                  />
                </div>
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-1 min-h-[22px]">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider !mb-0 block">
                      Multiplier
                    </label>
                    <span class="text-[9px] text-[#7E22CE] font-bold bg-[#F3E8FF] px-2 py-0.5 rounded border border-[#DDD6FE] whitespace-nowrap leading-none">
                      Auto from Stock
                    </span>
                  </div>
                  <input
                    title="Multiplier"
                    type="number"
                    [ngModel]="purchaseForm.multiplier"
                    (ngModelChange)="purchaseForm.multiplier = $event"
                    name="multiplier"
                    class="form-control font-mono font-bold text-base w-full bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed border-[#D1D5DB] h-[42px]"
                    placeholder="1"
                    disabled
                    readonly
                  />
                </div>
              </div>

              <!-- Live Total Quantity Display -->
              <div class="flex items-center justify-between py-1.5 px-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-lg text-xs shadow-xs w-full">
                <span class="text-[#4B5563] font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#16A34A]" style="font-size: 18px;">inventory_2</span>
                  <span>Calculated Total Quantity:</span>
                </span>
                <span class="font-mono font-black text-sm text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-0.5 rounded-md">
                  {{ calculatedTotalQuantity | number:'1.0-3' }} {{ stockItem?.unit_type || 'units' }}
                </span>
              </div>

              <!-- Price Grid: Total Purchase Price vs Resulting Unit Cost -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-0">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Total Purchase Price (₹ / SAR)
                    </label>
                  </div>
                  <input
                    title="Total Purchase Price (₹ / SAR)"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="purchaseForm.totalPrice"
                    name="totalPrice"
                    class="form-control font-mono font-bold text-[#2E1065] w-full"
                    placeholder="e.g. 2000"
                    required
                  />
                </div>
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-0">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Resulting Unit Cost
                    </label>
                    <span class="text-[9px] text-[#7E22CE] font-bold bg-[#F3E8FF] px-2 py-0.5 rounded border border-[#DDD6FE] whitespace-nowrap">
                      Auto-calculated
                    </span>
                  </div>
                  <div class="flex items-center justify-between px-3.5 py-2.5 bg-[#F3F4F6] border border-[#D1D5DB] rounded-xl text-sm font-mono font-bold text-[#4B5563] min-h-[42px] w-full">
                    <span>{{ calculatedUnitPrice | appCurrency:'1.0-4' }}</span>
                    <span class="text-[10px] font-normal text-[#6B7280]">/ {{ stockItem?.unit_type || 'unit' }}</span>
                  </div>
                </div>
              </div>

              <!-- Impact Simulation Card -->
              <div *ngIf="stockItem" class="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs space-y-1.5 w-full">
                <div class="font-bold text-[#065F46] flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size: 16px;">trending_up</span>
                  <span>Projected Master Stock Balance Update:</span>
                </div>
                <div class="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>Current: <strong>{{ stockItem.current_quantity }}</strong> {{ stockItem.unit_type }} &#64; {{ stockItem.average_unit_price | appCurrency:'1.0-2' }}</div>
                  <div class="text-[#047857]">Adding: <strong>+{{ calculatedTotalQuantity }}</strong> &#64; {{ calculatedUnitPrice | appCurrency:'1.0-2' }}</div>
                </div>
                <div class="pt-1 border-t border-[#A7F3D0] flex items-center justify-between font-mono font-black text-[#065F46]">
                  <span>New Balance: {{ projectedQuantity | number:'1.0-3' }} {{ stockItem.unit_type }}</span>
                  <span>New Avg Cost: {{ projectedAvgPrice | appCurrency:'1.0-4' }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Notes (Optional)
              </label>
              <input
                title="Notes (Optional)"
                type="text"
                [(ngModel)]="purchaseForm.notes"
                name="notes"
                placeholder="e.g. Morning fresh stock batch"
                class="form-control text-sm w-full"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showPurchaseModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="calculatedTotalQuantity <= 0 || purchaseForm.totalPrice < 0"
                class="action-btn btn-gradient-purple"
              >
                Save Purchase Entry ✓
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 11. MODAL: QUICK ADJUSTMENT & WASTAGE                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showAdjustModal">
        <div class="modal-content shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">tune</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Adjust Stock / Record Wastage</h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Record shrinkage, physical recount, or damage audit</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showAdjustModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitAdjust()" class="space-y-4">
            <!-- Row 1: Movement / Reason Type and (if Return to Supplier) Select Vendor -->
            <div class="grid gap-4 items-start" [ngClass]="adjustForm.adjustmentType === 'return_to_supplier' ? 'grid-cols-2' : 'grid-cols-1'">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Movement / Reason Type
                </label>
                <app-custom-dropdown
                  [options]="adjustmentTypeOptions"
                  [(ngModel)]="adjustForm.adjustmentType"
                  (ngModelChange)="onAdjustReasonTypeChange()"
                  name="adjustmentType"
                  minWidth="100%"
                  placeholder="Select Reason..."
                ></app-custom-dropdown>
              </div>

              <!-- Vendor Selection for Return to Supplier -->
              <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier'" class="form-group mb-0">
                <div class="flex items-center justify-between mb-0">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                    Select Supplier / Vendor <span class="text-[#DC2626] font-black">*</span>
                  </label>
                  <span class="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded border border-[var(--card-border)] whitespace-nowrap leading-none">
                    Return Target
                  </span>
                </div>
                <app-custom-dropdown
                  [options]="adjustVendorPickerOptions"
                  [(ngModel)]="adjustForm.vendorId"
                  (ngModelChange)="onAdjustVendorChange()"
                  name="vendorId"
                  [searchable]="true"
                  minWidth="100%"
                  placeholder="Select Vendor to return to..."
                ></app-custom-dropdown>
              </div>
            </div>

            <!-- Helper Messages for Return to Supplier Selection -->
            <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier' && !adjustForm.vendorId" class="mt-1 flex items-center gap-1.5 text-[11px] text-[#7C3AED] font-medium">
              <span class="material-symbols-outlined" style="font-size: 15px;">info</span>
              <span>Please select a Supplier / Vendor above to view purchase & return availability for this item.</span>
            </div>
            <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier' && adjustForm.vendorId && isLoadingVendorItems" class="mt-1 flex items-center gap-1.5 text-[11px] text-[#7C3AED] font-semibold animate-pulse">
              <span class="material-symbols-outlined text-xs">sync</span>
              <span>Fetching vendor purchase details...</span>
            </div>
            <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier' && adjustForm.vendorId && !isLoadingVendorItems && !selectedVendorReturnItem" class="mt-1 flex items-center gap-1.5 text-[11px] text-[#DC2626] font-medium bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FCA5A5]">
              <span class="material-symbols-outlined" style="font-size: 16px;">warning</span>
              <span>This vendor has not supplied <strong>{{ stockItem?.name }}</strong> or has 0 returnable quantity.</span>
            </div>

            <!-- Dual-Metric Card for Return to Supplier: Vendor Purchased vs Current Available Stock -->
            <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier' && selectedVendorReturnItem" class="p-3.5 bg-[#FAF5FF] border border-[#DDD6FE] rounded-xl text-xs space-y-2.5 w-full">
              <div class="flex items-center justify-between font-bold text-[#6B21A8]">
                <span class="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span class="material-symbols-outlined text-[#7C3AED]" style="font-size: 16px;">local_shipping</span>
                  <span>Vendor Purchase & Stock Availability</span>
                </span>
                <span class="text-[10px] bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE] px-2 py-0.5 rounded-md font-mono font-bold">
                  {{ selectedVendorReturnItem.stock_code }}
                </span>
              </div>
              
              <div class="grid grid-cols-2 gap-3 pt-0.5">
                <div class="p-2.5 bg-white border border-[#E9D5FF] rounded-lg shadow-2xs">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] uppercase tracking-wider font-bold text-[#6B7280] block">
                      Vendor Total Supplied
                    </span>
                    <span *ngIf="selectedVendorReturnItem.previously_returned_quantity > 0" class="text-[9px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.2 rounded border border-[#FCA5A5]">
                      -{{ selectedVendorReturnItem.previously_returned_quantity }} ret
                    </span>
                  </div>
                  <span class="font-mono font-black text-sm text-[#6B21A8]">
                    {{ selectedVendorReturnItem.vendor_total_quantity | number:'1.0-3' }} {{ selectedVendorReturnItem.unit_type }}s
                  </span>
                  <div class="text-[9px] text-[#7C3AED] font-semibold mt-0.5 flex items-center justify-between pt-0.5 border-t border-[#F3E8FF]">
                    <span>Net Returnable:</span>
                    <span class="font-mono font-bold">{{ selectedVendorReturnItem.vendor_returnable_quantity | number:'1.0-3' }} {{ selectedVendorReturnItem.unit_type }}s</span>
                  </div>
                </div>

                <div class="p-2.5 bg-white border border-[#E9D5FF] rounded-lg shadow-2xs">
                  <span class="text-[10px] uppercase tracking-wider font-bold text-[#6B7280] block mb-1">
                    Current Available Stock
                  </span>
                  <span class="font-mono font-black text-sm text-[#16A34A]">
                    {{ selectedVendorReturnItem.current_available_stock | number:'1.0-3' }} {{ selectedVendorReturnItem.unit_type }}s
                  </span>
                  <span class="text-[9px] text-[#9CA3AF] block mt-0.5 font-medium">from stock_movements ledger</span>
                </div>
              </div>

              <div class="pt-1.5 border-t border-[#E9D5FF] flex items-center justify-between text-[11px] font-semibold text-[#5B21B6]">
                <span class="flex items-center gap-1">
                  <span>Max Return Allowed:</span>
                  <span class="text-[10px] text-[#6B7280] font-normal">(Min of Vendor Supplied & Available Stock)</span>
                </span>
                <span class="font-mono font-black text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-0.5 rounded text-xs">
                  {{ adjustMaxQuantity | number:'1.0-3' }} {{ selectedVendorReturnItem.unit_type }}s
                </span>
              </div>
            </div>

            <!-- What is actually on hand for other adjustment types -->
            <div
              *ngIf="adjustForm.adjustmentType !== 'return_to_supplier' && stockItem"
              class="flex items-center justify-between py-2 px-3.5 bg-[var(--bg-app)] border border-[var(--card-border)] rounded-xl text-xs shadow-xs w-full"
            >
              <span class="text-[var(--text-muted)] font-semibold flex items-center gap-2">
                <span class="material-symbols-outlined text-[var(--primary)]" style="font-size: 18px;">inventory_2</span>
                <span>Available Stock:</span>
              </span>
              <span class="flex items-center gap-2">
                <span
                  *ngIf="adjustIsLowStock"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]"
                >
                  Low
                </span>
                <span
                  class="font-mono font-black text-sm px-2.5 py-0.5 rounded-md border"
                  [ngClass]="adjustIsLowStock
                    ? 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'
                    : 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'"
                >
                  {{ (stockItem.current_quantity || 0) | number:'1.0-3' }}
                  {{ stockItem.unit_type || 'piece' }}
                  <span class="opacity-60 font-normal mx-1">/</span>
                  {{ (stockItem.average_unit_price || 0) | appCurrency:'1.0-2' }} <span class="font-sans font-medium text-xs">unit price</span>
                </span>
              </span>
            </div>

            <!-- Direct Quantity Input + costing -->
            <div class="pt-3.5 border-t border-[var(--card-border)] space-y-3">
              <div class="flex items-center justify-between pb-1.5">
                <div class="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[var(--primary)]" style="font-size: 18px;">tune</span>
                  <span class="uppercase tracking-wider">Adjustment Quantity ({{ stockItem?.unit_type || 'piece' }})</span>
                </div>
                <span
                  class="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap border"
                  [ngClass]="adjustForm.adjustmentType === 'return_to_supplier'
                    ? 'text-[#7C3AED] bg-[#EDE9FE] border-[#DDD6FE]'
                    : (adjustIsIncrease
                        ? 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'
                        : 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]')"
                >
                  {{ adjustForm.adjustmentType === 'return_to_supplier'
                      ? 'Vendor Loss (Removes from stock)'
                      : (adjustIsIncrease ? 'Stock Gain (Adds to stock)' : 'Company Loss (Removes from stock)') }}
                </span>
              </div>

              <div class="form-group mb-0">
                <div class="flex items-center justify-between mb-1">
                  <label class="form-label text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Adjustment Quantity
                  </label>
                  <span class="text-[11px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-0.5 rounded-md border border-[var(--card-border)] uppercase">
                    Unit: {{ stockItem?.unit_type || 'piece' }}
                  </span>
                </div>
                <div class="flex items-stretch rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden focus-within:border-[var(--primary)]">
                  <input
                    title="Adjustment Quantity"
                    type="number"
                    min="0.001"
                    step="any"
                    [attr.max]="adjustMaxQuantity"
                    [(ngModel)]="adjustForm.quantity"
                    (ngModelChange)="onAdjustFormQuantityChange()"
                    name="quantity"
                    class="form-control !border-0 !rounded-none !shadow-none font-mono font-bold text-[var(--primary)] text-base flex-1 min-w-0"
                    placeholder="Enter count (e.g. 10)"
                    required
                  />
                  <div class="flex items-center px-4 bg-[var(--bg-app)] border-l border-[var(--card-border)] text-xs font-bold font-mono text-[var(--text-muted)] uppercase select-none">
                    {{ stockItem?.unit_type || 'piece' }}
                  </div>
                </div>
                <p *ngIf="adjustMaxQuantity !== null" class="text-[10px] text-[var(--text-muted)] mt-1">
                  This reason removes stock, so at most
                  <strong class="font-mono">{{ adjustMaxQuantity | number:'1.0-3' }} {{ stockItem?.unit_type || 'units' }}</strong>
                  can be taken out.
                </p>
              </div>

              <!-- Where the item lands once this is applied -->
              <div
                *ngIf="stockItem"
                class="flex items-center justify-between py-2 px-3.5 bg-[var(--bg-app)] border border-[var(--card-border)] rounded-xl text-xs shadow-xs w-full"
              >
                <span class="text-[var(--text-muted)] font-semibold flex items-center gap-2">
                  <span
                    class="material-symbols-outlined"
                    [ngClass]="adjustIsIncrease ? 'text-[#16A34A]' : 'text-[#DC2626]'"
                    style="font-size: 18px;"
                  >{{ adjustIsIncrease ? 'trending_up' : 'trending_down' }}</span>
                  <span>Stock After Adjustment:</span>
                </span>
                <span class="flex items-center gap-2">
                  <span
                    *ngIf="adjustExceedsAvailable"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]"
                  >
                    Exceeds available
                  </span>
                  <span class="font-mono text-xs text-[var(--text-muted)]">
                    {{ (stockItem.current_quantity || 0) | number:'1.0-3' }}
                    {{ adjustIsIncrease ? '+' : '−' }}
                    {{ (adjustCalculatedTotalQty || 0) | number:'1.0-3' }} =
                  </span>
                  <span
                    class="font-mono font-black text-sm px-2.5 py-0.5 rounded-md border"
                    [ngClass]="adjustExceedsAvailable
                      ? 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'
                      : (adjustIsIncrease
                          ? 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'
                          : 'text-[#9A3412] bg-[#FFF7ED] border-[#FED7AA]')"
                  >
                    {{ adjustResultingQty | number:'1.0-3' }}
                    {{ stockItem.unit_type || 'piece' }}
                  </span>
                </span>
              </div>

              <!-- Cost Grid: Total Cost / Price is editable (left), Unit Price is derived/read-only (right) -->
              <div class="grid grid-cols-2 gap-4 items-start">
                <!-- Left: Total Cost / Price (Editable) -->
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0 block">Total Cost / Price (₹)</label>
                    <span class="text-[9px] text-[var(--primary)] font-bold bg-[var(--primary-light)] px-2 py-0.5 rounded border border-[var(--card-border)] whitespace-nowrap">
                      Input value
                    </span>
                  </div>
                  <input
                    title="Total Cost / Price (₹)"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="adjustForm.totalPrice"
                    name="totalPrice"
                    class="form-control font-mono font-bold text-[var(--text-main)] w-full"
                    placeholder="0.00"
                  />
                </div>

                <!-- Right: Unit Price (Disabled / Read-only) -->
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0 block">Unit Price (₹)</label>
                    <span class="text-[9px] text-[var(--text-muted)] font-bold bg-[var(--bg-app)] px-2 py-0.5 rounded border border-[var(--card-border)] whitespace-nowrap">
                      Auto-calculated
                    </span>
                  </div>
                  <input
                    title="Unit Price (₹)"
                    type="number"
                    [value]="adjustUnitPrice"
                    name="unitPrice"
                    class="form-control font-mono font-bold bg-[var(--bg-app)] text-[var(--text-muted)] cursor-not-allowed border-[var(--card-border)] w-full"
                    placeholder="0.0000"
                    disabled
                    readonly
                  />
                  <div class="text-[10px] text-[var(--text-muted)] mt-1 font-mono flex items-center justify-between px-1">
                    <span>Item avg: {{ (stockItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}</span>
                    <span>Rate / unit</span>
                  </div>
                </div>
              </div>

              <!-- Total Cost / Price Sum -->
              <div
                *ngIf="stockItem"
                class="flex items-center justify-between py-1.5 px-3 bg-[var(--bg-app)] border border-[var(--card-border)] rounded-lg text-xs w-full"
              >
                <span class="text-[var(--text-muted)] font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[var(--primary)]" style="font-size: 18px;">functions</span>
                  <span>Total Cost / Price Sum:</span>
                </span>
                <span class="flex items-center gap-2">
                  <span class="font-mono text-[11px] text-[var(--text-muted)]">
                    {{ adjustCalculatedTotalQty | number:'1.0-3' }}
                    &#215;
                    {{ adjustUnitPrice | appCurrency:'1.0-4' }} =
                  </span>
                  <span class="font-mono font-black text-sm px-2.5 py-0.5 rounded-md border text-[var(--primary)] bg-[var(--primary-light)] border-[var(--card-border)]">
                    {{ (adjustForm.totalPrice || 0) | appCurrency:'1.0-2' }}
                  </span>
                </span>
              </div>

              <!-- Remaining / Resulting Total Cost Display -->
              <div
                *ngIf="stockItem"
                class="flex items-center justify-between py-2 px-3.5 bg-[var(--bg-app)] border border-[var(--card-border)] rounded-xl text-xs shadow-xs w-full"
              >
                <span class="text-[var(--text-muted)] font-semibold flex items-center gap-2">
                  <span
                    class="material-symbols-outlined"
                    [ngClass]="adjustIsIncrease ? 'text-[#16A34A]' : 'text-[#DC2626]'"
                    style="font-size: 18px;"
                  >{{ adjustIsIncrease ? 'trending_up' : 'trending_down' }}</span>
                  <span class="uppercase tracking-wider font-bold">
                    {{ adjustIsIncrease ? 'Total Cost After Adjustment:' : 'Remaining Total Cost:' }}
                  </span>
                </span>
                <span class="flex items-center gap-2">
                  <span class="font-mono text-xs text-[var(--text-muted)]">
                    {{ adjustItemTotalCost | appCurrency:'1.0-2' }}
                    {{ adjustIsIncrease ? '+' : '−' }}
                    {{ (adjustForm.totalPrice || 0) | appCurrency:'1.0-2' }} =
                  </span>
                  <span
                    class="font-mono font-black text-sm px-2.5 py-0.5 rounded-md border"
                    [ngClass]="adjustResultingTotalCost < 0
                      ? 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]'
                      : (adjustIsIncrease
                          ? 'text-[#16A34A] bg-[#DCFCE7] border-[#86EFAC]'
                          : 'text-[#9A3412] bg-[#FFF7ED] border-[#FED7AA]')"
                  >
                    {{ adjustResultingTotalCost | appCurrency:'1.0-2' }}
                  </span>
                </span>
              </div>

              <!-- Explanatory note -->
              <div
                class="p-3.5 rounded-xl border text-xs leading-relaxed"
                [ngClass]="adjustForm.adjustmentType === 'return_to_supplier'
                  ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6]'
                  : (adjustIsIncrease
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-[#FFF7ED] border-[#FED7AA] text-[#9A3412]')"
              >
                <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier'" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#7C3AED]">local_shipping</span>
                  <div>
                    <strong class="font-bold">Vendor Loss (Return to Supplier):</strong>
                    Goods are returned to the vendor for credit / replacement at the rate of
                    <strong class="font-mono font-bold">{{ (adjustUnitPrice || stockItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}</strong>.
                    This removal is accounted as a <strong class="font-bold">Vendor Loss</strong> and does not count as internal company shrinkage.
                  </div>
                </div>

                <div *ngIf="adjustIsIncrease && adjustForm.adjustmentType !== 'return_to_supplier'" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#16A34A]">trending_up</span>
                  <div>
                    <strong class="font-bold">Stock Addition:</strong>
                    Adds <strong class="font-mono font-bold">{{ adjustCalculatedTotalQty | number:'1.0-3' }} {{ stockItem?.unit_type }}s</strong>
                    valued at <strong class="font-mono font-bold">{{ (adjustForm.totalPrice || 0) | appCurrency:'1.0-2' }}</strong>.
                  </div>
                </div>

                <div *ngIf="!adjustIsIncrease && adjustForm.adjustmentType !== 'return_to_supplier'" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#EA580C]">trending_down</span>
                  <div>
                    <strong class="font-bold">Company Loss ({{ adjustForm.adjustmentType }}):</strong>
                    Removes <strong class="font-mono font-bold">{{ adjustCalculatedTotalQty | number:'1.0-3' }} {{ stockItem?.unit_type }}s</strong>
                    valued at <strong class="font-mono font-bold">{{ (adjustForm.totalPrice || 0) | appCurrency:'1.0-2' }}</strong>.
                  </div>
                </div>
              </div>

              <!-- Mandatory Audit Reason -->
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">
                  Mandatory Audit Reason <span class="text-[#DC2626] font-black">*</span>
                </label>
                <input
                  title="Mandatory Audit Reason"
                  type="text"
                  [(ngModel)]="adjustForm.reason"
                  name="reason"
                  placeholder="e.g. Physical stock count check, trimming loss"
                  class="form-control text-sm w-full"
                  required
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showAdjustModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="adjustCalculatedTotalQty <= 0 || !adjustForm.reason || adjustOverMax || (adjustForm.adjustmentType === 'return_to_supplier' && (!adjustForm.vendorId || !selectedVendorReturnItem))"
                class="action-btn btn-gradient-purple"
              >
                Apply Adjustment ✓
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 12. MODAL: VIEW STOCK MOVEMENT AUDIT DETAILS                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showMovementViewModal && selectedMovementForView">
        <div class="modal-content shadow-2xl max-w-lg">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge" [ngClass]="{
                'is-success': selectedMovementForView.movement_type === 'in',
                'is-danger': selectedMovementForView.movement_type === 'out' || selectedMovementForView.movement_type === 'wastage',
                '!bg-purple-100 !text-purple-700': selectedMovementForView.movement_type === 'return' || selectedMovementForView.movement_type === 'adjustment'
              }">
                <span class="material-symbols-outlined text-2xl">
                  {{ selectedMovementForView.movement_type === 'in' ? 'add_circle' : (selectedMovementForView.movement_type === 'return' ? 'reply' : (selectedMovementForView.movement_type === 'wastage' ? 'delete' : 'history')) }}
                </span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Stock Movement Details</h3>
                <p class="text-xs text-[#6B7280] font-mono mt-0.5">
                  Ref: {{ selectedMovementForView.reference_id || 'ID #' + selectedMovementForView.id }} • {{ selectedMovementForView.reference_type }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="showMovementViewModal = false; selectedMovementForView = null"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Grid 1: Item & Movement Type -->
            <div class="grid grid-cols-2 gap-3 p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl">
              <div>
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Stock Item</span>
                <strong class="text-[#2E1065] text-sm">{{ selectedMovementForView.stock_item_name || stockItem?.name }}</strong>
                <div class="font-mono text-[10px] text-[#7E22CE]">{{ selectedMovementForView.stock_code || stockItem?.stock_code }}</div>
              </div>
              <div>
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Movement Type</span>
                <span
                  class="badge uppercase font-bold text-[10px] mt-1 inline-block"
                  [ngClass]="{
                    'badge-success': selectedMovementForView.movement_type === 'in',
                    'badge-danger': selectedMovementForView.movement_type === 'out',
                    'badge-warning': selectedMovementForView.movement_type === 'adjustment',
                    'badge-info': selectedMovementForView.movement_type === 'return',
                    'bg-rose-100 text-rose-800 border border-rose-200': selectedMovementForView.movement_type === 'wastage'
                  }"
                >
                  {{ selectedMovementForView.movement_type }}
                </span>
              </div>
            </div>

            <!-- Grid 2: Quantity & Financial Impact -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl">
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Quantity Moved</span>
                <span
                  class="font-mono font-black text-base"
                  [ngClass]="selectedMovementForView.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'"
                >
                  {{ selectedMovementForView.quantity > 0 ? '+' + (selectedMovementForView.quantity | number:'1.0-3') : (selectedMovementForView.quantity | number:'1.0-3') }}
                  {{ selectedMovementForView.unit_type || stockItem?.unit_type }}
                </span>
                <div class="text-[10px] text-[#6B7280] font-mono mt-0.5">
                  Unit Cost: {{ selectedMovementForView.unit_price | appCurrency:'1.0-4' }}
                </div>
              </div>

              <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl">
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Financial Impact</span>
                <span class="font-mono font-black text-base text-[#2E1065]">
                  {{ selectedMovementForView.total_value | appCurrency:'1.0-2' }}
                </span>
                <div class="text-[10px] text-[#7E22CE] font-mono mt-0.5">
                  Balance: <strong>{{ selectedMovementForView.balance_quantity | number:'1.0-3' }} {{ selectedMovementForView.unit_type || stockItem?.unit_type }}</strong>
                </div>
              </div>
            </div>

            <!-- Grid 3: Metadata & Author -->
            <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl space-y-2">
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span class="text-[#6B7280] block text-[10px] font-bold uppercase">Date & Time</span>
                  <span class="font-mono text-[#2E1065]">{{ selectedMovementForView.movement_date | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                </div>
                <div>
                  <span class="text-[#6B7280] block text-[10px] font-bold uppercase">Recorded By</span>
                  <span class="font-semibold text-[#6B21A8]">{{ selectedMovementForView.created_by_name || 'System Auto' }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-[#F3E8FF]" *ngIf="selectedMovementForView.notes">
                <span class="text-[#6B7280] block text-[10px] font-bold uppercase mb-0.5">Audit Reason & Notes</span>
                <p class="text-[#2E1065] bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] font-mono text-[11px] leading-relaxed break-words">
                  {{ selectedMovementForView.notes }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end pt-4 mt-3 border-t border-[#E9D5FF]">
            <button
              type="button"
              (click)="showMovementViewModal = false; selectedMovementForView = null"
              class="action-btn btn-gradient-purple"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 13. MODAL: VIEW PURCHASE ENTRY LEDGER DETAILS                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showEntryViewModal && selectedEntryForView">
        <div class="modal-content shadow-2xl max-w-lg">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge is-success">
                <span class="material-symbols-outlined text-2xl">shopping_cart_checkout</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Purchase Entry Details</h3>
                <p class="text-xs text-[#6B7280] font-mono mt-0.5">
                  Entry #: {{ selectedEntryForView.entry_number }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="showEntryViewModal = false; selectedEntryForView = null"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Grid 1: Basic Info -->
            <div class="grid grid-cols-2 gap-3 p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl">
              <div>
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Stock Item</span>
                <strong class="text-[#2E1065] text-sm">{{ selectedEntryForView.stock_item_name || stockItem?.name }}</strong>
                <div class="font-mono text-[10px] text-[#7E22CE]">{{ selectedEntryForView.stock_code || stockItem?.stock_code }}</div>
              </div>
              <div>
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Source & Supplier</span>
                <span class="stock-source-chip mt-1 inline-flex" [class.is-vendor]="selectedEntryForView.supplier === 'Vendor'">
                  <span class="material-symbols-outlined text-[13px]">{{ selectedEntryForView.supplier === 'Vendor' ? 'local_shipping' : 'inventory_2' }}</span>
                  {{ selectedEntryForView.supplier || 'Initial Setup' }}
                </span>
                <div *ngIf="selectedEntryForView.vendor_name" class="text-[11px] font-semibold text-[#2E1065] mt-1">
                  {{ selectedEntryForView.vendor_name }} <span *ngIf="selectedEntryForView.vendor_code" class="text-[#7E22CE] font-mono">({{ selectedEntryForView.vendor_code }})</span>
                </div>
              </div>
            </div>

            <!-- Grid 2: Formula & Calculation -->
            <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl space-y-2">
              <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Formula & Quantities</span>
              <div class="flex items-center justify-between p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg font-mono">
                <span class="text-[#4B5563]">
                  <strong>{{ selectedEntryForView.quantity }}</strong> base × <strong>{{ selectedEntryForView.multiplier }}</strong> mult
                </span>
                <span class="font-black text-sm text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                  +{{ selectedEntryForView.total_quantity | number:'1.0-3' }} {{ stockItem?.unit_type || 'units' }}
                </span>
              </div>
            </div>

            <!-- Grid 3: Pricing & Unit Cost -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl">
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Total Batch Price</span>
                <span class="font-mono font-black text-base text-[#2E1065]">
                  {{ selectedEntryForView.total_price | appCurrency:'1.0-2' }}
                </span>
              </div>
              <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl">
                <span class="text-[#6B7280] block text-[10px] uppercase font-bold">Resulting Unit Cost</span>
                <span class="font-mono font-black text-base text-[#7E22CE]">
                  {{ selectedEntryForView.unit_price | appCurrency:'1.0-4' }}
                </span>
                <span class="text-[10px] text-[#6B7280] block">/ {{ stockItem?.unit_type || 'unit' }}</span>
              </div>
            </div>

            <!-- Grid 4: Meta & Notes -->
            <div class="p-3 bg-white border border-[#E9D5FF] rounded-xl space-y-2">
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span class="text-[#6B7280] block text-[10px] font-bold uppercase">Entry Date</span>
                  <span class="font-mono text-[#2E1065]">{{ selectedEntryForView.entry_date | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div>
                  <span class="text-[#6B7280] block text-[10px] font-bold uppercase">Recorded By</span>
                  <span class="font-semibold text-[#6B21A8]">{{ selectedEntryForView.created_by_name || 'System' }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-[#F3E8FF]" *ngIf="selectedEntryForView.notes">
                <span class="text-[#6B7280] block text-[10px] font-bold uppercase mb-0.5">Notes</span>
                <p class="text-[#2E1065] bg-[#F9FAFB] p-2 rounded-lg border border-[#E5E7EB] font-mono text-[11px] leading-relaxed break-words">
                  {{ selectedEntryForView.notes }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end pt-4 mt-3 border-t border-[#E9D5FF]">
            <button
              type="button"
              (click)="showEntryViewModal = false; selectedEntryForView = null"
              class="action-btn btn-gradient-purple"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockDetailComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public stockId!: number;
  public stockItem: any = null;
  public entries: StockEntry[] = [];
  public movements: StockMovement[] = [];

  public activeTab: 'ENTRIES' | 'MOVEMENTS' | 'PROFILE' = 'ENTRIES';
  public searchQuery = '';
  public selectedMovementType = 'all';
  public pageSize = 10;
  public currentPage = 1;

  public selectedMovementForView: StockMovement | null = null;
  public showMovementViewModal = false;
  public selectedEntryForView: StockEntry | null = null;
  public showEntryViewModal = false;

  public movementFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Movement Types', icon: 'history' },
    { value: 'in', label: 'IN (Purchases / Additions)', icon: 'add_circle' },
    { value: 'out', label: 'OUT (Sales / Deductions)', icon: 'remove_circle' },
    { value: 'wastage', label: 'WASTAGE (Kitchen Loss)', icon: 'delete' },
    { value: 'return', label: 'RETURN', icon: 'reply' },
  ];

  public adjustmentTypeOptions: DropdownOption[] = [
    { value: 'DECREASE', label: 'DECREASE (- Audit)', icon: 'arrow_downward', description: 'Stock deficit adjustment — Company Loss' },
    { value: 'INCREASE', label: 'INCREASE (+ Audit)', icon: 'arrow_upward', description: 'Found excess stock on audit — Stock Gain' },
    { value: 'wastage', label: 'Kitchen Wastage / Spoilage', icon: 'delete', description: 'Trimming loss, spoiled, expired — Company Loss' },
    { value: 'return_to_supplier', label: 'Return to Supplier', icon: 'reply', description: 'Goods sent back to vendor — Vendor Loss / Credit' },
  ];

  public showPurchaseModal = false;
  public showAdjustModal = false;

  // ── Vendors (a purchase entry links to a real vendor record) ────────
  private vendorService = inject(VendorService);

  public vendors: Vendor[] = [];

  /** 0 is the deliberate "not a vendor" choice, which books the row as
   *  'Initial Setup' rather than a vendor purchase. */
  get vendorPickerOptions(): DropdownOption[] {
    return [
      { value: 0, label: 'No vendor (Initial Setup)', icon: 'inventory_2' },
      ...this.vendors.map((v) => ({
        value: v.id,
        label: v.name,
        icon: 'local_shipping',
        badge: v.vendor_code,
        description: v.category,
      })),
    ];
  }

  /** Vendors list formatted for the Return to Supplier picker. */
  get adjustVendorPickerOptions(): DropdownOption[] {
    return this.vendors.map((v) => ({
      value: v.id,
      label: v.name,
      description: v.contact_person ? `Contact: ${v.contact_person}${v.phone ? ` (${v.phone})` : ''}` : (v.category || v.phone || undefined),
      icon: 'local_shipping',
      badge: v.vendor_code,
    }));
  }

  public purchaseForm: any = {
    quantity: null,
    multiplier: 1,
    totalPrice: null,
    vendorId: 0,
    notes: '',
  };

  public adjustForm: any = {
    adjustmentType: 'DECREASE',
    vendorId: null,
    quantity: 1,
    multiplier: 1,
    totalPrice: 0,
    unitPrice: 0,
    reason: '',
    notes: '',
  };

  public vendorReturnStockItems: Array<{
    id: number;
    name: string;
    stock_code: string;
    unit_type: StockUnitType;
    average_unit_price: number;
    vendor_total_quantity: number;
    previously_returned_quantity: number;
    vendor_returnable_quantity: number;
    current_available_stock: number;
    max_return_allowed: number;
  }> = [];
  public isLoadingVendorItems = false;

  get selectedVendorReturnItem() {
    if (this.adjustForm.adjustmentType === 'return_to_supplier' && this.adjustForm.vendorId) {
      return this.vendorReturnStockItems.find((i) => i.id === this.stockId);
    }
    return undefined;
  }

  get adjustAvailableQuantity(): number {
    return Number(this.stockItem?.current_quantity || 0);
  }

  get allowNegativeStock(): boolean {
    return String(this.settingsService.settingsMap()['POS_ALLOW_NEGATIVE_STOCK'] ?? '').toLowerCase() === 'true';
  }

  get adjustMaxQuantity(): number | null {
    if (this.adjustIsIncrease || this.allowNegativeStock) return null;
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (this.selectedVendorReturnItem) {
        const vendorReturnable = Number(this.selectedVendorReturnItem.vendor_returnable_quantity ?? this.selectedVendorReturnItem.vendor_total_quantity ?? 0);
        const availableStock = Number(this.selectedVendorReturnItem.current_available_stock ?? this.stockItem?.current_quantity ?? 0);
        return Math.min(vendorReturnable, availableStock);
      }
    }
    return this.adjustAvailableQuantity;
  }

  get adjustOverMax(): boolean {
    const max = this.adjustMaxQuantity;
    return max !== null && this.adjustCalculatedTotalQty > max;
  }

  get adjustIsLowStock(): boolean {
    if (!this.stockItem) return false;
    const qty = Number(this.stockItem.current_quantity || 0);
    const alert = Number(this.stockItem.min_stock_alert || 0);
    return alert > 0 && qty <= alert;
  }

  get adjustIsIncrease(): boolean {
    return ['INCREASE', 'in', 'return'].includes(this.adjustForm.adjustmentType);
  }

  get adjustCalculatedTotalQty(): number {
    const qty = Number(this.adjustForm.quantity) || 0;
    const mult = Number(this.adjustForm.multiplier) || 1;
    return qty * mult;
  }

  get adjustItemTotalCost(): number {
    if (!this.stockItem) return 0;
    const val = Number(this.stockItem.current_value);
    if (Number.isFinite(val) && val > 0) return val;
    return +(Number(this.stockItem.current_quantity || 0) * Number(this.stockItem.average_unit_price || 0)).toFixed(2);
  }

  get adjustResultingTotalCost(): number {
    const totalCost = this.adjustItemTotalCost;
    const enteredPrice = Number(this.adjustForm.totalPrice) || 0;
    return this.adjustIsIncrease
      ? +(totalCost + enteredPrice).toFixed(2)
      : +(totalCost - enteredPrice).toFixed(2);
  }

  get adjustRemainingTotalCost(): number {
    return this.adjustResultingTotalCost;
  }

  get adjustUnitPrice(): number {
    const totalQty = this.adjustCalculatedTotalQty;
    const enteredTotal = Number(this.adjustForm.totalPrice);
    if (totalQty > 0 && Number.isFinite(enteredTotal) && enteredTotal >= 0) {
      return +(enteredTotal / totalQty).toFixed(4);
    }
    return Number(this.stockItem?.average_unit_price) || 0;
  }

  get adjustResultingQty(): number {
    const curr = Number(this.stockItem?.current_quantity || 0);
    const delta = this.adjustCalculatedTotalQty;
    return this.adjustIsIncrease ? curr + delta : curr - delta;
  }

  get adjustExceedsAvailable(): boolean {
    return !this.adjustIsIncrease && !this.allowNegativeStock && this.adjustResultingQty < 0;
  }

  onAdjustReasonTypeChange(): void {
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (this.adjustForm.vendorId) {
        this.onAdjustVendorChange();
      } else {
        this.vendorReturnStockItems = [];
      }
    } else {
      this.vendorReturnStockItems = [];
    }
    this.onAdjustFormQuantityChange();
  }

  onAdjustVendorChange(): void {
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (this.adjustForm.vendorId) {
        const vendorId = Number(this.adjustForm.vendorId);
        this.isLoadingVendorItems = true;
        this.stockService.getVendorReturnItems(vendorId).subscribe({
          next: (res) => {
            this.isLoadingVendorItems = false;
            this.vendorReturnStockItems = res.success && res.data ? res.data : [];
            this.onAdjustFormQuantityChange();
          },
          error: () => {
            this.isLoadingVendorItems = false;
            this.vendorReturnStockItems = [];
            this.onAdjustFormQuantityChange();
          },
        });
        return;
      } else {
        this.vendorReturnStockItems = [];
        this.onAdjustFormQuantityChange();
        return;
      }
    }
    this.onAdjustFormQuantityChange();
  }

  onAdjustFormQuantityChange(): void {
    const max = this.adjustMaxQuantity;
    if (max !== null) {
      const typed = Number(this.adjustForm.quantity);
      if (Number.isFinite(typed) && typed > max) {
        this.adjustForm.quantity = max;
      }
    }
    const avg = Number(this.stockItem?.average_unit_price) || 0;
    const totalQty = this.adjustCalculatedTotalQty;
    this.adjustForm.totalPrice = +(totalQty * avg).toFixed(2);
    this.adjustForm.unitPrice = avg;
  }

  public settingsService = inject(SettingsService);
  private stockService = inject(StockService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadVendors();
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (id) {
        this.stockId = id;
        this.loadItemData();
      } else {
        this.router.navigate(['/stock']);
      }
    });
  }

  /**
   * Fills the vendor picker in the purchase form. A failure is reported by the
   * global error interceptor and left at that: the picker falls back to the
   * no-vendor row, so the page stays usable without the list.
   */
  private loadVendors(): void {
    this.vendorService
      .getVendors({ page: 1, limit: 200, status: 'ACTIVE', sortBy: 'name', sortOrder: 'ASC' })
      .subscribe({
        next: (res) => {
          if (res.success) this.vendors = res.data;
        },
        error: () => {},
      });
  }

  goBack(): void {
    this.router.navigate(['/stock']);
  }

  loadItemData(): void {
    this.isLoading = true;
    this.loadError = null;

    this.stockService.getStockItemById(this.stockId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.stockItem = res.data;
          this.entries = res.data.entries || [];
          this.movements = res.data.movements || [];
          // Also fetch full ledger and full movements history specifically for this item
          this.loadFullEntries();
          this.loadFullMovements();
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Shown inline by <app-page-loader>; the interceptor raises the toast,
        // so notifying again here would stack a third copy of the same message.
        this.loadError = err?.error?.message || 'Failed to load stock item details';
      },
    });
  }

  /**
   * Supplementary ledgers. The item itself has already rendered by the time
   * these run, so a failure leaves the page usable and is reported by the
   * interceptor's toast — but the callback is still required, or the rethrown
   * error becomes an unhandled rejection.
   */
  loadFullEntries(): void {
    this.stockService.getStockEntries(1, 200, this.stockId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.entries = res.data;
        }
      },
      error: () => {},
    });
  }

  loadFullMovements(): void {
    this.stockService.getStockMovements(1, 200, this.stockId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.movements = res.data;
        }
      },
      error: () => {},
    });
  }

  calcStockPercent(curr: number, low: number): number {
    const max = Math.max(low * 3, 50);
    return Math.min(100, Math.max(0, (curr / max) * 100));
  }

  // ── Helpers for calculations ─────────────────────────────────────────
  get calculatedTotalQuantity(): number {
    const qty = Number(this.purchaseForm.quantity) || 0;
    const mult = Number(this.purchaseForm.multiplier) || 1;
    return qty * mult;
  }

  get calculatedUnitPrice(): number {
    const totQty = this.calculatedTotalQuantity;
    const price = Number(this.purchaseForm.totalPrice) || 0;
    return totQty > 0 ? price / totQty : 0;
  }

  get projectedQuantity(): number {
    const curr = Number(this.stockItem?.current_quantity) || 0;
    return curr + this.calculatedTotalQuantity;
  }

  get projectedValue(): number {
    const currVal = Number(this.stockItem?.current_value) || 0;
    const price = Number(this.purchaseForm.totalPrice) || 0;
    return currVal + price;
  }

  get projectedAvgPrice(): number {
    const projQty = this.projectedQuantity;
    return projQty > 0 ? this.projectedValue / projQty : 0;
  }

  // ── Tab Filters & Pagination ─────────────────────────────────────────
  get filteredEntries(): StockEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.entries;
    return this.entries.filter(
      (e) =>
        e.entry_number.toLowerCase().includes(q) ||
        e.vendor_name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
    );
  }

  /**
   * The current page, never past the end of the list it is paging.
   *
   * A narrowing filter, a delete on the final page, or any refresh that
   * returns fewer rows used to leave `currentPage` pointing past the end and
   * the table rendering empty. Clamped on read rather than written back, so
   * it cannot fire a change-after-checked error during rendering.
   */
  safePage(totalItems: number): number {
    return Math.min(Math.max(1, this.currentPage), this.getTotalPages(totalItems));
  }

  get paginatedEntries(): StockEntry[] {
    const list = this.filteredEntries;
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get filteredMovements(): StockMovement[] {
    let list = this.movements;
    if (this.selectedMovementType !== 'all') {
      list = list.filter((m) => m.movement_type.toLowerCase() === this.selectedMovementType.toLowerCase());
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.movement_type.toLowerCase().includes(q) ||
        (m.reference_id && m.reference_id.toLowerCase().includes(q)) ||
        (m.reference_type && m.reference_type.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.created_by_name && m.created_by_name.toLowerCase().includes(q))
    );
  }

  get paginatedMovements(): StockMovement[] {
    const list = this.filteredMovements;
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  getCurrentTotal(): number {
    if (this.activeTab === 'ENTRIES') return this.filteredEntries.length;
    if (this.activeTab === 'MOVEMENTS') return this.filteredMovements.length;
    return 0;
  }

  getTotalPages(totalItems: number): number {
    return Math.ceil(totalItems / this.pageSize) || 1;
  }

  getPageNumbers(totalItems: number): number[] {
    return Array.from({ length: this.getTotalPages(totalItems) }, (_, i) => i + 1);
  }

  paginationStart(totalItems: number): number {
    return totalItems === 0 ? 0 : (this.safePage(totalItems) - 1) * this.pageSize + 1;
  }

  paginationEnd(totalItems: number): number {
    return Math.min(this.safePage(totalItems) * this.pageSize, totalItems);
  }

  // ── Actions ─────────────────────────────────────────────────────────
  viewMovementDetail(move: StockMovement): void {
    this.selectedMovementForView = move;
    this.showMovementViewModal = true;
  }

  viewEntryDetail(entry: StockEntry): void {
    this.selectedEntryForView = entry;
    this.showEntryViewModal = true;
  }

  openPurchaseModal(): void {
    const latestEntry = this.entries?.[0];
    const autoMultiplier = this.stockItem?.default_multiplier || latestEntry?.multiplier || (this.stockItem as any)?.multiplier || 1;
    this.purchaseForm = {
      quantity: null,
      multiplier: Number(autoMultiplier) || 1,
      totalPrice: null,
      vendorId: 0,
      notes: '',
    };
    this.showPurchaseModal = true;
  }

  openAdjustModal(): void {
    const avg = +(Number(this.stockItem?.average_unit_price) || 0).toFixed(4);
    this.adjustForm = {
      adjustmentType: 'DECREASE',
      vendorId: null,
      quantity: 1,
      multiplier: 1,
      totalPrice: +(1 * avg).toFixed(2),
      unitPrice: avg,
      reason: '',
      notes: '',
    };
    this.vendorReturnStockItems = [];
    this.showAdjustModal = true;
  }

  submitPurchaseEntry(): void {
    if (!this.purchaseForm.quantity || this.purchaseForm.quantity <= 0) {
      this.notify.error('Please enter a valid base quantity');
      return;
    }
    if (this.purchaseForm.totalPrice < 0 || this.purchaseForm.totalPrice === undefined) {
      this.notify.error('Please enter a valid total purchase price');
      return;
    }

    const payload = {
      ...this.purchaseForm,
      stockId: this.stockId,
      // 0 is the "no vendor" row, which the API books as 'Initial Setup'.
      vendorId: Number(this.purchaseForm.vendorId) || null,
    };

    this.stockService.createStockEntry(payload).subscribe({
      next: (res) => {
        this.notify.success(
          `Batch ${res.data.entryNumber} added: +${res.data.totalQuantity} units recorded to ${this.stockItem?.name}`
        );
        this.showPurchaseModal = false;
        this.loadItemData();
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to record purchase entry');
      },
    });
  }

  submitAdjust(): void {
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (!this.adjustForm.vendorId) {
        this.notify.error('Please select a supplier / vendor to return items to');
        return;
      }
      if (!this.selectedVendorReturnItem) {
        this.notify.error('This vendor has not supplied this stock item or has 0 returnable quantity');
        return;
      }
    }
    if (!this.adjustForm.reason) {
      this.notify.error('Please provide an adjustment reason');
      return;
    }

    if (this.adjustCalculatedTotalQty <= 0) {
      this.notify.error('Please enter a valid quantity greater than 0');
      return;
    }

    if (this.adjustOverMax) {
      const unit = this.stockItem?.unit_type || 'units';
      if (this.adjustForm.adjustmentType === 'return_to_supplier' && this.selectedVendorReturnItem) {
        this.notify.error(
          `Cannot return ${this.adjustCalculatedTotalQty} ${unit}. Maximum return allowed for vendor is ${this.adjustMaxQuantity} ${unit} (Vendor Net Returnable: ${this.selectedVendorReturnItem.vendor_returnable_quantity}, Available Stock: ${this.selectedVendorReturnItem.current_available_stock}).`
        );
      } else {
        this.notify.error(
          `Cannot remove ${this.adjustCalculatedTotalQty} ${unit} — available stock is ${this.adjustAvailableQuantity} ${unit}.`
        );
      }
      return;
    }

    const payload: any = {
      stockId: this.stockId,
      adjustmentType: this.adjustForm.adjustmentType,
      quantity: Number(this.adjustForm.quantity) || 0,
      multiplier: 1,
      totalPrice: Number(this.adjustForm.totalPrice) || 0,
      reason: this.adjustForm.reason,
      notes: this.adjustForm.notes,
      vendorId: this.adjustForm.vendorId ? Number(this.adjustForm.vendorId) : undefined,
    };

    this.stockService.adjustStock(payload).subscribe({
      next: (res) => {
        this.notify.success(`Stock adjusted successfully. New balance: ${res.data.newQuantity}`);
        this.showAdjustModal = false;
        this.loadItemData();
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to adjust stock');
      },
    });
  }

  exportItemCSV(): void {
    if (!this.stockItem) return;
    if (this.activeTab === 'ENTRIES') {
      const headers = ['Entry Number', 'Date', 'Item Name', 'Quantity', 'Multiplier', 'Total Quantity', 'Total Price', 'Unit Price', 'Source', 'Vendor', 'Notes'];
      const rows = this.filteredEntries.map((e) => [
        e.entry_number,
        `"${e.entry_date}"`,
        `"${this.stockItem.name}"`,
        e.quantity,
        e.multiplier,
        e.total_quantity,
        e.total_price,
        e.unit_price,
        `"${e.supplier || 'Initial Setup'}"`,
        `"${e.vendor_name || ''}"`,
        `"${e.notes || ''}"`,
      ]);
      this.downloadCSV(`Ledger_Entries_${this.stockItem.stock_code}`, headers, rows);
    } else {
      const headers = ['Date', 'Movement Type', 'Reference Type', 'Reference ID', 'Quantity Moved', 'Unit Cost', 'Impact Value', 'Balance Qty', 'Balance Value', 'Notes'];
      const rows = this.filteredMovements.map((m) => [
        `"${m.movement_date}"`,
        m.movement_type,
        m.reference_type,
        `"${m.reference_id || ''}"`,
        m.quantity,
        m.unit_price,
        m.total_value,
        m.balance_quantity,
        m.balance_value,
        `"${m.notes || ''}"`,
      ]);
      this.downloadCSV(`Audit_Movements_${this.stockItem.stock_code}`, headers, rows);
    }
  }

  private downloadCSV(filename: string, headers: string[], rows: any[][]): void {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

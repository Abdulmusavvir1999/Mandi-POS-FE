import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { StockService } from '../../../core/services/stock.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { StockItem, StockEntry, StockMovement } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & NAVIGATION                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Inventory & Costing</span>
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
              <h1 class="page-title text-2xl font-black text-[#2E1065]">{{ stockItem?.name || 'Loading Stock Item...' }}</h1>
              
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
              <span class="meta-item" *ngIf="stockItem?.category_name">
                <span class="material-symbols-outlined meta-icon">category</span>
                <span>Category: <strong>{{ stockItem?.category_name }}</strong></span>
              </span>
              <span class="meta-dot" *ngIf="stockItem?.category_name">•</span>
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
            <span>⚖ Adjust / Wastage</span>
          </button>

          <button
            type="button"
            (click)="openPurchaseModal()"
            class="action-btn btn-gradient-purple"
            title="Add Purchase Entry Batch"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>+ Purchase Entry (Stock In)</span>
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
              <span class="text-xs font-normal text-[var(--text-muted)]">{{ stockItem?.unit_type }}s</span>
            </span>
            <span class="kpi-pill pill-live">● Live Balance</span>
          </div>
          <!-- Health progress bar -->
          <div class="w-full bg-[var(--card-border)] rounded-full h-1.5 overflow-hidden mt-2">
            <div
              class="h-full rounded-full transition-all duration-300"
              [style.width.%]="calcStockPercent(stockItem?.current_quantity || 0, stockItem?.min_stock_alert || 10)"
              [ngClass]="{
                '!bg-[#DC2626]': (stockItem?.current_quantity || 0) <= 0,
                '!bg-[#EA580C]': (stockItem?.current_quantity || 0) > 0 && (stockItem?.current_quantity || 0) <= (stockItem?.min_stock_alert || 0),
                '!bg-[#16A34A]': (stockItem?.current_quantity || 0) > (stockItem?.min_stock_alert || 0)
              }"
            ></div>
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
              [placeholder]="activeTab === 'ENTRIES' ? 'Search entries by number, supplier, invoice...' : 'Search movements by reference, notes, author...'"
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
            minWidth="200px"
          ></app-custom-dropdown>

          <!-- Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ getCurrentTotal() }} records
          </span>
        </div>

        <div class="toolbar-actions-group">
          <button
            type="button"
            (click)="loadItemData()"
            class="action-btn btn-outline-purple"
            title="Refresh"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>
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
                <th style="width: 16%;">Supplier & Invoice #</th>
                <th style="width: 10%;">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedEntries">
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

                <!-- Supplier & Invoice -->
                <td>
                  <div class="text-xs font-semibold text-[var(--text-main)] truncate">{{ entry.supplier || 'Direct Purchase / Opening' }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ entry.invoice_number || 'No Invoice #' }}</div>
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
                      + Record First Purchase Batch
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
              <tr *ngFor="let move of paginatedMovements">
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
        <div class="modal-content p-6 max-w-lg">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge is-success">
                <span class="material-symbols-outlined">add_shopping_cart</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">Stock Purchase: {{ stockItem?.name }}</h3>
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
            <!-- Formula Section: Quantity × Multiplier -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-[#6B21A8] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#7E22CE]" style="font-size: 18px;">calculate</span>
                  <span class="uppercase tracking-wider">Purchase Formula: Quantity × Multiplier</span>
                </div>
                <span class="text-[10px] font-bold text-[#7E22CE] bg-[#F3E8FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  3-Tier Stock Ledger
                </span>
              </div>

              <!-- Base Quantity & Multiplier Grid -->
              <div class="grid grid-cols-2 gap-4 items-start">
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                    Base Quantity
                  </label>
                  <input
                    title="Base Quantity"
                    type="number"
                    min="0.001"
                    step="any"
                    [(ngModel)]="purchaseForm.quantity"
                    name="quantity"
                    class="form-control font-mono font-bold text-base w-full"
                    placeholder="e.g. 5"
                    required
                  />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                    Multiplier
                  </label>
                  <input
                    title="Multiplier"
                    type="number"
                    min="0.001"
                    step="any"
                    [(ngModel)]="purchaseForm.multiplier"
                    name="multiplier"
                    class="form-control font-mono font-bold text-base w-full"
                    placeholder="e.g. 4"
                    required
                  />
                </div>
              </div>

              <!-- Live Total Quantity Display -->
              <div class="flex items-center justify-between p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs shadow-xs w-full">
                <span class="text-[#4B5563] font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#16A34A]" style="font-size: 18px;">inventory_2</span>
                  <span>Calculated Total Quantity:</span>
                </span>
                <span class="font-mono font-black text-sm text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-3 py-1 rounded-lg">
                  {{ calculatedTotalQuantity | number:'1.0-3' }} {{ stockItem?.unit_type || 'units' }}
                </span>
              </div>

              <!-- Price Grid: Total Purchase Price vs Resulting Unit Cost -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between min-h-[20px] mb-2">
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
                  <div class="flex items-center justify-between min-h-[20px] mb-2">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Resulting Unit Cost
                    </label>
                    <span class="text-[9px] text-[#7E22CE] font-bold bg-[#F3E8FF] px-1.5 py-0.5 rounded border border-[#DDD6FE] whitespace-nowrap">
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
              <div *ngIf="stockItem" class="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs space-y-1.5 w-full">
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

            <!-- Supplier & Invoice Details -->
            <div class="grid grid-cols-2 gap-4 items-start pt-1">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Supplier Name
                </label>
                <input
                  title="Supplier Name"
                  type="text"
                  [(ngModel)]="purchaseForm.supplier"
                  name="supplier"
                  placeholder="e.g. Al-Watania Poultry"
                  class="form-control text-xs w-full"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Invoice / Bill #
                </label>
                <input
                  title="Invoice / Bill #"
                  type="text"
                  [(ngModel)]="purchaseForm.invoiceNumber"
                  name="invoiceNumber"
                  placeholder="e.g. INV-9042"
                  class="form-control font-mono text-xs w-full"
                />
              </div>
            </div>

            <!-- Notes -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                Notes (Optional)
              </label>
              <input
                title="Notes (Optional)"
                type="text"
                [(ngModel)]="purchaseForm.notes"
                name="notes"
                placeholder="e.g. Morning fresh stock batch"
                class="form-control text-xs w-full"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[#E9D5FF]">
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
        <div class="modal-content p-6 max-w-md">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined">tune</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">Adjust Stock / Record Wastage</h3>
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
            <div class="grid grid-cols-2 gap-4 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Movement / Reason Type
                </label>
                <app-custom-dropdown
                  [options]="adjustmentTypeOptions"
                  [(ngModel)]="adjustForm.adjustmentType"
                  name="adjustmentType"
                  minWidth="100%"
                  placeholder="Select Reason..."
                ></app-custom-dropdown>
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Quantity ({{ stockItem?.unit_type }})
                </label>
                <input
                  title="Quantity"
                  type="number"
                  min="0.001"
                  step="any"
                  [(ngModel)]="adjustForm.quantity"
                  name="quantity"
                  class="form-control font-mono font-bold text-[#7E22CE] w-full"
                  required
                />
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                Mandatory Audit Reason
              </label>
              <input
                title="Mandatory Audit Reason"
                type="text"
                [(ngModel)]="adjustForm.reason"
                name="reason"
                placeholder="e.g. Physical stock count check, trimming loss"
                class="form-control w-full"
                required
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[#E9D5FF]">
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
                Apply Adjustment ✓
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class StockDetailComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public stockItemId!: number;
  public stockItem: any = null;
  public entries: StockEntry[] = [];
  public movements: StockMovement[] = [];

  public activeTab: 'ENTRIES' | 'MOVEMENTS' | 'PROFILE' = 'ENTRIES';
  public searchQuery = '';
  public selectedMovementType = 'all';
  public pageSize = 10;
  public currentPage = 1;

  public movementFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Movement Types', icon: 'history' },
    { value: 'in', label: 'IN (Purchases / Additions)', icon: 'add_circle' },
    { value: 'out', label: 'OUT (Sales / Deductions)', icon: 'remove_circle' },
    { value: 'adjustment', label: 'ADJUSTMENT (Audit Correction)', icon: 'tune' },
    { value: 'wastage', label: 'WASTAGE (Kitchen Loss)', icon: 'delete' },
    { value: 'return', label: 'RETURN', icon: 'reply' },
  ];

  public adjustmentTypeOptions: DropdownOption[] = [
    { value: 'adjustment', label: 'Manual Adjustment', icon: 'tune', description: 'Correction from physical audit' },
    { value: 'wastage', label: 'Kitchen Wastage / Spoilage', icon: 'delete', description: 'Trimming loss, spoiled, expired' },
    { value: 'return', label: 'Return to Supplier', icon: 'reply', description: 'Returned items to vendor' },
    { value: 'INCREASE', label: 'INCREASE (+ Audit)', icon: 'arrow_upward', description: 'Found excess stock on audit' },
    { value: 'DECREASE', label: 'DECREASE (- Audit)', icon: 'arrow_downward', description: 'Stock deficit adjustment' },
  ];

  public showPurchaseModal = false;
  public showAdjustModal = false;

  public purchaseForm: any = {
    quantity: 5,
    multiplier: 4,
    totalPrice: 2000,
    supplier: '',
    invoiceNumber: '',
    notes: '',
  };

  public adjustForm: any = {
    adjustmentType: 'adjustment',
    quantity: 1,
    reason: '',
    notes: '',
  };

  public settingsService = inject(SettingsService);
  private stockService = inject(StockService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (id) {
        this.stockItemId = id;
        this.loadItemData();
      } else {
        this.router.navigate(['/stock']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/stock']);
  }

  loadItemData(): void {
    this.isLoading = true;
    this.loadError = null;

    this.stockService.getStockItemById(this.stockItemId).subscribe({
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
        this.loadError = err?.error?.message || 'Failed to load stock item details';
        this.notify.error(this.loadError || 'Error loading stock item');
      },
    });
  }

  loadFullEntries(): void {
    this.stockService.getStockEntries(1, 200, this.stockItemId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.entries = res.data;
        }
      },
    });
  }

  loadFullMovements(): void {
    this.stockService.getStockMovements(1, 200, this.stockItemId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.movements = res.data;
        }
      },
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
    if (!this.searchQuery) return this.entries;
    const q = this.searchQuery.toLowerCase();
    return this.entries.filter(
      (e) =>
        e.entry_number.toLowerCase().includes(q) ||
        e.supplier?.toLowerCase().includes(q) ||
        e.invoice_number?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
    );
  }

  get paginatedEntries(): StockEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEntries.slice(start, start + this.pageSize);
  }

  get filteredMovements(): StockMovement[] {
    let list = this.movements;
    if (this.selectedMovementType !== 'all') {
      list = list.filter((m) => m.movement_type.toLowerCase() === this.selectedMovementType.toLowerCase());
    }
    if (!this.searchQuery) return list;
    const q = this.searchQuery.toLowerCase();
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
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMovements.slice(start, start + this.pageSize);
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
    return totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  paginationEnd(totalItems: number): number {
    return Math.min(this.currentPage * this.pageSize, totalItems);
  }

  // ── Actions ─────────────────────────────────────────────────────────
  openPurchaseModal(): void {
    this.purchaseForm = {
      quantity: 5,
      multiplier: 4,
      totalPrice: 2000,
      supplier: '',
      invoiceNumber: '',
      notes: '',
    };
    this.showPurchaseModal = true;
  }

  openAdjustModal(): void {
    this.adjustForm = {
      adjustmentType: 'adjustment',
      quantity: 1,
      reason: '',
      notes: '',
    };
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
      stockItemId: this.stockItemId,
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
    if (!this.adjustForm.reason) {
      this.notify.error('Please provide an adjustment reason');
      return;
    }

    const payload = {
      ...this.adjustForm,
      stockItemId: this.stockItemId,
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
      const headers = ['Entry Number', 'Date', 'Item Name', 'Quantity', 'Multiplier', 'Total Quantity', 'Total Price', 'Unit Price', 'Supplier', 'Invoice #', 'Notes'];
      const rows = this.filteredEntries.map((e) => [
        e.entry_number,
        `"${e.entry_date}"`,
        `"${this.stockItem.name}"`,
        e.quantity,
        e.multiplier,
        e.total_quantity,
        e.total_price,
        e.unit_price,
        `"${e.supplier || ''}"`,
        `"${e.invoice_number || ''}"`,
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StockService } from '../../core/services/stock.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockItem, StockEntry, StockMovement, Product, StockUnitType } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Inventory & Costing</span>
        <span class="breadcrumb-separator">›</span>
        <span>Stock Management</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">3-Tier Stock Architecture</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">warehouse</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Stock & Inventory Ledger</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ totalLiveQuantity | number:'1.0-2' }} Total Units Available</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">inventory_2</span>
                <span>Master SKUs: <strong>{{ stockItems.length }} Tracked Items</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">payments</span>
                <span>Total Inventory Value: <strong>{{ totalLiveValue | appCurrency:'1.0-2' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">receipt_long</span>
                <span>Purchase Entries: <strong>{{ stockEntries.length }} Batches</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="refreshActiveTab()"
            class="action-btn btn-outline-purple"
            title="Refresh Stock Data"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="openCreateMasterModal()"
            class="action-btn btn-outline-purple"
            title="Add New Master Stock Item"
          >
            <span class="material-symbols-outlined">add_box</span>
            <span>+ Master Item</span>
          </button>

          <button
            type="button"
            (click)="openAdjustModal()"
            class="action-btn btn-outline-purple"
            title="Adjust Stock / Record Wastage"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>⚖ Adjust / Wastage</span>
          </button>

          <button
            type="button"
            (click)="openPurchaseModal()"
            class="action-btn btn-gradient-purple"
            title="Record Stock Purchase (Qty x Multiplier)"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>+ Purchase Entry (Stock In)</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION TABS (3-TIER ARCHITECTURE)                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <!-- Tab 1: Stock Master -->
        <button
          type="button"
          (click)="activeTab = 'MASTER'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'MASTER'"
        >
          <span class="material-symbols-outlined">inventory_2</span>
          <span>1. Stock Master (Balance)</span>
          <span class="tab-count-badge">{{ stockItems.length }}</span>
        </button>

        <!-- Tab 2: Stock Purchase Entries -->
        <button
          type="button"
          (click)="activeTab = 'ENTRIES'; currentPage = 1; loadStockEntries()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'ENTRIES'"
        >
          <span class="material-symbols-outlined">shopping_cart_checkout</span>
          <span>2. Purchase Entries (Ledger)</span>
          <span class="tab-count-badge">{{ stockEntries.length }}</span>
        </button>

        <!-- Tab 3: Stock Movements History -->
        <button
          type="button"
          (click)="activeTab = 'MOVEMENTS'; currentPage = 1; loadStockMovements()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'MOVEMENTS'"
        >
          <span class="material-symbols-outlined">history</span>
          <span>3. Movement History (Audit)</span>
          <span class="tab-count-badge">{{ stockMovements.length }}</span>
        </button>

        <!-- Tab 4: Low Stock Alerts -->
        <button
          type="button"
          (click)="activeTab = 'LOW_STOCK'; currentPage = 1; loadLowStockAlerts()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'LOW_STOCK'"
        >
          <span class="material-symbols-outlined">warning</span>
          <span>Low Stock Alerts</span>
          <span class="tab-count-badge" [class.text-[#DC2626]]="lowStockList.length > 0">{{ lowStockList.length }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. KPI METRIC MINI CARDS STRIP                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Master Stock Items</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">inventory_2</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ stockItems.length }}</span>
            <span class="kpi-pill pill-purple">Master SKUs</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Current Available Quantity</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">warehouse</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ totalLiveQuantity | number:'1.0-2' }}</span>
            <span class="kpi-pill pill-live">● Live Balance</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Inventory Valuation</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ totalLiveValue | appCurrency:'1.0-2' }}</span>
            <span class="kpi-pill pill-purple">Total Value</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Purchase Entries Logged</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ stockEntries.length }}</span>
            <span class="kpi-pill pill-blue">Invoices/Batches</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Low Stock Alert</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">warning</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number" [ngClass]="lowStockList.length > 0 ? 'text-[#DC2626]' : ''">{{ lowStockList.length }}</span>
            <span class="kpi-pill pill-amber">Needs Attention</span>
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
              title="Search stock items"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              [placeholder]="getSearchPlaceholder()"
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

          <!-- Unit Type filter (for Master tab) -->
          <app-custom-dropdown
            *ngIf="activeTab === 'MASTER'"
            [options]="unitFilterOptions"
            [(ngModel)]="selectedUnitType"
            (valueChange)="currentPage = 1; loadStockMaster()"
            placeholder="All Units"
            minWidth="160px"
          ></app-custom-dropdown>

          <!-- Movement Type filter (for Movements tab) -->
          <app-custom-dropdown
            *ngIf="activeTab === 'MOVEMENTS'"
            [options]="movementFilterOptions"
            [(ngModel)]="selectedMovementType"
            (valueChange)="currentPage = 1; loadStockMovements()"
            placeholder="All Movement Types"
            minWidth="200px"
          ></app-custom-dropdown>

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
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. TAB CONTENT TABLES                                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->

      <!-- ── TAB 1: STOCK MASTER (stock_items) ────────────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'MASTER'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 12%;">Stock Code</th>
                <th style="width: 22%;">Item Name</th>
                <th style="width: 10%;">Unit Type</th>
                <th style="width: 14%;">Current Quantity</th>
                <th style="width: 14%;">Stock Value</th>
                <th style="width: 14%;">Avg Unit Price</th>
                <th style="width: 14%; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let item of paginatedMasterItems"
                class="clickable-row"
                (click)="viewItemHistory(item)"
                title="Open stock ledger view"
              >
                <!-- Stock Code -->
                <td>
                  <span class="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--bg-app)] px-2.5 py-1 rounded-md border border-[var(--card-border)]">
                    {{ item.stock_code }}
                  </span>
                </td>

                <!-- Name & Alert Status -->
                <td>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-xl bg-[var(--primary-light)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs text-[var(--primary)] shrink-0 shadow-xs"
                    >
                      <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--text-main)] text-xs truncate flex items-center gap-1.5">
                        <span>{{ item.name }}</span>
                        <span *ngIf="item.status === 'inactive'" class="badge badge-danger text-[9px] py-0 px-1">Inactive</span>
                      </div>
                      <div class="text-[10px] text-[var(--text-muted)]">
                        Alert Threshold: {{ item.min_stock_alert }} {{ item.unit_type }}s
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Unit Type -->
                <td>
                  <span class="badge badge-primary uppercase font-mono text-[10px]">
                    {{ item.unit_type }}
                  </span>
                </td>

                <!-- Current Quantity with Health Bar -->
                <td>
                  <div class="space-y-1 max-w-[140px]">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-mono font-black" [ngClass]="item.is_low_stock ? 'text-[#DC2626]' : 'text-[var(--text-main)]'">
                        {{ item.current_quantity | number:'1.0-3' }} <span class="text-[10px] font-normal text-[var(--text-muted)]">{{ item.unit_type }}</span>
                      </span>
                    </div>
                    <div class="w-full bg-[var(--card-border)] rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                        [ngClass]="{
                          '!bg-[#DC2626]': item.current_quantity <= 0,
                          '!bg-[#EA580C]': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                          '!bg-[#16A34A]': item.current_quantity > item.min_stock_alert
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Current Total Value -->
                <td>
                  <span class="font-mono font-bold text-xs text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {{ item.current_value | appCurrency:'1.0-2' }}
                  </span>
                </td>

                <!-- Weighted Average Unit Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-[var(--text-main)]">
                    {{ item.average_unit_price | appCurrency:'1.0-4' }} <span class="text-[10px] text-[var(--text-muted)]">/ {{ item.unit_type }}</span>
                  </span>
                </td>

                <!-- Actions -->
                <td style="text-align: center;" class="row-actions-cell" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      (click)="quickPurchaseEntry(item)"
                      class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs !text-[#16A34A] hover:!bg-[#DCFCE7]"
                      title="Add Purchase Entry"
                    >
                      + Entry
                    </button>
                    <button
                      type="button"
                      (click)="quickAdjust(item)"
                      class="action-btn btn-outline-purple !py-1 !px-2 !text-xs"
                      title="Adjust Stock"
                    >
                      ⚖ Adjust
                    </button>
                    <button
                      type="button"
                      (click)="viewItemHistory(item)"
                      class="action-btn btn-outline-purple !py-1 !px-2 !text-xs"
                      title="View Details & Ledger"
                    >
                      <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredMasterItems.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'warehouse' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Stock Master Items Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from server…' : loadError ? loadError : 'No master stock items match your search filter.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── TAB 2: PURCHASE ENTRIES (stock_entries) ──────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'ENTRIES'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Entry # & Date</th>
                <th style="width: 20%;">Stock Item</th>
                <th style="width: 16%;">Formula (Qty × Mult)</th>
                <th style="width: 12%;">Total Qty</th>
                <th style="width: 12%;">Total Price</th>
                <th style="width: 12%;">Unit Price</th>
                <th style="width: 14%;">Supplier & Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedStockEntries">
                <!-- Entry # & Date -->
                <td>
                  <div class="font-mono text-xs font-bold text-[#2E1065]">{{ entry.entry_number }}</div>
                  <div class="text-[10px] text-[#6B7280] font-mono">{{ entry.entry_date | date:'dd/MM/yyyy HH:mm' }}</div>
                </td>

                <!-- Stock Item Name -->
                <td>
                  <div class="font-bold text-xs text-[var(--text-main)]">{{ entry.stock_item_name }}</div>
                  <div class="text-[10px] font-mono text-[var(--primary)]">{{ entry.stock_code }}</div>
                </td>

                <!-- Qty x Multiplier -->
                <td>
                  <div class="font-mono text-xs text-[#2E1065]">
                    <strong>{{ entry.quantity }}</strong> × {{ entry.multiplier }}
                  </div>
                  <div class="text-[10px] text-[var(--text-muted)]">Base Qty × Multiplier</div>
                </td>

                <!-- Total Qty -->
                <td>
                  <span class="font-mono font-black text-xs text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    {{ entry.total_quantity | number:'1.0-3' }} {{ entry.unit_type }}s
                  </span>
                </td>

                <!-- Total Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-purple-900">
                    {{ entry.total_price | appCurrency:'1.0-2' }}
                  </span>
                </td>

                <!-- Unit Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-[#2E1065]">
                    {{ entry.unit_price | appCurrency:'1.0-4' }}
                  </span>
                </td>

                <!-- Supplier & Invoice -->
                <td>
                  <div class="text-xs font-semibold text-[var(--text-main)] truncate">{{ entry.supplier || 'Direct Purchase' }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ entry.invoice_number || 'No Invoice #' }}</div>
                </td>
              </tr>

              <tr *ngIf="filteredStockEntries.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'receipt_long' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Purchase Entries Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching purchase entries…' : loadError ? loadError : 'No purchase entries recorded yet. Click "+ Purchase Entry" to add one.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── TAB 3: STOCK MOVEMENTS (stock_movements) ──────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'MOVEMENTS'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Date & Time</th>
                <th style="width: 18%;">Stock Item</th>
                <th style="width: 12%;">Movement Type</th>
                <th style="width: 14%;">Quantity Moved</th>
                <th style="width: 14%;">Unit Cost & Value</th>
                <th style="width: 16%;">Balance after Move</th>
                <th style="width: 12%; text-align: right;">Author / Staff</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let move of paginatedStockMovements">
                <!-- Timestamp -->
                <td class="text-xs text-[#6B7280] font-mono">
                  {{ move.movement_date | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>

                <!-- Stock Item Name & Code -->
                <td>
                  <div class="font-bold text-xs text-[#2E1065]">{{ move.stock_item_name }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ move.reference_type }} • {{ move.reference_id || 'Direct' }}</div>
                </td>

                <!-- Movement Type Pill -->
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

                <!-- Quantity Moved -->
                <td class="font-mono font-bold text-xs" [ngClass]="move.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'">
                  {{ move.quantity > 0 ? '+' + (move.quantity | number:'1.0-3') : (move.quantity | number:'1.0-3') }} {{ move.unit_type }}
                </td>

                <!-- Unit Cost & Movement Total Value -->
                <td>
                  <div class="font-mono text-xs font-semibold text-[var(--text-main)]">{{ move.unit_price | appCurrency:'1.0-2' }}/unit</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">Val: {{ move.total_value | appCurrency:'1.0-2' }}</div>
                </td>

                <!-- Balance After Movement -->
                <td>
                  <div class="font-mono text-xs font-black text-purple-950">
                    {{ move.balance_quantity | number:'1.0-3' }} {{ move.unit_type }}
                  </div>
                  <div class="text-[10px] text-purple-700 font-mono font-medium">
                    Total Val: {{ move.balance_value | appCurrency:'1.0-2' }}
                  </div>
                </td>

                <!-- Author -->
                <td style="text-align: right;" class="text-xs font-semibold text-[#2E1065]">
                  {{ move.created_by_name || 'System Auto' }}
                </td>
              </tr>

              <tr *ngIf="filteredStockMovements.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'history' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Movement Records Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching movement audit trail…' : loadError ? loadError : 'No stock movement logs match your current filter.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── TAB 4: LOW STOCK ALERTS ─────────────────────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'LOW_STOCK'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Stock Code</th>
                <th style="width: 26%;">Stock Item</th>
                <th style="width: 14%;">Unit Type</th>
                <th style="width: 20%;">Stock Level vs Min Threshold</th>
                <th style="width: 16%;">Current Valuation</th>
                <th style="width: 10%; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let item of paginatedLowStockList"
                class="clickable-row"
                (click)="viewItemHistory(item)"
                title="Open stock ledger view"
              >
                <td>
                  <span class="font-mono text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-1 rounded-md border border-[#FECACA]">
                    {{ item.stock_code }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center font-bold text-xs text-[#DC2626] shrink-0 shadow-xs"
                    >
                      <span class="material-symbols-outlined" style="font-size: 20px;">warning</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--text-main)] text-xs truncate">
                        {{ item.name }}
                      </div>
                      <div class="text-[10px] text-[#DC2626] font-semibold">Critical Restock Needed</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-primary uppercase font-mono text-[10px]">{{ item.unit_type }}</span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#DC2626]">
                    {{ item.current_quantity | number:'1.0-3' }} / Min {{ item.min_stock_alert }} {{ item.unit_type }}s
                  </span>
                </td>
                <td>
                  <span class="font-mono font-bold text-xs text-purple-900">
                    {{ item.current_value | appCurrency:'1.0-2' }}
                  </span>
                </td>
                <td style="text-align: center;" class="row-actions-cell" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      (click)="quickPurchaseEntry(item)"
                      class="action-btn btn-gradient-purple !py-1 !px-2.5 !text-xs"
                    >
                      + Restock
                    </button>
                    <button
                      type="button"
                      (click)="viewItemHistory(item)"
                      class="action-btn btn-outline-purple !py-1 !px-2 !text-xs"
                      title="View Details & Ledger"
                    >
                      <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="lowStockList.length === 0">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon !text-[#16A34A]">verified</span>
                    <div class="empty-title text-[#16A34A]">All Stock Levels Healthy</div>
                    <p class="empty-desc">All tracked items are currently stocked above their minimum threshold alert level.</p>
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
      <!-- 7. MODAL: PURCHASE ENTRY (Qty x Multiplier => Total Qty & Price)-->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showPurchaseModal">
        <div class="modal-content p-6 max-w-lg">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge is-success">
                <span class="material-symbols-outlined">add_shopping_cart</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">Stock Purchase / Addition Entry</h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Calculates Quantity × Multiplier and updates Weighted Average Cost</p>
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
            <!-- Select Master Item -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                Select Stock Item Master
              </label>
              <app-custom-dropdown
                [options]="stockItemOptions"
                [(ngModel)]="purchaseForm.stockItemId"
                name="stockItemId"
                [searchable]="true"
                minWidth="100%"
                placeholder="Select Stock Item..."
              ></app-custom-dropdown>
            </div>

            <!-- Formula Section: Quantity × Multiplier -->
            <div class="pt-4 border-t border-[#E9D5FF] space-y-4">
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
                  {{ calculatedTotalQuantity | number:'1.0-3' }} {{ selectedPurchaseItem?.unit_type || 'units' }}
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
                    <span class="text-[10px] font-normal text-[#6B7280]">/ {{ selectedPurchaseItem?.unit_type || 'unit' }}</span>
                  </div>
                </div>
              </div>

              <!-- Impact Simulation Card -->
              <div *ngIf="selectedPurchaseItem" class="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs space-y-1.5 w-full">
                <div class="font-bold text-[#065F46] flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size: 16px;">trending_up</span>
                  <span>Projected Master Stock Balance Update:</span>
                </div>
                <div class="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>Current: <strong>{{ selectedPurchaseItem.current_quantity }}</strong> {{ selectedPurchaseItem.unit_type }} &#64; {{ selectedPurchaseItem.average_unit_price | appCurrency:'1.0-2' }}</div>
                  <div class="text-[#047857]">Adding: <strong>+{{ calculatedTotalQuantity }}</strong> &#64; {{ calculatedUnitPrice | appCurrency:'1.0-2' }}</div>
                </div>
                <div class="pt-1 border-t border-[#A7F3D0] flex items-center justify-between font-mono font-black text-[#065F46]">
                  <span>New Balance: {{ projectedQuantity | number:'1.0-3' }} {{ selectedPurchaseItem.unit_type }}</span>
                  <span>New Avg Cost: {{ projectedAvgPrice | appCurrency:'1.0-4' }}</span>
                </div>
              </div>
            </div>

            <!-- Supplier & Invoice Details -->
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Supplier Name</label>
                <input
                  title="Supplier Name"
                  type="text"
                  [(ngModel)]="purchaseForm.supplier"
                  name="supplier"
                  placeholder="e.g. Al-Watania Poultry"
                  class="form-control text-xs"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Invoice / Bill #</label>
                <input
                  title="Invoice / Bill #"
                  type="text"
                  [(ngModel)]="purchaseForm.invoiceNumber"
                  name="invoiceNumber"
                  placeholder="e.g. INV-9042"
                  class="form-control font-mono text-xs"
                />
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Notes (Optional)</label>
              <input
                title="Notes (Optional)"
                type="text"
                [(ngModel)]="purchaseForm.notes"
                name="notes"
                placeholder="e.g. Fresh stock delivered at morning shift"
                class="form-control text-xs"
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
      <!-- 8. MODAL: STOCK ADJUSTMENT & WASTAGE                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showAdjustModal">
        <div class="modal-content p-6 max-w-md">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined">tune</span>
              </span>
              <h3 class="text-lg font-black text-[#2E1065] leading-tight">Stock Adjustment / Wastage</h3>
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
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Select Stock Master Item</label>
              <app-custom-dropdown
                [options]="stockItemOptions"
                [(ngModel)]="adjustForm.stockItemId"
                name="stockItemId"
                [searchable]="true"
                minWidth="100%"
                placeholder="Select Stock Item..."
              ></app-custom-dropdown>
            </div>

            <div class="grid grid-cols-2 gap-3 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Movement / Reason Type</label>
                <app-custom-dropdown
                  [options]="adjustmentTypeOptions"
                  [(ngModel)]="adjustForm.adjustmentType"
                  name="adjustmentType"
                  minWidth="100%"
                  placeholder="Select Reason..."
                ></app-custom-dropdown>
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Quantity</label>
                <input
                  title="Quantity"
                  type="number"
                  min="0.001"
                  step="any"
                  [(ngModel)]="adjustForm.quantity"
                  name="quantity"
                  class="form-control font-mono font-bold text-[#7E22CE]"
                  required
                />
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">Mandatory Audit Reason</label>
              <input
                title="Mandatory Audit Reason"
                type="text"
                [(ngModel)]="adjustForm.reason"
                name="reason"
                placeholder="e.g. Physical inventory count, kitchen trimming loss"
                class="form-control"
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

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 9. MODAL: CREATE NEW STOCK MASTER ITEM                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showCreateMasterModal">
        <div class="modal-content p-6 w-full max-w-[620px] shadow-2xl" style="max-width: 620px; width: 100%;">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">add_box</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">Create Stock Master Item</h3>
                <p class="text-xs text-[#6B7280] mt-0.5">Define master raw materials, batch units, and opening balances</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showCreateMasterModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitCreateMaster()" class="space-y-4">
            <!-- Row 1: Stock Item Name -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                Stock Item Name
              </label>
              <input
                title="Stock Item Name"
                type="text"
                [(ngModel)]="masterForm.name"
                name="name"
                placeholder="e.g. Fresh Chicken, Mutton Meat, Basmati Rice"
                class="form-control text-sm w-full"
                required
              />
            </div>

            <!-- Row 2: Stock Code & Unit Type Grid -->
            <div class="grid grid-cols-2 gap-4 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Stock Code (Optional)
                </label>
                <input
                  title="Stock Code (Optional)"
                  type="text"
                  [(ngModel)]="masterForm.stockCode"
                  name="stockCode"
                  placeholder="Auto-generated if blank"
                  class="form-control font-mono text-xs w-full"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                  Unit Type
                </label>
                <app-custom-dropdown
                  [options]="unitTypeOptions"
                  [(ngModel)]="masterForm.unitType"
                  name="unitType"
                  minWidth="100%"
                  placeholder="Select Unit Type"
                ></app-custom-dropdown>
              </div>
            </div>

            <!-- Row 3: Minimum Stock Alert Threshold -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                Minimum Stock Alert Threshold
              </label>
              <input
                title="Minimum Stock Alert Threshold"
                type="number"
                min="0"
                step="any"
                [(ngModel)]="masterForm.minStockAlert"
                name="minStockAlert"
                class="form-control font-mono text-sm w-full"
                placeholder="10"
              />
            </div>

            <!-- Row 4: Opening Balance Section Header & Divider -->
            <div class="pt-4 border-t border-[#E9D5FF] space-y-4">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-[#6B21A8] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[#7E22CE]" style="font-size: 18px;">calculate</span>
                  <span class="uppercase tracking-wider">Opening Balance (Optional): Quantity × Multiplier</span>
                </div>
                <span class="text-[10px] font-bold text-[#7E22CE] bg-[#F3E8FF] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  3-Tier Stock Ledger
                </span>
              </div>

              <!-- Initial Quantity & Multiplier Grid -->
              <div class="grid grid-cols-2 gap-4 items-start">
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 block">
                    Initial Quantity (Base)
                  </label>
                  <input
                    title="Initial Quantity (Base)"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="masterForm.initialQuantity"
                    (ngModelChange)="onMasterFormQuantityChange()"
                    name="initialQuantity"
                    class="form-control font-mono font-bold w-full"
                    placeholder="0"
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
                    [(ngModel)]="masterForm.multiplier"
                    (ngModelChange)="onMasterFormQuantityChange()"
                    name="multiplier"
                    class="form-control font-mono font-bold w-full"
                    placeholder="1"
                  />
                </div>
              </div>

              <!-- Live Initial Total Quantity Badge -->
              <div class="flex items-center justify-between p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs shadow-xs w-full">
                <span class="text-[#4B5563] font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#16A34A]" style="font-size: 18px;">inventory_2</span>
                  <span>Calculated Total Quantity:</span>
                </span>
                <span class="font-mono font-black text-sm text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-3 py-1 rounded-lg">
                  {{ masterCalculatedTotalQty | number:'1.0-3' }} {{ masterForm.unitType || 'units' }}
                </span>
              </div>

              <!-- Cost Grid: Total Cost vs Unit Price with Synchronized Baseline Alignment -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between min-h-[20px] mb-2">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Initial Total Cost / Price (₹)
                    </label>
                  </div>
                  <input
                    title="Initial Total Cost / Price (₹)"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="masterForm.initialTotalPrice"
                    (ngModelChange)="onMasterFormTotalPriceChange()"
                    name="initialTotalPrice"
                    class="form-control font-mono font-bold text-[#2E1065] w-full"
                    placeholder="0.00"
                  />
                </div>
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between min-h-[20px] mb-2">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Initial Unit Cost (₹)
                    </label>
                    <span class="text-[9px] text-[#7E22CE] font-bold bg-[#F3E8FF] px-1.5 py-0.5 rounded border border-[#DDD6FE] whitespace-nowrap">
                      Auto-calculated
                    </span>
                  </div>
                  <input
                    title="Initial Unit Cost (₹)"
                    type="number"
                    [value]="masterCalculatedUnitCost"
                    name="initialPrice"
                    class="form-control font-mono font-bold bg-[#F3F4F6] text-[#4B5563] cursor-not-allowed border-[#D1D5DB] w-full"
                    placeholder="0.00"
                    disabled
                    readonly
                  />
                </div>
              </div>

              <!-- Live Summary Strip -->
              <div *ngIf="masterCalculatedTotalQty > 0" class="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between font-mono w-full">
                <span class="text-purple-900 font-medium">Total Valuation: <strong class="text-purple-950 font-black">{{ (masterForm.initialTotalPrice || 0) | appCurrency:'1.0-2' }}</strong></span>
                <span class="text-purple-700 font-medium">Unit Rate: <strong class="text-purple-900 font-black">{{ masterCalculatedUnitCost | appCurrency:'1.0-4' }}</strong> / {{ masterForm.unitType || 'unit' }}</span>
              </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showCreateMasterModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Create Stock Item ✓
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 10. MODAL: ITEM DETAIL & MOVEMENT AUDIT DRAWER                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showItemDetailModal && selectedItemDetail">
        <div class="modal-content p-6 max-w-2xl max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined">inventory_2</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065]">{{ selectedItemDetail.name }}</h3>
                <div class="text-xs text-[#6B7280] font-mono">{{ selectedItemDetail.stock_code }} • Unit: {{ selectedItemDetail.unit_type }}</div>
              </div>
            </div>
            <button
              type="button"
              (click)="showItemDetailModal = false"
              class="modal-close-btn" title="Close" aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Summary Metric Strip -->
          <div class="grid grid-cols-3 gap-3 my-4">
            <div class="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
              <div class="text-[10px] text-purple-700 font-bold uppercase">Current Quantity</div>
              <div class="text-base font-mono font-black text-purple-950">{{ selectedItemDetail.current_quantity }} {{ selectedItemDetail.unit_type }}s</div>
            </div>
            <div class="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <div class="text-[10px] text-green-700 font-bold uppercase">Current Valuation</div>
              <div class="text-base font-mono font-black text-green-900">{{ selectedItemDetail.current_value | appCurrency:'1.0-2' }}</div>
            </div>
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <div class="text-[10px] text-amber-700 font-bold uppercase">Weighted Avg Cost</div>
              <div class="text-base font-mono font-black text-amber-900">{{ selectedItemDetail.average_unit_price | appCurrency:'1.0-4' }}</div>
            </div>
          </div>

          <!-- Recent Purchase Batches -->
          <div class="space-y-2 mt-4">
            <h4 class="text-xs font-bold text-[#6B21A8] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined" style="font-size: 16px;">receipt_long</span>
              <span>Purchase Entries (Ledger History)</span>
            </h4>
            <div class="border border-[#E9D5FF] rounded-xl overflow-hidden text-xs">
              <table class="saas-data-table">
                <thead>
                  <tr>
                    <th>Entry #</th>
                    <th>Date</th>
                    <th>Formula</th>
                    <th>Total Qty</th>
                    <th>Total Price</th>
                    <th>Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let e of selectedItemDetail.entries">
                    <td class="font-mono font-bold">{{ e.entry_number }}</td>
                    <td class="font-mono text-[#6B7280]">{{ e.entry_date | date:'dd/MM/yy HH:mm' }}</td>
                    <td class="font-mono">{{ e.quantity }} × {{ e.multiplier }}</td>
                    <td class="font-mono font-bold text-[#16A34A]">{{ e.total_quantity }}</td>
                    <td class="font-mono font-bold">{{ e.total_price | appCurrency:'1.0-2' }}</td>
                    <td class="font-mono">{{ e.unit_price | appCurrency:'1.0-4' }}</td>
                  </tr>
                  <tr *ngIf="!selectedItemDetail.entries?.length">
                    <td colspan="6" class="text-center py-3 text-[var(--text-muted)]">No purchase batches recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Movements Audit -->
          <div class="space-y-2 mt-5">
            <h4 class="text-xs font-bold text-[#6B21A8] uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined" style="font-size: 16px;">history</span>
              <span>Stock Movements (Audit Trail)</span>
            </h4>
            <div class="border border-[#E9D5FF] rounded-xl overflow-hidden text-xs">
              <table class="saas-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Balance</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of selectedItemDetail.movements">
                    <td class="font-mono text-[#6B7280]">{{ m.movement_date | date:'dd/MM/yy HH:mm' }}</td>
                    <td>
                      <span class="badge uppercase text-[9px]" [ngClass]="m.movement_type === 'in' ? 'badge-success' : m.movement_type === 'out' ? 'badge-danger' : 'badge-warning'">
                        {{ m.movement_type }}
                      </span>
                    </td>
                    <td class="font-mono font-bold" [ngClass]="m.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'">
                      {{ m.quantity > 0 ? '+' + m.quantity : m.quantity }}
                    </td>
                    <td class="font-mono">{{ m.unit_price | appCurrency:'1.0-2' }}</td>
                    <td class="font-mono font-bold text-purple-900">{{ m.balance_quantity }} ({{ m.balance_value | appCurrency:'1.0-0' }})</td>
                    <td class="text-[10px] text-[var(--text-muted)] truncate max-w-[140px]">{{ m.notes }}</td>
                  </tr>
                  <tr *ngIf="!selectedItemDetail.movements?.length">
                    <td colspan="6" class="text-center py-3 text-[var(--text-muted)]">No movements recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
  private router = inject(Router);

  public activeTab: 'MASTER' | 'ENTRIES' | 'MOVEMENTS' | 'LOW_STOCK' = 'MASTER';

  // 3-Tier Data Lists
  public stockItems: StockItem[] = [];
  public stockEntries: StockEntry[] = [];
  public stockMovements: StockMovement[] = [];
  public lowStockList: StockItem[] = [];
  public allProducts: Product[] = [];

  // Filters & Pagination
  public searchQuery = '';
  public selectedUnitType = '';
  public selectedMovementType = 'all';
  public pageSize = 10;
  public currentPage = 1;

  // Dropdown Options
  public unitTypeOptions: DropdownOption[] = [
    { value: 'piece', label: 'Piece (pcs)', icon: 'category' },
    { value: 'kg', label: 'Kilogram (kg)', icon: 'scale' },
    { value: 'liter', label: 'Liter (L)', icon: 'water_drop' },
    { value: 'gram', label: 'Gram (g)', icon: 'grain' },
    { value: 'portion', label: 'Portion', icon: 'restaurant' },
    { value: 'box', label: 'Box', icon: 'inventory_2' },
    { value: 'packet', label: 'Packet', icon: 'package_2' },
    { value: 'other', label: 'Other', icon: 'widgets' },
  ];

  public unitFilterOptions: DropdownOption[] = [
    { value: '', label: 'All Units', icon: 'apps' },
    { value: 'piece', label: 'Piece (pcs)', icon: 'category' },
    { value: 'kg', label: 'Kilogram (kg)', icon: 'scale' },
    { value: 'liter', label: 'Liter (L)', icon: 'water_drop' },
    { value: 'gram', label: 'Gram (g)', icon: 'grain' },
    { value: 'portion', label: 'Portion', icon: 'restaurant' },
    { value: 'box', label: 'Box', icon: 'inventory_2' },
    { value: 'packet', label: 'Packet', icon: 'package_2' },
  ];

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

  get stockItemOptions(): DropdownOption[] {
    return this.stockItems.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.stock_code})`,
      description: `Current: ${item.current_quantity} ${item.unit_type}s`,
      badge: `${item.unit_type}`,
      icon: 'inventory_2',
    }));
  }

  // Modals state
  public showPurchaseModal = false;
  public showAdjustModal = false;
  public showCreateMasterModal = false;
  public showItemDetailModal = false;
  public selectedItemDetail: any = null;

  // Forms
  public purchaseForm: any = {
    stockItemId: 1,
    quantity: 5,
    multiplier: 4,
    totalPrice: 2000,
    supplier: '',
    invoiceNumber: '',
    notes: '',
    entryDate: '',
  };

  public adjustForm: any = {
    stockItemId: 1,
    adjustmentType: 'adjustment',
    quantity: 1,
    reason: '',
    notes: '',
  };

  public masterForm: any = {
    name: '',
    stockCode: '',
    unitType: 'piece',
    minStockAlert: 10,
    initialQuantity: 0,
    multiplier: 1,
    initialTotalPrice: 0,
    initialPrice: 0,
  };

  get masterCalculatedTotalQty(): number {
    const qty = Number(this.masterForm.initialQuantity) || 0;
    const mult = Number(this.masterForm.multiplier) || 1;
    return qty * mult;
  }

  get masterCalculatedUnitCost(): number {
    const totQty = this.masterCalculatedTotalQty;
    const totPrice = Number(this.masterForm.initialTotalPrice) || 0;
    return totQty > 0 ? +(totPrice / totQty).toFixed(4) : 0;
  }

  onMasterFormQuantityChange(): void {
    const totQty = this.masterCalculatedTotalQty;
    if (totQty > 0 && this.masterForm.initialTotalPrice > 0) {
      this.masterForm.initialPrice = this.masterCalculatedUnitCost;
    } else {
      this.masterForm.initialPrice = 0;
    }
  }

  onMasterFormTotalPriceChange(): void {
    const totQty = this.masterCalculatedTotalQty;
    if (totQty > 0 && this.masterForm.initialTotalPrice !== undefined && this.masterForm.initialTotalPrice !== null) {
      this.masterForm.initialPrice = this.masterCalculatedUnitCost;
    } else {
      this.masterForm.initialPrice = 0;
    }
  }

  ngOnInit(): void {
    this.loadStockMaster();
    this.loadStockEntries();
    this.loadStockMovements();
    this.loadLowStockAlerts();
    this.loadAllProducts();
  }

  refreshActiveTab(): void {
    if (this.activeTab === 'MASTER') this.loadStockMaster();
    else if (this.activeTab === 'ENTRIES') this.loadStockEntries();
    else if (this.activeTab === 'MOVEMENTS') this.loadStockMovements();
    else this.loadLowStockAlerts();
  }

  // ── 1. Load Stock Master (stock_items) ──────────────────────────────
  loadStockMaster(): void {
    this.isLoading = true;
    this.loadError = null;
    this.stockService.getStock(1, 200, undefined, undefined, false, 'active', this.selectedUnitType || undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.stockItems = res.data;
          if (this.stockItems.length > 0 && !this.purchaseForm.stockItemId) {
            this.purchaseForm.stockItemId = this.stockItems[0].id;
            this.adjustForm.stockItemId = this.stockItems[0].id;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load stock items from server.';
      },
    });
  }

  // ── 2. Load Purchase Entries (stock_entries) ────────────────────────
  loadStockEntries(): void {
    this.stockService.getStockEntries(1, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.stockEntries = res.data;
        }
      },
    });
  }

  // ── 3. Load Movements (stock_movements) ─────────────────────────────
  loadStockMovements(): void {
    this.stockService.getStockMovements(1, 200, undefined, this.selectedMovementType !== 'all' ? this.selectedMovementType : undefined).subscribe({
      next: (res) => {
        if (res.success) {
          this.stockMovements = res.data;
        }
      },
    });
  }

  // ── 4. Load Low Stock Alerts ────────────────────────────────────────
  loadLowStockAlerts(): void {
    this.stockService.getLowStockAlerts().subscribe({
      next: (res) => {
        if (res.success) {
          this.lowStockList = res.data;
        }
      },
    });
  }

  loadAllProducts(): void {
    this.productService.getProducts(1, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.allProducts = res.data;
        }
      },
    });
  }

  // ── Live Calculation Helpers for Purchase Modal ────────────────────
  get selectedPurchaseItem(): StockItem | undefined {
    return this.stockItems.find((i) => i.id === Number(this.purchaseForm.stockItemId));
  }

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
    const curr = Number(this.selectedPurchaseItem?.current_quantity) || 0;
    return curr + this.calculatedTotalQuantity;
  }

  get projectedValue(): number {
    const currVal = Number(this.selectedPurchaseItem?.current_value) || 0;
    const price = Number(this.purchaseForm.totalPrice) || 0;
    return currVal + price;
  }

  get projectedAvgPrice(): number {
    const projQty = this.projectedQuantity;
    return projQty > 0 ? this.projectedValue / projQty : 0;
  }

  // ── Metrics & Totals ────────────────────────────────────────────────
  get totalLiveQuantity(): number {
    return this.stockItems.reduce((sum, item) => sum + Number(item.current_quantity || 0), 0);
  }

  get totalLiveValue(): number {
    return this.stockItems.reduce((sum, item) => sum + Number(item.current_value || 0), 0);
  }

  // ── Tab Search & Pagination Filter Helpers ──────────────────────────
  get filteredMasterItems(): StockItem[] {
    if (!this.searchQuery) return this.stockItems;
    const q = this.searchQuery.toLowerCase();
    return this.stockItems.filter(
      (s) => s.name.toLowerCase().includes(q) || s.stock_code.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q)
    );
  }

  get paginatedMasterItems(): StockItem[] {
    const list = this.filteredMasterItems;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get filteredStockEntries(): StockEntry[] {
    if (!this.searchQuery) return this.stockEntries;
    const q = this.searchQuery.toLowerCase();
    return this.stockEntries.filter(
      (e) =>
        e.entry_number.toLowerCase().includes(q) ||
        e.stock_item_name?.toLowerCase().includes(q) ||
        e.stock_code?.toLowerCase().includes(q) ||
        e.supplier?.toLowerCase().includes(q) ||
        e.invoice_number?.toLowerCase().includes(q)
    );
  }

  get paginatedStockEntries(): StockEntry[] {
    const list = this.filteredStockEntries;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get filteredStockMovements(): StockMovement[] {
    if (!this.searchQuery) return this.stockMovements;
    const q = this.searchQuery.toLowerCase();
    return this.stockMovements.filter(
      (m) =>
        m.stock_item_name?.toLowerCase().includes(q) ||
        m.stock_code?.toLowerCase().includes(q) ||
        m.movement_type.toLowerCase().includes(q) ||
        (m.reference_id && m.reference_id.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q))
    );
  }

  get paginatedStockMovements(): StockMovement[] {
    const list = this.filteredStockMovements;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get paginatedLowStockList(): StockItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.lowStockList.slice(start, start + this.pageSize);
  }

  getCurrentTotal(): number {
    if (this.activeTab === 'MASTER') return this.filteredMasterItems.length;
    if (this.activeTab === 'ENTRIES') return this.filteredStockEntries.length;
    if (this.activeTab === 'MOVEMENTS') return this.filteredStockMovements.length;
    return this.lowStockList.length;
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

  getSearchPlaceholder(): string {
    if (this.activeTab === 'MASTER') return 'Search master items by name or code (e.g. Chicken, STK-0001)...';
    if (this.activeTab === 'ENTRIES') return 'Search purchase entries by entry #, item, supplier, invoice...';
    if (this.activeTab === 'MOVEMENTS') return 'Search movement audit trail by reference, item, notes...';
    return 'Search low stock alerts...';
  }

  // ── Modals Trigger Actions ──────────────────────────────────────────
  openPurchaseModal(): void {
    if (this.stockItems.length > 0 && !this.purchaseForm.stockItemId) {
      this.purchaseForm.stockItemId = this.stockItems[0].id;
    }
    this.showPurchaseModal = true;
  }

  quickPurchaseEntry(item: StockItem): void {
    this.purchaseForm.stockItemId = item.id;
    this.showPurchaseModal = true;
  }

  openAdjustModal(): void {
    if (this.stockItems.length > 0 && !this.adjustForm.stockItemId) {
      this.adjustForm.stockItemId = this.stockItems[0].id;
    }
    this.showAdjustModal = true;
  }

  quickAdjust(item: StockItem): void {
    this.adjustForm.stockItemId = item.id;
    this.showAdjustModal = true;
  }

  openCreateMasterModal(): void {
    this.masterForm = {
      name: '',
      stockCode: '',
      unitType: 'piece',
      minStockAlert: 10,
      initialQuantity: 0,
      multiplier: 1,
      initialTotalPrice: 0,
      initialPrice: 0,
    };
    this.showCreateMasterModal = true;
  }

  viewItemHistory(item: StockItem): void {
    this.router.navigate(['/stock', item.id]);
  }

  // ── Form Submissions ────────────────────────────────────────────────
  submitPurchaseEntry(): void {
    if (!this.purchaseForm.quantity || this.purchaseForm.quantity <= 0) {
      this.notify.error('Please enter a valid base quantity');
      return;
    }
    if (this.purchaseForm.totalPrice < 0 || this.purchaseForm.totalPrice === undefined) {
      this.notify.error('Please enter a valid total purchase price');
      return;
    }

    this.stockService.createStockEntry(this.purchaseForm).subscribe({
      next: (res) => {
        this.notify.success(
          `Entry ${res.data.entryNumber} recorded: +${res.data.totalQuantity} units added to ${res.data.stockItemName}`
        );
        this.showPurchaseModal = false;
        this.loadStockMaster();
        this.loadStockEntries();
        this.loadStockMovements();
        this.loadLowStockAlerts();
      },
    });
  }

  submitAdjust(): void {
    if (!this.adjustForm.reason) {
      this.notify.error('Please provide an adjustment reason');
      return;
    }

    this.stockService.adjustStock(this.adjustForm).subscribe({
      next: (res) => {
        this.notify.success(`Stock adjusted successfully for ${res.data.stockItemName}. New balance: ${res.data.newQuantity}`);
        this.showAdjustModal = false;
        this.loadStockMaster();
        this.loadStockMovements();
        this.loadLowStockAlerts();
      },
    });
  }

  submitCreateMaster(): void {
    if (!this.masterForm.name) {
      this.notify.error('Please enter stock item name');
      return;
    }

    const payload = {
      ...this.masterForm,
      initialQuantity: Number(this.masterForm.initialQuantity) || 0,
      multiplier: Number(this.masterForm.multiplier) || 1,
      initialTotalPrice: Number(this.masterForm.initialTotalPrice) || 0,
      initialPrice: Number(this.masterForm.initialPrice) || 0,
    };

    this.stockService.createStockItem(payload).subscribe({
      next: (res) => {
        this.notify.success(`Created master item: ${res.data.name} (${res.data.stock_code})`);
        this.showCreateMasterModal = false;
        this.loadStockMaster();
      },
    });
  }

  // ── Export CSV ──────────────────────────────────────────────────────
  exportCSV(): void {
    if (this.activeTab === 'MASTER') {
      const items = this.filteredMasterItems;
      const headers = ['Stock Code', 'Name', 'Unit Type', 'Current Quantity', 'Valuation (Value)', 'Avg Unit Price', 'Min Alert', 'Status'];
      const rows = items.map((s) => [
        s.stock_code,
        `"${s.name}"`,
        s.unit_type,
        s.current_quantity,
        s.current_value,
        s.average_unit_price,
        s.min_stock_alert,
        s.status,
      ]);
      this.downloadCSV('Stock_Master_Balances', headers, rows);
    } else if (this.activeTab === 'ENTRIES') {
      const entries = this.filteredStockEntries;
      const headers = ['Entry Number', 'Date', 'Stock Code', 'Item Name', 'Quantity', 'Multiplier', 'Total Quantity', 'Total Price', 'Unit Price', 'Supplier', 'Invoice #'];
      const rows = entries.map((e) => [
        e.entry_number,
        `"${e.entry_date}"`,
        e.stock_code || '',
        `"${e.stock_item_name || ''}"`,
        e.quantity,
        e.multiplier,
        e.total_quantity,
        e.total_price,
        e.unit_price,
        `"${e.supplier || ''}"`,
        `"${e.invoice_number || ''}"`,
      ]);
      this.downloadCSV('Stock_Purchase_Entries_Ledger', headers, rows);
    } else {
      const moves = this.filteredStockMovements;
      const headers = ['Date', 'Item Name', 'Type', 'Ref Type', 'Ref ID', 'Quantity', 'Unit Cost', 'Move Value', 'Balance Qty', 'Balance Value', 'Notes'];
      const rows = moves.map((m) => [
        `"${m.movement_date}"`,
        `"${m.stock_item_name || ''}"`,
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
      this.downloadCSV('Stock_Movements_Audit_History', headers, rows);
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


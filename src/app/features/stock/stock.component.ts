import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StockService } from '../../core/services/stock.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockItem, StockEntry, StockMovement, Product, StockUnitType, Vendor } from '../../core/models';
import { VendorService } from '../../core/services/vendor.service';
import { SettingsService } from '../../core/services/settings.service';
import { StockLayoutService } from '../../core/services/stock-layout.service';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../shared/styles/default-action-buttons.styles';
import { STOCK_LAYOUT_CSS } from '../../shared/styles/stock-layout.styles';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';
@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe, ActionLoadingDirective],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading inventory…"
        subMessage="Fetching stock items from the server."
        icon="inventory_2"
        (retry)="loadStockMaster()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>Inventory</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Stock Management</span>
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

          <a
            routerLink="/settings"
            [queryParams]="{ tab: 'stockdesign' }"
            class="action-btn btn-outline-purple"
            style="text-decoration: none;"
            title="Customize Stock Ledger Layout & Styling"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>Customize</span>
          </a>

          <button
            type="button"
            (click)="openCreateMasterModal()"
            class="action-btn btn-outline-purple"
            title="Add New Master Stock Item"
          >
            <span class="material-symbols-outlined">add_box</span>
            <span>Master Item</span>
          </button>

          <button
            type="button"
            (click)="openAdjustModal()"
            class="action-btn btn-outline-purple"
            title="Adjust Stock / Record Wastage"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>Adjust / Wastage</span>
          </button>

          <button
            type="button"
            (click)="openPurchaseModal()"
            class="action-btn btn-gradient-purple"
            title="Record Stock Purchase (Qty x Multiplier)"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>Purchase Entry (Stock In)</span>
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

        <!-- Tab 4: Comprehensive Stock Alerts -->
        <button
          type="button"
          (click)="activeTab = 'LOW_STOCK'; currentPage = 1; loadStockAlerts()"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'LOW_STOCK'"
        >
          <span class="material-symbols-outlined">notifications_active</span>
          <span>4. Inventory Alerts Center</span>
          <span class="tab-count-badge" [class.text-[#DC2626]]="alertSummary.totalAlerts > 0">{{ alertSummary.totalAlerts }}</span>
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

        <!-- KPI 6: Audit Trail Events / Movements Logged -->
        <div class="kpi-card card-accent-teal">
          <div class="kpi-header-row">
            <span class="kpi-title">Audit Trail Events</span>
            <span class="kpi-icon-bubble bg-teal-tint">
              <span class="material-symbols-outlined">history</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-teal-700">{{ stockMovements.length }}</span>
            <span class="kpi-pill pill-teal">Audit Logs</span>
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
            minWidth="240px"
          ></app-custom-dropdown>

          <!-- Vendor filter (for Entries tab) -->
          <app-custom-dropdown
            *ngIf="activeTab === 'ENTRIES'"
            [options]="vendorFilterOptions"
            [(ngModel)]="selectedVendorFilter"
            (valueChange)="currentPage = 1; loadStockEntries()"
            placeholder="All Vendors"
            [searchable]="true"
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

      <!-- ── TAB 1: STOCK MASTER (stocks) ────────────────────────── -->
      <div
        class="stock-stage mb-6"
        *ngIf="activeTab === 'MASTER'"
        [ngClass]="stockLayout.rootClass()"
        [ngStyle]="stockLayout.pageCssVars()"
      >
        <!-- Empty State -->
        <div *ngIf="filteredMasterItems.length === 0" class="empty-state-card w-full py-12">
          <div class="empty-state-box">
            <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'warehouse' }}</span>
            <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Stock Master Items Found' }}</div>
            <p class="empty-desc">{{ isLoading ? 'Fetching records from server…' : loadError ? loadError : 'No master stock items match your search filter.' }}</p>
          </div>
        </div>

        <!-- 1. WAREHOUSE METRIC GRID -->
        <div *ngIf="stockLayout.effectiveKey() === 'warehouse' && filteredMasterItems.length > 0" class="stock-wh-grid">
          <div
            *ngFor="let item of paginatedMasterItems"
            (click)="viewItemHistory(item)"
            class="stock-wh-card cursor-pointer"
            title="Click to view item details and ledger history"
          >
            <div>
              <div class="stock-wh-header">
                <span class="stock-wh-sku">{{ item.stock_code }}</span>
                <span
                  class="stock-wh-status-badge"
                  [ngClass]="item.current_quantity <= 0 ? 'is-critical' : item.is_low_stock ? 'is-warning' : 'is-healthy'"
                >
                  ● {{ item.current_quantity <= 0 ? 'Depleted' : item.is_low_stock ? 'Low Stock' : 'Optimal' }}
                </span>
              </div>

              <div class="stock-wh-body">
                <h4 class="stock-wh-title">{{ item.name }}</h4>
                <p class="stock-wh-sub">Threshold: {{ item.min_stock_alert }} {{ item.unit_type }}s</p>
              </div>

              <div class="stock-wh-meter-box">
                <div class="stock-wh-meter-row">
                  <span class="stock-wh-qty">
                    {{ item.current_quantity | number:'1.0-3' }} <span class="stock-wh-unit">{{ item.unit_type }}</span>
                  </span>
                  <span class="stock-wh-threshold">Min: {{ item.min_stock_alert }}</span>
                </div>
                <div class="stock-wh-bar-bg">
                  <div
                    class="stock-wh-bar-fill"
                    [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                    [ngClass]="{
                      '!bg-[#DC2626]': item.current_quantity <= 0,
                      '!bg-[#EA580C]': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                      '!bg-[#16A34A]': item.current_quantity > item.min_stock_alert
                    }"
                  ></div>
                </div>
              </div>

              <div class="stock-wh-stats">
                <div class="stock-wh-stat-card">
                  <span class="stock-wh-stat-label">Inventory Value</span>
                  <span class="stock-wh-stat-value is-valuation">{{ item.current_value | appCurrency:'1.0-2' }}</span>
                </div>
                <div class="stock-wh-stat-card">
                  <span class="stock-wh-stat-label">Avg Unit Cost</span>
                  <span class="stock-wh-stat-value">{{ item.average_unit_price | appCurrency:'1.0-4' }}</span>
                </div>
              </div>
            </div>

            <div class="stock-wh-footer">
              <button
                type="button"
                (click)="$event.stopPropagation(); quickPurchaseEntry(item)"
                class="stock-wh-btn btn-entry"
                title="Add Purchase Entry"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">add_shopping_cart</span>
                <span>Entry</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); quickAdjust(item)"
                class="stock-wh-btn"
                title="Adjust Stock"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">tune</span>
                <span>Adjust</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); viewItemHistory(item)"
                class="stock-wh-btn"
                title="View Details & Ledger"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. AUDITED FINANCIAL LEDGER -->
        <div *ngIf="stockLayout.effectiveKey() === 'financial' && filteredMasterItems.length > 0" class="stock-fin-table-card">
          <table class="stock-fin-table">
            <thead>
              <tr>
                <th style="width: 14%;">Stock Code</th>
                <th style="width: 26%;">Item Description</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 16%;">Live Balance</th>
                <th style="width: 14%;">Valuation</th>
                <th style="width: 12%;">Avg Cost</th>
                <th style="width: 8%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let item of paginatedMasterItems"
                (click)="viewItemHistory(item)"
                class="stock-fin-row cursor-pointer"
                title="Click to view item details and ledger history"
              >
                <td>
                  <span class="stock-fin-sku">{{ item.stock_code }}</span>
                </td>
                <td>
                  <div class="stock-fin-name">{{ item.name }}</div>
                  <div class="stock-fin-meta">Min Alert: {{ item.min_stock_alert }} {{ item.unit_type }}s</div>
                </td>
                <td>
                  <span class="stock-fin-unit-pill">{{ item.unit_type }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="stock-fin-qty">{{ item.current_quantity | number:'1.0-3' }}</span>
                    <span
                      class="stock-fin-health-pill"
                      [ngClass]="item.current_quantity <= 0 ? 'is-critical' : item.is_low_stock ? 'is-warning' : 'is-healthy'"
                    >
                      {{ item.current_quantity <= 0 ? 'Empty' : item.is_low_stock ? 'Low' : 'Optimal' }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="stock-fin-valuation">{{ item.current_value | appCurrency:'1.0-2' }}</span>
                </td>
                <td>
                  <span class="stock-fin-cost">{{ item.average_unit_price | appCurrency:'1.0-4' }}</span>
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-1">
                    <button type="button" (click)="$event.stopPropagation(); quickPurchaseEntry(item)" class="stock-fin-btn" title="Purchase Entry">
                      <span class="material-symbols-outlined" style="font-size: 15px;">add_shopping_cart</span>
                    </button>
                    <button type="button" (click)="$event.stopPropagation(); viewItemHistory(item)" class="stock-fin-btn" title="View Ledger">
                      <span class="material-symbols-outlined" style="font-size: 15px;">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. COMPACT KANBAN STOCK TILES -->
        <div *ngIf="stockLayout.effectiveKey() === 'kanban' && filteredMasterItems.length > 0" class="stock-kan-grid">
          <div
            *ngFor="let item of paginatedMasterItems"
            (click)="viewItemHistory(item)"
            class="stock-kan-tile cursor-pointer"
            title="Click to view item details and ledger history"
          >
            <div class="stock-kan-header">
              <span class="stock-kan-sku">{{ item.stock_code }}</span>
              <span
                class="stock-kan-status-dot"
                [ngClass]="item.current_quantity <= 0 ? 'is-critical' : item.is_low_stock ? 'is-warning' : 'is-healthy'"
              ></span>
            </div>

            <div class="stock-kan-name">{{ item.name }}</div>

            <div class="stock-kan-qty-row">
              <span class="stock-kan-qty">
                {{ item.current_quantity | number:'1.0-3' }} <span class="stock-kan-unit">{{ item.unit_type }}</span>
              </span>
              <span class="stock-kan-val">{{ item.current_value | appCurrency:'1.0-2' }}</span>
            </div>

            <div class="stock-kan-bar">
              <div
                class="stock-kan-bar-fill"
                [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                [ngClass]="{
                  '!bg-[#DC2626]': item.current_quantity <= 0,
                  '!bg-[#EA580C]': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                  '!bg-[#16A34A]': item.current_quantity > item.min_stock_alert
                }"
              ></div>
            </div>

            <div class="stock-kan-footer">
              <span class="stock-kan-alert">Alert: {{ item.min_stock_alert }}</span>
              <div class="stock-kan-actions">
                <button type="button" (click)="$event.stopPropagation(); quickPurchaseEntry(item)" class="stock-kan-btn" title="Purchase Entry">
                  <span class="material-symbols-outlined" style="font-size: 13px;">add</span>
                </button>
                <button type="button" (click)="$event.stopPropagation(); viewItemHistory(item)" class="stock-kan-btn" title="Ledger">
                  <span class="material-symbols-outlined" style="font-size: 13px;">history</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. LIST VIEW -->
        <div *ngIf="stockLayout.effectiveKey() === 'list' && filteredMasterItems.length > 0" class="stock-list-container">
          <div
            *ngFor="let item of paginatedMasterItems"
            (click)="viewItemHistory(item)"
            class="stock-list-row cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors"
            title="Click to view item details and ledger history"
          >
            <div class="stock-list-left">
              <span class="stock-list-sku">{{ item.stock_code }}</span>
              <div>
                <div class="stock-list-title">{{ item.name }}</div>
                <div class="stock-list-sub">Min Alert: {{ item.min_stock_alert }} {{ item.unit_type }}s</div>
              </div>
            </div>

            <div>
              <span class="stock-list-unit-badge">{{ item.unit_type }}</span>
            </div>

            <div class="stock-list-qty-box">
              <span class="stock-list-qty-num">{{ item.current_quantity | number:'1.0-3' }} {{ item.unit_type }}</span>
              <div class="stock-list-bar">
                <div
                  class="stock-list-bar-fill"
                  [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                  [ngClass]="{
                    '!bg-[#DC2626]': item.current_quantity <= 0,
                    '!bg-[#EA580C]': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                    '!bg-[#16A34A]': item.current_quantity > item.min_stock_alert
                  }"
                ></div>
              </div>
            </div>

            <div>
              <span class="stock-list-val">{{ item.current_value | appCurrency:'1.0-2' }}</span>
            </div>

            <div>
              <span class="stock-list-cost">{{ item.average_unit_price | appCurrency:'1.0-4' }} / {{ item.unit_type }}</span>
            </div>

            <div class="stock-list-actions">
              <button
                type="button"
                (click)="$event.stopPropagation(); quickPurchaseEntry(item)"
                class="stock-list-btn btn-entry"
                title="Add Purchase Entry"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">add_shopping_cart</span>
                <span>Entry</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); quickAdjust(item)"
                class="stock-list-btn"
                title="Adjust Stock"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">tune</span>
                <span>Adjust</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); viewItemHistory(item)"
                class="stock-list-btn"
                title="Ledger Details"
              >
                <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 5. CARD VIEW -->
        <div *ngIf="stockLayout.effectiveKey() === 'card' && filteredMasterItems.length > 0" class="stock-card-grid">
          <div
            *ngFor="let item of paginatedMasterItems"
            (click)="viewItemHistory(item)"
            class="stock-card-item cursor-pointer"
            title="Click to view item details and ledger history"
          >
            <div>
              <div class="stock-card-top">
                <span class="stock-card-sku-pill">{{ item.stock_code }}</span>
                <span class="stock-card-unit-pill">{{ item.unit_type }}</span>
              </div>

              <h4 class="stock-card-name">{{ item.name }}</h4>
              <p class="stock-card-sub">Alert Threshold: {{ item.min_stock_alert }} {{ item.unit_type }}s</p>

              <div class="stock-card-progress">
                <div class="stock-card-progress-header">
                  <span class="stock-card-big-qty">{{ item.current_quantity | number:'1.0-3' }} <span style="font-size: 12px; font-weight: 500;">{{ item.unit_type }}</span></span>
                  <span
                    class="stock-card-health-label"
                    [ngClass]="item.current_quantity <= 0 ? 'text-[#DC2626]' : item.is_low_stock ? 'text-[#EA580C]' : 'text-[#16A34A]'"
                  >
                    {{ item.current_quantity <= 0 ? 'Out of Stock' : item.is_low_stock ? 'Low Stock' : 'Optimal Stock' }}
                  </span>
                </div>
                <div class="stock-card-bar-bg">
                  <div
                    class="stock-card-bar-fill"
                    [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                    [ngClass]="{
                      '!bg-[#DC2626]': item.current_quantity <= 0,
                      '!bg-[#EA580C]': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                      '!bg-[#16A34A]': item.current_quantity > item.min_stock_alert
                    }"
                  ></div>
                </div>
              </div>

              <div class="stock-card-values">
                <div class="stock-card-vbox">
                  <span class="stock-card-vbox-lbl">Valuation</span>
                  <span class="stock-card-vbox-val">{{ item.current_value | appCurrency:'1.0-2' }}</span>
                </div>
                <div class="stock-card-vbox">
                  <span class="stock-card-vbox-lbl">Unit Cost</span>
                  <span class="stock-card-vbox-val text-[var(--text-main)]">{{ item.average_unit_price | appCurrency:'1.0-4' }}</span>
                </div>
              </div>
            </div>

            <div class="stock-card-footer">
              <button
                type="button"
                (click)="$event.stopPropagation(); quickPurchaseEntry(item)"
                class="dv-btn is-success"
                title="Purchase Entry"
              >
                <span class="material-symbols-outlined">add_shopping_cart</span>
                <span>Purchase</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); quickAdjust(item)"
                class="dv-btn"
                title="Adjust"
              >
                <span class="material-symbols-outlined">tune</span>
                <span>Adjust</span>
              </button>
              <button
                type="button"
                (click)="$event.stopPropagation(); viewItemHistory(item)"
                class="dv-btn"
                title="Audit"
              >
                <span class="material-symbols-outlined">history</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB 2: PURCHASE ENTRIES (stock_vendor_purchase) ──────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'ENTRIES'">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 13%;">Entry # & Date</th>
                <th style="width: 18%;">Stock Item</th>
                <th style="width: 14%;">Formula (Qty × Mult)</th>
                <th style="width: 11%;">Total Qty</th>
                <th style="width: 11%;">Total Price</th>
                <th style="width: 11%;">Unit Price</th>
                <th style="width: 11%;">Vendor</th>
                <th style="width: 11%;">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedStockEntries" (click)="viewEntryDetail(entry)" class="cursor-pointer hover:bg-[#FAF5FF] dark:hover:bg-purple-950/20 transition-colors" title="Click to view purchase entry details">
                <!-- Entry # & Date -->
                <td>
                  <div class="font-mono text-xs font-bold text-[var(--text-main)]">{{ entry.entry_number }}</div>
                  <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ entry.entry_date | date:'dd/MM/yyyy HH:mm' }}</div>
                </td>

                <!-- Stock Item Name -->
                <td>
                  <div class="font-bold text-xs text-[var(--text-main)]">{{ entry.stock_item_name }}</div>
                  <div class="text-[10px] font-mono text-[var(--primary)]">{{ entry.stock_code }}</div>
                </td>

                <!-- Qty x Multiplier -->
                <td>
                  <div class="font-mono text-xs text-[var(--text-main)]">
                    <strong>{{ entry.quantity }}</strong> × {{ entry.multiplier }}
                  </div>
                  <div class="text-[10px] text-[var(--text-muted)]">Base Qty × Multiplier</div>
                </td>

                <!-- Total Qty -->
                <td>
                  <span class="font-mono font-black text-xs text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-[#BBF7D0] dark:border-emerald-800/40">
                    {{ entry.total_quantity | number:'1.0-3' }} {{ entry.unit_type }}s
                  </span>
                </td>

                <!-- Total Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-[var(--text-main)]">
                    {{ entry.total_price | appCurrency:'1.0-2' }}
                  </span>
                </td>

                <!-- Unit Price -->
                <td>
                  <span class="font-mono font-bold text-xs text-[var(--text-main)]">
                    {{ entry.unit_price | appCurrency:'1.0-4' }}
                  </span>
                </td>

                <!-- Vendor this batch was purchased from. Blank on the entries
                     recorded before a vendor was linked to a purchase. -->
                <td>
                  <div class="text-xs font-semibold text-[var(--text-main)] truncate">{{ entry.vendor_name || "—" }}</div>
                  <div class="text-[10px] font-mono text-[var(--primary)]" *ngIf="entry.vendor_code">{{ entry.vendor_code }}</div>
                </td>

                <!-- Source: whether the row is a vendor purchase or the
                     opening balance written when the item was created. -->
                <td>
                  <span class="stock-source-chip" [class.is-vendor]="entry.supplier === 'Vendor'">
                    <span class="material-symbols-outlined text-[13px]">{{ entry.supplier === 'Vendor' ? 'local_shipping' : 'inventory_2' }}</span>
                    {{ entry.supplier || 'Initial Setup' }}
                  </span>
                </td>
              </tr>

              <tr *ngIf="filteredStockEntries.length === 0">
                <td colspan="8" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'receipt_long' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Purchase Entries Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching purchase entries…' : loadError ? loadError : 'No purchase entries recorded yet. Click "Purchase Entry" to add one.' }}</p>
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
              <tr *ngFor="let move of paginatedStockMovements" (click)="viewMovementDetail(move)" class="cursor-pointer hover:bg-[#FAF5FF] dark:hover:bg-purple-950/20 transition-colors" title="Click to view movement audit details">
                <!-- Timestamp -->
                <td class="text-xs text-[var(--text-muted)] font-mono">
                  {{ move.movement_date | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>

                <!-- Stock Item Name & Code -->
                <td>
                  <div class="font-bold text-xs text-[var(--text-main)]">{{ move.stock_item_name }}</div>
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
                  <div class="font-mono text-xs font-black text-[var(--text-main)]">
                    {{ move.balance_quantity | number:'1.0-3' }} {{ move.unit_type }}
                  </div>
                  <div class="text-[10px] text-[var(--primary)] font-mono font-medium">
                    Total Val: {{ move.balance_value | appCurrency:'1.0-2' }}
                  </div>
                </td>

                <!-- Author -->
                <td style="text-align: right;" class="text-xs font-semibold text-[var(--text-main)]">
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

      <!-- ── TAB 4: INVENTORY ALERTS CENTER ──────────────────────────── -->
      <div class="table-container-card" *ngIf="activeTab === 'LOW_STOCK'">
        <!-- Alert Category Pills Bar -->
        <div class="flex items-center gap-2 p-3 bg-[var(--card-bg)] border-b border-[var(--card-border)] overflow-x-auto">
          <button
            type="button"
            (click)="setAlertFilter('all')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'all' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:opacity-80'"
          >
            <span class="material-symbols-outlined text-sm">notifications_active</span>
            <span>All Alerts</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'">
              {{ alertSummary.totalAlerts }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('out_of_stock')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'out_of_stock' ? 'bg-[#DC2626] text-white shadow-sm' : 'bg-white text-[#DC2626] border border-[#FECACA] hover:bg-red-50'"
          >
            <span class="material-symbols-outlined text-sm">production_quantity_limits</span>
            <span>Out of Stock</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'out_of_stock' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'">
              {{ alertSummary.outOfStock }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('low_stock')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'low_stock' ? 'bg-[#EA580C] text-white shadow-sm' : 'bg-white text-[#EA580C] border border-[#FED7AA] hover:bg-orange-50'"
          >
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>Low Stock</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'low_stock' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'">
              {{ alertSummary.lowStock }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('minimum_stock')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'minimum_stock' ? 'bg-[#B91C1C] text-white shadow-sm' : 'bg-white text-[#B91C1C] border border-[#FECACA] hover:bg-red-50'"
          >
            <span class="material-symbols-outlined text-sm">shield</span>
            <span>Safety Deficit</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'minimum_stock' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'">
              {{ alertSummary.minStock }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('reorder_level')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'reorder_level' ? 'bg-[#D97706] text-white shadow-sm' : 'bg-white text-[#D97706] border border-[#FDE68A] hover:bg-amber-50'"
          >
            <span class="material-symbols-outlined text-sm">reorder</span>
            <span>Reorder Level</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'reorder_level' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'">
              {{ alertSummary.reorderLevel }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('expiry')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'expiry' ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-white text-[#7C3AED] border border-[#DDD6FE] hover:bg-purple-50'"
          >
            <span class="material-symbols-outlined text-sm">event_busy</span>
            <span>Expiry Warnings</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'expiry' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'">
              {{ alertSummary.expired + alertSummary.expiringSoon }}
            </span>
          </button>

          <button
            type="button"
            (click)="setAlertFilter('overstock')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            [ngClass]="selectedAlertFilter === 'overstock' ? 'bg-[#0284C7] text-white shadow-sm' : 'bg-white text-[#0284C7] border border-[#BAE6FD] hover:bg-sky-50'"
          >
            <span class="material-symbols-outlined text-sm">inventory</span>
            <span>Overstock</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedAlertFilter === 'overstock' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'">
              {{ alertSummary.overstock }}
            </span>
          </button>
        </div>

        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Alert Status</th>
                <th style="width: 22%;">Stock Item</th>
                <th style="width: 30%;">Stock vs Safety Thresholds</th>
                <th style="width: 16%;">Recommended Reorder</th>
                <th style="width: 12%; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of paginatedStockAlerts" class="clickable-row" (click)="viewItemHistory(item)">
                <!-- Alert Status Badge -->
                <td>
                  <div class="flex items-center gap-1.5">
                    <span
                      class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                      [ngClass]="{
                        'bg-red-100 text-red-700 border border-red-300': item.severity === 'critical',
                        'bg-amber-100 text-amber-800 border border-amber-300': item.severity === 'warning',
                        'bg-sky-100 text-sky-800 border border-sky-300': item.severity === 'info'
                      }"
                    >
                      <span class="material-symbols-outlined text-[13px]">
                        {{ item.alert_category === 'OUT_OF_STOCK' ? 'cancel' : item.alert_category === 'OVERSTOCK' ? 'upgrade' : 'warning' }}
                      </span>
                      {{ item.alert_category ? item.alert_category.replace('_', ' ') : 'ALERT' }}
                    </span>
                  </div>
                </td>

                <!-- Stock Item Name & Code -->
                <td>
                  <div class="font-bold text-xs text-[var(--text-main)]">{{ item.name }}</div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="font-mono text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">{{ item.stock_code }}</span>
                    <span class="text-[10px] text-gray-500 font-medium">{{ item.category_name || item.unit_type }}</span>
                  </div>
                </td>

                <!-- Stock vs Safety Thresholds -->
                <td>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between font-mono text-xs">
                      <span class="font-bold" [ngClass]="item.current_quantity <= 0 ? 'text-red-600' : item.current_quantity <= item.min_stock_alert ? 'text-amber-600' : 'text-gray-800'">
                        {{ item.current_quantity | number:'1.0-3' }} {{ item.unit_type }}
                      </span>
                      <span class="text-[10px] text-gray-500">
                        Min: {{ item.min_stock_alert }} | Reorder: {{ item.reorder_level || 10 }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full transition-all"
                        [style.width.%]="calcStockPercent(item.current_quantity, item.min_stock_alert)"
                        [ngClass]="{
                          'bg-red-500': item.current_quantity <= 0,
                          'bg-amber-500': item.current_quantity > 0 && item.current_quantity <= item.min_stock_alert,
                          'bg-emerald-500': item.current_quantity > item.min_stock_alert
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Recommended Reorder -->
                <td>
                  <div *ngIf="item.suggested_reorder_quantity > 0; else noReorder">
                    <span class="font-mono font-black text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      +{{ item.suggested_reorder_quantity | number:'1.0-2' }} {{ item.unit_type }}
                    </span>
                  </div>
                  <ng-template #noReorder>
                    <span class="text-xs text-gray-400">Stock sufficient</span>
                  </ng-template>
                </td>

                <!-- Action -->
                <td style="text-align: center;" class="row-actions-cell" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      (click)="reorderNow(item)"
                      class="action-btn btn-gradient-purple !py-1 !px-2.5 !text-xs whitespace-nowrap"
                      title="1-Click Reorder"
                    >
                      <span class="material-symbols-outlined !text-sm">shopping_cart</span>
                      <span>Reorder Now</span>
                    </button>
                    <button
                      type="button"
                      (click)="viewItemHistory(item)"
                      class="action-btn btn-outline-purple !py-1 !px-2 !text-xs"
                      title="View Ledger"
                    >
                      <span class="material-symbols-outlined !text-sm">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredStockAlerts.length === 0">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon !text-[#16A34A]">verified</span>
                    <div class="empty-title text-[#16A34A]">No Active Alerts</div>
                    <p class="empty-desc">No stock items are currently in alert state for this filter criteria.</p>
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
        <div class="modal-content shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge is-success">
                <span class="material-symbols-outlined">add_shopping_cart</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Stock Purchase / Addition Entry</h3>
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

            <!-- Select Stock Item -->
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Select Stock Item
              </label>
              <app-custom-dropdown
                [options]="stockItemOptions"
                [(ngModel)]="purchaseForm.stockId"
                (ngModelChange)="onPurchaseStockItemChange()"
                name="stockId"
                [searchable]="true"
                minWidth="100%"
                placeholder="Select Stock Item..."
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
                  {{ calculatedTotalQuantity | number:'1.0-3' }} {{ selectedPurchaseItem?.unit_type || 'units' }}
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
                    <span class="text-[10px] font-normal text-[#6B7280]">/ {{ selectedPurchaseItem?.unit_type || 'unit' }}</span>
                  </div>
                </div>
              </div>

              <!-- Impact Simulation Card -->
              <div *ngIf="selectedPurchaseItem" class="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs space-y-1.5 w-full">
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

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Notes (Optional)</label>
              <input
                title="Notes (Optional)"
                type="text"
                [(ngModel)]="purchaseForm.notes"
                name="notes"
                placeholder="e.g. Fresh stock delivered at morning shift"
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
      <!-- 8. MODAL: STOCK ADJUSTMENT & WASTAGE                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showAdjustModal">
        <div class="modal-content shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">tune</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Stock Adjustment / Wastage</h3>
                <p class="text-xs text-[#6B7280] mt-0.5">Record shrinkage, physical recount, or damage audit</p>
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
            <!-- Row 1: Movement / Reason Type first, then Stock Item or Vendor in 2-column grid -->
            <div class="grid grid-cols-2 gap-4 items-start">
              <!-- 1. Movement / Reason Type (First) -->
              <div class="form-group mb-0">
                <div class="flex items-center justify-between mb-1 min-h-[22px]">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                    Movement / Reason Type
                  </label>
                </div>
                <app-custom-dropdown
                  [options]="adjustmentTypeOptions"
                  [(ngModel)]="adjustForm.adjustmentType"
                  (ngModelChange)="onAdjustReasonTypeChange()"
                  name="adjustmentType"
                  minWidth="100%"
                  placeholder="Select Reason..."
                ></app-custom-dropdown>
              </div>

              <!-- 2A. If Return to Supplier: Vendor appears beside Movement Type -->
              <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier'" class="form-group mb-0">
                <div class="flex items-center justify-between mb-1 min-h-[22px]">
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

              <!-- 2B. If other reason: Stock Item appears beside Movement Type -->
              <div *ngIf="adjustForm.adjustmentType !== 'return_to_supplier'" class="form-group mb-0">
                <div class="flex items-center justify-between mb-1 min-h-[22px]">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                    Select Stock Item
                  </label>
                </div>
                <app-custom-dropdown
                  [options]="adjustStockItemOptions"
                  [(ngModel)]="adjustForm.stockId"
                  (ngModelChange)="onAdjustItemChange()"
                  name="stockId"
                  [searchable]="true"
                  minWidth="100%"
                  placeholder="Select Stock Item..."
                ></app-custom-dropdown>
              </div>
            </div>

            <!-- Row 2 (When Return to Supplier): Select Stock Item below the top row -->
            <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier'" class="form-group mb-0">
              <div class="flex items-center justify-between mb-1">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Select Stock Item <span class="text-[#DC2626] font-black">*</span>
                </label>
                <span *ngIf="isLoadingVendorItems" class="text-[10px] text-[#7C3AED] font-semibold flex items-center gap-1 animate-pulse">
                  <span class="material-symbols-outlined text-xs">sync</span>
                  <span>Fetching vendor items...</span>
                </span>
              </div>
              <app-custom-dropdown
                [options]="adjustStockItemOptions"
                [(ngModel)]="adjustForm.stockId"
                (ngModelChange)="onAdjustItemChange()"
                name="stockIdReturn"
                [searchable]="true"
                minWidth="100%"
                [placeholder]="adjustForm.vendorId ? (isLoadingVendorItems ? 'Loading vendor items...' : (adjustStockItemOptions.length ? 'Select Stock Item...' : 'No stock items for this vendor')) : 'Select a Supplier / Vendor above first...'"
              ></app-custom-dropdown>
              
              <!-- Helper Messages for Return to Supplier Selection -->
              <div *ngIf="!adjustForm.vendorId" class="mt-1 flex items-center gap-1.5 text-[11px] text-[#7C3AED] font-medium">
                <span class="material-symbols-outlined" style="font-size: 15px;">info</span>
                <span>Please select a Supplier / Vendor above to view purchased stock items available for return.</span>
              </div>
              <div *ngIf="adjustForm.vendorId && !isLoadingVendorItems && adjustStockItemOptions.length === 0" class="mt-1 flex items-center gap-1.5 text-[11px] text-[#DC2626] font-medium">
                <span class="material-symbols-outlined" style="font-size: 15px;">warning</span>
                <span>No stock items with positive available balance found for this vendor.</span>
              </div>
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
              *ngIf="adjustForm.adjustmentType !== 'return_to_supplier' && adjustSelectedItem"
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
                  {{ (adjustSelectedItem.current_quantity || 0) | number:'1.0-3' }}
                  {{ adjustSelectedItem.unit_type || 'piece' }}
                  <span class="opacity-60 font-normal mx-1">/</span>
                  {{ (adjustSelectedItem.average_unit_price || 0) | appCurrency:'1.0-2' }} <span class="font-sans font-medium text-xs">unit price</span>
                </span>
              </span>
            </div>

            <!-- Direct Quantity Input + costing -->
            <div class="pt-3.5 border-t border-[var(--card-border)] space-y-3">
              <div class="flex items-center justify-between pb-1.5">
                <div class="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[var(--primary)]" style="font-size: 18px;">tune</span>
                  <span class="uppercase tracking-wider">Adjustment Quantity ({{ adjustSelectedItem?.unit_type || 'piece' }})</span>
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
                    Unit: {{ adjustSelectedItem?.unit_type || 'piece' }}
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
                    {{ adjustSelectedItem?.unit_type || 'piece' }}
                  </div>
                </div>
                <p *ngIf="adjustMaxQuantity !== null" class="text-[10px] text-[var(--text-muted)] mt-1">
                  This reason removes stock, so at most
                  <strong class="font-mono">{{ adjustMaxQuantity | number:'1.0-3' }} {{ adjustSelectedItem?.unit_type || 'units' }}</strong>
                  can be taken out.
                </p>
              </div>

              <!-- Where the item lands once this is applied -->
              <div
                *ngIf="adjustSelectedItem"
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
                    {{ (adjustSelectedItem.current_quantity || 0) | number:'1.0-3' }}
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
                    {{ adjustSelectedItem.unit_type || 'piece' }}
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
                    <span>Item avg: {{ (adjustSelectedItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}</span>
                    <span>Rate / unit</span>
                  </div>
                </div>
              </div>

              <!-- The line, then its total. One adjustment is one line today,
                   so the sum below equals it; it is shown separately so the
                   line figure is never mistaken for a running total. -->
              <div
                *ngIf="adjustSelectedItem"
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

              <!-- Remaining / Resulting Total Cost Display with equation below Total Cost / Price Sum -->
              <div
                *ngIf="adjustSelectedItem"
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

              <!-- What this entry will do: Vendor Loss vs Company Loss vs Stock Addition -->
              <div
                class="p-3.5 rounded-xl border text-xs leading-relaxed"
                [ngClass]="adjustForm.adjustmentType === 'return_to_supplier'
                  ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#5B21B6]'
                  : (adjustIsIncrease
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                      : 'bg-[#FFF7ED] border-[#FED7AA] text-[#9A3412]')"
              >
                <!-- 1. Return to Supplier = Vendor Loss -->
                <div *ngIf="adjustForm.adjustmentType === 'return_to_supplier'" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#7C3AED]">local_shipping</span>
                  <div>
                    <strong class="font-bold">Vendor Loss (Return to Supplier):</strong>
                    Goods are returned to the vendor for credit / replacement at the rate of
                    <strong class="font-mono font-bold">{{ (adjustUnitPrice || adjustSelectedItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}</strong>.
                    This removal is accounted as a <strong>Vendor Loss</strong> and does not count as internal company shrinkage.
                  </div>
                </div>

                <!-- 2. Stock Addition = Stock Gain -->
                <div *ngIf="adjustForm.adjustmentType !== 'return_to_supplier' && adjustIsIncrease" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#16A34A]">trending_up</span>
                  <div>
                    <strong class="font-bold">Stock Addition (Gain):</strong>
                    Stock is being added, so this cost <strong>re-averages</strong> the item's unit cost, exactly like a purchase entry.
                    Leave the total at 0 to add at the current average instead.
                  </div>
                </div>

                <!-- 3. Wastage / Decrease / Audit = Company Loss -->
                <div *ngIf="adjustForm.adjustmentType !== 'return_to_supplier' && !adjustIsIncrease" class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-lg mt-0.5 text-[#DC2626]">warning</span>
                  <div>
                    <strong class="font-bold">Company Loss (Internal Shrinkage / Wastage):</strong>
                    Stock is being removed at the existing average of
                    <strong class="font-mono font-bold">{{ (adjustSelectedItem?.average_unit_price || 0) | appCurrency:'1.0-4' }}</strong>.
                    Any cost entered here is recorded as internal <strong>Company Loss</strong> (write-off) and does <strong>not</strong> change the item's unit cost.
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                Mandatory Audit Reason <span class="text-[#DC2626] font-black">*</span>
              </label>
              <input
                title="Mandatory Audit Reason"
                type="text"
                [(ngModel)]="adjustForm.reason"
                name="reason"
                placeholder="e.g. Physical inventory count, kitchen trimming loss"
                class="form-control text-sm w-full"
                required
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-[var(--card-border)]">
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
                [disabled]="adjustOverMax || !adjustForm.stockId || adjustCalculatedTotalQty <= 0 || (adjustForm.adjustmentType === 'return_to_supplier' && !adjustForm.vendorId)"
                [title]="adjustOverMax ? 'Cannot return or remove more than available stock' : 'Apply Adjustment'"
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
        <div class="modal-content shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">add_box</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Create Stock Master Item</h3>
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
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
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
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Stock Code (Optional)
                </label>
                <input
                  title="Stock Code (Optional)"
                  type="text"
                  [(ngModel)]="masterForm.stockCode"
                  name="stockCode"
                  placeholder="Auto-generated if blank"
                  class="form-control font-mono text-sm w-full"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
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
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
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
            <div class="pt-3.5 border-t border-[#E9D5FF] space-y-3">
              <div class="flex items-center justify-between pb-1.5">
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
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
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
                    class="form-control font-mono font-bold text-base w-full"
                    placeholder="0"
                  />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
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
                    class="form-control font-mono font-bold text-base w-full"
                    placeholder="1"
                  />
                </div>
              </div>

              <!-- Live Initial Total Quantity Badge -->
              <div class="flex items-center justify-between py-1.5 px-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-lg text-xs shadow-xs w-full">
                <span class="text-[#4B5563] font-semibold flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#16A34A]" style="font-size: 18px;">inventory_2</span>
                  <span>Calculated Total Quantity:</span>
                </span>
                <span class="font-mono font-black text-sm text-[#16A34A] bg-[#DCFCE7] border border-[#86EFAC] px-2.5 py-0.5 rounded-md">
                  {{ masterCalculatedTotalQty | number:'1.0-3' }} {{ masterForm.unitType || 'units' }}
                </span>
              </div>

              <!-- Cost Grid: Total Cost vs Unit Price with Synchronized Baseline Alignment -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <div class="form-group mb-0">
                  <div class="flex items-center justify-between mb-0">
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
                  <div class="flex items-center justify-between mb-0">
                    <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                      Initial Unit Cost (₹)
                    </label>
                    <span class="text-[9px] text-[#7E22CE] font-bold bg-[#F3E8FF] px-2 py-0.5 rounded border border-[#DDD6FE] whitespace-nowrap">
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
                <span class="text-purple-700 font-medium">Opening Stock: <strong class="text-purple-900 font-bold">{{ masterCalculatedTotalQty | number:'1.0-3' }} {{ masterForm.unitType || 'unit' }}</strong></span>
                <span class="text-purple-700 font-medium">Unit Rate: <strong class="text-purple-900 font-black">{{ masterCalculatedUnitCost | appCurrency:'1.0-4' }}</strong> / {{ masterForm.unitType || 'unit' }}</span>
              </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-[#E9D5FF]">
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
                [disabled]="!masterForm.name"
                [title]="!masterForm.name ? 'Enter a stock item name first' : 'Create stock item'"
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
        <div class="modal-content p-7 md:p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
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

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 11. MODAL: VIEW STOCK MOVEMENT AUDIT DETAILS                    -->
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
                <strong class="text-[#2E1065] text-sm">{{ selectedMovementForView.stock_item_name }}</strong>
                <div class="font-mono text-[10px] text-[#7E22CE]">{{ selectedMovementForView.stock_code }}</div>
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
                  {{ selectedMovementForView.unit_type }}
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
                  Balance: <strong>{{ selectedMovementForView.balance_quantity | number:'1.0-3' }} {{ selectedMovementForView.unit_type }}</strong>
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
      <!-- 12. MODAL: VIEW PURCHASE ENTRY LEDGER DETAILS                   -->
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
                <strong class="text-[#2E1065] text-sm">{{ selectedEntryForView.stock_item_name }}</strong>
                <div class="font-mono text-[10px] text-[#7E22CE]">{{ selectedEntryForView.stock_code }}</div>
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
                  +{{ selectedEntryForView.total_quantity | number:'1.0-3' }} {{ selectedEntryForView.unit_type }}s
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
                <span class="text-[10px] text-[#6B7280] block">/ {{ selectedEntryForView.unit_type }}</span>
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
  `,
  styles: [
    STOCK_LAYOUT_CSS,
    DEFAULT_ACTION_BUTTON_CSS,
  ]
})
export class StockComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public stockLayout = inject(StockLayoutService);
  private stockService = inject(StockService);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  public selectedMovementForView: StockMovement | null = null;
  public showMovementViewModal = false;
  public selectedEntryForView: StockEntry | null = null;
  public showEntryViewModal = false;

  public activeTab: 'MASTER' | 'ENTRIES' | 'MOVEMENTS' | 'LOW_STOCK' = 'MASTER';

  // 3-Tier Data Lists
  public stockItems: StockItem[] = [];
  public stockEntries: StockEntry[] = [];
  public stockMovements: StockMovement[] = [];
  public lowStockList: StockItem[] = [];
  public allProducts: Product[] = [];

  // Inventory Alerts Center Suite
  public stockAlerts: any[] = [];
  public alertSummary: any = {
    totalAlerts: 0,
    outOfStock: 0,
    lowStock: 0,
    minStock: 0,
    reorderLevel: 0,
    overstock: 0,
    expired: 0,
    expiringSoon: 0,
  };
  public selectedAlertFilter = 'all';

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

  // ── Vendors (purchase entries link to a real vendor record) ─────────
  private vendorService = inject(VendorService);

  public vendors: Vendor[] = [];

  /** Ledger toolbar filter. Empty string means "every vendor". */
  public selectedVendorFilter: number | '' = '';

  /** Picker inside the purchase form. 0 is the deliberate "not a vendor"
   *  choice, which books the row as 'Initial Setup' rather than a purchase. */
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


  /** Same list as a ledger filter, with an "all" row on top. */
  get vendorFilterOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Vendors', icon: 'groups' },
      ...this.vendors.map((v) => ({ value: v.id, label: v.name, icon: 'local_shipping', badge: v.vendor_code })),
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
    { value: 'wastage', label: 'WASTAGE (Kitchen Loss)', icon: 'delete' },
    { value: 'return', label: 'RETURN', icon: 'reply' },
  ];

  public adjustmentTypeOptions: DropdownOption[] = [
    { value: 'DECREASE', label: 'DECREASE (- Audit)', icon: 'arrow_downward', description: 'Stock deficit adjustment — Company Loss' },
    { value: 'INCREASE', label: 'INCREASE (+ Audit)', icon: 'arrow_upward', description: 'Found excess stock on audit — Stock Gain' },
    { value: 'wastage', label: 'Kitchen Wastage / Spoilage', icon: 'delete', description: 'Trimming loss, spoiled, expired — Company Loss' },
    { value: 'return_to_supplier', label: 'Return to Supplier', icon: 'reply', description: 'Goods sent back to vendor — Vendor Loss / Credit' },
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
    if (this.adjustForm.adjustmentType === 'return_to_supplier' && this.adjustForm.stockId) {
      return this.vendorReturnStockItems.find((i) => i.id === Number(this.adjustForm.stockId));
    }
    return undefined;
  }

  /**
   * Filtered stock items for the adjustment modal:
   * 1. For Return to Supplier: ONLY show stock items associated with the chosen vendor in stock_vendor_purchase with returnable stock > 0.
   * 2. For removals (Wastage, DECREASE), only items with current_quantity > 0 are shown.
   * 3. For INCREASE (+ Audit), all stock items are available.
   */
  get adjustStockItemOptions(): DropdownOption[] {
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (!this.adjustForm.vendorId) {
        return [];
      }
      return this.vendorReturnStockItems.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.stock_code})`,
        description: `Supplied: ${Number(item.vendor_total_quantity).toFixed(2)} | Ret. Allowed: ${Number(item.max_return_allowed || item.vendor_returnable_quantity).toFixed(2)} ${item.unit_type}s`,
        badge: `${item.unit_type}`,
        icon: 'inventory_2',
      }));
    }

    let items = this.stockItems;

    // For removals, filter to items with available pieces > 0
    if (!this.adjustIsIncrease) {
      items = items.filter((item) => Number(item.current_quantity || 0) > 0);
    }

    return items.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.stock_code})`,
      description: `Available: ${item.current_quantity} ${item.unit_type}s · Rate: ₹${Number(item.average_unit_price || 0).toFixed(2)}`,
      badge: `${item.unit_type}`,
      icon: 'inventory_2',
    }));
  }

  onAdjustReasonTypeChange(): void {
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (this.adjustForm.vendorId) {
        this.onAdjustVendorChange();
      } else {
        this.vendorReturnStockItems = [];
        this.adjustForm.stockId = null;
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
            if (this.adjustForm.stockId && !this.vendorReturnStockItems.some((i) => i.id === Number(this.adjustForm.stockId))) {
              this.adjustForm.stockId = null;
            }
            this.onAdjustItemChange();
          },
          error: () => {
            this.isLoadingVendorItems = false;
            this.vendorReturnStockItems = [];
            this.adjustForm.stockId = null;
            this.onAdjustItemChange();
          },
        });
        return;
      } else {
        this.vendorReturnStockItems = [];
        this.adjustForm.stockId = null;
        this.onAdjustItemChange();
        return;
      }
    }

    const validOptions = this.adjustStockItemOptions;
    if (this.adjustForm.stockId && !validOptions.some((o) => o.value === Number(this.adjustForm.stockId))) {
      this.adjustForm.stockId = null;
      this.onAdjustItemChange();
    }
  }

  // Modals state
  public showPurchaseModal = false;
  public showAdjustModal = false;
  public showCreateMasterModal = false;
  public showItemDetailModal = false;
  public selectedItemDetail: any = null;

  // Forms
  public purchaseForm: any = {
    stockId: null,
    quantity: null,
    multiplier: 1,
    totalPrice: null,
    // 0 = no vendor; the server then books the entry as 'Initial Setup'.
    vendorId: 0,
    notes: '',
    entryDate: '',
  };

  public adjustForm: any = {
    stockId: null,
    adjustmentType: 'DECREASE',
    vendorId: null,
    quantity: 1,
    multiplier: 1,
    totalPrice: 0,
    unitPrice: 0,
    reason: '',
    notes: '',
  };

  /** The master item the adjustment is being applied to. */
  get adjustSelectedItem(): StockItem | undefined {
    return this.stockItems.find((i) => i.id === Number(this.adjustForm.stockId));
  }

  /** Current available quantity based on mode (from stock_movements for vendor return) */
  get adjustAvailableQuantity(): number {
    if (this.adjustForm.adjustmentType === 'return_to_supplier' && this.selectedVendorReturnItem) {
      return Number(this.selectedVendorReturnItem.current_available_stock || 0);
    }
    return Number(this.adjustSelectedItem?.current_quantity || 0);
  }

  /**
   * What the item will hold once this adjustment is applied — the reason type
   * decides whether the calculated total is added or taken away.
   */
  get adjustResultingQty(): number {
    const available = this.adjustAvailableQuantity;
    const change = Number(this.adjustCalculatedTotalQty || 0);
    return this.adjustIsIncrease ? available + change : available - change;
  }

  /** Removing more than is on hand would drive the ledger negative. */
  get adjustExceedsAvailable(): boolean {
    return !this.adjustIsIncrease && this.adjustResultingQty < 0;
  }

  /**
   * The store may permit a negative balance. StockService.adjustStock checks
   * the same setting before refusing, so the form must not be stricter than
   * the server — otherwise a store that deliberately allows it could not.
   */
  get allowNegativeStock(): boolean {
    return String(this.settingsService.settingsMap()['POS_ALLOW_NEGATIVE_STOCK'] ?? '').toLowerCase() === 'true';
  }

  /**
   * Cap for the quantity box. For Return to Supplier, it cannot exceed the
   * vendor's net returnable quantity (Supplied - Returned) nor the current available stock.
   */
  get adjustMaxQuantity(): number | null {
    if (this.adjustIsIncrease || this.allowNegativeStock) return null;
    if (this.adjustForm.adjustmentType === 'return_to_supplier') {
      if (this.selectedVendorReturnItem) {
        const vendorReturnable = Number(this.selectedVendorReturnItem.vendor_returnable_quantity ?? this.selectedVendorReturnItem.vendor_total_quantity ?? 0);
        const availableStock = Number(this.selectedVendorReturnItem.current_available_stock ?? 0);
        return Math.min(vendorReturnable, availableStock);
      }
    }
    return this.adjustAvailableQuantity;
  }

  /** True when the box is capped and the typed amount is over that cap. */
  get adjustOverMax(): boolean {
    const max = this.adjustMaxQuantity;
    return max !== null && this.adjustCalculatedTotalQty > max;
  }

  /** True when the chosen item is at or below its reorder alert level. */
  get adjustIsLowStock(): boolean {
    const item = this.adjustSelectedItem;
    if (!item) return false;
    const qty = Number(item.current_quantity || 0);
    const alert = Number(item.min_stock_alert || 0);
    return alert > 0 && qty <= alert;
  }

  /**
   * Reason types that push stock in rather than out. Mirrors the same rule in
   * StockService.adjustStock.
   *
   * `return` is a customer handing goods back, which RefundsService sends when
   * restocking a refund — stock comes in. It is not offered in this dropdown.
   * `return_to_supplier` is goods going back to the vendor, so it is absent
   * here and correctly treated as a decrease.
   */
  get adjustIsIncrease(): boolean {
    return ['INCREASE', 'in', 'return'].includes(this.adjustForm.adjustmentType);
  }

  get adjustCalculatedTotalQty(): number {
    const qty = Number(this.adjustForm.quantity) || 0;
    const mult = Number(this.adjustForm.multiplier) || 1;
    return qty * mult;
  }

  /** Total Cost of the item's current stock (Total Quantity * Average Unit Price) */
  get adjustItemTotalCost(): number {
    if (!this.adjustSelectedItem) return 0;
    const val = Number(this.adjustSelectedItem.current_value);
    if (Number.isFinite(val) && val > 0) return val;
    return +(Number(this.adjustSelectedItem.current_quantity || 0) * Number(this.adjustSelectedItem.average_unit_price || 0)).toFixed(2);
  }

  /**
   * Resulting Total Cost after adjustment:
   * Adds to stock: Total Cost + Total Cost / Price (e.g. 500 + 100 = 600)
   * Removes from stock: Total Cost − Total Cost / Price (e.g. 500 - 100 = 400)
   */
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

  /**
   * Unit Price (₹) derived from Total Cost / Price divided by Adjustment Quantity.
   * If Adjustment Quantity is 0, falls back to the item's average unit price.
   */
  get adjustUnitPrice(): number {
    const totalQty = this.adjustCalculatedTotalQty;
    const enteredTotal = Number(this.adjustForm.totalPrice);
    if (totalQty > 0 && Number.isFinite(enteredTotal) && enteredTotal >= 0) {
      return +(enteredTotal / totalQty).toFixed(4);
    }
    return Number(this.adjustSelectedItem?.average_unit_price) || 0;
  }

  get adjustCalculatedTotalCost(): number {
    const entered = Number(this.adjustForm.totalPrice);
    return Number.isFinite(entered) && entered >= 0 ? entered : 0;
  }

  /** Kept for the payload: the rate the backend should value the movement at. */
  get adjustCalculatedUnitCost(): number {
    return +this.adjustUnitPrice.toFixed(4);
  }

  onAdjustFormQuantityChange(): void {
    const validOptions = this.adjustStockItemOptions;
    if (this.adjustForm.stockId && !validOptions.some((o) => o.value === Number(this.adjustForm.stockId))) {
      this.adjustForm.stockId = null;
    }
    // A removal cannot exceed what is on hand, so the typed figure is clamped
    // as it is entered rather than only being refused on submit. Adding has no
    // ceiling, and a store that allows a negative balance is left alone.
    const max = this.adjustMaxQuantity;
    if (max !== null) {
      const typed = Number(this.adjustForm.quantity);
      if (Number.isFinite(typed) && typed > max) {
        this.adjustForm.quantity = max;
      }
    }
    const avg = Number(this.adjustSelectedItem?.average_unit_price) || 0;
    this.adjustForm.totalPrice = +(this.adjustCalculatedTotalQty * avg).toFixed(2);
  }

  /**
   * Seeds the Total Cost / Price from the newly chosen item's average unit price x quantity.
   */
  onAdjustItemChange(): void {
    const avg = Number(this.adjustSelectedItem?.average_unit_price) || 0;
    this.adjustForm.totalPrice = +(this.adjustCalculatedTotalQty * avg).toFixed(2);
    this.onAdjustFormQuantityChange();
  }

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
    this.loadStockAlerts();
    this.loadAllProducts();
    this.loadVendors();
  }

  // ── Vendors for the picker and the ledger filter ────────────────────
  loadVendors(): void {
    this.vendorService.getVendors({ page: 1, limit: 200, status: 'ACTIVE', sortBy: 'name', sortOrder: 'ASC' }).subscribe({
      next: (res) => {
        if (res.success) this.vendors = res.data;
      },
      // Reported by the global error interceptor. A missing vendor list
      // must not break the stock screen: the form falls back to free text.
      error: () => {},
    });
  }

  refreshActiveTab(): void {
    if (this.activeTab === 'MASTER') this.loadStockMaster();
    else if (this.activeTab === 'ENTRIES') this.loadStockEntries();
    else if (this.activeTab === 'MOVEMENTS') this.loadStockMovements();
    else this.loadStockAlerts();
  }

  // ── 1. Load Stock Master (stocks) ──────────────────────────────
  loadStockMaster(): void {
    this.isLoading = true;
    this.loadError = null;
    this.stockService.getStock(1, 200, undefined, undefined, false, 'active', this.selectedUnitType || undefined).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.stockItems = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load stock items from server.';
      },
    });
  }

  // ── 2. Load Purchase Entries (stock_vendor_purchase) ────────────────────────
  loadStockEntries(): void {
    this.stockService
      .getStockEntries(1, 200, undefined, undefined, undefined, undefined, undefined, this.selectedVendorFilter || undefined)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.stockEntries = res.data;
          }
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => {},
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
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
      error: () => {},
    });
  }

  // ── 4b. Load Comprehensive Inventory Alerts Suite ────────────────────
  loadStockAlerts(filter = this.selectedAlertFilter): void {
    this.stockService.getStockAlerts(filter).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stockAlerts = res.data.alerts || [];
          this.alertSummary = res.data.summary || this.alertSummary;
        }
      },
      error: () => {},
    });
  }

  setAlertFilter(filter: string): void {
    this.selectedAlertFilter = filter;
    this.currentPage = 1;
    this.loadStockAlerts(filter);
  }

  reorderNow(item: any): void {
    this.purchaseForm.stockId = item.id;
    const recQty = Number(item.suggested_reorder_quantity) || Number(item.reorder_quantity) || 10;
    this.purchaseForm.quantity = recQty;
    const latestEntry = this.stockEntries.find((e) => e.stock_id === item.id || (e as any).stock_item_id === item.id);
    const autoMultiplier = item.default_multiplier || latestEntry?.multiplier || item.multiplier || 1;
    this.purchaseForm.multiplier = Number(autoMultiplier) || 1;
    const unitPrice = Number(item.average_unit_price) || 0;
    this.purchaseForm.totalPrice = Math.round((recQty * unitPrice) * 100) / 100;
    this.showPurchaseModal = true;
  }

  onPurchaseStockItemChange(): void {
    if (this.purchaseForm.stockId) {
      const stock = this.stockItems.find((s) => s.id === Number(this.purchaseForm.stockId));
      if (stock) {
        const latestEntry = this.stockEntries.find((e) => e.stock_id === stock.id || (e as any).stock_item_id === stock.id);
        const autoMultiplier = stock.default_multiplier || latestEntry?.multiplier || (stock as any).multiplier || 1;
        this.purchaseForm.multiplier = Number(autoMultiplier) || 1;
      }
    }
  }

  loadAllProducts(): void {
    this.productService.getProducts(1, 200).subscribe({
      next: (res) => {
        if (res.success) {
          this.allProducts = res.data;
        }
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
    });
  }

  // ── Live Calculation Helpers for Purchase Modal ────────────────────
  get selectedPurchaseItem(): StockItem | undefined {
    return this.stockItems.find((i) => i.id === Number(this.purchaseForm.stockId));
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
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.stockItems;
    return this.stockItems.filter(
      (s) => s.name.toLowerCase().includes(q) || s.stock_code.toLowerCase().includes(q) || s.category_name?.toLowerCase().includes(q)
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

  get paginatedMasterItems(): StockItem[] {
    const list = this.filteredMasterItems;
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get filteredStockEntries(): StockEntry[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.stockEntries;
    return this.stockEntries.filter(
      (e) =>
        e.entry_number.toLowerCase().includes(q) ||
        e.stock_item_name?.toLowerCase().includes(q) ||
        e.stock_code?.toLowerCase().includes(q) ||
        e.vendor_name?.toLowerCase().includes(q)
    );
  }

  get paginatedStockEntries(): StockEntry[] {
    const list = this.filteredStockEntries;
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get filteredStockMovements(): StockMovement[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.stockMovements;
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
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get paginatedLowStockList(): StockItem[] {
    const start = (this.safePage(this.lowStockList.length) - 1) * this.pageSize;
    return this.lowStockList.slice(start, start + this.pageSize);
  }

  get filteredStockAlerts(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.stockAlerts;
    return this.stockAlerts.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.stock_code?.toLowerCase().includes(q) ||
        a.alert_category?.toLowerCase().includes(q)
    );
  }

  get paginatedStockAlerts(): any[] {
    const list = this.filteredStockAlerts;
    const start = (this.safePage(list.length) - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  getCurrentTotal(): number {
    if (this.activeTab === 'MASTER') return this.filteredMasterItems.length;
    if (this.activeTab === 'ENTRIES') return this.filteredStockEntries.length;
    if (this.activeTab === 'MOVEMENTS') return this.filteredStockMovements.length;
    return this.filteredStockAlerts.length;
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

  calcStockPercent(curr: number, low: number): number {
    const max = Math.max(low * 3, 50);
    return Math.min(100, Math.max(0, (curr / max) * 100));
  }

  getSearchPlaceholder(): string {
    if (this.activeTab === 'MASTER') return 'Search master items by name or code (e.g. Chicken, STK-0001)...';
    if (this.activeTab === 'ENTRIES') return 'Search purchase entries by entry #, item, stock code, vendor...';
    if (this.activeTab === 'MOVEMENTS') return 'Search movement audit trail by reference, item, notes...';
    return 'Search inventory alerts (out of stock, expiry, reorder)...';
  }

  // ── Modals Trigger Actions ──────────────────────────────────────────
  viewMovementDetail(move: StockMovement): void {
    this.selectedMovementForView = move;
    this.showMovementViewModal = true;
  }

  viewEntryDetail(entry: StockEntry): void {
    this.selectedEntryForView = entry;
    this.showEntryViewModal = true;
  }

  openPurchaseModal(): void {
    this.purchaseForm = {
      stockId: null,
      quantity: null,
      multiplier: 1,
      totalPrice: null,
      vendorId: 0,
      notes: '',
      entryDate: new Date().toISOString().split('T')[0],
    };
    this.showPurchaseModal = true;
  }

  quickPurchaseEntry(item: StockItem): void {
    const latestEntry = this.stockEntries.find((e) => e.stock_id === item.id || (e as any).stock_item_id === item.id);
    const autoMultiplier = item.default_multiplier || latestEntry?.multiplier || (item as any).multiplier || 1;
    this.purchaseForm = {
      stockId: item.id,
      quantity: null,
      multiplier: Number(autoMultiplier) || 1,
      totalPrice: null,
      vendorId: item.default_vendor_id || 0,
      notes: '',
      entryDate: new Date().toISOString().split('T')[0],
    };
    this.showPurchaseModal = true;
  }

  openAdjustModal(): void {
    this.adjustForm = {
      stockId: null,
      adjustmentType: 'DECREASE',
      vendorId: null,
      quantity: 1,
      multiplier: 1,
      totalPrice: 0,
      unitPrice: 0,
      reason: '',
      notes: '',
    };
    this.showAdjustModal = true;
  }

  quickAdjust(item: StockItem): void {
    this.adjustForm = {
      stockId: item.id,
      adjustmentType: 'DECREASE',
      vendorId: null,
      quantity: 1,
      multiplier: 1,
      totalPrice: 0,
      // The item is already chosen here, so its rate is seeded straight away
      // rather than waiting for a selection that will not happen.
      unitPrice: +(Number(item.average_unit_price) || 0).toFixed(4),
      reason: '',
      notes: '',
    };
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
    if (!this.purchaseForm.stockId) {
      this.notify.error('Please select a stock item master');
      return;
    }
    if (!this.purchaseForm.quantity || this.purchaseForm.quantity <= 0) {
      this.notify.error('Please enter a valid base quantity');
      return;
    }
    if (this.purchaseForm.totalPrice === null || this.purchaseForm.totalPrice === undefined || this.purchaseForm.totalPrice < 0) {
      this.notify.error('Please enter a valid total purchase price');
      return;
    }

    // 0 is the deliberate "not a vendor" choice in the picker, which the API
    // takes as an entry with no vendor linked, booked as 'Initial Setup'.
    const payload = {
      ...this.purchaseForm,
      vendorId: Number(this.purchaseForm.vendorId) || null,
    };

    this.stockService.createStockEntry(payload).subscribe({
      next: (res) => {
        this.notify.success(
          `Entry ${res.data.entryNumber} recorded: +${res.data.totalQuantity} units added to ${res.data.stockItemName}`
        );
        this.showPurchaseModal = false;
        this.loadStockMaster();
        this.loadStockEntries();
        this.loadStockMovements();
        this.loadLowStockAlerts();
        this.loadStockAlerts();
      },
      error: () => {},
    });
  }

  submitAdjust(): void {
    if (!this.adjustForm.stockId) {
      this.notify.error('Please select a stock item');
      return;
    }
    if (this.adjustForm.adjustmentType === 'return_to_supplier' && !this.adjustForm.vendorId) {
      this.notify.error('Please select a supplier / vendor to return items to');
      return;
    }
    if (!this.adjustForm.reason) {
      this.notify.error('Please provide an adjustment reason');
      return;
    }

    if (this.adjustCalculatedTotalQty <= 0) {
      this.notify.error('Please enter a valid quantity greater than 0');
      return;
    }

    // Mirrors the server check in StockService.adjustStock. Only reasons that
    // remove stock are capped; adding has no ceiling.
    if (this.adjustOverMax) {
      const unit = this.adjustSelectedItem?.unit_type || this.selectedVendorReturnItem?.unit_type || 'units';
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
      stockId: this.adjustForm.stockId,
      adjustmentType: this.adjustForm.adjustmentType,
      quantity: Number(this.adjustForm.quantity) || 0,
      multiplier: 1,
      totalPrice: Number(this.adjustForm.totalPrice) || 0,
      reason: this.adjustForm.reason,
      notes: this.adjustForm.notes,
      vendorId: this.adjustForm.vendorId ? Number(this.adjustForm.vendorId) : undefined,
    };

    const unitPrice = this.adjustCalculatedUnitCost;
    if (Number.isFinite(unitPrice) && unitPrice > 0) {
      payload.unitPrice = unitPrice;
    }

    this.stockService.adjustStock(payload).subscribe({
      next: (res) => {
        this.notify.success(`Stock adjusted successfully for ${res.data.stockItemName}. New balance: ${res.data.newQuantity}`);
        this.showAdjustModal = false;
        this.loadStockMaster();
        this.loadStockMovements();
        this.loadLowStockAlerts();
        this.loadStockAlerts();
      },
      error: () => {},
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
        this.loadStockAlerts();
      },
      error: () => {},
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
      const headers = ['Entry Number', 'Date', 'Stock Code', 'Item Name', 'Quantity', 'Multiplier', 'Total Quantity', 'Total Price', 'Unit Price', 'Source', 'Vendor'];
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
        `"${e.supplier || 'Initial Setup'}"`,
        `"${e.vendor_name || ''}"`,
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


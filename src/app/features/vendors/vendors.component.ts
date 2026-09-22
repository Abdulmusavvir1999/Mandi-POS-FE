import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorService } from '../../core/services/vendor.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { Vendor, VendorPurchase, VendorPayment, VendorStats } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

type ActiveTab = 'profile' | 'contact' | 'tax' | 'payment_terms' | 'credit' | 'purchases' | 'balance' | 'rating' | 'performance';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppCurrencyPipe, PageLoaderComponent, CustomDropdownComponent],
  template: `
    <div class="vendors-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading vendor directory…"
        subMessage="Synchronizing supplier profiles, purchase records & performance scores."
        icon="local_shipping"
        (retry)="loadData()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & MODULE HEADER                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Procurement & Supply Chain</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Vendor Management</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Vendor & Supplier Hub</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ stats?.activeVendors || vendors.length }} Active Suppliers</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">account_balance</span>
                <span>Total Payable: <strong>{{ (stats?.totalOutstanding || 0) | appCurrency:'1.0-0' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">shopping_bag</span>
                <span>Total Procured: <strong>{{ (stats?.totalPurchases || 0) | appCurrency:'1.0-0' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item" *ngIf="stats?.overdueCount">
                <span class="material-symbols-outlined meta-icon text-rose-500">warning</span>
                <span class="text-rose-600 font-semibold">{{ stats?.overdueCount }} Invoices Overdue ({{ (stats?.overdueAmount || 0) | appCurrency:'1.0-0' }})</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadData()"
            class="action-btn btn-outline"
            title="Refresh Directory"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline"
            title="Export Supplier Data as CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            (click)="openAddModal()"
            class="action-btn btn-primary"
            title="Register New Vendor"
          >
            <span class="material-symbols-outlined">add_business</span>
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. KPI METRICS ROW                                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Suppliers</span>
            <div class="kpi-icon-badge bg-purple-light text-purple">
              <span class="material-symbols-outlined">storefront</span>
            </div>
          </div>
          <div class="kpi-value">{{ stats?.totalVendors || vendors.length }}</div>
          <div class="kpi-subtext">
            <span class="text-emerald-600 font-medium">{{ stats?.activeVendors || 0 }} Active</span>
            <span class="text-muted"> across {{ (stats?.categories?.length || 5) }} categories</span>
          </div>
        </div>

        <div class="kpi-card" [class.border-rose-300]="(stats?.totalOutstanding || 0) > 0">
          <div class="kpi-header">
            <span class="kpi-label">Outstanding Balance</span>
            <div class="kpi-icon-badge bg-rose-light text-rose">
              <span class="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div class="kpi-value text-rose-600">{{ (stats?.totalOutstanding || 0) | appCurrency:'1.0-0' }}</div>
          <div class="kpi-subtext">
            <span *ngIf="(stats?.overdueCount || 0) > 0" class="text-rose-600 font-medium">
              ⚠️ {{ stats?.overdueCount }} Overdue Bills
            </span>
            <span *ngIf="!stats?.overdueCount" class="text-emerald-600 font-medium">All accounts current</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Gross Spend</span>
            <div class="kpi-icon-badge bg-indigo-light text-indigo">
              <span class="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div class="kpi-value">{{ (stats?.totalPurchases || 0) | appCurrency:'1.0-0' }}</div>
          <div class="kpi-subtext">
            <span class="text-purple font-medium">All-time supplies</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Avg Quality & Rating</span>
            <div class="kpi-icon-badge bg-amber-light text-amber">
              <span class="material-symbols-outlined">grade</span>
            </div>
          </div>
          <div class="kpi-value text-amber-500">
            ★ {{ stats?.avgRating || '4.80' }} <span class="text-sm font-normal text-muted">/ 5.0</span>
          </div>
          <div class="kpi-subtext">
            <span class="text-emerald-600 font-medium">{{ stats?.avgOnTime || '97.2' }}% On-Time</span>
            <span class="text-muted"> • {{ stats?.avgFulfillment || '98.0' }}% Fulfillment</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. SEARCH, FILTERS & CATEGORIES BAR                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar">
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFilterChange()"
            placeholder="Search by vendor name, code, contact person, phone, or GSTIN…"
            class="search-input"
          />
          <button
            *ngIf="searchQuery"
            type="button"
            (click)="searchQuery = ''; onFilterChange()"
            class="clear-search-btn"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="filter-controls">
          <!-- Status Dropdown -->
          <div class="filter-dropdown-wrapper">
            <label class="filter-label">Status:</label>
            <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="filter-select">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <!-- Sort Dropdown -->
          <div class="filter-dropdown-wrapper">
            <label class="filter-label">Sort:</label>
            <select [(ngModel)]="sortBy" (change)="onFilterChange()" class="filter-select">
              <option value="name">Vendor Name</option>
              <option value="vendor_code">Vendor Code</option>
              <option value="outstanding_balance">Outstanding Balance</option>
              <option value="total_purchases_amount">Spend Volume</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <!-- View Toggle (Grid / Table) -->
          <div class="view-toggle-group">
            <button
              type="button"
              [class.active]="viewMode === 'grid'"
              (click)="viewMode = 'grid'"
              class="view-btn"
              title="Grid View"
            >
              <span class="material-symbols-outlined">grid_view</span>
            </button>
            <button
              type="button"
              [class.active]="viewMode === 'table'"
              (click)="viewMode = 'table'"
              class="view-btn"
              title="Table View"
            >
              <span class="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="category-pills-row">
        <button
          type="button"
          class="cat-pill"
          [class.active]="categoryFilter === 'ALL'"
          (click)="categoryFilter = 'ALL'; onFilterChange()"
        >
          <span>All Categories</span>
          <span class="cat-count">{{ vendors.length }}</span>
        </button>

        <button
          *ngFor="let cat of availableCategories"
          type="button"
          class="cat-pill"
          [class.active]="categoryFilter === cat"
          (click)="categoryFilter = cat; onFilterChange()"
        >
          <span>{{ cat }}</span>
          <span class="cat-count">{{ getCategoryCount(cat) }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. VENDOR LISTING: GRID VIEW                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="viewMode === 'grid'" class="vendor-cards-grid">
        <div *ngFor="let vendor of filteredVendors" class="vendor-card" (click)="openDetailDrawer(vendor)">
          <!-- Card Header -->
          <div class="vc-top-row">
            <div class="vc-avatar">
              <span class="material-symbols-outlined text-[26px]">store</span>
            </div>
            <div class="vc-identity">
              <div class="vc-code-row">
                <span class="vc-code">{{ vendor.vendor_code }}</span>
                <span class="badge" [ngClass]="getStatusBadgeClass(vendor.status)">
                  {{ vendor.status }}
                </span>
              </div>
              <h3 class="vc-name" [title]="vendor.name">{{ vendor.name }}</h3>
              <span class="vc-category-pill">{{ vendor.category }}</span>
            </div>
          </div>

          <!-- Contact Snippet -->
          <div class="vc-contact-box">
            <div class="vc-contact-item">
              <span class="material-symbols-outlined">person</span>
              <span>{{ vendor.contact_person || 'N/A' }}</span>
            </div>
            <div class="vc-contact-item">
              <span class="material-symbols-outlined">call</span>
              <span>{{ vendor.phone }}</span>
            </div>
            <div class="vc-contact-item" *ngIf="vendor.city">
              <span class="material-symbols-outlined">location_on</span>
              <span>{{ vendor.city }}</span>
            </div>
          </div>

          <!-- Credit & Outstanding Gauge -->
          <div class="vc-credit-gauge">
            <div class="gauge-meta">
              <span class="gauge-label">Outstanding Balance</span>
              <span class="gauge-amount" [class.text-rose-600]="vendor.outstanding_balance > 0">
                {{ vendor.outstanding_balance | appCurrency:'1.0-0' }}
              </span>
            </div>
            <div class="gauge-track">
              <div
                class="gauge-fill"
                [style.width.%]="getCreditUtilizationPercent(vendor)"
                [ngClass]="getUtilizationClass(vendor)"
              ></div>
            </div>
            <div class="gauge-footer">
              <span>Limit: {{ vendor.credit_limit | appCurrency:'1.0-0' }}</span>
              <span>{{ getCreditUtilizationPercent(vendor) }}% Used</span>
            </div>
          </div>

          <!-- Performance & Rating Bar -->
          <div class="vc-performance-row">
            <div class="vc-rating">
              <span class="material-symbols-outlined text-amber-500 text-[18px]">star</span>
              <span class="font-bold text-amber-600">{{ vendor.rating | number:'1.2-2' }}</span>
            </div>
            <div class="vc-metric" title="On-time delivery performance">
              <span class="material-symbols-outlined text-purple text-[16px]">schedule</span>
              <span>{{ vendor.on_time_delivery_rate }}% On-Time</span>
            </div>
            <div class="vc-metric" title="Purchase invoice count">
              <span class="material-symbols-outlined text-purple text-[16px]">receipt</span>
              <span>{{ vendor.total_purchases_count }} Orders</span>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="vc-actions-row" (click)="$event.stopPropagation()">
            <button
              type="button"
              (click)="openDetailDrawer(vendor)"
              class="vc-action-btn btn-view"
              title="View full 9-dimension profile"
            >
              <span class="material-symbols-outlined">visibility</span>
              <span>Full Details</span>
            </button>
            <button
              type="button"
              (click)="openPurchaseModal(vendor)"
              class="vc-action-btn btn-purchase"
              title="Record supply purchase invoice"
            >
              <span class="material-symbols-outlined">add_shopping_cart</span>
              <span>Bill</span>
            </button>
            <button
              type="button"
              *ngIf="vendor.outstanding_balance > 0"
              (click)="openPaymentModal(vendor)"
              class="vc-action-btn btn-pay"
              title="Record supplier payment"
            >
              <span class="material-symbols-outlined">payments</span>
              <span>Pay</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4b. VENDOR LISTING: TABLE VIEW                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="viewMode === 'table'" class="vendor-table-card">
        <table class="vt-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Terms & Limit</th>
              <th>Outstanding</th>
              <th>Rating & Quality</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let vendor of filteredVendors" (click)="openDetailDrawer(vendor)" class="table-row-clickable">
              <td>
                <div class="vt-vendor-col">
                  <div class="vt-avatar">
                    <span class="material-symbols-outlined text-[20px]">store</span>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800">{{ vendor.name }}</div>
                    <div class="text-xs text-purple font-semibold">{{ vendor.vendor_code }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="vc-category-pill">{{ vendor.category }}</span>
              </td>
              <td>
                <div class="text-sm font-medium">{{ vendor.contact_person || 'N/A' }}</div>
                <div class="text-xs text-muted">{{ vendor.phone }}</div>
              </td>
              <td>
                <div class="text-sm font-semibold">{{ formatPaymentTerms(vendor.payment_terms) }}</div>
                <div class="text-xs text-muted">Limit: {{ vendor.credit_limit | appCurrency:'1.0-0' }}</div>
              </td>
              <td>
                <div class="font-bold" [class.text-rose-600]="vendor.outstanding_balance > 0">
                  {{ vendor.outstanding_balance | appCurrency:'1.0-0' }}
                </div>
                <div class="text-xs text-muted">{{ getCreditUtilizationPercent(vendor) }}% of limit</div>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-amber-500 text-[16px]">star</span>
                  <span class="font-bold text-slate-800">{{ vendor.rating | number:'1.2-2' }}</span>
                </div>
                <div class="text-xs text-emerald-600">{{ vendor.on_time_delivery_rate }}% On-Time</div>
              </td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(vendor.status)">
                  {{ vendor.status }}
                </span>
              </td>
              <td class="text-right" (click)="$event.stopPropagation()">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    (click)="openDetailDrawer(vendor)"
                    class="table-icon-btn"
                    title="View Profile"
                  >
                    <span class="material-symbols-outlined">visibility</span>
                  </button>
                  <button
                    type="button"
                    (click)="openPurchaseModal(vendor)"
                    class="table-icon-btn text-purple"
                    title="Record Purchase"
                  >
                    <span class="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                  <button
                    type="button"
                    *ngIf="vendor.outstanding_balance > 0"
                    (click)="openPaymentModal(vendor)"
                    class="table-icon-btn text-emerald-600"
                    title="Record Payment"
                  >
                    <span class="material-symbols-outlined">payments</span>
                  </button>
                  <button
                    type="button"
                    (click)="openEditModal(vendor)"
                    class="table-icon-btn"
                    title="Edit Vendor"
                  >
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredVendors.length === 0">
              <td colspan="8" class="text-center py-8 text-muted">
                No vendors found matching your current filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. COMPREHENSIVE VENDOR DETAIL DRAWER / MODAL (9 DIMENSIONS)   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="selectedVendor" class="modal-backdrop" (click)="closeDetailDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <!-- Drawer Header -->
          <div class="drawer-header">
            <div class="dh-left">
              <div class="dh-avatar">
                <span class="material-symbols-outlined text-[32px]">store</span>
              </div>
              <div>
                <div class="dh-badge-row">
                  <span class="vc-code">{{ selectedVendor.vendor_code }}</span>
                  <span class="badge" [ngClass]="getStatusBadgeClass(selectedVendor.status)">
                    {{ selectedVendor.status }}
                  </span>
                  <span class="vc-category-pill">{{ selectedVendor.category }}</span>
                </div>
                <h2 class="dh-title">{{ selectedVendor.name }}</h2>
              </div>
            </div>

            <div class="dh-right">
              <button
                type="button"
                (click)="openEditModal(selectedVendor)"
                class="drawer-btn btn-edit"
                title="Edit Vendor Profile"
              >
                <span class="material-symbols-outlined">edit</span>
                <span>Edit</span>
              </button>
              <button
                type="button"
                (click)="closeDetailDrawer()"
                class="drawer-close-btn"
                aria-label="Close"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <!-- Drawer Navigation Tabs (9 Dimensions) -->
          <div class="drawer-tabs">
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'profile'"
              (click)="activeTab = 'profile'"
            >
              <span class="material-symbols-outlined">badge</span>
              <span>1. Profile</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'contact'"
              (click)="activeTab = 'contact'"
            >
              <span class="material-symbols-outlined">contacts</span>
              <span>2. Contact</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'tax'"
              (click)="activeTab = 'tax'"
            >
              <span class="material-symbols-outlined">policy</span>
              <span>3. Tax Details</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'payment_terms'"
              (click)="activeTab = 'payment_terms'"
            >
              <span class="material-symbols-outlined">account_balance</span>
              <span>4. Terms & Bank</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'credit'"
              (click)="activeTab = 'credit'"
            >
              <span class="material-symbols-outlined">credit_score</span>
              <span>5. Credit Limit</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'purchases'"
              (click)="activeTab = 'purchases'"
            >
              <span class="material-symbols-outlined">shopping_cart</span>
              <span>6. Purchases ({{ selectedVendor.total_purchases_count }})</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'balance'"
              (click)="activeTab = 'balance'"
            >
              <span class="material-symbols-outlined">receipt_long</span>
              <span>7. Balance</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'rating'"
              (click)="activeTab = 'rating'"
            >
              <span class="material-symbols-outlined">star</span>
              <span>8. Rating</span>
            </button>
            <button
              type="button"
              class="d-tab"
              [class.active]="activeTab === 'performance'"
              (click)="activeTab = 'performance'"
            >
              <span class="material-symbols-outlined">analytics</span>
              <span>9. Performance</span>
            </button>
          </div>

          <!-- Drawer Body Content -->
          <div class="drawer-body">
            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 1: VENDOR PROFILE                                   -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'profile'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">badge</span>
                  <span>Vendor Master Profile</span>
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Vendor Code</span>
                    <span class="info-val font-mono font-bold text-purple">{{ selectedVendor.vendor_code }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Legal / Trade Name</span>
                    <span class="info-val font-semibold">{{ selectedVendor.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Category Group</span>
                    <span class="info-val">{{ selectedVendor.category }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Operating Status</span>
                    <span class="badge" [ngClass]="getStatusBadgeClass(selectedVendor.status)">
                      {{ selectedVendor.status }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Onboarding Date</span>
                    <span class="info-val">{{ (selectedVendor.created_at || 'Recently added') | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Purchase Date</span>
                    <span class="info-val">{{ selectedVendor.last_purchase_date ? (selectedVendor.last_purchase_date | date:'mediumDate') : 'No purchases yet' }}</span>
                  </div>
                </div>

                <div class="mt-4" *ngIf="selectedVendor.notes">
                  <span class="info-label">Operational Notes & Remarks</span>
                  <div class="notes-box">{{ selectedVendor.notes }}</div>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 2: CONTACT INFORMATION                              -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'contact'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">contacts</span>
                  <span>Direct Contact Information</span>
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Primary Contact Person</span>
                    <span class="info-val font-semibold">{{ selectedVendor.contact_person || 'Not specified' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Primary Phone</span>
                    <a [href]="'tel:' + selectedVendor.phone" class="info-val text-purple underline flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">call</span>
                      <span>{{ selectedVendor.phone }}</span>
                    </a>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Official Email</span>
                    <a *ngIf="selectedVendor.email" [href]="'mailto:' + selectedVendor.email" class="info-val text-purple underline flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">mail</span>
                      <span>{{ selectedVendor.email }}</span>
                    </a>
                    <span *ngIf="!selectedVendor.email" class="info-val text-muted">None provided</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Official Website</span>
                    <a *ngIf="selectedVendor.website" [href]="selectedVendor.website" target="_blank" class="info-val text-purple underline flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>{{ selectedVendor.website }}</span>
                    </a>
                    <span *ngIf="!selectedVendor.website" class="info-val text-muted">None provided</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="info-label">Physical Warehouse / Office Address</span>
                    <div class="address-box">
                      <span class="material-symbols-outlined text-purple">pin_drop</span>
                      <span>
                        {{ selectedVendor.address || 'Address on file not specified' }}
                        <span *ngIf="selectedVendor.city">, {{ selectedVendor.city }}</span>
                        <span *ngIf="selectedVendor.state">, {{ selectedVendor.state }}</span>
                        <span *ngIf="selectedVendor.postal_code"> - {{ selectedVendor.postal_code }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 3: TAX DETAILS                                      -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'tax'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">policy</span>
                  <span>Statutory & Tax Identification</span>
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">GSTIN / VAT Number</span>
                    <span class="info-val font-mono font-bold">{{ selectedVendor.tax_id || 'Unregistered' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">PAN / Tax Identification Number</span>
                    <span class="info-val font-mono font-bold">{{ selectedVendor.pan_number || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tax Category</span>
                    <span class="info-val">{{ selectedVendor.tax_category || 'STANDARD (Regular)' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">MSME Registration Number</span>
                    <span class="info-val">{{ selectedVendor.msme_number || 'Not Registered' }}</span>
                  </div>
                </div>

                <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-600">verified</span>
                  <span class="text-xs text-emerald-800 font-medium">
                    Tax details are synchronized with the central invoicing and automated purchase input GST calculation engine.
                  </span>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 4: PAYMENT TERMS & BANKING                          -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'payment_terms'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">account_balance</span>
                  <span>Payment Terms & Bank Account Settlement</span>
                </h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Contracted Payment Terms</span>
                    <span class="info-val font-bold text-purple">{{ formatPaymentTerms(selectedVendor.payment_terms) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Preferred Settlement Method</span>
                    <span class="info-val font-semibold">{{ selectedVendor.preferred_payment_method || 'BANK_TRANSFER' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Bank Name</span>
                    <span class="info-val">{{ selectedVendor.bank_name || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Account / IBAN Number</span>
                    <span class="info-val font-mono font-bold">{{ selectedVendor.account_number || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">IFSC / Routing / SWIFT</span>
                    <span class="info-val font-mono">{{ selectedVendor.ifsc_code || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Branch Name</span>
                    <span class="info-val">{{ selectedVendor.branch_name || 'N/A' }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedVendor.upi_id">
                    <span class="info-label">UPI / Instant Pay ID</span>
                    <span class="info-val font-mono text-purple">{{ selectedVendor.upi_id }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 5: CREDIT LIMIT & UTILIZATION                       -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'credit'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">credit_score</span>
                  <span>Credit Limit & Exposure Tracking</span>
                </h3>

                <div class="credit-banner">
                  <div class="cb-item">
                    <span class="cb-label">Allocated Credit Limit</span>
                    <span class="cb-val">{{ selectedVendor.credit_limit | appCurrency:'1.0-0' }}</span>
                  </div>
                  <div class="cb-item">
                    <span class="cb-label">Utilized Balance</span>
                    <span class="cb-val text-rose-600">{{ selectedVendor.outstanding_balance | appCurrency:'1.0-0' }}</span>
                  </div>
                  <div class="cb-item">
                    <span class="cb-label">Available Headroom</span>
                    <span class="cb-val text-emerald-600">
                      {{ (selectedVendor.credit_limit - selectedVendor.outstanding_balance) | appCurrency:'1.0-0' }}
                    </span>
                  </div>
                  <div class="cb-item">
                    <span class="cb-label">Credit Term Period</span>
                    <span class="cb-val font-medium">{{ selectedVendor.credit_period_days || 30 }} Days</span>
                  </div>
                </div>

                <!-- Utilization Bar -->
                <div class="mt-6">
                  <div class="flex justify-between text-xs font-semibold mb-2">
                    <span>Credit Utilization Progress</span>
                    <span>{{ getCreditUtilizationPercent(selectedVendor) }}% Used</span>
                  </div>
                  <div class="gauge-track-large">
                    <div
                      class="gauge-fill-large"
                      [style.width.%]="getCreditUtilizationPercent(selectedVendor)"
                      [ngClass]="getUtilizationClass(selectedVendor)"
                    ></div>
                  </div>
                  <div class="flex justify-between text-xs text-muted mt-2">
                    <span>0.00</span>
                    <span>Safe (&lt;70%)</span>
                    <span>Warning (70-90%)</span>
                    <span>{{ selectedVendor.credit_limit | appCurrency:'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 6: PURCHASE HISTORY                                 -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'purchases'" class="tab-pane">
              <div class="section-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="section-title m-0">
                    <span class="material-symbols-outlined">shopping_cart</span>
                    <span>Purchase Invoices & Orders History</span>
                  </h3>
                  <button
                    type="button"
                    (click)="openPurchaseModal(selectedVendor)"
                    class="action-btn btn-primary"
                  >
                    <span class="material-symbols-outlined">add</span>
                    <span>Record New Purchase</span>
                  </button>
                </div>

                <div *ngIf="vendorPurchases.length === 0" class="empty-tab-state">
                  <span class="material-symbols-outlined">receipt_long</span>
                  <p>No purchase records found for this vendor yet.</p>
                </div>

                <div *ngIf="vendorPurchases.length > 0" class="purchases-table-wrap">
                  <table class="vt-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice #</th>
                        <th>Items Summary</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let p of vendorPurchases">
                        <td>{{ p.order_date | date:'mediumDate' }}</td>
                        <td class="font-mono font-bold text-purple">{{ p.invoice_number }}</td>
                        <td class="text-sm max-w-xs truncate" [title]="p.items_summary">{{ p.items_summary || 'General supplies' }}</td>
                        <td class="font-bold">{{ p.total_amount | appCurrency:'1.0-0' }}</td>
                        <td class="text-emerald-600 font-semibold">{{ p.paid_amount | appCurrency:'1.0-0' }}</td>
                        <td class="font-bold" [class.text-rose-600]="p.balance_amount > 0">
                          {{ p.balance_amount | appCurrency:'1.0-0' }}
                        </td>
                        <td>
                          <span class="badge" [ngClass]="getPurchaseStatusBadgeClass(p.payment_status)">
                            {{ p.payment_status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 7: OUTSTANDING BALANCE & PAYMENTS                   -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'balance'" class="tab-pane">
              <div class="section-card">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h3 class="section-title m-0">
                      <span class="material-symbols-outlined">receipt_long</span>
                      <span>Outstanding Balance & Payment Logs</span>
                    </h3>
                    <p class="text-xs text-muted mt-1">
                      Clear pending supplier liabilities and record bank/cash transfers.
                    </p>
                  </div>
                  <button
                    type="button"
                    *ngIf="selectedVendor.outstanding_balance > 0"
                    (click)="openPaymentModal(selectedVendor)"
                    class="action-btn btn-primary"
                  >
                    <span class="material-symbols-outlined">payments</span>
                    <span>Record Payment</span>
                  </button>
                </div>

                <div class="balance-highlight-card">
                  <div>
                    <span class="text-xs font-semibold text-rose-800 uppercase tracking-wide">Total Amount Payable</span>
                    <div class="text-3xl font-extrabold text-rose-600 mt-1">
                      {{ selectedVendor.outstanding_balance | appCurrency:'1.0-0' }}
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-muted block">Last Payment Settled</span>
                    <span class="text-sm font-semibold text-slate-800">
                      {{ selectedVendor.last_payment_date ? (selectedVendor.last_payment_date | date:'mediumDate') : 'No payment recorded' }}
                    </span>
                  </div>
                </div>

                <h4 class="text-sm font-bold text-slate-800 mb-3 mt-6">Payment History Logs</h4>
                <div *ngIf="vendorPayments.length === 0" class="empty-tab-state">
                  <span class="material-symbols-outlined">paid</span>
                  <p>No supplier disbursements recorded yet.</p>
                </div>

                <div *ngIf="vendorPayments.length > 0" class="purchases-table-wrap">
                  <table class="vt-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payment #</th>
                        <th>Mode</th>
                        <th>Reference / TXN</th>
                        <th>Amount Paid</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let pay of vendorPayments">
                        <td>{{ pay.payment_date | date:'mediumDate' }}</td>
                        <td class="font-mono font-bold text-purple">{{ pay.payment_number }}</td>
                        <td><span class="vc-category-pill">{{ pay.payment_method }}</span></td>
                        <td class="font-mono text-xs">{{ pay.reference_number || '-' }}</td>
                        <td class="font-bold text-emerald-600">{{ pay.amount | appCurrency:'1.0-0' }}</td>
                        <td class="text-xs text-muted">{{ pay.notes || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 8: VENDOR RATING                                    -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'rating'" class="tab-pane">
              <div class="section-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="section-title m-0">
                    <span class="material-symbols-outlined">star</span>
                    <span>Vendor Rating & Evaluation</span>
                  </h3>
                  <button
                    type="button"
                    (click)="openRatingModal(selectedVendor)"
                    class="action-btn btn-outline"
                  >
                    <span class="material-symbols-outlined">rate_review</span>
                    <span>Update Rating & Feedback</span>
                  </button>
                </div>

                <div class="rating-display-grid">
                  <div class="rating-hero-card">
                    <span class="text-5xl font-black text-amber-500">{{ selectedVendor.rating | number:'1.1-1' }}</span>
                    <div class="stars-row mt-2">
                      <span
                        *ngFor="let s of [1, 2, 3, 4, 5]"
                        class="material-symbols-outlined text-[24px]"
                        [ngClass]="s <= selectedVendor.rating ? 'text-amber-500' : 'text-slate-300'"
                      >
                        star
                      </span>
                    </div>
                    <span class="text-xs text-muted mt-2">Overall Vendor Quality Score</span>
                  </div>

                  <div class="sub-ratings-card">
                    <div class="sr-item">
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span>Delivery Speed & Punctuality</span>
                        <span class="text-amber-600 font-bold">★ {{ selectedVendor.delivery_speed_rating | number:'1.1-1' }}</span>
                      </div>
                      <div class="sr-track">
                        <div class="sr-fill bg-amber-500" [style.width.%]="(selectedVendor.delivery_speed_rating / 5) * 100"></div>
                      </div>
                    </div>

                    <div class="sr-item mt-4">
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span>Product Freshness & Specification Quality</span>
                        <span class="text-amber-600 font-bold">★ {{ selectedVendor.quality_rating | number:'1.1-1' }}</span>
                      </div>
                      <div class="sr-track">
                        <div class="sr-fill bg-emerald-500" [style.width.%]="(selectedVendor.quality_rating / 5) * 100"></div>
                      </div>
                    </div>

                    <div class="sr-item mt-4">
                      <div class="flex justify-between text-xs font-semibold mb-1">
                        <span>Pricing & Commercial Competitiveness</span>
                        <span class="text-amber-600 font-bold">★ {{ selectedVendor.pricing_rating | number:'1.1-1' }}</span>
                      </div>
                      <div class="sr-track">
                        <div class="sr-fill bg-purple" [style.width.%]="(selectedVendor.pricing_rating / 5) * 100"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl" *ngIf="selectedVendor.performance_notes">
                  <span class="text-xs font-bold text-slate-700 block mb-1">Auditor & Chef Review Remarks</span>
                  <p class="text-sm text-slate-600 leading-relaxed">{{ selectedVendor.performance_notes }}</p>
                </div>
              </div>
            </div>

            <!-- ═════════════════════════════════════════════════════════ -->
            <!-- TAB 9: VENDOR PERFORMANCE                               -->
            <!-- ═════════════════════════════════════════════════════════ -->
            <div *ngIf="activeTab === 'performance'" class="tab-pane">
              <div class="section-card">
                <h3 class="section-title">
                  <span class="material-symbols-outlined">analytics</span>
                  <span>Operational KPI Scorecard</span>
                </h3>

                <div class="perf-metrics-grid">
                  <div class="pm-card">
                    <div class="pm-icon bg-emerald-100 text-emerald-700">
                      <span class="material-symbols-outlined">timelapse</span>
                    </div>
                    <div class="pm-value text-emerald-600">{{ selectedVendor.on_time_delivery_rate }}%</div>
                    <div class="pm-label">On-Time Delivery Rate</div>
                    <div class="pm-bar">
                      <div class="pm-fill bg-emerald-500" [style.width.%]="selectedVendor.on_time_delivery_rate"></div>
                    </div>
                  </div>

                  <div class="pm-card">
                    <div class="pm-icon bg-purple-100 text-purple">
                      <span class="material-symbols-outlined">verified</span>
                    </div>
                    <div class="pm-value text-purple">{{ selectedVendor.quality_score }}%</div>
                    <div class="pm-label">Quality Compliance</div>
                    <div class="pm-bar">
                      <div class="pm-fill bg-purple" [style.width.%]="selectedVendor.quality_score"></div>
                    </div>
                  </div>

                  <div class="pm-card">
                    <div class="pm-icon bg-indigo-100 text-indigo-700">
                      <span class="material-symbols-outlined">task_alt</span>
                    </div>
                    <div class="pm-value text-indigo-600">{{ selectedVendor.fulfillment_rate }}%</div>
                    <div class="pm-label">Order Fulfillment Ratio</div>
                    <div class="pm-bar">
                      <div class="pm-fill bg-indigo-600" [style.width.%]="selectedVendor.fulfillment_rate"></div>
                    </div>
                  </div>

                  <div class="pm-card">
                    <div class="pm-icon bg-amber-100 text-amber-700">
                      <span class="material-symbols-outlined">security</span>
                    </div>
                    <div class="pm-value text-emerald-600">LOW RISK</div>
                    <div class="pm-label">Vendor Risk Tier</div>
                    <div class="pm-bar">
                      <div class="pm-fill bg-emerald-500" style="width: 100%;"></div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-purple-light border border-purple-200 rounded-xl">
                  <div class="flex items-center gap-2 mb-2 font-bold text-purple text-sm">
                    <span class="material-symbols-outlined text-[20px]">auto_graph</span>
                    <span>Performance Assessment Insights</span>
                  </div>
                  <p class="text-xs text-slate-700 leading-relaxed">
                    This supplier meets the criteria for preferred restaurant partner status. Cold-chain delivery guidelines and Halal batch certifications are verified current.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. ADD / EDIT VENDOR MODAL                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="isVendorModalOpen" class="modal-backdrop" (click)="closeVendorModal()">
        <div class="form-modal-panel" (click)="$event.stopPropagation()">
          <div class="fmp-header">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-purple text-[26px]">
                {{ isEditing ? 'edit_note' : 'add_business' }}
              </span>
              <h2 class="text-xl font-extrabold text-slate-800">
                {{ isEditing ? 'Edit Vendor Profile' : 'Register New Vendor' }}
              </h2>
            </div>
            <button type="button" (click)="closeVendorModal()" class="drawer-close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveVendor()" class="fmp-form">
            <!-- Modal Section 1: Profile -->
            <div class="fmp-section">
              <h4 class="fmp-section-heading">1. Vendor Profile & Category</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Vendor Code (Auto/Custom)</label>
                  <input
                    type="text"
                    [(ngModel)]="vendorForm.vendor_code"
                    name="vendor_code"
                    placeholder="e.g. VND-006 (or leave blank)"
                    class="form-control font-mono"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Vendor / Company Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="vendorForm.name"
                    name="name"
                    required
                    placeholder="e.g. Al-Watania Poultry"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Category Group *</label>
                  <app-custom-dropdown
                    [options]="categoryOptions"
                    [(ngModel)]="vendorForm.category"
                    name="category"
                    [searchable]="true"
                    placeholder="Select category group"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <app-custom-dropdown
                    [options]="vendorStatusOptions"
                    [(ngModel)]="vendorForm.status"
                    name="status"
                    placeholder="Select status"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
              </div>
            </div>

            <!-- Modal Section 2: Contact Info -->
            <div class="fmp-section">
              <h4 class="fmp-section-heading">2. Contact Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Contact Person</label>
                  <input
                    type="text"
                    [(ngModel)]="vendorForm.contact_person"
                    name="contact_person"
                    placeholder="e.g. Sheikh Tariq"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    [(ngModel)]="vendorForm.phone"
                    name="phone"
                    required
                    placeholder="e.g. +966 50 123 4567"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input
                    type="email"
                    [(ngModel)]="vendorForm.email"
                    name="email"
                    placeholder="orders@supplier.com"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Website</label>
                  <input
                    type="url"
                    [(ngModel)]="vendorForm.website"
                    name="website"
                    placeholder="https://..."
                    class="form-control"
                  />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Street Address & City</label>
                  <input
                    type="text"
                    [(ngModel)]="vendorForm.address"
                    name="address"
                    placeholder="Warehouse District, Gate #4"
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" [(ngModel)]="vendorForm.city" name="city" placeholder="Riyadh" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">State / Region</label>
                  <input type="text" [(ngModel)]="vendorForm.state" name="state" placeholder="Central Region" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Modal Section 3: Tax & Banking -->
            <div class="fmp-section">
              <h4 class="fmp-section-heading">3. Tax Details, Payment Terms & Banking</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">GSTIN / VAT Number</label>
                  <input type="text" [(ngModel)]="vendorForm.tax_id" name="tax_id" placeholder="310123456700003" class="form-control font-mono" />
                </div>
                <div class="form-group">
                  <label class="form-label">PAN Number</label>
                  <input type="text" [(ngModel)]="vendorForm.pan_number" name="pan_number" placeholder="ALWPM9821K" class="form-control font-mono" />
                </div>
                <div class="form-group">
                  <label class="form-label">Payment Terms</label>
                  <app-custom-dropdown
                    [options]="paymentTermsOptions"
                    [(ngModel)]="vendorForm.payment_terms"
                    name="payment_terms"
                    placeholder="Select payment terms"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
                <div class="form-group">
                  <label class="form-label">Credit Limit ({{ defaultCurrency }})</label>
                  <input type="number" min="0" [(ngModel)]="vendorForm.credit_limit" name="credit_limit" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Bank Name</label>
                  <input type="text" [(ngModel)]="vendorForm.bank_name" name="bank_name" placeholder="Al Rajhi Bank" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Account / IBAN Number</label>
                  <input type="text" [(ngModel)]="vendorForm.account_number" name="account_number" placeholder="SA..." class="form-control font-mono" />
                </div>
                <div class="form-group">
                  <label class="form-label">IFSC / Routing Code</label>
                  <input type="text" [(ngModel)]="vendorForm.ifsc_code" name="ifsc_code" placeholder="RJHISARI" class="form-control font-mono" />
                </div>
                <div class="form-group">
                  <label class="form-label">UPI / Settlement ID</label>
                  <input type="text" [(ngModel)]="vendorForm.upi_id" name="upi_id" placeholder="vendor@upi" class="form-control" />
                </div>
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="fmp-footer">
              <button type="button" (click)="closeVendorModal()" class="action-btn btn-outline">
                Cancel
              </button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">save</span>
                <span>{{ isSubmitting ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Vendor') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 7. RECORD PURCHASE INVOICE MODAL                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="isPurchaseModalOpen && selectedVendor" class="modal-backdrop" (click)="closePurchaseModal()">
        <div class="compact-modal-panel" (click)="$event.stopPropagation()">
          <div class="fmp-header">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Record Purchase Invoice</h3>
              <p class="text-xs text-purple font-medium">{{ selectedVendor.name }} ({{ selectedVendor.vendor_code }})</p>
            </div>
            <button type="button" (click)="closePurchaseModal()" class="drawer-close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="savePurchase()" class="p-6 space-y-4">
            <div class="form-group">
              <label class="form-label">Invoice / Bill Number *</label>
              <input
                type="text"
                [(ngModel)]="purchaseForm.invoice_number"
                name="invoice_number"
                required
                placeholder="e.g. INV-2026-099"
                class="form-control font-mono"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Invoice Date *</label>
                <input type="date" [(ngModel)]="purchaseForm.order_date" name="order_date" required class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Due Date</label>
                <input type="date" [(ngModel)]="purchaseForm.due_date" name="due_date" class="form-control" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Total Bill Amount *</label>
                <input type="number" step="0.01" min="1" [(ngModel)]="purchaseForm.total_amount" name="total_amount" required class="form-control font-bold" />
              </div>
              <div class="form-group">
                <label class="form-label">Immediate Paid Amount</label>
                <input type="number" step="0.01" min="0" [(ngModel)]="purchaseForm.paid_amount" name="paid_amount" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Items Summary / Description</label>
              <textarea
                [(ngModel)]="purchaseForm.items_summary"
                name="items_summary"
                rows="2"
                placeholder="e.g. 200x Fresh Chickens (1100g), 40kg Mutton Cuts"
                class="form-control"
              ></textarea>
            </div>

            <div class="fmp-footer mt-4">
              <button type="button" (click)="closePurchaseModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">receipt_long</span>
                <span>{{ isSubmitting ? 'Recording…' : 'Record Purchase' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 8. RECORD PAYMENT MODAL                                         -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="isPaymentModalOpen && selectedVendor" class="modal-backdrop" (click)="closePaymentModal()">
        <div class="compact-modal-panel" (click)="$event.stopPropagation()">
          <div class="fmp-header">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Record Vendor Disbursement</h3>
              <p class="text-xs text-rose-600 font-bold">Outstanding: {{ selectedVendor.outstanding_balance | appCurrency:'1.0-0' }}</p>
            </div>
            <button type="button" (click)="closePaymentModal()" class="drawer-close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="savePayment()" class="p-6 space-y-4">
            <div class="form-group">
              <label class="form-label">Disbursement Amount ({{ defaultCurrency }}) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                [max]="selectedVendor.outstanding_balance"
                [(ngModel)]="paymentForm.amount"
                name="amount"
                required
                class="form-control text-lg font-bold text-emerald-600"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Payment Date *</label>
                <input type="date" [(ngModel)]="paymentForm.payment_date" name="payment_date" required class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Method *</label>
                <select [(ngModel)]="paymentForm.payment_method" name="payment_method" class="form-control">
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/Wire)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="UPI">UPI / Instant Online</option>
                  <option value="CASH">Cash Voucher</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Bank Transaction / Cheque / Ref #</label>
              <input
                type="text"
                [(ngModel)]="paymentForm.reference_number"
                name="reference_number"
                placeholder="e.g. TXN-RAJHI-8891024"
                class="form-control font-mono"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Remarks</label>
              <input
                type="text"
                [(ngModel)]="paymentForm.notes"
                name="notes"
                placeholder="e.g. Cleared against invoice batch"
                class="form-control"
              />
            </div>

            <div class="fmp-footer mt-4">
              <button type="button" (click)="closePaymentModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">payments</span>
                <span>{{ isSubmitting ? 'Processing…' : 'Record Payment' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 9. UPDATE RATING & EVALUATION MODAL                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="isRatingModalOpen && selectedVendor" class="modal-backdrop" (click)="closeRatingModal()">
        <div class="compact-modal-panel" (click)="$event.stopPropagation()">
          <div class="fmp-header">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Evaluate Vendor & Scorecard</h3>
              <p class="text-xs text-purple font-medium">{{ selectedVendor.name }}</p>
            </div>
            <button type="button" (click)="closeRatingModal()" class="drawer-close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveRating()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Overall Star Rating (1 - 5)</label>
                <input type="number" step="0.1" min="1" max="5" [(ngModel)]="ratingForm.rating" name="rating" class="form-control font-bold" />
              </div>
              <div class="form-group">
                <label class="form-label">Delivery Speed Rating (1 - 5)</label>
                <input type="number" step="0.1" min="1" max="5" [(ngModel)]="ratingForm.delivery_speed_rating" name="delivery_speed_rating" class="form-control" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Product Quality Rating (1 - 5)</label>
                <input type="number" step="0.1" min="1" max="5" [(ngModel)]="ratingForm.quality_rating" name="quality_rating" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Pricing Competitiveness (1 - 5)</label>
                <input type="number" step="0.1" min="1" max="5" [(ngModel)]="ratingForm.pricing_rating" name="pricing_rating" class="form-control" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="form-group">
                <label class="form-label text-xs">On-Time %</label>
                <input type="number" min="0" max="100" [(ngModel)]="ratingForm.on_time_delivery_rate" name="on_time_delivery_rate" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label text-xs">Quality %</label>
                <input type="number" min="0" max="100" [(ngModel)]="ratingForm.quality_score" name="quality_score" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label text-xs">Fulfillment %</label>
                <input type="number" min="0" max="100" [(ngModel)]="ratingForm.fulfillment_rate" name="fulfillment_rate" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Auditor Review Notes</label>
              <textarea [(ngModel)]="ratingForm.performance_notes" name="performance_notes" rows="2" class="form-control"></textarea>
            </div>

            <div class="fmp-footer mt-4">
              <button type="button" (click)="closeRatingModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">grade</span>
                <span>Save Evaluation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* === VENDOR MANAGEMENT ENTERPRISE STYLES === */
    .vendors-page-wrapper {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      /* 60vh, as every other page wrapper uses: enough to hold the page
         loader up, without being taller than the pane it sits in. Measured
         against the viewport, 100vh always overflowed <main> — which is a
         64px header shorter — so this page alone carried a scrollbar with
         nothing under it to scroll. */
      min-height: 60vh;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    /* Breadcrumbs */
    .breadcrumbs-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted, #6B7280);
      margin-bottom: 1rem;
    }
    .breadcrumb-separator {
      color: var(--text-dim, #9CA3AF);
    }
    .breadcrumb-current {
      color: var(--primary, #7E22CE);
      font-weight: 600;
    }

    /* Module Header Card */
    .module-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 16px;
      padding: 1.25rem 1.75rem;
      box-shadow: 0 4px 20px -2px rgba(var(--text-main-rgb, 46, 16, 101), 0.06);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .header-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.35);
    }
    .header-icon-box .material-symbols-outlined {
      font-size: 28px;
    }
    .header-title-flex {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
      letter-spacing: -0.02em;
    }
    .status-dot-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
    }
    .status-dot-pill.is-active {
      background: #F0FDF4;
      color: var(--success, #16A34A);
      border: 1px solid var(--success-light, #BBF7D0);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success, #16A34A);
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .header-meta-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.8125rem;
      color: var(--text-muted, #6B7280);
      margin-top: 0.25rem;
    }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .meta-icon {
      font-size: 16px;
      color: var(--primary, #7E22CE);
    }
    .meta-dot {
      color: var(--text-dim, #CBD5E1);
    }
    .header-action-buttons {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.625rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 12px -2px rgba(var(--primary-rgb, 126, 34, 206), 0.35);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-hover, #9333EA) 0%, var(--primary, #7E22CE) 100%);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: #FFFFFF;
      color: var(--primary-variant, #6B21A8);
      border-color: var(--card-border, #E9D5FF);
    }
    .btn-outline:hover {
      background: var(--bg-app, #FAF5FF);
      border-color: #D8B4FE;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 2px 10px -1px rgba(var(--text-main-rgb, 46, 16, 101), 0.04);
      transition: transform 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
    }
    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #6B7280);
    }
    .kpi-icon-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-icon-badge .material-symbols-outlined {
      font-size: 20px;
    }
    .bg-purple-light { background: var(--bg-app, #FAF5FF); }
    .text-purple { color: var(--primary, #7E22CE); }
    .bg-rose-light { background: #FFF1F2; }
    .text-rose { color: #E11D48; }
    .bg-indigo-light { background: #EEF2FF; }
    .text-indigo { color: #4F46E5; }
    .bg-amber-light { background: var(--warning-light, #FFFBEB); }
    .text-amber { color: var(--warning, #D97706); }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1E1B4B;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    .kpi-subtext {
      font-size: 0.75rem;
      color: var(--text-muted, #6B7280);
    }

    /* Filter Toolbar */
    .filter-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-app, #F8FAFC);
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 8px;
      padding: 0.4rem 0.75rem;
      flex: 1;
      min-width: 280px;
      max-width: 500px;
    }
    .search-icon {
      color: var(--text-dim, #94A3B8);
      font-size: 20px;
    }
    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.8125rem;
      color: #1E293B;
    }
    .clear-search-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-dim, #94A3B8);
      display: flex;
    }
    .clear-search-btn .material-symbols-outlined {
      font-size: 16px;
    }
    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .filter-dropdown-wrapper {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
    }
    .filter-label {
      color: var(--text-muted, #64748B);
      font-weight: 500;
    }
    .filter-select {
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 8px;
      padding: 0.4rem 0.6rem;
      font-size: 0.8125rem;
      color: #1E293B;
      background: #FFFFFF;
      outline: none;
    }
    .view-toggle-group {
      display: flex;
      background: var(--card-hover, #F1F5F9);
      border-radius: 8px;
      padding: 2px;
    }
    .view-btn {
      border: none;
      background: transparent;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-muted, #64748B);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .view-btn.active {
      background: #FFFFFF;
      color: var(--primary, #7E22CE);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Category Pills */
    .category-pills-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .cat-pill:hover {
      border-color: #D8B4FE;
      color: var(--primary, #7E22CE);
    }
    .cat-pill.active {
      background: var(--primary, #7E22CE);
      border-color: var(--primary, #7E22CE);
      color: #FFFFFF;
    }
    .cat-count {
      font-size: 0.6875rem;
      padding: 0.1rem 0.35rem;
      border-radius: 9999px;
      background: rgba(0,0,0,0.06);
    }
    .cat-pill.active .cat-count {
      background: rgba(255,255,255,0.25);
      color: #FFFFFF;
    }

    /* Vendor Cards Grid */
    .vendor-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .vendor-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 2px 10px -1px rgba(var(--text-main-rgb, 46, 16, 101), 0.04);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }
    .vendor-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.12);
      border-color: #C084FC;
    }
    .vc-top-row {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }
    .vc-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-light, #F3E8FF) 0%, var(--card-border, #E9D5FF) 100%);
      color: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vc-identity {
      flex: 1;
      min-width: 0;
    }
    .vc-code-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .vc-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary, #7E22CE);
      background: var(--bg-app, #FAF5FF);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .vc-name {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #1E1B4B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.35rem;
    }
    .vc-category-pill {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted, #4B5563);
      background: #F3F4F6;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }
    .vc-contact-box {
      background: var(--bg-app, #F8FAFC);
      border-radius: 10px;
      padding: 0.625rem 0.75rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .vc-contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #475569;
    }
    .vc-contact-item .material-symbols-outlined {
      font-size: 15px;
      color: var(--primary, #7E22CE);
    }

    /* Credit Gauge */
    .vc-credit-gauge {
      margin-bottom: 1rem;
    }
    .gauge-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.375rem;
    }
    .gauge-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted, #64748B);
    }
    .gauge-amount {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #1E293B;
    }
    .gauge-track {
      width: 100%;
      height: 7px;
      background: var(--card-border, #E2E8F0);
      border-radius: 9999px;
      overflow: hidden;
    }
    .gauge-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
    .gauge-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.6875rem;
      color: var(--text-dim, #94A3B8);
      margin-top: 0.25rem;
    }
    .gauge-safe { background: #10B981; }
    .gauge-warning { background: #F59E0B; }
    .gauge-danger { background: var(--danger, #EF4444); }

    /* Performance Row */
    .vc-performance-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0;
      border-top: 1px dashed var(--card-border, #E2E8F0);
      border-bottom: 1px dashed var(--card-border, #E2E8F0);
      margin-bottom: 1rem;
    }
    .vc-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
    }
    .vc-metric {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted, #64748B);
    }

    /* Actions Row */
    .vc-actions-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
    }
    .vc-action-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.25rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .btn-view {
      background: var(--bg-app, #FAF5FF);
      color: var(--primary, #7E22CE);
      border-color: var(--card-border, #E9D5FF);
    }
    .btn-view:hover {
      background: var(--primary-light, #F3E8FF);
    }
    .btn-purchase {
      background: #EEF2FF;
      color: #4F46E5;
      border-color: #C7D2FE;
    }
    .btn-purchase:hover {
      background: #E0E7FF;
    }
    .btn-pay {
      background: #ECFDF5;
      color: #059669;
      border-color: #A7F3D0;
    }
    .btn-pay:hover {
      background: #D1FAE5;
    }

    /* Table View */
    .vendor-table-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 16px;
      overflow-x: auto;
      box-shadow: 0 4px 20px -2px rgba(var(--text-main-rgb, 46, 16, 101), 0.04);
    }
    .vt-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.8125rem;
    }
    .vt-table th {
      background: var(--bg-app, #FAF5FF);
      color: #581C87;
      font-weight: 700;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--card-border, #E9D5FF);
      white-space: nowrap;
    }
    .vt-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--card-border, #F1F5F9);
      color: #334155;
      vertical-align: middle;
    }
    .table-row-clickable {
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .table-row-clickable:hover {
      background: var(--bg-app, #FAF5FF);
    }
    .vt-vendor-col {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .vt-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary-light, #F3E8FF);
      color: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .table-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--card-border, #E2E8F0);
      background: #FFFFFF;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748B);
    }
    .table-icon-btn:hover {
      background: var(--bg-app, #F8FAFC);
      border-color: var(--card-border, #CBD5E1);
    }
    .table-icon-btn .material-symbols-outlined {
      font-size: 18px;
    }

    /* Status Badges */
    .badge {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-active { background: var(--success-light, #DCFCE7); color: var(--success, #15803D); }
    .badge-inactive { background: var(--card-hover, #F1F5F9); color: var(--text-muted, #64748B); }
    .badge-blocked { background: var(--danger-light, #FEE2E2); color: var(--danger, #B91C1C); }
    .badge-paid { background: var(--success-light, #DCFCE7); color: var(--success, #15803D); }
    .badge-partial { background: var(--warning-light, #FEF3C7); color: var(--warning, #B45309); }
    .badge-unpaid { background: var(--danger-light, #FEE2E2); color: var(--danger, #B91C1C); }

    /* Modals & Drawers */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Full Detail Drawer */
    .drawer-panel {
      width: 100%;
      max-width: 860px;
      background: #FFFFFF;
      height: 100%;
      box-shadow: -10px 0 35px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .drawer-header {
      padding: 1.25rem 1.75rem;
      background: var(--bg-app, #FAF5FF);
      border-bottom: 1px solid var(--card-border, #E9D5FF);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dh-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .dh-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--primary, #7E22CE);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(var(--primary-rgb, 126, 34, 206), 0.3);
    }
    .dh-badge-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .dh-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }
    .dh-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .drawer-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-edit {
      background: #FFFFFF;
      border-color: #D8B4FE;
      color: var(--primary, #7E22CE);
    }
    .btn-edit:hover {
      background: var(--primary-light, #F3E8FF);
    }
    .drawer-close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748B);
    }
    .drawer-close-btn:hover {
      background: var(--card-hover, #F1F5F9);
      color: #1E293B;
    }

    /* Drawer Tabs */
    .drawer-tabs {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: #FFFFFF;
      border-bottom: 1px solid var(--card-border, #E2E8F0);
      padding: 0.5rem 1.25rem 0;
      overflow-x: auto;
    }
    .d-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 0.875rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted, #64748B);
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .d-tab .material-symbols-outlined {
      font-size: 17px;
    }
    .d-tab:hover {
      color: var(--primary, #7E22CE);
    }
    .d-tab.active {
      color: var(--primary, #7E22CE);
      border-bottom-color: var(--primary, #7E22CE);
    }

    /* Drawer Body */
    .drawer-body {
      flex: 1;
      /* A flex item is floored at its content height unless told otherwise,
         which would make this pane grow instead of scroll. */
      min-height: 0;
      overflow-y: auto;
      padding: 1.5rem 1.75rem;
      background: var(--bg-app, #F8FAFC);
    }
    .tab-pane {
      animation: fadeIn 0.15s ease-out;
    }
    .section-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }
    .section-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1E1B4B;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .section-title .material-symbols-outlined {
      color: var(--primary, #7E22CE);
      font-size: 22px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .info-item.full-width {
      grid-column: span 2;
    }
    .info-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted, #64748B);
    }
    .info-val {
      font-size: 0.875rem;
      color: #1E293B;
    }
    .notes-box {
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.8125rem;
      color: #4C1D95;
      margin-top: 0.35rem;
    }
    .address-box {
      background: var(--bg-app, #F8FAFC);
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 8px;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #334155;
      margin-top: 0.35rem;
    }

    /* Credit Banner */
    .credit-banner {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 12px;
      padding: 1rem;
    }
    .cb-item {
      display: flex;
      flex-direction: column;
    }
    .cb-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted, #6B7280);
    }
    .cb-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1E1B4B;
      margin-top: 0.25rem;
    }
    .gauge-track-large {
      width: 100%;
      height: 12px;
      background: var(--card-border, #E2E8F0);
      border-radius: 9999px;
      overflow: hidden;
    }
    .gauge-fill-large {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    /* Balance Highlight */
    .balance-highlight-card {
      background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
      border: 1px solid #FECDD3;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Ratings */
    .rating-display-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 1.5rem;
      align-items: center;
    }
    .rating-hero-card {
      background: var(--warning-light, #FFFBEB);
      border: 1px solid var(--warning-light, #FDE68A);
      border-radius: 14px;
      padding: 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stars-row {
      display: flex;
      align-items: center;
      gap: 0.125rem;
    }
    .sub-ratings-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #F1F5F9);
      border-radius: 12px;
      padding: 1rem;
    }
    .sr-track {
      width: 100%;
      height: 8px;
      background: var(--card-border, #E2E8F0);
      border-radius: 9999px;
      overflow: hidden;
    }
    .sr-fill {
      height: 100%;
      border-radius: 9999px;
    }

    /* Performance Scorecard */
    .perf-metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .pm-card {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .pm-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
    }
    .pm-value {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }
    .pm-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #64748B);
      margin-bottom: 0.625rem;
    }
    .pm-bar {
      width: 100%;
      height: 6px;
      background: var(--card-border, #E2E8F0);
      border-radius: 9999px;
      overflow: hidden;
    }
    .pm-fill {
      height: 100%;
      border-radius: 9999px;
    }

    /* Empty Tab State */
    .empty-tab-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-dim, #94A3B8);
    }
    .empty-tab-state .material-symbols-outlined {
      font-size: 48px;
      color: var(--text-dim, #CBD5E1);
      margin-bottom: 0.5rem;
    }

    /* Compact Modal Panel */
    .compact-modal-panel {
      width: 100%;
      max-width: 520px;
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      margin: auto;
      overflow: hidden;
      animation: scaleUp 0.2s ease-out;
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Form Modal Panel */
    .form-modal-panel {
      width: 100%;
      max-width: 780px;
      background: #FFFFFF;
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      margin: auto;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp 0.2s ease-out;
    }
    .fmp-header {
      padding: 1.25rem 1.5rem;
      background: var(--bg-app, #FAF5FF);
      border-bottom: 1px solid var(--card-border, #E9D5FF);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fmp-form {
      flex: 1;
      /* A flex item is floored at its content height unless told otherwise,
         which would make this pane grow instead of scroll. */
      min-height: 0;
      overflow-y: auto;
      padding: 1.5rem;
    }
    .fmp-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px dashed var(--card-border, #E2E8F0);
    }
    .fmp-section-heading {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--primary, #7E22CE);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group.full-width {
      grid-column: span 2;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
    }
    .form-control {
      border: 1px solid var(--card-border, #CBD5E1);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      color: #1E293B;
      background: #FFFFFF;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .form-control:focus {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 126, 34, 206), 0.1);
    }
    .fmp-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
    }

    @media (max-width: 768px) {
      .vendors-page-wrapper { padding: 1rem; }
      .header-action-buttons { width: 100%; justify-content: space-between; }
      .drawer-panel { max-width: 100%; }
      .info-grid { grid-template-columns: 1fr; }
      .info-item.full-width { grid-column: span 1; }
      .form-grid { grid-template-columns: 1fr; }
      .form-group.full-width { grid-column: span 1; }
      .credit-banner { grid-template-columns: repeat(2, 1fr); }
      .rating-display-grid { grid-template-columns: 1fr; }
      .perf-metrics-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class VendorsComponent implements OnInit {
  private vendorService = inject(VendorService);
  private notify = inject(NotificationService);
  public settingsService = inject(SettingsService);
  public authService = inject(AuthService);

  public isLoading = true;
  public loadError: string | null = null;
  public isSubmitting = false;

  public vendors: Vendor[] = [];
  public filteredVendors: Vendor[] = [];
  public stats: VendorStats | null = null;

  // View preferences
  public viewMode: 'grid' | 'table' = 'grid';
  public searchQuery = '';
  public categoryFilter = 'ALL';
  public statusFilter = 'ALL';
  public sortBy = 'name';

  public availableCategories: string[] = [
    'Meat & Poultry',
    'Rice & Grains',
    'Spices & Condiments',
    'Dairy & Fresh Produce',
    'Packaging & Disposables',
    'General Supplies',
  ];

  // Selected vendor detail drawer
  public selectedVendor: Vendor | null = null;
  public activeTab: ActiveTab = 'profile';
  public vendorPurchases: VendorPurchase[] = [];
  public vendorPayments: VendorPayment[] = [];

  // Modals
  public isVendorModalOpen = false;
  public isEditing = false;
  public isPurchaseModalOpen = false;
  public isPaymentModalOpen = false;
  public isRatingModalOpen = false;

  public defaultCurrency = 'SAR';

  // Dropdown option sets (shared custom dropdown, not native selects)
  public categoryOptions: DropdownOption[] = [
    { value: 'Meat & Poultry', label: 'Meat & Poultry', icon: 'kebab_dining', description: 'Chicken, mutton, beef & fresh cuts' },
    { value: 'Rice & Grains', label: 'Rice & Grains', icon: 'grain', description: 'Basmati, flour, pulses & cereals' },
    { value: 'Spices & Condiments', label: 'Spices & Condiments', icon: 'local_fire_department', description: 'Masala, sauces & seasoning' },
    { value: 'Dairy & Fresh Produce', label: 'Dairy & Fresh Produce', icon: 'egg_alt', description: 'Milk, cheese, eggs & vegetables' },
    { value: 'Packaging & Disposables', label: 'Packaging & Disposables', icon: 'takeout_dining', description: 'Boxes, cups, cutlery & bags' },
    { value: 'Beverages & Syrups', label: 'Beverages & Syrups', icon: 'local_cafe', description: 'Soft drinks, juices & concentrates' },
    { value: 'Equipment & Maintenance', label: 'Equipment & Maintenance', icon: 'handyman', description: 'Kitchen gear, repairs & service' },
    { value: 'General Supplies', label: 'General Supplies', icon: 'inventory_2', description: 'Cleaning, stationery & misc items' },
  ];

  public vendorStatusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'Active', icon: 'check_circle', description: 'Vendor can receive new purchase orders' },
    { value: 'INACTIVE', label: 'Inactive', icon: 'pause_circle', description: 'Hidden from new orders, records kept' },
    { value: 'BLOCKED', label: 'Blocked', icon: 'block', description: 'Barred from all procurement activity' },
  ];

  public paymentTermsOptions: DropdownOption[] = [
    { value: 'NET_7', label: 'Net 7 Days', icon: 'schedule', description: 'Payment due 7 days after invoice' },
    { value: 'NET_15', label: 'Net 15 Days', icon: 'schedule', description: 'Payment due 15 days after invoice' },
    { value: 'NET_30', label: 'Net 30 Days', icon: 'schedule', description: 'Payment due 30 days after invoice' },
    { value: 'NET_45', label: 'Net 45 Days', icon: 'schedule', description: 'Payment due 45 days after invoice' },
    { value: 'NET_60', label: 'Net 60 Days', icon: 'schedule', description: 'Payment due 60 days after invoice' },
    { value: 'COD', label: 'Cash On Delivery', icon: 'payments', description: 'Settled at the point of delivery' },
    { value: 'ADVANCE', label: 'Advance Required', icon: 'account_balance_wallet', description: 'Paid in full before dispatch' },
  ];

  // Form states
  public vendorForm: Partial<Vendor> = this.resetVendorForm();
  public purchaseForm = {
    invoice_number: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    total_amount: 0,
    paid_amount: 0,
    items_summary: '',
    notes: '',
  };
  public paymentForm = {
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    notes: '',
  };
  public ratingForm = {
    rating: 5.0,
    delivery_speed_rating: 5.0,
    quality_rating: 5.0,
    pricing_rating: 5.0,
    on_time_delivery_rate: 100,
    quality_score: 100,
    fulfillment_rate: 100,
    performance_notes: '',
  };

  ngOnInit(): void {
    this.defaultCurrency = this.settingsService.currencySymbol() || 'SAR';
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    this.loadError = null;

    this.vendorService.getStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
          if (res.data.categories?.length) {
            const dynamicCats = res.data.categories.map((c) => c.name);
            this.availableCategories = Array.from(new Set([...this.availableCategories, ...dynamicCats]));
          }
        }
      },
      error: () => {},
    });

    this.vendorService.getVendors({ limit: 100 }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.vendors = res.data || [];
          this.applyFilters();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.message || 'Failed to load vendor directory. Please verify connection.';
      },
    });
  }

  public onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    let list = [...this.vendors];

    if (q) {
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.vendor_code.toLowerCase().includes(q) ||
        (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
        v.phone.toLowerCase().includes(q) ||
        (v.tax_id && v.tax_id.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q))
      );
    }

    if (this.categoryFilter !== 'ALL') {
      list = list.filter((v) => v.category === this.categoryFilter);
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter((v) => v.status === this.statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (this.sortBy === 'vendor_code') return a.vendor_code.localeCompare(b.vendor_code);
      if (this.sortBy === 'outstanding_balance') return (b.outstanding_balance || 0) - (a.outstanding_balance || 0);
      if (this.sortBy === 'total_purchases_amount') return (b.total_purchases_amount || 0) - (a.total_purchases_amount || 0);
      if (this.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return a.name.localeCompare(b.name);
    });

    this.filteredVendors = list;
  }

  public getCategoryCount(catName: string): number {
    return this.vendors.filter((v) => v.category === catName).length;
  }

  public getCreditUtilizationPercent(vendor: Vendor): number {
    if (!vendor.credit_limit || vendor.credit_limit <= 0) return 0;
    const pct = Math.round(((vendor.outstanding_balance || 0) / vendor.credit_limit) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  public getUtilizationClass(vendor: Vendor): string {
    const pct = this.getCreditUtilizationPercent(vendor);
    if (pct >= 90) return 'gauge-danger';
    if (pct >= 70) return 'gauge-warning';
    return 'gauge-safe';
  }

  public getStatusBadgeClass(status: string): string {
    if (status === 'ACTIVE') return 'badge-active';
    if (status === 'BLOCKED') return 'badge-blocked';
    return 'badge-inactive';
  }

  public getPurchaseStatusBadgeClass(status: string): string {
    if (status === 'PAID') return 'badge-paid';
    if (status === 'PARTIAL') return 'badge-partial';
    return 'badge-unpaid';
  }

  public formatPaymentTerms(terms: string): string {
    if (!terms) return 'Net 30';
    return terms.replace('_', ' ');
  }

  // Drawer handlers
  public openDetailDrawer(vendor: Vendor, tab: ActiveTab = 'profile'): void {
    this.selectedVendor = vendor;
    this.activeTab = tab;
    this.loadVendorSubCollections(vendor.id);
  }

  public closeDetailDrawer(): void {
    this.selectedVendor = null;
  }

  private loadVendorSubCollections(vendorId: number): void {
    this.vendorService.getPurchases(vendorId).subscribe({
      next: (res) => {
        if (res.success) this.vendorPurchases = res.data || [];
      },
    });

    this.vendorService.getPayments(vendorId).subscribe({
      next: (res) => {
        if (res.success) this.vendorPayments = res.data || [];
      },
    });
  }

  // Modal handlers
  public openAddModal(): void {
    this.isEditing = false;
    this.vendorForm = this.resetVendorForm();
    this.isVendorModalOpen = true;
  }

  public openEditModal(vendor: Vendor): void {
    this.isEditing = true;
    this.vendorForm = { ...vendor };
    this.isVendorModalOpen = true;
  }

  public closeVendorModal(): void {
    this.isVendorModalOpen = false;
  }

  public saveVendor(): void {
    if (!this.vendorForm.name?.trim() || !this.vendorForm.phone?.trim()) {
      this.notify.warning('Please provide Vendor Name and Contact Phone Number');
      return;
    }

    this.isSubmitting = true;
    if (this.isEditing && this.vendorForm.id) {
      this.vendorService.updateVendor(this.vendorForm.id, this.vendorForm).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notify.success('Vendor profile updated successfully');
          this.closeVendorModal();
          this.loadData();
          if (this.selectedVendor?.id === res.data.id) {
            this.selectedVendor = res.data;
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to update vendor');
        },
      });
    } else {
      this.vendorService.createVendor(this.vendorForm).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notify.success('New vendor registered successfully');
          this.closeVendorModal();
          this.loadData();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to create vendor');
        },
      });
    }
  }

  // Purchase Modal
  public openPurchaseModal(vendor: Vendor): void {
    this.selectedVendor = vendor;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + (vendor.credit_period_days || 30));

    this.purchaseForm = {
      invoice_number: `INV-${vendor.vendor_code}-${Math.floor(100 + Math.random() * 900)}`,
      order_date: today,
      due_date: due.toISOString().split('T')[0],
      total_amount: 0,
      paid_amount: 0,
      items_summary: '',
      notes: '',
    };
    this.isPurchaseModalOpen = true;
  }

  public closePurchaseModal(): void {
    this.isPurchaseModalOpen = false;
  }

  public savePurchase(): void {
    if (!this.selectedVendor) return;
    if (!this.purchaseForm.invoice_number.trim() || this.purchaseForm.total_amount <= 0) {
      this.notify.warning('Please specify a valid invoice number and positive total amount');
      return;
    }

    this.isSubmitting = true;
    this.vendorService.recordPurchase(this.selectedVendor.id, this.purchaseForm).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Purchase invoice recorded successfully');
        this.closePurchaseModal();
        this.loadData();
        this.selectedVendor = res.data;
        this.loadVendorSubCollections(res.data.id);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to record purchase invoice');
      },
    });
  }

  // Payment Modal
  public openPaymentModal(vendor: Vendor): void {
    this.selectedVendor = vendor;
    this.paymentForm = {
      amount: vendor.outstanding_balance,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: vendor.preferred_payment_method || 'BANK_TRANSFER',
      reference_number: '',
      notes: '',
    };
    this.isPaymentModalOpen = true;
  }

  public closePaymentModal(): void {
    this.isPaymentModalOpen = false;
  }

  public savePayment(): void {
    if (!this.selectedVendor) return;
    if (this.paymentForm.amount <= 0) {
      this.notify.warning('Disbursement amount must be greater than zero');
      return;
    }

    this.isSubmitting = true;
    this.vendorService.recordPayment(this.selectedVendor.id, this.paymentForm).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Payment recorded and vendor balance cleared');
        this.closePaymentModal();
        this.loadData();
        this.selectedVendor = res.data;
        this.loadVendorSubCollections(res.data.id);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to record payment');
      },
    });
  }

  // Rating Modal
  public openRatingModal(vendor: Vendor): void {
    this.selectedVendor = vendor;
    this.ratingForm = {
      rating: vendor.rating || 5.0,
      delivery_speed_rating: vendor.delivery_speed_rating || 5.0,
      quality_rating: vendor.quality_rating || 5.0,
      pricing_rating: vendor.pricing_rating || 5.0,
      on_time_delivery_rate: vendor.on_time_delivery_rate || 100,
      quality_score: vendor.quality_score || 100,
      fulfillment_rate: vendor.fulfillment_rate || 100,
      performance_notes: vendor.performance_notes || '',
    };
    this.isRatingModalOpen = true;
  }

  public closeRatingModal(): void {
    this.isRatingModalOpen = false;
  }

  public saveRating(): void {
    if (!this.selectedVendor) return;
    this.isSubmitting = true;
    this.vendorService.updateRating(this.selectedVendor.id, this.ratingForm).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Vendor evaluation & scorecard updated');
        this.closeRatingModal();
        this.loadData();
        this.selectedVendor = res.data;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to update rating');
      },
    });
  }

  // Export CSV
  public exportCSV(): void {
    if (this.vendors.length === 0) {
      this.notify.info('No vendor data available to export');
      return;
    }

    const headers = [
      'Code', 'Name', 'Category', 'Status', 'Contact Person', 'Phone', 'Email',
      'City', 'GSTIN/Tax ID', 'Payment Terms', 'Credit Limit', 'Outstanding Balance',
      'Total Purchases', 'Rating', 'On-Time %'
    ];

    const rows = this.filteredVendors.map((v) => [
      `"${v.vendor_code}"`,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.category}"`,
      `"${v.status}"`,
      `"${(v.contact_person || '').replace(/"/g, '""')}"`,
      `"${v.phone}"`,
      `"${v.email || ''}"`,
      `"${v.city || ''}"`,
      `"${v.tax_id || ''}"`,
      `"${v.payment_terms || ''}"`,
      v.credit_limit || 0,
      v.outstanding_balance || 0,
      v.total_purchases_amount || 0,
      v.rating || 5.0,
      v.on_time_delivery_rate || 100,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendors_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Vendor directory CSV exported successfully');
  }

  private resetVendorForm(): Partial<Vendor> {
    return {
      vendor_code: '',
      name: '',
      category: 'Meat & Poultry',
      status: 'ACTIVE',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: 'Riyadh',
      state: 'Central Region',
      postal_code: '',
      website: '',
      tax_id: '',
      pan_number: '',
      tax_category: 'STANDARD',
      msme_number: '',
      payment_terms: 'NET_30',
      preferred_payment_method: 'BANK_TRANSFER',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      upi_id: '',
      credit_limit: 20000,
      credit_period_days: 30,
      rating: 5.0,
      delivery_speed_rating: 5.0,
      quality_rating: 5.0,
      pricing_rating: 5.0,
      on_time_delivery_rate: 100,
      quality_score: 100,
      fulfillment_rate: 100,
      performance_notes: '',
      notes: '',
    };
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorService } from '../../../core/services/vendor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Vendor, VendorPurchase, VendorPayment } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';

type ActiveTab = 'profile' | 'contact' | 'tax' | 'payment_terms' | 'credit' | 'purchases' | 'balance';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, DatePickerComponent, AppCurrencyPipe, PageLoaderComponent, ActionLoadingDirective],
  template: `
    <div class="vendor-detail-page">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading vendor profile…"
        subMessage="Synchronizing supplier ledger, purchase invoices & performance analytics."
        icon="storefront"
        (retry)="loadVendor()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & NAVIGATION                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <span class="breadcrumb-item">Procurement</span>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/vendors" class="breadcrumb-link">Vendor Management</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ vendor?.name || 'Vendor Profile' }}</span>
      </nav>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. HERO VENDOR HEADER CARD                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <header *ngIf="vendor && !isLoading" class="hero-header-card">
        <div class="hero-left">
          <button
            type="button"
            (click)="goBack()"
            class="back-btn"
            title="Return to Vendor Directory"
            aria-label="Return to Vendor Directory"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>

          <div class="hero-avatar" [class.has-img]="!!vendor.image_url">
            <img *ngIf="vendor.image_url" [src]="settingsService.assetUrl(vendor.image_url)" [alt]="vendor.name" class="avatar-img" />
            <span *ngIf="!vendor.image_url" class="material-symbols-outlined">storefront</span>
          </div>

          <div class="hero-identity">
            <div class="hero-title-row">
              <h1 class="hero-title">{{ vendor.name }}</h1>
              <span class="vendor-code-tag">{{ vendor.vendor_code }}</span>
              <span class="status-pill" [ngClass]="getStatusBadgeClass(vendor.status)">
                {{ vendor.status }}
              </span>
              <span class="category-pill" *ngFor="let c of vendorCategories">{{ c }}</span>
            </div>

            <div class="hero-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-purple">account_balance_wallet</span>
                <span>Payable Balance: <strong [class.text-rose-600]="vendor.outstanding_balance > 0">{{ vendor.outstanding_balance | appCurrency }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-blue">shopping_cart</span>
                <span>Total Procured: <strong>{{ totalProcuredAmount | appCurrency }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <button
            type="button"
            (click)="openPurchaseModal()"
            class="hero-btn btn-purchase"
            title="Record Purchase Invoice"
          >
            <span class="material-symbols-outlined">add_shopping_cart</span>
            <span>Record Bill</span>
          </button>

          <button
            type="button"
            (click)="openPaymentModal()"
            class="hero-btn btn-pay"
            title="Record Supplier Disbursement Payment"
          >
            <span class="material-symbols-outlined">payments</span>
            <span>Record Payment</span>
          </button>

          <a
            [routerLink]="['/vendors', vendor.id, 'edit']"
            class="hero-btn btn-primary"
            title="Edit Vendor Information"
          >
            <span class="material-symbols-outlined">edit_note</span>
            <span>Edit Profile</span>
          </a>
        </div>
      </header>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. TOP KPI METRICS ROW                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="vendor && !isLoading" class="kpi-grid">
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Procured</span>
            <div class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">shopping_bag</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ totalProcuredAmount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-purple">{{ vendorPurchases.length || vendor.total_purchases_count || 0 }} Invoices</span>
          </div>
        </div>

        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Paid</span>
            <div class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-emerald-600">{{ totalPaidAmount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-success">{{ paymentSettlementPercent }}% Settled</span>
          </div>
        </div>

        <div class="kpi-card card-accent-rose">
          <div class="kpi-header-row">
            <span class="kpi-title">Outstanding Payable</span>
            <div class="kpi-icon-bubble bg-rose-tint">
              <span class="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-rose-600">{{ (vendor.outstanding_balance || 0) | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill" [ngClass]="vendor.outstanding_balance > 0 ? 'pill-rose' : 'pill-success'">
              {{ vendor.outstanding_balance > 0 ? 'Pending Payout' : 'All Settled' }}
            </span>
          </div>
        </div>

        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Credit Facility</span>
            <div class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">credit_score</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ hasNoLimit ? 'No Limit' : (vendor.credit_limit | appCurrency:'1.0-0') }}</span>
            <span class="kpi-pill" [ngClass]="hasNoLimit ? 'pill-success' : 'pill-blue'">
              {{ hasNoLimit ? 'Unlimited' : (getCreditUtilizationPercent() + '% Used') }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. 8-DIMENSION TAB NAVIGATION BAR (Staff Module Style)          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="vendor && !isLoading" class="tabs-scroll-container">
        <button
          type="button"
          class="tab-scroll-arrow-btn prev"
          (click)="scrollTabs(vendorTabsRef, -240)"
          aria-label="Scroll tabs left"
          title="Scroll Left"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <div class="module-tabs-bar" #vendorTabsRef>
          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'profile'"
            (click)="activeTab = 'profile'"
          >
            <span class="material-symbols-outlined">badge</span>
            <span>1. Profile &amp; Class</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'contact'"
            (click)="activeTab = 'contact'"
          >
            <span class="material-symbols-outlined">contacts</span>
            <span>2. Contact &amp; Location</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'tax'"
            (click)="activeTab = 'tax'"
          >
            <span class="material-symbols-outlined">receipt_long</span>
            <span>3. Tax Compliance</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'payment_terms'"
            (click)="activeTab = 'payment_terms'"
          >
            <span class="material-symbols-outlined">account_balance</span>
            <span>4. Bank &amp; Settlement</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'credit'"
            (click)="activeTab = 'credit'"
          >
            <span class="material-symbols-outlined">account_balance_wallet</span>
            <span>5. Financial Overview</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'purchases'"
            (click)="activeTab = 'purchases'"
          >
            <span class="material-symbols-outlined">shopping_cart</span>
            <span>6. Purchase History</span>
            <span class="tab-count-badge" *ngIf="vendorPurchases.length > 0">{{ vendorPurchases.length }}</span>
          </button>

          <button
            type="button"
            class="module-tab-btn"
            [class.is-active]="activeTab === 'balance'"
            (click)="activeTab = 'balance'"
          >
            <span class="material-symbols-outlined">payments</span>
            <span>7. Disbursements</span>
            <span class="tab-count-badge" *ngIf="vendorPayments.length > 0">{{ vendorPayments.length }}</span>
          </button>
        </div>

        <button
          type="button"
          class="tab-scroll-arrow-btn next"
          (click)="scrollTabs(vendorTabsRef, 240)"
          aria-label="Scroll tabs right"
          title="Scroll Right"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. TAB CONTENT PANELS                                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <main *ngIf="vendor && !isLoading" class="tab-content-wrapper">
        <!-- ── TAB 1: PROFILE & CLASSIFICATION ── -->
        <section *ngIf="activeTab === 'profile'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-primary-soft">
              <span class="material-symbols-outlined">badge</span>
            </div>
            <div>
              <h2 class="card-title">Commercial Profile &amp; Classification</h2>
              <p class="card-subtitle">Basic identity, code reference, category and preferred modes</p>
            </div>
          </div>

          <div class="meta-grid-3">
            <div class="info-block">
              <span class="info-label">Vendor Legal Name</span>
              <span class="info-value font-bold">{{ vendor.name }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Vendor Code / SKU Tag</span>
              <span class="info-value font-mono font-bold text-purple">{{ vendor.vendor_code }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Supply Categories</span>
              <span class="info-value font-semibold">{{ vendorCategories.join(", ") }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Operating Status</span>
              <span class="status-pill" [ngClass]="getStatusBadgeClass(vendor.status)">{{ vendor.status }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Preferred Payment Mode</span>
              <span class="info-value font-semibold">{{ formatPaymentMethod(vendor.preferred_payment_method) }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Agreed Payment Terms</span>
              <span class="info-value font-semibold">{{ formatPaymentTerms(vendor.payment_terms) }}</span>
            </div>
          </div>

          <div *ngIf="vendor.notes" class="notes-box mt-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-purple">notes</span>
              <span class="font-bold text-xs uppercase tracking-wide">Procurement Guidelines &amp; Notes</span>
            </div>
            <p class="notes-text">{{ vendor.notes }}</p>
          </div>
        </section>

        <!-- ── TAB 2: CONTACT & LOCATION ── -->
        <section *ngIf="activeTab === 'contact'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-emerald-soft">
              <span class="material-symbols-outlined">contacts</span>
            </div>
            <div>
              <h2 class="card-title">Contact Information &amp; Warehouse Location</h2>
              <p class="card-subtitle">Key account executive, direct phones, and delivery address</p>
            </div>
          </div>

          <div class="meta-grid-3">
            <div class="info-block">
              <span class="info-label">Contact Person</span>
              <span class="info-value font-bold">{{ vendor.contact_person || 'Not Assigned' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Direct Phone</span>
              <a *ngIf="vendor.phone" [href]="'tel:' + vendor.phone" class="info-link">
                <span class="material-symbols-outlined text-sm">call</span>
                <span>{{ vendor.phone }}</span>
              </a>
              <span *ngIf="!vendor.phone" class="info-value text-muted">N/A</span>
            </div>
            <div class="info-block">
              <span class="info-label">Official Email</span>
              <a *ngIf="vendor.email" [href]="'mailto:' + vendor.email" class="info-link">
                <span class="material-symbols-outlined text-sm">mail</span>
                <span>{{ vendor.email }}</span>
              </a>
              <span *ngIf="!vendor.email" class="info-value text-muted">N/A</span>
            </div>
            <div class="info-block">
              <span class="info-label">Website / Supplier Portal</span>
              <a *ngIf="vendor.website" [href]="vendor.website" target="_blank" rel="noopener" class="info-link">
                <span class="material-symbols-outlined text-sm">language</span>
                <span>{{ vendor.website }}</span>
              </a>
              <span *ngIf="!vendor.website" class="info-value text-muted">N/A</span>
            </div>
            <div class="info-block">
              <span class="info-label">City / Municipality</span>
              <span class="info-value">{{ vendor.city || 'N/A' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">State / Province</span>
              <span class="info-value">{{ vendor.state || 'N/A' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Postal / Zip Code</span>
              <span class="info-value font-mono">{{ vendor.postal_code || 'N/A' }}</span>
            </div>
            <div class="info-block span-2">
              <span class="info-label">Warehouse / Street Delivery Address</span>
              <span class="info-value font-medium">{{ vendor.address || 'Address not registered' }}</span>
            </div>
          </div>
        </section>

        <!-- ── TAB 3: TAX COMPLIANCE ── -->
        <section *ngIf="activeTab === 'tax'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-amber-soft">
              <span class="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h2 class="card-title">Tax Identification &amp; Statutory Compliance</h2>
              <p class="card-subtitle">Official tax registration and compliance numbers</p>
            </div>
          </div>

          <div class="meta-grid-2">
            <div class="info-block">
              <span class="info-label">GSTIN / VAT Number</span>
              <span class="info-value font-mono text-base font-bold">{{ vendor.tax_id || 'Not Registered' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">PAN Number / Tax ID</span>
              <span class="info-value font-mono text-base font-bold">{{ vendor.pan_number || 'Not Registered' }}</span>
            </div>
          </div>
        </section>

        <!-- ── TAB 4: BANK & SETTLEMENT ── -->
        <section *ngIf="activeTab === 'payment_terms'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-blue-soft">
              <span class="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h2 class="card-title">Banking &amp; Electronic Settlement Coordinates</h2>
              <p class="card-subtitle">Direct bank transfer, IFSC codes, and instant UPI IDs</p>
            </div>
          </div>

          <div class="meta-grid-2">
            <div class="info-block">
              <span class="info-label">Beneficiary Bank Name</span>
              <span class="info-value font-bold">{{ vendor.bank_name || 'Not Provided' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Account Number / IBAN</span>
              <span class="info-value font-mono font-bold">{{ vendor.account_number || 'Not Provided' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">IFSC / Swift / Branch Code</span>
              <span class="info-value font-mono font-bold">{{ vendor.ifsc_code || 'Not Provided' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Instant UPI / QR Settlement ID</span>
              <span class="info-value font-mono font-bold text-purple">{{ vendor.upi_id || 'Not Provided' }}</span>
            </div>
          </div>
        </section>

        <!-- ── TAB 5: FINANCIAL & BALANCE OVERVIEW ── -->
        <section *ngIf="activeTab === 'credit'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-purple-soft">
              <span class="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div>
              <h2 class="card-title">Financial Summary &amp; Balance Overview</h2>
              <p class="card-subtitle">Comprehensive breakdown of total purchases, settled disbursements, and balance due</p>
            </div>
          </div>

          <div class="credit-banner">
            <div class="cb-item">
              <span class="cb-label">Total Procured Amount</span>
              <span class="cb-val text-purple">{{ totalProcuredAmount | appCurrency }}</span>
              <span class="text-xs text-muted mt-1">{{ vendorPurchases.length > 0 ? (vendorPurchases.length + ' invoices recorded') : 'Opening balance registered' }}</span>
            </div>
            <div class="cb-item">
              <span class="cb-label">Total Paid Amount</span>
              <span class="cb-val text-emerald-600">{{ totalPaidAmount | appCurrency }}</span>
              <span class="text-xs text-muted mt-1">{{ vendorPayments.length }} disbursements processed</span>
            </div>
            <div class="cb-item">
              <span class="cb-label">Outstanding Balance</span>
              <span class="cb-val" [class.text-rose-600]="vendor.outstanding_balance > 0" [class.text-emerald-600]="vendor.outstanding_balance <= 0">
                {{ (vendor.outstanding_balance || 0) | appCurrency }}
              </span>
              <span class="text-xs font-bold mt-1" [class.text-rose-600]="vendor.outstanding_balance > 0" [class.text-emerald-600]="vendor.outstanding_balance <= 0">
                {{ vendor.outstanding_balance > 0 ? 'Pending Settlement' : 'Fully Settled (Nil Due)' }}
              </span>
            </div>
          </div>

          <!-- Settlement Progress Bar -->
          <div class="mt-6">
            <div class="flex justify-between text-xs font-semibold mb-2">
              <span class="text-main">Settlement Progress</span>
              <span class="text-emerald-600 font-bold">{{ paymentSettlementPercent }}% Settled</span>
            </div>
            <div class="gauge-track-large">
              <div
                class="gauge-fill-large gauge-safe"
                [style.width.%]="paymentSettlementPercent"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted mt-2">
              <span>Paid: <strong class="text-emerald-600">{{ totalPaidAmount | appCurrency }}</strong></span>
              <span>Due: <strong [class.text-rose-600]="vendor.outstanding_balance > 0">{{ (vendor.outstanding_balance || 0) | appCurrency }}</strong></span>
              <span>Total: <strong class="text-purple">{{ totalProcuredAmount | appCurrency }}</strong></span>
            </div>
          </div>
        </section>

        <!-- ── TAB 6: PURCHASES HISTORY ── -->
        <section *ngIf="activeTab === 'purchases'" class="content-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-header-icon bg-blue-soft">
                <span class="material-symbols-outlined">shopping_cart</span>
              </div>
              <div>
                <h2 class="card-title">Purchase Invoices &amp; Orders History</h2>
                <p class="card-subtitle">All supply invoices recorded for this vendor</p>
              </div>
            </div>

            <div class="card-header-right">
              <div class="payable-pill-badge" [class.is-settled]="vendor.outstanding_balance <= 0">
                <span class="payable-pill-label">Balance Due:</span>
                <span class="payable-pill-val" [class.text-rose-600]="vendor.outstanding_balance > 0" [class.text-emerald-600]="vendor.outstanding_balance <= 0">
                  {{ (vendor.outstanding_balance || 0) | appCurrency }}
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="vendorPurchases.length === 0" class="empty-state-card">
            <span class="material-symbols-outlined">receipt_long</span>
            <p>No purchase records found for this vendor yet.</p>
          </div>

          <div *ngIf="vendorPurchases.length > 0" class="table-wrap">
            <table class="saas-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Items Summary</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of vendorPurchases">
                  <td>{{ p.order_date | date:'mediumDate' }}</td>
                  <td class="font-mono font-bold text-purple">{{ p.invoice_number }}</td>
                  <td class="text-sm max-w-xs truncate" [title]="p.items_summary">{{ p.items_summary || 'General supplies' }}</td>
                  <td class="font-bold">{{ p.total_amount | appCurrency }}</td>
                  <td class="text-emerald-600 font-semibold">{{ p.paid_amount | appCurrency }}</td>
                  <td class="font-bold" [class.text-rose-600]="p.balance_amount > 0">
                    {{ p.balance_amount | appCurrency }}
                  </td>
                  <td>
                    <span class="status-pill" [ngClass]="getPurchaseStatusBadgeClass(p.payment_status)">
                      {{ p.payment_status }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="row-actions">
                      <button
                        type="button"
                        class="action-icon-btn btn-edit"
                        (click)="openEditPurchaseModal(p)"
                        title="Edit Purchase Invoice"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        class="action-icon-btn btn-delete"
                        (click)="confirmDeletePurchase(p)"
                        title="Delete Purchase Invoice"
                      >
                        <span class="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── TAB 7: DISBURSEMENTS & PAYMENTS ── -->
        <section *ngIf="activeTab === 'balance'" class="content-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-header-icon bg-emerald-soft">
                <span class="material-symbols-outlined">payments</span>
              </div>
              <div>
                <h2 class="card-title">Disbursement &amp; Payment Receipts</h2>
                <p class="card-subtitle">All outgoing payments and settlement vouchers</p>
              </div>
            </div>

            <div class="card-header-right">
              <div class="payable-pill-badge" [class.is-settled]="vendor.outstanding_balance <= 0">
                <span class="material-symbols-outlined text-base" [class.text-rose-600]="vendor.outstanding_balance > 0" [class.text-emerald-600]="vendor.outstanding_balance <= 0">
                  {{ vendor.outstanding_balance > 0 ? 'account_balance_wallet' : 'check_circle' }}
                </span>
                <span class="payable-pill-label">Amount Payable:</span>
                <span class="payable-pill-val" [class.text-rose-600]="vendor.outstanding_balance > 0" [class.text-emerald-600]="vendor.outstanding_balance <= 0">
                  {{ (vendor.outstanding_balance || 0) | appCurrency }}
                </span>
              </div>

              <button
                type="button"
                (click)="openPaymentModal()"
                class="hero-btn btn-pay"
                title="Record Supplier Disbursement"
              >
                <span class="material-symbols-outlined">add</span>
                <span>Record Payment</span>
              </button>
            </div>
          </div>

          <div *ngIf="vendorPayments.length === 0" class="empty-state-card">
            <span class="material-symbols-outlined">account_balance_wallet</span>
            <p>No payment vouchers recorded for this vendor yet.</p>
          </div>

          <div *ngIf="vendorPayments.length > 0" class="table-wrap">
            <table class="saas-table">
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Payment #</th>
                  <th>Method</th>
                  <th>Reference / TXN #</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pm of vendorPayments">
                  <td>{{ pm.payment_date | date:'mediumDate' }}</td>
                  <td class="font-mono font-bold text-purple">{{ pm.payment_number }}</td>
                  <td>
                    <span class="mode-pill">{{ formatPaymentMethod(pm.payment_method) }}</span>
                  </td>
                  <td class="font-mono">{{ pm.reference_number || 'N/A' }}</td>
                  <td class="font-bold text-emerald-600">{{ pm.amount | appCurrency }}</td>
                  <td class="text-xs text-muted">{{ pm.notes || 'Direct disbursement' }}</td>
                  <td class="text-right">
                    <div class="row-actions">
                      <button
                        type="button"
                        class="action-icon-btn btn-edit"
                        (click)="openEditPaymentModal(pm)"
                        title="Edit Disbursement"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        class="action-icon-btn btn-delete"
                        (click)="confirmDeletePayment(pm)"
                        title="Delete Disbursement"
                      >
                        <span class="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. MODALS                                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- Purchase Modal -->
      <div *ngIf="isPurchaseModalOpen && vendor" class="modal-backdrop" (click)="closePurchaseModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ editingPurchaseId ? 'Edit Purchase Invoice' : 'Record Purchase Invoice' }}</h3>
              <p class="modal-subtitle">{{ vendor.name }} ({{ vendor.vendor_code }})</p>
            </div>
            <button type="button" (click)="closePurchaseModal()" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="savePurchase()" class="modal-body space-y-4">
            <div class="form-group">
              <label class="form-label">Invoice / Bill Number *</label>
              <input
                type="text"
                [(ngModel)]="purchaseForm.invoice_number"
                name="invoice_number"
                required
                placeholder="Enter invoice / bill number (e.g. INV-2026-001)"
                class="form-control font-mono"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Invoice Date *</label>
                <app-date-picker
                  [(ngModel)]="purchaseForm.order_date"
                  name="order_date"
                  label="Invoice Date"
                  placeholder="Select invoice date"
                  minWidth="100%"
                ></app-date-picker>
              </div>
              <div class="form-group">
                <label class="form-label">Payment Due Date</label>
                <app-date-picker
                  [(ngModel)]="purchaseForm.due_date"
                  name="due_date"
                  label="Payment Due Date"
                  placeholder="Select due date"
                  minWidth="100%"
                ></app-date-picker>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Total Bill Amount ({{ defaultCurrency }}) *</label>
                <input type="number" step="0.01" min="0.01" [(ngModel)]="purchaseForm.total_amount" name="total_amount" required placeholder="0.00" class="form-control font-bold" />
              </div>
              <div class="form-group">
                <label class="form-label">Immediate Paid Amount</label>
                <input type="number" step="0.01" min="0" [(ngModel)]="purchaseForm.paid_amount" name="paid_amount" placeholder="0.00" class="form-control" />
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

            <div class="modal-footer">
              <button type="button" (click)="closePurchaseModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">{{ editingPurchaseId ? 'save' : 'receipt_long' }}</span>
                <span>{{ isSubmitting ? (editingPurchaseId ? 'Saving…' : 'Recording…') : (editingPurchaseId ? 'Update Purchase' : 'Record Purchase') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Payment Modal -->
      <div *ngIf="isPaymentModalOpen && vendor" class="modal-backdrop" (click)="closePaymentModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ editingPaymentId ? 'Edit Supplier Disbursement' : 'Record Supplier Disbursement' }}</h3>
              <p class="modal-subtitle">Payable balance: {{ vendor.outstanding_balance | appCurrency }}</p>
            </div>
            <button type="button" (click)="closePaymentModal()" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="savePayment()" class="modal-body space-y-4">
            <div class="form-group">
              <label class="form-label">Disbursement Amount ({{ defaultCurrency }}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                [(ngModel)]="paymentForm.amount"
                name="amount"
                required
                class="form-control text-lg font-bold text-emerald-600"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Payment Date *</label>
                <app-date-picker
                  [(ngModel)]="paymentForm.payment_date"
                  name="payment_date"
                  label="Payment Date"
                  placeholder="Select payment date"
                  minWidth="100%"
                ></app-date-picker>
              </div>
              <div class="form-group">
                <label class="form-label">Payment Method *</label>
                <app-custom-dropdown
                  [options]="modalPaymentMethodOptions"
                  [(ngModel)]="paymentForm.payment_method"
                  name="payment_method"
                  placeholder="Select payment method"
                  minWidth="100%"
                ></app-custom-dropdown>
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

            <div class="modal-footer">
              <button type="button" (click)="closePaymentModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">{{ editingPaymentId ? 'save' : 'payments' }}</span>
                <span>{{ isSubmitting ? (editingPaymentId ? 'Saving…' : 'Processing…') : (editingPaymentId ? 'Update Disbursement' : 'Record Disbursement') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Purchase Confirmation Modal -->
      <div *ngIf="isDeletePurchaseConfirmOpen && purchaseToDelete" class="modal-backdrop" (click)="closeDeletePurchaseModal()">
        <div class="modal-panel delete-confirm-panel" (click)="$event.stopPropagation()">
          <div class="modal-body p-6 text-center">
            <div class="confirm-icon-bubble">
              <span class="material-symbols-outlined">delete_forever</span>
            </div>
            <h3 class="confirm-title">Delete Purchase Invoice?</h3>
            <p class="confirm-desc">
              Are you sure you want to delete invoice <strong class="font-mono text-purple">{{ purchaseToDelete.invoice_number }}</strong> ({{ purchaseToDelete.total_amount | appCurrency }})? 
              This will deduct the unpaid balance from the vendor's outstanding ledger.
            </p>
            <div class="confirm-footer">
              <button type="button" (click)="closeDeletePurchaseModal()" class="action-btn btn-outline">Cancel</button>
              <button type="button" [disabled]="isSubmitting" (click)="executeDeletePurchase()" class="action-btn btn-danger">
                <span class="material-symbols-outlined">delete</span>
                <span>{{ isSubmitting ? 'Deleting…' : 'Yes, Delete Invoice' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Payment Confirmation Modal -->
      <div *ngIf="isDeletePaymentConfirmOpen && paymentToDelete" class="modal-backdrop" (click)="closeDeletePaymentModal()">
        <div class="modal-panel delete-confirm-panel" (click)="$event.stopPropagation()">
          <div class="modal-body p-6 text-center">
            <div class="confirm-icon-bubble">
              <span class="material-symbols-outlined">delete_forever</span>
            </div>
            <h3 class="confirm-title">Delete Payment Voucher?</h3>
            <p class="confirm-desc">
              Are you sure you want to delete payment receipt <strong class="font-mono text-purple">{{ paymentToDelete.payment_number }}</strong> ({{ paymentToDelete.amount | appCurrency }})? 
              The disbursed amount will be restored back to the vendor's outstanding payable balance.
            </p>
            <div class="confirm-footer">
              <button type="button" (click)="closeDeletePaymentModal()" class="action-btn btn-outline">Cancel</button>
              <button type="button" [disabled]="isSubmitting" (click)="executeDeletePayment()" class="action-btn btn-danger">
                <span class="material-symbols-outlined">delete</span>
                <span>{{ isSubmitting ? 'Deleting…' : 'Yes, Delete Payment' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg-app, #FAF5FF);
      }

      .vendor-detail-page {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      }

      /* ── BREADCRUMBS ────────────────────────────────────────── */
      .breadcrumb-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-muted, #64748B);
        font-weight: 500;
      }
      .breadcrumb-sep { color: var(--text-muted, #94A3B8); }
      .breadcrumb-link {
        color: var(--primary, #7E22CE);
        text-decoration: none;
        font-weight: 600;
      }
      .breadcrumb-link:hover { text-decoration: underline; }
      .breadcrumb-current { color: var(--text-main, #0F172A); font-weight: 700; }

      /* ── HERO HEADER CARD ──────────────────────────────────── */
      .hero-header-card {
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 1.25rem;
        padding: 1.25rem 1.75rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        box-shadow: 0 4px 20px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
      }

      .hero-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex: 1;
        min-width: 0;
      }

      .back-btn {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.875rem;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        color: var(--text-main, #0F172A);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .back-btn:hover {
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
        border-color: var(--primary, #7E22CE);
        transform: translateX(-2px);
      }

      .hero-avatar {
        width: 4rem;
        height: 4rem;
        border-radius: 1.125rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        box-shadow: 0 4px 14px -2px rgba(var(--primary-rgb, 126, 34, 206), 0.35);
      }
      .hero-avatar .material-symbols-outlined { font-size: 2rem; }
      .hero-avatar.has-img {
        background: transparent;
        border: 2px solid var(--card-border, #E9D5FF);
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .hero-identity {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        min-width: 0;
      }

      .hero-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .hero-title {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .vendor-code-tag {
        font-family: ui-monospace, monospace;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.1);
        padding: 0.2rem 0.5rem;
        border-radius: 0.5rem;
      }
      .category-pill {
        /* Several categories per vendor now — keep them apart when they wrap. */
        margin-right: 0.375rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-muted, #64748B);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
      }

      .hero-meta-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.8125rem;
        color: var(--text-muted, #64748B);
        flex-wrap: wrap;
      }
      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .meta-icon { font-size: 16px; }
      .meta-dot { color: var(--text-muted, #CBD5E1); }

      .hero-actions {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .hero-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.6rem 1.15rem;
        border-radius: 0.875rem;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      .hero-btn:hover { transform: translateY(-1px); }
      .btn-primary {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        border: none;
        box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.3));
      }
      .btn-purchase {
        background: rgba(99, 102, 241, 0.12);
        color: #4F46E5;
        border: 1px solid rgba(99, 102, 241, 0.25);
      }
      .btn-pay {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
        border: 1px solid rgba(16, 185, 129, 0.25);
      }
      .btn-outline {
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--text-main, #0F172A);
      }

      /* ── KPI GRID ──────────────────────────────────────────── */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.875rem;
        width: 100%;
      }
      @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }

      .kpi-card {
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 1rem;
        padding: 0.875rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }
      .card-accent-purple { border-left: 4px solid var(--primary, #7E22CE); }
      .card-accent-rose { border-left: 4px solid var(--danger, #EF4444); }
      .card-accent-green { border-left: 4px solid #10B981; }
      .card-accent-blue { border-left: 4px solid #3B82F6; }
      .card-accent-amber { border-left: 4px solid #F59E0B; }
      .card-accent-teal { border-left: 4px solid #0D9488; }

      .kpi-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .kpi-title {
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #64748B);
      }
      .kpi-icon-bubble {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kpi-icon-bubble .material-symbols-outlined { font-size: 1rem; }
      .bg-purple-tint { background: rgba(var(--primary-rgb, 126, 34, 206), 0.12); color: var(--primary, #7E22CE); }
      .bg-rose-tint { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
      .bg-green-tint { background: rgba(16, 185, 129, 0.12); color: #10B981; }
      .bg-blue-tint { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }
      .bg-amber-tint { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
      .bg-teal-tint { background: rgba(13, 148, 136, 0.12); color: #0D9488; }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .kpi-number {
        font-family: ui-monospace, monospace;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
      }
      .kpi-pill {
        font-size: 0.625rem;
        font-weight: 800;
        padding: 0.15rem 0.45rem;
        border-radius: 999px;
        text-transform: uppercase;
      }
      .pill-purple { background: rgba(var(--primary-rgb, 126, 34, 206), 0.1); color: var(--primary, #7E22CE); }
      .pill-rose { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
      .pill-success { background: rgba(16, 185, 129, 0.1); color: #10B981; }
      .pill-blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
      .pill-amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
      .pill-teal { background: rgba(13, 148, 136, 0.1); color: #0D9488; }

      /* ── TABS SCROLL CONTAINER & ARROW BUTTONS ─────────────── */
      .tabs-scroll-container {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        gap: 0.5rem;
      }
      .tab-scroll-arrow-btn {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        flex-shrink: 0;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 0;
        z-index: 5;
        user-select: none;
        outline: none;
      }
      .tab-scroll-arrow-btn:hover {
        background: var(--bg-app, #FAF5FF);
        border-color: var(--primary, #7E22CE);
        color: var(--primary, #7E22CE);
        transform: scale(1.08);
        box-shadow: 0 4px 12px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
      }
      .tab-scroll-arrow-btn:active {
        transform: scale(0.92);
      }
      .tab-scroll-arrow-btn .material-symbols-outlined {
        font-size: 20px;
      }
      .tabs-scroll-container .module-tabs-bar {
        flex: 1;
        overflow-x: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 0.35rem 0.25rem 0.5rem 0.25rem;
        margin: 0;
      }
      .tabs-scroll-container .module-tabs-bar::-webkit-scrollbar {
        display: none;
      }

      /* ── CONTENT PANELS ────────────────────────────────────── */
      .content-card {
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 1.25rem;
        padding: 1.75rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--card-border, #F1F5F9);
        flex-wrap: wrap;
      }
      .card-header-left {
        display: flex;
        align-items: center;
        gap: 0.875rem;
      }
      .card-header-right {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        flex-wrap: wrap;
      }
      .payable-pill-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 0.875rem;
        border-radius: 0.75rem;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.25);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
      }
      .payable-pill-badge.is-settled {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.25);
      }
      .payable-pill-label {
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--text-muted, #64748B);
        letter-spacing: 0.04em;
      }
      .payable-pill-val {
        font-family: ui-monospace, monospace;
        font-weight: 800;
        font-size: 0.9375rem;
      }
      .card-header-icon {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
      }
      .bg-primary-soft { background: rgba(var(--primary-rgb, 126, 34, 206), 0.12); color: var(--primary, #7E22CE); }
      .bg-emerald-soft { background: rgba(16, 185, 129, 0.12); color: #10B981; }
      .bg-amber-soft { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
      .bg-blue-soft { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }

      .card-title {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
      }
      .card-subtitle {
        font-size: 0.75rem;
        color: var(--text-muted, #64748B);
        margin: 0.2rem 0 0;
      }

      .meta-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
      }
      .meta-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
      }
      .meta-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
      @media (max-width: 1024px) {
        .meta-grid-4 { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 800px) {
        .meta-grid-4, .meta-grid-3, .meta-grid-2 { grid-template-columns: 1fr; }
      }

      .audit-action-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }
      .badge-purple { background: rgba(126, 34, 206, 0.12); color: #7E22CE; }
      .badge-green { background: rgba(16, 185, 129, 0.12); color: #10B981; }
      .badge-danger { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
      .badge-amber { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
      .badge-blue { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }
      .badge-neutral { background: rgba(100, 116, 139, 0.12); color: #64748B; }

      .operator-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .user-avatar-tiny {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(var(--primary-rgb, 126, 34, 206), 0.18) 0%, rgba(var(--primary-rgb, 126, 34, 206), 0.3) 100%);
        color: var(--primary, #7E22CE);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6875rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .audit-details-cell {
        color: var(--text-main, #334155);
        font-weight: 500;
        line-height: 1.4;
      }

      .info-block {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.875rem 1rem;
        border-radius: 0.875rem;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #F1F5F9);
      }
      .info-block.span-2 { grid-column: span 2; }
      @media (max-width: 800px) { .info-block.span-2 { grid-column: span 1; } }

      .info-label {
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #64748B);
      }
      .info-value {
        font-size: 0.9375rem;
        color: var(--text-main, #0F172A);
      }
      .info-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        text-decoration: none;
      }
      .info-link:hover { text-decoration: underline; }

      .notes-box {
        padding: 1rem 1.25rem;
        border-radius: 0.875rem;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .notes-text {
        font-size: 0.8125rem;
        line-height: 1.5;
        color: var(--text-main, #334155);
        margin: 0;
      }

      /* Credit Banner */
      .credit-banner {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 1rem;
        padding: 1.25rem;
      }
      @media (max-width: 640px) { .credit-banner { grid-template-columns: 1fr; } }
      .cb-item { display: flex; flex-direction: column; }
      .cb-label {
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--text-muted, #64748B);
      }
      .cb-val {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin-top: 0.25rem;
      }

      .gauge-track-large {
        width: 100%;
        height: 12px;
        background: var(--card-border, #E2E8F0);
        border-radius: 999px;
        overflow: hidden;
      }
      .gauge-fill-large {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .gauge-safe { background: #10B981; }
      .gauge-warning { background: #F59E0B; }
      .gauge-danger { background: #EF4444; }

      .no-limit-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 1rem;
        background: rgba(16, 185, 129, 0.08);
        border: 1.5px dashed rgba(16, 185, 129, 0.3);
      }

      /* Rating Dashboard */
      .rating-dashboard-grid {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1.5rem;
        align-items: center;
      }
      @media (max-width: 640px) { .rating-dashboard-grid { grid-template-columns: 1fr; } }
      .rating-overall-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .rating-big-num {
        font-size: 3rem;
        font-weight: 900;
        color: #F59E0B;
        line-height: 1;
      }
      .stars-row { display: flex; align-items: center; gap: 0.2rem; margin-top: 0.35rem; }

      .rating-metric-bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .metric-bar-group { display: flex; flex-direction: column; gap: 0.375rem; }
      .metric-bar-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-main, #334155);
      }
      .pm-bar {
        width: 100%;
        height: 8px;
        border-radius: 999px;
        background: var(--card-border, #E2E8F0);
        overflow: hidden;
      }
      .pm-fill { height: 100%; border-radius: 999px; }
      .bg-purple { background: var(--primary, #7E22CE); }
      .bg-emerald { background: #10B981; }
      .bg-blue { background: #3B82F6; }

      /* Table Wrapper */
      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 1rem;
      }
      .saas-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        text-align: left;
      }
      .saas-table th {
        background: var(--bg-app, #FAF5FF);
        color: var(--text-muted, #64748B);
        padding: 0.875rem 1rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.6875rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .saas-table td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid var(--card-border, #F1F5F9);
        color: var(--text-main, #334155);
      }
      .text-right {
        text-align: right;
      }

      /* Row Action Buttons */
      .row-actions {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.375rem;
      }
      .action-icon-btn {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 0;
      }
      .action-icon-btn .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .btn-edit {
        color: #6366F1;
        border-color: rgba(99, 102, 241, 0.25);
        background: rgba(99, 102, 241, 0.06);
      }
      .btn-edit:hover {
        background: #6366F1;
        color: #FFFFFF;
        border-color: #6366F1;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
      }
      .btn-delete {
        color: #EF4444;
        border-color: rgba(239, 68, 68, 0.25);
        background: rgba(239, 68, 68, 0.06);
      }
      .btn-delete:hover {
        background: #EF4444;
        color: #FFFFFF;
        border-color: #EF4444;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
      }

      .empty-state-card {
        padding: 3rem 1.5rem;
        text-align: center;
        color: var(--text-muted, #94A3B8);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      .empty-state-card .material-symbols-outlined { font-size: 2.5rem; opacity: 0.5; }

      /* ── STATUS PILLS ──────────────────────────────────────── */
      .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.625rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .status-active, .badge-active { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      .status-inactive, .badge-inactive { background: rgba(100, 116, 139, 0.15); color: #64748B; }
      .status-blocked, .badge-blocked { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
      .status-review { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      .badge-paid { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      .badge-partial { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      .badge-unpaid { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

      .mode-pill {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 0.5rem;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
      }

      /* ── MODALS ────────────────────────────────────────────── */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .modal-panel {
        width: 100%;
        max-width: 600px;
        background: var(--card-bg, #FFFFFF);
        border-radius: 1.25rem;
        border: 1px solid var(--card-border, #E9D5FF);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: scaleUp 0.2s ease-out;
      }
      @keyframes scaleUp {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        background: var(--bg-app, #FAF5FF);
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .modal-title {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
      }
      .modal-subtitle {
        font-size: 0.75rem;
        color: var(--text-muted, #64748B);
        margin: 0.2rem 0 0;
      }
      .close-btn {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
        color: var(--text-muted, #64748B);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-body { padding: 1.5rem; }
      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid var(--card-border, #F1F5F9);
      }

      /* Delete Confirmation Modal Styles */
      .delete-confirm-panel {
        max-width: 460px;
        border-radius: 1.25rem;
      }
      .confirm-icon-bubble {
        width: 3.75rem;
        height: 3.75rem;
        border-radius: 1.125rem;
        background: rgba(239, 68, 68, 0.12);
        color: #EF4444;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0.5rem auto 1.25rem;
      }
      .confirm-icon-bubble .material-symbols-outlined {
        font-size: 2rem;
      }
      .confirm-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        text-align: center;
        margin: 0 0 0.5rem;
      }
      .confirm-desc {
        font-size: 0.8125rem;
        color: var(--text-muted, #64748B);
        text-align: center;
        line-height: 1.55;
        margin: 0 0 1.5rem;
      }
      .confirm-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
      }
      .btn-danger {
        background: #EF4444;
        color: #FFFFFF;
        border: none;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
      }
      .btn-danger:hover {
        background: #DC2626;
      }

      .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
      .form-label { font-size: 0.8125rem; font-weight: 700; color: var(--text-main, #334155); }
      .form-control {
        width: 100%;
        height: 2.625rem;
        padding: 0 0.875rem;
        border-radius: 0.75rem;
        border: 1px solid var(--card-border, #E2E8F0);
        background: var(--card-bg, #FFFFFF);
        color: var(--text-main, #0F172A);
        font-size: 0.875rem;
        outline: none;
      }
      .form-control:focus {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 126, 34, 206), 0.15);
      }
      textarea.form-control { height: auto; padding: 0.75rem 0.875rem; }
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.55rem 1.15rem;
        border-radius: 0.75rem;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
    `,
  ],
})
export class VendorDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vendorService = inject(VendorService);
  private notify = inject(NotificationService);
  public settingsService = inject(SettingsService);
  public authService = inject(AuthService);

  public vendorId: number | null = null;
  public vendor: Vendor | null = null;

  /**
   * Every category this vendor supplies. Falls back to the single `category`
   * field for vendors saved before multi-category, so nothing shows blank.
   */
  public get vendorCategories(): string[] {
    const list = this.vendor?.categories?.filter((c) => !!c && String(c).trim().length > 0);
    if (list && list.length) return list;
    return this.vendor?.category ? [this.vendor.category] : [];
  }
  public isLoading = true;
  public loadError: string | null = null;
  public isSubmitting = false;

  public activeTab: ActiveTab = 'profile';
  public vendorPurchases: VendorPurchase[] = [];
  public vendorPayments: VendorPayment[] = [];
  public vendorAuditLogs: any[] = [];

  // Modals & Edit States
  public isPurchaseModalOpen = false;
  public editingPurchaseId: number | null = null;
  public isDeletePurchaseConfirmOpen = false;
  public purchaseToDelete: VendorPurchase | null = null;

  public isPaymentModalOpen = false;
  public editingPaymentId: number | null = null;
  public isDeletePaymentConfirmOpen = false;
  public paymentToDelete: VendorPayment | null = null;

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

  public modalPaymentMethodOptions: DropdownOption[] = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/Wire)', icon: 'account_balance', description: 'Direct bank settlement' },
    { value: 'UPI', label: 'UPI / Instant Online', icon: 'qr_code', description: 'Instant UPI or QR settlement' },
    { value: 'CHEQUE', label: 'Cheque / Demand Draft', icon: 'fact_check', description: 'Current or post-dated cheque' },
    { value: 'CASH', label: 'Cash Voucher', icon: 'attach_money', description: 'Cash register disbursement' },
  ];

  public get defaultCurrency(): string {
    return this.settingsService.currencySymbol() || '₹';
  }

  public get hasNoLimit(): boolean {
    return !this.vendor?.credit_limit || this.vendor.credit_limit <= 0;
  }

  public get totalPaidAmount(): number {
    if (this.vendorPayments && this.vendorPayments.length > 0) {
      return this.vendorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }
    const total = Number(this.vendor?.total_purchases_amount) || 0;
    const balance = Number(this.vendor?.outstanding_balance) || 0;
    return Math.max(0, total - balance);
  }

  public get totalProcuredAmount(): number {
    const invoiceTotal = Number(this.vendor?.total_purchases_amount) || 0;
    const currentBalance = Number(this.vendor?.outstanding_balance) || 0;
    const paidTotal = this.totalPaidAmount;
    // Total financial obligation: opening/initial amount not on invoice + total invoices = paid + currentBalance
    return Math.max(invoiceTotal, paidTotal + currentBalance);
  }

  public get paymentSettlementPercent(): number {
    const total = this.totalProcuredAmount;
    if (total <= 0) {
      return (Number(this.vendor?.outstanding_balance) || 0) <= 0 ? 100 : 0;
    }
    const paid = this.totalPaidAmount;
    return Math.min(100, Math.max(0, Math.round((paid / total) * 100)));
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vendorId = parseInt(idParam, 10);
      this.loadVendor();
    } else {
      this.router.navigate(['/vendors']);
    }
  }

  public loadVendor(): void {
    if (!this.vendorId) return;
    this.isLoading = true;
    this.loadError = null;

    this.vendorService.getVendorById(this.vendorId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.vendor = res.data;
          if ((res.data as any).audit_logs) {
            this.vendorAuditLogs = (res.data as any).audit_logs;
          }
          this.loadSubCollections();
        } else {
          this.loadError = 'Vendor record not found';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Failed to load vendor profile';
      },
    });
  }

  public loadSubCollections(): void {
    if (!this.vendorId) return;

    this.vendorService.getPurchases(this.vendorId).subscribe({
      next: (res) => {
        if (res.success) this.vendorPurchases = res.data || [];
      },
    });

    this.vendorService.getPayments(this.vendorId).subscribe({
      next: (res) => {
        if (res.success) this.vendorPayments = res.data || [];
      },
    });

    this.vendorService.getAuditLogs(this.vendorId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.vendorAuditLogs = res.data;
      },
    });
  }

  public get allAuditLogs(): any[] {
    const logs = [...this.vendorAuditLogs];
    
    // Synthesize baseline logs if backend table has fewer items
    if (this.vendor) {
      const hasCreate = logs.some(l => l.action === 'VENDOR_CREATED');
      if (!hasCreate && this.vendor.created_at) {
        logs.push({
          action: 'VENDOR_CREATED',
          created_at: this.vendor.created_at,
          user_name: 'Admin',
          ip_address: '127.0.0.1',
          new_values: { name: this.vendor.name, vendor_code: this.vendor.vendor_code, initial_balance: this.vendor.outstanding_balance }
        });
      }

      for (const p of this.vendorPurchases) {
        const hasP = logs.some(l => l.action.includes('PURCHASE') && (l.new_values?.invoice_number === p.invoice_number || l.old_values?.invoice_number === p.invoice_number));
        if (!hasP) {
          logs.push({
            action: 'VENDOR_PURCHASE_RECORDED',
            created_at: p.created_at || p.order_date,
            user_name: 'Procurement',
            ip_address: '127.0.0.1',
            new_values: { invoice_number: p.invoice_number, total_amount: p.total_amount, paid_amount: p.paid_amount }
          });
        }
      }

      for (const pm of this.vendorPayments) {
        const hasPm = logs.some(l => l.action.includes('PAYMENT') && (l.new_values?.payment_number === pm.payment_number || l.old_values?.payment_number === pm.payment_number));
        if (!hasPm) {
          logs.push({
            action: 'VENDOR_PAYMENT_RECORDED',
            created_at: pm.created_at || pm.payment_date,
            user_name: 'Finance',
            ip_address: '127.0.0.1',
            new_values: { payment_number: pm.payment_number, amount: pm.amount, method: pm.payment_method }
          });
        }
      }
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return logs;
  }

  public getAuditActionBadgeClass(action?: string): string {
    if (!action) return 'badge-neutral';
    if (action.includes('CREATED')) return 'badge-purple';
    if (action.includes('PURCHASE')) return 'badge-blue';
    if (action.includes('PAYMENT')) return 'badge-green';
    if (action.includes('DELETED')) return 'badge-danger';
    if (action.includes('UPDATED')) return 'badge-amber';
    return 'badge-blue';
  }

  public getAuditActionIcon(action?: string): string {
    if (!action) return 'info';
    if (action.includes('PAYMENT')) return 'payments';
    if (action.includes('PURCHASE')) return 'receipt_long';
    if (action.includes('CREATED')) return 'add_circle';
    if (action.includes('DELETED')) return 'delete';
    if (action.includes('UPDATED')) return 'edit_note';
    return 'history';
  }

  public formatAuditAction(action?: string): string {
    if (!action) return 'Activity Event';
    switch (action) {
      case 'VENDOR_CREATED': return 'Vendor Profile Created';
      case 'VENDOR_UPDATED': return 'Profile Updated';
      case 'VENDOR_DELETED': return 'Vendor Deleted';
      case 'VENDOR_PURCHASE_RECORDED': return 'Purchase Bill Recorded';
      case 'VENDOR_PURCHASE_UPDATED': return 'Purchase Bill Updated';
      case 'VENDOR_PURCHASE_DELETED': return 'Purchase Bill Deleted';
      case 'VENDOR_PAYMENT_RECORDED': return 'Disbursement Paid';
      case 'VENDOR_PAYMENT_UPDATED': return 'Disbursement Updated';
      case 'VENDOR_PAYMENT_DELETED': return 'Disbursement Deleted';
      default: return action.replace(/_/g, ' ');
    }
  }

  public formatAuditDetails(log: any): string {
    if (!log) return '';
    const nv = log.new_values;
    const ov = log.old_values;
    if (log.action === 'VENDOR_CREATED') {
      return `Created supplier record "${nv?.name || this.vendor?.name}" (${nv?.vendor_code || this.vendor?.vendor_code})`;
    }
    if (log.action === 'VENDOR_PURCHASE_RECORDED') {
      return `Recorded purchase invoice #${nv?.invoice_number || ''} for ${this.settingsService.currencySymbol() || '₹'}${Number(nv?.total_amount || 0).toFixed(2)}`;
    }
    if (log.action === 'VENDOR_PURCHASE_UPDATED') {
      return `Updated invoice #${nv?.invoice_number || ''} (Amount: ${this.settingsService.currencySymbol() || '₹'}${Number(nv?.total_amount || 0).toFixed(2)})`;
    }
    if (log.action === 'VENDOR_PURCHASE_DELETED') {
      return `Deleted purchase bill #${ov?.invoice_number || ''} (${this.settingsService.currencySymbol() || '₹'}${Number(ov?.total_amount || 0).toFixed(2)})`;
    }
    if (log.action === 'VENDOR_PAYMENT_RECORDED') {
      return `Disbursed settlement payment #${nv?.payment_number || ''} of ${this.settingsService.currencySymbol() || '₹'}${Number(nv?.amount || 0).toFixed(2)} via ${nv?.method || nv?.payment_method || 'Bank'}`;
    }
    if (log.action === 'VENDOR_PAYMENT_UPDATED') {
      return `Updated disbursement #${nv?.payment_number || ''} (Amount: ${this.settingsService.currencySymbol() || '₹'}${Number(nv?.amount || 0).toFixed(2)})`;
    }
    if (log.action === 'VENDOR_PAYMENT_DELETED') {
      return `Cancelled/deleted disbursement #${ov?.payment_number || ''} (${this.settingsService.currencySymbol() || '₹'}${Number(ov?.amount || 0).toFixed(2)})`;
    }
    if (log.action === 'VENDOR_UPDATED') {
      const keys = Object.keys(nv || {});
      return keys.length > 0 ? `Updated fields: ${keys.slice(0, 4).join(', ')}` : 'Vendor profile coordinates updated';
    }
    return nv ? JSON.stringify(nv) : 'System event logged';
  }

  public goBack(): void {
    this.router.navigate(['/vendors']);
  }

  public getCreditUtilizationPercent(): number {
    if (!this.vendor?.credit_limit || this.vendor.credit_limit <= 0) return 0;
    const pct = Math.round(((this.vendor.outstanding_balance || 0) / this.vendor.credit_limit) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  public getUtilizationClass(): string {
    const pct = this.getCreditUtilizationPercent();
    if (pct >= 90) return 'gauge-danger';
    if (pct >= 70) return 'gauge-warning';
    return 'gauge-safe';
  }

  public getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'BLOCKED': return 'status-blocked';
      case 'UNDER_REVIEW': return 'status-review';
      default: return 'status-active';
    }
  }

  public getPurchaseStatusBadgeClass(status: string): string {
    if (status === 'PAID') return 'badge-paid';
    if (status === 'PARTIAL') return 'badge-partial';
    return 'badge-unpaid';
  }

  public formatPaymentTerms(terms?: string): string {
    if (!terms) return 'Net 30 Days';
    if (terms === 'PAY_ANYTIME') return 'Pay Anytime (Flexible)';
    if (terms === 'DUE_ON_RECEIPT') return 'Due on Receipt';
    return terms.replace(/_/g, ' ');
  }

  public formatPaymentMethod(method?: string): string {
    if (!method) return 'Bank Transfer';
    if (method === 'PAY_LATER') return 'Pay Later';
    return method.replace(/_/g, ' ');
  }

  public getStarsArray(rating: number = 5): number[] {
    const count = Math.min(5, Math.max(1, Math.round(rating)));
    return Array(count).fill(0);
  }

  // Purchase Modal & CRUD Operations
  public openPurchaseModal(): void {
    this.editingPurchaseId = null;
    this.purchaseForm = {
      invoice_number: '',
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
      total_amount: null as any,
      paid_amount: null as any,
      items_summary: '',
      notes: '',
    };
    this.isPurchaseModalOpen = true;
  }

  public openEditPurchaseModal(p: VendorPurchase): void {
    this.editingPurchaseId = p.id;
    let orderDate = '';
    if (p.order_date) {
      orderDate = typeof p.order_date === 'string' ? p.order_date.split('T')[0] : new Date(p.order_date).toISOString().split('T')[0];
    }
    let dueDate = '';
    if (p.due_date) {
      dueDate = typeof p.due_date === 'string' ? p.due_date.split('T')[0] : new Date(p.due_date).toISOString().split('T')[0];
    }

    this.purchaseForm = {
      invoice_number: p.invoice_number,
      order_date: orderDate,
      due_date: dueDate,
      total_amount: Number(p.total_amount) || 0,
      paid_amount: Number(p.paid_amount) || 0,
      items_summary: p.items_summary || '',
      notes: p.notes || '',
    };
    this.isPurchaseModalOpen = true;
  }

  public closePurchaseModal(): void {
    this.isPurchaseModalOpen = false;
    this.editingPurchaseId = null;
  }

  public savePurchase(): void {
    if (!this.vendor || !this.purchaseForm.invoice_number || this.purchaseForm.total_amount <= 0) {
      this.notify.warning('Please enter valid invoice number and amount');
      return;
    }
    this.isSubmitting = true;

    if (this.editingPurchaseId) {
      this.vendorService.updatePurchase(this.vendor.id, this.editingPurchaseId, this.purchaseForm).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notify.success('Purchase invoice updated successfully');
          this.closePurchaseModal();
          this.loadVendor();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to update purchase invoice');
        },
      });
    } else {
      this.vendorService.recordPurchase(this.vendor.id, this.purchaseForm).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notify.success('Purchase invoice recorded successfully');
          this.closePurchaseModal();
          if (res.data) this.vendor = res.data;
          this.loadSubCollections();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to record purchase');
        },
      });
    }
  }

  public confirmDeletePurchase(p: VendorPurchase): void {
    this.purchaseToDelete = p;
    this.isDeletePurchaseConfirmOpen = true;
  }

  public closeDeletePurchaseModal(): void {
    this.isDeletePurchaseConfirmOpen = false;
    this.purchaseToDelete = null;
  }

  public executeDeletePurchase(): void {
    if (!this.vendor || !this.purchaseToDelete) return;
    this.isSubmitting = true;
    this.vendorService.deletePurchase(this.vendor.id, this.purchaseToDelete.id).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Purchase invoice deleted successfully');
        this.closeDeletePurchaseModal();
        this.loadVendor();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to delete purchase invoice');
      },
    });
  }

  // Payment Modal & CRUD Operations
  public openPaymentModal(): void {
    if (!this.vendor) return;
    this.editingPaymentId = null;
    this.paymentForm = {
      amount: this.vendor.outstanding_balance > 0 ? this.vendor.outstanding_balance : 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      reference_number: '',
      notes: '',
    };
    this.isPaymentModalOpen = true;
  }

  public openEditPaymentModal(pm: VendorPayment): void {
    this.editingPaymentId = pm.id;
    let paymentDate = '';
    if (pm.payment_date) {
      paymentDate = typeof pm.payment_date === 'string' ? pm.payment_date.split('T')[0] : new Date(pm.payment_date).toISOString().split('T')[0];
    }

    this.paymentForm = {
      amount: Number(pm.amount) || 0,
      payment_date: paymentDate,
      payment_method: pm.payment_method || 'BANK_TRANSFER',
      reference_number: pm.reference_number || '',
      notes: pm.notes || '',
    };
    this.isPaymentModalOpen = true;
  }

  public closePaymentModal(): void {
    this.isPaymentModalOpen = false;
    this.editingPaymentId = null;
  }

  public savePayment(): void {
    if (!this.vendor || this.paymentForm.amount <= 0) {
      this.notify.warning('Please enter a valid disbursement amount');
      return;
    }
    this.isSubmitting = true;

    if (this.editingPaymentId) {
      this.vendorService.updatePayment(this.vendor.id, this.editingPaymentId, this.paymentForm).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notify.success('Disbursement payment updated successfully');
          this.closePaymentModal();
          this.loadVendor();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to update disbursement payment');
        },
      });
    } else {
      this.vendorService.recordPayment(this.vendor.id, this.paymentForm).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notify.success('Disbursement payment recorded successfully');
          this.closePaymentModal();
          if (res.data) this.vendor = res.data;
          this.loadSubCollections();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || 'Failed to record payment');
        },
      });
    }
  }

  public confirmDeletePayment(pm: VendorPayment): void {
    this.paymentToDelete = pm;
    this.isDeletePaymentConfirmOpen = true;
  }

  public closeDeletePaymentModal(): void {
    this.isDeletePaymentConfirmOpen = false;
    this.paymentToDelete = null;
  }

  public executeDeletePayment(): void {
    if (!this.vendor || !this.paymentToDelete) return;
    this.isSubmitting = true;
    this.vendorService.deletePayment(this.vendor.id, this.paymentToDelete.id).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Disbursement payment deleted successfully');
        this.closeDeletePaymentModal();
        this.loadVendor();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to delete disbursement payment');
      },
    });
  }

  public scrollTabs(container: HTMLElement, amount: number): void {
    if (!container) return;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }
}




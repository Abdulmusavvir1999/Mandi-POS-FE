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
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';

type ActiveTab = 'profile' | 'contact' | 'tax' | 'payment_terms' | 'credit' | 'purchases' | 'balance' | 'rating' | 'performance';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe, PageLoaderComponent],
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
              <span class="category-pill">{{ vendor.category }}</span>
            </div>

            <div class="hero-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-purple">account_balance_wallet</span>
                <span>Payable Balance: <strong [class.text-rose-600]="vendor.outstanding_balance > 0">{{ vendor.outstanding_balance | appCurrency }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-blue">shopping_cart</span>
                <span>Total Procured: <strong>{{ vendor.total_purchases_amount | appCurrency }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-amber-500">star</span>
                <span>Rating: <strong class="text-amber-600">{{ vendor.rating | number:'1.1-1' }} / 5.0</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon text-emerald-500">verified</span>
                <span>On-Time: <strong class="text-emerald-600">{{ vendor.on_time_delivery_rate }}%</strong></span>
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

          <button
            type="button"
            (click)="openRatingModal()"
            class="hero-btn btn-outline"
            title="Evaluate Vendor Performance"
          >
            <span class="material-symbols-outlined text-amber-500">grade</span>
            <span>Rate</span>
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
            <span class="kpi-title">Credit Facility</span>
            <div class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">credit_score</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ hasNoLimit ? 'No Limit' : (vendor.credit_limit | appCurrency:'1.0-0') }}</span>
            <span class="kpi-pill" [ngClass]="hasNoLimit ? 'pill-success' : 'pill-purple'">
              {{ hasNoLimit ? 'Unlimited' : (getCreditUtilizationPercent() + '% Used') }}
            </span>
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
            <span class="kpi-number text-rose-600">{{ vendor.outstanding_balance | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill" [ngClass]="vendor.outstanding_balance > 0 ? 'pill-rose' : 'pill-success'">
              {{ vendor.outstanding_balance > 0 ? 'Pending Payout' : 'All Settled' }}
            </span>
          </div>
        </div>

        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Available Headroom</span>
            <div class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">savings</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-emerald-600">
              {{ hasNoLimit ? 'Unlimited' : ((vendor.credit_limit - vendor.outstanding_balance) | appCurrency:'1.0-0') }}
            </span>
            <span class="kpi-pill pill-success">Headroom</span>
          </div>
        </div>

        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Procurement Spend</span>
            <div class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">shopping_bag</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ vendor.total_purchases_amount | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-blue">{{ vendor.total_purchases_count }} Invoices</span>
          </div>
        </div>

        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Vendor Rating</span>
            <div class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">star</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-amber-600">{{ vendor.rating | number:'1.2-2' }}</span>
            <span class="kpi-pill pill-amber">Quality: {{ vendor.quality_score }}%</span>
          </div>
        </div>

        <div class="kpi-card card-accent-teal">
          <div class="kpi-header-row">
            <span class="kpi-title">Delivery Speed</span>
            <div class="kpi-icon-bubble bg-teal-tint">
              <span class="material-symbols-outlined">local_shipping</span>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ vendor.on_time_delivery_rate }}%</span>
            <span class="kpi-pill pill-teal">On-Time</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. 9-DIMENSION TAB NAVIGATION BAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <nav *ngIf="vendor && !isLoading" class="detail-tabs-bar" aria-label="Vendor profile dimensions">
        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'profile'"
          (click)="activeTab = 'profile'"
        >
          <span class="material-symbols-outlined">badge</span>
          <span>1. Profile &amp; Class</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'contact'"
          (click)="activeTab = 'contact'"
        >
          <span class="material-symbols-outlined">contacts</span>
          <span>2. Contact &amp; Location</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'tax'"
          (click)="activeTab = 'tax'"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          <span>3. Tax Compliance</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'payment_terms'"
          (click)="activeTab = 'payment_terms'"
        >
          <span class="material-symbols-outlined">account_balance</span>
          <span>4. Bank &amp; Settlement</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'credit'"
          (click)="activeTab = 'credit'"
        >
          <span class="material-symbols-outlined">credit_score</span>
          <span>5. Credit Facility</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'purchases'"
          (click)="activeTab = 'purchases'"
        >
          <span class="material-symbols-outlined">shopping_cart</span>
          <span>6. Purchase History ({{ vendorPurchases.length }})</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'balance'"
          (click)="activeTab = 'balance'"
        >
          <span class="material-symbols-outlined">payments</span>
          <span>7. Disbursements ({{ vendorPayments.length }})</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'rating'"
          (click)="activeTab = 'rating'"
        >
          <span class="material-symbols-outlined">star</span>
          <span>8. Scorecard</span>
        </button>

        <button
          type="button"
          class="detail-tab-btn"
          [class.is-active]="activeTab === 'performance'"
          (click)="activeTab = 'performance'"
        >
          <span class="material-symbols-outlined">history_edu</span>
          <span>9. Audit Log</span>
        </button>
      </nav>

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
              <span class="info-label">Supply Category</span>
              <span class="info-value font-semibold">{{ vendor.category }}</span>
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

        <!-- ── TAB 5: CREDIT FACILITY & EXPOSURE ── -->
        <section *ngIf="activeTab === 'credit'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-purple-soft">
              <span class="material-symbols-outlined">credit_score</span>
            </div>
            <div>
              <h2 class="card-title">Credit Facility &amp; Exposure Tracking</h2>
              <p class="card-subtitle">Approved credit limit, outstanding balances, and utilization gauge</p>
            </div>
          </div>

          <div class="credit-banner">
            <div class="cb-item">
              <span class="cb-label">Allocated Credit Limit</span>
              <span class="cb-val">{{ hasNoLimit ? 'No Limit (Unlimited)' : (vendor.credit_limit | appCurrency:'1.0-0') }}</span>
            </div>
            <div class="cb-item">
              <span class="cb-label">Utilized Balance</span>
              <span class="cb-val text-rose-600">{{ vendor.outstanding_balance | appCurrency:'1.0-0' }}</span>
            </div>
            <div class="cb-item">
              <span class="cb-label">Available Headroom</span>
              <span class="cb-val text-emerald-600">
                {{ hasNoLimit ? 'Unlimited (No Restriction)' : ((vendor.credit_limit - vendor.outstanding_balance) | appCurrency:'1.0-0') }}
              </span>
            </div>
          </div>

          <!-- Utilization Gauge -->
          <div class="mt-6" *ngIf="!hasNoLimit">
            <div class="flex justify-between text-xs font-semibold mb-2">
              <span>Credit Utilization Progress</span>
              <span>{{ getCreditUtilizationPercent() }}% Used</span>
            </div>
            <div class="gauge-track-large">
              <div
                class="gauge-fill-large"
                [style.width.%]="getCreditUtilizationPercent()"
                [ngClass]="getUtilizationClass()"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted mt-2">
              <span>₹0</span>
              <span>Safe (&lt;70%)</span>
              <span>Warning (70-90%)</span>
              <span>{{ vendor.credit_limit | appCurrency:'1.0-0' }}</span>
            </div>
          </div>

          <div class="no-limit-card mt-6" *ngIf="hasNoLimit">
            <span class="material-symbols-outlined text-3xl text-emerald-500">all_inclusive</span>
            <div>
              <h4 class="font-bold text-sm text-emerald-700">Open Credit Terms Active</h4>
              <p class="text-xs text-muted">This supplier does not have a strict credit ceiling. Purchase invoices are deferred per agreement.</p>
            </div>
          </div>
        </section>

        <!-- ── TAB 6: PURCHASES HISTORY ── -->
        <section *ngIf="activeTab === 'purchases'" class="content-card">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div class="card-header !mb-0 !pb-0 !border-none">
              <div class="card-header-icon bg-blue-soft">
                <span class="material-symbols-outlined">shopping_cart</span>
              </div>
              <div>
                <h2 class="card-title">Purchase Invoices &amp; Orders History</h2>
                <p class="card-subtitle">All supply invoices recorded for this vendor</p>
              </div>
            </div>
            <button type="button" (click)="openPurchaseModal()" class="action-btn btn-primary">
              <span class="material-symbols-outlined">add</span>
              <span>Record Purchase</span>
            </button>
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
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── TAB 7: DISBURSEMENTS & PAYMENTS ── -->
        <section *ngIf="activeTab === 'balance'" class="content-card">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div class="card-header !mb-0 !pb-0 !border-none">
              <div class="card-header-icon bg-emerald-soft">
                <span class="material-symbols-outlined">payments</span>
              </div>
              <div>
                <h2 class="card-title">Disbursement &amp; Payment Receipts</h2>
                <p class="card-subtitle">All outgoing payments and settlement vouchers</p>
              </div>
            </div>
            <button type="button" (click)="openPaymentModal()" class="action-btn btn-primary">
              <span class="material-symbols-outlined">add</span>
              <span>Record Payment</span>
            </button>
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
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── TAB 8: PERFORMANCE & SCORECARD ── -->
        <section *ngIf="activeTab === 'rating'" class="content-card">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div class="card-header !mb-0 !pb-0 !border-none">
              <div class="card-header-icon bg-amber-soft">
                <span class="material-symbols-outlined">star</span>
              </div>
              <div>
                <h2 class="card-title">Supplier Performance Scorecard</h2>
                <p class="card-subtitle">Audited rating metrics, quality scores, and speed analytics</p>
              </div>
            </div>
            <button type="button" (click)="openRatingModal()" class="action-btn btn-outline">
              <span class="material-symbols-outlined text-amber-500">grade</span>
              <span>Update Evaluation</span>
            </button>
          </div>

          <div class="rating-dashboard-grid">
            <div class="rating-overall-card">
              <span class="rating-big-num">{{ vendor.rating | number:'1.1-1' }}</span>
              <div class="stars-row">
                <span class="material-symbols-outlined text-amber-500 text-xl" *ngFor="let s of getStarsArray(vendor.rating)">star</span>
              </div>
              <span class="text-xs text-muted font-bold mt-1">OVERALL SUPPLIER SCORE</span>
            </div>

            <div class="rating-metric-bars">
              <div class="metric-bar-group">
                <div class="metric-bar-meta">
                  <span>Delivery Speed ({{ vendor.delivery_speed_rating || 5.0 | number:'1.1-1' }} / 5.0)</span>
                  <span class="font-bold">{{ vendor.on_time_delivery_rate }}% On-Time</span>
                </div>
                <div class="pm-bar">
                  <div class="pm-fill bg-purple" [style.width.%]="vendor.on_time_delivery_rate || 100"></div>
                </div>
              </div>

              <div class="metric-bar-group">
                <div class="metric-bar-meta">
                  <span>Product Quality ({{ vendor.quality_rating || 5.0 | number:'1.1-1' }} / 5.0)</span>
                  <span class="font-bold">{{ vendor.quality_score }}% Quality Score</span>
                </div>
                <div class="pm-bar">
                  <div class="pm-fill bg-emerald" [style.width.%]="vendor.quality_score || 100"></div>
                </div>
              </div>

              <div class="metric-bar-group">
                <div class="metric-bar-meta">
                  <span>Order Fulfillment Rate</span>
                  <span class="font-bold">{{ vendor.fulfillment_rate }}% Completed</span>
                </div>
                <div class="pm-bar">
                  <div class="pm-fill bg-blue" [style.width.%]="vendor.fulfillment_rate || 100"></div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="vendor.performance_notes" class="notes-box mt-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-amber-500">rate_review</span>
              <span class="font-bold text-xs uppercase tracking-wide">Procurement Quality Auditor Notes</span>
            </div>
            <p class="notes-text">{{ vendor.performance_notes }}</p>
          </div>
        </section>

        <!-- ── TAB 9: AUDIT LOG ── -->
        <section *ngIf="activeTab === 'performance'" class="content-card">
          <div class="card-header">
            <div class="card-header-icon bg-primary-soft">
              <span class="material-symbols-outlined">history_edu</span>
            </div>
            <div>
              <h2 class="card-title">System Audit &amp; Metadata</h2>
              <p class="card-subtitle">Timestamp audit trails and unique system identifiers</p>
            </div>
          </div>

          <div class="meta-grid-3">
            <div class="info-block">
              <span class="info-label">Internal Database ID</span>
              <span class="info-value font-mono">#{{ vendor.id }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Universal UUID</span>
              <span class="info-value font-mono text-xs truncate" [title]="vendor.uuid">{{ vendor.uuid }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Registration Date</span>
              <span class="info-value">{{ vendor.created_at | date:'medium' }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Last Profile Modification</span>
              <span class="info-value">{{ vendor.updated_at | date:'medium' }}</span>
            </div>
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
              <h3 class="modal-title">Record Purchase Invoice</h3>
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
                <label class="form-label">Total Bill Amount ({{ defaultCurrency }}) *</label>
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

            <div class="modal-footer">
              <button type="button" (click)="closePurchaseModal()" class="action-btn btn-outline">Cancel</button>
              <button type="submit" [disabled]="isSubmitting" class="action-btn btn-primary">
                <span class="material-symbols-outlined">receipt_long</span>
                <span>{{ isSubmitting ? 'Recording…' : 'Record Purchase' }}</span>
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
              <h3 class="modal-title">Record Supplier Disbursement</h3>
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
                min="1"
                [max]="vendor.outstanding_balance || 9999999"
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
                <span class="material-symbols-outlined">payments</span>
                <span>{{ isSubmitting ? 'Processing…' : 'Record Disbursement' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Rating Modal -->
      <div *ngIf="isRatingModalOpen && vendor" class="modal-backdrop" (click)="closeRatingModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Supplier Performance Audit</h3>
              <p class="modal-subtitle">Update satisfaction scores and delivery fulfillment</p>
            </div>
            <button type="button" (click)="closeRatingModal()" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveRating()" class="modal-body space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Overall Star Rating (1 - 5)</label>
                <input type="number" step="0.1" min="1" max="5" [(ngModel)]="ratingForm.rating" name="rating" class="form-control" />
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

            <div class="modal-footer">
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
        grid-template-columns: repeat(6, 1fr);
        gap: 0.875rem;
      }
      @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

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

      /* ── TABS BAR ──────────────────────────────────────────── */
      .detail-tabs-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.25rem 0;
        scrollbar-width: none;
      }
      .detail-tabs-bar::-webkit-scrollbar { display: none; }

      .detail-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.625rem 1.15rem;
        border-radius: 0.875rem;
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--text-muted, #64748B);
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .detail-tab-btn .material-symbols-outlined { font-size: 1.125rem; }
      .detail-tab-btn:hover {
        background: var(--bg-app, #FAF5FF);
        color: var(--primary, #7E22CE);
        border-color: var(--primary, #7E22CE);
      }
      .detail-tab-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        border-color: transparent;
        box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.3));
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
        gap: 0.875rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--card-border, #F1F5F9);
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
      @media (max-width: 800px) {
        .meta-grid-3, .meta-grid-2 { grid-template-columns: 1fr; }
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
  public isLoading = true;
  public loadError: string | null = null;
  public isSubmitting = false;

  public activeTab: ActiveTab = 'profile';
  public vendorPurchases: VendorPurchase[] = [];
  public vendorPayments: VendorPayment[] = [];

  // Modals
  public isPurchaseModalOpen = false;
  public isPaymentModalOpen = false;
  public isRatingModalOpen = false;

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

  // Purchase Modal
  public openPurchaseModal(): void {
    this.purchaseForm = {
      invoice_number: 'INV-' + Date.now().toString().slice(-6),
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
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
    if (!this.vendor || !this.purchaseForm.invoice_number || this.purchaseForm.total_amount <= 0) {
      this.notify.warning('Please enter valid invoice number and amount');
      return;
    }
    this.isSubmitting = true;
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

  // Payment Modal
  public openPaymentModal(): void {
    if (!this.vendor) return;
    this.paymentForm = {
      amount: this.vendor.outstanding_balance > 0 ? this.vendor.outstanding_balance : 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      reference_number: '',
      notes: '',
    };
    this.isPaymentModalOpen = true;
  }

  public closePaymentModal(): void {
    this.isPaymentModalOpen = false;
  }

  public savePayment(): void {
    if (!this.vendor || this.paymentForm.amount <= 0) {
      this.notify.warning('Please enter a valid disbursement amount');
      return;
    }
    this.isSubmitting = true;
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

  // Rating Modal
  public openRatingModal(): void {
    if (!this.vendor) return;
    this.ratingForm = {
      rating: this.vendor.rating || 5.0,
      delivery_speed_rating: this.vendor.delivery_speed_rating || 5.0,
      quality_rating: this.vendor.quality_rating || 5.0,
      pricing_rating: this.vendor.pricing_rating || 5.0,
      on_time_delivery_rate: this.vendor.on_time_delivery_rate ?? 100,
      quality_score: this.vendor.quality_score ?? 100,
      fulfillment_rate: this.vendor.fulfillment_rate ?? 100,
      performance_notes: this.vendor.performance_notes || '',
    };
    this.isRatingModalOpen = true;
  }

  public closeRatingModal(): void {
    this.isRatingModalOpen = false;
  }

  public saveRating(): void {
    if (!this.vendor) return;
    this.isSubmitting = true;
    this.vendorService.updateRating(this.vendor.id, this.ratingForm).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.notify.success('Vendor evaluation saved successfully');
        this.closeRatingModal();
        if (res.data) this.vendor = res.data;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notify.error(err?.error?.message || 'Failed to update evaluation');
      },
    });
  }
}

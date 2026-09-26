import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorService } from '../../../core/services/vendor.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Vendor, VendorStatus, PaymentTermsType, PreferredPaymentMethod } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';

@Component({
  selector: 'app-vendor-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, AppCurrencyPipe, ActionLoadingDirective],
  template: `
    <div class="vendor-form-page">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <span class="breadcrumb-item">Procurement</span>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/vendors" class="breadcrumb-link">Vendor Management</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ isEdit ? 'Edit Vendor Profile' : 'Register New Vendor' }}</span>
      </nav>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. PAGE HEADER                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <header class="page-header-card">
        <div class="header-left">
          <button
            type="button"
            (click)="goBack()"
            class="back-icon-btn"
            title="Return to Vendor List"
            aria-label="Return to Vendor List"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>

          <div class="header-icon-badge">
            <span class="material-symbols-outlined">{{ isEdit ? 'edit_note' : 'add_business' }}</span>
          </div>

          <div>
            <div class="header-title-row">
              <h1 class="page-title">{{ isEdit ? 'Edit Supplier Profile' : 'Register New Supplier' }}</h1>
              <span class="status-pill" [ngClass]="getStatusBadgeClass(form.status)">
                {{ form.status || 'ACTIVE' }}
              </span>
            </div>
            <p class="page-subtitle">
              {{ isEdit ? 'Update commercial terms, banking details, and contact coordinates' : 'Create a vendor record with tax identification, credit terms, and banking info' }}
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" (click)="goBack()" class="btn-cancel">
            <span class="material-symbols-outlined">cancel</span>
            <span>Cancel</span>
          </button>
          <button type="button" (click)="save()" [disabled]="isSubmitting" class="btn-save">
            <span class="material-symbols-outlined">{{ isSubmitting ? 'hourglass_top' : 'save' }}</span>
            <span>{{ isSubmitting ? 'Saving…' : (isEdit ? 'Update Vendor' : 'Save Vendor') }}</span>
          </button>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state-card">
        <div class="spinner"></div>
        <span>Loading supplier profile…</span>
      </div>

      <!-- Main Form Grid -->
      <form *ngIf="!isLoading" (ngSubmit)="save()" class="form-layout-grid">
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- LEFT MAIN COLUMN                                            -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="main-column">
          <!-- Section 1: Identity & Category -->
          <section class="form-card">
            <div class="form-card-header">
              <div class="card-header-icon bg-primary-soft">
                <span class="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h2 class="form-card-title">1. Supplier Identity & Classification</h2>
                <p class="form-card-desc">Basic company name, unique identifier, and category grouping</p>
              </div>
            </div>

            <div class="card-body-grid">
              <!-- Vendor Logo / Image Upload -->
              <div class="form-group full-width vendor-image-upload-wrapper">
                <label class="form-label">Vendor Logo / Profile Image</label>
                <div class="vendor-image-upload-box">
                  <div class="vendor-avatar-preview" [class.has-image]="!!form.image_url">
                    <img *ngIf="form.image_url" [src]="settingsService.assetUrl(form.image_url)" alt="Vendor Logo" />
                    <span *ngIf="!form.image_url" class="material-symbols-outlined">add_photo_alternate</span>
                  </div>
                  <div class="vendor-image-actions">
                    <input
                      type="file"
                      hidden
                      #vendorImagePicker
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      (change)="onImageFile($event, vendorImagePicker)"
                      title="Choose vendor logo or image"
                    />
                    <div class="image-btn-row">
                      <button
                        type="button"
                        class="btn-image-action upload-btn"
                        [disabled]="isUploadingImage"
                        (click)="vendorImagePicker.click()"
                      >
                        <span class="material-symbols-outlined">{{ isUploadingImage ? 'progress_activity' : 'upload' }}</span>
                        <span>{{ isUploadingImage ? 'Uploading…' : (form.image_url ? 'Change Image' : 'Upload Logo') }}</span>
                      </button>
                      <button
                        *ngIf="form.image_url && !isUploadingImage"
                        type="button"
                        class="btn-image-action remove-btn"
                        (click)="form.image_url = ''"
                      >
                        <span class="material-symbols-outlined">delete</span>
                        <span>Remove</span>
                      </button>
                    </div>
                    <p class="image-upload-hint">PNG, JPG, WEBP or GIF &bull; Max 2MB &bull; Recommended square 1:1 format</p>
                  </div>
                </div>
              </div>

              <div class="form-group full-width">
                <label class="form-label required-label">Vendor / Company Legal Name</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">storefront</span>
                  <input
                    type="text"
                    [(ngModel)]="form.name"
                    name="name"
                    required
                    placeholder="e.g. Al-Watania Poultry & Meat Farms"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Vendor Code / Reference</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">tag</span>
                  <input
                    type="text"
                    [(ngModel)]="form.vendor_code"
                    name="vendor_code"
                    placeholder="e.g. VND-007 (or auto-generated)"
                    class="form-control font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required-label">Supply Categories</label>
                <app-custom-dropdown
                  [options]="categoryOptions"
                  [(ngModel)]="form.categories"
                  name="categories"
                  [multiple]="true"
                  [searchable]="true"
                  [allowCustom]="true"
                  placeholder="Select every category this vendor supplies"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>

              <div class="form-group">
                <label class="form-label">Operating Status</label>
                <app-custom-dropdown
                  [options]="vendorStatusOptions"
                  [(ngModel)]="form.status"
                  name="status"
                  placeholder="Select status"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>

              <div class="form-group">
                <label class="form-label">Preferred Payment Mode (Multi-Select)</label>
                <app-custom-dropdown
                  [options]="paymentMethodOptions"
                  [(ngModel)]="form.preferred_payment_method"
                  name="preferred_payment_method"
                  [multiple]="true"
                  placeholder="Select payment modes"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>
          </section>

          <!-- Section 2: Contact & Coordinates -->
          <section class="form-card">
            <div class="form-card-header">
              <div class="card-header-icon bg-emerald-soft">
                <span class="material-symbols-outlined">contacts</span>
              </div>
              <div>
                <h2 class="form-card-title">2. Contact Information & Location</h2>
                <p class="form-card-desc">Primary representative, direct phone, and physical address</p>
              </div>
            </div>

            <div class="card-body-grid">
              <div class="form-group">
                <label class="form-label">Key Contact Person / Account Exec</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">person</span>
                  <input
                    type="text"
                    [(ngModel)]="form.contact_person"
                    name="contact_person"
                    placeholder="e.g. Sheikh Tariq Mansoor"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required-label">Direct Phone Number</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">call</span>
                  <input
                    type="tel"
                    [(ngModel)]="form.phone"
                    name="phone"
                    required
                    placeholder="e.g. +966 50 123 4567"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Official Email Address</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">mail</span>
                  <input
                    type="email"
                    [(ngModel)]="form.email"
                    name="email"
                    placeholder="orders@supplier.com"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Website / Portal URL</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">language</span>
                  <input
                    type="url"
                    [(ngModel)]="form.website"
                    name="website"
                    placeholder="https://www.supplier.com"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Street Address / Warehouse Location</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">pin_drop</span>
                  <input
                    type="text"
                    [(ngModel)]="form.address"
                    name="address"
                    placeholder="e.g. Central Warehouse District, Gate #4"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">City / Municipality</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">location_city</span>
                  <input
                    type="text"
                    [(ngModel)]="form.city"
                    name="city"
                    placeholder="e.g. Riyadh"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">State / Province</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">map</span>
                  <input
                    type="text"
                    [(ngModel)]="form.state"
                    name="state"
                    placeholder="e.g. Central Region"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Postal / Zip Code</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">local_post_office</span>
                  <input
                    type="text"
                    [(ngModel)]="form.postal_code"
                    name="postal_code"
                    placeholder="e.g. 12211"
                    class="form-control font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: Tax & Financial Details -->
          <section class="form-card">
            <div class="form-card-header">
              <div class="card-header-icon bg-amber-soft">
                <span class="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <h2 class="form-card-title">3. Tax & Financial Details</h2>
                <p class="form-card-desc">Tax compliance identifiers and vendor opening/outstanding balance</p>
              </div>
            </div>

            <div class="card-body-grid">
              <div class="form-group">
                <label class="form-label">GSTIN / VAT Number</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">description</span>
                  <input
                    type="text"
                    [(ngModel)]="form.tax_id"
                    name="tax_id"
                    placeholder="310123456700003"
                    class="form-control font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">PAN Number / Tax Code</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">credit_card</span>
                  <input
                    type="text"
                    [(ngModel)]="form.pan_number"
                    name="pan_number"
                    placeholder="ALWPM9821K"
                    class="form-control font-mono"
                  />
                </div>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Outstanding Amount ({{ defaultCurrency }})</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">account_balance_wallet</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    [(ngModel)]="form.outstanding_balance"
                    name="outstanding_balance"
                    placeholder="0.00"
                    class="form-control font-mono"
                  />
                </div>
                <span class="field-help-text">Pending payable balance or opening balance with this supplier.</span>
              </div>
            </div>
          </section>

          <!-- Section 4: Banking & Settlement Coordinates -->
          <section class="form-card">
            <div class="form-card-header">
              <div class="card-header-icon bg-blue-soft">
                <span class="material-symbols-outlined">account_balance</span>
              </div>
              <div>
                <h2 class="form-card-title">4. Banking & Electronic Settlement</h2>
                <p class="form-card-desc">Direct bank account details for invoice payouts and reconciliation</p>
              </div>
            </div>

            <div class="card-body-grid">
              <div class="form-group">
                <label class="form-label">Bank Name</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">account_balance</span>
                  <input
                    type="text"
                    [(ngModel)]="form.bank_name"
                    name="bank_name"
                    placeholder="e.g. Al Rajhi Bank / State Bank"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Account Number / IBAN</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">credit_card</span>
                  <input
                    type="text"
                    [(ngModel)]="form.account_number"
                    name="account_number"
                    placeholder="SA0380000000608010167519"
                    class="form-control font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">IFSC / Swift / Branch Code</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">key</span>
                  <input
                    type="text"
                    [(ngModel)]="form.ifsc_code"
                    name="ifsc_code"
                    placeholder="RJHISARI"
                    class="form-control font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">UPI / Settlement ID</label>
                <div class="input-with-icon">
                  <span class="material-symbols-outlined input-icon">qr_code</span>
                  <input
                    type="text"
                    [(ngModel)]="form.upi_id"
                    name="upi_id"
                    placeholder="vendor@okhdfcbank"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Internal Notes / Procurement Guidelines</label>
                <textarea
                  [(ngModel)]="form.notes"
                  name="notes"
                  rows="3"
                  placeholder="e.g. Delivery dock access between 6 AM and 10 AM. Inspect cold storage temperatures upon delivery."
                  class="form-control text-area"
                ></textarea>
              </div>
            </div>
          </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- RIGHT SIDEBAR COLUMN (Live Preview & Guide)                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <aside class="sidebar-column">
          <!-- Live Preview Card -->
          <div class="form-card preview-card">
            <div class="preview-header">
              <span class="preview-tag">LIVE PREVIEW</span>
              <span class="status-pill" [ngClass]="getStatusBadgeClass(form.status)">
                {{ form.status || 'ACTIVE' }}
              </span>
            </div>

            <div class="preview-body">
              <div class="preview-icon-wrapper" [class.has-preview-img]="!!form.image_url">
                <img *ngIf="form.image_url" [src]="settingsService.assetUrl(form.image_url)" [alt]="form.name || 'Vendor Logo'" class="preview-avatar-img" />
                <span *ngIf="!form.image_url" class="material-symbols-outlined">local_shipping</span>
              </div>
              <div class="preview-name">{{ form.name || 'Vendor Name' }}</div>
              <div class="preview-code">{{ form.vendor_code || 'VND-AUTO' }}</div>
              <div class="preview-cat-badges">
                <div
                  class="preview-cat-badge"
                  *ngFor="let c of (form.categories?.length ? form.categories : ['General Supplies'])"
                >
                  {{ c }}
                </div>
              </div>

              <div class="preview-meta-list">
                <div class="preview-meta-row">
                  <span class="material-symbols-outlined">person</span>
                  <span>{{ form.contact_person || 'Contact person not set' }}</span>
                </div>
                <div class="preview-meta-row">
                  <span class="material-symbols-outlined">call</span>
                  <span>{{ form.phone || 'Phone number not set' }}</span>
                </div>
                <div class="preview-meta-row">
                  <span class="material-symbols-outlined">location_on</span>
                  <span>{{ form.city ? form.city + ', ' + (form.state || '') : 'Location not set' }}</span>
                </div>
                <div class="preview-meta-row">
                  <span class="material-symbols-outlined">account_balance_wallet</span>
                  <span>Outstanding: <strong>{{ (form.outstanding_balance || 0) | appCurrency }}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Guidelines Card -->
          <div class="form-card guidelines-card">
            <div class="guidelines-header">
              <span class="material-symbols-outlined text-purple">tips_and_updates</span>
              <h3 class="guidelines-title">Supplier Best Practices</h3>
            </div>
            <ul class="guidelines-list">
              <li>
                <strong>Category Tagging:</strong> Proper categories ensure accurate food cost breakdowns and purchase order groupings.
              </li>
              <li>
                <strong>Credit Terms:</strong> Setting credit periods alerts you before invoices become delinquent.
              </li>
              <li>
                <strong>Banking Coordinates:</strong> Verifying IBAN/IFSC prevents payment delays when batch-clearing payables.
              </li>
            </ul>
          </div>

          <!-- Bottom Save Actions Box -->
          <div class="sidebar-actions-card">
            <button type="submit" [disabled]="isSubmitting" class="btn-save full-width-btn">
              <span class="material-symbols-outlined">{{ isSubmitting ? 'hourglass_top' : 'save' }}</span>
              <span>{{ isSubmitting ? 'Saving…' : (isEdit ? 'Update Supplier Profile' : 'Save & Register Supplier') }}</span>
            </button>
            <button type="button" (click)="goBack()" class="btn-cancel full-width-btn">
              <span>Return to Suppliers</span>
            </button>
          </div>
        </aside>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg-app, #FAF5FF);
      }

      .vendor-form-page {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      /* ── BREADCRUMB ────────────────────────────────────────── */
      .breadcrumb-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-muted, #64748B);
        font-weight: 500;
      }
      .breadcrumb-item { color: var(--text-muted, #64748B); }
      .breadcrumb-sep { color: var(--text-muted, #94A3B8); font-size: 0.875rem; }
      .breadcrumb-link {
        color: var(--primary, #7E22CE);
        text-decoration: none;
        font-weight: 600;
        transition: opacity 0.2s;
      }
      .breadcrumb-link:hover { text-decoration: underline; }
      .breadcrumb-current { color: var(--text-main, #0F172A); font-weight: 700; }

      /* ── PAGE HEADER CARD ──────────────────────────────────── */
      .page-header-card {
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 1.25rem;
        padding: 1.25rem 1.75rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        box-shadow: 0 4px 20px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .back-icon-btn {
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
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .back-icon-btn:hover {
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
        border-color: var(--primary, #7E22CE);
        transform: translateX(-2px);
      }

      .header-icon-badge {
        width: 3.25rem;
        height: 3.25rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 16px -2px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }
      .header-icon-badge .material-symbols-outlined { font-size: 1.75rem; }

      .header-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .page-title {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
        letter-spacing: -0.02em;
      }
      .page-subtitle {
        font-size: 0.8125rem;
        color: var(--text-muted, #64748B);
        margin: 0.25rem 0 0;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .btn-cancel {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.875rem;
        font-size: 0.875rem;
        font-weight: 700;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
        color: var(--text-muted, #64748B);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-cancel:hover {
        background: var(--bg-app, #FAF5FF);
        color: var(--text-main, #0F172A);
        border-color: var(--text-muted, #94A3B8);
      }

      .btn-save {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.5rem;
        border-radius: 0.875rem;
        font-size: 0.875rem;
        font-weight: 700;
        border: none;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        cursor: pointer;
        box-shadow: 0 4px 14px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .btn-save:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
      }
      .btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* ── FORM LAYOUT GRID ──────────────────────────────────── */
      .form-layout-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 1.5rem;
        align-items: start;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      .main-column {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        min-width: 0;
        width: 100%;
        max-width: 100%;
      }

      .sidebar-column {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        position: sticky;
        top: 1.5rem;
        min-width: 0;
        width: 340px;
        max-width: 100%;
      }

      /* ── FORM CARDS ────────────────────────────────────────── */
      .form-card {
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 1.25rem;
        padding: 1.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        min-width: 0;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .form-card-header {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--card-border, #F1F5F9);
      }

      .card-header-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }
      .bg-primary-soft { background: rgba(var(--primary-rgb, 126, 34, 206), 0.12); color: var(--primary, #7E22CE); }
      .bg-emerald-soft { background: rgba(16, 185, 129, 0.12); color: #10B981; }
      .bg-amber-soft { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }
      .bg-blue-soft { background: rgba(59, 130, 246, 0.12); color: #3B82F6; }

      .form-card-title {
        font-size: 1.0625rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
      }
      .form-card-desc {
        font-size: 0.75rem;
        color: var(--text-muted, #64748B);
        margin: 0.2rem 0 0;
      }

      .card-body-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.25rem;
        width: 100%;
        min-width: 0;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        min-width: 0;
        width: 100%;
        max-width: 100%;
      }
      .form-group.full-width {
        grid-column: 1 / -1;
      }

      app-custom-dropdown {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }

      .form-label {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--text-main, #334155);
      }
      .required-label::after {
        content: ' *';
        color: var(--danger, #EF4444);
      }

      .input-with-icon {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
      .input-icon {
        position: absolute;
        left: 0.875rem;
        color: var(--text-muted, #94A3B8);
        font-size: 1.125rem;
        pointer-events: none;
        z-index: 1;
      }

      .form-control {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 2.625rem;
        padding: 0 0.875rem 0 2.5rem;
        border-radius: 0.75rem;
        border: 1.5px solid var(--card-border, #E2E8F0);
        background: var(--card-bg, #FFFFFF);
        color: var(--text-main, #0F172A);
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        outline: none;
        box-sizing: border-box;
      }
      .form-control:focus {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
      }
      .form-control::placeholder {
        color: var(--text-muted, #94A3B8);
        opacity: 0.7;
      }

      .text-area {
        height: auto;
        padding: 0.75rem 0.875rem;
        resize: vertical;
        min-height: 80px;
      }

      /* ── VENDOR IMAGE UPLOAD ───────────────────────────────── */
      .vendor-image-upload-wrapper {
        margin-bottom: 0.25rem;
      }
      .vendor-image-upload-box {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1rem;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px dashed var(--card-border, #E9D5FF);
        border-radius: 1rem;
        transition: all 0.2s ease;
      }
      .vendor-image-upload-box:hover {
        border-color: var(--primary, #7E22CE);
      }
      .vendor-avatar-preview {
        width: 4.75rem;
        height: 4.75rem;
        border-radius: 1rem;
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        color: var(--primary, #7E22CE);
        box-shadow: 0 4px 12px -2px rgba(var(--primary-rgb, 126, 34, 206), 0.15);
      }
      .vendor-avatar-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .vendor-avatar-preview .material-symbols-outlined {
        font-size: 2.25rem;
        opacity: 0.6;
      }
      .vendor-image-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }
      .image-btn-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-wrap: wrap;
      }
      .btn-image-action {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.45rem 0.875rem;
        border-radius: 0.625rem;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-image-action .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .btn-image-action.upload-btn {
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--primary, #7E22CE);
        color: var(--primary, #7E22CE);
      }
      .btn-image-action.upload-btn:hover:not(:disabled) {
        background: var(--primary, #7E22CE);
        color: #FFFFFF;
      }
      .btn-image-action.upload-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-image-action.remove-btn {
        background: transparent;
        border: 1px solid var(--danger, #EF4444);
        color: var(--danger, #EF4444);
      }
      .btn-image-action.remove-btn:hover {
        background: rgba(239, 68, 68, 0.1);
      }
      .image-upload-hint {
        font-size: 0.6875rem;
        color: var(--text-muted, #64748B);
        margin: 0;
      }

      /* ── CREDIT LIMIT TOGGLE & NO LIMIT BANNER ─────────────── */
      .limit-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .limit-mode-toggle {
        display: inline-flex;
        padding: 2px;
        border-radius: 999px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .limit-mode-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.6rem;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--text-muted, #64748B);
        font-family: inherit;
        font-size: 0.6875rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .limit-mode-btn .material-symbols-outlined {
        font-size: 13px;
      }
      .limit-mode-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        box-shadow: 0 2px 8px -2px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      .no-limit-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 0.875rem;
        border-radius: 0.75rem;
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.25);
        height: 2.625rem;
      }
      .no-limit-icon-box {
        width: 1.625rem;
        height: 1.625rem;
        border-radius: 0.5rem;
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .no-limit-icon-box .material-symbols-outlined {
        font-size: 1.125rem;
      }
      .no-limit-text-col {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
      }
      .no-limit-title {
        font-size: 0.75rem;
        font-weight: 800;
        color: #10B981;
        white-space: nowrap;
      }
      .no-limit-sub {
        font-size: 0.6875rem;
        color: var(--text-muted, #64748B);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ── LIVE PREVIEW CARD ─────────────────────────────────── */
      .preview-card {
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        text-align: center;
        padding: 1.5rem 1.25rem;
      }
      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .preview-tag {
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: var(--primary, #7E22CE);
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.1);
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
      }

      .preview-icon-wrapper {
        width: 4rem;
        height: 4rem;
        border-radius: 1.25rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        box-shadow: 0 8px 20px -4px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.4));
      }
      .preview-icon-wrapper .material-symbols-outlined { font-size: 2rem; }
      .preview-icon-wrapper.has-preview-img {
        background: transparent;
        border: 2px solid var(--card-border, #E9D5FF);
        padding: 0;
        overflow: hidden;
      }
      .preview-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 1.25rem;
        display: block;
      }

      .preview-name {
        font-size: 1.125rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        line-height: 1.3;
      }
      .preview-code {
        font-size: 0.75rem;
        font-family: ui-monospace, monospace;
        color: var(--text-muted, #64748B);
        font-weight: 600;
        margin-top: 0.25rem;
      }
      /* Several categories now, so they wrap instead of stacking with a
         margin each. */
      .preview-cat-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: 0.625rem;
        justify-content: center;
      }
      .preview-cat-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
      }

      .preview-meta-list {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px solid var(--card-border, #F1F5F9);
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        text-align: left;
      }
      .preview-meta-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted, #475569);
      }
      .preview-meta-row .material-symbols-outlined {
        font-size: 1rem;
        color: var(--text-muted, #94A3B8);
      }

      /* ── GUIDELINES CARD ───────────────────────────────────── */
      .guidelines-card {
        background: var(--card-bg, #FFFFFF);
      }
      .guidelines-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .guidelines-title {
        font-size: 0.875rem;
        font-weight: 800;
        color: var(--text-main, #0F172A);
        margin: 0;
      }
      .guidelines-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        font-size: 0.75rem;
        color: var(--text-muted, #64748B);
        line-height: 1.45;
      }
      .guidelines-list li strong { color: var(--text-main, #334155); }

      /* ── SIDEBAR ACTIONS ───────────────────────────────────── */
      .sidebar-actions-card {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .full-width-btn {
        width: 100%;
        justify-content: center;
      }

      /* ── STATUS PILLS ──────────────────────────────────────── */
      .status-pill {
        padding: 0.2rem 0.625rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .status-active { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      .status-inactive { background: rgba(100, 116, 139, 0.15); color: #64748B; }
      .status-blocked { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
      .status-review { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }

      /* ── LOADING SPINNER ───────────────────────────────────── */
      .loading-state-card {
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 1.25rem;
        padding: 4rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: var(--text-muted, #64748B);
        font-weight: 600;
      }
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        border: 3px solid var(--card-border, #E9D5FF);
        border-top-color: var(--primary, #7E22CE);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Responsive rules */
      @media (max-width: 1024px) {
        .form-layout-grid {
          grid-template-columns: 1fr;
        }
        .sidebar-column {
          position: static;
        }
      }
      @media (max-width: 640px) {
        .page-header-card {
          flex-direction: column;
          align-items: flex-start;
        }
        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }
        .card-body-grid {
          grid-template-columns: 1fr;
        }
        .form-group.full-width {
          grid-column: span 1;
        }
      }
    `,
  ],
})
export class VendorFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private vendorService = inject(VendorService);
  private notify = inject(NotificationService);
  public settingsService = inject(SettingsService);

  public isEdit = false;
  public vendorId: number | null = null;
  public isLoading = false;
  public isSubmitting = false;
  public isUploadingImage = false;
  public isNoLimit = false;

  private static readonly IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  private static readonly IMAGE_MAX_MB = 2;

  public get defaultCurrency(): string {
    return this.settingsService.currencySymbol() || '₹';
  }

  public setLimitMode(noLimit: boolean): void {
    this.isNoLimit = noLimit;
    if (noLimit) {
      this.form.credit_limit = 0;
    } else if (!this.form.credit_limit || this.form.credit_limit === 0) {
      this.form.credit_limit = 50000;
    }
  }

  public form: Partial<Vendor> = {
    name: '',
    vendor_code: '',
    image_url: '',
    category: 'Meat & Poultry',
    categories: ['Meat & Poultry'],
    status: 'ACTIVE',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    tax_id: '',
    pan_number: '',
    outstanding_balance: 0,
    preferred_payment_method: 'BANK_TRANSFER',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    notes: '',
  };

  public categoryOptions: DropdownOption[] = [
    { value: 'Meat & Poultry', label: 'Meat & Poultry', icon: 'set_meal' },
    { value: 'Rice & Grains', label: 'Rice & Grains', icon: 'grain' },
    { value: 'Spices & Condiments', label: 'Spices & Condiments', icon: 'local_fire_department' },
    { value: 'Dairy & Fresh Produce', label: 'Dairy & Fresh Produce', icon: 'egg' },
    { value: 'Packaging & Disposables', label: 'Packaging & Disposables', icon: 'inventory_2' },
    { value: 'Beverage Supplies', label: 'Beverage Supplies', icon: 'local_cafe' },
    { value: 'Bakery Ingredients', label: 'Bakery Ingredients', icon: 'bakery_dining' },
    { value: 'Cleaning & Sanitation', label: 'Cleaning & Sanitation', icon: 'cleaning_services' },
    { value: 'General Supplies', label: 'General Supplies', icon: 'category' },
  ];

  public vendorStatusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'Active', icon: 'check_circle' },
    { value: 'INACTIVE', label: 'Inactive', icon: 'pause_circle' },
    { value: 'BLOCKED', label: 'Blocked', icon: 'block' },
    { value: 'UNDER_REVIEW', label: 'Under Review', icon: 'pending' },
  ];

  public paymentTermsOptions: DropdownOption[] = [
    { value: 'NET_30', label: 'Net 30 Days (Standard)', icon: 'calendar_month' },
    { value: 'NET_15', label: 'Net 15 Days (Semi-Monthly)', icon: 'date_range' },
    { value: 'NET_7', label: 'Net 7 Days (Weekly)', icon: 'event' },
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt (Immediate)', icon: 'receipt' },
    { value: 'PAY_ANYTIME', label: 'Pay Anytime (Flexible Terms)', icon: 'all_inclusive' },
    { value: 'ADVANCE', label: '100% Advance Payment', icon: 'payments' },
    { value: 'NET_60', label: 'Net 60 Days (Extended)', icon: 'schedule' },
  ];

  public paymentMethodOptions: DropdownOption[] = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / RTGS', icon: 'account_balance', description: 'RTGS, NEFT, IMPS or Wire Transfer' },
    { value: 'UPI', label: 'UPI / Instant QR Payment', icon: 'qr_code', description: 'Instant QR, UPI ID or wallet transfers' },
    { value: 'PAY_LATER', label: 'Pay Later / Deferred Credit', icon: 'pending_actions', description: 'Deferred credit ledger or invoice settlement' },
    { value: 'CASH', label: 'Cash on Delivery', icon: 'attach_money', description: 'Immediate cash settlement at delivery' },
    { value: 'CHEQUE', label: 'Bank Cheque / DD', icon: 'fact_check', description: 'Current or post-dated bank cheque' },
    { value: 'CREDIT_TERMS', label: 'Credit Account', icon: 'credit_score', description: 'Direct credit account with periodic billing' },
  ];

  public ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.vendorId = parseInt(idParam, 10);
      this.loadVendor(this.vendorId);
    }
  }

  public loadVendor(id: number): void {
    this.isLoading = true;
    this.vendorService.getVendorById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.form = { ...res.data };
          // A vendor saved before multi-category has only the single field.
          if (!this.form.categories?.length) {
            this.form.categories = this.form.category ? [this.form.category] : [];
          }
          this.isNoLimit = (this.form.credit_limit === null || this.form.credit_limit === undefined || Number(this.form.credit_limit) === 0);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error(err?.error?.message || 'Failed to load vendor details');
        this.router.navigate(['/vendors']);
      },
    });
  }

  public onImageFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    picker.value = '';
    if (!file) return;

    if (!VendorFormComponent.IMAGE_TYPES.includes(file.type)) {
      this.notify.error('Vendor logo must be a PNG, JPG, WEBP, or GIF.');
      return;
    }
    if (file.size > VendorFormComponent.IMAGE_MAX_MB * 1024 * 1024) {
      this.notify.error(
        `Vendor logo is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${VendorFormComponent.IMAGE_MAX_MB} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.vendorService.uploadVendorImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.form.image_url = res.data.url;
            this.notify.success('Vendor logo uploaded successfully');
          } else {
            this.notify.error(res?.message || 'Vendor image upload failed.');
          }
        },
        error: (err) => {
          this.isUploadingImage = false;
          this.notify.error(err?.error?.message || 'Vendor image upload failed.');
        },
      });
    };

    this.isUploadingImage = true;
    reader.readAsDataURL(file);
  }

  public save(): void {
    if (this.isSubmitting) return;

    if (!this.form.name?.trim()) {
      this.notify.warning('Please enter Vendor / Company Legal Name');
      return;
    }
    if (!this.form.phone?.trim()) {
      this.notify.warning('Please enter Contact Phone Number');
      return;
    }

    const categories = (this.form.categories || [])
      .map((c) => String(c || '').trim())
      .filter((c) => c.length > 0);

    if (categories.length === 0) {
      this.notify.warning('Please select at least one supply category');
      return;
    }

    this.isSubmitting = true;

    const payload: Partial<Vendor> = {
      ...this.form,
      categories,
      // Kept in step with the first selection so the vendor list, the detail
      // header and the purchases report keep showing a sensible single value.
      category: categories[0],
      preferred_payment_method: Array.isArray(this.form.preferred_payment_method)
        ? (this.form.preferred_payment_method as string[]).join(',')
        : (this.form.preferred_payment_method || 'BANK_TRANSFER'),
      outstanding_balance: Number(this.form.outstanding_balance || 0),
    };

    if (this.isEdit && this.vendorId) {
      this.vendorService.updateVendor(this.vendorId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notify.success('Vendor profile updated successfully');
          this.router.navigate(['/vendors']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || err?.message || 'Failed to update vendor');
        },
      });
    } else {
      this.vendorService.createVendor(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notify.success('New vendor registered successfully');
          this.router.navigate(['/vendors']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err?.error?.message || err?.message || 'Failed to create vendor');
        },
      });
    }
  }

  public goBack(): void {
    this.router.navigate(['/vendors']);
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
}

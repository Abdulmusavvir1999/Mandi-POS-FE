import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { Customer, CustomerNote, CustomerAnalytics } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';

type CustomerTab = 'analytics' | 'history' | 'notes' | 'timeline' | 'profile';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomDropdownComponent,
    ImageUploadComponent,
    AppCurrencyPipe,
    PageLoaderComponent,
    ActionLoadingDirective,
  ],
  template: `
    <div class="customer-detail-page">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading customer profile…"
        subMessage="Retrieving 360° analytics, order history & dining preferences."
        icon="contacts"
        (retry)="loadCustomer()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & NAVIGATION                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <nav class="breadcrumb-bar" aria-label="Breadcrumb">
        <span class="breadcrumb-item">CRM &amp; Guests</span>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/customers" class="breadcrumb-link">Customer Directory</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ customer?.name || 'Guest Profile' }}</span>
      </nav>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. HERO CUSTOMER HEADER CARD                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <header *ngIf="customer && !isLoading" class="hero-header-card">
        <div class="hero-left">
          <button
            type="button"
            (click)="goBack()"
            class="back-btn"
            title="Return to Customer Directory"
            aria-label="Return to Customer Directory"
          >
            <span class="material-symbols-outlined">arrow_back</span>
          </button>

          <div class="hero-avatar" [class.has-img]="!!customer.image_url">
            <img
              *ngIf="customer.image_url"
              [src]="settingsService.assetUrl(customer.image_url)"
              [alt]="customer.name"
              class="avatar-img"
            />
            <span *ngIf="!customer.image_url" class="avatar-initials">{{ getInitials(customer.name) }}</span>
            <span class="online-indicator" title="Active Guest"></span>
          </div>

          <div class="hero-identity">
            <div class="hero-title-row">
              <h1 class="hero-title">{{ customer.name }}</h1>
              <span class="cust-code-tag">#{{ customer.customer_code || ('CUST-' + customer.id) }}</span>
              <span class="tier-pill" [style.background]="getTierBg(customer)" [style.color]="getTierColor(customer)">
                <span class="material-symbols-outlined text-xs">diamond</span>
                {{ getTier(customer) }}
              </span>
              <span
                class="activity-pill"
                [style.background]="getActivityBadge(customer).bg"
                [style.color]="getActivityBadge(customer).color"
              >
                <span class="material-symbols-outlined text-xs">{{ getActivityBadge(customer).icon }}</span>
                {{ getActivityBadge(customer).label }}
              </span>
            </div>

            <div class="hero-meta-row">
              <span class="meta-item" *ngIf="customer.phone">
                <span class="material-symbols-outlined meta-icon text-purple">call</span>
                <span>{{ customer.phone }}</span>
              </span>
              <span class="meta-dot" *ngIf="customer.phone && customer.email">•</span>
              <span class="meta-item" *ngIf="customer.email">
                <span class="material-symbols-outlined meta-icon text-blue">mail</span>
                <span>{{ customer.email }}</span>
              </span>
              <span class="meta-dot" *ngIf="(customer.phone || customer.email) && customer.address">•</span>
              <span class="meta-item" *ngIf="customer.address">
                <span class="material-symbols-outlined meta-icon text-emerald">location_on</span>
                <span>{{ customer.address }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <button
            type="button"
            (click)="startPosOrder()"
            class="hero-btn btn-pos"
            title="Start POS order for this customer"
          >
            <span class="material-symbols-outlined">point_of_sale</span>
            <span>Start POS Order</span>
          </button>

          <button
            type="button"
            (click)="openEditModal()"
            class="hero-btn btn-edit"
            title="Edit Customer Profile"
          >
            <span class="material-symbols-outlined">edit</span>
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            (click)="deleteCustomer()"
            class="hero-btn btn-delete"
            title="Delete Customer"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </header>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. TOP KPI METRICS STRIP                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <section *ngIf="customer && !isLoading" class="kpi-grid">
        <div class="kpi-card kpi-visits">
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">repeat</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Lifetime Visits</span>
            <div class="kpi-val">{{ analytics?.summary?.total_orders ?? customer.total_visits ?? 0 }} <small>visits</small></div>
            <span class="kpi-sub">{{ analytics?.summary?.frequency_category || 'REGULAR' }} Guest</span>
          </div>
        </div>

        <div class="kpi-card kpi-spend">
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Gross Lifetime Spent</span>
            <div class="kpi-val text-emerald-600">{{ (analytics?.summary?.total_spent ?? customer.total_spent ?? 0) | appCurrency:'1.0-0' }}</div>
            <span class="kpi-sub">Total revenue contribution</span>
          </div>
        </div>

        <div class="kpi-card kpi-avg">
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">analytics</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Average Order Value</span>
            <div class="kpi-val text-purple-700">{{ (analytics?.summary?.avg_order_value ?? customer.avg_order_value ?? 0) | appCurrency:'1.0-0' }}</div>
            <span class="kpi-sub">Per dine-in ticket average</span>
          </div>
        </div>

        <div class="kpi-card kpi-loyalty">
          <div class="kpi-icon-box">
            <span class="material-symbols-outlined">military_tech</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-label">Loyalty Balance</span>
            <div class="kpi-val text-amber-600">{{ customer.loyalty_points || 0 }} <small>pts</small></div>
            <span class="kpi-sub">Reward points available</span>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. TAB NAVIGATION STRIP                                         -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <nav *ngIf="customer && !isLoading" class="tab-nav-bar" role="tablist">
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab === 'analytics'"
          (click)="activeTab = 'analytics'"
          class="tab-btn"
          [class.active]="activeTab === 'analytics'"
        >
          <span class="material-symbols-outlined">insights</span>
          <span>360° Analytics &amp; Insights</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab === 'history'"
          (click)="activeTab = 'history'"
          class="tab-btn"
          [class.active]="activeTab === 'history'"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          <span>Order &amp; Purchase History</span>
          <span class="tab-badge" *ngIf="purchaseHistory.length">{{ purchaseHistory.length }}</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab === 'notes'"
          (click)="activeTab = 'notes'"
          class="tab-btn"
          [class.active]="activeTab === 'notes'"
        >
          <span class="material-symbols-outlined">edit_note</span>
          <span>Notes &amp; Dietary Preferences</span>
          <span class="tab-badge" *ngIf="customerNotes.length">{{ customerNotes.length }}</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab === 'timeline'"
          (click)="activeTab = 'timeline'"
          class="tab-btn"
          [class.active]="activeTab === 'timeline'"
        >
          <span class="material-symbols-outlined">history</span>
          <span>Activity Timeline</span>
        </button>

        <button
          type="button"
          role="tab"
          [attr.aria-selected]="activeTab === 'profile'"
          (click)="activeTab = 'profile'"
          class="tab-btn"
          [class.active]="activeTab === 'profile'"
        >
          <span class="material-symbols-outlined">person</span>
          <span>Profile Details</span>
        </button>
      </nav>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. TAB CONTENT PANELS                                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <main *ngIf="customer && !isLoading" class="tab-content-container">
        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- TAB 1: 360° ANALYTICS                                        -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section *ngIf="activeTab === 'analytics'" class="space-y-6">
          <!-- RFM Recency & Retention Summary -->
          <div class="content-card">
            <h3 class="card-section-title">
              <span class="material-symbols-outlined text-purple">schedule</span>
              Recency, Frequency &amp; Retention Analytics
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <div class="stat-box">
                <span class="stat-label">First Visit (Member Since)</span>
                <strong class="stat-val font-mono">
                  {{ (analytics?.summary?.first_visit_at || customer.created_at) | date:'mediumDate' }}
                </strong>
                <span class="stat-sub">Joined customer directory</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Last Order / Dine-in</span>
                <strong class="stat-val font-mono">
                  {{ (analytics?.summary?.last_visit_at || customer.last_visit_at || customer.created_at) | date:'mediumDate' }}
                </strong>
                <span class="stat-sub text-purple-700 font-bold">
                  {{ analytics?.summary?.days_since_last_visit ?? customer.days_since_last_visit ?? 0 }} days ago
                </span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Customer Activity State</span>
                <strong class="stat-val text-emerald-700">
                  {{ customer.activity_status || 'ACTIVE' }}
                </strong>
                <span class="stat-sub">Calculated dining cadence</span>
              </div>
            </div>
          </div>

          <!-- Dual Section: Favorite Dishes & Monthly Trends -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Favorite Dishes (Top Ordered Items) -->
            <div class="content-card">
              <div class="card-header-flex">
                <h3 class="card-section-title mb-0">
                  <span class="material-symbols-outlined text-amber-500">stars</span>
                  Favorite Dishes (Top Ordered)
                </h3>
                <span class="text-xs text-slate-400">Ranked by frequency</span>
              </div>

              <div *ngIf="!analytics?.favorite_items?.length" class="empty-tab-state">
                <span class="material-symbols-outlined text-4xl text-purple-200">restaurant</span>
                <p>No dish order history recorded yet for this customer.</p>
              </div>

              <div *ngIf="analytics?.favorite_items?.length" class="space-y-3 mt-3">
                <div
                  *ngFor="let item of analytics?.favorite_items; let i = index"
                  class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 font-bold text-xs flex items-center justify-center">
                      #{{ i + 1 }}
                    </span>
                    <div>
                      <div class="font-bold text-xs text-slate-800 dark:text-slate-200">{{ item.product_name }}</div>
                      <div class="text-[11px] text-slate-400">
                        Ordered <strong>{{ item.total_qty }}x</strong> • Last: {{ item.last_ordered_at | date:'shortDate' }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono font-bold text-xs text-emerald-600">{{ item.total_spent | appCurrency:'1.0-0' }}</div>
                    <span class="text-[10px] text-slate-400">Total spent</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monthly Spending Breakdown -->
            <div class="content-card">
              <div class="card-header-flex">
                <h3 class="card-section-title mb-0">
                  <span class="material-symbols-outlined text-emerald-600">monitoring</span>
                  Monthly Spending Trends
                </h3>
                <span class="text-xs text-slate-400">Past orders</span>
              </div>

              <div *ngIf="!analytics?.monthly_spending?.length" class="empty-tab-state">
                <span class="material-symbols-outlined text-4xl text-purple-200">calendar_month</span>
                <p>No historical monthly spend trends available yet.</p>
              </div>

              <div *ngIf="analytics?.monthly_spending?.length" class="space-y-3 mt-3">
                <div
                  *ngFor="let m of analytics?.monthly_spending"
                  class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                >
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-sm">event</span>
                    <span class="font-bold text-xs font-mono text-slate-700 dark:text-slate-300">{{ m.month_key }}</span>
                    <span class="text-[11px] text-slate-400">({{ m.order_count }} orders)</span>
                  </div>
                  <div class="font-mono font-bold text-xs text-emerald-600">
                    {{ m.total_spent | appCurrency:'1.0-0' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- TAB 2: ORDER & PURCHASE HISTORY                              -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section *ngIf="activeTab === 'history'" class="space-y-4">
          <div class="content-card p-0 overflow-hidden">
            <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">Order &amp; Purchase History</h3>
                <p class="text-xs text-slate-400">All registered invoices and dining receipts</p>
              </div>
              <button type="button" (click)="startPosOrder()" class="action-btn btn-gradient-purple">
                <span class="material-symbols-outlined">add_shopping_cart</span>
                <span>New POS Ticket</span>
              </button>
            </div>

            <div *ngIf="!purchaseHistory.length && !isLoadingHistory" class="empty-tab-state py-12">
              <span class="material-symbols-outlined text-5xl text-purple-200">receipt_long</span>
              <div class="font-bold text-slate-700 dark:text-slate-300 mt-2">No Invoices Found</div>
              <p class="text-xs text-slate-400 mt-1">This customer has not placed any recorded POS orders yet.</p>
              <button type="button" (click)="startPosOrder()" class="action-btn btn-outline-purple mt-3">
                <span class="material-symbols-outlined">point_of_sale</span>
                <span>Create First Order</span>
              </button>
            </div>

            <div *ngIf="purchaseHistory.length" class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date &amp; Time</th>
                    <th>Type</th>
                    <th>Payment Method</th>
                    <th>Items</th>
                    <th class="text-right">Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let ord of purchaseHistory">
                    <td class="font-mono font-bold text-purple-700">
                      #{{ ord.order_number || ('ORD-' + ord.id) }}
                    </td>
                    <td class="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {{ ord.created_at | date:'dd MMM yyyy, hh:mm a' }}
                    </td>
                    <td>
                      <span class="service-pill" [ngClass]="ord.order_type?.toLowerCase() || 'dine_in'">
                        {{ ord.order_type || 'DINE_IN' }}
                      </span>
                    </td>
                    <td class="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {{ ord.payment_method || 'CASH' }}
                    </td>
                    <td class="text-xs text-slate-600 dark:text-slate-300">
                      {{ ord.items_count || ord.total_items || '—' }} items
                    </td>
                    <td class="text-right font-mono font-bold text-emerald-600">
                      {{ ord.total_amount | appCurrency:'1.0-0' }}
                    </td>
                    <td>
                      <span class="badge-status-completed">
                        {{ ord.status || 'COMPLETED' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- TAB 3: NOTES & DIETARY PREFERENCES                           -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section *ngIf="activeTab === 'notes'" class="space-y-6">
          <!-- Add Note Form -->
          <div class="content-card">
            <h3 class="card-section-title">
              <span class="material-symbols-outlined text-purple">add_comment</span>
              Add Staff Note / Preference
            </h3>
            <form (ngSubmit)="saveNote()" class="space-y-3 mt-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="form-label">Note Category *</label>
                  <app-custom-dropdown
                    [options]="noteTypeOptions"
                    [(ngModel)]="newNoteForm.note_type"
                    name="note_type"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
                <div class="sm:col-span-2">
                  <label class="form-label">Note Description / Dietary Allergy *</label>
                  <input
                    type="text"
                    [(ngModel)]="newNoteForm.note_text"
                    name="note_text"
                    placeholder="e.g. Nut allergy, prefers window table, VIP birthday on 12th Oct..."
                    required
                    class="form-control"
                  />
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="isSavingNote || !newNoteForm.note_text.trim()"
                  class="action-btn btn-gradient-purple"
                >
                  <span class="material-symbols-outlined">save</span>
                  <span>{{ isSavingNote ? 'Saving…' : 'Record Note' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Notes List -->
          <div class="content-card">
            <h3 class="card-section-title">
              <span class="material-symbols-outlined text-purple">format_list_bulleted</span>
              Recorded Preferences &amp; Dietary Guidelines ({{ customerNotes.length }})
            </h3>

            <div *ngIf="!customerNotes.length && !isLoadingNotes" class="empty-tab-state">
              <span class="material-symbols-outlined text-4xl text-purple-200">note_alt</span>
              <p>No notes or dietary alerts added for this guest yet.</p>
            </div>

            <div *ngIf="customerNotes.length" class="space-y-3 mt-3">
              <div
                *ngFor="let n of customerNotes"
                class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="note-type-pill" [ngClass]="n.note_type?.toLowerCase()">
                      {{ n.note_type }}
                    </span>
                    <span class="text-xs text-slate-400 font-mono">
                      {{ n.created_at | date:'dd MMM yyyy, hh:mm a' }}
                    </span>
                    <span *ngIf="n.author_name || n.user_full_name" class="text-xs text-slate-500">
                      • by <strong>{{ n.author_name || n.user_full_name }}</strong>
                    </span>
                  </div>
                  <p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {{ n.note_text }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="deleteNote(n.id)"
                  class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Note"
                >
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- TAB 4: ACTIVITY TIMELINE                                     -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section *ngIf="activeTab === 'timeline'" class="space-y-6">
          <div class="content-card">
            <h3 class="card-section-title">
              <span class="material-symbols-outlined text-purple">history</span>
              Customer Journey &amp; Activity Timeline
            </h3>

            <div class="timeline-track mt-6">
              <!-- First Registration Milestone -->
              <div class="timeline-item">
                <div class="timeline-marker bg-purple-100 text-purple-700 border-purple-300">
                  <span class="material-symbols-outlined text-sm">person_add</span>
                </div>
                <div class="timeline-box">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs text-slate-800 dark:text-slate-200">Registered in System</strong>
                    <span class="text-[11px] font-mono text-slate-400">{{ customer.created_at | date:'mediumDate' }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Profile created as #{{ customer.customer_code || ('CUST-' + customer.id) }}.</p>
                </div>
              </div>

              <!-- Last Visit Milestone -->
              <div class="timeline-item" *ngIf="customer.last_visit_at">
                <div class="timeline-marker bg-emerald-100 text-emerald-700 border-emerald-300">
                  <span class="material-symbols-outlined text-sm">restaurant</span>
                </div>
                <div class="timeline-box">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs text-slate-800 dark:text-slate-200">Most Recent Dining Visit</strong>
                    <span class="text-[11px] font-mono text-slate-400">{{ customer.last_visit_at | date:'mediumDate' }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Completed order at restaurant. Lifetime visits: {{ customer.total_visits }}.</p>
                </div>
              </div>

              <!-- Notes added -->
              <div class="timeline-item" *ngFor="let n of customerNotes">
                <div class="timeline-marker bg-amber-100 text-amber-700 border-amber-300">
                  <span class="material-symbols-outlined text-sm">note</span>
                </div>
                <div class="timeline-box">
                  <div class="flex items-center justify-between">
                    <strong class="text-xs text-slate-800 dark:text-slate-200">{{ n.note_type }} Note Logged</strong>
                    <span class="text-[11px] font-mono text-slate-400">{{ n.created_at | date:'shortDate' }}</span>
                  </div>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">"{{ n.note_text }}"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- TAB 5: PROFILE DETAILS                                       -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section *ngIf="activeTab === 'profile'" class="space-y-6">
          <div class="content-card">
            <div class="card-header-flex">
              <h3 class="card-section-title mb-0">
                <span class="material-symbols-outlined text-purple">badge</span>
                Complete Customer Information
              </h3>
              <button type="button" (click)="openEditModal()" class="action-btn btn-outline-purple">
                <span class="material-symbols-outlined">edit</span>
                <span>Edit Details</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div class="detail-cell">
                <span class="detail-label">Full Name</span>
                <strong class="detail-val">{{ customer.name }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Customer Code</span>
                <strong class="detail-val font-mono text-purple-700">#{{ customer.customer_code || ('CUST-' + customer.id) }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Phone Number</span>
                <strong class="detail-val font-mono">{{ customer.phone || '—' }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Email Address</span>
                <strong class="detail-val">{{ customer.email || '—' }}</strong>
              </div>

              <div class="detail-cell sm:col-span-2">
                <span class="detail-label">Address / Locality</span>
                <strong class="detail-val">{{ customer.address || '—' }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Account Status</span>
                <strong class="detail-val" [class.text-emerald-600]="customer.status === 'ACTIVE'">{{ customer.status }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Loyalty Tier</span>
                <strong class="detail-val text-purple-700">{{ getTier(customer) }}</strong>
              </div>

              <div class="detail-cell">
                <span class="detail-label">Registration Date</span>
                <strong class="detail-val font-mono">{{ customer.created_at | date:'dd MMM yyyy, hh:mm a' }}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 6. EDIT CUSTOMER MODAL                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="showEditModal" class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Edit Customer Profile</h3>
              <p class="modal-subtitle">Update contact details and loyalty profile</p>
            </div>
            <button type="button" (click)="closeEditModal()" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveCustomerEdit()" class="modal-body space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Customer Code</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.customer_code"
                  name="customer_code"
                  placeholder="e.g. CUST-0001"
                  class="form-control font-mono"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input
                  type="text"
                  [(ngModel)]="editForm.name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  required
                  class="form-control font-bold"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  name="phone"
                  placeholder="e.g. +91 9876543210"
                  required
                  class="form-control font-mono"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="editForm.email"
                  name="email"
                  placeholder="e.g. guest@example.com"
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Address / Locality</label>
              <textarea
                [(ngModel)]="editForm.address"
                name="address"
                rows="2"
                placeholder="e.g. Flat 402, Green Valley Apartments, Mumbai"
                class="form-control"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Profile Photo</label>
              <app-image-upload
                [(ngModel)]="editForm.image_url"
                name="image_url"
                folder="customers"
              ></app-image-upload>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeEditModal()" class="action-btn btn-outline-purple">
                Cancel
              </button>
              <button type="submit" [disabled]="isSavingCustomer" class="action-btn btn-gradient-purple">
                <span class="material-symbols-outlined">save</span>
                <span>{{ isSavingCustomer ? 'Saving…' : 'Save Changes' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customer-detail-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Breadcrumbs */
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .breadcrumb-link {
      color: var(--primary, #7e22ce);
      text-decoration: none;
      font-weight: 600;
    }
    .breadcrumb-link:hover {
      text-decoration: underline;
    }
    .breadcrumb-sep {
      color: var(--card-border, #e9d5ff);
    }
    .breadcrumb-current {
      font-weight: 700;
      color: var(--text-main, #0f172a);
    }

    /* Hero Header */
    .hero-header-card {
      background: var(--card-bg, #ffffff);
      border: 1.5px solid var(--card-border, #e9d5ff);
      border-radius: 18px;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    }
    .hero-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .back-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1.5px solid var(--card-border, #e9d5ff);
      background: var(--card-bg, #ffffff);
      color: var(--primary, #7e22ce);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .back-btn:hover {
      background: var(--primary-light, #f3e8ff);
      transform: translateX(-2px);
    }
    .hero-avatar {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary-light, #f3e8ff), rgba(126, 34, 206, 0.2));
      border: 2px solid var(--primary, #7e22ce);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }
    .hero-avatar .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 14px;
    }
    .hero-avatar .avatar-initials {
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--primary, #7e22ce);
    }
    .online-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #16a34a;
      border: 2px solid #ffffff;
    }
    .hero-identity {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .hero-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .hero-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      margin: 0;
    }
    .cust-code-tag {
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary, #7e22ce);
      background: var(--primary-light, #f3e8ff);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .tier-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .activity-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .hero-meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      flex-wrap: wrap;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .meta-icon {
      font-size: 14px;
    }
    .text-purple { color: #7e22ce; }
    .text-blue { color: #2563eb; }
    .text-emerald { color: #16a34a; }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.875rem;
      border-radius: 10px;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s ease;
    }
    .hero-btn .material-symbols-outlined {
      font-size: 17px;
    }
    .btn-pos {
      background: linear-gradient(135deg, #7e22ce, #6b21a8);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(126, 34, 206, 0.25);
    }
    .btn-pos:hover {
      background: linear-gradient(135deg, #9333ea, #7e22ce);
      transform: translateY(-1px);
    }
    .btn-edit {
      background: var(--card-bg, #ffffff);
      border-color: var(--card-border, #e9d5ff);
      color: var(--primary, #7e22ce);
    }
    .btn-edit:hover {
      background: var(--primary-light, #f3e8ff);
    }
    .btn-delete {
      background: var(--card-bg, #ffffff);
      border-color: #fecdd3;
      color: #dc2626;
    }
    .btn-delete:hover {
      background: #fee2e2;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: var(--card-bg, #ffffff);
      border: 1.5px solid var(--card-border, #e9d5ff);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .kpi-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-visits .kpi-icon-box { background: #f3e8ff; color: #7e22ce; }
    .kpi-spend .kpi-icon-box { background: #ecfdf5; color: #059669; }
    .kpi-avg .kpi-icon-box { background: #fdf4ff; color: #c026d3; }
    .kpi-loyalty .kpi-icon-box { background: #fffbeb; color: #d97706; }
    .kpi-body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .kpi-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .kpi-val {
      font-size: 1.25rem;
      font-weight: 900;
      font-family: monospace;
      color: var(--text-main, #0f172a);
    }
    .kpi-val small {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
    }
    .kpi-sub {
      font-size: 0.6875rem;
      color: var(--text-muted, #64748b);
    }

    /* Tab Navigation */
    .tab-nav-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1.5px solid var(--card-border, #e9d5ff);
      padding-bottom: 0.25rem;
      overflow-x: auto;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.65rem 1.15rem;
      border-radius: 10px 10px 0 0;
      border: none;
      background: transparent;
      color: var(--text-muted, #64748b);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      position: relative;
    }
    .tab-btn:hover {
      color: var(--primary, #7e22ce);
      background: var(--primary-light, rgba(126, 34, 206, 0.05));
    }
    .tab-btn.active {
      color: var(--primary, #7e22ce);
      background: var(--card-bg, #ffffff);
      border: 1.5px solid var(--card-border, #e9d5ff);
      border-bottom-color: var(--card-bg, #ffffff);
      margin-bottom: -1.5px;
      box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.02);
    }
    .tab-btn .material-symbols-outlined {
      font-size: 17px;
    }
    .tab-badge {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      background: var(--primary-light, #f3e8ff);
      color: var(--primary, #7e22ce);
    }

    /* Content Cards */
    .content-card {
      background: var(--card-bg, #ffffff);
      border: 1.5px solid var(--card-border, #e9d5ff);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .card-section-title {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }
    .stat-box {
      background: var(--bg-app, #f8fafc);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .stat-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
    }
    .stat-val {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
    }
    .stat-sub {
      font-size: 0.6875rem;
      color: var(--text-muted, #64748b);
    }
    .empty-tab-state {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted, #94a3b8);
      font-size: 0.8125rem;
    }

    /* Table Styles */
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .data-table th {
      background: var(--bg-app, #f8fafc);
      padding: 0.75rem 1rem;
      font-weight: 700;
      font-size: 0.6875rem;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1.5px solid var(--card-border, #e2e8f0);
      text-align: left;
    }
    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--card-border, #e2e8f0);
      vertical-align: middle;
    }
    .service-pill {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .service-pill.dine_in { background: #f3e8ff; color: #7e22ce; }
    .service-pill.takeaway { background: #e0f2fe; color: #0284c7; }
    .service-pill.delivery { background: #fef3c7; color: #d97706; }
    .badge-status-completed {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: #ecfdf5;
      color: #059669;
    }

    /* Note Types */
    .note-type-pill {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .note-type-pill.general { background: #f1f5f9; color: #475569; }
    .note-type-pill.preference { background: #fdf4ff; color: #c026d3; }
    .note-type-pill.dietary { background: #ecfdf5; color: #059669; }
    .note-type-pill.allergy { background: #fee2e2; color: #dc2626; }
    .note-type-pill.vip_request { background: #fef3c7; color: #d97706; }

    /* Timeline */
    .timeline-track {
      position: relative;
      padding-left: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .timeline-track::before {
      content: '';
      position: absolute;
      top: 8px;
      bottom: 8px;
      left: 11px;
      width: 2px;
      background: var(--card-border, #e9d5ff);
    }
    .timeline-item {
      position: relative;
    }
    .timeline-marker {
      position: absolute;
      left: -2rem;
      top: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      z-index: 1;
    }
    .timeline-box {
      background: var(--bg-app, #f8fafc);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: 12px;
      padding: 0.875rem 1rem;
    }

    /* Detail Grid */
    .detail-cell {
      background: var(--bg-app, #f8fafc);
      border: 1px solid var(--card-border, #e2e8f0);
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .detail-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
    }
    .detail-val {
      font-size: 0.875rem;
      color: var(--text-main, #0f172a);
    }

    /* Buttons */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.875rem;
      border-radius: 10px;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s ease;
    }
    .btn-gradient-purple {
      background: linear-gradient(135deg, #7e22ce, #6b21a8);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(126, 34, 206, 0.25);
    }
    .btn-gradient-purple:hover {
      background: linear-gradient(135deg, #9333ea, #7e22ce);
      transform: translateY(-1px);
    }
    .btn-outline-purple {
      background: var(--card-bg, #ffffff);
      border-color: var(--card-border, #e9d5ff);
      color: var(--primary, #7e22ce);
    }
    .btn-outline-purple:hover {
      background: var(--primary-light, #f3e8ff);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-panel {
      background: var(--card-bg, #ffffff);
      border: 1.5px solid var(--card-border, #e9d5ff);
      border-radius: 18px;
      width: 100%;
      max-width: 540px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1.5px solid var(--card-border, #e9d5ff);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      margin: 0;
    }
    .modal-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
      margin: 0.15rem 0 0;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0.25rem;
    }
    .close-btn:hover {
      background: var(--primary-light, #f3e8ff);
      color: var(--primary, #7e22ce);
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-main, #334155);
    }
    .form-control {
      padding: 0.6rem 0.875rem;
      border-radius: 10px;
      border: 1.5px solid var(--card-border, #e2e8f0);
      background: var(--bg-app, #f8fafc);
      color: var(--text-main, #0f172a);
      font-size: 0.8125rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control:focus {
      border-color: var(--primary, #7e22ce);
      box-shadow: 0 0 0 3px rgba(126, 34, 206, 0.12);
      background: #ffffff;
    }
  `],
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private notify = inject(NotificationService);
  private cartService = inject(CartService);
  public settingsService = inject(SettingsService);

  public customerId!: number;
  public customer: Customer | null = null;
  public analytics: CustomerAnalytics | null = null;
  public purchaseHistory: any[] = [];
  public customerNotes: CustomerNote[] = [];

  public isLoading = false;
  public loadError: string | null = null;
  public isLoadingHistory = false;
  public isLoadingNotes = false;

  public activeTab: CustomerTab = 'analytics';

  // New Note
  public newNoteForm = {
    note_type: 'GENERAL',
    note_text: '',
  };
  public isSavingNote = false;

  public noteTypeOptions: DropdownOption[] = [
    { value: 'GENERAL', label: 'General Note', icon: 'notes' },
    { value: 'PREFERENCE', label: 'Preference', icon: 'favorite' },
    { value: 'DIETARY', label: 'Dietary Choice', icon: 'restaurant' },
    { value: 'ALLERGY', label: 'Allergy Alert', icon: 'warning' },
    { value: 'VIP_REQUEST', label: 'VIP Request', icon: 'star' },
  ];

  // Edit Customer Modal
  public showEditModal = false;
  public isSavingCustomer = false;
  public editForm: any = {
    customer_code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    image_url: '',
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(Number(idParam))) {
      this.loadError = 'Invalid customer ID.';
      return;
    }
    this.customerId = Number(idParam);
    this.loadCustomer();
  }

  public loadCustomer(): void {
    this.isLoading = true;
    this.loadError = null;

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data) {
          this.customer = res.data;
          this.loadCustomerAnalytics();
          this.loadPurchaseHistory();
          this.loadCustomerNotes();
        } else {
          this.loadError = 'Customer record not found.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Failed to load customer profile.';
      },
    });
  }

  public loadCustomerAnalytics(): void {
    this.customerService.getCustomerAnalytics(this.customerId).subscribe({
      next: (res) => {
        if (res.data) {
          this.analytics = res.data;
        }
      },
      error: () => {},
    });
  }

  public loadPurchaseHistory(): void {
    this.isLoadingHistory = true;
    this.customerService.getPurchaseHistory(this.customerId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        this.purchaseHistory = res.data || [];
      },
      error: () => {
        this.isLoadingHistory = false;
      },
    });
  }

  public loadCustomerNotes(): void {
    this.isLoadingNotes = true;
    this.customerService.getCustomerNotes(this.customerId).subscribe({
      next: (res) => {
        this.isLoadingNotes = false;
        this.customerNotes = res.data || [];
      },
      error: () => {
        this.isLoadingNotes = false;
      },
    });
  }

  public saveNote(): void {
    if (!this.newNoteForm.note_text.trim()) return;
    this.isSavingNote = true;

    this.customerService.createCustomerNote(this.customerId, this.newNoteForm).subscribe({
      next: (res) => {
        this.isSavingNote = false;
        this.notify.success('Note saved successfully');
        if (res.data) {
          this.customerNotes.unshift(res.data);
        }
        this.newNoteForm.note_text = '';
      },
      error: (err) => {
        this.isSavingNote = false;
        this.notify.error(err?.error?.message || 'Failed to save note');
      },
    });
  }

  public deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note?')) return;
    this.customerService.deleteCustomerNote(this.customerId, noteId).subscribe({
      next: () => {
        this.customerNotes = this.customerNotes.filter((n) => n.id !== noteId);
        this.notify.success('Note removed');
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to delete note');
      },
    });
  }

  public startPosOrder(): void {
    if (!this.customer) return;
    this.cartService.selectedCustomer.set(this.customer);
    this.notify.success(`Customer ${this.customer.name} attached to new POS ticket`);
    this.router.navigate(['/pos']);
  }

  public openEditModal(): void {
    if (!this.customer) return;
    this.editForm = {
      customer_code: this.customer.customer_code || '',
      name: this.customer.name,
      phone: this.customer.phone,
      email: this.customer.email || '',
      address: this.customer.address || '',
      image_url: this.customer.image_url || '',
    };
    this.showEditModal = true;
  }

  public closeEditModal(): void {
    this.showEditModal = false;
  }

  public saveCustomerEdit(): void {
    if (!this.editForm.name.trim() || !this.editForm.phone.trim()) {
      this.notify.warning('Please enter guest name and phone number');
      return;
    }
    this.isSavingCustomer = true;

    this.customerService.updateCustomer(this.customerId, this.editForm).subscribe({
      next: (res) => {
        this.isSavingCustomer = false;
        this.notify.success('Customer profile updated');
        if (res.data) {
          this.customer = res.data;
        }
        this.closeEditModal();
      },
      error: (err) => {
        this.isSavingCustomer = false;
        this.notify.error(err?.error?.message || 'Failed to update customer');
      },
    });
  }

  public deleteCustomer(): void {
    if (!this.customer) return;
    if (!confirm(`Are you sure you want to delete customer "${this.customer.name}"?`)) return;

    this.customerService.deleteCustomer(this.customerId).subscribe({
      next: () => {
        this.notify.success('Customer deleted successfully');
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to delete customer');
      },
    });
  }

  public goBack(): void {
    this.router.navigate(['/customers']);
  }

  public getInitials(name: string): string {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  public getTier(c: Customer): string {
    const spend = c.total_spent || 0;
    const visits = c.total_visits || 0;
    if (spend >= 5000 || visits >= 10) return 'VIP Club';
    if (spend >= 2500 || visits >= 5) return 'Frequent Diner';
    if (spend >= 1000 || visits >= 2) return 'Regular Guest';
    return 'New Guest';
  }

  public getTierBg(c: Customer): string {
    const tier = this.getTier(c);
    if (tier === 'VIP Club' || tier.includes('VIP')) return 'linear-gradient(135deg, #7E22CE, #9333EA)';
    if (tier === 'Frequent Diner' || tier.includes('Gold')) return 'linear-gradient(135deg, #D97706, #B45309)';
    if (tier === 'Regular Guest' || tier.includes('Regular')) return 'linear-gradient(135deg, #0D9488, #0F766E)';
    return 'linear-gradient(135deg, #4F46E5, #4338CA)';
  }

  public getTierColor(c: Customer): string {
    return '#FFFFFF';
  }

  public getActivityBadge(c: Customer): { label: string; bg: string; color: string; icon: string } {
    const status = c.activity_status;
    if (status === 'FREQUENT') {
      return { label: 'Frequent Guest', bg: '#DCFCE7', color: '#15803D', icon: 'favorite' };
    }
    if (status === 'AT_RISK') {
      return { label: 'At-Risk (Dormant)', bg: '#FEE2E2', color: '#B91C1C', icon: 'warning' };
    }
    if (status === 'NEW' || (c.total_visits || 0) <= 1) {
      return { label: 'New Diner', bg: '#E0E7FF', color: '#4338CA', icon: 'waving_hand' };
    }
    return { label: 'Active Regular', bg: '#EDE9FE', color: '#6D28D9', icon: 'check_circle' };
  }
}

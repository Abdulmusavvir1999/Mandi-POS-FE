import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DraftBillService } from '../../core/services/draft-bill.service';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { DraftBill, Product } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import {
  CustomDropdownComponent,
  DropdownOption,
} from '../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-draft-bills',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppCurrencyPipe,
    PageLoaderComponent,
    CustomDropdownComponent,
  ],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading held bills…"
        subMessage="Fetching carts currently on hold."
        icon="receipt_long"
        (retry)="loadDrafts()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Point of Sale</span>
        <span class="breadcrumb-separator">›</span>
        <span>Parked Carts</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Draft &amp; Held Bills</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">pause_circle</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Draft &amp; Held Bills</h1>
              <!-- Always carries a state modifier: the base .status-dot-pill
                   sets no colours, so an unmodified pill renders unstyled.
                   Parked carts are money not yet taken, hence warning. -->
              <span
                class="status-dot-pill"
                [class.is-warning]="drafts.length > 0"
                [class.is-inactive]="drafts.length === 0"
              >
                <span class="status-dot"></span>
                <span>{{ drafts.length }} On Hold</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">savings</span>
                <span>Parked Value: <strong>{{ totalHeldValue | appCurrency:'1.0-0' }}</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">schedule</span>
                <span>Oldest Hold: <strong>{{ oldestHoldLabel }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadDrafts()"
            class="action-btn btn-outline-purple"
            title="Refresh held bills"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="goToPos()"
            class="action-btn btn-gradient-purple"
            title="Open the billing counter"
          >
            <span class="material-symbols-outlined">point_of_sale</span>
            <span>Back to Counter</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. KPI METRIC STRIP                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Bills On Hold</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">pause_circle</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ drafts.length }}</span>
            <span class="kpi-pill pill-purple">Parked</span>
          </div>
        </div>

        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Locked Value</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">savings</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ totalHeldValue | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-amber">Unsettled</span>
          </div>
        </div>

        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Dishes Parked</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">restaurant_menu</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ totalHeldItems }}</span>
            <span class="kpi-pill pill-blue">Line Items</span>
          </div>
        </div>

        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Cart Size</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ averageHeldValue | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-success">Average</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. FILTER & SEARCH TOOLBAR                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search held bills"
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search draft #, guest, table, cashier..."
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchQuery"
              type="button"
              (click)="searchQuery = ''"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <app-custom-dropdown
            [options]="orderTypeOptions"
            [(ngModel)]="selectedOrderType"
            placeholder="All Order Types"
            minWidth="190px"
          ></app-custom-dropdown>

          <!-- sm:block deliberately, not sm:inline-block: the stylesheet
               defines sm:flex, sm:block, sm:hidden and sm:inline only, so
               sm:inline-block would never re-show this after "hidden". -->
          <span class="toolbar-meta-count hidden sm:block">
            Displaying {{ filteredDrafts.length }} of {{ drafts.length }} held bills
          </span>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. HELD BILL CARDS                                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="drafts-grid" *ngIf="filteredDrafts.length > 0">
        <article class="draft-card" *ngFor="let draft of filteredDrafts">
          <!-- Card header -->
          <header class="draft-card-head">
            <div class="draft-id-group">
              <span class="draft-number">{{ draft.draft_number }}</span>
              <span class="draft-type-chip">
                <span class="material-symbols-outlined">{{ orderTypeIcon(draft.order_type) }}</span>
                <span>{{ orderTypeLabel(draft.order_type) }}</span>
              </span>
            </div>
            <span class="hold-badge">
              <span class="hold-dot"></span>
              <span>On Hold</span>
            </span>
          </header>

          <!-- Card body -->
          <div class="draft-card-body">
            <div class="draft-detail-row">
              <span class="material-symbols-outlined detail-icon">person</span>
              <span class="detail-label">Guest</span>
              <span class="detail-value">{{ draft.customer_name || 'Walk-in guest' }}</span>
            </div>

            <div class="draft-detail-row" *ngIf="draft.table_number">
              <span class="material-symbols-outlined detail-icon">table_restaurant</span>
              <span class="detail-label">Table</span>
              <span class="detail-value is-accent">{{ draft.table_number }}</span>
            </div>

            <div class="draft-detail-row">
              <span class="material-symbols-outlined detail-icon">badge</span>
              <span class="detail-label">Held by</span>
              <span class="detail-value">{{ draft.created_by_name || 'Unknown' }}</span>
            </div>

            <div class="draft-detail-row">
              <span class="material-symbols-outlined detail-icon">schedule</span>
              <span class="detail-label">Held at</span>
              <span class="detail-value">{{ draft.created_at | date: 'dd MMM yyyy, HH:mm' }}</span>
            </div>

            <p class="draft-note" *ngIf="draft.notes">
              <span class="material-symbols-outlined">sticky_note_2</span>
              <span>{{ draft.notes }}</span>
            </p>
          </div>

          <!-- Totals -->
          <div class="draft-total-strip">
            <div class="total-left">
              <span class="material-symbols-outlined">shopping_basket</span>
              <span>{{ draft.item_count }} {{ draft.item_count === 1 ? 'dish' : 'dishes' }}</span>
            </div>
            <div class="total-right">
              <span class="total-caption">Cart total</span>
              <span class="total-amount">{{ draft.subtotal | appCurrency: '1.0-0' }}</span>
            </div>
          </div>

          <!-- Card actions -->
          <footer class="draft-card-actions">
            <button
              type="button"
              class="draft-btn is-danger"
              (click)="deleteDraft(draft)"
              [title]="'Discard ' + draft.draft_number"
            >
              <span class="material-symbols-outlined">delete</span>
              <span>Discard</span>
            </button>

            <button
              type="button"
              class="draft-btn is-primary"
              (click)="resumeDraft(draft.id)"
              [title]="'Resume ' + draft.draft_number + ' at the counter'"
            >
              <span class="material-symbols-outlined">play_arrow</span>
              <span>Resume to POS</span>
            </button>
          </footer>
        </article>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. EMPTY STATE                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="drafts-empty-card" *ngIf="!isLoading && !loadError && filteredDrafts.length === 0">
        <div class="empty-state-box">
          <span class="material-symbols-outlined empty-icon">
            {{ drafts.length === 0 ? 'receipt_long' : 'filter_alt_off' }}
          </span>
          <div class="empty-title">
            {{ drafts.length === 0 ? 'No bills are on hold' : 'No held bills match this filter' }}
          </div>
          <p class="empty-desc">
            {{
              drafts.length === 0
                ? 'When a cashier parks a cart at the counter, it waits here until it is resumed or discarded.'
                : 'Try a different search term or order type.'
            }}
          </p>

          <button
            *ngIf="drafts.length === 0"
            type="button"
            (click)="goToPos()"
            class="action-btn btn-gradient-purple mt-2"
          >
            <span class="material-symbols-outlined">point_of_sale</span>
            <span>Go to Counter</span>
          </button>

          <button
            *ngIf="drafts.length > 0"
            type="button"
            (click)="resetFilters()"
            class="action-btn btn-outline-purple mt-2"
          >
            <span class="material-symbols-outlined">filter_alt_off</span>
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* The cards are the only markup this page does not share with the other
         modules, so they are the only thing styled here. Everything else —
         header card, KPI strip, toolbar, empty state — uses the global design
         system classes, and every colour below is a theme token so the page
         follows the palette chosen in Settings. */

      .drafts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
        gap: 1.1rem;
      }

      .draft-card {
        display: flex;
        flex-direction: column;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-left: 4px solid var(--primary, #7e22ce);
        border-radius: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .draft-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary-hover, #c084fc);
        box-shadow: 0 10px 26px -6px var(--primary-glow, rgba(126, 34, 206, 0.28));
      }

      /* ── Header ───────────────────────────────────────────────── */
      .draft-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.6rem;
        padding: 0.9rem 1rem 0.75rem;
        border-bottom: 1px solid var(--card-border, #f1e8fb);
      }

      .draft-id-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
      }

      .draft-number {
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 0.875rem;
        font-weight: 800;
        color: var(--primary, #7e22ce);
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .draft-type-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        align-self: flex-start;
        padding: 0.12rem 0.5rem;
        border-radius: 9999px;
        background: var(--primary-light, rgba(126, 34, 206, 0.1));
        color: var(--primary, #7e22ce);
        font-size: 0.6875rem;
        font-weight: 700;
      }

      .draft-type-chip .material-symbols-outlined {
        font-size: 14px;
      }

      .hold-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        flex-shrink: 0;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        background: rgba(217, 119, 6, 0.12);
        color: #b45309;
        border: 1px solid rgba(217, 119, 6, 0.25);
        font-size: 0.6875rem;
        font-weight: 800;
      }

      .hold-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #d97706;
        animation: holdPulse 1.8s ease-in-out infinite;
      }

      @keyframes holdPulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.35;
        }
      }

      /* ── Body ─────────────────────────────────────────────────── */
      .draft-card-body {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0.85rem 1rem;
        flex: 1 1 auto;
      }

      .draft-detail-row {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.75rem;
      }

      .detail-icon {
        font-size: 16px;
        color: var(--text-dim, #94a3b8);
        flex-shrink: 0;
      }

      .detail-label {
        color: var(--text-muted, #6b7280);
        font-weight: 600;
        flex-shrink: 0;
      }

      .detail-value {
        margin-left: auto;
        font-weight: 700;
        color: var(--text-main, #2e1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .detail-value.is-accent {
        color: var(--primary, #7e22ce);
      }

      .draft-note {
        display: flex;
        align-items: flex-start;
        gap: 0.35rem;
        margin: 0.25rem 0 0;
        padding: 0.45rem 0.6rem;
        border-radius: 9px;
        background: var(--bg-app, #f8fafc);
        color: var(--text-muted, #6b7280);
        font-size: 0.7rem;
        line-height: 1.45;
      }

      .draft-note .material-symbols-outlined {
        font-size: 15px;
        flex-shrink: 0;
      }

      /* ── Totals ───────────────────────────────────────────────── */
      .draft-total-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        background: var(--primary-light, rgba(126, 34, 206, 0.07));
        border-top: 1px solid var(--card-border, #f1e8fb);
      }

      .total-left {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.725rem;
        font-weight: 700;
        color: var(--text-muted, #6b7280);
      }

      .total-left .material-symbols-outlined {
        font-size: 16px;
      }

      .total-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        line-height: 1.1;
      }

      .total-caption {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-dim, #94a3b8);
      }

      .total-amount {
        font-family: 'Roboto Mono', ui-monospace, monospace;
        font-size: 1rem;
        font-weight: 900;
        color: var(--text-main, #2e1065);
      }

      /* ── Actions ──────────────────────────────────────────────── */
      .draft-card-actions {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem 1rem 0.9rem;
      }

      .draft-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        height: 38px;
        border-radius: 10px;
        font-family: inherit;
        font-size: 0.775rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }

      .draft-btn .material-symbols-outlined {
        font-size: 17px;
      }

      .draft-btn.is-danger {
        flex: 0 0 auto;
        padding: 0 0.85rem;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        color: var(--text-muted, #6b7280);
      }

      .draft-btn.is-danger:hover {
        border-color: var(--danger, #dc2626);
        background: var(--danger-light, rgba(220, 38, 38, 0.1));
        color: var(--danger, #dc2626);
      }

      .draft-btn.is-primary {
        flex: 1 1 auto;
        padding: 0 1rem;
        border: 1.5px solid var(--primary, #7e22ce);
        background: linear-gradient(
          135deg,
          var(--primary, #7e22ce) 0%,
          var(--primary-hover, #9333ea) 100%
        );
        color: #ffffff;
      }

      .draft-btn.is-primary:hover {
        box-shadow: 0 6px 18px var(--primary-glow, rgba(126, 34, 206, 0.35));
        transform: translateY(-1px);
      }

      /* ── Empty state ──────────────────────────────────────────── */
      .drafts-empty-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      }

      @media (max-width: 640px) {
        .drafts-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .draft-card:hover,
        .draft-btn.is-primary:hover {
          transform: none;
        }
        .hold-dot {
          animation: none;
        }
      }
    `,
  ],
})
export class DraftBillsComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;

  public settingsService = inject(SettingsService);
  private draftService = inject(DraftBillService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  public drafts: DraftBill[] = [];
  public products: Product[] = [];

  public searchQuery = '';
  public selectedOrderType = '';

  public orderTypeOptions: DropdownOption[] = [
    { value: '', label: 'All Order Types', icon: 'receipt_long' },
    { value: 'DINING', label: 'Dine-In', icon: 'table_restaurant', description: 'Table seating' },
    { value: 'TAKEAWAY', label: 'Takeaway', icon: 'takeout_dining', description: 'Packed parcels' },
    { value: 'WALK_IN', label: 'Walk-In', icon: 'storefront', description: 'Quick counter' },
  ];

  ngOnInit(): void {
    this.loadDrafts();
    // Backing catalogue for restoring a held cart. A failure here is surfaced
    // by the interceptor's toast; the page itself stays usable, so it does not
    // drive the page loader.
    this.productService.getProducts(1, 100).subscribe({
      next: (res) => {
        if (res.success) this.products = res.data;
      },
      error: () => {},
    });
  }

  // ── Derived views ─────────────────────────────────────────────────

  get filteredDrafts(): DraftBill[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.drafts.filter((d) => {
      if (this.selectedOrderType && d.order_type !== this.selectedOrderType) return false;
      if (!q) return true;
      return (
        (d.draft_number || '').toLowerCase().includes(q) ||
        (d.customer_name || '').toLowerCase().includes(q) ||
        (d.table_number || '').toLowerCase().includes(q) ||
        (d.created_by_name || '').toLowerCase().includes(q)
      );
    });
  }

  get totalHeldValue(): number {
    return this.drafts.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
  }

  get totalHeldItems(): number {
    return this.drafts.reduce((sum, d) => sum + (Number(d.item_count) || 0), 0);
  }

  get averageHeldValue(): number {
    return this.drafts.length === 0 ? 0 : this.totalHeldValue / this.drafts.length;
  }

  /** Age of the longest-parked cart, or a dash when nothing is on hold. */
  get oldestHoldLabel(): string {
    if (this.drafts.length === 0) return '—';

    const oldest = this.drafts.reduce((acc, d) => {
      const t = new Date(d.created_at).getTime();
      return Number.isFinite(t) && t < acc ? t : acc;
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(oldest)) return '—';

    const minutes = Math.max(0, Math.floor((Date.now() - oldest) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  orderTypeLabel(type: string): string {
    return this.orderTypeOptions.find((o) => o.value === type)?.label || type || 'Order';
  }

  orderTypeIcon(type: string): string {
    return this.orderTypeOptions.find((o) => o.value === type)?.icon || 'receipt_long';
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedOrderType = '';
  }

  goToPos(): void {
    this.router.navigate(['/pos']);
  }

  // ── Data ──────────────────────────────────────────────────────────

  loadDrafts(): void {
    this.isLoading = true;
    this.loadError = null;
    this.draftService.getDrafts().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) this.drafts = res.data;
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load data from the server.';
      },
    });
  }

  resumeDraft(id: number): void {
    this.isLoading = true;
    this.draftService.resumeDraft(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.cartService.restoreFromDraft(res.data, this.products);
          this.notify.success(`Draft ${res.data.draft_number} resumed`);
          this.router.navigate(['/pos']);
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  deleteDraft(draft: DraftBill): void {
    this.notify.confirm({
      title: 'Discard Held Bill',
      message: `Discard ${draft.draft_number}? The ${draft.item_count} parked dish(es) worth ${draft.subtotal} will be lost.`,
      confirmText: 'Discard',
      isDestructive: true,
      onConfirm: () => {
        this.isLoading = true;
        this.draftService.deleteDraft(draft.id).subscribe({
          next: () => {
            this.notify.info('Draft deleted');
            this.loadDrafts();
          },
          error: () => {
            this.isLoading = false;
          },
        });
      },
    });
  }
}

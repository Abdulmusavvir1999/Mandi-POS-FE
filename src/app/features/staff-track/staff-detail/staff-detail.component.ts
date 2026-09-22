import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { StaffTrackService, StaffTrackFilters } from '../../../core/services/staff-track.service';
import { SettingsService } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { StaffTrackFiltersComponent } from '../staff-track-filters.component';

/**
 * One staff member's tracking record.
 *
 * Reuses the same endpoints and the same filter bar as the workspace, so a
 * figure here and the matching row on the Staff Track list are the same query
 * with a `userId` attached rather than a second implementation that could drift.
 */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageLoaderComponent,
    AppCurrencyPipe,
    StaffTrackFiltersComponent,
  ],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading staff record…"
        subMessage="Gathering this staff member's orders, revenue and activity."
        icon="person"
        (retry)="loadAll()"
      ></app-page-loader>

      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <a class="breadcrumb-link" routerLink="/staff-track">Staff Track</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ profile?.name || 'Staff Detail' }}</span>
      </div>

      <!-- ══════════ PROFILE HEADER ══════════ -->
      <div class="audit-header-card" *ngIf="profile">
        <div class="header-left">
          <img *ngIf="profile.imageUrl" class="sd-avatar-img" [src]="settingsService.assetUrl(profile.imageUrl)" [alt]="profile.name" />
          <div *ngIf="!profile.imageUrl" class="header-icon-box">{{ initials(profile.name) }}</div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">{{ profile.name }}</h1>
              <span class="badge" [ngClass]="roleBadgeClass(profile.roleName)">{{ profile.roleName }}</span>
              <span class="badge" [ngClass]="profile.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'">
                {{ humanise(profile.status) }}
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">alternate_email</span>
                <span>{{ profile.username }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">mail</span>
                <span>{{ profile.email }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">login</span>
                <span>Last login: <strong>{{ profile.lastLoginAt ? (profile.lastLoginAt | date : 'dd MMM yyyy, HH:mm') : 'Never' }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button type="button" class="audit-btn btn-outline-purple" routerLink="/staff-track">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Back</span>
          </button>
          <button type="button" class="audit-btn btn-outline-purple" (click)="loadAll()" [disabled]="isRefreshing">
            <span class="material-symbols-outlined" [class.spin-icon]="isRefreshing">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <app-staff-track-filters
        [filters]="filters"
        [showStaff]="false"
        [showRole]="false"
        [showSearch]="false"
        (filtersChange)="onFiltersChange($event)"
      ></app-staff-track-filters>

      <div class="st-inline-error" *ngIf="sectionError">
        <span class="material-symbols-outlined">error</span>
        <div>
          <div class="st-inline-error-title">Could not load this record</div>
          <div class="st-inline-error-desc">{{ sectionError }}</div>
        </div>
        <button type="button" class="audit-btn btn-outline-purple" (click)="loadAll()">
          <span class="material-symbols-outlined">refresh</span><span>Retry</span>
        </button>
      </div>

      <!-- ══════════ SUMMARY ══════════ -->
      <div class="kpi-cards-grid" *ngIf="summary">
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row"><span class="kpi-title">Orders Taken</span>
            <span class="kpi-icon-bubble bg-blue-tint"><span class="material-symbols-outlined">receipt_long</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ summary.ordersTaken }}</span>
            <span class="kpi-pill pill-blue">{{ summary.orderValue | appCurrency }}</span></div>
        </div>
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row"><span class="kpi-title">Revenue Settled</span>
            <span class="kpi-icon-bubble bg-green-tint"><span class="material-symbols-outlined">payments</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number text-green">{{ summary.revenue | appCurrency }}</span>
            <span class="kpi-pill pill-success">{{ summary.billsSettled }} bills</span></div>
        </div>
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row"><span class="kpi-title">Tables Handled</span>
            <span class="kpi-icon-bubble bg-amber-tint"><span class="material-symbols-outlined">table_restaurant</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ summary.tablesAttended }}</span>
            <span class="kpi-pill pill-amber">{{ summary.activeTables }} active</span></div>
        </div>
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row"><span class="kpi-title">Completed</span>
            <span class="kpi-icon-bubble bg-green-tint"><span class="material-symbols-outlined">check_circle</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number text-green">{{ summary.completedOrders }}</span></div>
        </div>
        <div class="kpi-card card-accent-rose">
          <div class="kpi-header-row"><span class="kpi-title">Cancelled</span>
            <span class="kpi-icon-bubble bg-rose-tint"><span class="material-symbols-outlined">cancel</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ summary.cancelledOrders }}</span></div>
        </div>
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row"><span class="kpi-title">Avg Order Value</span>
            <span class="kpi-icon-bubble bg-purple-tint"><span class="material-symbols-outlined">functions</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ summary.averageOrderValue | appCurrency }}</span></div>
        </div>
        <div class="kpi-card card-accent-teal">
          <div class="kpi-header-row"><span class="kpi-title">Avg Service Time</span>
            <span class="kpi-icon-bubble bg-teal-tint"><span class="material-symbols-outlined">timer</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ duration(summary.averageServiceSeconds) }}</span></div>
        </div>
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row"><span class="kpi-title">Items Handled</span>
            <span class="kpi-icon-bubble bg-purple-tint"><span class="material-symbols-outlined">lunch_dining</span></span></div>
          <div class="kpi-value-row"><span class="kpi-number">{{ summary.itemsHandled }}</span></div>
        </div>
      </div>

      <!-- ══════════ CURRENT ACTIVITY ══════════ -->
      <div class="saas-table-card">
        <div class="st-section-head">
          <div>
            <div class="st-section-title">Current Activity</div>
            <div class="st-section-sub">Open tables and orders attributed to this staff member right now.</div>
          </div>
          <span class="st-last-seen" *ngIf="summary?.currentActivity">
            Last action: {{ humanise(summary.currentActivity.action) }} · {{ summary.currentActivity.at | date : 'dd MMM, HH:mm' }}
          </span>
        </div>
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Table</th><th>Order</th><th>Status</th>
                <th style="text-align: right;">Amount</th><th style="text-align: right;">Open For</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of myCurrentTables()">
                <td><span class="font-bold text-xs">{{ t.tableNumber }}</span> <span class="st-muted">{{ t.tableName }}</span></td>
                <td><span class="font-mono text-xs">{{ t.order?.orderNumber || '—' }}</span></td>
                <td><span class="badge" [ngClass]="orderStatusClass(t.order?.status)">{{ humanise(t.order?.status) }}</span></td>
                <td style="text-align: right;">{{ t.order ? (t.order.totalAmount | appCurrency) : '—' }}</td>
                <td style="text-align: right;">{{ t.order ? duration(t.order.openSeconds) : '—' }}</td>
              </tr>
              <tr *ngIf="!isRefreshing && myCurrentTables().length === 0">
                <td colspan="5" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">table_restaurant</span>
                    <div class="empty-title">No tables currently assigned</div>
                    <div class="empty-desc">This staff member has no open table right now.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════ ORDER HISTORY ══════════ -->
      <div class="saas-table-card">
        <div class="st-section-head">
          <div>
            <div class="st-section-title">Order History</div>
            <div class="st-section-sub">Orders this staff member created.</div>
          </div>
          <span class="results-counter-pill" *ngIf="ordersPagination">{{ ordersPagination.total }}</span>
        </div>
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Order #</th><th>Table</th><th>Customer</th><th>Status</th><th>Payment</th>
                <th style="text-align: right;">Amount</th><th>Created</th><th style="text-align: right;">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of orders">
                <td><span class="font-mono font-bold text-xs">{{ o.orderNumber }}</span></td>
                <td>{{ o.table?.tableNumber || '—' }}</td>
                <td>{{ o.customerName || 'Walk-In' }}</td>
                <td><span class="badge" [ngClass]="orderStatusClass(o.status)">{{ humanise(o.status) }}</span></td>
                <td><span class="badge" [ngClass]="paymentBadgeClass(o.paymentStatus)">{{ humanise(o.paymentStatus) }}</span></td>
                <td style="text-align: right;" class="font-bold">{{ o.totalAmount | appCurrency }}</td>
                <td class="st-muted">{{ o.createdAt | date : 'dd MMM, HH:mm' }}</td>
                <td style="text-align: right;">{{ duration(o.durationSeconds) }}</td>
              </tr>
              <tr *ngIf="!isRefreshing && orders.length === 0">
                <td colspan="8" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">receipt_long</span>
                    <div class="empty-title">No orders found for the selected filters</div>
                    <div class="empty-desc">This staff member took no orders in this range.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination-footer-bar" *ngIf="ordersPagination && ordersPagination.total > 0">
          <div class="pagination-info">
            Page <strong>{{ ordersPagination.page }}</strong> of <strong>{{ ordersPagination.totalPages }}</strong>
          </div>
          <div class="pagination-controls">
            <button type="button" class="page-nav-btn" [disabled]="ordersPage <= 1" (click)="changeOrdersPage(ordersPage - 1)" title="Previous page">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button type="button" class="page-nav-btn" [disabled]="ordersPage >= ordersPagination.totalPages" (click)="changeOrdersPage(ordersPage + 1)" title="Next page">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ══════════ TABLE HISTORY ══════════ -->
      <div class="saas-table-card">
        <div class="st-section-head">
          <div>
            <div class="st-section-title">Table History</div>
            <div class="st-section-sub">
              Derived from this staff member's dining orders — the POS records no table assignment or transfer log.
            </div>
          </div>
        </div>
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Table</th><th>Order</th><th>Opened</th><th>Closed</th>
                <th style="text-align: right;">Duration</th><th style="text-align: center;">Items</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of tableHistory">
                <td><span class="font-bold text-xs">{{ h.table.tableNumber }}</span> <span class="st-muted">{{ h.table.name }}</span></td>
                <td><span class="font-mono text-xs">{{ h.orderNumber }}</span></td>
                <td class="st-muted">{{ h.openedAt | date : 'dd MMM, HH:mm' }}</td>
                <td class="st-muted">{{ h.closedAt ? (h.closedAt | date : 'dd MMM, HH:mm') : 'Still open' }}</td>
                <td style="text-align: right;">{{ duration(h.durationSeconds) }}</td>
                <td style="text-align: center;">{{ h.itemCount }}</td>
                <td style="text-align: right;" class="font-bold">{{ h.totalAmount | appCurrency }}</td>
              </tr>
              <tr *ngIf="!isRefreshing && tableHistory.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">restaurant</span>
                    <div class="empty-title">No table service recorded</div>
                    <div class="empty-desc">No dining orders in the selected range.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════ REVENUE HISTORY ══════════ -->
      <div class="saas-table-card">
        <div class="st-section-head">
          <div>
            <div class="st-section-title">Revenue History</div>
            <div class="st-section-sub">Bills settled by this staff member, grouped by period.</div>
          </div>
          <div class="st-report-switch">
            <button
              type="button"
              *ngFor="let p of ['daily', 'weekly', 'monthly']"
              class="st-preset-btn-lg"
              [class.is-active]="summaryPeriod === p"
              (click)="setPeriod(p)"
            >
              {{ p | titlecase }}
            </button>
          </div>
        </div>
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style="text-align: right;">Orders</th>
                <th style="text-align: right;">Bills</th>
                <th style="text-align: right;">Gross</th>
                <th style="text-align: right;">Discount</th>
                <th style="text-align: right;">Tax</th>
                <th style="text-align: right;">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of revenueHistory">
                <td class="font-mono font-bold text-xs">{{ r.bucket }}</td>
                <td style="text-align: right;">{{ r.ordersTaken }}</td>
                <td style="text-align: right;">{{ r.billsCount }}</td>
                <td style="text-align: right;">{{ r.grossSales | appCurrency }}</td>
                <td style="text-align: right;">{{ r.discountAmount | appCurrency }}</td>
                <td style="text-align: right;">{{ r.taxAmount | appCurrency }}</td>
                <td style="text-align: right;" class="font-bold text-green">{{ r.netRevenue | appCurrency }}</td>
              </tr>
              <tr *ngIf="!isRefreshing && revenueHistory.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">payments</span>
                    <div class="empty-title">No revenue in this range</div>
                    <div class="empty-desc">This staff member settled no bills.</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════ ACTIVITY HISTORY ══════════ -->
      <div class="saas-table-card">
        <div class="st-section-head">
          <div>
            <div class="st-section-title">Activity History</div>
            <div class="st-section-sub">Every recorded action, most recent first.</div>
          </div>
          <span class="results-counter-pill" *ngIf="activityPagination">{{ activityPagination.total }}</span>
        </div>
        <div class="st-timeline" style="padding: 16px 18px;">
          <div class="st-timeline-item" *ngFor="let a of activity">
            <div class="st-timeline-dot"></div>
            <div class="st-timeline-body">
              <div class="st-timeline-top">
                <span class="st-timeline-time">{{ a.at | date : 'dd MMM, HH:mm' }}</span>
                <span class="module-badge">{{ humanise(a.module) }}</span>
              </div>
              <div class="st-timeline-action">{{ humanise(a.action) }}</div>
              <div class="st-muted" *ngIf="a.orderNumber || a.billNumber">
                {{ a.orderNumber || a.billNumber }}
                <span *ngIf="a.amount !== null && a.amount !== undefined"> · {{ a.amount | appCurrency }}</span>
              </div>
            </div>
          </div>
          <div class="empty-state-box" *ngIf="!isRefreshing && activity.length === 0">
            <span class="material-symbols-outlined empty-icon">history</span>
            <div class="empty-title">No staff activity found</div>
            <div class="empty-desc">Nothing was recorded for this staff member in this range.</div>
          </div>
        </div>
        <div class="pagination-footer-bar" *ngIf="activityPagination && activityPagination.total > 0">
          <div class="pagination-info">
            Page <strong>{{ activityPagination.page }}</strong> of <strong>{{ activityPagination.totalPages }}</strong>
          </div>
          <div class="pagination-controls">
            <button type="button" class="page-nav-btn" [disabled]="activityPage <= 1" (click)="changeActivityPage(activityPage - 1)" title="Previous page">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button type="button" class="page-nav-btn" [disabled]="activityPage >= activityPagination.totalPages" (click)="changeActivityPage(activityPage + 1)" title="Next page">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .spin-icon { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

      .st-muted { color: var(--text-muted, #6B7280); font-size: 11px; }

      .sd-avatar-img {
        width: 52px; height: 52px; border-radius: 16px; object-fit: cover;
        border: 2px solid #EDE4F8; flex-shrink: 0;
      }

      .st-section-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 14px; padding: 16px 18px 12px; border-bottom: 1px solid #F1E9FB; flex-wrap: wrap;
      }
      .st-section-title { font-size: 14px; font-weight: 800; color: var(--text-main, #2E1065); }
      .st-section-sub { font-size: 11px; color: var(--text-muted, #6B7280); margin-top: 3px; max-width: 70ch; }
      .st-last-seen { font-size: 11px; color: var(--primary-variant, #6B21A8); font-weight: 700; }

      .st-inline-error {
        display: flex; align-items: center; gap: 12px;
        background: #FEF2F2; border: 1px solid var(--danger-light, #FECACA); border-radius: 14px;
        padding: 14px 16px; margin-bottom: 16px; color: #991B1B;
      }
      .st-inline-error-title { font-weight: 800; font-size: 13px; }
      .st-inline-error-desc { font-size: 11px; opacity: 0.9; }
      .st-inline-error .audit-btn { margin-left: auto; }

      .st-report-switch { display: flex; gap: 6px; }
      .st-preset-btn-lg {
        border: 1px solid var(--card-border, #E9D5FF); background: #FFFFFF; color: var(--primary-variant, #6B21A8);
        padding: 6px 13px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer;
      }
      .st-preset-btn-lg.is-active { background: var(--primary, #7E22CE); color: #FFFFFF; border-color: var(--primary, #7E22CE); }

      .st-timeline { padding-left: 6px; }
      .st-timeline-item { position: relative; padding-left: 20px; padding-bottom: 14px; border-left: 2px solid #EDE4F8; }
      .st-timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
      .st-timeline-dot {
        position: absolute; left: -6px; top: 2px; width: 10px; height: 10px;
        border-radius: 50%; background: var(--primary, #7E22CE); border: 2px solid #FFFFFF; box-shadow: 0 0 0 2px #EDE4F8;
      }
      .st-timeline-top { display: flex; align-items: center; gap: 8px; }
      .st-timeline-time { font-size: 11px; font-weight: 800; color: var(--primary, #7E22CE); font-family: ui-monospace, monospace; }
      .st-timeline-action { font-size: 12px; color: #374151; margin-top: 2px; font-weight: 600; }
    `,
  ],
})
export class StaffDetailComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private staffTrackService = inject(StaffTrackService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public staffId!: number;
  public profile: any = null;
  public summary: any = null;
  public orders: any[] = [];
  public ordersPagination: any = null;
  public ordersPage = 1;
  public tableHistory: any[] = [];
  public currentTables: any[] = [];
  public revenueHistory: any[] = [];
  public activity: any[] = [];
  public activityPagination: any = null;
  public activityPage = 1;
  public summaryPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';

  public filters: StaffTrackFilters = {};
  public isLoading = true;
  public isRefreshing = false;
  public loadError: string | null = null;
  public sectionError: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.router.navigate(['/staff-track']);
      return;
    }
    this.staffId = id;

    // A date range carried over from the workspace keeps the two views aligned.
    const qp = this.route.snapshot.queryParamMap;
    const today = this.todayLocal();
    this.filters = {
      dateFrom: qp.get('dateFrom') || today,
      dateTo: qp.get('dateTo') || today,
      userId: id,
    };

    this.loadAll();
  }

  private todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private messageFor(err: any, fallback: string): string {
    if (err?.status === 403) return 'You do not have permission to view this staff record.';
    if (err?.status === 404) return 'This staff member no longer exists.';
    return err?.error?.message || fallback;
  }

  loadAll(): void {
    this.isRefreshing = true;
    this.sectionError = null;
    const f = { ...this.filters, userId: this.staffId };

    forkJoin({
      detail: this.staffTrackService.getStaffDetail(this.staffId, f),
      orders: this.staffTrackService.getOrders(f, this.ordersPage, 25),
      tables: this.staffTrackService.getTables(f),
      revenue: this.staffTrackService.getSummaryReport(this.summaryPeriod, f),
      activity: this.staffTrackService.getActivity(f, this.activityPage, 50),
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.profile = res.detail.data?.profile || null;
        this.summary = res.detail.data?.summary || null;
        this.orders = res.orders.data || [];
        this.ordersPagination = res.orders.pagination;
        this.tableHistory = res.tables.data?.tableHistory || [];
        this.currentTables = res.tables.data?.currentTables || [];
        this.revenueHistory = res.revenue.data?.rows || [];
        this.activity = res.activity.data || [];
        this.activityPagination = res.activity.pagination;
      },
      error: (err) => {
        this.isLoading = false;
        this.isRefreshing = false;
        const msg = this.messageFor(err, 'Unable to load this staff record.');
        if (!this.profile) this.loadError = msg;
        else this.sectionError = msg;
      },
    });
  }

  onFiltersChange(f: StaffTrackFilters): void {
    this.filters = { ...this.filters, ...f, userId: this.staffId };
    this.ordersPage = 1;
    this.activityPage = 1;
    this.loadAll();
  }

  setPeriod(p: any): void {
    this.summaryPeriod = p;
    this.staffTrackService
      .getSummaryReport(this.summaryPeriod, { ...this.filters, userId: this.staffId })
      .subscribe({
        next: (r) => (this.revenueHistory = r.data?.rows || []),
        error: (err) => this.notify.error(this.messageFor(err, 'Unable to load revenue history.')),
      });
  }

  changeOrdersPage(page: number): void {
    if (page < 1 || (this.ordersPagination && page > this.ordersPagination.totalPages)) return;
    this.ordersPage = page;
    this.staffTrackService
      .getOrders({ ...this.filters, userId: this.staffId }, this.ordersPage, 25)
      .subscribe({
        next: (r) => {
          this.orders = r.data || [];
          this.ordersPagination = r.pagination;
        },
        error: (err) => this.notify.error(this.messageFor(err, 'Unable to load orders.')),
      });
  }

  changeActivityPage(page: number): void {
    if (page < 1 || (this.activityPagination && page > this.activityPagination.totalPages)) return;
    this.activityPage = page;
    this.staffTrackService
      .getActivity({ ...this.filters, userId: this.staffId }, this.activityPage, 50)
      .subscribe({
        next: (r) => {
          this.activity = r.data || [];
          this.activityPagination = r.pagination;
        },
        error: (err) => this.notify.error(this.messageFor(err, 'Unable to load activity.')),
      });
  }

  /** The tables endpoint returns the whole floor; only this person's are shown. */
  myCurrentTables(): any[] {
    return this.currentTables.filter((t) => t.attendingStaff?.id === this.staffId);
  }

  // ── Display helpers ───────────────────────────────────────────────────

  humanise(value?: string | null): string {
    if (!value) return '—';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  duration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }

  roleBadgeClass(role?: string): string {
    switch ((role || '').toUpperCase()) {
      case 'ADMIN': return 'role-badge-admin';
      case 'MANAGER': return 'role-badge-manager';
      case 'CASHIER': return 'role-badge-cashier';
      case 'STAFF': return 'role-badge-staff';
      default: return 'badge-secondary';
    }
  }

  orderStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'PENDING': return 'badge-info';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  paymentBadgeClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PAID': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'REFUNDED': return 'badge-danger';
      case 'UNBILLED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}

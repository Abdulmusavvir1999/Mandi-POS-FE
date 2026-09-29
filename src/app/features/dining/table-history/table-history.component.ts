import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DiningService, TableHistoryPage, TableHistorySummary } from '../../../core/services/dining.service';
import { DiningTable } from '../../../core/models';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../../shared/styles/default-action-buttons.styles';

type Period = 'today' | '7d' | '30d' | 'all' | 'custom';
type StatusFilter = '' | 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';

@Component({
  selector: 'app-table-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppCurrencyPipe, PageLoaderComponent, CustomDropdownComponent, DatePickerComponent],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading && !data"
        [error]="loadError"
        message="Loading table history…"
        subMessage="Fetching past dining sessions for this table."
        icon="history"
        (retry)="load()"
      ></app-page-loader>

      <div class="breadcrumbs-row">
        <span>Floor Operations</span>
        <span class="breadcrumb-separator">›</span>
        <a routerLink="/dining" class="breadcrumb-link">Dining &amp; Seating Map</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ table?.table_number || 'Table' }} History</span>
      </div>

      <ng-container *ngIf="data">
        <!-- Header -->
        <div class="module-header-card">
          <div class="header-left">
            <button type="button" class="th-back" (click)="goBack()" title="Back to Dining" aria-label="Back to Dining">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <span class="th-badge" [ngClass]="'is-' + statusKey(table?.status)">
              <small>{{ badgeCap(table) }}</small>
              <strong>{{ badgeCode(table) }}</strong>
            </span>
            <div>
              <div class="header-title-flex">
                <h1 class="page-title">{{ table?.name || table?.table_number }}</h1>
                <span class="th-status" [ngClass]="'is-' + statusKey(table?.status)"><i></i>{{ statusLabel(table?.status) }}</span>
              </div>
              <div class="header-meta-row">
                <span class="meta-item" *ngIf="table?.section">
                  <span class="material-symbols-outlined meta-icon">location_on</span>
                  <span>{{ table?.section }}</span>
                </span>
                <span class="meta-dot" *ngIf="table?.section">•</span>
                <span class="meta-item">
                  <span class="material-symbols-outlined meta-icon">group</span>
                  <span><strong>{{ table?.capacity }}</strong> seats</span>
                </span>
                <ng-container *ngIf="summary.last_session_at">
                  <span class="meta-dot">•</span>
                  <span class="meta-item">
                    <span class="material-symbols-outlined meta-icon">schedule</span>
                    <span>Last session {{ asDate(summary.last_session_at) | date: 'd MMM, h:mm a' }}</span>
                  </span>
                </ng-container>
              </div>
            </div>
          </div>
          <div class="header-action-buttons">
            <button type="button" class="action-btn btn-outline-purple" (click)="load()" [disabled]="isLoading" title="Reload history">
              <span class="material-symbols-outlined" [class.th-spin]="isLoading">refresh</span>
              <span>Refresh</span>
            </button>
            <button type="button" class="action-btn btn-gradient-purple" (click)="goBack()">
              <span class="material-symbols-outlined">table_restaurant</span>
              <span>Back to Floor</span>
            </button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="th-kpis">
          <div class="th-kpi">
            <span class="th-kpi-icon tone-primary"><span class="material-symbols-outlined">receipt_long</span></span>
            <div>
              <span class="th-kpi-label">Sessions</span>
              <strong class="th-kpi-value">{{ summary.sessions }}</strong>
              <span class="th-kpi-sub" *ngIf="summary.cancelled_sessions">{{ summary.cancelled_sessions }} cancelled</span>
              <span class="th-kpi-sub" *ngIf="!summary.cancelled_sessions">{{ periodLabel() }}</span>
            </div>
          </div>
          <div class="th-kpi">
            <span class="th-kpi-icon tone-success"><span class="material-symbols-outlined">payments</span></span>
            <div>
              <span class="th-kpi-label">Revenue</span>
              <strong class="th-kpi-value">{{ summary.revenue | appCurrency: '1.0-0' }}</strong>
              <span class="th-kpi-sub">Excludes cancelled</span>
            </div>
          </div>
          <div class="th-kpi">
            <span class="th-kpi-icon tone-info"><span class="material-symbols-outlined">shopping_bag</span></span>
            <div>
              <span class="th-kpi-label">Avg Bill</span>
              <strong class="th-kpi-value">{{ summary.avg_bill | appCurrency: '1.0-0' }}</strong>
              <span class="th-kpi-sub">Per session</span>
            </div>
          </div>
          <div class="th-kpi">
            <span class="th-kpi-icon tone-warn"><span class="material-symbols-outlined">timer</span></span>
            <div>
              <span class="th-kpi-label">Avg Turn Time</span>
              <strong class="th-kpi-value">{{ duration(summary.avg_minutes) }}</strong>
              <span class="th-kpi-sub">Seated to billed</span>
            </div>
          </div>
        </div>

        <!-- Filters + list -->
        <div class="th-panel">
          <div class="th-toolbar">
            <div class="th-chips" role="tablist" aria-label="Period">
              <button
                type="button"
                *ngFor="let p of periods"
                class="th-chip"
                [class.is-active]="period === p.key"
                (click)="setPeriod(p.key)"
              >{{ p.label }}</button>
            </div>

            <div class="th-dates" *ngIf="period === 'custom'">
              <app-date-picker
                [(ngModel)]="from"
                (valueChange)="applyFilters()"
                [max]="to || ''"
                [clearable]="false"
                label="From date"
                placeholder="From"
                minWidth="160px"
              ></app-date-picker>
              <span>to</span>
              <app-date-picker
                [(ngModel)]="to"
                (valueChange)="applyFilters()"
                [min]="from || ''"
                [clearable]="false"
                label="To date"
                placeholder="To"
                minWidth="160px"
              ></app-date-picker>
            </div>

            <div class="th-toolbar-right">
              <div class="th-select">
                <app-custom-dropdown
                  [options]="statusOptions"
                  [(ngModel)]="status"
                  (ngModelChange)="applyFilters()"
                  placeholder="All statuses"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="th-search">
                <span class="material-symbols-outlined">search</span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Order #, customer or phone"
                  [ngModel]="search"
                  (ngModelChange)="onSearch($event)"
                />
              </div>
            </div>
          </div>

          <div class="th-table-wrap" [class.is-busy]="isLoading">
            <table class="th-table" *ngIf="rows.length">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Seated</th>
                  <th>Customer</th>
                  <th>Turn Time</th>
                  <th>Payment</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th class="num">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let h of rows; trackBy: trackByOrder"
                  class="th-row-link"
                  tabindex="0"
                  (click)="openDetail(h.order_id)"
                  (keydown.enter)="openDetail(h.order_id)"
                  title="View order details"
                >
                  <td>
                    <span class="th-order">{{ h.order_number }}</span>
                    <small class="th-muted" *ngIf="h.bill_number">Bill {{ h.bill_number }}</small>
                  </td>
                  <td>
                    <span>{{ asDate(h.order_start_time) | date: 'd MMM yyyy' }}</span>
                    <small class="th-muted">{{ asDate(h.order_start_time) | date: 'h:mm a' }}<ng-container *ngIf="h.order_end_time"> – {{ asDate(h.order_end_time) | date: 'h:mm a' }}</ng-container></small>
                  </td>
                  <td>
                    <a *ngIf="h.customer_id; else walkIn" [routerLink]="['/customers', h.customer_id]" class="th-link" (click)="$event.stopPropagation()">{{ h.customer_name }}</a>
                    <ng-template #walkIn><span class="th-muted-strong">Walk-in</span></ng-template>
                    <small class="th-muted" *ngIf="h.customer_phone">{{ h.customer_phone }}</small>
                  </td>
                  <td>
                    <span class="th-dur" [ngClass]="'tier-' + tier(h.duration_minutes)">{{ duration(h.duration_minutes) }}</span>
                  </td>
                  <td>
                    <span>{{ h.payment_method || '—' }}</span>
                    <small class="th-muted" *ngIf="h.payment_status">{{ h.payment_status | titlecase }}</small>
                  </td>
                  <td>{{ h.staff_name || '—' }}</td>
                  <td>
                    <span *ngIf="h.order_status === 'COMPLETED' && !h.bill_number; else statusPill" class="th-pill st-cancelled" title="Completed without a bill - no payment was taken">Not billed</span>
                    <ng-template #statusPill>
                      <span class="th-pill" [ngClass]="'st-' + (h.order_status || '').toLowerCase()">{{ orderStatusLabel(h.order_status) }}</span>
                    </ng-template>
                  </td>
                  <td class="num"><strong>{{ h.total_amount | appCurrency: '1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="th-empty" *ngIf="!rows.length && !isLoading">
              <span class="material-symbols-outlined">event_busy</span>
              <strong>{{ hasFilters() ? 'No sessions match these filters' : 'No dining sessions yet' }}</strong>
              <p>{{ hasFilters() ? 'Try a wider date range or clear the search.' : 'Orders placed on this table will appear here once guests are seated.' }}</p>
              <button *ngIf="hasFilters()" type="button" class="action-btn btn-outline-purple" (click)="clearFilters()">Clear filters</button>
            </div>
          </div>

          <div class="pagination-footer-bar" *ngIf="total > 0">
            <div class="pagination-info">
              Showing <strong>{{ rangeStart }}</strong> to <strong>{{ rangeEnd }}</strong> of <strong>{{ total }}</strong> sessions
            </div>
            <div class="pagination-controls">
              <button type="button" class="page-nav-btn" [disabled]="page <= 1" (click)="goToPage(page - 1)" title="Previous page">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                *ngFor="let p of pageNumbers"
                class="page-num-btn"
                [class.is-active]="p === page"
                (click)="goToPage(p)"
              >{{ p }}</button>
              <button type="button" class="page-nav-btn" [disabled]="page >= totalPages" (click)="goToPage(page + 1)" title="Next page">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ═══ Order details ═══ -->
      <div class="modal-backdrop" *ngIf="detailOpen">
        <div class="modal-content td-modal">
          <div class="td-head">
            <span class="td-icon"><span class="material-symbols-outlined">receipt_long</span></span>
            <div class="td-head-text">
              <h3>{{ detail?.order?.order_number || 'Order' }}</h3>
              <p *ngIf="detail?.order as o">
                {{ asDate(o.created_at) | date: 'd MMM yyyy, h:mm a' }}
                <ng-container *ngIf="detail?.bill"> – {{ asDate(detail.bill.created_at) | date: 'h:mm a' }}</ng-container>
                <ng-container *ngIf="o.table_number"> · {{ o.table_number }}</ng-container>
              </p>
            </div>
            <span *ngIf="detail?.order" class="th-pill" [ngClass]="'st-' + (detail.order.status || '').toLowerCase()">{{ orderStatusLabel(detail.order.status) }}</span>
            <button type="button" class="modal-close-btn" (click)="closeDetail()" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="td-loading" *ngIf="detailLoading">Loading order…</div>

          <ng-container *ngIf="detail && !detailLoading">
            <div class="td-info">
              <div><span>Customer</span><strong>{{ detail.order.customer_name || 'Walk-in' }}</strong><small *ngIf="detail.order.customer_phone">{{ detail.order.customer_phone }}</small></div>
              <div><span>Staff</span><strong>{{ detail.order.staff_name || '—' }}</strong></div>
              <div><span>Turn time</span><strong>{{ duration(detailMinutes) }}</strong></div>
              <div><span>KOTs</span><strong>{{ detailRounds.length }}</strong></div>
            </div>

            <div class="td-warn" *ngIf="detail.order.status === 'COMPLETED' && !detail.bill">
              <span class="material-symbols-outlined">warning</span>
              Marked completed but never billed. No payment was taken for this order.
            </div>
            <div class="td-warn" *ngIf="detail.bill?.is_voided">
              <span class="material-symbols-outlined">block</span>
              Bill voided<ng-container *ngIf="detail.bill.void_reason">: {{ detail.bill.void_reason }}</ng-container>
            </div>

            <div class="td-rounds">
              <section class="td-round" *ngFor="let r of detailRounds">
                <header>
                  <span class="td-round-tag">{{ r.round ? 'KOT ' + r.round : 'Items' }}</span>
                  <span class="td-round-time" *ngIf="r.time">{{ asDate(r.time) | date: 'h:mm a' }}</span>
                  <span class="td-round-sum">{{ r.total | appCurrency: '1.2-2' }}</span>
                </header>
                <div class="td-line" *ngFor="let l of r.lines">
                  <span class="td-qty">{{ l.quantity }}×</span>
                  <span class="td-name">
                    <strong>{{ l.product_name }}<ng-container *ngIf="l.variant_name"> ({{ l.variant_name }})</ng-container></strong>
                    <small *ngIf="l.selected_addons?.length">+ {{ addonList(l.selected_addons) }}</small>
                    <small *ngIf="l.notes" class="is-note">Note: {{ l.notes }}</small>
                  </span>
                  <span class="td-free" *ngIf="l.is_complimentary">FREE</span>
                  <span class="td-amt">{{ l.subtotal | appCurrency: '1.2-2' }}</span>
                </div>
              </section>
              <div class="td-empty" *ngIf="!detailRounds.length">No items on this order.</div>
            </div>

            <div class="td-bill" *ngIf="detail.bill as b">
              <div class="td-bill-head">
                <strong>Bill {{ b.bill_number }}</strong>
                <span>{{ b.payment_method }} · {{ (b.payment_status || '') | titlecase }}<ng-container *ngIf="b.cashier_name"> · {{ b.cashier_name }}</ng-container></span>
              </div>
              <div class="td-bill-row"><span>Subtotal</span><span>{{ b.subtotal | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row" *ngIf="num(b.discount_amount) > 0"><span>Discount</span><span>− {{ b.discount_amount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row" *ngIf="num(b.coupon_discount) > 0"><span>Coupon {{ b.coupon_code }}</span><span>− {{ b.coupon_discount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row" *ngIf="num(b.service_charge_amount) > 0"><span>Service charge</span><span>+ {{ b.service_charge_amount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row" *ngIf="num(b.surcharge_amount) > 0"><span>Surcharge</span><span>+ {{ b.surcharge_amount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row"><span>Tax (GST)</span><span>{{ b.tax_amount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row is-total"><span>Total</span><span>{{ b.total_amount | appCurrency: '1.2-2' }}</span></div>
              <div class="td-bill-row is-sub" *ngIf="b.payment_method === 'CASH' && b.cash_tendered">
                <span>Tendered {{ b.cash_tendered | appCurrency: '1.2-2' }}</span>
                <span>Change {{ (b.change_returned || 0) | appCurrency: '1.2-2' }}</span>
              </div>
            </div>
            <div class="td-bill td-bill-none" *ngIf="!detail.bill">
              <div class="td-bill-row is-total"><span>Order total (no bill)</span><span>{{ detail.order.total_amount | appCurrency: '1.2-2' }}</span></div>
            </div>
          </ng-container>

          <div class="td-foot">
            <button type="button" class="action-btn btn-outline-purple" (click)="closeDetail()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    DEFAULT_ACTION_BUTTON_CSS,
    `
      .th-back {
        width: 40px;
        height: 40px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
        color: var(--text-main, #2E1065);
        cursor: pointer;
        transition: background 0.15s, transform 0.15s;
      }
      .th-back:hover { background: color-mix(in srgb, var(--primary, #7E22CE) 12%, var(--card-bg, #FFFFFF)); transform: translateX(-2px); }

      .th-badge {
        --tone: var(--primary, #7E22CE);
        width: 60px;
        height: 60px;
        flex: 0 0 auto;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        border-radius: 16px;
        color: #FFFFFF;
        background: linear-gradient(135deg, var(--tone) 0%, color-mix(in srgb, var(--tone) 75%, #000) 100%);
        box-shadow: 0 8px 18px -8px var(--tone);
        overflow: hidden;
      }
      .th-badge small { max-width: 52px; font-size: 8.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .th-badge strong { font-size: 22px; font-weight: 900; line-height: 1; }

      .th-badge.is-free, .th-status.is-free { --tone: #10B981; }
      .th-badge.is-busy, .th-status.is-busy { --tone: #F59E0B; }
      .th-badge.is-reserved, .th-status.is-reserved { --tone: #3B82F6; }
      .th-badge.is-cleaning, .th-status.is-cleaning { --tone: #06B6D4; }
      .th-badge.is-blocked, .th-status.is-blocked { --tone: var(--danger, #EF4444); }

      .th-status {
        --tone: var(--primary, #7E22CE);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        color: var(--tone);
        background: color-mix(in srgb, var(--tone) 15%, transparent);
      }
      .th-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--tone); }

      .th-spin { animation: th-spin 0.9s linear infinite; }
      @keyframes th-spin { to { transform: rotate(360deg); } }

      /* KPIs */
      .th-kpis {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin: 16px 0;
      }
      .th-kpi {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
      }
      .th-kpi > div { display: flex; flex-direction: column; min-width: 0; }
      .th-kpi-icon {
        --tone: var(--primary, #7E22CE);
        width: 44px;
        height: 44px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: var(--tone);
        background: color-mix(in srgb, var(--tone) 15%, transparent);
      }
      .th-kpi-icon.tone-success { --tone: #10B981; }
      .th-kpi-icon.tone-info { --tone: #3B82F6; }
      .th-kpi-icon.tone-warn { --tone: #F59E0B; }
      .th-kpi-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted, #6B7280); }
      .th-kpi-value { font-size: 1.45rem; font-weight: 900; line-height: 1.2; color: var(--text-main, #2E1065); font-variant-numeric: tabular-nums; }
      .th-kpi-sub { font-size: 11px; color: var(--text-muted, #6B7280); }

      /* Panel + toolbar */
      .th-panel {
        border-radius: 16px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #FFFFFF);
        overflow: hidden;
      }
      .th-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .th-chips {
        display: inline-flex;
        gap: 4px;
        padding: 4px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--primary, #7E22CE) 6%, var(--card-bg, #FFFFFF));
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .th-chip {
        padding: 6px 12px;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: var(--text-muted, #6B7280);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .th-chip:hover { color: var(--text-main, #2E1065); }
      .th-chip.is-active {
        color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
        box-shadow: 0 4px 10px -4px var(--primary, #7E22CE);
      }
      .th-dates { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted, #6B7280); }
      .th-dates .form-control { width: 150px; min-height: 36px; padding: 0.35rem 0.6rem; }
      .th-toolbar-right { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
      .th-select { width: 190px; }
      .th-search { position: relative; }
      .th-search .material-symbols-outlined {
        position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
        font-size: 18px; color: var(--text-muted, #6B7280); pointer-events: none;
      }
      .th-search .form-control { width: 240px; min-height: 38px; padding-left: 34px; font-size: 12.5px; }

      /* Table */
      .th-table-wrap { overflow-x: auto; transition: opacity 0.15s; }
      .th-table-wrap.is-busy { opacity: 0.55; }
      .th-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .th-table th {
        padding: 11px 16px;
        text-align: left;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--text-muted, #6B7280);
        background: color-mix(in srgb, var(--primary, #7E22CE) 5%, var(--card-bg, #FFFFFF));
        border-bottom: 1px solid var(--card-border, #E9D5FF);
        white-space: nowrap;
      }
      .th-table td {
        padding: 12px 16px;
        vertical-align: middle;
        color: var(--text-main, #2E1065);
        border-bottom: 1px solid color-mix(in srgb, var(--card-border, #E9D5FF) 70%, transparent);
      }
      .th-table td > small, .th-table td > span, .th-table td > a { display: block; }
      .th-table tbody tr:last-child td { border-bottom: none; }
      .th-table tbody tr:hover td { background: color-mix(in srgb, var(--primary, #7E22CE) 5%, transparent); }
      .th-table .num { text-align: right; white-space: nowrap; }
      .th-order { font-weight: 800; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .th-muted { margin-top: 2px; font-size: 11px; color: var(--text-muted, #6B7280); }
      .th-muted-strong { font-weight: 600; color: var(--text-muted, #6B7280); }
      .th-link { font-weight: 700; color: var(--primary, #7E22CE); text-decoration: none; }
      .th-link:hover { text-decoration: underline; }

      .th-dur, .th-pill {
        --tone: #10B981;
        display: inline-flex !important;
        align-items: center;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11.5px;
        font-weight: 800;
        white-space: nowrap;
        color: var(--tone);
        background: color-mix(in srgb, var(--tone) 14%, transparent);
      }
      .th-dur.tier-warn { --tone: #F59E0B; }
      .th-dur.tier-over { --tone: var(--danger, #EF4444); }
      .th-pill.st-completed { --tone: #10B981; }
      .th-pill.st-in_progress, .th-pill.st-pending { --tone: #F59E0B; }
      .th-pill.st-cancelled { --tone: var(--danger, #EF4444); }

      .th-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 56px 20px;
        text-align: center;
        color: var(--text-muted, #6B7280);
      }
      .th-empty .material-symbols-outlined {
        font-size: 30px;
        width: 64px;
        height: 64px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 12%, transparent);
        margin-bottom: 6px;
      }
      .th-empty strong { font-size: 15px; color: var(--text-main, #2E1065); }
      .th-empty p { margin: 0 0 8px; font-size: 12.5px; max-width: 360px; }

      .th-panel .pagination-footer-bar { border-top: 1px solid var(--card-border, #E9D5FF); }

      .th-row-link { cursor: pointer; }
      .th-row-link:focus-visible td { outline: none; background: color-mix(in srgb, var(--primary, #7E22CE) 10%, transparent); }

      /* Order details popup */
      .td-modal { width: min(94vw, 620px); max-width: 620px; }
      .td-head {
        display: flex; align-items: center; gap: 12px;
        padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .td-head-text { flex: 1; min-width: 0; }
      .td-head-text h3 {
        margin: 0; font-size: 1.05rem; font-weight: 900; color: var(--text-main, #2E1065);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .td-head-text p { margin: 2px 0 0; font-size: 12px; color: var(--text-muted, #6B7280); }
      .td-icon {
        width: 44px; height: 44px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center;
        border-radius: 12px; color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
      }
      .td-loading, .td-empty { padding: 28px; text-align: center; font-size: 13px; color: var(--text-muted, #6B7280); }

      .td-info { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
      .td-info > div {
        display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 10px 12px; border-radius: 12px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--primary, #7E22CE) 5%, var(--card-bg, #FFFFFF));
      }
      .td-info span { font-size: 10px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-muted, #6B7280); }
      .td-info strong { font-size: 13.5px; font-weight: 800; color: var(--text-main, #2E1065); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .td-info small { font-size: 11px; color: var(--text-muted, #6B7280); }

      .td-warn {
        display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 9px 12px; border-radius: 12px;
        font-size: 12.5px; font-weight: 700; color: var(--danger, #EF4444);
        background: color-mix(in srgb, var(--danger, #EF4444) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--danger, #EF4444) 35%, transparent);
      }
      .td-warn .material-symbols-outlined { font-size: 18px; }

      .td-rounds { max-height: 36vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
      .td-round { border: 1px solid var(--card-border, #E9D5FF); border-radius: 14px; overflow: hidden; }
      .td-round header {
        display: flex; align-items: center; gap: 10px; padding: 8px 12px;
        background: color-mix(in srgb, #F59E0B 10%, var(--card-bg, #FFFFFF));
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .td-round-tag { padding: 2px 9px; border-radius: 9999px; font-size: 11px; font-weight: 900; color: #F59E0B; background: color-mix(in srgb, #F59E0B 18%, transparent); }
      .td-round-time { font-size: 12px; color: var(--text-muted, #6B7280); }
      .td-round-sum { margin-left: auto; font-size: 13px; font-weight: 800; color: var(--text-main, #2E1065); }
      .td-line { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; }
      .td-line + .td-line { border-top: 1px solid color-mix(in srgb, var(--card-border, #E9D5FF) 70%, transparent); }
      .td-qty { min-width: 2.2rem; font-size: 13px; font-weight: 900; color: var(--primary, #7E22CE); }
      .td-name { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .td-name strong { font-size: 13px; font-weight: 700; color: var(--text-main, #2E1065); }
      .td-name small { font-size: 11.5px; color: var(--text-muted, #6B7280); }
      .td-name small.is-note { color: #F59E0B; font-weight: 600; }
      .td-free { padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; color: #10B981; background: color-mix(in srgb, #10B981 15%, transparent); }
      .td-amt { font-size: 13px; font-weight: 800; color: var(--text-main, #2E1065); white-space: nowrap; }

      .td-bill {
        margin-top: 12px; padding: 12px 14px; border-radius: 14px;
        border: 1px solid color-mix(in srgb, var(--primary, #7E22CE) 30%, var(--card-border, #E9D5FF));
        background: color-mix(in srgb, var(--primary, #7E22CE) 7%, var(--card-bg, #FFFFFF));
      }
      .td-bill-head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .td-bill-head strong { font-size: 13px; font-weight: 900; color: var(--text-main, #2E1065); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .td-bill-head span { font-size: 12px; color: var(--text-muted, #6B7280); }
      .td-bill-row { display: flex; justify-content: space-between; gap: 10px; padding: 3px 0; font-size: 12.5px; color: var(--text-muted, #6B7280); }
      .td-bill-row.is-total {
        margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--card-border, #E9D5FF);
        font-size: 15px; font-weight: 900; color: var(--text-main, #2E1065);
      }
      .td-bill-row.is-sub { font-size: 11.5px; }
      .td-foot { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--card-border, #E9D5FF); }
      @media (max-width: 560px) { .td-info { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

      @media (max-width: 1100px) {
        .th-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        .th-kpis { grid-template-columns: 1fr; }
        .th-toolbar-right { margin-left: 0; width: 100%; }
        .th-search, .th-search .form-control, .th-select { width: 100%; }
      }
    `,
  ],
})
export class TableHistoryComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diningService = inject(DiningService);

  public readonly periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: 'all', label: 'All time' },
    { key: 'custom', label: 'Custom' },
  ];

  public readonly statusOptions: DropdownOption[] = [
    { value: '', label: 'All statuses', icon: 'list', description: 'Every session on this table' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle', description: 'Billed and paid' },
    { value: 'IN_PROGRESS', label: 'Processing', icon: 'restaurant', description: 'In the kitchen, not billed yet' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'cancel', description: 'Closed without a bill' },
  ];

  public tableId = 0;
  public data: TableHistoryPage | null = null;
  public isLoading = false;
  public loadError: string | null = null;

  public period: Period = '30d';
  public from = '';
  public to = '';
  public status: StatusFilter = '';
  public search = '';
  public page = 1;
  public readonly limit = 25;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSeq = 0;

  ngOnInit(): void {
    this.tableId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    this.setPeriod('30d');
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  get table(): DiningTable | null {
    return this.data?.table || null;
  }

  get summary(): TableHistorySummary {
    return (
      this.data?.summary || {
        sessions: 0, completed_sessions: 0, cancelled_sessions: 0,
        revenue: 0, avg_bill: 0, avg_minutes: 0, last_session_at: null,
      }
    );
  }

  get rows() {
    return this.data?.rows || [];
  }

  get total(): number {
    return this.data?.total || 0;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  get rangeStart(): number {
    return this.total ? (this.page - 1) * this.limit + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get pageNumbers(): number[] {
    const last = this.totalPages;
    const start = Math.max(1, Math.min(this.page - 2, last - 4));
    const end = Math.min(last, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  load(): void {
    if (!this.tableId) {
      this.loadError = 'Invalid table.';
      return;
    }
    const seq = ++this.requestSeq;
    this.isLoading = true;
    this.loadError = null;
    this.diningService
      .getTableHistoryPage({
        tableId: this.tableId,
        from: this.from || undefined,
        to: this.to || undefined,
        status: this.status || undefined,
        search: this.search.trim() || undefined,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          if (seq !== this.requestSeq) return;
          this.isLoading = false;
          if (res.success) this.data = res.data;
        },
        error: (err) => {
          if (seq !== this.requestSeq) return;
          this.isLoading = false;
          if (!this.data) this.loadError = err?.error?.message || 'Unable to load table history.';
        },
      });
  }

  setPeriod(p: Period): void {
    this.period = p;
    const today = new Date();
    const back = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return this.ymd(d);
    };
    if (p === 'today') { this.from = this.ymd(today); this.to = this.ymd(today); }
    else if (p === '7d') { this.from = back(6); this.to = this.ymd(today); }
    else if (p === '30d') { this.from = back(29); this.to = this.ymd(today); }
    else if (p === 'all') { this.from = ''; this.to = ''; }
    // 'custom' keeps whatever range is set, so switching to it starts from the current one.
    this.applyFilters();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  onSearch(value: string): void {
    this.search = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 300);
  }

  hasFilters(): boolean {
    return this.period !== 'all' || !!this.status || !!this.search.trim();
  }

  clearFilters(): void {
    this.status = '';
    this.search = '';
    this.setPeriod('all');
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.load();
  }

  goBack(): void {
    this.router.navigate(['/dining']);
  }

  // ─── Order details popup ───
  public detailOpen = false;
  public detailLoading = false;
  public detail: any = null;
  public detailRounds: { round: number | null; time: string | null; total: number; lines: any[] }[] = [];
  private detailSeq = 0;

  openDetail(orderId: number): void {
    const seq = ++this.detailSeq;
    this.detailOpen = true;
    this.detailLoading = true;
    this.detail = null;
    this.detailRounds = [];
    this.diningService.getHistoryDetail(orderId).subscribe({
      next: (res) => {
        if (seq !== this.detailSeq) return;
        this.detailLoading = false;
        if (!res.success) return;
        this.detail = res.data;
        const byRound = new Map<number, { round: number | null; time: string | null; total: number; lines: any[] }>();
        for (const l of res.data.items || []) {
          const key = Number(l.kot_round) || 0;
          let g = byRound.get(key);
          if (!g) {
            g = { round: l.kot_round ?? null, time: l.created_at || null, total: 0, lines: [] };
            byRound.set(key, g);
          }
          g.lines.push(l);
          g.total += Number(l.subtotal) || 0;
        }
        this.detailRounds = Array.from(byRound.values());
      },
      error: () => {
        if (seq === this.detailSeq) this.detailLoading = false;
      },
    });
  }

  closeDetail(): void {
    this.detailSeq++;
    this.detailOpen = false;
    this.detail = null;
  }

  /** Seated to billed (or to the last update when there is no bill). */
  get detailMinutes(): number {
    const start = this.asDate(this.detail?.order?.created_at);
    const end = this.asDate(this.detail?.bill?.created_at || this.detail?.order?.updated_at);
    if (!start || !end) return 0;
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  addonList(addons: any[]): string {
    return (addons || []).map((a) => a?.name).filter(Boolean).join(', ');
  }

  num(v: unknown): number {
    return Number(v) || 0;
  }

  periodLabel(): string {
    return this.periods.find((p) => p.key === this.period)?.label || '';
  }

  trackByOrder(_i: number, h: { order_id: number }): number {
    return h.order_id;
  }

  // "2026-09-29 12:38:00" is local DB time; parse it as local, not UTC.
  asDate(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(String(value).trim().replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }

  duration(mins?: number | null): string {
    const total = Math.max(0, Math.floor(Number(mins) || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return m + 'm';
    return m ? h + 'h ' + m + 'm' : h + 'h';
  }

  // Same thresholds as the floor map's turnover timer.
  tier(mins?: number | null): 'safe' | 'warn' | 'over' {
    const n = Number(mins) || 0;
    if (n > 75) return 'over';
    if (n >= 45) return 'warn';
    return 'safe';
  }

  orderStatusLabel(s?: string): string {
    switch (s) {
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'IN_PROGRESS':
      case 'PENDING': return 'Processing';
      default: return s || '—';
    }
  }

  statusKey(s?: string): string {
    switch (s) {
      case 'AVAILABLE': return 'free';
      case 'OCCUPIED': return 'busy';
      case 'RESERVED': return 'reserved';
      case 'CLEANING': return 'cleaning';
      default: return 'blocked';
    }
  }

  statusLabel(s?: string): string {
    switch (s) {
      case 'AVAILABLE': return 'Free';
      case 'OCCUPIED': return 'Occupied';
      case 'RESERVED': return 'Reserved';
      case 'CLEANING': return 'Cleaning';
      default: return 'Out of service';
    }
  }

  // Badge text mirrors the floor map card: caption = prefix, code = trailing number.
  badgeCap(t: DiningTable | null): string {
    const raw = String(t?.table_number ?? '').trim();
    const digits = raw.match(/\d+[A-Za-z]?$/);
    if (!digits) return 'Table';
    return raw.slice(0, raw.length - digits[0].length).replace(/[\s\-–:#]+$/, '').trim() || 'Table';
  }

  badgeCode(t: DiningTable | null): string {
    const raw = String(t?.table_number ?? '').trim();
    const digits = raw.match(/\d+[A-Za-z]?$/);
    if (digits) return digits[0];
    return raw.slice(0, 4).toUpperCase();
  }

  private ymd(d: Date): string {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { StaffTrackService, StaffTrackFilters, StaffTrackOverview, StaffTrackRow } from '../../core/services/staff-track.service';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { StaffTrackFiltersComponent } from './staff-track-filters.component';

type TabKey = 'overview' | 'live' | 'performance' | 'orders' | 'revenue' | 'tables' | 'activity' | 'reports';

/**
 * Staff Track workspace.
 *
 * One shell with eight tabs rather than eight routed pages, so the filter bar,
 * the loaded staff list and the chosen date range survive a tab change instead
 * of being refetched each time. Each tab loads only its own data, and only when
 * first opened.
 *
 * Two numbers on this page look similar and are deliberately not the same:
 * "Orders Taken" counts orders by who created them, while "Revenue" sums bills
 * by who settled them. When a waiter opens a table and a cashier closes it, the
 * POS records two different people, and this page keeps them apart.
 */
@Component({
  selector: 'app-staff-track',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageLoaderComponent,
    CustomDropdownComponent,
    AppCurrencyPipe,
    StaffTrackFiltersComponent,
  ],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isBootLoading"
        [error]="bootError"
        message="Loading staff trackâ€¦"
        subMessage="Gathering staff activity, orders and revenue."
        icon="groups"
        (retry)="reloadAll()"
      ></app-page-loader>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• BREADCRUMBS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">â€º</span>
        <span>Operations</span>
        <span class="breadcrumb-separator">â€º</span>
        <span class="breadcrumb-current">Staff Track</span>
      </div>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HEADER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <div class="audit-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Staff Track</h1>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">person</span>
                <span>Staff: <strong>{{ overview?.totalUsers || 0 }}</strong></span>
              </span>
              <span class="meta-dot">â€¢</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">receipt_long</span>
                <span>Orders: <strong>{{ overview?.ordersTaken || 0 }}</strong></span>
              </span>
              <span class="meta-dot">â€¢</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">payments</span>
                <span>Revenue: <strong>{{ overview?.revenue || 0 | appCurrency }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button type="button" (click)="reloadAll()" [disabled]="isTabLoading" class="audit-btn btn-outline-purple" title="Reload from server">
            <span class="material-symbols-outlined" [class.spin-icon]="isTabLoading">refresh</span>
            <span>Refresh</span>
          </button>
          <button type="button" (click)="exportCsv()" class="audit-btn btn-gradient-purple" title="Export the current tab as CSV">
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TABS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <div class="module-tabs-bar">
        <button
          type="button"
          *ngFor="let t of tabs"
          class="module-tab-btn"
          [class.is-active]="activeTab === t.key"
          (click)="setTab(t.key)"
        >
          <span class="material-symbols-outlined">{{ t.icon }}</span>
          <span>{{ t.label }}</span>
          <span class="tab-count-badge" *ngIf="t.key === 'live' && liveCount() > 0">{{ liveCount() }}</span>
        </button>
      </div>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILTERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <app-staff-track-filters
        *ngIf="activeTab !== 'live'"
        [filters]="filters"
        [showOrderStatus]="activeTab === 'orders'"
        [showPaymentStatus]="activeTab === 'orders'"
        [showTable]="activeTab === 'orders' || activeTab === 'tables'"
        [showActivityType]="activeTab === 'activity'"
        [searchPlaceholder]="searchPlaceholder()"
        (filtersChange)="onFiltersChange($event)"
        (scopeChange)="selfScoped = $event === 'SELF'"
      ></app-staff-track-filters>

      <!--
        Said plainly, because every figure on the page is genuinely smaller in
        this mode and an unlabelled total reading zero looks like a bug rather
        than a boundary.
      -->
      <div class="st-scope-note" *ngIf="selfScoped">
        <span class="material-symbols-rounded">person</span>
        <span>Showing your own activity only. Viewing the full team requires the Staff Track permission.</span>
      </div>

      <!-- Live view has no date filter: it is, by definition, now. -->
      <div class="st-live-bar" *ngIf="activeTab === 'live'">
        <div class="st-live-left">
          <span class="pulse-dot"></span>
          <span class="st-live-label">Current activity</span>
          <span class="st-live-sub" *ngIf="live">
            Captured {{ live.capturedAt | date : 'HH:mm:ss' }} Â· staff active in the last
            {{ live.activeWindowMinutes }} min
          </span>
        </div>
        <div class="filter-actions-group">
          <app-custom-dropdown
            [options]="windowOptions"
            [(ngModel)]="liveWindowMinutes"
            (valueChange)="loadLive()"
            placeholder="Window"
            minWidth="160px"
          ></app-custom-dropdown>
          <button type="button" class="audit-btn btn-outline-purple" (click)="loadLive()" [disabled]="isTabLoading">
            <span class="material-symbols-outlined" [class.spin-icon]="isTabLoading">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Inline error for a tab that failed while the shell stays usable. -->
      <div class="st-inline-error" *ngIf="tabError">
        <span class="material-symbols-outlined">error</span>
        <div>
          <div class="st-inline-error-title">Could not load this view</div>
          <div class="st-inline-error-desc">{{ tabError }}</div>
        </div>
        <button type="button" class="audit-btn btn-outline-purple" (click)="loadActiveTab()">
          <span class="material-symbols-outlined">refresh</span><span>Retry</span>
        </button>
      </div>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 1. OVERVIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'overview' && !tabError">
        <div class="kpi-cards-grid" *ngIf="overview">
          <div class="kpi-card card-accent-purple">
            <div class="kpi-header-row">
              <span class="kpi-title">Total Staff</span>
              <span class="kpi-icon-bubble bg-purple-tint"><span class="material-symbols-outlined">group</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.totalUsers }}</span>
              <span class="kpi-pill pill-purple">{{ overview.activeUsers }} active</span>
            </div>
          </div>

          <div class="kpi-card card-accent-teal">
            <div class="kpi-header-row">
              <span class="kpi-title">Recently Active</span>
              <span class="kpi-icon-bubble bg-teal-tint"><span class="material-symbols-outlined">bolt</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.recentlyActiveStaff }}</span>
              <span class="kpi-pill pill-teal">last {{ overview.activeWindowMinutes }} min</span>
            </div>
            <div class="st-card-note">Based on recorded activity â€” this system has no shift or attendance data.</div>
          </div>

          <div class="kpi-card card-accent-blue st-clickable" (click)="setTab('orders')">
            <div class="kpi-header-row">
              <span class="kpi-title">Orders Taken</span>
              <span class="kpi-icon-bubble bg-blue-tint"><span class="material-symbols-outlined">receipt_long</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.ordersTaken }}</span>
              <span class="kpi-pill pill-blue">{{ overview.orderValue | appCurrency }}</span>
            </div>
          </div>

          <div class="kpi-card card-accent-green st-clickable" (click)="setTab('revenue')">
            <div class="kpi-header-row">
              <span class="kpi-title">Revenue</span>
              <span class="kpi-icon-bubble bg-green-tint"><span class="material-symbols-outlined">payments</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number text-green">{{ overview.revenue | appCurrency }}</span>
              <span class="kpi-pill pill-success">{{ overview.billsSettled }} bills</span>
            </div>
          </div>

          <div class="kpi-card card-accent-amber st-clickable" (click)="setTab('tables')">
            <div class="kpi-header-row">
              <span class="kpi-title">Active Tables</span>
              <span class="kpi-icon-bubble bg-amber-tint"><span class="material-symbols-outlined">table_restaurant</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.activeTables }}</span>
              <span class="kpi-pill pill-amber">of {{ overview.totalTables }}</span>
            </div>
          </div>

          <div class="kpi-card card-accent-teal">
            <div class="kpi-header-row">
              <span class="kpi-title">Tables Served</span>
              <span class="kpi-icon-bubble bg-teal-tint"><span class="material-symbols-outlined">restaurant</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.tablesServed }}</span>
              <span class="kpi-pill pill-teal">in range</span>
            </div>
          </div>

          <div class="kpi-card card-accent-green">
            <div class="kpi-header-row">
              <span class="kpi-title">Completed Orders</span>
              <span class="kpi-icon-bubble bg-green-tint"><span class="material-symbols-outlined">check_circle</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number text-green">{{ overview.completedOrders }}</span>
              <span class="kpi-pill pill-success">done</span>
            </div>
          </div>

          <div class="kpi-card card-accent-rose st-clickable" (click)="goToCancelled()">
            <div class="kpi-header-row">
              <span class="kpi-title">Cancelled Orders</span>
              <span class="kpi-icon-bubble bg-rose-tint"><span class="material-symbols-outlined">cancel</span></span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ overview.cancelledOrders }}</span>
              <span class="kpi-pill pill-rose">voided</span>
            </div>
          </div>
        </div>

        <!-- Staff summary table -->
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Staff Overview</div>
              <div class="st-section-sub">Orders credited to whoever created them; revenue to whoever settled the bill.</div>
            </div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Staff Member</th>
                  <th style="width: 11%;">Role</th>
                  <th style="width: 15%;">Current Activity</th>
                  <th style="width: 9%; text-align: right;">Orders</th>
                  <th style="width: 12%; text-align: right;">Order Value</th>
                  <th style="width: 12%; text-align: right;">Revenue</th>
                  <th style="width: 8%; text-align: center;">Tables</th>
                  <th style="width: 8%; text-align: center;">Items</th>
                  <th style="width: 60px; text-align: center;">View</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of staff" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + s.name" (click)="openStaff(s.id)" (keydown.enter)="openStaff(s.id)">
                  <td>
                    <div class="operator-cell">
                      <img *ngIf="s.imageUrl" class="row-avatar-img" [src]="resolveImage(s.imageUrl)" [alt]="s.name" />
                      <div *ngIf="!s.imageUrl" class="operator-avatar">{{ initials(s.name) }}</div>
                      <div class="operator-details">
                        <div class="operator-name">{{ s.name }}</div>
                        <div class="operator-username">&#64;{{ s.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge" [ngClass]="roleBadgeClass(s.roleName)">{{ s.roleName }}</span></td>
                  <td>
                    <div class="st-activity-cell" *ngIf="s.currentActivity; else noActivity">
                      <span class="st-activity-label">{{ humanise(s.currentActivity.action) }}</span>
                      <span class="st-activity-time">{{ s.currentActivity.at | date : 'dd MMM, HH:mm' }}</span>
                    </div>
                    <ng-template #noActivity><span class="st-muted">No recorded activity</span></ng-template>
                  </td>
                  <td style="text-align: right;" class="font-bold">{{ s.ordersTaken }}</td>
                  <td style="text-align: right;">{{ s.orderValue | appCurrency }}</td>
                  <td style="text-align: right;" class="font-bold text-green">{{ s.revenue | appCurrency }}</td>
                  <td style="text-align: center;">
                    {{ s.tablesAttended }}
                    <span class="st-live-chip" *ngIf="s.activeTables > 0">{{ s.activeTables }} now</span>
                  </td>
                  <td style="text-align: center;">{{ s.itemsHandled }}</td>
                  <td style="text-align: center;">
                    <a class="action-icon-btn" [routerLink]="['/staff-track/staff', s.id]" [queryParams]="dateQuery()" (click)="$event.stopPropagation()" title="Open staff detail">
                      <span class="material-symbols-outlined">arrow_forward</span>
                    </a>
                  </td>
                </tr>
                <tr *ngIf="!isTabLoading && staff.length === 0">
                  <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">group_off</span>
                      <div class="empty-title">No staff activity found</div>
                      <div class="empty-desc">No staff match the selected filters for this date range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 2. LIVE ACTIVITY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'live' && !tabError">
        <div class="st-grid-2">
          <!-- Current tables -->
          <div class="saas-table-card">
            <div class="st-section-head">
              <div>
                <div class="st-section-title">Current Tables</div>
                <div class="st-section-sub">Who is handling which table right now.</div>
              </div>
              <span class="results-counter-pill">{{ live?.currentTables?.length || 0 }}</span>
            </div>
            <div class="table-responsive-wrapper">
              <table class="saas-data-table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Staff</th>
                    <th>Order</th>
                    <th style="text-align: right;">Amount</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of live?.currentTables || []" [class.st-row-link]="!!t.order" [attr.tabindex]="t.order ? 0 : null" (click)="t.order && openOrder(t.order.orderId)" (keydown.enter)="t.order && openOrder(t.order.orderId)">
                    <td>
                      <div class="font-bold text-xs">{{ t.tableNumber }}</div>
                      <div class="st-muted">{{ t.tableName }}</div>
                    </td>
                    <td>
                      <div *ngIf="t.attendingStaff; else noStaff" class="operator-cell">
                        <div class="operator-avatar">{{ initials(t.attendingStaff.name) }}</div>
                        <div class="operator-details">
                          <div class="operator-name">{{ t.attendingStaff.name }}</div>
                          <div class="operator-username">via order owner</div>
                        </div>
                      </div>
                      <ng-template #noStaff><span class="st-muted">Not attributable</span></ng-template>
                    </td>
                    <td>
                      <span class="font-mono font-bold text-xs" *ngIf="t.order">{{ t.order.orderNumber }}</span>
                      <span class="st-muted" *ngIf="!t.order">â€”</span>
                    </td>
                    <td style="text-align: right;">{{ t.order ? (t.order.totalAmount | appCurrency) : 'â€”' }}</td>
                    <td><span class="badge" [ngClass]="orderStatusClass(t.order?.status)">{{ t.order ? humanise(t.order.status) : humanise(t.status) }}</span></td>
                    <td class="st-muted">{{ t.order ? (t.order.lastActivityAt | date : 'HH:mm') : 'â€”' }}</td>
                  </tr>
                  <tr *ngIf="!isTabLoading && (live?.currentTables?.length || 0) === 0">
                    <td colspan="6" class="empty-state-cell">
                      <div class="empty-state-box">
                        <span class="material-symbols-outlined empty-icon">table_restaurant</span>
                        <div class="empty-title">No tables are currently assigned</div>
                        <div class="empty-desc">No table is occupied right now.</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Working staff -->
          <div class="saas-table-card">
            <div class="st-section-head">
              <div>
                <div class="st-section-title">Currently Active Staff</div>
                <div class="st-section-sub">Staff with recorded activity inside the window.</div>
              </div>
              <span class="results-counter-pill">{{ live?.recentlyActiveStaff?.length || 0 }}</span>
            </div>
            <div class="table-responsive-wrapper">
              <table class="saas-data-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Role</th>
                    <th>Current Activity</th>
                    <th style="text-align: center;">Open</th>
                    <th style="text-align: center;">Tables</th>
                    <th>At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of live?.recentlyActiveStaff || []" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + s.name" (click)="openStaff(s.id)" (keydown.enter)="openStaff(s.id)">
                    <td>
                      <div class="operator-cell">
                        <img *ngIf="s.imageUrl" class="row-avatar-img" [src]="resolveImage(s.imageUrl)" [alt]="s.name" />
                        <div *ngIf="!s.imageUrl" class="operator-avatar">{{ initials(s.name) }}</div>
                        <div class="operator-details">
                          <div class="operator-name">{{ s.name }}</div>
                          <div class="operator-username">&#64;{{ s.username }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge" [ngClass]="roleBadgeClass(s.roleName)">{{ s.roleName }}</span></td>
                    <td><span class="st-activity-label">{{ humanise(s.currentActivity?.action) }}</span></td>
                    <td style="text-align: center;">{{ s.openOrders }}</td>
                    <td style="text-align: center;">{{ s.activeTables }}</td>
                    <td class="st-muted">{{ s.lastActivityAt | date : 'HH:mm' }}</td>
                  </tr>
                  <tr *ngIf="!isTabLoading && (live?.recentlyActiveStaff?.length || 0) === 0">
                    <td colspan="6" class="empty-state-cell">
                      <div class="empty-state-box">
                        <span class="material-symbols-outlined empty-icon">person_off</span>
                        <div class="empty-title">No staff activity found</div>
                        <div class="empty-desc">Nobody has recorded activity in the last {{ liveWindowMinutes }} minutes.</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Live orders -->
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Live Order Tracking</div>
              <div class="st-section-sub">Every order still pending or in progress.</div>
            </div>
            <span class="results-counter-pill">{{ live?.openOrders?.length || 0 }}</span>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style="text-align: right;">Amount</th>
                  <th>Created</th>
                  <th style="width: 60px; text-align: center;">View</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of live?.openOrders || []" class="st-row-link" tabindex="0" [attr.aria-label]="'Open order ' + o.orderNumber" (click)="openOrder(o.orderId)" (keydown.enter)="openOrder(o.orderId)">
                  <td><span class="font-mono font-bold text-xs">{{ o.orderNumber }}</span></td>
                  <td>{{ o.table ? o.table.tableNumber : 'â€”' }}</td>
                  <td>{{ o.customerName || 'Walk-In' }}</td>
                  <td>{{ o.createdBy ? o.createdBy.name : 'Not recorded' }}</td>
                  <td><span class="badge" [ngClass]="orderStatusClass(o.status)">{{ humanise(o.status) }}</span></td>
                  <td><span class="badge" [ngClass]="paymentBadgeClass(o.paymentStatus)">{{ humanise(o.paymentStatus) }}</span></td>
                  <td style="text-align: right;" class="font-bold">{{ o.totalAmount | appCurrency }}</td>
                  <td class="st-muted">{{ o.createdAt | date : 'dd MMM, HH:mm' }}</td>
                  <td style="text-align: center;">
                    <button type="button" class="action-icon-btn" (click)="$event.stopPropagation(); openOrder(o.orderId)" title="Order attribution">
                      <span class="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!isTabLoading && (live?.openOrders?.length || 0) === 0">
                  <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">receipt_long</span>
                      <div class="empty-title">No active orders</div>
                      <div class="empty-desc">Every order has been completed or cancelled.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 3. STAFF PERFORMANCE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'performance' && !tabError">
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Staff Performance</div>
              <div class="st-section-sub">Average service time measures order creation to completion.</div>
            </div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th style="text-align: right;">Orders</th>
                  <th style="text-align: right;">Completed</th>
                  <th style="text-align: right;">Cancelled</th>
                  <th style="text-align: right;">Avg Order</th>
                  <th style="text-align: right;">Order Value</th>
                  <th style="text-align: right;">Revenue</th>
                  <th style="text-align: center;">Tables</th>
                  <th style="text-align: center;">Items</th>
                  <th style="text-align: right;">Avg Service</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of staff" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + s.name" (click)="openStaff(s.id)" (keydown.enter)="openStaff(s.id)">
                  <td>
                    <div class="operator-cell">
                      <div class="operator-avatar">{{ initials(s.name) }}</div>
                      <div class="operator-details">
                        <div class="operator-name">{{ s.name }}</div>
                        <div class="operator-username">{{ s.roleName }}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: right;" class="font-bold">{{ s.ordersTaken }}</td>
                  <td style="text-align: right;" class="text-green">{{ s.completedOrders }}</td>
                  <td style="text-align: right;" [class.text-red-500]="s.cancelledOrders > 0">{{ s.cancelledOrders }}</td>
                  <td style="text-align: right;">{{ s.averageOrderValue | appCurrency }}</td>
                  <td style="text-align: right;">{{ s.orderValue | appCurrency }}</td>
                  <td style="text-align: right;" class="font-bold text-green">{{ s.revenue | appCurrency }}</td>
                  <td style="text-align: center;">{{ s.tablesAttended }}</td>
                  <td style="text-align: center;">{{ s.itemsHandled }}</td>
                  <td style="text-align: right;">{{ duration(s.averageServiceSeconds) }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && staff.length === 0">
                  <td colspan="10" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">query_stats</span>
                      <div class="empty-title">No performance data</div>
                      <div class="empty-desc">No staff activity in the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 4. ORDERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'orders' && !tabError">
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Order Tracking</div>
              <div class="st-section-sub">"Taken by" is the order's creator; "Settled by" is the cashier on the bill.</div>
            </div>
            <span class="results-counter-pill" *ngIf="ordersPagination">{{ ordersPagination.total }} orders</span>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Taken By</th>
                  <th>Settled By</th>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style="text-align: right;">Amount</th>
                  <th>Created</th>
                  <th style="text-align: right;">Duration</th>
                  <th style="width: 60px; text-align: center;">View</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of orders" class="st-row-link" tabindex="0" [attr.aria-label]="'Open order ' + o.orderNumber" (click)="openOrder(o.orderId)" (keydown.enter)="openOrder(o.orderId)">
                  <td><span class="font-mono font-bold text-xs">{{ o.orderNumber }}</span></td>
                  <td>{{ o.createdBy ? o.createdBy.name : 'Not recorded' }}</td>
                  <td>{{ o.settledBy ? o.settledBy.name : 'â€”' }}</td>
                  <td>{{ o.table ? o.table.tableNumber : 'â€”' }}</td>
                  <td>{{ o.customerName || 'Walk-In' }}</td>
                  <td><span class="badge" [ngClass]="orderStatusClass(o.status)">{{ humanise(o.status) }}</span></td>
                  <td><span class="badge" [ngClass]="paymentBadgeClass(o.paymentStatus)">{{ humanise(o.paymentStatus) }}</span></td>
                  <td style="text-align: right;" class="font-bold">{{ o.totalAmount | appCurrency }}</td>
                  <td class="st-muted">{{ o.createdAt | date : 'dd MMM, HH:mm' }}</td>
                  <td style="text-align: right;">{{ duration(o.durationSeconds) }}</td>
                  <td style="text-align: center;">
                    <button type="button" class="action-icon-btn" (click)="$event.stopPropagation(); openOrder(o.orderId)" title="Order attribution">
                      <span class="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!isTabLoading && orders.length === 0">
                  <td colspan="11" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">receipt_long</span>
                      <div class="empty-title">No orders found for the selected filters</div>
                      <div class="empty-desc">Try widening the date range or clearing filters.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-footer-bar" *ngIf="ordersPagination && ordersPagination.total > 0">
            <div class="pagination-info">
              Page <strong>{{ ordersPagination.page }}</strong> of <strong>{{ ordersPagination.totalPages }}</strong>
              Â· <strong>{{ ordersPagination.total }}</strong> orders
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
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 5. REVENUE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'revenue' && !tabError">
        <div class="kpi-cards-grid" *ngIf="revenue?.totals as tot">
          <div class="kpi-card card-accent-blue">
            <div class="kpi-header-row"><span class="kpi-title">Gross Sales</span>
              <span class="kpi-icon-bubble bg-blue-tint"><span class="material-symbols-outlined">sell</span></span></div>
            <div class="kpi-value-row"><span class="kpi-number">{{ tot.grossSales | appCurrency }}</span></div>
          </div>
          <div class="kpi-card card-accent-amber">
            <div class="kpi-header-row"><span class="kpi-title">Discount</span>
              <span class="kpi-icon-bubble bg-amber-tint"><span class="material-symbols-outlined">percent</span></span></div>
            <div class="kpi-value-row"><span class="kpi-number">{{ tot.discountAmount | appCurrency }}</span></div>
          </div>
          <div class="kpi-card card-accent-purple">
            <div class="kpi-header-row"><span class="kpi-title">Tax</span>
              <span class="kpi-icon-bubble bg-purple-tint"><span class="material-symbols-outlined">receipt</span></span></div>
            <div class="kpi-value-row"><span class="kpi-number">{{ tot.taxAmount | appCurrency }}</span></div>
          </div>
          <div class="kpi-card card-accent-green">
            <div class="kpi-header-row"><span class="kpi-title">Net Revenue</span>
              <span class="kpi-icon-bubble bg-green-tint"><span class="material-symbols-outlined">payments</span></span></div>
            <div class="kpi-value-row"><span class="kpi-number text-green">{{ tot.netRevenue | appCurrency }}</span>
              <span class="kpi-pill pill-success">{{ tot.billsCount }} bills</span></div>
          </div>
          <div class="kpi-card card-accent-rose">
            <div class="kpi-header-row"><span class="kpi-title">Cancelled Value</span>
              <span class="kpi-icon-bubble bg-rose-tint"><span class="material-symbols-outlined">cancel</span></span></div>
            <div class="kpi-value-row"><span class="kpi-number">{{ tot.cancelledValue | appCurrency }}</span>
              <span class="kpi-pill pill-rose">never billed</span></div>
          </div>
        </div>

        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Revenue by Staff</div>
              <div class="st-section-sub">Summed from the bill each staff member settled â€” the same figures as Reports.</div>
            </div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th style="text-align: right;">Bills</th>
                  <th style="text-align: right;">Paid</th>
                  <th style="text-align: right;">Gross</th>
                  <th style="text-align: right;">Discount</th>
                  <th style="text-align: right;">Tax</th>
                  <th style="text-align: right;">Net Revenue</th>
                  <th style="text-align: right;">Avg Bill</th>
                  <th style="text-align: right;">Cancelled</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of revenue?.data || []" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + r.name" (click)="openStaff(r.id)" (keydown.enter)="openStaff(r.id)">
                  <td>
                    <div class="operator-cell">
                      <div class="operator-avatar">{{ initials(r.name) }}</div>
                      <div class="operator-details">
                        <div class="operator-name">{{ r.name }}</div>
                        <div class="operator-username">{{ r.roleName }}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: right;">{{ r.billsCount }}</td>
                  <td style="text-align: right;" class="text-green">{{ r.paidOrders }}</td>
                  <td style="text-align: right;">{{ r.grossSales | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.discountAmount | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.taxAmount | appCurrency }}</td>
                  <td style="text-align: right;" class="font-bold text-green">{{ r.netRevenue | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.averageBillValue | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.cancelledValue | appCurrency }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && (revenue?.data?.length || 0) === 0">
                  <td colspan="9" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">payments</span>
                      <div class="empty-title">No revenue in this range</div>
                      <div class="empty-desc">No bills were settled for the selected filters.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 6. TABLES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'tables' && !tabError">
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Current Tables</div>
              <div class="st-section-sub">
                Attending staff is derived from the table's open order â€” this system stores no table-to-staff assignment.
              </div>
            </div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Attending Staff</th>
                  <th>Order</th>
                  <th style="text-align: right;">Amount</th>
                  <th style="text-align: center;">Items</th>
                  <th style="text-align: right;">Open For</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of tables?.currentTables || []" [class.st-row-link]="!!t.order" [attr.tabindex]="t.order ? 0 : null" (click)="t.order && openOrder(t.order.orderId)" (keydown.enter)="t.order && openOrder(t.order.orderId)">
                  <td>
                    <div class="font-bold text-xs">{{ t.tableNumber }}</div>
                    <div class="st-muted">{{ t.tableName }}</div>
                  </td>
                  <td class="st-muted">{{ t.section }}</td>
                  <td><span class="badge" [ngClass]="tableStatusClass(t.status)">{{ humanise(t.status) }}</span></td>
                  <td>{{ t.attendingStaff ? t.attendingStaff.name : 'â€”' }}</td>
                  <td><span class="font-mono text-xs" *ngIf="t.order">{{ t.order.orderNumber }}</span><span *ngIf="!t.order">â€”</span></td>
                  <td style="text-align: right;">{{ t.order ? (t.order.totalAmount | appCurrency) : 'â€”' }}</td>
                  <td style="text-align: center;">{{ t.itemCount || 'â€”' }}</td>
                  <td style="text-align: right;">{{ t.order ? duration(t.order.openSeconds) : 'â€”' }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && (tables?.currentTables?.length || 0) === 0">
                  <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">table_restaurant</span>
                      <div class="empty-title">No tables are currently assigned</div>
                      <div class="empty-desc">No dining table has an open order.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Table Service by Staff</div>
              <div class="st-section-sub">Duration runs from the order opening to its completion or cancellation.</div>
            </div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th style="text-align: center;">Tables Attended</th>
                  <th style="text-align: center;">Table Orders</th>
                  <th style="text-align: right;">Table Revenue</th>
                  <th style="text-align: right;">Avg Table Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of tables?.perStaff || []" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + s.name" (click)="openStaff(s.id)" (keydown.enter)="openStaff(s.id)">
                  <td>
                    <div class="operator-cell">
                      <div class="operator-avatar">{{ initials(s.name) }}</div>
                      <div class="operator-details">
                        <div class="operator-name">{{ s.name }}</div>
                        <div class="operator-username">{{ s.roleName }}</div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: center;" class="font-bold">{{ s.tablesAttended }}</td>
                  <td style="text-align: center;">{{ s.tableOrders }}</td>
                  <td style="text-align: right;">{{ s.tableRevenue | appCurrency }}</td>
                  <td style="text-align: right;">{{ duration(s.averageTableSeconds) }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && (tables?.perStaff?.length || 0) === 0">
                  <td colspan="5" class="empty-state-cell">
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
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 7. ACTIVITY HISTORY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'activity' && !tabError">
        <div class="saas-table-card">
          <div class="st-section-head">
            <div>
              <div class="st-section-title">Activity History</div>
              <div class="st-section-sub">Every recorded action: who, what, which record, and when.</div>
            </div>
            <span class="results-counter-pill" *ngIf="activityPagination">{{ activityPagination.total }} events</span>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 150px;">When</th>
                  <th>Staff</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Related Record</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of activity">
                  <td>
                    <div class="timestamp-box">
                      <span class="material-symbols-outlined time-icon">schedule</span>
                      <span>{{ a.at | date : 'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                  </td>
                  <td>
                    <div *ngIf="a.actor; else sysActor" class="operator-cell">
                      <div class="operator-avatar">{{ initials(a.actor.name) }}</div>
                      <div class="operator-details">
                        <div class="operator-name">{{ a.actor.name }}</div>
                        <div class="operator-username">&#64;{{ a.actor.username }}</div>
                      </div>
                    </div>
                    <ng-template #sysActor><span class="st-muted">System</span></ng-template>
                  </td>
                  <td>
                    <span class="action-badge" [ngClass]="actionBadgeClass(a.action)">
                      <span class="material-symbols-outlined action-badge-icon">{{ actionIcon(a.action) }}</span>
                      {{ humanise(a.action) }}
                    </span>
                  </td>
                  <td><span class="module-badge">{{ humanise(a.module) }}</span></td>
                  <td>
                    <span class="font-mono text-xs" *ngIf="a.orderNumber || a.billNumber">{{ a.orderNumber || a.billNumber }}</span>
                    <span class="record-id-badge" *ngIf="!a.orderNumber && !a.billNumber && a.recordId">#{{ a.recordId }}</span>
                    <span class="st-muted" *ngIf="!a.orderNumber && !a.billNumber && !a.recordId">â€”</span>
                  </td>
                  <td style="text-align: right;">{{ a.amount !== null && a.amount !== undefined ? (a.amount | appCurrency) : 'â€”' }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && activity.length === 0">
                  <td colspan="6" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">history</span>
                      <div class="empty-title">No staff activity found</div>
                      <div class="empty-desc">No recorded events match the selected filters.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination-footer-bar" *ngIf="activityPagination && activityPagination.total > 0">
            <div class="pagination-info">
              Page <strong>{{ activityPagination.page }}</strong> of <strong>{{ activityPagination.totalPages }}</strong>
              Â· <strong>{{ activityPagination.total }}</strong> events
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
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 8. REPORTS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <ng-container *ngIf="activeTab === 'reports' && !tabError">
        <div class="st-report-switch">
          <button
            type="button"
            *ngFor="let r of reportTypes"
            class="nav-tab-pill"
            [class.is-active]="activeReport === r.key"
            (click)="setReport(r.key)"
          >
            <span class="material-symbols-outlined">{{ r.icon }}</span>
            <span>{{ r.label }}</span>
          </button>
        </div>

        <div class="st-report-switch" *ngIf="activeReport === 'summary'">
          <button
            type="button"
            *ngFor="let p of ['daily', 'weekly', 'monthly']"
            class="st-preset-btn-lg"
            [class.is-active]="summaryPeriod === p"
            (click)="setSummaryPeriod(p)"
          >
            {{ p | titlecase }}
          </button>
        </div>

        <!-- Staff order report -->
        <div class="saas-table-card" *ngIf="activeReport === 'orders'">
          <div class="st-section-head"><div class="st-section-title">Staff Order Report</div></div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th><th>Role</th>
                  <th style="text-align: right;">Orders Taken</th>
                  <th style="text-align: right;">Completed</th>
                  <th style="text-align: right;">Cancelled</th>
                  <th style="text-align: right;">Pending</th>
                  <th style="text-align: right;">Order Value</th>
                  <th style="text-align: right;">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reportRows" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + r.name" (click)="openStaff(r.id)" (keydown.enter)="openStaff(r.id)">
                  <td class="font-bold">{{ r.name }}</td>
                  <td><span class="badge" [ngClass]="roleBadgeClass(r.roleName)">{{ r.roleName }}</span></td>
                  <td style="text-align: right;" class="font-bold">{{ r.ordersTaken }}</td>
                  <td style="text-align: right;" class="text-green">{{ r.completedOrders }}</td>
                  <td style="text-align: right;">{{ r.cancelledOrders }}</td>
                  <td style="text-align: right;">{{ r.pendingOrders }}</td>
                  <td style="text-align: right;">{{ r.orderValue | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.averageOrderValue | appCurrency }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && reportRows.length === 0">
                  <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">summarize</span>
                      <div class="empty-title">No data for this report</div>
                      <div class="empty-desc">Nothing matches the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Staff revenue report -->
        <div class="saas-table-card" *ngIf="activeReport === 'revenue'">
          <div class="st-section-head"><div class="st-section-title">Staff Revenue Report</div></div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th style="text-align: right;">Paid Orders</th>
                  <th style="text-align: right;">Gross Sales</th>
                  <th style="text-align: right;">Discount</th>
                  <th style="text-align: right;">Tax</th>
                  <th style="text-align: right;">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reportRows" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + r.name" (click)="openStaff(r.id)" (keydown.enter)="openStaff(r.id)">
                  <td class="font-bold">{{ r.name }}</td>
                  <td style="text-align: right;">{{ r.paidOrders }}</td>
                  <td style="text-align: right;">{{ r.grossSales | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.discountAmount | appCurrency }}</td>
                  <td style="text-align: right;">{{ r.taxAmount | appCurrency }}</td>
                  <td style="text-align: right;" class="font-bold text-green">{{ r.netRevenue | appCurrency }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && reportRows.length === 0">
                  <td colspan="6" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">summarize</span>
                      <div class="empty-title">No data for this report</div>
                      <div class="empty-desc">Nothing matches the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Table service report -->
        <div class="saas-table-card" *ngIf="activeReport === 'tables'">
          <div class="st-section-head"><div class="st-section-title">Table Service Report</div></div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th style="text-align: center;">Tables Handled</th>
                  <th style="text-align: center;">Orders per Table</th>
                  <th style="text-align: right;">Avg Table Duration</th>
                  <th style="text-align: right;">Table Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reportRows" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + r.name" (click)="openStaff(r.id)" (keydown.enter)="openStaff(r.id)">
                  <td class="font-bold">{{ r.name }}</td>
                  <td style="text-align: center;">{{ r.tablesAttended }}</td>
                  <td style="text-align: center;">{{ perTable(r) }}</td>
                  <td style="text-align: right;">{{ duration(r.averageTableSeconds) }}</td>
                  <td style="text-align: right;">{{ r.tableRevenue | appCurrency }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && reportRows.length === 0">
                  <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">summarize</span>
                      <div class="empty-title">No data for this report</div>
                      <div class="empty-desc">Nothing matches the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Activity report -->
        <div class="saas-table-card" *ngIf="activeReport === 'activity'">
          <div class="st-section-head"><div class="st-section-title">Staff Activity Report</div></div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Staff</th><th>Module</th><th>Activity</th>
                  <th style="text-align: right;">Count</th><th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reportRows" class="st-row-link" tabindex="0" [attr.aria-label]="'Open ' + r.name" (click)="openStaff(r.id)" (keydown.enter)="openStaff(r.id)">
                  <td class="font-bold">{{ r.name }}</td>
                  <td><span class="module-badge">{{ humanise(r.module) }}</span></td>
                  <td>{{ humanise(r.action) }}</td>
                  <td style="text-align: right;" class="font-bold">{{ r.count }}</td>
                  <td class="st-muted">{{ r.lastAt | date : 'dd MMM yyyy, HH:mm' }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && reportRows.length === 0">
                  <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">summarize</span>
                      <div class="empty-title">No data for this report</div>
                      <div class="empty-desc">Nothing matches the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary report -->
        <div class="saas-table-card" *ngIf="activeReport === 'summary'">
          <div class="st-section-head">
            <div class="st-section-title">{{ summaryPeriod | titlecase }} Summary</div>
          </div>
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th style="text-align: right;">Orders</th>
                  <th style="text-align: right;">Completed</th>
                  <th style="text-align: right;">Cancelled</th>
                  <th style="text-align: center;">Staff</th>
                  <th style="text-align: center;">Tables</th>
                  <th style="text-align: right;">Bills</th>
                  <th style="text-align: right;">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of reportRows">
                  <td class="font-mono font-bold text-xs">{{ r.bucket }}</td>
                  <td style="text-align: right;">{{ r.ordersTaken }}</td>
                  <td style="text-align: right;" class="text-green">{{ r.completedOrders }}</td>
                  <td style="text-align: right;">{{ r.cancelledOrders }}</td>
                  <td style="text-align: center;">{{ r.activeStaff }}</td>
                  <td style="text-align: center;">{{ r.tablesServed }}</td>
                  <td style="text-align: right;">{{ r.billsCount }}</td>
                  <td style="text-align: right;" class="font-bold text-green">{{ r.netRevenue | appCurrency }}</td>
                </tr>
                <tr *ngIf="!isTabLoading && reportRows.length === 0">
                  <td colspan="8" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">summarize</span>
                      <div class="empty-title">No data for this report</div>
                      <div class="empty-desc">Nothing matches the selected range.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ORDER ATTRIBUTION MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <div class="modal-backdrop" *ngIf="orderDetail" (click)="closeOrder()">
        <div class="modal-content st-modal" (click)="$event.stopPropagation()">
          <div class="modal-header-bar">
            <div class="modal-header-flex">
              <div class="modal-icon-badge"><span class="material-symbols-outlined">fact_check</span></div>
              <div>
                <div class="modal-title">Order {{ orderDetail.order.orderNumber }}</div>
                <div class="st-muted">{{ orderDetail.order.createdAt | date : 'dd MMM yyyy, HH:mm' }}</div>
              </div>
            </div>
            <button type="button" class="modal-close-btn" (click)="closeOrder()" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="modal-body-form">
            <div class="st-attr-grid">
              <div class="st-attr-item" *ngFor="let a of attributionRows()">
                <div class="st-attr-label">{{ a.label }}</div>
                <div class="st-attr-value" [class.st-attr-empty]="!a.staff">
                  {{ a.staff ? a.staff.name : 'Not recorded by this system' }}
                </div>
                <div class="st-attr-time" *ngIf="a.staff?.at">{{ a.staff.at | date : 'dd MMM, HH:mm' }}</div>
              </div>
            </div>

            <div class="st-section-title" style="margin-top: 18px;">Activity Timeline</div>
            <div class="st-timeline">
              <div class="st-timeline-item" *ngFor="let t of orderDetail.timeline">
                <div class="st-timeline-dot"></div>
                <div class="st-timeline-body">
                  <div class="st-timeline-top">
                    <span class="st-timeline-time">{{ t.at | date : 'HH:mm' }}</span>
                    <span class="st-timeline-actor">{{ t.actor ? t.actor.name : 'System' }}</span>
                  </div>
                  <div class="st-timeline-action">{{ humanise(t.action) }}</div>
                  <div class="st-muted" *ngIf="t.detail">{{ t.detail }}</div>
                </div>
              </div>
              <div class="st-muted" *ngIf="orderDetail.timeline.length === 0">No recorded activity for this order.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .spin-icon { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

      .st-muted { color: #6B7280; font-size: 11px; }
      .st-clickable { cursor: pointer; }
      .st-clickable:hover { transform: translateY(-2px); }

      /* Whole-row navigation. The left accent only appears on hover/focus so
         the resting table stays quiet, and focus-visible keeps the row
         reachable by keyboard as well as pointer. */
      .st-row-link { cursor: pointer; transition: background 0.14s ease; }
      .st-row-link:hover > td { background: #FAF7FE; }
      .st-row-link:hover > td:first-child { box-shadow: inset 3px 0 0 #7E22CE; }
      .st-row-link:focus-visible { outline: none; }
      .st-row-link:focus-visible > td { background: #F3E8FF; }
      .st-row-link:focus-visible > td:first-child { box-shadow: inset 3px 0 0 #7E22CE; }

      .st-card-note {
        margin-top: 8px;
        font-size: 10px;
        line-height: 1.45;
        color: #6B7280;
      }

      .st-section-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 16px 18px 12px;
        border-bottom: 1px solid #F1E9FB;
      }
      .st-section-title { font-size: 14px; font-weight: 800; color: #2E1065; }
      .st-section-sub { font-size: 11px; color: #6B7280; margin-top: 3px; max-width: 70ch; }

      .st-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
      @media (max-width: 1100px) { .st-grid-2 { grid-template-columns: 1fr; } }

      .st-scope-note {
        display: flex; align-items: center; gap: 8px;
        background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 16px;
        padding: 10px 16px; margin-bottom: 16px;
        font-size: 12px; font-weight: 600; color: #4C1D95;
      }
      .st-scope-note .material-symbols-rounded { font-size: 18px; }

      .st-live-bar {
        display: flex; align-items: center; justify-content: space-between;
        gap: 14px; flex-wrap: wrap;
        background: #FFFFFF; border: 1px solid #EDE4F8; border-radius: 16px;
        padding: 12px 16px; margin-bottom: 16px;
      }
      .st-live-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .st-live-label { font-size: 13px; font-weight: 800; color: #2E1065; }
      .st-live-sub { font-size: 11px; color: #6B7280; }

      .st-live-chip {
        display: inline-block; margin-left: 5px; padding: 1px 7px; border-radius: 999px;
        background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0;
        font-size: 9px; font-weight: 800;
      }

      .st-activity-cell { display: flex; flex-direction: column; gap: 2px; }
      .st-activity-label { font-size: 11px; font-weight: 700; color: #4C1D95; }
      .st-activity-time { font-size: 10px; color: #6B7280; }

      .st-inline-error {
        display: flex; align-items: center; gap: 12px;
        background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px;
        padding: 14px 16px; margin-bottom: 16px; color: #991B1B;
      }
      .st-inline-error-title { font-weight: 800; font-size: 13px; }
      .st-inline-error-desc { font-size: 11px; opacity: 0.9; }
      .st-inline-error .audit-btn { margin-left: auto; }

      .st-report-switch { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .st-preset-btn-lg {
        border: 1px solid #E9D5FF; background: #FFFFFF; color: #6B21A8;
        padding: 8px 16px; border-radius: 11px; font-size: 12px; font-weight: 700; cursor: pointer;
      }
      .st-preset-btn-lg.is-active { background: #7E22CE; color: #FFFFFF; border-color: #7E22CE; }

      .st-modal { max-width: 760px; width: 100%; max-height: 88vh; overflow-y: auto; }

      .st-attr-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;
      }
      .st-attr-item { background: #FAF7FE; border: 1px solid #EDE4F8; border-radius: 12px; padding: 11px 13px; }
      .st-attr-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: #7E22CE; }
      .st-attr-value { font-size: 13px; font-weight: 700; color: #2E1065; margin-top: 4px; }
      .st-attr-empty { color: #9CA3AF; font-weight: 500; font-style: italic; font-size: 11px; }
      .st-attr-time { font-size: 10px; color: #6B7280; margin-top: 2px; }

      .st-timeline { margin-top: 12px; padding-left: 6px; }
      .st-timeline-item { position: relative; padding-left: 20px; padding-bottom: 14px; border-left: 2px solid #EDE4F8; }
      .st-timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
      .st-timeline-dot {
        position: absolute; left: -6px; top: 2px; width: 10px; height: 10px;
        border-radius: 50%; background: #7E22CE; border: 2px solid #FFFFFF;
        box-shadow: 0 0 0 2px #EDE4F8;
      }
      .st-timeline-top { display: flex; align-items: center; gap: 8px; }
      .st-timeline-time { font-size: 11px; font-weight: 800; color: #7E22CE; font-family: ui-monospace, monospace; }
      .st-timeline-actor { font-size: 11px; font-weight: 700; color: #2E1065; }
      .st-timeline-action { font-size: 12px; color: #374151; margin-top: 1px; }
    `,
  ],
})
export class StaffTrackComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private staffTrackService = inject(StaffTrackService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public activeTab: TabKey = 'overview';
  public isBootLoading = true;
  public bootError: string | null = null;
  public isTabLoading = false;
  public tabError: string | null = null;

  /** Tabs already fetched, so switching back does not refetch needlessly. */
  private loadedTabs = new Set<TabKey>();

  public filters: StaffTrackFilters = {};

  /**
   * Set from the filter bar's `scopeChange`, which reports what the API said it
   * was serving rather than what the client thinks the user may see. The
   * default tab renders that bar, so this always resolves on load.
   */
  public selfScoped = false;

  public overview: StaffTrackOverview | null = null;
  public staff: StaffTrackRow[] = [];
  public live: any = null;
  public liveWindowMinutes = 30;
  public orders: any[] = [];
  public ordersPagination: any = null;
  public ordersPage = 1;
  public revenue: any = null;
  public tables: any = null;
  public activity: any[] = [];
  public activityPagination: any = null;
  public activityPage = 1;
  public orderDetail: any = null;

  public activeReport: 'orders' | 'revenue' | 'tables' | 'activity' | 'summary' = 'orders';
  public summaryPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  public reportRows: any[] = [];

  public tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'live', label: 'Live Activity', icon: 'sensors' },
    { key: 'performance', label: 'Staff Performance', icon: 'query_stats' },
    { key: 'orders', label: 'Orders', icon: 'receipt_long' },
    { key: 'revenue', label: 'Revenue', icon: 'payments' },
    { key: 'tables', label: 'Tables', icon: 'table_restaurant' },
    { key: 'activity', label: 'Activity History', icon: 'history' },
    { key: 'reports', label: 'Reports', icon: 'summarize' },
  ];

  public reportTypes = [
    { key: 'orders' as const, label: 'Staff Orders', icon: 'receipt_long' },
    { key: 'revenue' as const, label: 'Staff Revenue', icon: 'payments' },
    { key: 'tables' as const, label: 'Table Service', icon: 'table_restaurant' },
    { key: 'activity' as const, label: 'Staff Activity', icon: 'history' },
    { key: 'summary' as const, label: 'Summary', icon: 'calendar_month' },
  ];

  public windowOptions: DropdownOption[] = [
    { value: 15, label: 'Last 15 minutes', icon: 'timer' },
    { value: 30, label: 'Last 30 minutes', icon: 'timer' },
    { value: 60, label: 'Last hour', icon: 'timer' },
    { value: 240, label: 'Last 4 hours', icon: 'timer' },
    { value: 720, label: 'Last 12 hours', icon: 'timer' },
  ];

  ngOnInit(): void {
    const today = this.todayLocal();
    this.filters = { dateFrom: today, dateTo: today };

    const tab = this.route.snapshot.queryParamMap.get('tab') as TabKey | null;
    if (tab && this.tabs.some((t) => t.key === tab)) {
      this.activeTab = tab;
    }

    this.bootstrap();
  }

  private todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /**
   * The header always shows overview and the staff list, so both load once up
   * front; every other tab fetches lazily when first opened.
   */
  private bootstrap(): void {
    this.isBootLoading = true;
    this.bootError = null;
    forkJoin({
      overview: this.staffTrackService.getOverview(this.filters),
      staff: this.staffTrackService.getStaff(this.filters, 1, 100),
    }).subscribe({
      next: (res) => {
        this.isBootLoading = false;
        this.overview = res.overview.data;
        this.staff = res.staff.data || [];
        this.loadedTabs.add('overview');
        this.loadedTabs.add('performance');
        if (this.activeTab !== 'overview' && this.activeTab !== 'performance') {
          this.loadActiveTab();
        }
      },
      error: (err) => {
        this.isBootLoading = false;
        this.bootError = this.messageFor(err, 'Unable to load Staff Track.');
      },
    });
  }

  /** Backend messages are surfaced; anything else falls back to a plain line. */
  private messageFor(err: any, fallback: string): string {
    if (err?.status === 403) return 'You do not have permission to view Staff Track.';
    return err?.error?.message || fallback;
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
    this.tabError = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (!this.loadedTabs.has(tab)) {
      this.loadActiveTab();
    }
  }

  onFiltersChange(f: StaffTrackFilters): void {
    this.filters = { ...this.filters, ...f };
    this.ordersPage = 1;
    this.activityPage = 1;
    // A new range invalidates every cached tab, not just the visible one.
    this.loadedTabs.clear();
    this.reloadHeader();
    this.loadActiveTab();
  }

  private reloadHeader(): void {
    this.staffTrackService.getOverview(this.filters).subscribe({
      next: (res) => (this.overview = res.data),
      error: () => {},
    });
    this.staffTrackService.getStaff(this.filters, 1, 100).subscribe({
      next: (res) => {
        this.staff = res.data || [];
        this.loadedTabs.add('overview');
        this.loadedTabs.add('performance');
      },
      error: () => {},
    });
  }

  reloadAll(): void {
    this.loadedTabs.clear();
    this.bootstrap();
  }

  loadActiveTab(): void {
    this.tabError = null;
    switch (this.activeTab) {
      case 'overview':
      case 'performance':
        this.loadStaff();
        break;
      case 'live':
        this.loadLive();
        break;
      case 'orders':
        this.loadOrders();
        break;
      case 'revenue':
        this.loadRevenue();
        break;
      case 'tables':
        this.loadTables();
        break;
      case 'activity':
        this.loadActivity();
        break;
      case 'reports':
        this.loadReport();
        break;
    }
  }

  private handleError(err: any): void {
    this.isTabLoading = false;
    this.tabError = this.messageFor(err, 'Unable to load this view. Please try again.');
  }

  loadStaff(): void {
    this.isTabLoading = true;
    this.staffTrackService.getStaff(this.filters, 1, 100).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.staff = res.data || [];
        this.loadedTabs.add('overview');
        this.loadedTabs.add('performance');
      },
      error: (err) => this.handleError(err),
    });
  }

  loadLive(): void {
    this.isTabLoading = true;
    this.tabError = null;
    this.staffTrackService.getLive(this.liveWindowMinutes).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.live = res.data;
        this.loadedTabs.add('live');
      },
      error: (err) => this.handleError(err),
    });
  }

  loadOrders(): void {
    this.isTabLoading = true;
    this.staffTrackService.getOrders(this.filters, this.ordersPage, 25).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.orders = res.data || [];
        this.ordersPagination = res.pagination;
        this.loadedTabs.add('orders');
      },
      error: (err) => this.handleError(err),
    });
  }

  changeOrdersPage(page: number): void {
    if (page < 1 || (this.ordersPagination && page > this.ordersPagination.totalPages)) return;
    this.ordersPage = page;
    this.loadOrders();
  }

  loadRevenue(): void {
    this.isTabLoading = true;
    this.staffTrackService.getRevenue(this.filters).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.revenue = res.data;
        this.loadedTabs.add('revenue');
      },
      error: (err) => this.handleError(err),
    });
  }

  loadTables(): void {
    this.isTabLoading = true;
    this.staffTrackService.getTables(this.filters).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.tables = res.data;
        this.loadedTabs.add('tables');
      },
      error: (err) => this.handleError(err),
    });
  }

  loadActivity(): void {
    this.isTabLoading = true;
    this.staffTrackService.getActivity(this.filters, this.activityPage, 50).subscribe({
      next: (res) => {
        this.isTabLoading = false;
        this.activity = res.data || [];
        this.activityPagination = res.pagination;
        this.loadedTabs.add('activity');
      },
      error: (err) => this.handleError(err),
    });
  }

  changeActivityPage(page: number): void {
    if (page < 1 || (this.activityPagination && page > this.activityPagination.totalPages)) return;
    this.activityPage = page;
    this.loadActivity();
  }

  setReport(key: any): void {
    this.activeReport = key;
    this.loadReport();
  }

  setSummaryPeriod(p: any): void {
    this.summaryPeriod = p;
    this.loadReport();
  }

  loadReport(): void {
    this.isTabLoading = true;
    this.tabError = null;
    const done = (rows: any[]) => {
      this.isTabLoading = false;
      this.reportRows = rows || [];
      this.loadedTabs.add('reports');
    };

    if (this.activeReport === 'orders') {
      this.staffTrackService.getOrdersReport(this.filters).subscribe({
        next: (r) => done(r.data),
        error: (e) => this.handleError(e),
      });
    } else if (this.activeReport === 'revenue') {
      this.staffTrackService.getRevenueReport(this.filters).subscribe({
        next: (r) => done(r.data?.data),
        error: (e) => this.handleError(e),
      });
    } else if (this.activeReport === 'tables') {
      this.staffTrackService.getTablesReport(this.filters).subscribe({
        next: (r) => done(r.data?.perStaff),
        error: (e) => this.handleError(e),
      });
    } else if (this.activeReport === 'activity') {
      this.staffTrackService.getActivityReport(this.filters).subscribe({
        next: (r) => done(r.data),
        error: (e) => this.handleError(e),
      });
    } else {
      this.staffTrackService.getSummaryReport(this.summaryPeriod, this.filters).subscribe({
        next: (r) => done(r.data?.rows),
        error: (e) => this.handleError(e),
      });
    }
  }

  openOrder(orderId: number): void {
    this.staffTrackService.getOrderDetail(orderId).subscribe({
      next: (res) => (this.orderDetail = res.data),
      error: (err) => this.notify.error(this.messageFor(err, 'Unable to load order attribution.')),
    });
  }

  /**
   * Opens a staff record, carrying the current date range so the detail page
   * opens on the same window the row was read in.
   */
  openStaff(staffId: number): void {
    if (!staffId) return;
    this.router.navigate(['/staff-track/staff', staffId], { queryParams: this.dateQuery() });
  }

  closeOrder(): void {
    this.orderDetail = null;
  }

  /**
   * Only the roles the POS actually records appear. "Served by" and "Refunded
   * by" are absent because no flow writes them.
   */
  attributionRows(): { label: string; staff: any }[] {
    const a = this.orderDetail?.attribution;
    if (!a) return [];
    return [
      { label: 'Created By', staff: a.createdBy },
      { label: 'Started By', staff: a.startedBy },
      { label: 'Completed By', staff: a.completedBy },
      { label: 'Cancelled By', staff: a.cancelledBy },
      { label: 'Payment By', staff: a.paymentBy },
    ];
  }

  goToCancelled(): void {
    this.filters.orderStatus = 'CANCELLED';
    this.loadedTabs.delete('orders');
    this.setTab('orders');
  }

  dateQuery(): any {
    return { dateFrom: this.filters.dateFrom || '', dateTo: this.filters.dateTo || '' };
  }

  liveCount(): number {
    return this.live?.openOrders?.length || 0;
  }

  searchPlaceholder(): string {
    if (this.activeTab === 'orders') return 'Search order # or staffâ€¦';
    if (this.activeTab === 'activity') return 'Search staff or actionâ€¦';
    return 'Search staffâ€¦';
  }

  perTable(r: any): string {
    if (!r.tablesAttended) return 'â€”';
    return (r.tableOrders / r.tablesAttended).toFixed(1);
  }

  // â”€â”€ Display helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  humanise(value?: string | null): string {
    if (!value) return 'â€”';
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  resolveImage(url: string): string {
    return this.settingsService.assetUrl(url);
  }

  /** Seconds to a compact human duration; null means the POS never recorded it. */
  duration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return 'â€”';
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

  tableStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'OCCUPIED': return 'badge-warning';
      case 'AVAILABLE': return 'badge-success';
      case 'SELECTED': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  actionIcon(action?: string): string {
    const a = (action || '').toUpperCase();
    if (a.includes('LOGIN')) return 'login';
    if (a.includes('CHECKOUT') || a.includes('PAYMENT')) return 'point_of_sale';
    if (a.includes('CANCEL') || a.includes('DELETE')) return 'cancel';
    if (a.includes('CREATE')) return 'add_circle';
    if (a.includes('UPDATE') || a.includes('STATUS')) return 'edit_note';
    if (a.includes('TABLE')) return 'table_restaurant';
    if (a.includes('BILL')) return 'receipt';
    if (a.includes('STOCK')) return 'warehouse';
    return 'bolt';
  }

  actionBadgeClass(action?: string): string {
    const a = (action || '').toUpperCase();
    if (a.includes('CANCEL') || a.includes('DELETE')) return 'action-badge-danger';
    if (a.includes('CHECKOUT') || a.includes('PAYMENT') || a.includes('COMPLETE')) return 'action-badge-success';
    if (a.includes('UPDATE') || a.includes('STATUS')) return 'action-badge-warning';
    if (a.includes('LOGIN')) return 'action-badge-blue';
    return 'action-badge-purple';
  }

  /** Exports exactly what the visible tab is showing. */
  exportCsv(): void {
    let rows: any[] = [];
    let name = 'staff-track';

    switch (this.activeTab) {
      case 'overview':
      case 'performance':
        name = 'staff-performance';
        rows = this.staff.map((s) => ({
          Staff: s.name, Username: s.username, Role: s.roleName,
          OrdersTaken: s.ordersTaken, Completed: s.completedOrders, Cancelled: s.cancelledOrders,
          OrderValue: s.orderValue, AvgOrderValue: s.averageOrderValue, Revenue: s.revenue,
          BillsSettled: s.billsSettled, TablesAttended: s.tablesAttended, ItemsHandled: s.itemsHandled,
          AvgServiceSeconds: s.averageServiceSeconds ?? '',
        }));
        break;
      case 'live':
        name = 'live-tables';
        rows = (this.live?.currentTables || []).map((t: any) => ({
          Table: t.tableNumber, Staff: t.attendingStaff?.name || '', Order: t.order?.orderNumber || '',
          Amount: t.order?.totalAmount ?? '', Status: t.order?.status || t.status,
        }));
        break;
      case 'orders':
        name = 'staff-orders';
        rows = this.orders.map((o) => ({
          Order: o.orderNumber, TakenBy: o.createdBy?.name || '', SettledBy: o.settledBy?.name || '',
          Table: o.table?.tableNumber || '', Customer: o.customerName || '', Status: o.status,
          Payment: o.paymentStatus, Amount: o.totalAmount, Created: o.createdAt,
          DurationSeconds: o.durationSeconds ?? '',
        }));
        break;
      case 'revenue':
        name = 'staff-revenue';
        rows = (this.revenue?.data || []).map((r: any) => ({
          Staff: r.name, Role: r.roleName, Bills: r.billsCount, Gross: r.grossSales,
          Discount: r.discountAmount, Tax: r.taxAmount, NetRevenue: r.netRevenue,
          CancelledValue: r.cancelledValue,
        }));
        break;
      case 'tables':
        name = 'staff-tables';
        rows = (this.tables?.perStaff || []).map((s: any) => ({
          Staff: s.name, Role: s.roleName, TablesAttended: s.tablesAttended,
          TableOrders: s.tableOrders, TableRevenue: s.tableRevenue,
          AvgTableSeconds: s.averageTableSeconds ?? '',
        }));
        break;
      case 'activity':
        name = 'staff-activity';
        rows = this.activity.map((a) => ({
          When: a.at, Staff: a.actor?.name || 'System', Action: a.action, Module: a.module,
          Record: a.orderNumber || a.billNumber || a.recordId || '', Amount: a.amount ?? '',
        }));
        break;
      case 'reports':
        name = `staff-report-${this.activeReport}`;
        rows = this.reportRows;
        break;
    }

    if (!rows.length) {
      this.notify.warning('There is nothing to export on this view.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name}-${this.filters.dateFrom || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.notify.success('Export downloaded.');
  }
}

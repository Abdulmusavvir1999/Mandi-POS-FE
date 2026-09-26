import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { normalizeOrderType, orderTypeLabel } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppCurrencyPipe, PageLoaderComponent, ActionLoadingDirective],
  template: `
    <div class="dashboard-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading dashboard…"
        subMessage="Aggregating today's sales and operational metrics."
        icon="dashboard"
        (retry)="loadMetrics()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TOP EXECUTIVE HEADER & LIVE TELEMETRY ACTION BAR                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="dashboard-header-card">
        <div class="header-info-group">
          <div class="header-icon-badge">
            <span class="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <div class="header-title-row">
              <h1 class="header-title">Executive POS Command Center</h1>
              <span class="badge-live-pulse">
                <span class="pulse-dot"></span>
                <span>LIVE TELEMETRY</span>
              </span>
            </div>
            <p class="header-subtitle">
              Real-time revenue, order velocity, kitchen throughput, dining room occupancy & inventory analytics.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            (click)="loadMetrics()"
            [disabled]="isLoading"
            class="action-btn btn-secondary-white"
            title="Refresh real-time data from database"
          >
            <span class="material-symbols-outlined" [class.spin-icon]="isLoading">refresh</span>
            <span>{{ isLoading ? 'Refreshing...' : 'Refresh Data' }}</span>
          </button>

          <a routerLink="/pos" class="action-btn btn-primary-gradient">
            <span class="material-symbols-outlined">point_of_sale</span>
            <span>Launch POS Billing</span>
          </a>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. PRIMARY EXECUTIVE KPI STATS (4 HIGH-IMPACT HERO CARDS)        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="primary-kpi-grid" *ngIf="metrics?.kpis as kpi">
        <!-- CARD 1: TODAY'S REVENUE -->
        <div class="kpi-hero-card card-purple">
          <div class="kpi-top-row">
            <div class="kpi-label-group">
              <span class="kpi-tag-pill tag-purple">Financial Aggregate</span>
              <h3 class="kpi-hero-label">Today's Revenue</h3>
            </div>
            <div class="kpi-icon-bubble bubble-purple">
              <span class="material-symbols-outlined">payments</span>
            </div>
          </div>

          <div class="kpi-value-row">
            <span class="kpi-main-number font-mono">
              {{ kpi.todaySales | appCurrency:'1.0-0' }}
            </span>
            <span class="kpi-trend-pill trend-purple">
              <span class="material-symbols-outlined">trending_up</span>
              <span>Active Shift</span>
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="material-symbols-outlined metric-icon-purple text-sm">receipt_long</span>
              <span class="font-bold footer-val">{{ kpi.todayBillsCount }}</span>
              <span class="footer-lbl">Bills Settled</span>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-metric">
              <span class="footer-lbl">Avg Ticket:</span>
              <span class="font-bold font-mono metric-text-purple">{{ kpi.avgOrderValue | appCurrency:'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <!-- CARD 2: TOTAL ORDERS VOLUME -->
        <div class="kpi-hero-card card-emerald">
          <div class="kpi-top-row">
            <div class="kpi-label-group">
              <span class="kpi-tag-pill tag-emerald">Order Flow</span>
              <h3 class="kpi-hero-label">Today's Orders</h3>
            </div>
            <div class="kpi-icon-bubble bubble-emerald">
              <span class="material-symbols-outlined">shopping_bag</span>
            </div>
          </div>

          <div class="kpi-value-row">
            <span class="kpi-main-number font-mono">
              {{ kpi.todayOrdersCount }}
            </span>
            <span class="kpi-sub-total font-mono text-xs font-semibold">
              ({{ kpi.allTimeOrdersCount }} Lifetime)
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="status-badge-dot dot-emerald"></span>
              <span class="font-bold metric-text-emerald">{{ kpi.completedOrders }}</span>
              <span class="footer-lbl">Completed</span>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-metric">
              <span class="status-badge-dot dot-amber"></span>
              <span class="font-bold metric-text-amber">{{ kpi.inProgressOrders + kpi.pendingOrders }}</span>
              <span class="footer-lbl">In Kitchen</span>
            </div>
          </div>
        </div>

        <!-- CARD 3: DINING ROOM OCCUPANCY -->
        <div class="kpi-hero-card card-amber">
          <div class="kpi-top-row">
            <div class="kpi-label-group">
              <span class="kpi-tag-pill tag-amber">Table Management</span>
              <h3 class="kpi-hero-label">Dining Occupancy</h3>
            </div>
            <div class="kpi-icon-bubble bubble-amber">
              <span class="material-symbols-outlined">table_restaurant</span>
            </div>
          </div>

          <div class="kpi-value-row">
            <div class="flex items-baseline gap-1.5 font-mono">
              <span class="kpi-main-number">{{ kpi.occupiedTables }}</span>
              <span class="text-lg font-bold footer-lbl">/ {{ kpi.totalTables }}</span>
            </div>
            <span class="kpi-badge-rate font-mono font-bold" [ngClass]="kpi.occupancyRate > 75 ? 'rate-high' : 'rate-normal'">
              {{ kpi.occupancyRate }}% Occupied
            </span>
          </div>

          <!-- Capacity Bar -->
          <div class="occupancy-progress-bar">
            <div
              class="occupancy-fill"
              [style.width.%]="kpi.occupancyRate"
              [ngClass]="kpi.occupancyRate > 75 ? 'fill-amber-high' : 'fill-amber-normal'"
            ></div>
          </div>

          <div class="kpi-footer-strip mt-2">
            <div class="footer-metric">
              <span class="material-symbols-outlined metric-icon-emerald text-sm">event_seat</span>
              <span class="font-bold metric-text-emerald">{{ kpi.availableTables }}</span>
              <span class="footer-lbl">Tables Ready</span>
            </div>
            <div class="footer-divider"></div>
            <a routerLink="/tables" class="footer-link metric-text-amber hover:underline font-bold flex items-center gap-0.5">
              <span>View Floor Map</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
        </div>

        <!-- CARD 4: INVENTORY HEALTH & ALERTS -->
        <div class="kpi-hero-card card-rose">
          <div class="kpi-top-row">
            <div class="kpi-label-group">
              <span class="kpi-tag-pill tag-rose">Stock Telemetry</span>
              <h3 class="kpi-hero-label">Inventory Status</h3>
            </div>
            <div class="kpi-icon-bubble bubble-rose">
              <span class="material-symbols-outlined">{{ kpi.lowStockCount > 0 ? 'warning' : 'inventory_2' }}</span>
            </div>
          </div>

          <div class="kpi-value-row">
            <span class="kpi-main-number font-mono" [ngClass]="kpi.lowStockCount > 0 ? 'metric-text-rose' : ''">
              {{ kpi.lowStockCount }}
            </span>
            <span class="kpi-tag-pill" [ngClass]="kpi.lowStockCount > 0 ? 'tag-danger' : 'tag-success'">
              {{ kpi.lowStockCount > 0 ? 'Action Needed' : 'Healthy Stock' }}
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="font-bold footer-val">{{ kpi.totalProducts }}</span>
              <span class="footer-lbl">Active Delicacies</span>
            </div>
            <div class="footer-divider"></div>
            <a routerLink="/stock" class="footer-link metric-text-rose hover:underline font-bold flex items-center gap-0.5">
              <span>Stock Center</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SECONDARY INTELLIGENCE GRID (4 EXECUTIVE QUICK-STAT PILLS)   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="secondary-metrics-grid" *ngIf="metrics?.kpis as kpi">
        <!-- Stat Pill 1: Average Order Value -->
        <div class="quick-metric-card">
          <div class="quick-icon-box icon-box-blue">
            <span class="material-symbols-outlined">receipt</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Avg Order Value (AOV)</span>
            <div class="quick-value font-mono">{{ kpi.avgOrderValue | appCurrency:'1.0-0' }}</div>
          </div>
          <div class="quick-chip chip-blue">Per Bill</div>
        </div>

        <!-- Stat Pill 2: Kitchen & Queue Throughput -->
        <div class="quick-metric-card">
          <div class="quick-icon-box icon-box-purple">
            <span class="material-symbols-outlined">soup_kitchen</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Active Kitchen KOTs</span>
            <div class="quick-value font-mono metric-text-purple">{{ kpi.inProgressOrders + kpi.pendingOrders }} Orders</div>
          </div>
          <a routerLink="/queue" class="quick-chip chip-purple">
            Live Queue →
          </a>
        </div>

        <!-- Stat Pill 3: Tax & Discounts Collected -->
        <div class="quick-metric-card">
          <div class="quick-icon-box icon-box-teal">
            <span class="material-symbols-outlined">percent</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Tax & Discount Audit</span>
            <div class="quick-value font-mono metric-text-teal">{{ kpi.todayTax | appCurrency:'1.0-0' }} <span class="text-xs font-normal footer-lbl">GST</span></div>
          </div>
          <div class="quick-chip chip-teal font-mono">-{{ kpi.todayDiscount | appCurrency:'1.0-0' }} Disc</div>
        </div>

        <!-- Stat Pill 4: Customer CRM Base -->
        <div class="quick-metric-card">
          <div class="quick-icon-box icon-box-indigo">
            <span class="material-symbols-outlined">group</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Patron Directory</span>
            <div class="quick-value font-mono">{{ kpi.totalCustomers }} Customers</div>
          </div>
          <a routerLink="/customers" class="quick-chip chip-indigo">
            CRM Directory →
          </a>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. MAIN ANALYTICS SPLIT: CATEGORIES, DELICACIES, PAYMENTS & FEED -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="analytics-layout-grid">
        <!-- LEFT COLUMN: CATEGORIES & TOP DELICACIES -->
        <div class="analytics-main-col">
          <!-- 1. Category Revenue Share -->
          <div class="dashboard-panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-2.5">
                <div class="panel-icon-wrap icon-box-purple">
                  <span class="material-symbols-outlined">category</span>
                </div>
                <div>
                  <h3 class="panel-title">Sales by Delicacy Category</h3>
                  <p class="panel-subtitle">Revenue contribution and unit volumes per menu section</p>
                </div>
              </div>
              <span class="badge-pill-purple font-mono">{{ metrics?.categorySales?.length || 0 }} Categories</span>
            </div>

            <div *ngIf="metrics?.categorySales?.length === 0" class="empty-state-box">
              <span class="material-symbols-outlined text-3xl empty-icon">receipt_long</span>
              <p class="text-xs footer-lbl mt-1">No sales recorded yet today.</p>
            </div>

            <div class="category-bars-list" *ngIf="metrics?.categorySales?.length > 0">
              <div class="category-item-row" *ngFor="let cat of metrics?.categorySales">
                <div class="cat-info-line">
                  <div class="flex items-center gap-2">
                    <span class="cat-icon-badge">{{ cat.icon || '🍽️' }}</span>
                    <span class="cat-name">{{ cat.category_name }}</span>
                    <span class="cat-sold-pill">{{ cat.total_quantity }} sold</span>
                  </div>
                  <div class="cat-revenue-box font-mono">
                    <span class="cat-amount">{{ cat.total_revenue | appCurrency:'1.0-0' }}</span>
                    <span class="cat-percent">({{ calcPercentage(cat.total_revenue) | number:'1.0-1' }}%)</span>
                  </div>
                </div>

                <div class="cat-meter-track">
                  <div
                    class="cat-meter-fill"
                    [style.width.%]="calcPercentage(cat.total_revenue)"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Top Selling Delicacies Leaderboard -->
          <div class="dashboard-panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-2.5">
                <div class="panel-icon-wrap icon-box-amber">
                  <span class="material-symbols-outlined">local_fire_department</span>
                </div>
                <div>
                  <h3 class="panel-title">Top Selling Delicacies Leaderboard</h3>
                  <p class="panel-subtitle">Most popular dishes by units sold and gross sales value</p>
                </div>
              </div>
              <span class="badge-pill-amber">Hot Sellers 🔥</span>
            </div>

            <div *ngIf="metrics?.topProducts?.length === 0" class="empty-state-box">
              <span class="material-symbols-outlined text-3xl empty-icon">restaurant_menu</span>
              <p class="text-xs footer-lbl mt-1">No delicacy sales recorded yet.</p>
            </div>

            <div class="delicacies-grid" *ngIf="metrics?.topProducts?.length > 0">
              <div
                *ngFor="let p of metrics?.topProducts; let i = index"
                class="delicacy-card-item"
              >
                <div class="delicacy-left">
                  <!-- Rank Badge -->
                  <div class="rank-badge" [ngClass]="getRankBadgeClass(i)">
                    <span *ngIf="i === 0">👑</span>
                    <span *ngIf="i > 0">#{{ i + 1 }}</span>
                  </div>

                  <div class="delicacy-details">
                    <div class="delicacy-title">{{ p.product_name }}</div>
                    <div class="delicacy-meta">
                      <span class="meta-tag">{{ p.category_name }}</span>
                      <span class="meta-sku font-mono" *ngIf="p.sku">{{ p.sku }}</span>
                    </div>
                  </div>
                </div>

                <div class="delicacy-right font-mono">
                  <div class="delicacy-sold-badge">{{ p.total_sold }} units</div>
                  <div class="delicacy-revenue">{{ p.total_revenue | appCurrency:'1.0-0' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: PAYMENT BREAKDOWN & LIVE RECENT ORDERS -->
        <div class="analytics-side-col">
          <!-- 1. Payment Channels -->
          <div class="dashboard-panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-2.5">
                <div class="panel-icon-wrap icon-box-emerald">
                  <span class="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <div>
                  <h3 class="panel-title">Payment Channels</h3>
                  <p class="panel-subtitle">Tender breakdown & settlements</p>
                </div>
              </div>
            </div>

            <div class="payment-channels-grid" *ngIf="metrics?.paymentBreakdown as payments">
              <div *ngFor="let pm of payments" class="payment-pill-box">
                <div class="pm-top-row">
                  <div class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm metric-icon-emerald">
                      {{ getPaymentIcon(pm.payment_method) }}
                    </span>
                    <span class="pm-name">{{ pm.payment_method }}</span>
                  </div>
                  <span class="pm-txns font-mono">{{ pm.transaction_count }} Txns</span>
                </div>
                <div class="pm-amount font-mono">
                  {{ pm.total_amount | appCurrency:'1.0-0' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Live Recent Orders Feed -->
          <div class="dashboard-panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-2.5">
                <div class="panel-icon-wrap icon-box-purple">
                  <span class="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <h3 class="panel-title">Live Orders Feed</h3>
                  <p class="panel-subtitle">Latest tickets across dine-in & takeaway</p>
                </div>
              </div>
              <a routerLink="/orders" class="footer-link metric-text-purple hover:underline font-bold flex items-center gap-0.5">
                <span>View All</span>
                <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>

            <div *ngIf="metrics?.recentOrders?.length === 0" class="empty-state-box">
              <span class="material-symbols-outlined text-3xl empty-icon">receipt</span>
              <p class="text-xs footer-lbl mt-1">No recent orders found.</p>
            </div>

            <div class="recent-orders-list" *ngIf="metrics?.recentOrders?.length > 0">
              <div
                *ngFor="let order of metrics?.recentOrders"
                class="order-feed-item"
              >
                <div class="order-feed-info">
                  <div class="flex items-center gap-2">
                    <span class="order-number-tag font-mono font-bold">{{ order.order_number }}</span>
                    <span class="order-type-chip" [ngClass]="getOrderTypeClass(order.order_type)">
                      {{ formatOrderType(order.order_type) }}
                    </span>
                  </div>
                  <div class="order-customer-line">
                    <span class="customer-name">{{ order.customer_name || 'Walk-in Guest' }}</span>
                    <span *ngIf="order.table_number" class="table-tag font-mono">Table {{ order.table_number }}</span>
                  </div>
                </div>

                <div class="order-feed-status text-right">
                  <span
                    class="status-pill"
                    [ngClass]="{
                      'status-completed': order.status === 'COMPLETED',
                      'status-progress': order.status === 'IN_PROGRESS',
                      'status-cancelled': order.status === 'CANCELLED',
                      'status-pending': order.status === 'PENDING'
                    }"
                  >
                    {{ order.status }}
                  </span>
                  <div class="order-amount font-mono font-bold">
                    {{ order.total_amount | appCurrency:'1.0-0' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Quick Action Operations Bar -->
          <div class="dashboard-panel-card quick-ops-card">
            <h4 class="quick-ops-title">Quick POS Shortcuts</h4>
            <div class="quick-ops-grid">
              <a routerLink="/pos" class="ops-shortcut-btn btn-ops-purple">
                <span class="material-symbols-outlined">point_of_sale</span>
                <span>New POS Bill</span>
              </a>
              <a routerLink="/tables" class="ops-shortcut-btn btn-ops-amber">
                <span class="material-symbols-outlined">table_restaurant</span>
                <span>Table Floor</span>
              </a>
              <a routerLink="/queue" class="ops-shortcut-btn btn-ops-emerald">
                <span class="material-symbols-outlined">soup_kitchen</span>
                <span>Kitchen Queue</span>
              </a>
              <a routerLink="/products" class="ops-shortcut-btn btn-ops-blue">
                <span class="material-symbols-outlined">restaurant_menu</span>
                <span>Menu Items</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    /* HEADER CARD */
    .dashboard-header-card {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-left: 4px solid var(--primary, #7E22CE);
      border-radius: 1.25rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 4px 20px -4px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.08));
    }
    @media (min-width: 640px) {
      .dashboard-header-card {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .header-info-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon-badge {
      width: 3rem;
      height: 3rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.25));
      flex-shrink: 0;
    }
    .header-icon-badge .material-symbols-outlined {
      font-size: 1.75rem;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .header-title {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--text-main, #2E1065);
      letter-spacing: -0.02em;
      margin: 0;
    }

    .badge-live-pulse {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.12);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .pulse-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 9999px;
      background: #10B981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulseAnimation 1.8s infinite;
    }

    @keyframes pulseAnimation {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .header-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted, #64748B);
      font-weight: 500;
      margin-top: 0.2rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-secondary-white {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
    }
    .btn-secondary-white:hover:not(:disabled) {
      background: var(--card-hover, #F3E8FF);
      border-color: var(--primary, #D8B4FE);
      transform: translateY(-1px);
    }

    .btn-primary-gradient {
      background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
      color: #FFFFFF;
      border: 1px solid transparent;
      box-shadow: 0 4px 14px var(--primary-glow, rgba(126, 34, 206, 0.25));
    }
    .btn-primary-gradient:hover {
      background: linear-gradient(135deg, var(--primary-hover, #6B21A8), var(--primary, #7E22CE));
      transform: translateY(-1px);
      box-shadow: 0 6px 18px var(--primary-glow, rgba(126, 34, 206, 0.35));
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* ═══════════════════════════════════════════════════════════════ */
    /* 1. PRIMARY HERO KPI GRID                                        */
    /* ═══════════════════════════════════════════════════════════════ */
    .primary-kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 640px) {
      .primary-kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .primary-kpi-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .kpi-hero-card {
      background: var(--card-bg, #FFFFFF);
      border-radius: 1.25rem;
      padding: 1.25rem;
      border: 1px solid var(--card-border, #E2E8F0);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.85rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .kpi-hero-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.09);
    }

    /* Cohesive card themes with delicate translucent top accents (NO harsh opaque fills) */
    .card-purple {
      border-top: 3px solid var(--primary, #8B5CF6);
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, var(--card-bg, #FFFFFF) 42%);
    }
    .card-purple:hover {
      border-top-color: var(--primary-hover, #A78BFA);
    }

    .card-emerald {
      border-top: 3px solid #10B981;
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, var(--card-bg, #FFFFFF) 42%);
    }
    .card-emerald:hover {
      border-top-color: #34D399;
    }

    .card-amber {
      border-top: 3px solid #F59E0B;
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, var(--card-bg, #FFFFFF) 42%);
    }
    .card-amber:hover {
      border-top-color: #FBBF24;
    }

    .card-rose {
      border-top: 3px solid #F43F5E;
      background: linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, var(--card-bg, #FFFFFF) 42%);
    }
    .card-rose:hover {
      border-top-color: #FB7185;
    }

    .kpi-top-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .kpi-label-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .kpi-tag-pill {
      display: inline-block;
      width: fit-content;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.18rem 0.55rem;
      border-radius: 0.45rem;
      transition: all 0.2s ease;
    }

    .tag-purple {
      background: rgba(139, 92, 246, 0.14);
      color: var(--primary, #9333EA);
      border: 1px solid rgba(139, 92, 246, 0.28);
    }
    .tag-emerald {
      background: rgba(16, 185, 129, 0.14);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.28);
    }
    .tag-amber {
      background: rgba(245, 158, 11, 0.14);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.28);
    }
    .tag-rose {
      background: rgba(244, 63, 94, 0.14);
      color: #E11D48;
      border: 1px solid rgba(244, 63, 94, 0.28);
    }
    .tag-success {
      background: rgba(16, 185, 129, 0.14);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.28);
    }
    .tag-danger {
      background: rgba(239, 68, 68, 0.14);
      color: #DC2626;
      border: 1px solid rgba(239, 68, 68, 0.28);
    }

    /* Dark theme badge refinements */
    :host-context(.dark-theme) .tag-purple,
    :host-context([data-theme="dark"]) .tag-purple,
    .dark-theme .tag-purple {
      background: rgba(139, 92, 246, 0.2);
      color: #C4B5FD;
      border-color: rgba(139, 92, 246, 0.4);
    }
    :host-context(.dark-theme) .tag-emerald,
    :host-context([data-theme="dark"]) .tag-emerald,
    .dark-theme .tag-emerald {
      background: rgba(16, 185, 129, 0.2);
      color: #6EE7B7;
      border-color: rgba(16, 185, 129, 0.4);
    }
    :host-context(.dark-theme) .tag-amber,
    :host-context([data-theme="dark"]) .tag-amber,
    .dark-theme .tag-amber {
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border-color: rgba(245, 158, 11, 0.4);
    }
    :host-context(.dark-theme) .tag-rose,
    :host-context([data-theme="dark"]) .tag-rose,
    .dark-theme .tag-rose {
      background: rgba(244, 63, 94, 0.2);
      color: #FDA4AF;
      border-color: rgba(244, 63, 94, 0.4);
    }
    :host-context(.dark-theme) .tag-success,
    :host-context([data-theme="dark"]) .tag-success,
    .dark-theme .tag-success {
      background: rgba(16, 185, 129, 0.2);
      color: #6EE7B7;
      border-color: rgba(16, 185, 129, 0.4);
    }
    :host-context(.dark-theme) .tag-danger,
    :host-context([data-theme="dark"]) .tag-danger,
    .dark-theme .tag-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #FCA5A5;
      border-color: rgba(239, 68, 68, 0.4);
    }

    .kpi-hero-label {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .kpi-icon-bubble {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-hero-card:hover .kpi-icon-bubble {
      transform: scale(1.05);
    }

    .bubble-purple {
      background: rgba(139, 92, 246, 0.12);
      color: var(--primary, #7E22CE);
      border: 1px solid rgba(139, 92, 246, 0.25);
    }
    .bubble-emerald {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .bubble-amber {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .bubble-rose {
      background: rgba(244, 63, 94, 0.12);
      color: #E11D48;
      border: 1px solid rgba(244, 63, 94, 0.25);
    }

    :host-context(.dark-theme) .bubble-purple, .dark-theme .bubble-purple { color: #C4B5FD; background: rgba(139, 92, 246, 0.2); }
    :host-context(.dark-theme) .bubble-emerald, .dark-theme .bubble-emerald { color: #6EE7B7; background: rgba(16, 185, 129, 0.2); }
    :host-context(.dark-theme) .bubble-amber, .dark-theme .bubble-amber { color: #FCD34D; background: rgba(245, 158, 11, 0.2); }
    :host-context(.dark-theme) .bubble-rose, .dark-theme .bubble-rose { color: #FDA4AF; background: rgba(244, 63, 94, 0.2); }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.35rem 0.5rem;
      min-width: 0;
    }

    .kpi-main-number {
      font-size: 1.85rem;
      font-weight: 900;
      color: var(--text-main, #0F172A);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .kpi-sub-total {
      color: var(--text-muted, #64748B);
    }

    .kpi-trend-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }
    .kpi-trend-pill .material-symbols-outlined { font-size: 0.85rem; }

    .trend-purple {
      background: rgba(139, 92, 246, 0.12);
      color: var(--primary, #7E22CE);
      border: 1px solid rgba(139, 92, 246, 0.25);
    }
    :host-context(.dark-theme) .trend-purple, .dark-theme .trend-purple {
      background: rgba(139, 92, 246, 0.2);
      color: #C4B5FD;
      border-color: rgba(139, 92, 246, 0.35);
    }

    .kpi-badge-rate {
      font-size: 0.72rem;
      padding: 0.2rem 0.55rem;
      border-radius: 0.5rem;
    }
    .rate-normal {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .rate-high {
      background: rgba(239, 68, 68, 0.14);
      color: #DC2626;
      border: 1px solid rgba(239, 68, 68, 0.28);
      font-weight: 900;
    }
    :host-context(.dark-theme) .rate-normal, .dark-theme .rate-normal {
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border-color: rgba(245, 158, 11, 0.35);
    }
    :host-context(.dark-theme) .rate-high, .dark-theme .rate-high {
      background: rgba(239, 68, 68, 0.2);
      color: #FCA5A5;
      border-color: rgba(239, 68, 68, 0.35);
    }

    .occupancy-progress-bar {
      width: 100%;
      height: 0.45rem;
      background: var(--card-hover, rgba(0, 0, 0, 0.06));
      border-radius: 9999px;
      overflow: hidden;
      border: 1px solid var(--card-border, rgba(0, 0, 0, 0.04));
    }
    .occupancy-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .fill-amber-normal {
      background: linear-gradient(90deg, #F59E0B, #FBBF24);
    }
    .fill-amber-high {
      background: linear-gradient(90deg, #EF4444, #F87171);
    }

    .kpi-footer-strip {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--card-border, #E2E8F0);
      font-size: 0.75rem;
    }

    .footer-metric {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .footer-val {
      color: var(--text-main, #0F172A);
    }

    .footer-lbl {
      color: var(--text-muted, #64748B);
    }

    .footer-divider {
      width: 1px;
      height: 0.85rem;
      background: var(--card-border, #CBD5E1);
    }

    .footer-link {
      text-decoration: none;
      font-size: 0.75rem;
    }

    .metric-text-purple { color: var(--primary, #7E22CE); }
    .metric-text-emerald { color: #059669; }
    .metric-text-amber { color: #D97706; }
    .metric-text-rose { color: #E11D48; }
    .metric-text-teal { color: #0D9488; }

    .metric-icon-purple { color: var(--primary, #7E22CE); }
    .metric-icon-emerald { color: #059669; }
    .metric-icon-amber { color: #D97706; }
    .metric-icon-rose { color: #E11D48; }

    :host-context(.dark-theme) .metric-text-purple, .dark-theme .metric-text-purple { color: #C4B5FD; }
    :host-context(.dark-theme) .metric-text-emerald, .dark-theme .metric-text-emerald { color: #6EE7B7; }
    :host-context(.dark-theme) .metric-text-amber, .dark-theme .metric-text-amber { color: #FCD34D; }
    :host-context(.dark-theme) .metric-text-rose, .dark-theme .metric-text-rose { color: #FDA4AF; }
    :host-context(.dark-theme) .metric-text-teal, .dark-theme .metric-text-teal { color: #5EEAD4; }

    :host-context(.dark-theme) .metric-icon-purple, .dark-theme .metric-icon-purple { color: #C4B5FD; }
    :host-context(.dark-theme) .metric-icon-emerald, .dark-theme .metric-icon-emerald { color: #6EE7B7; }
    :host-context(.dark-theme) .metric-icon-amber, .dark-theme .metric-icon-amber { color: #FCD34D; }
    :host-context(.dark-theme) .metric-icon-rose, .dark-theme .metric-icon-rose { color: #FDA4AF; }

    .status-badge-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 9999px;
    }
    .dot-emerald { background: #10B981; }
    .dot-amber { background: #F59E0B; }

    /* ═══════════════════════════════════════════════════════════════ */
    /* 2. SECONDARY INTELLIGENCE GRID                                  */
    /* ═══════════════════════════════════════════════════════════════ */
    .secondary-metrics-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.85rem;
    }
    @media (min-width: 640px) {
      .secondary-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .secondary-metrics-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .quick-metric-card {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 1rem;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .quick-metric-card:hover {
      transform: translateY(-1px);
      border-color: var(--primary, #CBD5E1);
    }

    .quick-icon-box {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid transparent;
    }
    .quick-icon-box .material-symbols-outlined { font-size: 1.25rem; }

    .icon-box-blue {
      background: rgba(59, 130, 246, 0.12);
      color: #2563EB;
      border-color: rgba(59, 130, 246, 0.25);
    }
    .icon-box-purple {
      background: rgba(139, 92, 246, 0.12);
      color: var(--primary, #7E22CE);
      border-color: rgba(139, 92, 246, 0.25);
    }
    .icon-box-teal {
      background: rgba(20, 184, 166, 0.12);
      color: #0D9488;
      border-color: rgba(20, 184, 166, 0.25);
    }
    .icon-box-indigo {
      background: rgba(99, 102, 241, 0.12);
      color: #4F46E5;
      border-color: rgba(99, 102, 241, 0.25);
    }
    .icon-box-amber {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
      border-color: rgba(245, 158, 11, 0.25);
    }
    .icon-box-emerald {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border-color: rgba(16, 185, 129, 0.25);
    }

    :host-context(.dark-theme) .icon-box-blue, .dark-theme .icon-box-blue { color: #93C5FD; background: rgba(59, 130, 246, 0.2); }
    :host-context(.dark-theme) .icon-box-purple, .dark-theme .icon-box-purple { color: #C4B5FD; background: rgba(139, 92, 246, 0.2); }
    :host-context(.dark-theme) .icon-box-teal, .dark-theme .icon-box-teal { color: #5EEAD4; background: rgba(20, 184, 166, 0.2); }
    :host-context(.dark-theme) .icon-box-indigo, .dark-theme .icon-box-indigo { color: #A5B4FC; background: rgba(99, 102, 241, 0.2); }
    :host-context(.dark-theme) .icon-box-amber, .dark-theme .icon-box-amber { color: #FCD34D; background: rgba(245, 158, 11, 0.2); }
    :host-context(.dark-theme) .icon-box-emerald, .dark-theme .icon-box-emerald { color: #6EE7B7; background: rgba(16, 185, 129, 0.2); }

    .quick-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .quick-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted, #64748B);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .quick-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main, #0F172A);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quick-chip {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.22rem 0.55rem;
      border-radius: 0.5rem;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .chip-blue {
      background: rgba(59, 130, 246, 0.12);
      color: #2563EB;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }
    .chip-purple {
      background: rgba(139, 92, 246, 0.12);
      color: var(--primary, #7E22CE);
      border: 1px solid rgba(139, 92, 246, 0.25);
    }
    .chip-purple:hover {
      background: rgba(139, 92, 246, 0.22);
    }
    .chip-teal {
      background: rgba(20, 184, 166, 0.12);
      color: #0D9488;
      border: 1px solid rgba(20, 184, 166, 0.25);
    }
    .chip-indigo {
      background: rgba(99, 102, 241, 0.12);
      color: #4F46E5;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    .chip-indigo:hover {
      background: rgba(99, 102, 241, 0.22);
    }

    :host-context(.dark-theme) .chip-blue, .dark-theme .chip-blue { color: #93C5FD; background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.35); }
    :host-context(.dark-theme) .chip-purple, .dark-theme .chip-purple { color: #C4B5FD; background: rgba(139, 92, 246, 0.2); border-color: rgba(139, 92, 246, 0.35); }
    :host-context(.dark-theme) .chip-teal, .dark-theme .chip-teal { color: #5EEAD4; background: rgba(20, 184, 166, 0.2); border-color: rgba(20, 184, 166, 0.35); }
    :host-context(.dark-theme) .chip-indigo, .dark-theme .chip-indigo { color: #A5B4FC; background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.35); }

    /* ═══════════════════════════════════════════════════════════════ */
    /* 3. ANALYTICS SPLIT LAYOUT                                       */
    /* ═══════════════════════════════════════════════════════════════ */
    .analytics-layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 1024px) {
      .analytics-layout-grid {
        grid-template-columns: 1.5fr 1fr;
      }
    }

    .analytics-main-col,
    .analytics-side-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .dashboard-panel-card {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 1.25rem;
      padding: 1.25rem;
      box-shadow: 0 4px 18px -4px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--card-border, #F1F5F9);
    }

    .panel-icon-wrap {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid transparent;
    }
    .panel-icon-wrap .material-symbols-outlined { font-size: 1.25rem; }

    .panel-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
      margin: 0;
    }

    .panel-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted, #64748B);
      margin: 0;
    }

    .badge-pill-purple {
      background: rgba(139, 92, 246, 0.12);
      color: var(--primary, #7E22CE);
      border: 1px solid rgba(139, 92, 246, 0.25);
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }
    :host-context(.dark-theme) .badge-pill-purple, .dark-theme .badge-pill-purple {
      background: rgba(139, 92, 246, 0.2);
      color: #C4B5FD;
      border-color: rgba(139, 92, 246, 0.35);
    }

    .badge-pill-amber {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.25);
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }
    :host-context(.dark-theme) .badge-pill-amber, .dark-theme .badge-pill-amber {
      background: rgba(245, 158, 11, 0.2);
      color: #FCD34D;
      border-color: rgba(245, 158, 11, 0.35);
    }

    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
    }
    .empty-icon {
      color: var(--text-dim, #94A3B8);
    }

    /* Category Meters */
    .category-bars-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .category-item-row {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .cat-info-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .cat-icon-badge {
      font-size: 1rem;
    }

    .cat-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-main, #1E293B);
    }

    .cat-sold-pill {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted, #64748B);
      background: var(--bg-app, #F8FAFC);
      border: 1px solid var(--card-border, #E2E8F0);
      padding: 0.1rem 0.4rem;
      border-radius: 0.35rem;
    }

    .cat-revenue-box {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .cat-percent {
      font-size: 0.72rem;
      color: var(--text-dim, #94A3B8);
      font-weight: 600;
    }

    .cat-meter-track {
      width: 100%;
      height: 0.5rem;
      background: var(--card-hover, #F8FAFC);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 9999px;
      overflow: hidden;
    }

    .cat-meter-fill {
      height: 100%;
      border-radius: 9999px;
      background: linear-gradient(90deg, var(--primary, #7E22CE), var(--primary-hover, #C084FC));
      transition: width 0.5s ease;
    }

    /* Delicacies Leaderboard */
    .delicacies-grid {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .delicacy-card-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.7rem 0.85rem;
      border-radius: 0.85rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #F3E8FF);
      transition: all 0.15s ease;
    }
    .delicacy-card-item:hover {
      border-color: var(--primary, #E9D5FF);
      background: var(--card-hover, #F5E8FF);
      transform: translateX(2px);
    }

    .delicacy-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .rank-badge {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 0.55rem;
      font-size: 0.75rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .rank-gold {
      background: rgba(245, 158, 11, 0.16);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }
    .rank-silver {
      background: rgba(148, 163, 184, 0.16);
      color: #475569;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .rank-bronze {
      background: rgba(234, 88, 12, 0.16);
      color: #C2410C;
      border: 1px solid rgba(234, 88, 12, 0.35);
    }
    .rank-default {
      background: rgba(139, 92, 246, 0.14);
      color: var(--primary, #7E22CE);
      border: 1px solid rgba(139, 92, 246, 0.28);
    }

    :host-context(.dark-theme) .rank-gold, .dark-theme .rank-gold { color: #FCD34D; }
    :host-context(.dark-theme) .rank-silver, .dark-theme .rank-silver { color: #CBD5E1; }
    :host-context(.dark-theme) .rank-bronze, .dark-theme .rank-bronze { color: #FDBA74; }
    :host-context(.dark-theme) .rank-default, .dark-theme .rank-default { color: #C4B5FD; }

    .delicacy-details {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .delicacy-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
    }

    .delicacy-meta {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .meta-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--primary, #7E22CE);
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      padding: 0.05rem 0.35rem;
      border-radius: 0.3rem;
    }

    .meta-sku {
      font-size: 0.65rem;
      color: var(--text-dim, #94A3B8);
    }

    .delicacy-right {
      text-align: right;
    }

    .delicacy-sold-badge {
      font-size: 0.75rem;
      font-weight: 900;
      color: #10B981;
    }

    .delicacy-revenue {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted, #64748B);
    }

    /* Payment Channels Matrix */
    .payment-channels-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.65rem;
    }

    .payment-pill-box {
      padding: 0.75rem;
      border-radius: 0.85rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .pm-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .pm-name {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted, #475569);
      text-transform: uppercase;
    }

    .pm-txns {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-dim, #94A3B8);
    }

    .pm-amount {
      font-size: 1.05rem;
      font-weight: 900;
      color: var(--text-main, #1E293B);
    }

    /* Live Recent Orders Feed */
    .recent-orders-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .order-feed-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.75rem;
      border-radius: 0.75rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #F3E8FF);
      transition: background 0.15s ease;
    }
    .order-feed-item:hover {
      background: var(--card-hover, #F3E8FF);
    }

    .order-feed-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .order-number-tag {
      font-size: 0.75rem;
      color: var(--primary, #2E1065);
    }

    .order-type-chip {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 0.05rem 0.35rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
    }
    .chip-dining {
      background: rgba(245, 158, 11, 0.14);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.28);
    }
    .chip-takeaway {
      background: rgba(59, 130, 246, 0.14);
      color: #2563EB;
      border: 1px solid rgba(59, 130, 246, 0.28);
    }
    .chip-walkin {
      background: rgba(99, 102, 241, 0.14);
      color: #4F46E5;
      border: 1px solid rgba(99, 102, 241, 0.28);
    }

    :host-context(.dark-theme) .chip-dining, .dark-theme .chip-dining { color: #FCD34D; }
    :host-context(.dark-theme) .chip-takeaway, .dark-theme .chip-takeaway { color: #93C5FD; }
    :host-context(.dark-theme) .chip-walkin, .dark-theme .chip-walkin { color: #A5B4FC; }

    .order-customer-line {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      color: var(--text-muted, #64748B);
    }

    .table-tag {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E2E8F0);
      font-weight: 700;
      color: var(--primary, #7E22CE);
      padding: 0 0.3rem;
      border-radius: 0.25rem;
      font-size: 0.65rem;
    }

    .status-pill {
      display: inline-block;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      border-radius: 0.3rem;
      letter-spacing: 0.02em;
    }
    .status-completed {
      background: rgba(16, 185, 129, 0.14);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.28);
    }
    .status-progress {
      background: rgba(245, 158, 11, 0.14);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.28);
    }
    .status-pending {
      background: rgba(14, 165, 233, 0.14);
      color: #0284C7;
      border: 1px solid rgba(14, 165, 233, 0.28);
    }
    .status-cancelled {
      background: rgba(239, 68, 68, 0.14);
      color: #DC2626;
      border: 1px solid rgba(239, 68, 68, 0.28);
    }

    :host-context(.dark-theme) .status-completed, .dark-theme .status-completed { color: #6EE7B7; }
    :host-context(.dark-theme) .status-progress, .dark-theme .status-progress { color: #FCD34D; }
    :host-context(.dark-theme) .status-pending, .dark-theme .status-pending { color: #7DD3FC; }
    :host-context(.dark-theme) .status-cancelled, .dark-theme .status-cancelled { color: #FCA5A5; }

    .order-amount {
      font-size: 0.8rem;
      color: var(--text-main, #1E293B);
      margin-top: 0.1rem;
    }

    /* Quick Ops Shortcuts */
    .quick-ops-card {
      background: var(--card-bg, #FFFFFF);
      border-color: var(--card-border, #E9D5FF);
    }

    .quick-ops-title {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 0;
    }

    .quick-ops-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .ops-shortcut-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.75rem;
      border-radius: 0.65rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .ops-shortcut-btn .material-symbols-outlined { font-size: 1.1rem; }

    .btn-ops-purple {
      background: var(--primary, #7E22CE);
      color: #FFFFFF;
      box-shadow: 0 2px 8px var(--primary-glow, rgba(126, 34, 206, 0.2));
    }
    .btn-ops-purple:hover {
      background: var(--primary-hover, #6B21A8);
      transform: translateY(-1px);
    }

    .btn-ops-amber {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .btn-ops-amber:hover {
      background: rgba(245, 158, 11, 0.22);
      transform: translateY(-1px);
    }

    .btn-ops-emerald {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .btn-ops-emerald:hover {
      background: rgba(16, 185, 129, 0.22);
      transform: translateY(-1px);
    }

    .btn-ops-blue {
      background: rgba(59, 130, 246, 0.12);
      color: #2563EB;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }
    .btn-ops-blue:hover {
      background: rgba(59, 130, 246, 0.22);
      transform: translateY(-1px);
    }

    :host-context(.dark-theme) .btn-ops-amber, .dark-theme .btn-ops-amber { color: #FCD34D; background: rgba(245, 158, 11, 0.2); }
    :host-context(.dark-theme) .btn-ops-emerald, .dark-theme .btn-ops-emerald { color: #6EE7B7; background: rgba(16, 185, 129, 0.2); }
    :host-context(.dark-theme) .btn-ops-blue, .dark-theme .btn-ops-blue { color: #93C5FD; background: rgba(59, 130, 246, 0.2); }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public metrics: any = null;
  public isLoading = false;
  public loadError: string | null = null;

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading = true;
    this.loadError = null;
    this.dashboardService.getMetrics().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.metrics = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load dashboard metrics from the server.';
      },
    });
  }

  calcPercentage(amount: number): number {
    const total = this.metrics?.kpis?.allTimeSales || this.metrics?.kpis?.todaySales || 0;
    if (total <= 0) return 0;
    return Math.min(100, (amount / total) * 100);
  }

  getRankBadgeClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-default';
  }

  getPaymentIcon(method: string): string {
    const m = (method || '').toUpperCase();
    if (m.includes('UPI')) return 'qr_code_scanner';
    if (m.includes('CARD')) return 'credit_card';
    if (m.includes('CASH')) return 'payments';
    return 'account_balance_wallet';
  }

  getOrderTypeClass(type: string): string {
    return normalizeOrderType(type) === 'DINING' ? 'chip-dining' : 'chip-takeaway';
  }

  formatOrderType(type: string): string {
    return orderTypeLabel(type);
  }
}

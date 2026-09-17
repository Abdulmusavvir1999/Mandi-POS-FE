import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppCurrencyPipe],
  template: `
    <div class="dashboard-wrapper">
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
            <span class="kpi-trend-pill trend-up">
              <span class="material-symbols-outlined">trending_up</span>
              <span>Active Shift</span>
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="material-symbols-outlined text-purple-600 text-sm">receipt_long</span>
              <span class="font-bold text-slate-800">{{ kpi.todayBillsCount }}</span>
              <span class="text-slate-500">Bills Settled</span>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-metric">
              <span class="text-slate-500">Avg Ticket:</span>
              <span class="font-bold font-mono text-purple-700">{{ kpi.avgOrderValue | appCurrency:'1.0-0' }}</span>
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
            <span class="kpi-main-number font-mono text-emerald-950">
              {{ kpi.todayOrdersCount }}
            </span>
            <span class="kpi-sub-total font-mono text-xs text-slate-500 font-semibold">
              ({{ kpi.allTimeOrdersCount }} Lifetime)
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="status-badge-dot bg-emerald-500"></span>
              <span class="font-bold text-emerald-700">{{ kpi.completedOrders }}</span>
              <span class="text-slate-500">Completed</span>
            </div>
            <div class="footer-divider"></div>
            <div class="footer-metric">
              <span class="status-badge-dot bg-amber-500"></span>
              <span class="font-bold text-amber-700">{{ kpi.inProgressOrders + kpi.pendingOrders }}</span>
              <span class="text-slate-500">In Kitchen</span>
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
              <span class="kpi-main-number text-amber-950">{{ kpi.occupiedTables }}</span>
              <span class="text-lg font-bold text-slate-400">/ {{ kpi.totalTables }}</span>
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
              [ngClass]="kpi.occupancyRate > 75 ? 'bg-amber-600' : 'bg-amber-500'"
            ></div>
          </div>

          <div class="kpi-footer-strip mt-2">
            <div class="footer-metric">
              <span class="material-symbols-outlined text-emerald-600 text-sm">event_seat</span>
              <span class="font-bold text-emerald-700">{{ kpi.availableTables }}</span>
              <span class="text-slate-500">Tables Ready</span>
            </div>
            <div class="footer-divider"></div>
            <a routerLink="/tables" class="text-xs text-amber-700 hover:underline font-bold flex items-center gap-0.5">
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
            <span class="kpi-main-number font-mono" [ngClass]="kpi.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'">
              {{ kpi.lowStockCount }}
            </span>
            <span class="kpi-tag-pill" [ngClass]="kpi.lowStockCount > 0 ? 'tag-danger' : 'tag-success'">
              {{ kpi.lowStockCount > 0 ? 'Action Needed' : 'Healthy Stock' }}
            </span>
          </div>

          <div class="kpi-footer-strip">
            <div class="footer-metric">
              <span class="font-bold text-slate-800">{{ kpi.totalProducts }}</span>
              <span class="text-slate-500">Active Delicacies</span>
            </div>
            <div class="footer-divider"></div>
            <a routerLink="/stock" class="text-xs text-rose-700 hover:underline font-bold flex items-center gap-0.5">
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
          <div class="quick-icon-box bg-blue-50 text-blue-600 border-blue-100">
            <span class="material-symbols-outlined">receipt</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Avg Order Value (AOV)</span>
            <div class="quick-value font-mono">{{ kpi.avgOrderValue | appCurrency:'1.0-0' }}</div>
          </div>
          <div class="quick-chip bg-blue-50 text-blue-700">Per Bill</div>
        </div>

        <!-- Stat Pill 2: Kitchen & Queue Throughput -->
        <div class="quick-metric-card">
          <div class="quick-icon-box bg-purple-50 text-purple-600 border-purple-100">
            <span class="material-symbols-outlined">soup_kitchen</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Active Kitchen KOTs</span>
            <div class="quick-value font-mono text-purple-700">{{ kpi.inProgressOrders + kpi.pendingOrders }} Orders</div>
          </div>
          <a routerLink="/queue" class="quick-chip bg-purple-100 text-purple-800 hover:bg-purple-200">
            Live Queue →
          </a>
        </div>

        <!-- Stat Pill 3: Tax & Discounts Collected -->
        <div class="quick-metric-card">
          <div class="quick-icon-box bg-teal-50 text-teal-600 border-teal-100">
            <span class="material-symbols-outlined">percent</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Tax & Discount Audit</span>
            <div class="quick-value font-mono text-teal-800">{{ kpi.todayTax | appCurrency:'1.0-0' }} <span class="text-xs font-normal text-slate-500">GST</span></div>
          </div>
          <div class="quick-chip bg-teal-50 text-teal-700 font-mono">-{{ kpi.todayDiscount | appCurrency:'1.0-0' }} Disc</div>
        </div>

        <!-- Stat Pill 4: Customer CRM Base -->
        <div class="quick-metric-card">
          <div class="quick-icon-box bg-indigo-50 text-indigo-600 border-indigo-100">
            <span class="material-symbols-outlined">group</span>
          </div>
          <div class="quick-info">
            <span class="quick-label">Patron Directory</span>
            <div class="quick-value font-mono text-indigo-900">{{ kpi.totalCustomers }} Customers</div>
          </div>
          <a routerLink="/customers" class="quick-chip bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
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
                <div class="panel-icon-wrap bg-purple-50 text-purple-700">
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
              <span class="material-symbols-outlined text-3xl text-slate-300">receipt_long</span>
              <p class="text-xs text-slate-400 mt-1">No sales recorded yet today.</p>
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
                <div class="panel-icon-wrap bg-amber-50 text-amber-600">
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
              <span class="material-symbols-outlined text-3xl text-slate-300">restaurant_menu</span>
              <p class="text-xs text-slate-400 mt-1">No delicacy sales recorded yet.</p>
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
                <div class="panel-icon-wrap bg-emerald-50 text-emerald-600">
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
                    <span class="material-symbols-outlined text-sm text-emerald-600">
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
                <div class="panel-icon-wrap bg-purple-50 text-purple-700">
                  <span class="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <h3 class="panel-title">Live Orders Feed</h3>
                  <p class="panel-subtitle">Latest tickets across dine-in & takeaway</p>
                </div>
              </div>
              <a routerLink="/orders" class="text-xs text-purple-700 hover:underline font-bold flex items-center gap-0.5">
                <span>View All</span>
                <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>

            <div *ngIf="metrics?.recentOrders?.length === 0" class="empty-state-box">
              <span class="material-symbols-outlined text-3xl text-slate-300">receipt</span>
              <p class="text-xs text-slate-400 mt-1">No recent orders found.</p>
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
      box-shadow: 0 4px 20px -4px var(--primary-light, rgba(126, 34, 206, 0.08));
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
      box-shadow: 0 4px 12px var(--primary-glow, rgba(126, 34, 206, 0.25));
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
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
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
      color: var(--text-muted, rgba(46, 16, 101, 0.65));
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
      background: var(--card-bg, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
    }
    .btn-secondary-white:hover:not(:disabled) {
      background: var(--bg-app, #F3E8FF);
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

    /* 1. PRIMARY HERO KPI GRID */
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
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.04);
    }
    .kpi-hero-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -4px rgba(0, 0, 0, 0.08);
    }

    .card-purple {
      border-top: 4px solid var(--primary, #7E22CE);
      background: linear-gradient(180deg, var(--bg-app, #FAF5FF) 0%, var(--card-bg, #FFFFFF) 30%);
    }
    .card-emerald {
      border-top: 4px solid #10B981;
      background: linear-gradient(180deg, #ECFDF5 0%, var(--card-bg, #FFFFFF) 30%);
    }
    .card-amber {
      border-top: 4px solid #F59E0B;
      background: linear-gradient(180deg, #FFFBEB 0%, var(--card-bg, #FFFFFF) 30%);
    }
    .card-rose {
      border-top: 4px solid #F43F5E;
      background: linear-gradient(180deg, #FFF1F2 0%, var(--card-bg, #FFFFFF) 30%);
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
      gap: 0.25rem;
    }

    .kpi-tag-pill {
      display: inline-block;
      width: fit-content;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.15rem 0.45rem;
      border-radius: 0.35rem;
    }
    .tag-purple { background: var(--primary-light, #F3E8FF); color: var(--primary, #7E22CE); }
    .tag-emerald { background: #D1FAE5; color: #047857; }
    .tag-amber { background: #FEF3C7; color: #B45309; }
    .tag-rose { background: #FFE4E6; color: #BE123C; }
    .tag-success { background: #DCFCE7; color: #15803D; }
    .tag-danger { background: #FEE2E2; color: #B91C1C; }

    .kpi-hero-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
      margin: 0;
    }

    .kpi-icon-bubble {
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bubble-purple { background: var(--primary-light, #F3E8FF); color: var(--primary, #7E22CE); border: 1px solid var(--card-border, #E9D5FF); }
    .bubble-emerald { background: #D1FAE5; color: #059669; border: 1px solid #A7F3D0; }
    .bubble-amber { background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A; }
    .bubble-rose { background: #FFE4E6; color: #E11D48; border: 1px solid #FECDD3; }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .kpi-main-number {
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--text-main, #0F172A);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .kpi-trend-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: var(--primary-light, #F3E8FF);
      color: var(--primary, #7E22CE);
      border: 1px solid var(--card-border, #E9D5FF);
    }
    .kpi-trend-pill .material-symbols-outlined { font-size: 0.85rem; }

    .kpi-badge-rate {
      font-size: 0.75rem;
      padding: 0.2rem 0.55rem;
      border-radius: 0.5rem;
    }
    .rate-normal { background: #FEF3C7; color: #B45309; }
    .rate-high { background: #FEE2E2; color: #DC2626; font-weight: 900; }

    .occupancy-progress-bar {
      width: 100%;
      height: 0.4rem;
      background: #F1F5F9;
      border-radius: 9999px;
      overflow: hidden;
    }
    .occupancy-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .kpi-footer-strip {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--card-border, #F1F5F9);
      font-size: 0.75rem;
    }

    .footer-metric {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .footer-divider {
      width: 1px;
      height: 0.85rem;
      background: var(--card-border, #CBD5E1);
    }

    .status-badge-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 9999px;
    }

    /* 2. SECONDARY INTELLIGENCE GRID */
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
      transition: transform 0.15s ease;
    }
    .quick-metric-card:hover {
      transform: translateY(-1px);
    }

    .quick-icon-box {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.65rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid;
    }
    .quick-icon-box .material-symbols-outlined { font-size: 1.25rem; }

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
      letter-spacing: 0.02em;
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
      padding: 0.2rem 0.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      white-space: nowrap;
    }

    /* 3. ANALYTICS SPLIT LAYOUT */
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
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.65rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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
      background: var(--bg-app, #FAF5FF);
      color: var(--primary, #7E22CE);
      border: 1px solid var(--card-border, #E9D5FF);
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }

    .badge-pill-amber {
      background: #FFFBEB;
      color: #B45309;
      border: 1px solid #FDE68A;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
    }

    .empty-state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
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
      background: var(--bg-app, #FAF5FF);
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
      background: var(--primary-light, #F5E8FF);
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
    .rank-gold { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
    .rank-silver { background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }
    .rank-bronze { background: #FFEDD5; color: #9A3412; border: 1px solid #FED7AA; }
    .rank-default { background: var(--primary-light, #F3E8FF); color: var(--primary, #7E22CE); }

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
      color: #059669;
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
      background: var(--primary-light, #F3E8FF);
    }

    .order-feed-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .order-number-tag {
      font-size: 0.75rem;
      color: var(--text-main, #2E1065);
    }

    .order-type-chip {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 0.05rem 0.35rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
    }
    .chip-dining { background: #FEF3C7; color: #B45309; }
    .chip-takeaway { background: #DBEAFE; color: #1E40AF; }
    .chip-walkin { background: #E0E7FF; color: #3730A3; }

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
    .status-completed { background: #DCFCE7; color: #15803D; }
    .status-progress { background: #FEF3C7; color: #B45309; }
    .status-pending { background: #E0F2FE; color: #0369A1; }
    .status-cancelled { background: #FEE2E2; color: #B91C1C; }

    .order-amount {
      font-size: 0.8rem;
      color: var(--text-main, #1E293B);
      margin-top: 0.1rem;
    }

    /* Quick Ops Shortcuts */
    .quick-ops-card {
      background: linear-gradient(135deg, var(--bg-app, #FAF5FF), var(--primary-light, #F3E8FF));
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

    .btn-ops-purple { background: var(--primary, #7E22CE); color: #FFFFFF; }
    .btn-ops-purple:hover { background: var(--primary-variant, #6B21A8); }

    .btn-ops-amber { background: var(--card-bg, #FFFFFF); color: #B45309; border: 1px solid #FDE68A; }
    .btn-ops-amber:hover { background: #FFFBEB; }

    .btn-ops-emerald { background: var(--card-bg, #FFFFFF); color: #047857; border: 1px solid #A7F3D0; }
    .btn-ops-emerald:hover { background: #ECFDF5; }

    .btn-ops-blue { background: var(--card-bg, #FFFFFF); color: #1D4ED8; border: 1px solid #BFDBFE; }
    .btn-ops-blue:hover { background: #EFF6FF; }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public metrics: any = null;
  public isLoading = false;

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.isLoading = true;
    this.dashboardService.getMetrics().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.metrics = res.data;
        }
      },
      error: () => {
        this.isLoading = false;
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
    const t = (type || '').toUpperCase();
    if (t === 'DINING') return 'chip-dining';
    if (t === 'TAKEAWAY') return 'chip-takeaway';
    return 'chip-walkin';
  }

  formatOrderType(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'DINING') return 'Dine-In';
    if (t === 'TAKEAWAY') return 'Takeaway';
    return 'Walk-In';
  }
}

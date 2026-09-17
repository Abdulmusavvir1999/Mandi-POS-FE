import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CustomerService } from '../../core/services/customer.service';
import { DiningService } from '../../core/services/dining.service';
import { DraftBillService } from '../../core/services/draft-bill.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { BillService } from '../../core/services/bill.service';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product, Category, Customer, DiningTable, DraftBill, Order, OrderType, PaymentMethod } from '../../core/models';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal/receipt-modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ReceiptModalComponent, AppCurrencyPipe],
  template: `
    <div class="pos-fullscreen-container">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- LEFT / MAIN PANEL: SEARCH, CATEGORIES, POPULAR DISHES & REPORTS -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pos-main-content">
        <!-- 1. TOP PILL SEARCH & QUICK ACTION BAR -->
        <div class="pos-top-search-row">
          <div class="pos-search-pill">
            <input
              id="pos-search-input"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterProducts()"
              placeholder="Search restaurant, Food, Cuisine or a Dish (Press F2)"
              class="search-input-field"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; filterProducts()"
              class="clear-search-btn"
            >
              <span class="material-symbols-outlined text-base">close</span>
            </button>
            <span class="material-symbols-outlined search-icon-tag">search</span>
          </div>

          <!-- Top Toolbar Shortcuts -->
          <div class="pos-quick-tools">
            <button
              (click)="openDraftsModal()"
              class="tool-btn btn-drafts"
              title="Held / Draft Bills (F4)"
            >
              <span class="material-symbols-outlined text-[18px]">drafts</span>
              <span>Drafts</span>
              <span *ngIf="draftCount > 0" class="draft-badge">{{ draftCount }}</span>
            </button>

            <button
              (click)="toggleBrowserFullscreen()"
              class="tool-btn btn-fullscreen"
              title="Toggle Browser Fullscreen"
            >
              <span class="material-symbols-outlined text-[18px]">
                {{ isBrowserFullscreen ? 'fullscreen_exit' : 'fullscreen' }}
              </span>
            </button>

            <a
              routerLink="/dashboard"
              class="tool-btn btn-exit-dashboard"
              title="Back to Admin Dashboard"
            >
              <span class="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </a>
          </div>
        </div>

        <!-- 2. CATEGORIES HORIZONTAL CAROUSEL / CIRCLES -->
        <div class="pos-section-block">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Categories</h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">{{ categories.length }}+</span> Categories available for instant billing
              </p>
            </div>
            <button
              (click)="selectCategory(null)"
              class="section-link-btn"
              [class.is-active-link]="selectedCategoryId === null"
            >
              <span>View all</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <div class="categories-circles-track no-scrollbar">
            <!-- All Categories Circle -->
            <button
              type="button"
              (click)="selectCategory(null)"
              class="cat-circle-card"
              [class.is-selected]="selectedCategoryId === null"
            >
              <div class="cat-avatar-bubble">
                <span class="cat-avatar-icon">🍽️</span>
              </div>
              <span class="cat-circle-label">All</span>
            </button>

            <!-- Dynamic Category Circles -->
            <button
              type="button"
              *ngFor="let cat of categories"
              (click)="selectCategory(cat.id)"
              class="cat-circle-card"
              [class.is-selected]="selectedCategoryId === cat.id"
            >
              <div class="cat-avatar-bubble">
                <span class="cat-avatar-icon">{{ getCategoryAvatar(cat.name) }}</span>
              </div>
              <span class="cat-circle-label">{{ cat.name }}</span>
            </button>
          </div>
        </div>

        <!-- 3. POPULAR DISHES (TEAL HERO CARDS AS IN SCREENSHOT) -->
        <div class="pos-section-block">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Popular Dishes</h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">{{ filteredProducts.length }}+</span> Delicious dishes ready to serve
              </p>
            </div>
            <span class="section-link-btn" (click)="searchQuery = ''; selectCategory(null)">
              <span>View More</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </span>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredProducts.length === 0" class="empty-dishes-box">
            <span class="material-symbols-outlined text-5xl text-slate-300">restaurant</span>
            <p class="text-sm font-semibold text-slate-500 mt-2">No active dishes found matching your selection.</p>
          </div>

          <!-- Grid of Popular Dish Cards -->
          <div class="dishes-cards-grid" *ngIf="filteredProducts.length > 0">
            <div
              *ngFor="let p of filteredProducts; let i = index"
              (click)="addToCart(p)"
              class="dish-hero-card"
              [class.is-out-of-stock]="p.current_stock <= 0"
            >
              <!-- Food Image / Icon Burst on Top -->
              <div class="dish-floating-avatar">
                <span class="food-emoji">{{ getProductEmoji(p.name, p.category_id) }}</span>
              </div>

              <!-- Dish Info -->
              <div class="dish-body">
                <h3 class="dish-title">{{ p.name }}</h3>
                <span class="dish-sub-label">Starting From</span>
                <div class="dish-price-tag font-mono">
                  {{ p.selling_price | appCurrency:'1.0-0' }}
                </div>

                <!-- Star Rating & Total Sales Footer -->
                <div class="dish-card-footer">
                  <div class="star-rating">
                    <span class="star-icon">★</span>
                    <span class="rating-value">{{ (4.2 + (i % 8) * 0.1) | number:'1.1-1' }}</span>
                  </div>
                  <div class="sales-count-badge">
                    {{ (120 + (i * 45) + 30) }} Total Sale
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. ORDER REPORTS / LIVE ACTIVITY TABLE (MATCHING SCREENSHOT) -->
        <div class="pos-section-block mb-4">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Order Reports</h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">Wow 100+ new</span> Orders processed this shift
              </p>
            </div>
            <a routerLink="/orders" class="section-link-btn">
              <span>View all</span>
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </a>
          </div>

          <div class="order-reports-table-container">
            <table class="order-reports-table">
              <thead>
                <tr>
                  <th class="th-left">Customer</th>
                  <th>Order number</th>
                  <th>Address / Table</th>
                  <th>Amount</th>
                  <th class="th-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="recentOrders.length === 0">
                  <td colspan="5" class="text-center py-4 text-xs text-slate-400 font-medium">
                    No recent orders found.
                  </td>
                </tr>
                <tr *ngFor="let ord of recentOrders">
                  <td class="td-customer">
                    <div class="customer-cell">
                      <div class="avatar-circle">
                        <span class="avatar-initial">{{ (ord.customer_name || 'G')[0] | uppercase }}</span>
                      </div>
                      <span class="customer-name-text">{{ ord.customer_name || 'Walk-in Guest' }}</span>
                    </div>
                  </td>
                  <td class="td-ordernumber font-mono">
                    {{ ord.order_number }}
                  </td>
                  <td class="td-address">
                    <span *ngIf="ord.table_number" class="table-pill font-mono">Table {{ ord.table_number }}</span>
                    <span *ngIf="!ord.table_number" class="type-pill">{{ ord.order_type }}</span>
                  </td>
                  <td class="td-amount font-mono font-bold">
                    {{ ord.total_amount | appCurrency:'1.0-0' }}
                  </td>
                  <td class="td-status th-right">
                    <span
                      class="order-status-pill"
                      [ngClass]="{
                        'pill-completed': ord.status === 'COMPLETED',
                        'pill-pending': ord.status === 'PENDING' || ord.status === 'IN_PROGRESS',
                        'pill-cancelled': ord.status === 'CANCELLED'
                      }"
                    >
                      {{ ord.status === 'IN_PROGRESS' ? 'Pending' : (ord.status | titlecase) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- RIGHT PANEL: TEAL CHECKOUT & CART TERMINAL (MATCHING SCREENSHOT) -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pos-cart-sidebar">
        <!-- TOP: DELIVERY / DINING ADDRESS CARD -->
        <div class="address-header-card">
          <div class="flex items-center justify-between">
            <span class="address-card-title">
              {{ cartService.orderType() === 'DINING' ? 'DINING TABLE / SECTION' : 'DELIVERY ADDRESS' }}
            </span>
            <span class="time-badge">
              <span class="material-symbols-outlined text-[13px]">schedule</span>
              <span>20 min</span>
            </span>
          </div>

          <div class="address-location-row" (click)="cartService.orderType() === 'DINING' ? openTableSelector() : openCustomerModal()">
            <span class="material-symbols-outlined location-pin">location_on</span>
            <div class="address-text-wrap">
              <div class="address-line font-medium" *ngIf="cartService.orderType() === 'DINING'">
                {{ cartService.selectedTable() ? 'Table ' + cartService.selectedTable()?.table_number + ' (' + cartService.selectedTable()?.section + ')' : 'Click to select Dining Table' }}
              </div>
              <div class="address-line font-medium" *ngIf="cartService.orderType() !== 'DINING'">
                {{ cartService.selectedCustomer() ? cartService.selectedCustomer()?.address || cartService.selectedCustomer()?.name : 'Po.1478, Street No. 52 West New York' }}
              </div>
            </div>
            <span class="material-symbols-outlined text-white/70 text-sm ml-auto">edit</span>
          </div>
        </div>

        <!-- CART TITLE & ACTIVE ORDER ID -->
        <div class="cart-title-strip">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-2xl text-white">shopping_cart</span>
            <h2 class="cart-heading">Cart</h2>
          </div>
          <span class="order-id-tag font-mono">Order ID: #{{ activeOrderId }}</span>
        </div>

        <!-- ORDER TYPE SEGMENTED SWITCHER (Delivery / Dine in / Takeaway) -->
        <div class="order-type-segmented-bar">
          <button
            type="button"
            (click)="setOrderType('WALK_IN')"
            class="seg-pill-btn"
            [class.is-active-seg]="cartService.orderType() === 'WALK_IN'"
          >
            Delivery
          </button>
          <button
            type="button"
            (click)="openTableSelector()"
            class="seg-pill-btn"
            [class.is-active-seg]="cartService.orderType() === 'DINING'"
          >
            Dine in
          </button>
          <button
            type="button"
            (click)="setOrderType('TAKEAWAY')"
            class="seg-pill-btn"
            [class.is-active-seg]="cartService.orderType() === 'TAKEAWAY'"
          >
            Takeaway
          </button>
        </div>

        <!-- CART ITEMS LIST -->
        <div class="cart-items-scroll-pane no-scrollbar">
          <div *ngIf="cartService.items().length === 0" class="cart-empty-wrap">
            <span class="material-symbols-outlined text-4xl text-white/40">shopping_bag</span>
            <p class="text-xs text-white/70 mt-2 font-medium">Your cart is empty.</p>
            <p class="text-[11px] text-white/50">Click any dish on the left to add.</p>
          </div>

          <!-- Cart Item Row -->
          <div
            *ngFor="let item of cartService.items()"
            class="cart-item-row"
          >
            <div class="cart-item-avatar">
              <span class="item-emoji">{{ getProductEmoji(item.product.name, item.product.category_id) }}</span>
            </div>

            <div class="cart-item-details">
              <h4 class="item-name">{{ item.product.name }}</h4>
              <p class="item-sub-desc">
                {{ item.notes || (item.product.category_id === 1 ? 'Thin Crust' : 'Special Portion') }}
              </p>

              <!-- Stepper Control -->
              <div class="item-stepper-row">
                <button
                  type="button"
                  (click)="cartService.decrement(item.product.id)"
                  class="stepper-circle-btn"
                >
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <span class="stepper-qty-text font-mono font-bold">{{ item.quantity }}</span>
                <button
                  type="button"
                  (click)="cartService.increment(item.product.id)"
                  class="stepper-circle-btn"
                >
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              (click)="cartService.removeItem(item.product.id)"
              class="cart-item-remove-btn"
              title="Remove item"
            >
              <span class="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          </div>
        </div>

        <!-- PROMOTION CODE / COUPON INPUT -->
        <div class="promo-code-box">
          <input
            type="text"
            [(ngModel)]="promoCode"
            placeholder="Promotion Code"
            class="promo-input"
          />
          <button
            type="button"
            (click)="applyPromoCode()"
            class="promo-apply-btn"
          >
            {{ isPromoApplied ? 'APPLIED' : 'TRYNEW' }}
          </button>
        </div>

        <!-- TOTALS BREAKDOWN -->
        <div class="cart-totals-section font-mono">
          <div class="totals-row">
            <span class="totals-label">Sub Total</span>
            <span class="totals-value">{{ cartService.subtotal() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row" *ngIf="cartService.discountAmount() > 0">
            <span class="totals-label text-amber-200">Discount</span>
            <span class="totals-value text-amber-200">- {{ cartService.discountAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row">
            <span class="totals-label">Delivery Charge / Tax</span>
            <span class="totals-value">{{ cartService.taxAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row grand-total-row">
            <span class="grand-label">TOTAL</span>
            <span class="grand-value">{{ cartService.grandTotal() | appCurrency:'1.2-2' }}</span>
          </div>
        </div>

        <!-- CONFIRM ORDER ACTION BUTTON -->
        <div class="cart-actions-bottom">
          <button
            type="button"
            (click)="openPaymentModal()"
            [disabled]="cartService.items().length === 0"
            class="confirm-order-btn"
          >
            <span>Confirm Order</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 1. SETTLEMENT & PAYMENT MODAL                                   -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showPaymentModal">
      <div class="modal-content p-6 max-w-lg bg-white border border-teal-100 shadow-2xl text-slate-800 rounded-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#008080]">point_of_sale</span>
            <span>Settlement & Checkout</span>
          </h3>
          <button (click)="showPaymentModal = false" class="text-slate-400 hover:text-slate-700">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="space-y-4 py-4">
          <!-- Total Display -->
          <div class="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-teal-900">Total Payable</span>
            <span class="text-3xl font-black font-mono text-[#008080]">
              {{ cartService.grandTotal() | appCurrency:'1.2-2' }}
            </span>
          </div>

          <!-- Payment Methods Selector -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Payment Mode</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                type="button"
                *ngFor="let method of ['CASH', 'UPI', 'CARD', 'OTHER']"
                (click)="selectedPaymentMethod = method"
                class="py-2.5 px-3 rounded-xl font-bold transition-all text-xs border"
                [ngClass]="selectedPaymentMethod === method ? 'bg-[#008080] text-white border-transparent shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Cash Tendered & Quick Notes -->
          <div *ngIf="selectedPaymentMethod === 'CASH'" class="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Amount Tendered</label>
              <input
                type="number"
                [(ngModel)]="tenderedAmount"
                (ngModelChange)="calcChange()"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 text-lg font-mono font-bold text-emerald-700 bg-white"
              />
            </div>

            <!-- Quick Cash Denominations -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                *ngFor="let amt of [cartService.grandTotal(), 500, 1000, 2000]"
                (click)="setTendered(amt)"
                class="flex-1 py-1 text-xs font-mono font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                {{ amt | appCurrency:'1.0-0' }}
              </button>
            </div>

            <!-- Change Return -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-200">
              <span class="text-xs font-bold text-slate-600">Change Due:</span>
              <span class="text-base font-black font-mono text-emerald-700">
                {{ changeDue | appCurrency:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Reference Number (for UPI / Card) -->
          <div *ngIf="selectedPaymentMethod !== 'CASH'">
            <label class="block text-xs font-bold text-slate-700 mb-1">Transaction Reference # (Optional)</label>
            <input
              type="text"
              [(ngModel)]="paymentReference"
              placeholder="e.g. UPI Ref / Auth Code"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button (click)="showPaymentModal = false" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
            Cancel
          </button>
          <button
            (click)="executeCheckout()"
            [disabled]="isCheckingOut"
            class="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-variant)] text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">receipt_long</span>
            <span *ngIf="isCheckingOut">Processing Payment...</span>
            <span *ngIf="!isCheckingOut">Complete & Print Bill</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 2. DINING TABLE SELECTOR MODAL                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showTableModal">
      <div class="modal-content p-6 max-w-2xl bg-white border border-slate-100 shadow-2xl text-slate-800 rounded-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
              <span class="material-symbols-outlined text-[var(--primary)]">table_restaurant</span>
              <span>Select Dining Table</span>
            </h3>
            <p class="text-xs text-slate-500 font-medium">Assign POS order to a dining table</p>
          </div>
          <button (click)="showTableModal = false" class="text-slate-400 hover:text-slate-700">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="py-4 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
          <div
            *ngFor="let table of diningTables"
            (click)="selectTable(table)"
            class="p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between"
            [ngClass]="{
              'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70': table.status === 'AVAILABLE',
              'bg-orange-50 border-orange-200 opacity-75': table.status === 'OCCUPIED',
              'bg-slate-50 border-slate-200 opacity-50 pointer-events-none': table.status === 'UNAVAILABLE'
            }"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-extrabold text-slate-900">{{ table.table_number }}</span>
              <span
                class="text-[9px] py-0.5 px-1.5 rounded-full font-bold uppercase"
                [ngClass]="table.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              >
                {{ table.status }}
              </span>
            </div>
            <div class="text-[11px] text-slate-600 mt-2 font-medium">{{ table.section }}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Cap: {{ table.capacity }} Seats</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 3. CUSTOMER SELECTOR / ADD MODAL                                -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showCustomerModal">
      <div class="modal-content p-6 max-w-md bg-white border border-slate-100 shadow-2xl text-slate-800 rounded-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)]">person</span>
            <span>Customer & Delivery Details</span>
          </h3>
          <button (click)="showCustomerModal = false" class="text-slate-400 hover:text-slate-700">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="space-y-4 py-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <div class="flex gap-2">
              <input
                type="tel"
                [(ngModel)]="customerPhone"
                placeholder="10-digit mobile number"
                class="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm"
              />
              <button (click)="searchCustomerByPhone()" class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">search</span>
                <span>Lookup</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
            <input
              type="text"
              [(ngModel)]="customerName"
              placeholder="e.g. Jamsed Jhon"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Delivery Address (Optional)</label>
            <input
              type="text"
              [(ngModel)]="customerAddress"
              placeholder="Po.1478, Street No. 52 West New York"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button (click)="showCustomerModal = false" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50">
            Cancel
          </button>
          <button (click)="saveAndSelectCustomer()" class="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-variant)] text-white font-bold text-xs flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">check</span>
            <span>Apply to Cart</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 4. DRAFT BILLS MODAL                                            -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showDraftsModal">
      <div class="modal-content p-6 max-w-lg bg-white border border-slate-100 shadow-2xl text-slate-800 rounded-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <span class="material-symbols-outlined text-[var(--primary)]">drafts</span>
            <span>Held / Draft Bills</span>
          </h3>
          <button (click)="showDraftsModal = false" class="text-slate-400 hover:text-slate-700">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          <div *ngIf="draftBills.length === 0" class="text-xs text-slate-400 text-center py-8">
            No active draft bills on hold.
          </div>

          <div
            *ngFor="let draft of draftBills"
            class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-[var(--primary)] transition-colors"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-[var(--primary)] font-mono">{{ draft.draft_number }}</span>
                <span class="text-[9px] py-0.5 px-1.5 rounded-full bg-slate-200 text-slate-700 font-bold uppercase">{{ draft.order_type }}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1 font-medium">
                {{ draft.item_count }} items • {{ draft.created_at | date:'HH:mm' }}
                <span *ngIf="draft.customer_name"> • {{ draft.customer_name }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button (click)="resumeDraft(draft.id)" class="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">play_arrow</span>
                <span>Resume</span>
              </button>
              <button (click)="deleteDraft(draft.id)" class="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. THERMAL RECEIPT PRINT MODAL -->
    <app-receipt-modal
      [isOpen]="showReceiptModal"
      [printData]="lastReceiptData"
      (close)="showReceiptModal = false"
    ></app-receipt-modal>
  `,
  styles: [`
    .pos-fullscreen-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-app, #FAF5FF);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* LEFT MAIN CONTENT AREA */
    .pos-main-content {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      padding: 1.25rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: var(--bg-app, #FAF5FF);
    }

    /* 1. TOP PILL SEARCH ROW */
    .pos-top-search-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .pos-search-pill {
      flex: 1;
      max-width: 650px;
      position: relative;
      display: flex;
      align-items: center;
      background: var(--card-bg, #FFFFFF);
      border: 1.5px solid var(--card-border, #CBD5E1);
      border-radius: 9999px;
      padding: 0.35rem 1.25rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .pos-search-pill:focus-within {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 4px 14px var(--primary-glow, rgba(126, 34, 206, 0.25));
    }

    .search-input-field {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-main, #334155);
      padding-right: 2rem;
    }
    .search-input-field::placeholder {
      color: #94A3B8;
    }

    .search-icon-tag {
      position: absolute;
      right: 1rem;
      color: var(--text-muted, #64748B);
      font-size: 1.25rem;
      pointer-events: none;
    }

    .clear-search-btn {
      position: absolute;
      right: 2.75rem;
      color: #94A3B8;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .pos-quick-tools {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.95rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid var(--card-border, #E2E8F0);
      background: var(--card-bg, #F8FAFC);
      color: var(--text-muted, #475569);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .tool-btn:hover {
      background: var(--bg-app, #F1F5F9);
      border-color: var(--primary, #CBD5E1);
      color: var(--text-main, #0F172A);
    }

    .btn-drafts {
      position: relative;
      color: var(--primary, #7E22CE);
      background: var(--primary-light, #E6F3F3);
      border-color: var(--card-border, #B2D8D8);
    }
    .draft-badge {
      background: #E11D48;
      color: #FFFFFF;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
    }

    .btn-exit-dashboard {
      background: var(--sidebar-bg, #0F172A);
      color: var(--sidebar-text, #FFFFFF);
      border-color: transparent;
    }
    .btn-exit-dashboard:hover {
      background: var(--sidebar-active-accent, #1E293B);
      color: #FFFFFF;
    }

    /* 2. SECTION HEADINGS & TITLES */
    .pos-section-block {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-heading {
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--text-main, #1E293B);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .section-subtext {
      font-size: 0.78rem;
      color: var(--text-muted, #64748B);
      margin-top: 0.15rem;
    }

    .accent-orange {
      color: var(--accent, #EA580C);
    }

    .section-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--text-main, #1E293B);
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: none;
    }
    .section-link-btn:hover {
      color: var(--primary, #7E22CE);
    }

    /* CATEGORIES CIRCLES TRACK */
    .categories-circles-track {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      overflow-x: auto;
      padding: 0.5rem 0.25rem;
    }

    .cat-circle-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .cat-circle-card:hover {
      transform: translateY(-2px);
    }

    .cat-avatar-bubble {
      width: 4.25rem;
      height: 4.25rem;
      border-radius: 9999px;
      background: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--primary-glow, rgba(126, 34, 206, 0.35));
      border: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .cat-circle-card.is-selected .cat-avatar-bubble {
      border-color: var(--accent, #EA580C);
      box-shadow: 0 0 0 3px var(--accent-light, rgba(234, 88, 12, 0.35));
      transform: scale(1.05);
    }

    .cat-avatar-icon {
      font-size: 2rem;
    }

    .cat-circle-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-main, #334155);
      text-align: center;
      max-width: 5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cat-circle-card.is-selected .cat-circle-label {
      color: var(--primary, #7E22CE);
      font-weight: 900;
    }

    /* 3. POPULAR DISHES (HERO CARDS) */
    .dishes-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    @media (min-width: 900px) {
      .dishes-cards-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .dish-hero-card {
      background: linear-gradient(145deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      border-radius: 1rem;
      padding: 1rem;
      padding-top: 2.75rem;
      position: relative;
      color: #FFFFFF;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 6px 18px var(--primary-glow, rgba(126, 34, 206, 0.3));
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 180px;
    }
    .dish-hero-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px var(--primary-glow, rgba(126, 34, 206, 0.45));
    }
    .dish-hero-card.is-out-of-stock {
      opacity: 0.5;
      filter: grayscale(1);
      pointer-events: none;
    }

    .dish-floating-avatar {
      position: absolute;
      top: -1.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 4rem;
      height: 4rem;
      border-radius: 9999px;
      background: var(--card-bg, #FFFFFF);
      border: 3px solid var(--primary, #7E22CE);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .food-emoji {
      font-size: 2.2rem;
    }

    .dish-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.2rem;
    }

    .dish-title {
      font-size: 1rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.2;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dish-sub-label {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.75);
      font-weight: 500;
    }

    .dish-price-tag {
      font-size: 1.35rem;
      font-weight: 900;
      color: #FFFFFF;
      margin: 0.2rem 0;
    }

    .dish-card-footer {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.72rem;
    }

    .star-rating {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      color: #FDE047;
      font-weight: 800;
    }
    .star-icon {
      font-size: 0.85rem;
    }

    .sales-count-badge {
      color: rgba(255, 255, 255, 0.85);
      font-weight: 600;
    }

    /* 4. ORDER REPORTS TABLE */
    .order-reports-table-container {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    }

    .order-reports-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .order-reports-table thead tr {
      background: var(--primary, #7E22CE);
      color: #FFFFFF;
    }

    .order-reports-table th {
      padding: 0.75rem 1rem;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: none;
      letter-spacing: 0.02em;
      text-align: left;
    }
    .order-reports-table th.th-right {
      text-align: right;
    }

    .order-reports-table tbody tr {
      border-bottom: 1px solid var(--card-border, #F1F5F9);
      transition: background 0.15s ease;
    }
    .order-reports-table tbody tr:hover {
      background: var(--bg-app, #F8FAFC);
    }

    .order-reports-table td {
      padding: 0.75rem 1rem;
      color: var(--text-main, #334155);
    }
    .order-reports-table td.th-right {
      text-align: right;
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .avatar-circle {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      background: var(--primary-light, #E6F3F3);
      color: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.8rem;
    }

    .customer-name-text {
      font-weight: 700;
      color: var(--text-main, #1E293B);
    }

    .td-ordernumber {
      font-weight: 700;
      color: var(--text-muted, #475569);
    }

    .table-pill {
      background: var(--primary-light, #E6F3F3);
      color: var(--primary, #7E22CE);
      font-weight: 800;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 0.35rem;
    }

    .type-pill {
      font-size: 0.75rem;
      color: var(--text-muted, #64748B);
      font-weight: 600;
    }

    .order-status-pill {
      display: inline-block;
      padding: 0.25rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: capitalize;
    }
    .pill-completed {
      background: var(--success, #16A34A);
      color: #FFFFFF;
    }
    .pill-pending {
      background: var(--warning, #EA580C);
      color: #FFFFFF;
    }
    .pill-cancelled {
      background: var(--danger, #DC2626);
      color: #FFFFFF;
    }

    /* RIGHT SIDE CART TERMINAL */
    .pos-cart-sidebar {
      width: 420px;
      height: 100%;
      background: var(--sidebar-bg, #2E1065);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: var(--sidebar-text, #FFFFFF);
      box-shadow: -4px 0 25px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    /* ADDRESS CARD */
    .address-header-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.85rem;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .address-card-title {
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: #FFFFFF;
      text-transform: uppercase;
    }

    .time-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 700;
    }

    .address-location-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
    }
    .location-pin {
      font-size: 1.15rem;
      color: #FFFFFF;
    }
    .address-text-wrap {
      flex: 1;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* CART TITLE STRIP */
    .cart-title-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .cart-heading {
      font-size: 1.4rem;
      font-weight: 900;
      color: #FFFFFF;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .order-id-tag {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 700;
    }

    /* ORDER TYPE SEGMENTED BAR */
    .order-type-segmented-bar {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .seg-pill-btn {
      flex: 1;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.45rem 0.5rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .seg-pill-btn.is-active-seg {
      background: var(--sidebar-active-accent, var(--primary, #7E22CE));
      color: #FFFFFF;
      font-weight: 900;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    }

    /* CART ITEMS SCROLL PANE */
    .cart-items-scroll-pane {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      padding-right: 0.25rem;
    }

    .cart-empty-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 2rem 0;
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 0.85rem;
      position: relative;
    }

    .cart-item-avatar {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 9999px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    .item-emoji {
      font-size: 1.4rem;
    }

    .cart-item-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .item-name {
      font-size: 0.85rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sub-desc {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.75);
      margin: 0;
    }

    .item-stepper-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .stepper-circle-btn {
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.25);
      border: none;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .stepper-circle-btn:hover {
      background: rgba(255, 255, 255, 0.45);
    }
    .stepper-circle-btn .material-symbols-outlined {
      font-size: 0.85rem;
    }

    .stepper-qty-text {
      font-size: 0.82rem;
      color: #FFFFFF;
      min-width: 1.1rem;
      text-align: center;
    }

    .cart-item-remove-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.55);
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: color 0.15s ease;
    }
    .cart-item-remove-btn:hover {
      color: #FF6B6B;
    }

    /* PROMOTION CODE BOX */
    .promo-code-box {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      padding: 0.25rem 0.35rem 0.25rem 1rem;
      gap: 0.5rem;
    }

    .promo-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: #FFFFFF;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .promo-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .promo-apply-btn {
      background: var(--primary, #7E22CE);
      color: #FFFFFF;
      border: none;
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .promo-apply-btn:hover {
      transform: scale(1.03);
    }

    /* TOTALS BREAKDOWN */
    .cart-totals-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .totals-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .grand-total-row {
      font-size: 1.15rem;
      font-weight: 900;
      color: #FFFFFF;
      padding-top: 0.35rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.2);
    }

    /* CONFIRM ORDER ACTION */
    .cart-actions-bottom {
      padding-top: 0.25rem;
    }

    .confirm-order-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 9999px;
      padding: 0.85rem;
      font-size: 0.95rem;
      font-weight: 900;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 4px 15px var(--primary-glow, rgba(0, 0, 0, 0.3));
      transition: transform 0.15s ease, filter 0.15s ease;
    }
    .confirm-order-btn:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-2px);
    }
    .confirm-order-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `],
})
export class PosComponent implements OnInit {
  public cartService = inject(CartService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private customerService = inject(CustomerService);
  private diningService = inject(DiningService);
  private draftBillService = inject(DraftBillService);
  private checkoutService = inject(CheckoutService);
  private billService = inject(BillService);
  private orderService = inject(OrderService);
  private notify = inject(NotificationService);

  public products: Product[] = [];
  public filteredProducts: Product[] = [];
  public categories: Category[] = [];
  public selectedCategoryId: number | null = null;
  public searchQuery = '';

  public diningTables: DiningTable[] = [];
  public draftBills: DraftBill[] = [];
  public draftCount = 0;
  public recentOrders: Order[] = [];
  public activeOrderId = Math.floor(1000 + Math.random() * 9000);

  // Promo code
  public promoCode = '';
  public isPromoApplied = false;

  // Browser fullscreen
  public isBrowserFullscreen = false;

  // Modals state
  public showPaymentModal = false;
  public showTableModal = false;
  public showCustomerModal = false;
  public showDraftsModal = false;
  public showReceiptModal = false;

  // Payment inputs
  public selectedPaymentMethod: any = 'CASH';
  public tenderedAmount = 0;
  public changeDue = 0;
  public paymentReference = '';
  public isCheckingOut = false;

  // Customer inputs
  public customerPhone = '';
  public customerName = '';
  public customerAddress = '';

  // Receipt data
  public lastReceiptData: any = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadDraftCount();
    this.loadRecentOrders();
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if (event.key === 'F2') {
      event.preventDefault();
      document.getElementById('pos-search-input')?.focus();
    } else if (event.key === 'F4') {
      event.preventDefault();
      if (this.cartService.items().length > 0) this.holdCurrentBill();
    } else if (event.key === 'F8') {
      event.preventDefault();
      if (this.cartService.items().length > 0) this.openPaymentModal();
    } else if (event.key === 'Escape') {
      this.closeAllModals();
    }
  }

  closeAllModals() {
    this.showPaymentModal = false;
    this.showTableModal = false;
    this.showCustomerModal = false;
    this.showDraftsModal = false;
    this.showReceiptModal = false;
  }

  toggleBrowserFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isBrowserFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this.isBrowserFullscreen = false;
      }).catch(() => {});
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.success) this.categories = res.data;
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts(1, 100, undefined, undefined, 'ACTIVE').subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
          this.filterProducts();
        }
      },
    });
  }

  loadDraftCount(): void {
    this.draftBillService.getDrafts().subscribe({
      next: (res) => {
        if (res.success) {
          this.draftBills = res.data;
          this.draftCount = res.data.length;
        }
      },
    });
  }

  loadRecentOrders(): void {
    this.orderService.getOrders(1, 5).subscribe({
      next: (res) => {
        if (res.success) {
          this.recentOrders = res.data;
        }
      },
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  filterProducts(): void {
    let list = this.products;

    if (this.selectedCategoryId) {
      list = list.filter((p) => p.category_id === this.selectedCategoryId);
    }

    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    this.filteredProducts = list;
  }

  addToCart(product: Product): void {
    const success = this.cartService.addItem(product, 1);
    if (!success) {
      this.notify.error(`Cannot add "${product.name}" (Out of Stock / Inactive)`);
    } else {
      this.notify.info(`Added "${product.name}" to cart`);
    }
  }

  setOrderType(type: OrderType): void {
    this.cartService.orderType.set(type);
    if (type !== 'DINING') {
      this.cartService.selectedTable.set(null);
    }
  }

  openTableSelector(): void {
    this.diningService.getTables().subscribe({
      next: (res) => {
        if (res.success) {
          this.diningTables = res.data;
          this.showTableModal = true;
        }
      },
    });
  }

  selectTable(table: DiningTable): void {
    if (table.status === 'UNAVAILABLE') {
      this.notify.error('Table is currently unavailable');
      return;
    }
    this.cartService.orderType.set('DINING');
    this.cartService.selectedTable.set(table);
    this.showTableModal = false;
    this.notify.success(`Table ${table.table_number} selected for Dine-In`);
  }

  openCustomerModal(): void {
    const current = this.cartService.selectedCustomer();
    this.customerPhone = current?.phone || '';
    this.customerName = current?.name || '';
    this.customerAddress = current?.address || '';
    this.showCustomerModal = true;
  }

  searchCustomerByPhone(): void {
    if (!this.customerPhone) return;
    this.customerService.getCustomers(1, 10, this.customerPhone).subscribe({
      next: (res) => {
        if (res.success && res.data.length > 0) {
          const cust = res.data[0];
          this.customerName = cust.name;
          this.customerAddress = cust.address || '';
          this.notify.info(`Found customer: ${cust.name}`);
        } else {
          this.notify.info('New customer number. Please enter name.');
        }
      },
    });
  }

  saveAndSelectCustomer(): void {
    if (!this.customerPhone || !this.customerName) {
      this.notify.error('Please provide customer phone and name');
      return;
    }

    this.customerService
      .createCustomer({
        name: this.customerName,
        phone: this.customerPhone,
        address: this.customerAddress,
      })
      .subscribe({
        next: (res) => {
          this.cartService.selectedCustomer.set(res.data);
          this.showCustomerModal = false;
          this.notify.success(`Customer ${res.data.name} selected`);
        },
        error: () => {
          this.customerService.getCustomers(1, 5, this.customerPhone).subscribe({
            next: (lookupRes) => {
              if (lookupRes.success && lookupRes.data.length > 0) {
                this.cartService.selectedCustomer.set(lookupRes.data[0]);
                this.showCustomerModal = false;
              }
            },
          });
        },
      });
  }

  applyPromoCode(): void {
    const code = (this.promoCode || '').trim().toUpperCase();
    if (!code) {
      this.cartService.discountType.set('FIXED');
      this.cartService.discountValue.set(0);
      this.isPromoApplied = false;
      return;
    }

    // Promotion codes previously resolved against a hardcoded list in this file,
    // and any unrecognised code silently applied a flat discount. There is no
    // promotions table or API behind this, so no discount can be validated.
    // Use the manual discount control instead until a promotions endpoint exists.
    this.isPromoApplied = false;
    this.notify.error('Promotion codes are not configured. Use the discount field to apply a discount.');
  }

  holdCurrentBill(): void {
    const items = this.cartService.items().map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      notes: i.notes,
    }));

    const payload = {
      customerId: this.cartService.selectedCustomer()?.id,
      diningTableId: this.cartService.selectedTable()?.id,
      orderType: this.cartService.orderType(),
      discountType: this.cartService.discountType(),
      discountValue: this.cartService.discountValue(),
      items,
    };

    this.draftBillService.holdBill(payload).subscribe({
      next: (res) => {
        this.notify.success(`Bill held as ${res.data.draft_number}`);
        this.cartService.clearCart();
        this.loadDraftCount();
      },
    });
  }

  openDraftsModal(): void {
    this.loadDraftCount();
    this.showDraftsModal = true;
  }

  resumeDraft(id: number): void {
    this.draftBillService.resumeDraft(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.cartService.restoreFromDraft(res.data, this.products);
          this.showDraftsModal = false;
          this.loadDraftCount();
          this.notify.success(`Draft ${res.data.draft_number} resumed into POS`);
        }
      },
    });
  }

  deleteDraft(id: number): void {
    this.draftBillService.deleteDraft(id).subscribe({
      next: () => {
        this.loadDraftCount();
        this.notify.info('Draft deleted');
      },
    });
  }

  openPaymentModal(): void {
    this.tenderedAmount = this.cartService.grandTotal();
    this.changeDue = 0;
    this.showPaymentModal = true;
  }

  setTendered(amount: number): void {
    this.tenderedAmount = amount;
    this.calcChange();
  }

  calcChange(): void {
    this.changeDue = Math.max(0, this.tenderedAmount - this.cartService.grandTotal());
  }

  executeCheckout(): void {
    this.isCheckingOut = true;

    const payload = {
      customerId: this.cartService.selectedCustomer()?.id,
      diningTableId: this.cartService.selectedTable()?.id,
      orderType: this.cartService.orderType(),
      discountType: this.cartService.discountType(),
      discountValue: this.cartService.discountValue(),
      paymentMethod: this.selectedPaymentMethod,
      paymentAmount: this.tenderedAmount || this.cartService.grandTotal(),
      paymentReference: this.paymentReference,
      items: this.cartService.items().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        notes: i.notes,
      })),
    };

    this.checkoutService.checkout(payload).subscribe({
      next: (res) => {
        this.isCheckingOut = false;
        this.showPaymentModal = false;
        this.notify.success(`Bill #${res.data.bill_number} Settled Successfully!`);

        // Fetch print format & open receipt modal
        this.billService.getPrintData(res.data.id).subscribe({
          next: (printRes) => {
            if (printRes.success) {
              this.lastReceiptData = printRes.data;
              this.showReceiptModal = true;
            }
          },
        });

        this.cartService.clearCart();
        this.activeOrderId = Math.floor(1000 + Math.random() * 9000);
        this.loadProducts(); // refresh stock numbers
        this.loadRecentOrders(); // refresh bottom order reports
      },
      error: () => {
        this.isCheckingOut = false;
      },
    });
  }

  getCategoryAvatar(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('burger')) return '🍔';
    if (n.includes('pizza')) return '🍕';
    if (n.includes('mandi') || n.includes('rice') || n.includes('biryani')) return '🍗';
    if (n.includes('taco')) return '🌮';
    if (n.includes('sushi')) return '🍣';
    if (n.includes('gratin') || n.includes('bake')) return '🍲';
    if (n.includes('dessert') || n.includes('sweet') || n.includes('cake')) return '🍰';
    if (n.includes('drink') || n.includes('beverage') || n.includes('juice')) return '🥤';
    if (n.includes('starter') || n.includes('snack')) return '🥟';
    return '🥘';
  }

  getProductEmoji(name: string, categoryId?: number): string {
    const n = (name || '').toLowerCase();
    if (n.includes('burger')) return '🍔';
    if (n.includes('pizza') || n.includes('pepperoni')) return '🍕';
    if (n.includes('sushi')) return '🍣';
    if (n.includes('gratin')) return '🍲';
    if (n.includes('taco')) return '🌮';
    if (n.includes('mandi')) return '🍗';
    if (n.includes('biryani')) return '🥘';
    if (n.includes('pudding') || n.includes('sweet') || n.includes('umali')) return '🍮';
    if (n.includes('chicken')) return '🍗';
    if (n.includes('mutton')) return '🍖';
    if (n.includes('soup')) return '🥣';
    if (n.includes('salad')) return '🥗';
    if (n.includes('juice') || n.includes('shake')) return '🥤';
    return '🍽️';
  }
}


import {
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { PosDesignService } from '../../core/services/pos-design.service';
import { POS_DESIGN_CSS } from '../../shared/styles/pos-design.styles';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CustomerService } from '../../core/services/customer.service';
import { DiningService } from '../../core/services/dining.service';
import { DraftBillService } from '../../core/services/draft-bill.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { BillService } from '../../core/services/bill.service';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { Product, ProductVariant, Category, Customer, CartItem, DiningTable, DraftBill, Order, OrderType, PaymentMethod } from '../../core/models';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal/receipt-modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ReceiptModalComponent, AppCurrencyPipe, PageLoaderComponent],
  template: `
    <div
      class="pos-fullscreen-container"
      [ngClass]="posDesign.rootClass()"
      [ngStyle]="posDesign.pageCssVars()"
    >
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading menu…"
        subMessage="Fetching categories and dishes for the till."
        icon="storefront"
        (retry)="loadPosData()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- LEFT / MAIN PANEL: SEARCH, CATEGORIES, POPULAR DISHES & REPORTS -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pos-main-content">
        <!-- 1. TOP PILL SEARCH & QUICK ACTION BAR -->
        <div class="pos-top-search-row">
          <div class="pos-search-pill">
            <input
              title="Search menu items"
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
          </div>

          <!-- Scroll-to-view rail: the same prev/next pattern the staff role
               filter uses, but shown at every width because this strip
               overflows on desktop too. Each button is disabled at its end of
               the track, and the pair hides entirely when nothing overflows. -->
          <div class="cat-scroll-container">
            <button
              type="button"
              class="cat-scroll-arrow prev"
              [class.is-hidden]="!catCanScroll"
              [disabled]="!catCanScrollLeft"
              (click)="scrollCategories(-320)"
              aria-label="Scroll categories left"
              title="Scroll left"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <div
              class="categories-circles-track no-scrollbar"
              [class.is-dragging]="isDraggingCats"
              #catTrack
              (scroll)="updateCatScrollState()"
              (pointerdown)="onCatPointerDown($event)"
              (pointermove)="onCatPointerMove($event)"
              (pointerup)="onCatPointerEnd($event)"
              (pointercancel)="onCatPointerEnd($event)"
            >
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
                [title]="cat.name"
              >
                <div class="cat-avatar-bubble" [class.has-image]="hasCategoryImage(cat)">
                  <!-- The uploaded category thumbnail when there is one; the
                       name-matched emoji is the fallback, and also what a
                       broken image URL falls back to. -->
                  <img
                    *ngIf="hasCategoryImage(cat)"
                    class="cat-avatar-image"
                    [src]="settingsService.assetUrl(cat.image_url || '')"
                    [alt]="cat.name"
                    loading="lazy"
                    (error)="onCategoryImageError(cat)"
                  />
                  <span *ngIf="!hasCategoryImage(cat)" class="cat-avatar-icon">
                    {{ getCategoryAvatar(cat.name) }}
                  </span>
                </div>
                <span class="cat-circle-label">{{ cat.name }}</span>
              </button>
            </div>

            <button
              type="button"
              class="cat-scroll-arrow next"
              [class.is-hidden]="!catCanScroll"
              [disabled]="!catCanScrollRight"
              (click)="scrollCategories(320)"
              aria-label="Scroll categories right"
              title="Scroll right"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- 3. POPULAR DISHES (TEAL HERO CARDS AS IN SCREENSHOT) -->
        <div class="pos-section-block">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">
                {{ selectedCategoryId ? getSelectedCategoryName() : 'Popular Dishes' }}
              </h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">{{ filteredProducts.length }}</span> {{ selectedCategoryId ? 'dishes in this category' : 'Delicious dishes ready to serve' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="selectedCategoryId" class="popular-dish-side-tag">
                <span class="dot-indicator"></span>
                <span>{{ getSelectedCategoryName() }}</span>
                <button type="button" (click)="selectCategory(null)" class="tag-clear-btn" title="Show All Dishes">
                  <span class="material-symbols-outlined text-xs">close</span>
                </button>
              </span>
              <span *ngIf="!selectedCategoryId" class="popular-dish-side-tag is-all">
                <span>All Dishes ({{ products.length }})</span>
              </span>
            </div>
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
              [class.is-out-of-stock]="isOutOfStock(p)"
            >
              <!-- Decorative layers. Each design turns on what it needs:
                   the glow and confetti, the angled block and dot grid, the
                   colour band and arch, or the pale circle. -->
              <span class="dish-deco dish-deco-a" aria-hidden="true"></span>
              <span class="dish-deco dish-deco-b" aria-hidden="true"></span>

              <!-- Out of Stock Badge -->
              <div *ngIf="isOutOfStock(p)" class="out-of-stock-badge">
                <span>OUT OF STOCK</span>
              </div>

              <!-- NEW ribbon (Colour Arch); doubles as the corner dot in
                   Diagonal Split, which is why it carries no text there. -->
              <span class="dish-flag" aria-hidden="true">New</span>

              <!-- Dish photo, falling back to the name-matched emoji -->
              <div class="dish-floating-avatar">
                <img
                  *ngIf="hasProductImage(p)"
                  class="dish-photo"
                  [src]="settingsService.assetUrl(p.image_url!)"
                  [alt]="p.name"
                  loading="lazy"
                  draggable="false"
                  (error)="onProductImageError(p)"
                />
                <span *ngIf="!hasProductImage(p)" class="food-emoji">
                  {{ getProductEmoji(p.name, p.category_id) }}
                </span>
              </div>

              <!-- Dish Info. DOM order is fixed; each design reorders with CSS. -->
              <div class="dish-body">
                <h3 class="dish-title">{{ p.name }}</h3>

                <div class="dish-price-tag font-mono">
                  {{ p.selling_price | appCurrency:'1.0-0' }}
                </div>

                <p class="dish-desc">{{ p.description || 'Freshly prepared to order' }}</p>

                <!-- Where the artwork runs lorem spec columns, the card shows
                     the real figures instead. -->
                <div class="dish-specs">
                  <div class="spec-row">
                    <span class="spec-label">Category</span>
                    <span class="spec-value">{{ p.category_name || 'Uncategorised' }}</span>
                  </div>
                  <div class="spec-row">
                    <span class="spec-label">In Stock</span>
                    <span class="spec-value">{{ p.current_stock || 0 }}</span>
                  </div>
                  <div class="spec-row">
                    <span class="spec-label">Portions</span>
                    <span class="spec-value">{{ p.variants?.length || 'Single' }}</span>
                  </div>
                </div>

                <div class="dish-card-footer">
                  <div class="star-rating">
                    <span class="star-icon">★</span>
                    <span class="rating-value">{{ (4.2 + (i % 8) * 0.1) | number:'1.1-1' }}</span>
                  </div>
                  <div class="sales-count-badge">
                    {{ (120 + (i * 45) + 30) }} Total Sale
                  </div>
                </div>

                <div class="dish-cta" aria-hidden="true">
                  <span>ADD TO CART</span>
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

        <!-- FLOATING MOBILE BOTTOM CART BAR (< 768px) -->
        <div
          *ngIf="cartService.items().length > 0"
          class="pos-mobile-floating-bar"
          (click)="isMobileCartOpen = true"
        >
          <div class="flex items-center gap-2.5">
            <span class="pos-mobile-cart-badge">
              <span class="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>{{ cartService.itemCount() }}</span>
            </span>
            <div class="flex flex-col text-left">
              <span class="text-[10px] uppercase font-bold text-white/80 tracking-wider">Cart Total</span>
              <span class="text-sm font-black font-mono text-white leading-tight">
                {{ cartService.grandTotal() | appCurrency:'1.2-2' }}
              </span>
            </div>
          </div>
          <div class="pos-mobile-cart-cta">
            <span class="text-xs font-black uppercase">View & Pay</span>
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </div>
        </div>
      </div>

      <!-- Mobile Cart Backdrop Overlay (< 768px) -->
      <div
        *ngIf="isMobileCartOpen"
        class="pos-cart-mobile-backdrop"
        (click)="isMobileCartOpen = false"
        aria-hidden="true"
      ></div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- RIGHT PANEL: CHECKOUT & CART TERMINAL                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="pos-cart-sidebar" [class.is-mobile-open]="isMobileCartOpen">
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
            <span *ngIf="cartService.items().length > 0" class="pos-mobile-cart-item-count-badge">
              {{ cartService.itemCount() }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="order-id-tag font-mono">#{{ activeOrderId }}</span>
            <button
              type="button"
              class="pos-cart-mobile-close-btn"
              (click)="isMobileCartOpen = false"
              aria-label="Close Cart"
              title="Close Cart"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
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
              <h4 class="item-name">
                {{ item.product.name }}
                <span *ngIf="item.variant" class="cart-variant-chip">{{ item.variant.name }}</span>
              </h4>
              <p class="item-sub-desc">
                <ng-container *ngIf="item.variant">
                  Uses {{ item.variant.stock_consumption }} per unit
                  <ng-container *ngIf="item.notes"> · {{ item.notes }}</ng-container>
                </ng-container>
                <ng-container *ngIf="!item.variant">
                  {{ item.notes || (item.product.category_id === 1 ? 'Thin Crust' : 'Special Portion') }}
                </ng-container>
              </p>

              <!-- Stepper Control -->
              <div class="item-stepper-row">
                <button
                  type="button"
                  (click)="cartService.decrement(item.lineId)"
                  class="stepper-circle-btn"
                >
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <span class="stepper-qty-text font-mono font-bold">{{ item.quantity }}</span>
                <button
                  type="button"
                  (click)="cartService.increment(item.lineId)"
                  class="stepper-circle-btn"
                >
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              (click)="removeCartItem(item)"
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
            title="Promotion Code"
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
      <div class="modal-content p-7 md:p-8 w-full max-w-2xl shadow-2xl">
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge is-teal">
              <span class="material-symbols-outlined text-2xl">point_of_sale</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">Settlement & Checkout</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Select payment mode, record tender, and print receipt</p>
            </div>
          </div>
          <button (click)="showPaymentModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Total Display -->
          <div class="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
            <span class="text-xs font-bold uppercase text-teal-900">Total Payable</span>
            <span class="text-3xl font-black font-mono text-[#008080]">
              {{ cartService.grandTotal() | appCurrency:'1.2-2' }}
            </span>
          </div>

          <!-- Payment Methods Selector -->
          <div>
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Payment Mode</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                type="button"
                *ngFor="let method of ['CASH', 'UPI', 'CARD', 'OTHER']"
                (click)="selectedPaymentMethod = method"
                class="py-2.5 px-3 rounded-xl font-bold transition-all text-xs border"
                [ngClass]="selectedPaymentMethod === method ? 'bg-[#7E22CE] text-white border-transparent shadow-sm' : 'bg-[#FAF5FF] text-[#2E1065] border-[#E9D5FF] hover:bg-[#F3E8FF]'"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Cash Tendered & Quick Notes -->
          <div *ngIf="selectedPaymentMethod === 'CASH'" class="space-y-3 p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF]">
            <div>
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Amount Tendered</label>
              <input
                title="Amount Tendered"
                type="number"
                [(ngModel)]="tenderedAmount"
                (ngModelChange)="calcChange()"
                class="form-control text-lg font-mono font-bold text-emerald-700 w-full"
              />
            </div>

            <!-- Quick Cash Denominations -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                *ngFor="let amt of [cartService.grandTotal(), 500, 1000, 2000]"
                (click)="setTendered(amt)"
                class="flex-1 py-1.5 text-xs font-mono font-bold rounded-lg bg-white border border-[#DDD6FE] text-[#6B21A8] hover:bg-[#F3E8FF]"
              >
                {{ amt | appCurrency:'1.0-0' }}
              </button>
            </div>

            <!-- Change Return -->
            <div class="flex items-center justify-between pt-2 border-t border-[#E9D5FF]">
              <span class="text-xs font-bold text-[#6B7280]">Change Due:</span>
              <span class="text-base font-black font-mono text-emerald-700">
                {{ changeDue | appCurrency:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- Reference Number (for UPI / Card) -->
          <div *ngIf="selectedPaymentMethod !== 'CASH'" class="form-group mb-0">
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Transaction Reference # (Optional)</label>
            <input
              title="Transaction Reference # (Optional)"
              type="text"
              [(ngModel)]="paymentReference"
              placeholder="e.g. UPI Ref / Auth Code"
              class="form-control text-sm w-full font-mono"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[#E9D5FF]">
          <button (click)="showPaymentModal = false" class="action-btn btn-outline-purple">
            Cancel
          </button>
          <button
            (click)="executeCheckout()"
            [disabled]="isCheckingOut"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined text-[18px]">receipt_long</span>
            <span *ngIf="isCheckingOut">Processing Payment...</span>
            <span *ngIf="!isCheckingOut">Complete & Print Bill ✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 2. DINING TABLE SELECTOR MODAL                                  -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showTableModal">
      <div class="modal-content p-7 md:p-8 w-full max-w-2xl shadow-2xl">
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined text-2xl">table_restaurant</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">Select Dining Table</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Assign current POS order to an available dining table</p>
            </div>
          </div>
          <button (click)="showTableModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
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
              <span class="text-sm font-extrabold text-[#2E1065]">{{ table.table_number }}</span>
              <span
                class="text-[9px] py-0.5 px-1.5 rounded-full font-bold uppercase"
                [ngClass]="table.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
              >
                {{ table.status }}
              </span>
            </div>
            <div class="text-[11px] text-[#6B7280] mt-2 font-medium">{{ table.section }}</div>
            <div class="text-[10px] text-[#9CA3AF] mt-0.5">Cap: {{ table.capacity }} Seats</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 3. CUSTOMER SELECTOR / ADD MODAL                                -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showCustomerModal">
      <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined text-2xl">person</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">Customer & Delivery Details</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Attach guest profile or delivery address to order</p>
            </div>
          </div>
          <button (click)="showCustomerModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-3.5">
          <div class="form-group mb-0">
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Phone Number</label>
            <div class="flex gap-2">
              <input
                title="Phone Number"
                type="tel"
                [(ngModel)]="customerPhone"
                placeholder="10-digit mobile number"
                class="form-control font-mono text-sm flex-1"
              />
              <button (click)="searchCustomerByPhone()" class="action-btn btn-outline-purple !py-1.5 !px-3 text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">search</span>
                <span>Lookup</span>
              </button>
            </div>
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Customer Name</label>
            <input
              title="Customer Name"
              type="text"
              [(ngModel)]="customerName"
              placeholder="e.g. Jamsed Jhon"
              class="form-control text-sm w-full"
            />
          </div>

          <div class="form-group mb-0">
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">Delivery Address (Optional)</label>
            <input
              title="Delivery Address (Optional)"
              type="text"
              [(ngModel)]="customerAddress"
              placeholder="Po.1478, Street No. 52 West New York"
              class="form-control text-sm w-full"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-5 mt-3 border-t border-[#E9D5FF]">
          <button (click)="showCustomerModal = false" class="action-btn btn-outline-purple">
            Cancel
          </button>
          <button (click)="saveAndSelectCustomer()" class="action-btn btn-gradient-purple">
            <span class="material-symbols-outlined text-[18px]">check</span>
            <span>Apply to Cart ✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 4. DRAFT BILLS MODAL                                            -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showDraftsModal">
      <div class="modal-content p-7 md:p-8 w-full max-w-2xl shadow-2xl">
        <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined text-2xl">drafts</span>
            </span>
            <div>
              <h3 class="text-lg font-black text-[#2E1065] leading-tight">Held / Draft Bills</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Resume parked transactions and pending tables</p>
            </div>
          </div>
          <button (click)="showDraftsModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-2.5 max-h-[60vh] overflow-y-auto">
          <div *ngIf="draftBills.length === 0" class="text-xs text-[#9CA3AF] text-center py-8">
            No active draft bills on hold.
          </div>

          <div
            *ngFor="let draft of draftBills"
            class="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-between gap-3 hover:border-[var(--primary)] transition-colors"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-[var(--primary)] font-mono">{{ draft.draft_number }}</span>
                <span class="text-[9px] py-0.5 px-2 rounded-full bg-[#EDE9FE] text-[#6B21A8] font-bold uppercase">{{ draft.order_type }}</span>
              </div>
              <div class="text-[11px] text-[#6B7280] mt-1 font-medium">
                {{ draft.item_count }} items • {{ draft.created_at | date:'HH:mm' }}
                <span *ngIf="draft.customer_name"> • {{ draft.customer_name }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button (click)="resumeDraft(draft.id)" class="action-btn btn-gradient-purple !py-1.5 !px-3 text-xs flex items-center gap-1">
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

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 5. DISH VARIANT (PORTION) CHOOSER                               -->
    <!-- Nothing reaches the cart until a portion is chosen: the portion -->
    <!-- decides both the price and how much stock the sale consumes.    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="variantPickerProduct">
      <div class="modal-content p-6 max-w-md">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined">restaurant_menu</span>
            </span>
            <div>
              <h3 class="text-lg font-black text-[#2E1065] leading-tight">Choose Portion</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ variantPickerProduct?.name }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeVariantPicker()"
            class="modal-close-btn"
            title="Close"
            aria-label="Close"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="variant-available-strip">
          <span class="flex items-center gap-1.5">
            <span class="material-symbols-outlined" style="font-size: 17px;">inventory_2</span>
            <span>Available Stock</span>
          </span>
          <strong class="font-mono">
            {{ availableStock(variantPickerProduct) | number:'1.0-3' }}
            {{ variantPickerProduct?.linked_unit_type || 'units' }}
          </strong>
        </div>

        <div class="variant-option-list">
          <button
            *ngFor="let v of variantPickerOptions"
            type="button"
            class="variant-option"
            [disabled]="stockAfter(variantPickerProduct, v) < 0"
            (click)="chooseVariant(v)"
          >
            <div class="variant-option-left">
              <span class="variant-option-name">{{ v.name }}</span>
              <span class="variant-option-meta">
                Uses {{ v.stock_consumption }} · leaves
                <strong>{{ stockAfter(variantPickerProduct, v) | number:'1.0-3' }}</strong>
              </span>
            </div>
            <div class="variant-option-right">
              <span class="variant-option-price font-mono">{{ v.selling_price | appCurrency:'1.0-0' }}</span>
              <span
                class="variant-option-flag"
                *ngIf="stockAfter(variantPickerProduct, v) < 0"
              >Not enough stock</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 6. THERMAL RECEIPT PRINT MODAL -->
    <app-receipt-modal
      [isOpen]="showReceiptModal"
      [printData]="lastReceiptData"
      (close)="showReceiptModal = false"
    ></app-receipt-modal>
  `,
  styles: [`
    /* ─── Dish variant (portion) chooser ─── */
    .variant-available-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.85rem;
      margin-bottom: 0.85rem;
      border-radius: 12px;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #6B7280);
    }

    .variant-available-strip strong {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    .variant-option-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .variant-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: 100%;
      padding: 0.8rem 0.95rem;
      border-radius: 14px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--card-bg, #FFFFFF);
      text-align: left;
      cursor: pointer;
      transition:
        border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .variant-option:hover:not(:disabled) {
      border-color: var(--primary, #7E22CE);
      transform: translateY(-2px);
      box-shadow: 0 8px 18px -6px var(--primary-glow, rgba(126, 34, 206, 0.35));
    }

    .variant-option:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    .variant-option:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-style: dashed;
    }

    .variant-option-left {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .variant-option-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    .variant-option-meta {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted, #6B7280);
    }

    .variant-option-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.15rem;
      flex-shrink: 0;
    }

    .variant-option-price {
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary, #7E22CE);
    }

    .variant-option-flag {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--danger, #DC2626);
    }

    /* Portion badge on a cart line */
    .cart-variant-chip {
      display: inline-block;
      margin-left: 0.35rem;
      padding: 0.05rem 0.4rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.24);
      font-size: 0.625rem;
      font-weight: 800;
      vertical-align: middle;
    }

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

    /* A category with an uploaded thumbnail shows it full-bleed, so the bubble
       drops its own padding-ish tint and lets the photo fill the circle. */
    .cat-avatar-bubble.has-image {
      overflow: hidden;
      background: var(--card-bg, #FFFFFF);
    }

    .cat-avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: inherit;
    }

    /* ── Scroll rail ──────────────────────────────────────────────── */
    .cat-scroll-container {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
    }

    .cat-scroll-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      padding: 0;
      border-radius: 10px;
      background: var(--card-bg, #FFFFFF);
      border: 1.5px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(46, 16, 101, 0.06);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      outline: none;
    }

    .cat-scroll-arrow:hover:not(:disabled) {
      border-color: var(--primary, #7E22CE);
      background: var(--primary-light, rgba(126, 34, 206, 0.08));
      transform: scale(1.08);
      box-shadow: 0 4px 12px var(--primary-light, rgba(126, 34, 206, 0.18));
    }

    .cat-scroll-arrow:active:not(:disabled) {
      transform: scale(0.92);
    }

    /* Kept in the layout when it cannot scroll further, so the strip does not
       shift sideways as the ends are reached. */
    .cat-scroll-arrow:disabled {
      opacity: 0.35;
      cursor: default;
      box-shadow: none;
    }

    /* Nothing overflows: no reason for the controls to be there at all. */
    .cat-scroll-arrow.is-hidden {
      display: none;
    }

    .cat-scroll-arrow .material-symbols-outlined {
      font-size: 20px;
    }

    .cat-scroll-container .categories-circles-track {
      flex: 1 1 auto;
      min-width: 0;
      cursor: grab;
      /* Touch keeps native horizontal scrolling and its momentum; only the
         mouse is given drag-to-scroll. */
      touch-action: pan-x;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .cat-scroll-container .categories-circles-track::-webkit-scrollbar {
      display: none;
    }

    /* Smooth scrolling would fight a drag, so it is off while one is running. */
    .cat-scroll-container .categories-circles-track.is-dragging {
      cursor: grabbing;
      scroll-behavior: auto;
      -webkit-user-select: none;
      user-select: none;
    }

    .cat-scroll-container .categories-circles-track.is-dragging .cat-circle-card {
      cursor: grabbing;
    }

    .cat-scroll-container .categories-circles-track img {
      -webkit-user-drag: none;
      user-select: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .cat-scroll-container .categories-circles-track {
        scroll-behavior: auto;
      }
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

    /* POPULAR DISHES SIDE TAG */
    .popular-dish-side-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 9999px;
      box-shadow: 0 2px 6px rgba(126, 34, 206, 0.08);
    }
    .popular-dish-side-tag.is-all {
      color: var(--text-dark, #2E1065);
      background: rgba(255, 255, 255, 0.75);
    }
    .dot-indicator {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: var(--accent, #EA580C);
    }
    .tag-clear-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: rgba(126, 34, 206, 0.12);
      border: none;
      color: var(--primary, #7E22CE);
      cursor: pointer;
      margin-left: 0.2rem;
      transition: background 0.15s ease;
    }
    .tag-clear-btn:hover {
      background: rgba(126, 34, 206, 0.25);
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
      opacity: 0.55;
      filter: grayscale(0.85);
      cursor: not-allowed;
    }

    .out-of-stock-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: #FFFFFF;
      font-size: 0.58rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.45);
      z-index: 2;
      border: 1px solid rgba(255, 255, 255, 0.4);
      text-shadow: none;
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

    /* ═══════════════════════════════════════════════════════════════════ */
    /* RESPONSIVE LAYOUTS (TABLET & MOBILE)                                */
    /* ═══════════════════════════════════════════════════════════════════ */
    @media (max-width: 1023px) {
      .pos-cart-sidebar {
        width: 340px;
        padding: 1rem;
      }
      .dishes-cards-grid {
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 1rem !important;
      }
    }

    @media (max-width: 767px) {
      .pos-fullscreen-container {
        flex-direction: column;
        position: relative;
        height: 100vh;
        overflow: hidden;
      }

      .pos-main-content {
        padding: 0.875rem 1rem 5.5rem 1rem;
        gap: 1.25rem;
      }

      .pos-top-search-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.65rem;
      }

      .pos-search-pill {
        max-width: 100%;
        width: 100%;
      }

      .pos-quick-tools {
        width: 100%;
        justify-content: space-between;
      }

      .pos-quick-tools .tool-btn {
        flex: 1;
        justify-content: center;
        padding: 0.45rem 0.65rem;
        font-size: 0.75rem;
      }

      .dishes-cards-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.875rem !important;
      }

      .order-reports-table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .order-reports-table {
        min-width: 520px;
      }

      /* Mobile Bottom Sheet Cart Drawer */
      .pos-cart-sidebar {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100% !important;
        max-height: 88vh;
        border-radius: 20px 20px 0 0;
        z-index: 1001;
        box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.65);
        transform: translateY(100%);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
      }

      .pos-cart-sidebar.is-mobile-open {
        transform: translateY(0);
      }

      .pos-cart-mobile-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 1000;
        animation: fadeInBackdrop 0.2s ease-out;
      }

      .pos-cart-mobile-close-btn {
        display: flex !important;
      }

      .pos-mobile-floating-bar {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #ffffff;
        padding: 0.75rem 1.15rem;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 8px 24px var(--primary-glow, rgba(126, 34, 206, 0.45));
        z-index: 900;
        cursor: pointer;
        animation: slideUpFloating 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .pos-mobile-cart-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.3rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .pos-mobile-cart-cta {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: #ffffff;
        color: var(--primary, #7E22CE);
        padding: 0.4rem 0.85rem;
        border-radius: 9999px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
    }

    @media (max-width: 420px) {
      .dishes-cards-grid {
        grid-template-columns: 1fr !important;
      }
    }

    .pos-cart-mobile-close-btn {
      display: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }

    .pos-mobile-cart-item-count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 800;
      background: var(--accent, #EA580C);
      color: #ffffff;
      width: 20px;
      height: 20px;
      border-radius: 9999px;
    }

    @keyframes slideUpFloating {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* ═══════════════════════════════════════════════════════════════════
       GLASS LAYER
       ───────────────────────────────────────────────────────────────────
       Restyles surfaces defined earlier in this file as real glass. Kept as
       one block, last, so it can be reviewed or removed in one piece.

       Glass only reads as glass when there is something behind it to
       refract, so the container gets an ambient colour wash and the panels
       blur whatever sits underneath them.

       Every surface is driven by the custom properties below, so the two
       degraded modes — no backdrop-filter support, and the OS asking for
       reduced transparency — are a handful of reassignments at the end
       rather than a second copy of every rule.

       backdrop-filter is applied ONLY to leaf surfaces, never to
       .pos-fullscreen-container or .pos-main-content: a filtered element
       becomes the containing block for position: fixed descendants, which
       would break the mobile cart drawer and its backdrop.
       ═══════════════════════════════════════════════════════════════════ */
    .pos-fullscreen-container {
      position: relative;
      isolation: isolate;

      --g-blur: blur(26px) saturate(200%) brightness(1.06);
      --g-blur-sm: blur(14px) saturate(170%);
      --g-dish: linear-gradient(145deg, rgba(126, 34, 206, 0.58) 0%, rgba(107, 33, 168, 0.42) 100%);
      --g-cat: linear-gradient(135deg, rgba(126, 34, 206, 0.62) 0%, rgba(107, 33, 168, 0.42) 100%);
      --g-pill: linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.42) 100%);
      --g-avatar: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.62) 100%);
      --g-edge: 1px solid rgba(255, 255, 255, 0.4);
      --g-scrim: linear-gradient(180deg, rgba(23, 8, 51, 0.04) 0%, rgba(23, 8, 51, 0.16) 45%, rgba(23, 8, 51, 0.34) 100%);
      --g-wash: 1;
    }

    /* Ambient wash: the colour pools the panels refract. */
    .pos-fullscreen-container::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      opacity: var(--g-wash);
      background:
        radial-gradient(30rem 30rem at 6% -6%, rgba(126, 34, 206, 0.55) 0%, transparent 65%),
        radial-gradient(26rem 26rem at 99% 4%, rgba(234, 88, 12, 0.42) 0%, transparent 65%),
        radial-gradient(32rem 32rem at 78% 52%, rgba(147, 51, 234, 0.45) 0%, transparent 66%),
        radial-gradient(28rem 28rem at 18% 88%, rgba(107, 33, 168, 0.42) 0%, transparent 66%),
        radial-gradient(22rem 22rem at 46% 24%, rgba(234, 88, 12, 0.22) 0%, transparent 70%);
    }

    /* The scroll area must not paint over the wash. */
    .pos-main-content { background: transparent; }

    .pos-search-pill {
      background: var(--g-pill);
      -webkit-backdrop-filter: var(--g-blur-sm);
      backdrop-filter: var(--g-blur-sm);
      border: var(--g-edge);
      box-shadow:
        0 8px 24px -6px rgba(46, 16, 101, 0.18),
        inset 1px 1px 0 rgba(255, 255, 255, 0.75);
    }

    .pos-search-pill:focus-within {
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow:
        0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.18)),
        0 10px 28px -6px rgba(46, 16, 101, 0.24),
        inset 1px 1px 0 rgba(255, 255, 255, 0.85);
    }

    .cat-avatar-bubble {
      background: var(--g-cat);
      -webkit-backdrop-filter: var(--g-blur-sm);
      backdrop-filter: var(--g-blur-sm);
      border: var(--g-edge);
      box-shadow:
        0 8px 20px -6px var(--primary-glow, rgba(126, 34, 206, 0.45)),
        inset 1px 1px 0 rgba(255, 255, 255, 0.55),
        inset 0 -6px 14px -6px rgba(0, 0, 0, 0.18);
    }

    .cat-circle-card.is-selected .cat-avatar-bubble {
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow:
        0 0 0 3px var(--accent-light, rgba(234, 88, 12, 0.35)),
        0 10px 24px -6px var(--primary-glow, rgba(126, 34, 206, 0.5)),
        inset 1px 1px 0 rgba(255, 255, 255, 0.7);
    }

    /* Tinted rather than clear glass: the labels inside are white, and clear
       glass over a light page would leave them unreadable. */
    .dish-hero-card {
      position: relative;
      overflow: hidden;
      background: var(--g-dish);
      -webkit-backdrop-filter: var(--g-blur);
      backdrop-filter: var(--g-blur);
      border: var(--g-edge);
      box-shadow:
        0 12px 32px -10px rgba(46, 16, 101, 0.42),
        inset 1px 1px 0 rgba(255, 255, 255, 0.45),
        inset 0 -22px 34px -24px rgba(0, 0, 0, 0.55);
      text-shadow: 0 1px 2px rgba(23, 8, 51, 0.35);
    }

    /* Readability scrim. Where the wash behind a card is pale the glass goes
       pale with it, which would leave white labels barely legible.
       backdrop-filter makes the card a stacking context, so z-index: -1 puts
       this above the card's own tint but below its text. Tinted, not grey, so
       it reads as depth in the glass rather than dirt. */
    .dish-hero-card::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background: var(--g-scrim);
    }

    /* Specular highlight — the bright band real glass catches. Sweeps on hover. */
    .dish-hero-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 55%;
      height: 100%;
      pointer-events: none;
      background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.28) 45%, transparent 100%);
      transform: skewX(-18deg);
      transition: left 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dish-hero-card:hover::after { left: 115%; }
    .dish-hero-card.is-out-of-stock::after { display: none; }

    .dish-hero-card:hover {
      border-color: rgba(255, 255, 255, 0.55);
      box-shadow:
        0 18px 40px -10px rgba(46, 16, 101, 0.5),
        inset 1px 1px 0 rgba(255, 255, 255, 0.6);
    }

    .dish-floating-avatar {
      background: var(--g-avatar);
      -webkit-backdrop-filter: blur(12px) saturate(170%);
      backdrop-filter: blur(12px) saturate(170%);
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow:
        0 8px 18px -6px rgba(46, 16, 101, 0.35),
        inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    }

    /* Degraded modes. Without backdrop-filter the panels would be flat
       translucent washes with nothing behind them; with reduced transparency
       the user has asked not to have them at all. Both revert to the solid
       surfaces this page had before, by reassigning the tokens above. */
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .pos-fullscreen-container {
        --g-dish: linear-gradient(145deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        --g-cat: var(--primary, #7E22CE);
        --g-pill: var(--card-bg, #FFFFFF);
        --g-avatar: var(--card-bg, #FFFFFF);
        --g-scrim: none;
      }
    }

    @media (prefers-reduced-transparency: reduce) {
      .pos-fullscreen-container {
        --g-blur: none;
        --g-blur-sm: none;
        --g-dish: linear-gradient(145deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        --g-cat: var(--primary, #7E22CE);
        --g-pill: var(--card-bg, #FFFFFF);
        --g-avatar: var(--card-bg, #FFFFFF);
        --g-scrim: none;
        --g-wash: 0;
      }
      .pos-main-content { background: var(--bg-app, #FAF5FF); }
      .dish-hero-card { text-shadow: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .dish-hero-card::after { transition: none; }
      .dish-hero-card:hover::after { left: -60%; }
    }
  `, POS_DESIGN_CSS],
})
export class PosComponent implements OnInit, AfterViewInit {
  public cartService = inject(CartService);
  public posDesign = inject(PosDesignService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private customerService = inject(CustomerService);
  private diningService = inject(DiningService);
  private draftBillService = inject(DraftBillService);
  private checkoutService = inject(CheckoutService);
  private billService = inject(BillService);
  private orderService = inject(OrderService);
  private notify = inject(NotificationService);
  public settingsService = inject(SettingsService);

  /** Horizontal rail for the category circles; see scrollCategories(). */
  @ViewChild('catTrack') private catTrackRef?: ElementRef<HTMLElement>;

  public catCanScroll = false;
  public catCanScrollLeft = false;
  public catCanScrollRight = false;

  /** Categories whose thumbnail failed to load, so they fall back to an emoji. */
  private brokenCategoryImages = new Set<number>();

  public isMobileCartOpen = false;

  public isLoading = false;
  public loadError: string | null = null;
  /** Outstanding menu requests the loader is waiting on; see loadPosData(). */
  private pendingCriticalLoads = 0;

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
    this.loadPosData();
  }

  ngAfterViewInit(): void {
    // First measurement of the category rail, once the track element exists.
    setTimeout(() => this.updateCatScrollState());
  }

  /**
   * The till is only usable once the menu itself has arrived, so the loader is
   * held until both the category strip and the dish catalogue have settled.
   * The draft count and recent-order strip are decorations around that — they
   * load alongside and never hold the screen up.
   */
  loadPosData(): void {
    this.isLoading = true;
    this.loadError = null;
    this.pendingCriticalLoads = 2;

    this.loadCategories();
    this.loadProducts();
    this.loadDraftCount();
    this.loadRecentOrders();
  }

  /**
   * Clears the loader once both critical requests have finished, pass or fail.
   *
   * loadProducts() is also called on its own after a checkout to refresh stock
   * counts. That is not a page load, so when nothing is pending this returns
   * without touching the loader — otherwise a hiccup on that refresh would
   * throw an error overlay over a till that had just settled a bill.
   */
  private settleCriticalLoad(err?: any): void {
    if (this.pendingCriticalLoads === 0) return;

    if (err) {
      this.loadError =
        err?.error?.message || 'Unable to load the menu. Please check your connection and try again.';
    }
    this.pendingCriticalLoads--;
    if (this.pendingCriticalLoads === 0) {
      this.isLoading = false;
    }
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
        this.settleCriticalLoad();
        // The circles have not been laid out yet in this tick, so the rail's
        // scrollWidth is still stale; measure once the DOM has caught up.
        setTimeout(() => this.updateCatScrollState());
      },
      error: (err) => this.settleCriticalLoad(err),
    });
  }

  loadProducts(): void {
    this.productService.getProducts(1, 100, undefined, undefined, 'ACTIVE').subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
          this.filterProducts();
        }
        this.settleCriticalLoad();
      },
      error: (err) => this.settleCriticalLoad(err),
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
      // Secondary data: the interceptor reports it, and the till still works.
      error: () => {},
    });
  }

  loadRecentOrders(): void {
    this.orderService.getOrders(1, 5).subscribe({
      next: (res) => {
        if (res.success) {
          this.recentOrders = res.data;
        }
      },
      error: () => {},
    });
  }

  selectCategory(categoryId: number | null): void {
    // The click that ends a drag is swallowed here rather than by the buttons,
    // so every entry point to the rail is covered by one guard.
    if (this.suppressCatClick) {
      this.suppressCatClick = false;
      return;
    }
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  // ── Drag-to-scroll ────────────────────────────────────────────────
  //
  // A touchscreen already scrolls this rail natively, with momentum, so touch
  // is left alone — intercepting it would replace something good with
  // something worse. A mouse has no such gesture, and reaching for the arrows
  // every time is slow, so the mouse gets click-and-drag instead.

  public isDraggingCats = false;
  private catDragStartX = 0;
  private catDragStartScroll = 0;
  private catDragDistance = 0;
  private catPointerId: number | null = null;
  private suppressCatClick = false;

  /** Movement under this is a click, not a drag. */
  private static readonly CAT_DRAG_THRESHOLD_PX = 5;

  onCatPointerDown(event: PointerEvent): void {
    // Touch and pen keep their native scrolling; left mouse button only.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const track = this.catTrackRef?.nativeElement;
    if (!track) return;

    this.isDraggingCats = true;
    this.catPointerId = event.pointerId;
    this.catDragStartX = event.clientX;
    this.catDragStartScroll = track.scrollLeft;
    this.catDragDistance = 0;

    // The pointer is deliberately not captured here. A capture held at
    // pointerup retargets the click that follows to the capturing element, so
    // a card inside the rail would never receive its own click. Capture is
    // taken in onCatPointerMove, once the gesture is really a drag.
  }

  onCatPointerMove(event: PointerEvent): void {
    if (!this.isDraggingCats) return;

    const track = this.catTrackRef?.nativeElement;
    if (!track) return;

    const dx = event.clientX - this.catDragStartX;
    this.catDragDistance = Math.max(this.catDragDistance, Math.abs(dx));
    track.scrollLeft = this.catDragStartScroll - dx;

    // Past the threshold the gesture is a drag, not a click, so the rail takes
    // the pointer and the drag survives the cursor leaving the rail.
    if (
      this.catPointerId !== null &&
      this.catDragDistance > PosComponent.CAT_DRAG_THRESHOLD_PX &&
      !track.hasPointerCapture(this.catPointerId)
    ) {
      track.setPointerCapture(this.catPointerId);
    }

    // Stops the browser starting a native image drag from a category thumbnail.
    event.preventDefault();
  }

  // Also on the window, because a press is only captured once it crosses the
  // drag threshold — a press that ends off the rail before then would
  // otherwise leave the rail stuck in its dragging state.
  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onCatPointerEnd(event: PointerEvent): void {
    if (!this.isDraggingCats || event.pointerId !== this.catPointerId) return;
    this.isDraggingCats = false;
    this.catPointerId = null;

    const track = this.catTrackRef?.nativeElement;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    if (this.catDragDistance > PosComponent.CAT_DRAG_THRESHOLD_PX) {
      this.suppressCatClick = true;
      // Cleared on the next macrotask, which runs after the click this drag
      // produced — so a drag ending on empty space cannot swallow a later click.
      setTimeout(() => (this.suppressCatClick = false));
    }

    this.updateCatScrollState();
  }

  // ── Category rail ─────────────────────────────────────────────────

  /** Steps the category strip by one screenful-ish; CSS handles the easing. */
  scrollCategories(amount: number): void {
    const track = this.catTrackRef?.nativeElement;
    if (!track) return;
    track.scrollBy({ left: amount, behavior: 'smooth' });
    // scrollBy is animated, so the (scroll) handler updates the arrows as it
    // travels; this just covers the case where it cannot move at all.
    this.updateCatScrollState();
  }

  /**
   * Recomputes whether the rail overflows and which ends it has reached, so
   * each arrow can be disabled at its end and the pair hidden when everything
   * already fits. Called on scroll, on resize, and after categories arrive.
   */
  updateCatScrollState(): void {
    const track = this.catTrackRef?.nativeElement;
    if (!track) {
      this.catCanScroll = false;
      return;
    }

    // Sub-pixel layout means scrollLeft rarely hits the exact maximum, so the
    // ends are treated as reached within a pixel or two.
    const EPS = 2;
    const max = track.scrollWidth - track.clientWidth;

    this.catCanScroll = max > EPS;
    this.catCanScrollLeft = track.scrollLeft > EPS;
    this.catCanScrollRight = track.scrollLeft < max - EPS;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateCatScrollState();
  }

  /** Dish photos that 404'd; they fall back to the emoji instead of a broken icon. */
  private brokenProductImages = new Set<number>();

  hasProductImage(p: Product): boolean {
    return !!p.image_url && !this.brokenProductImages.has(p.id);
  }

  onProductImageError(p: Product): void {
    this.brokenProductImages.add(p.id);
  }

  /** True when the category has a usable thumbnail that has not failed to load. */
  hasCategoryImage(cat: Category): boolean {
    return !!cat.image_url && !this.brokenCategoryImages.has(cat.id);
  }

  /** A 404 or broken upload falls back to the name-matched emoji. */
  onCategoryImageError(cat: Category): void {
    this.brokenCategoryImages.add(cat.id);
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) return 'All Dishes';
    const found = this.categories.find((c) => c.id === this.selectedCategoryId);
    return found ? found.name : 'Selected Category';
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

    // Sort: In-stock dishes first (at the top), Out-of-stock dishes below (at the bottom)
    this.filteredProducts = [...list].sort((a, b) => {
      const aInStock = this.availableStock(a) > 0 ? 1 : 0;
      const bInStock = this.availableStock(b) > 0 ? 1 : 0;
      if (aInStock !== bInStock) {
        return bInStock - aInStock; // 1 (in-stock) comes before 0 (out-of-stock)
      }
      return 0; // maintain default/category order within the same stock status
    });
  }

  /** Checks if a dish is currently out of stock. */
  public isOutOfStock(product: Product | null): boolean {
    return this.availableStock(product) <= 0;
  }

  /** Dish awaiting a portion choice; null when the chooser is closed. */
  public variantPickerProduct: Product | null = null;

  public get variantPickerOptions(): ProductVariant[] {
    return (this.variantPickerProduct?.variants || []).filter((v) => v.status !== 'INACTIVE');
  }

  /**
   * A dish that defines portions cannot be added without one — the server
   * rejects it too, because the consumption is what leaves the ledger.
   */
  addToCart(product: Product): void {
    if (this.isOutOfStock(product)) {
      this.notify.warning(`"${product.name}" is currently Out of Stock`);
      return;
    }
    const variants = (product.variants || []).filter((v) => v.status !== 'INACTIVE');
    if (variants.length > 0) {
      this.variantPickerProduct = product;
      return;
    }
    this.commitToCart(product, null);
  }

  chooseVariant(variant: ProductVariant): void {
    const product = this.variantPickerProduct;
    if (!product) return;
    this.variantPickerProduct = null;
    this.commitToCart(product, variant);
  }

  closeVariantPicker(): void {
    this.variantPickerProduct = null;
  }

  /** Stock the dish's linked ledger item still holds. */
  public availableStock(product: Product | null): number {
    if (!product) return 0;
    const linked = Number(product.linked_stock_quantity);
    return Number.isFinite(linked) ? linked : Number(product.current_stock) || 0;
  }

  /** What the balance becomes if this portion is sold once. */
  public stockAfter(product: Product | null, variant: ProductVariant): number {
    return this.availableStock(product) - (Number(variant.stock_consumption) || 0);
  }

  private commitToCart(product: Product, variant: ProductVariant | null): void {
    const success = this.cartService.addItem(product, variant, 1);
    const label = variant ? `${product.name} (${variant.name})` : product.name;
    if (!success) {
      this.notify.error(`Cannot add "${label}" (Out of Stock / Inactive)`);
    } else {
      this.notify.info(`Added "${label}" to cart`);
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
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
            // Reported by the global error interceptor; present so a failure
            // cannot escape as an unhandled rejection.
            error: () => {},
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
      variantId: i.variant?.id ?? null,
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
    });
  }

  removeCartItem(item: CartItem): void {
    const label = item.variant?.name
      ? `${item.product.name} (${item.variant.name})`
      : item.product.name;

    this.notify.confirm({
      title: 'Remove Item',
      message: `Remove ${label} from the cart?`,
      confirmText: 'Remove',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.cartService.removeItem(item.lineId);
      },
    });
  }

  deleteDraft(id: number): void {
    this.notify.confirm({
      title: 'Delete Held Bill',
      message: 'Are you sure you want to permanently delete this held bill? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.draftBillService.deleteDraft(id).subscribe({
          next: () => {
            this.loadDraftCount();
            this.notify.info('Draft deleted');
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => {},
        });
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
        variantId: i.variant?.id ?? null,
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
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => {},
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


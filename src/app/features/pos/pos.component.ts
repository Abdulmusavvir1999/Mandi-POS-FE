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
import { OfflinePosService } from '../../core/services/offline-pos.service';
import { PrinterService } from '../../core/services/printer.service';
import { PosClosingService } from '../../core/services/pos-closing.service';
import {
  Product,
  ProductVariant,
  ProductAddon,
  ComboMeal,
  MealDeal,
  Category,
  Customer,
  CartItem,
  DiningTable,
  DraftBill,
  Order,
  OrderType,
  PaymentMethod,
  Bill,
  PosDayClosing,
  PrinterConfig,
} from '../../core/models';
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
            <!-- Online / Offline & Sync Indicator -->
            <button
              type="button"
              (click)="offlinePos.pendingOrders().length > 0 ? offlinePos.syncPendingOrders() : null"
              class="tool-btn"
              [ngClass]="offlinePos.isOnline() ? 'btn-status-online' : 'btn-status-offline'"
              [title]="offlinePos.isOnline() ? 'System is Online' : 'Offline Mode: Click to sync pending bills'"
            >
              <span class="status-dot-pulse" [class.is-offline]="!offlinePos.isOnline()"></span>
              <span class="font-bold text-xs">{{ offlinePos.isOnline() ? 'ONLINE' : 'OFFLINE' }}</span>
              <span *ngIf="offlinePos.pendingOrders().length > 0" class="draft-badge !bg-amber-500 !text-white">
                {{ offlinePos.pendingOrders().length }} sync
              </span>
            </button>

            <!-- Held Drafts -->
            <button
              (click)="openDraftsModal()"
              class="tool-btn btn-drafts"
              title="Held / Draft Bills (F4)"
            >
              <span class="material-symbols-outlined text-[18px]">drafts</span>
              <span>Drafts</span>
              <span *ngIf="draftCount > 0" class="draft-badge">{{ draftCount }}</span>
            </button>

            <!-- POS History / Ledger -->
            <button
              type="button"
              (click)="openHistoryModal()"
              class="tool-btn"
              title="Transaction History & Ledger"
            >
              <span class="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Ledger</span>
            </button>

            <!-- End-of-Day Shift Closing (Z-Report) -->
            <button
              type="button"
              (click)="openDayClosingModal()"
              class="tool-btn"
              title="End-of-Day Shift Closing & Z-Report"
            >
              <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>Z-Report</span>
            </button>

            <!-- Printer Routing Settings -->
            <button
              type="button"
              (click)="openPrintersModal()"
              class="tool-btn"
              title="Printer Routing & ESC/POS Settings"
            >
              <span class="material-symbols-outlined text-[18px]">print</span>
              <span>Printers</span>
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

        <!-- 2. CATALOG TYPE SELECTOR (MENU / COMBOS / DEALS) -->
        <div class="pos-section-block pb-1">
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="selectedCatalogTab = 'ALL'"
              class="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              [ngClass]="selectedCatalogTab === 'ALL' ? 'bg-[#ff6b00] text-white shadow-md shadow-orange-500/20' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
            >
              <span>🍽️</span>
              <span>Menu Dishes</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedCatalogTab === 'ALL' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'">{{ products.length }}</span>
            </button>

            <button
              type="button"
              (click)="selectedCatalogTab = 'COMBOS'"
              class="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              [ngClass]="selectedCatalogTab === 'COMBOS' ? 'bg-[#ff6b00] text-white shadow-md shadow-orange-500/20' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
            >
              <span>🍱</span>
              <span>Combo Meals</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedCatalogTab === 'COMBOS' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'">{{ combosList.length }}</span>
            </button>

            <button
              type="button"
              (click)="selectedCatalogTab = 'DEALS'"
              class="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              [ngClass]="selectedCatalogTab === 'DEALS' ? 'bg-[#ff6b00] text-white shadow-md shadow-orange-500/20' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'"
            >
              <span>🏷️</span>
              <span>Meal Deals</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px]" [ngClass]="selectedCatalogTab === 'DEALS' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'">{{ dealsList.length }}</span>
            </button>
          </div>
        </div>

        <!-- CATEGORIES HORIZONTAL CAROUSEL / CIRCLES -->
        <div class="pos-section-block" *ngIf="selectedCatalogTab === 'ALL'">
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
        <div class="pos-section-block" *ngIf="selectedCatalogTab === 'ALL'">
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
              <!-- Whether sold-out dishes are listed at all. They can never be
                   added to a bill either way; this only decides if the counter
                   has to look at them. -->
              <label
                class="oos-switch"
                [title]="showOutOfStock
                  ? 'Hide dishes that are out of stock'
                  : 'Show dishes that are out of stock'"
              >
                <input
                  type="checkbox"
                  [checked]="showOutOfStock"
                  (change)="onOutOfStockToggle($event)"
                />
                <span class="oos-track"><span class="oos-knob"></span></span>
                <span class="oos-text">
                  Out of stock
                  <strong>{{ showOutOfStock ? 'Yes' : 'No' }}</strong>
                  <span class="oos-hidden" *ngIf="!showOutOfStock && hiddenOutOfStockCount > 0">
                    · {{ hiddenOutOfStockCount }} hidden
                  </span>
                </span>
              </label>

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
            <!-- Without this the counter sees an empty grid and no reason for
                 it, when the switch above is the whole explanation. -->
            <button
              type="button"
              *ngIf="!showOutOfStock && hiddenOutOfStockCount > 0"
              class="empty-oos-hint"
              (click)="setShowOutOfStock(true)"
            >
              {{ hiddenOutOfStockCount }} out-of-stock
              {{ hiddenOutOfStockCount === 1 ? 'dish is' : 'dishes are' }} hidden — show
              {{ hiddenOutOfStockCount === 1 ? 'it' : 'them' }}
            </button>
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

        <!-- 3B. COMBO MEALS SECTION -->
        <div class="pos-section-block" *ngIf="selectedCatalogTab === 'COMBOS'">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Combo Meals</h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">{{ combosList.length }}</span> Value combos with bundled dishes and special savings
              </p>
            </div>
          </div>

          <div *ngIf="combosList.length === 0" class="empty-dishes-box">
            <span class="material-symbols-outlined text-5xl text-slate-300">lunch_dining</span>
            <p class="text-sm font-semibold text-slate-500 mt-2">No combo meals currently available.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="combosList.length > 0">
            <div
              *ngFor="let combo of combosList"
              class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      🍱 Combo Deal
                    </span>
                    <h3 class="text-base font-bold text-slate-900 mt-1">{{ combo.name }}</h3>
                  </div>
                  <div class="text-right font-mono">
                    <div class="text-lg font-black text-[#ff6b00]">{{ combo.combo_price | appCurrency:'1.0-0' }}</div>
                    <div *ngIf="combo.original_price && combo.original_price > combo.combo_price" class="text-xs text-slate-400 line-through">
                      {{ combo.original_price | appCurrency:'1.0-0' }}
                    </div>
                  </div>
                </div>

                <p class="text-xs text-slate-500 mb-3">{{ combo.description || 'Special multi-dish combo meal bundle' }}</p>

                <!-- Combo Items Pill List -->
                <div *ngIf="combo.items && combo.items.length > 0" class="bg-slate-50 rounded-xl p-2.5 mb-4 space-y-1">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Includes:</div>
                  <div *ngFor="let item of combo.items" class="text-xs text-slate-700 flex items-center justify-between">
                    <span>• {{ item.product_name || 'Dish' }}</span>
                    <span class="font-bold text-slate-500 font-mono text-[11px]">&times;{{ item.quantity }}</span>
                  </div>
                </div>

                <div *ngIf="combo.savings_amount && combo.savings_amount > 0" class="mb-3">
                  <span class="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    🎉 Save {{ combo.savings_amount | appCurrency:'1.0-0' }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                (click)="addComboToCart(combo)"
                class="w-full py-2.5 px-3 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Add Combo to Order</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 3C. MEAL DEALS SECTION -->
        <div class="pos-section-block" *ngIf="selectedCatalogTab === 'DEALS'">
          <div class="section-title-row">
            <div>
              <h2 class="section-heading">Meal Deals & Promotions</h2>
              <p class="section-subtext">
                <span class="accent-orange font-bold">{{ dealsList.length }}</span> Special promotional offers and time-limited deals
              </p>
            </div>
          </div>

          <div *ngIf="dealsList.length === 0" class="empty-dishes-box">
            <span class="material-symbols-outlined text-5xl text-slate-300">local_offer</span>
            <p class="text-sm font-semibold text-slate-500 mt-2">No active meal deals currently configured.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="dealsList.length > 0">
            <div
              *ngFor="let deal of dealsList"
              class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                      🏷️ {{ deal.discount_percentage ? deal.discount_percentage + '% OFF' : 'Special Offer' }}
                    </span>
                    <h3 class="text-base font-bold text-slate-900 mt-1">{{ deal.title }}</h3>
                  </div>
                  <div class="text-right font-mono">
                    <div class="text-lg font-black text-purple-700">{{ deal.deal_price | appCurrency:'1.0-0' }}</div>
                  </div>
                </div>

                <p class="text-xs text-slate-500 mb-3">{{ deal.description || 'Special limited-time promotional deal' }}</p>

                <!-- Deal Timing / Validity -->
                <div *ngIf="deal.start_date || deal.days_of_week" class="bg-purple-50/60 rounded-xl p-2.5 mb-4 text-xs text-purple-900 space-y-0.5">
                  <div *ngIf="deal.days_of_week" class="flex items-center gap-1 text-[11px]">
                    <span class="material-symbols-outlined text-xs">calendar_month</span>
                    <span>{{ deal.days_of_week }}</span>
                  </div>
                  <div *ngIf="deal.start_time && deal.end_time" class="flex items-center gap-1 text-[11px]">
                    <span class="material-symbols-outlined text-xs">schedule</span>
                    <span>{{ deal.start_time }} - {{ deal.end_time }}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                (click)="addDealToCart(deal)"
                class="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">local_offer</span>
                <span>Apply Deal to Order</span>
              </button>
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

        <!-- ORDER TYPE SEGMENTED SWITCHER (5 Order Types) -->
        <div class="order-type-segmented-bar !overflow-x-auto no-scrollbar flex items-center gap-1">
          <button
            type="button"
            (click)="openTableSelector()"
            class="seg-pill-btn whitespace-nowrap !text-[11px] !px-2.5"
            [class.is-active-seg]="cartService.orderType() === 'DINING'"
          >
            Dine In
          </button>
          <button
            type="button"
            (click)="setOrderType('TAKEAWAY')"
            class="seg-pill-btn whitespace-nowrap !text-[11px] !px-2.5"
            [class.is-active-seg]="cartService.orderType() === 'TAKEAWAY'"
          >
            Takeaway
          </button>
          <button
            type="button"
            (click)="setOrderType('WALK_IN')"
            class="seg-pill-btn whitespace-nowrap !text-[11px] !px-2.5"
            [class.is-active-seg]="cartService.orderType() === 'WALK_IN'"
          >
            Walk-in
          </button>
          <button
            type="button"
            (click)="setOrderType('PICKUP')"
            class="seg-pill-btn whitespace-nowrap !text-[11px] !px-2.5"
            [class.is-active-seg]="cartService.orderType() === 'PICKUP'"
          >
            Pickup
          </button>
          <button
            type="button"
            (click)="setOrderType('COUNTER')"
            class="seg-pill-btn whitespace-nowrap !text-[11px] !px-2.5"
            [class.is-active-seg]="cartService.orderType() === 'COUNTER'"
          >
            Counter
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
            [class.is-complimentary-row]="item.isComplimentary"
          >
            <div class="cart-item-avatar">
              <span class="item-emoji">{{ getProductEmoji(item.product.name, item.product.category_id) }}</span>
            </div>

            <div class="cart-item-details">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h4 class="item-name">
                  {{ item.product.name }}
                  <span *ngIf="item.variant" class="cart-variant-chip">{{ item.variant.name }}</span>
                </h4>
                <span *ngIf="item.itemType === 'COMBO'" class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">🍱 COMBO</span>
                <span *ngIf="item.itemType === 'DEAL'" class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">🏷️ DEAL</span>
                <span *ngIf="item.isComplimentary" class="complimentary-badge">
                  ★ FREE (COMP)
                </span>
              </div>

              <!-- Selected Add-ons Display -->
              <div *ngIf="item.selectedAddons && item.selectedAddons.length > 0" class="flex flex-wrap gap-1 mt-1 mb-0.5">
                <span *ngFor="let a of item.selectedAddons" class="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  + {{ a.name }} ({{ a.price | appCurrency:'1.0-0' }})
                </span>
              </div>

              <p class="item-sub-desc">
                <ng-container *ngIf="item.variant">
                  Uses {{ item.variant.stock_consumption }} per unit
                  <ng-container *ngIf="item.notes"> · <i>{{ item.notes }}</i></ng-container>
                </ng-container>
                <ng-container *ngIf="!item.variant">
                  {{ item.notes ? item.notes : (item.product.category_id === 1 ? 'Thin Crust' : 'Special Portion') }}
                </ng-container>
              </p>

              <div *ngIf="item.isComplimentary && item.complimentaryReason" class="text-[10px] text-emerald-300 font-semibold italic mt-0.5">
                Note: {{ item.complimentaryReason }}
              </div>

              <!-- Stepper Control & Quick Item Actions -->
              <div class="item-stepper-row flex items-center justify-between mt-1">
                <div class="flex items-center gap-1">
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

                <span class="font-mono text-xs font-bold text-white/90">
                  {{ (item.isComplimentary ? 0 : item.unitPrice * item.quantity) | appCurrency:'1.2-2' }}
                </span>

                <!-- Complimentary & Item Note Buttons -->
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="openItemNoteModal(item)"
                    class="item-action-icon-btn"
                    [class.is-active]="!!item.notes"
                    title="Add or Edit Kitchen Note"
                  >
                    <span class="material-symbols-outlined text-[13px]">edit_note</span>
                  </button>
                  <button
                    type="button"
                    (click)="item.isComplimentary ? removeComplimentary(item) : openComplimentaryModal(item)"
                    class="item-action-icon-btn"
                    [class.is-active]="item.isComplimentary"
                    [title]="item.isComplimentary ? 'Revoke Complimentary' : 'Mark Complimentary (Free)'"
                  >
                    <span class="material-symbols-outlined text-[13px]">{{ item.isComplimentary ? 'star' : 'redeem' }}</span>
                  </button>
                </div>
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
            placeholder="Coupon (e.g. SAVE50, WELCOME10)"
            class="promo-input"
          />
          <button
            type="button"
            (click)="applyPromoCode()"
            class="promo-apply-btn"
          >
            {{ isPromoApplied ? 'APPLIED ✓' : 'APPLY' }}
          </button>
        </div>

        <!-- SERVICE CHARGE & SURCHARGE CONTROLS -->
        <div class="cart-billing-addons font-mono">
          <div class="billing-addon-row">
            <span class="text-[11px] text-white/70">Service Charge:</span>
            <div class="flex items-center gap-1">
              <button
                *ngFor="let rate of [0, 5, 10]"
                type="button"
                (click)="cartService.setServiceChargeRate(rate)"
                class="billing-chip-btn"
                [class.is-selected]="cartService.serviceChargeRate() === rate"
              >
                {{ rate }}%
              </button>
            </div>
          </div>
          <div class="billing-addon-row mt-1">
            <span class="text-[11px] text-white/70">Packaging / Surcharge:</span>
            <div class="flex items-center gap-1">
              <button
                *ngFor="let sur of [0, 20, 50]"
                type="button"
                (click)="cartService.setSurcharge(sur)"
                class="billing-chip-btn"
                [class.is-selected]="cartService.surchargeAmount() === sur"
              >
                {{ sur === 0 ? '₹0' : '₹' + sur }}
              </button>
            </div>
          </div>
        </div>

        <!-- TOTALS BREAKDOWN -->
        <div class="cart-totals-section font-mono">
          <div class="totals-row">
            <span class="totals-label">Sub Total</span>
            <span class="totals-value">{{ cartService.subtotal() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row" *ngIf="cartService.discountAmount() > 0">
            <span class="totals-label text-amber-200">
              Discount <span *ngIf="cartService.couponCode()">({{ cartService.couponCode() }})</span>
            </span>
            <span class="totals-value text-amber-200">- {{ cartService.discountAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row" *ngIf="cartService.serviceChargeAmount() > 0">
            <span class="totals-label text-purple-200">Service Charge ({{ cartService.serviceChargeRate() }}%)</span>
            <span class="totals-value text-purple-200">+ {{ cartService.serviceChargeAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row" *ngIf="cartService.surchargeAmount() > 0">
            <span class="totals-label text-teal-200">Surcharge / Packaging</span>
            <span class="totals-value text-teal-200">+ {{ cartService.surchargeAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row">
            <span class="totals-label">Tax (GST)</span>
            <span class="totals-value">{{ cartService.taxAmount() | appCurrency:'1.2-2' }}</span>
          </div>

          <div class="totals-row grand-total-row">
            <span class="grand-label">TOTAL</span>
            <span class="grand-value">{{ cartService.grandTotal() | appCurrency:'1.2-2' }}</span>
          </div>
        </div>

        <!-- ORDER ACTIONS BOTTOM (Hold Bill + Confirm Order) -->
        <div class="cart-actions-bottom flex items-center gap-2">
          <button
            type="button"
            (click)="holdCurrentBill()"
            [disabled]="cartService.items().length === 0"
            class="py-3 px-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            title="Hold Current Order as Draft (F4)"
          >
            <span class="material-symbols-outlined text-[18px]">pause_circle</span>
            <span>Hold</span>
          </button>

          <button
            type="button"
            (click)="openPaymentModal()"
            [disabled]="cartService.items().length === 0"
            class="confirm-order-btn flex-1"
          >
            <span class="material-symbols-outlined text-[20px]">point_of_sale</span>
            <span>Confirm & Pay (F8)</span>
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
          <!-- Payment Methods Selector (5 Methods) -->
          <div>
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">Payment Mode</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                type="button"
                *ngFor="let method of ['CASH', 'UPI', 'CARD', 'ONLINE', 'OTHER']"
                (click)="selectedPaymentMethod = method"
                class="py-2.5 px-2 rounded-xl font-bold transition-all text-xs border text-center"
                [ngClass]="selectedPaymentMethod === method ? 'bg-[#7E22CE] text-white border-transparent shadow-sm' : 'bg-[#FAF5FF] text-[#2E1065] border-[#E9D5FF] hover:bg-[#F3E8FF]'"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Cash Tendered & Quick Change Counter -->
          <div *ngIf="selectedPaymentMethod === 'CASH'" class="space-y-3 p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF]">
            <div>
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">Cash Tendered (₹)</label>
              <input
                title="Amount Tendered"
                type="number"
                [(ngModel)]="tenderedAmount"
                (ngModelChange)="calcChange()"
                class="form-control text-xl font-mono font-bold text-emerald-700 w-full"
              />
            </div>

            <!-- Quick Cash Denominations -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                *ngFor="let amt of [cartService.grandTotal(), 100, 200, 500, 2000]"
                (click)="setTendered(amt)"
                class="flex-1 min-w-[55px] py-1.5 text-xs font-mono font-bold rounded-lg bg-white border border-[#DDD6FE] text-[#6B21A8] hover:bg-[#F3E8FF] text-center"
              >
                {{ amt | appCurrency:'1.0-0' }}
              </button>
            </div>

            <!-- Change Return -->
            <div class="flex items-center justify-between pt-2 border-t border-[#E9D5FF]">
              <span class="text-xs font-bold text-[#6B7280]">Change to Return:</span>
              <span class="text-lg font-black font-mono text-emerald-700">
                {{ changeDue | appCurrency:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- UPI QR Code & Reference -->
          <div *ngIf="selectedPaymentMethod === 'UPI'" class="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-purple-900">UPI Digital Payment</span>
                <p class="text-[11px] text-gray-500 font-mono mt-0.5">VPA: {{ upiVpa }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                Dynamic QR
              </span>
            </div>
            <div>
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">UPI UTR / Ref Number (Optional)</label>
              <input
                title="UPI Reference"
                type="text"
                [(ngModel)]="paymentReference"
                placeholder="12-digit UPI UTR / RRN"
                class="form-control text-sm w-full font-mono"
              />
            </div>
          </div>

          <!-- Online Channel Selection (Swiggy, Zomato, Direct) -->
          <div *ngIf="selectedPaymentMethod === 'ONLINE'" class="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-3">
            <div>
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">Online Delivery / Aggregator Channel</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  *ngFor="let prov of ['Swiggy', 'Zomato', 'Direct Website', 'PhonePe', 'GPay', 'Other']"
                  (click)="onlineProvider = prov"
                  class="py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition-all"
                  [ngClass]="onlineProvider === prov ? 'bg-[#7E22CE] text-white border-transparent' : 'bg-white text-gray-700 border-[#DDD6FE] hover:bg-[#F3E8FF]'"
                >
                  {{ prov }}
                </button>
              </div>
            </div>
            <div>
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">Online Order / Transaction ID</label>
              <input
                title="Online Order ID"
                type="text"
                [(ngModel)]="paymentReference"
                [placeholder]="'Order ID from ' + onlineProvider"
                class="form-control text-sm w-full font-mono"
              />
            </div>
          </div>

          <!-- Card / Other Reference -->
          <div *ngIf="selectedPaymentMethod === 'CARD' || selectedPaymentMethod === 'OTHER'" class="form-group mb-0">
            <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">
              {{ selectedPaymentMethod === 'CARD' ? 'Card Last 4 Digits / Auth Approval Code' : 'Transaction Reference # (Optional)' }}
            </label>
            <input
              title="Transaction Reference"
              type="text"
              [(ngModel)]="paymentReference"
              placeholder="e.g. Card Auth 4892"
              class="form-control text-sm w-full font-mono"
            />
          </div>

          <!-- Print Routing Checkboxes & Offline Mode Notice -->
          <div class="pt-2 border-t border-[#E9D5FF] flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-4 text-xs font-bold text-[#4B5563]">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="autoPrintReceipt" class="accent-[#7E22CE] rounded" />
                <span>Print Receipt (Thermal)</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="autoPrintKot" class="accent-[#7E22CE] rounded" />
                <span>Print Kitchen KOT</span>
              </label>
            </div>

            <div *ngIf="!offlinePos.isOnline()" class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">cloud_off</span>
              <span>Offline Mode Active</span>
            </div>
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
            <span class="material-symbols-outlined text-[18px]">
              {{ offlinePos.isOnline() ? 'receipt_long' : 'save_alt' }}
            </span>
            <span *ngIf="isCheckingOut">Processing Payment...</span>
            <span *ngIf="!isCheckingOut">
              {{ offlinePos.isOnline() ? 'Complete & Print Bill ✓' : 'Save Offline & Print Bill ⚡' }}
            </span>
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
    <!-- 5. DISH CUSTOMIZATION & PORTION MODAL                           -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="customizationProduct">
      <div class="modal-content p-6 max-w-lg w-full">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white text-2xl shadow-sm">
              {{ getProductEmoji(customizationProduct.name, customizationProduct.category_id) }}
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-900 leading-tight">{{ customizationProduct.name }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">Customize portion, extras & kitchen instructions</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeCustomizationModal()"
            class="modal-close-btn"
            title="Close"
            aria-label="Close"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
          <!-- Portions / Variants (if any) -->
          <div *ngIf="customizationVariants.length > 0">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">straighten</span>
              <span>Select Portion / Variant</span>
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <div
                *ngFor="let v of customizationVariants"
                (click)="selectedCustomizationVariant = v"
                class="p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between"
                [ngClass]="selectedCustomizationVariant?.id === v.id ? 'border-[#ff6b00] bg-orange-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm text-slate-800">{{ v.name }}</span>
                  <span class="w-4 h-4 rounded-full border flex items-center justify-center"
                    [ngClass]="selectedCustomizationVariant?.id === v.id ? 'border-[#ff6b00] bg-[#ff6b00]' : 'border-slate-300'">
                    <span *ngIf="selectedCustomizationVariant?.id === v.id" class="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </span>
                </div>
                <div class="mt-2 flex items-baseline justify-between">
                  <span class="text-xs text-slate-400 font-mono">Stock: {{ stockAfter(customizationProduct, v) | number:'1.0-0' }}</span>
                  <span class="font-bold font-mono text-sm text-slate-900">{{ v.selling_price | appCurrency:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Add-ons & Toppings Selection (if any) -->
          <div *ngIf="getApplicableAddons(customizationProduct).length > 0">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">add_circle</span>
              <span>Add-ons & Extras</span>
            </h4>
            <div class="space-y-2">
              <div
                *ngFor="let addon of getApplicableAddons(customizationProduct)"
                (click)="toggleAddonSelection(addon)"
                class="p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between"
                [ngClass]="isAddonSelected(addon.id) ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'"
              >
                <div class="flex items-center gap-2.5">
                  <span class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                    [ngClass]="isAddonSelected(addon.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'">
                    <span *ngIf="isAddonSelected(addon.id)" class="material-symbols-outlined text-xs">check</span>
                  </span>
                  <div>
                    <div class="text-sm font-bold text-slate-800">{{ addon.name }}</div>
                    <div *ngIf="addon.description" class="text-xs text-slate-400">{{ addon.description }}</div>
                  </div>
                </div>
                <span class="text-xs font-bold font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  + {{ addon.price | appCurrency:'1.0-0' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Special Kitchen Instructions -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">edit_note</span>
              <span>Kitchen Notes (Optional)</span>
            </h4>
            <input
              type="text"
              [(ngModel)]="customizationNotes"
              placeholder="e.g. Less spicy, crispy, no onions..."
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#ff6b00]"
            />
          </div>
        </div>

        <!-- Footer with live calculation & confirm -->
        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-[11px] uppercase tracking-wider font-bold text-slate-400">Total Price</div>
            <div class="text-2xl font-black font-mono text-slate-900">
              {{ getCustomizationTotalPrice() | appCurrency:'1.2-2' }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="closeCustomizationModal()"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmCustomization()"
              class="px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
              <span>Add to Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. THERMAL RECEIPT PRINT MODAL -->
    <app-receipt-modal
      [isOpen]="showReceiptModal"
      [printData]="lastReceiptData"
      (close)="showReceiptModal = false"
    ></app-receipt-modal>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 7. TRANSACTION HISTORY & AUDIT LEDGER MODAL                     -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showHistoryModal">
      <div class="modal-content p-6 md:p-8 w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF] flex-shrink-0">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge is-teal">
              <span class="material-symbols-outlined text-2xl">receipt_long</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">POS Transaction History & Ledger</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Lookup settled bills, reprint thermal receipts & KOTs, void or duplicate orders</p>
            </div>
          </div>
          <button (click)="showHistoryModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Filter / Search Toolbar -->
        <div class="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
            <input
              type="text"
              [(ngModel)]="historySearch"
              placeholder="Search by Bill # or Customer Name..."
              class="form-control pl-9 text-xs w-full"
            />
          </div>
          <div class="flex items-center gap-1.5">
            <button
              *ngFor="let st of ['ALL', 'PAID', 'VOIDED', 'REOPENED']"
              type="button"
              (click)="historyStatusFilter = st"
              class="py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors"
              [ngClass]="historyStatusFilter === st ? 'bg-[#7E22CE] text-white border-transparent' : 'bg-white text-gray-700 border-[#DDD6FE] hover:bg-[#F3E8FF]'"
            >
              {{ st }}
            </button>
          </div>
          <button (click)="loadHistoryBills()" class="action-btn btn-outline-purple !py-1.5 !px-3 text-xs flex items-center gap-1" title="Refresh list">
            <span class="material-symbols-outlined text-[15px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        <!-- Bills Ledger Table -->
        <div class="flex-1 overflow-y-auto border border-[#E9D5FF] rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#FAF5FF] border-b border-[#E9D5FF] text-[#2E1065] uppercase text-[10px] font-black sticky top-0 z-10">
              <tr>
                <th class="p-3">Bill #</th>
                <th class="p-3">Date / Time</th>
                <th class="p-3">Type</th>
                <th class="p-3">Payment</th>
                <th class="p-3 text-right">Total (₹)</th>
                <th class="p-3 text-center">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E9D5FF] font-medium">
              <tr *ngIf="filterHistoryBills().length === 0">
                <td colspan="7" class="p-8 text-center text-gray-400">
                  <span class="material-symbols-outlined text-3xl block mb-1">receipt</span>
                  No transactions found matching criteria.
                </td>
              </tr>
              <tr *ngFor="let bill of filterHistoryBills()" class="hover:bg-purple-50/40 transition-colors">
                <td class="p-3 font-mono font-bold text-[#6B21A8]">
                  #{{ bill.bill_number }}
                  <div *ngIf="bill.offline_sync_id" class="text-[9px] font-mono text-amber-600">
                    ⚡ Offline Sync
                  </div>
                </td>
                <td class="p-3 text-gray-600">
                  {{ bill.created_at | date:'shortTime' }}
                  <span class="text-[10px] text-gray-400 block">{{ bill.created_at | date:'dd MMM yyyy' }}</span>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-[#6B21A8]">
                    {{ bill.order_type || 'WALK_IN' }}
                  </span>
                </td>
                <td class="p-3">
                  <span class="font-bold text-gray-700">{{ bill.payment_method }}</span>
                  <div *ngIf="bill.payment_reference" class="text-[10px] font-mono text-gray-400 truncate max-w-[100px]">
                    {{ bill.payment_reference }}
                  </div>
                </td>
                <td class="p-3 text-right font-mono font-extrabold text-[#2E1065]">
                  {{ bill.total_amount | appCurrency:'1.2-2' }}
                </td>
                <td class="p-3 text-center">
                  <span
                    *ngIf="bill.is_voided"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700"
                    [title]="'Voided: ' + (bill.void_reason || 'N/A')"
                  >
                    VOIDED
                  </span>
                  <span
                    *ngIf="!bill.is_voided && bill.is_reopened"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"
                  >
                    REOPENED
                  </span>
                  <span
                    *ngIf="!bill.is_voided && !bill.is_reopened"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"
                  >
                    PAID
                  </span>
                </td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Print Thermal Receipt -->
                    <button
                      type="button"
                      (click)="printReceiptFromHistory(bill)"
                      class="p-1 rounded hover:bg-purple-100 text-purple-700"
                      title="Print 80mm Thermal Receipt"
                    >
                      <span class="material-symbols-outlined text-[16px]">receipt</span>
                    </button>
                    <!-- Print Kitchen KOT -->
                    <button
                      type="button"
                      (click)="printKotFromHistory(bill)"
                      class="p-1 rounded hover:bg-teal-100 text-teal-700"
                      title="Print Kitchen Order Ticket (KOT)"
                    >
                      <span class="material-symbols-outlined text-[16px]">soup_kitchen</span>
                    </button>
                    <!-- Duplicate Order to Cart -->
                    <button
                      type="button"
                      (click)="duplicateBill(bill)"
                      class="p-1 rounded hover:bg-blue-100 text-blue-700"
                      title="Duplicate Items to Current Cart"
                    >
                      <span class="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <!-- Reopen Bill -->
                    <button
                      *ngIf="!bill.is_voided"
                      type="button"
                      (click)="reopenBill(bill)"
                      class="p-1 rounded hover:bg-amber-100 text-amber-700"
                      title="Reopen Order for Edits"
                    >
                      <span class="material-symbols-outlined text-[16px]">lock_open</span>
                    </button>
                    <!-- Void Bill -->
                    <button
                      *ngIf="!bill.is_voided"
                      type="button"
                      (click)="promptVoidBill(bill)"
                      class="p-1 rounded hover:bg-rose-100 text-rose-700"
                      title="Void Bill (Restock & Audit)"
                    >
                      <span class="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 8. VOID BILL CONFIRMATION MODAL                                 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showVoidModal && selectedBillForVoid">
      <div class="modal-content p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-rose-200">
          <div class="flex items-center gap-3">
            <span class="modal-icon-badge !bg-rose-100 !text-rose-700">
              <span class="material-symbols-outlined text-2xl">warning</span>
            </span>
            <div>
              <h3 class="text-lg font-black text-rose-900 leading-tight">Void Bill #{{ selectedBillForVoid.bill_number }}</h3>
              <p class="text-xs text-rose-600 mt-0.5">Amount: {{ selectedBillForVoid.total_amount | appCurrency:'1.2-2' }}</p>
            </div>
          </div>
          <button (click)="showVoidModal = false" class="modal-close-btn" title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-xs text-rose-800 leading-relaxed">
          <strong>Restock & Audit Notice:</strong> Voiding will cancel this order, immediately return all consumed dish stock to the inventory ledger, and record an audit entry with your cashier credentials.
        </div>

        <div class="space-y-3">
          <div>
            <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Mandatory Void Reason</label>
            <select [(ngModel)]="voidReason" class="form-control text-xs w-full">
              <option value="Customer cancelled order">Customer cancelled order</option>
              <option value="Wrong punch / cashier error">Wrong punch / cashier error</option>
              <option value="Food quality issue / return">Food quality issue / return</option>
              <option value="Payment failed / unconfirmed">Payment failed / unconfirmed</option>
              <option value="Duplicate bill punch">Duplicate bill punch</option>
              <option value="Other">Other reason (explain below)</option>
            </select>
          </div>
          <div>
            <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Additional Notes (Optional)</label>
            <textarea
              [(ngModel)]="voidNotes"
              rows="2"
              placeholder="Provide context for the store manager..."
              class="form-control text-xs w-full"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-gray-200">
          <button (click)="showVoidModal = false" class="action-btn btn-outline-purple">
            Dismiss
          </button>
          <button
            (click)="submitVoid()"
            [disabled]="isVoiding"
            class="py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[16px]">cancel</span>
            <span>{{ isVoiding ? 'Voiding & Restocking...' : 'Confirm Void Order' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 9. END-OF-DAY SHIFT CLOSING (Z-REPORT) MODAL                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showClosingModal">
      <div class="modal-content p-6 md:p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF] flex-shrink-0">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">End-of-Day Shift Closing (Z-Report)</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Shift reconciliation, payment breakdown, and cash drawer balance verification</p>
            </div>
          </div>
          <button (click)="showClosingModal = false" class="modal-close-btn" title="Close" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Shift View Tabs -->
        <div class="flex items-center gap-2 mb-4 flex-shrink-0">
          <button
            type="button"
            (click)="closingTab = 'current'"
            class="py-1.5 px-4 rounded-xl font-bold text-xs border transition-colors"
            [ngClass]="closingTab === 'current' ? 'bg-[#7E22CE] text-white border-transparent' : 'bg-white text-gray-700 border-[#DDD6FE] hover:bg-[#F3E8FF]'"
          >
            Current Shift Reconciliation
          </button>
          <button
            type="button"
            (click)="closingTab = 'history'; loadPastClosings()"
            class="py-1.5 px-4 rounded-xl font-bold text-xs border transition-colors"
            [ngClass]="closingTab === 'history' ? 'bg-[#7E22CE] text-white border-transparent' : 'bg-white text-gray-700 border-[#DDD6FE] hover:bg-[#F3E8FF]'"
          >
            Past Z-Report Records
          </button>
        </div>

        <!-- Tab 1: Current Shift Reconciliation -->
        <div *ngIf="closingTab === 'current'" class="flex-1 overflow-y-auto space-y-4 pr-1">
          <!-- Live Shift Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span class="text-[10px] uppercase font-bold text-purple-700">Total Orders</span>
              <div class="text-xl font-black text-purple-900 font-mono mt-0.5">
                {{ shiftSummary?.totalOrders || 0 }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <span class="text-[10px] uppercase font-bold text-teal-700">Net Sales</span>
              <div class="text-xl font-black text-teal-900 font-mono mt-0.5">
                {{ shiftSummary?.netSales || 0 | appCurrency:'1.0-0' }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span class="text-[10px] uppercase font-bold text-blue-700">Discounts</span>
              <div class="text-xl font-black text-blue-900 font-mono mt-0.5">
                {{ shiftSummary?.totalDiscount || 0 | appCurrency:'1.0-0' }}
              </div>
            </div>
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span class="text-[10px] uppercase font-bold text-emerald-700">GST / Tax</span>
              <div class="text-xl font-black text-emerald-900 font-mono mt-0.5">
                {{ shiftSummary?.totalTax || 0 | appCurrency:'1.0-0' }}
              </div>
            </div>
          </div>

          <!-- Payment Breakdown -->
          <div class="p-4 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF]">
            <h4 class="text-xs font-black uppercase text-[#2E1065] tracking-wider mb-2.5">Payment Method Breakdown</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div class="p-2 rounded-lg bg-white border border-[#DDD6FE]">
                <span class="text-gray-500 text-[10px] block">CASH SALES</span>
                <strong class="text-emerald-700 text-sm font-bold">{{ shiftSummary?.cashSales || 0 | appCurrency:'1.2-2' }}</strong>
              </div>
              <div class="p-2 rounded-lg bg-white border border-[#DDD6FE]">
                <span class="text-gray-500 text-[10px] block">UPI SALES</span>
                <strong class="text-purple-700 text-sm font-bold">{{ shiftSummary?.upiSales || 0 | appCurrency:'1.2-2' }}</strong>
              </div>
              <div class="p-2 rounded-lg bg-white border border-[#DDD6FE]">
                <span class="text-gray-500 text-[10px] block">CARD SALES</span>
                <strong class="text-blue-700 text-sm font-bold">{{ shiftSummary?.cardSales || 0 | appCurrency:'1.2-2' }}</strong>
              </div>
              <div class="p-2 rounded-lg bg-white border border-[#DDD6FE]">
                <span class="text-gray-500 text-[10px] block">ONLINE / OTHER</span>
                <strong class="text-amber-700 text-sm font-bold">{{ (shiftSummary?.onlineSales || 0) + (shiftSummary?.otherSales || 0) | appCurrency:'1.2-2' }}</strong>
              </div>
            </div>
          </div>

          <!-- Cash Drawer Reconciliation -->
          <div class="p-4 rounded-xl bg-white border-2 border-[#E9D5FF] space-y-3">
            <h4 class="text-xs font-black uppercase text-[#2E1065] tracking-wider">Cash Drawer Reconciliation</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Opening Float Cash (₹)</label>
                <input
                  type="number"
                  [(ngModel)]="openingCash"
                  class="form-control text-sm font-mono font-bold w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Expected Drawer Cash (₹)</label>
                <div class="form-control text-sm font-mono font-black bg-gray-50 text-gray-800 flex items-center">
                  {{ calcExpectedCash() | appCurrency:'1.2-2' }}
                </div>
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Actual Counted Cash (₹)</label>
                <input
                  type="number"
                  [(ngModel)]="actualCash"
                  class="form-control text-sm font-mono font-black text-emerald-700 w-full"
                  placeholder="Counted cash"
                />
              </div>
            </div>

            <!-- Cash Variance Alert -->
            <div class="pt-2 flex items-center justify-between border-t border-gray-100">
              <span class="text-xs font-bold text-gray-600">Drawer Cash Variance:</span>
              <span
                class="text-sm font-mono font-black px-2.5 py-1 rounded-lg"
                [ngClass]="calcCashVariance() >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                {{ calcCashVariance() >= 0 ? '+ ' : '' }}{{ calcCashVariance() | appCurrency:'1.2-2' }}
                ({{ calcCashVariance() === 0 ? 'Exact Match' : (calcCashVariance() > 0 ? 'Surplus' : 'Shortage') }})
              </span>
            </div>
          </div>

          <!-- Closing Notes -->
          <div>
            <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Shift Closing Remarks / Handover Notes</label>
            <textarea
              [(ngModel)]="closingNotes"
              rows="2"
              placeholder="e.g. Handed over to night cashier, ₹2000 kept as float for tomorrow..."
              class="form-control text-xs w-full"
            ></textarea>
          </div>
        </div>

        <!-- Tab 2: Past Z-Reports -->
        <div *ngIf="closingTab === 'history'" class="flex-1 overflow-y-auto border border-[#E9D5FF] rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-[#FAF5FF] border-b border-[#E9D5FF] text-[#2E1065] uppercase text-[10px] font-black sticky top-0">
              <tr>
                <th class="p-3">Shift Date / ID</th>
                <th class="p-3">Orders</th>
                <th class="p-3 text-right">Net Sales</th>
                <th class="p-3 text-right">Expected Cash</th>
                <th class="p-3 text-right">Actual Cash</th>
                <th class="p-3 text-center">Variance</th>
                <th class="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E9D5FF] font-medium">
              <tr *ngIf="pastClosings.length === 0">
                <td colspan="7" class="p-8 text-center text-gray-400">No past shift closings found.</td>
              </tr>
              <tr *ngFor="let row of pastClosings" class="hover:bg-purple-50/40">
                <td class="p-3">
                  <span class="font-bold text-[#6B21A8]">#SHIFT-{{ row.id }}</span>
                  <div class="text-[10px] text-gray-400">{{ row.closing_date | date:'dd MMM yyyy HH:mm' }}</div>
                </td>
                <td class="p-3 font-mono font-bold">{{ row.total_orders }}</td>
                <td class="p-3 text-right font-mono font-bold">{{ row.net_sales | appCurrency:'1.2-2' }}</td>
                <td class="p-3 text-right font-mono text-gray-600">{{ row.expected_cash | appCurrency:'1.2-2' }}</td>
                <td class="p-3 text-right font-mono font-bold text-emerald-700">{{ row.actual_cash | appCurrency:'1.2-2' }}</td>
                <td class="p-3 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono"
                    [ngClass]="row.cash_difference >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ row.cash_difference | appCurrency:'1.2-2' }}
                  </span>
                </td>
                <td class="p-3 text-right">
                  <button
                    type="button"
                    (click)="printPastClosing(row)"
                    class="action-btn btn-outline-purple !py-1 !px-2.5 text-xs flex items-center gap-1"
                    title="Reprint Z-Report"
                  >
                    <span class="material-symbols-outlined text-[14px]">print</span>
                    <span>Print</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Action Bar -->
        <div class="flex items-center justify-end gap-3 pt-4 mt-3 border-t border-[#E9D5FF] flex-shrink-0">
          <button (click)="showClosingModal = false" class="action-btn btn-outline-purple">
            Close
          </button>
          <button
            *ngIf="closingTab === 'current'"
            (click)="submitDayClosing()"
            [disabled]="isSavingClosing"
            class="action-btn btn-gradient-purple flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">receipt</span>
            <span>{{ isSavingClosing ? 'Saving Shift...' : 'Close Shift & Print Z-Report ✓' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 10. PRINTER ROUTING CONFIGURATION MODAL                         -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showPrintersModal">
      <div class="modal-content p-6 md:p-8 w-full max-w-xl shadow-2xl">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-3.5">
            <span class="modal-icon-badge is-teal">
              <span class="material-symbols-outlined text-2xl">print</span>
            </span>
            <div>
              <h3 class="text-xl font-black text-[#2E1065] leading-tight">Printer Routing & Hardware</h3>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Configure 80mm/58mm thermal cashier receipt & Kitchen KOT printers</p>
            </div>
          </div>
          <button (click)="showPrintersModal = false" class="modal-close-btn" title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Cashier Receipt Printer -->
          <div class="p-4 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#7E22CE]">receipt_long</span>
                <span class="text-sm font-bold text-[#2E1065]">Cashier Receipt Printer</span>
              </div>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-purple-900">
                <input type="checkbox" [(ngModel)]="printerSettings.receiptPrinter.enabled" class="accent-[#7E22CE]" />
                <span>Enabled</span>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label class="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Paper Width</label>
                <select [(ngModel)]="printerSettings.receiptPrinter.paperWidth" class="form-control text-xs w-full">
                  <option value="80mm">80mm Standard Thermal</option>
                  <option value="58mm">58mm Compact Thermal</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Auto-Print</label>
                <label class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 mt-2">
                  <input type="checkbox" [(ngModel)]="printerSettings.receiptPrinter.autoPrintOnCheckout" class="accent-[#7E22CE]" />
                  <span>On checkout complete</span>
                </label>
              </div>
            </div>
            <div class="pt-2 flex justify-end">
              <button (click)="testPrintReceipt()" class="action-btn btn-outline-purple !py-1 !px-2.5 text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">print</span>
                <span>Test Print Receipt</span>
              </button>
            </div>
          </div>

          <!-- Kitchen KOT Printer -->
          <div class="p-4 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-teal-700">soup_kitchen</span>
                <span class="text-sm font-bold text-[#2E1065]">Kitchen Order Ticket (KOT) Printer</span>
              </div>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-teal-900">
                <input type="checkbox" [(ngModel)]="printerSettings.kitchenPrinter.enabled" class="accent-teal-700" />
                <span>Enabled</span>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label class="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Paper Width</label>
                <select [(ngModel)]="printerSettings.kitchenPrinter.paperWidth" class="form-control text-xs w-full">
                  <option value="80mm">80mm Standard Thermal</option>
                  <option value="58mm">58mm Compact Thermal</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Auto-Print KOT</label>
                <label class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 mt-2">
                  <input type="checkbox" [(ngModel)]="printerSettings.kitchenPrinter.autoPrintKot" class="accent-teal-700" />
                  <span>On order confirm</span>
                </label>
              </div>
            </div>
            <div class="pt-2 flex justify-end">
              <button (click)="testPrintKot()" class="action-btn btn-outline-purple !py-1 !px-2.5 text-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">print</span>
                <span>Test Print KOT</span>
              </button>
            </div>
          </div>

          <!-- Bar Beverage Printer -->
          <div class="p-4 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-700">local_bar</span>
                <span class="text-sm font-bold text-[#2E1065]">Bar & Beverage Printer</span>
              </div>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-900">
                <input type="checkbox" [(ngModel)]="printerSettings.barPrinter.enabled" class="accent-amber-700" />
                <span>Enabled</span>
              </label>
            </div>
            <p class="text-[11px] text-gray-500">Route drinks and beverage items to the bar terminal printer automatically.</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[#E9D5FF]">
          <button (click)="showPrintersModal = false" class="action-btn btn-outline-purple">
            Close
          </button>
          <button (click)="savePrinterSettings()" class="action-btn btn-gradient-purple">
            Save Preferences ✓
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 11. COMPLIMENTARY ITEM MODAL                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showComplimentaryModal && activeEditingItem">
      <div class="modal-content p-6 max-w-sm w-full shadow-2xl">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-2.5">
            <span class="modal-icon-badge !bg-amber-100 !text-amber-800">
              <span class="material-symbols-outlined">redeem</span>
            </span>
            <div>
              <h3 class="text-base font-black text-[#2E1065]">Mark Complimentary</h3>
              <p class="text-[11px] text-gray-500">{{ activeEditingItem.product.name }}</p>
            </div>
          </div>
          <button (click)="showComplimentaryModal = false" class="modal-close-btn" title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-3">
          <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
            This item's billing price will be reduced to ₹0.00 (100% Free) with an audit reason.
          </div>
          <div>
            <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Authorization Reason</label>
            <select [(ngModel)]="complimentaryReasonInput" class="form-control text-xs w-full">
              <option value="Staff Authorized Courtesy">Staff Authorized Courtesy</option>
              <option value="Manager / VIP Guest">Manager / VIP Guest</option>
              <option value="Food Quality Issue Replacement">Food Quality Issue Replacement</option>
              <option value="Chef Tasting Special">Chef Tasting Special</option>
              <option value="Delayed Order Apology">Delayed Order Apology</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-4 mt-3 border-t border-gray-100">
          <button (click)="showComplimentaryModal = false" class="action-btn btn-outline-purple">
            Cancel
          </button>
          <button (click)="saveComplimentary()" class="action-btn btn-gradient-purple">
            Apply 100% Free ✓
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- 12. ITEM COOKING NOTES MODAL                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showItemNoteModal && activeEditingItem">
      <div class="modal-content p-6 max-w-sm w-full shadow-2xl">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#E9D5FF]">
          <div class="flex items-center gap-2.5">
            <span class="modal-icon-badge">
              <span class="material-symbols-outlined">edit_note</span>
            </span>
            <div>
              <h3 class="text-base font-black text-[#2E1065]">Kitchen Cooking Note</h3>
              <p class="text-[11px] text-gray-500">{{ activeEditingItem.product.name }}</p>
            </div>
          </div>
          <button (click)="showItemNoteModal = false" class="modal-close-btn" title="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="space-y-3">
          <!-- Quick Preset Chips -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              *ngFor="let chip of ['Less Spicy', 'Extra Crispy', 'No Onion/Garlic', 'Less Oil', 'Pack Separately', 'Serve Hot']"
              type="button"
              (click)="itemNoteInput = itemNoteInput ? itemNoteInput + ', ' + chip : chip"
              class="px-2 py-1 rounded-md text-[10px] font-bold bg-[#FAF5FF] border border-[#DDD6FE] text-[#6B21A8] hover:bg-[#F3E8FF]"
            >
              + {{ chip }}
            </button>
          </div>

          <div>
            <label class="form-label text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Custom Instructions</label>
            <textarea
              [(ngModel)]="itemNoteInput"
              rows="2"
              placeholder="e.g. Mild spice, extra mayonnaise..."
              class="form-control text-xs w-full"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-4 mt-3 border-t border-gray-100">
          <button (click)="showItemNoteModal = false" class="action-btn btn-outline-purple">
            Cancel
          </button>
          <button (click)="saveItemNote()" class="action-btn btn-gradient-purple">
            Save Note ✓
          </button>
        </div>
      </div>
    </div>
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

    /* Out-of-stock switch. Shaped like the pill beside it so the two read as
       one control strip. */
    .oos-switch {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.3rem 0.75rem 0.3rem 0.5rem;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 9999px;
      box-shadow: 0 2px 6px rgba(126, 34, 206, 0.08);
      cursor: pointer;
      user-select: none;
    }

    .oos-switch input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .oos-track {
      position: relative;
      width: 2rem;
      height: 1.05rem;
      flex-shrink: 0;
      border-radius: 9999px;
      border: 1px solid var(--card-border, #E9D5FF);
      background: var(--bg-app, #F3E8FF);
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .oos-knob {
      position: absolute;
      top: 50%;
      left: 0.12rem;
      width: 0.72rem;
      height: 0.72rem;
      transform: translateY(-50%);
      border-radius: 9999px;
      background: #FFFFFF;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
      transition: left 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .oos-switch input:checked + .oos-track {
      background: var(--primary, #7E22CE);
      border-color: var(--primary, #7E22CE);
    }

    .oos-switch input:checked + .oos-track .oos-knob { left: 1.08rem; }

    .oos-switch input:focus-visible + .oos-track {
      box-shadow: 0 0 0 3px var(--primary-glow, rgba(126, 34, 206, 0.28));
    }

    .oos-text {
      color: var(--text-dark, #2E1065);
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .oos-text strong { color: var(--primary, #7E22CE); font-weight: 900; }

    .oos-hidden { color: var(--text-muted, #6B7280); font-weight: 600; }

    .empty-oos-hint {
      margin-top: 0.6rem;
      padding: 0.35rem 0.85rem;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.85);
      color: var(--primary, #7E22CE);
      font-family: inherit;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }

    .empty-oos-hint:hover { background: var(--bg-app, #FAF5FF); }

    @media (prefers-reduced-motion: reduce) {
      .oos-track,
      .oos-knob { transition-duration: 0.01ms; }
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
      /* One knob for the photo band: its width divided by its height. Lower
         is taller — 2.6 gives roughly a third of the card, 1.9 roughly half. */
      --dish-media-ratio: 2.2;

      background: linear-gradient(145deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      border-radius: 1rem;
      padding: 1rem;
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

    /* "New" ribbon. This card gave it no styling at all, so it landed as a
       bare word on its own line and pushed the photo off the card's top edge.
       It is a badge over the band now, mirroring the out-of-stock one on the
       opposite corner. The designs hide it, and hide it more specifically. */
    .dish-flag {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 2;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.45);
      color: #FFFFFF;
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-shadow: none;
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
    }

    /* Photo band.
       This used to be a 4rem circle floating 1.5rem above the card. The card
       clips its own overflow, so the top of that circle was cut off and an
       uploaded dish photo came through as a sliver of a postage stamp.
       It is now a full-bleed band across the top of the card, sized from its
       own width so every card in a row gets the same share of its height
       — a little over 40% at the usual four-per-row. */
    .dish-floating-avatar {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      align-self: stretch;
      flex: 0 0 auto;
      width: auto;
      height: auto;
      aspect-ratio: var(--dish-media-ratio, 2.2) / 1;
      /* Negative side margins carry it past the card's own padding to the
         edges; the card's radius and overflow round the top corners. */
      margin: -1rem -1rem 0.7rem;
      padding: 0.5rem;
      border: none;
      border-radius: 1rem 1rem 0 0;
      background: rgba(255, 255, 255, 0.16);
      box-shadow: none;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* contain, not cover: a till operator has to recognise the dish at a
       glance, and a crop through the middle of a platter helps nobody. */
    .dish-photo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      -webkit-user-drag: none;
      user-select: none;
    }

    .food-emoji {
      font-size: 3.2rem;
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
      background: rgba(255, 255, 255, 0.17);
      -webkit-backdrop-filter: blur(12px) saturate(170%);
      backdrop-filter: blur(12px) saturate(170%);
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.34);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
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

    /* ─── Online / Offline & Advanced POS UI Controls ─── */
    .btn-status-online {
      background: #ECFDF5 !important;
      border-color: #A7F3D0 !important;
      color: #065F46 !important;
    }
    .btn-status-offline {
      background: #FFFBEB !important;
      border-color: #FDE68A !important;
      color: #92400E !important;
    }
    .status-dot-pulse {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #10B981;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .status-dot-pulse.is-offline {
      background: #F59E0B;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
      animation: statusPulse 1.5s infinite;
    }
    @keyframes statusPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.35); opacity: 0.6; }
    }

    /* Complimentary badge on cart item */
    .complimentary-badge {
      font-size: 0.625rem;
      font-weight: 800;
      color: #047857;
      background: #D1FAE5;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      border: 1px solid #6EE7B7;
    }
    .is-complimentary-row {
      border-left: 3px solid #10B981 !important;
    }

    /* Cart item action mini buttons (notes, comp) */
    .item-action-icon-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .item-action-icon-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      color: #FFFFFF;
    }
    .item-action-icon-btn.is-active {
      background: #F59E0B;
      border-color: #FBBF24;
      color: #78350F;
    }

    /* Service charge & Surcharge billing addons bar */
    .cart-billing-addons {
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .billing-addon-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .billing-chip-btn {
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: #FFFFFF;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .billing-chip-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .billing-chip-btn.is-selected {
      background: #FBBF24;
      border-color: #F59E0B;
      color: #1F2937;
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
  public offlinePos = inject(OfflinePosService);
  public printerService = inject(PrinterService);
  public posClosingService = inject(PosClosingService);

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

  /**
   * Whether the grid lists dishes with no stock left. On by default, which is
   * how the till has always behaved; kept per device, because one counter may
   * want to see them and the next may not — it is a view preference, not a
   * rule about what may be sold.
   */
  public showOutOfStock = true;

  /** How many dishes the switch is currently hiding, for its own label. */
  public hiddenOutOfStockCount = 0;

  private readonly SHOW_OUT_OF_STOCK_KEY = 'pos.dishes.showOutOfStock';

  onOutOfStockToggle(event: Event): void {
    this.setShowOutOfStock((event.target as HTMLInputElement).checked);
  }

  public setShowOutOfStock(value: boolean): void {
    this.showOutOfStock = value;
    this.persistOutOfStockPreference();
    this.filterProducts();
  }

  private restoreOutOfStockPreference(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = window.localStorage.getItem(this.SHOW_OUT_OF_STOCK_KEY);
      if (stored !== null) this.showOutOfStock = stored === 'true';
    } catch {
      /* storage blocked — the switch still works, it just is not remembered */
    }
  }

  private persistOutOfStockPreference(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.SHOW_OUT_OF_STOCK_KEY, String(this.showOutOfStock));
    } catch {
      /* as above — remembering it is a convenience, never required */
    }
  }
  public categories: Category[] = [];
  public selectedCategoryId: number | null = null;
  public searchQuery = '';

  // Combos, Deals & Addons state
  public addonsList: ProductAddon[] = [];
  public combosList: ComboMeal[] = [];
  public dealsList: MealDeal[] = [];
  public selectedCatalogTab: 'ALL' | 'COMBOS' | 'DEALS' = 'ALL';

  // Dish Customization & Portion state
  public customizationProduct: Product | null = null;
  public selectedCustomizationVariant: ProductVariant | null = null;
  public selectedCustomizationAddons: ProductAddon[] = [];
  public customizationNotes = '';

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
  public showHistoryModal = false;
  public showVoidModal = false;
  public showClosingModal = false;
  public showPrintersModal = false;
  public showComplimentaryModal = false;
  public showItemNoteModal = false;

  // Payment inputs & digital channels
  public selectedPaymentMethod: any = 'CASH';
  public tenderedAmount = 0;
  public changeDue = 0;
  public paymentReference = '';
  public isCheckingOut = false;
  public onlineProvider = 'Swiggy';
  public upiVpa = 'mandi.pos@okaxis';
  public autoPrintReceipt = true;
  public autoPrintKot = true;

  // Customer inputs
  public customerPhone = '';
  public customerName = '';
  public customerAddress = '';

  // Receipt data
  public lastReceiptData: any = null;

  // Item Editing state
  public activeEditingItem: CartItem | null = null;
  public complimentaryReasonInput = 'Staff Authorized Courtesy';
  public itemNoteInput = '';

  // Transaction History & Audit Ledger state
  public historyBills: Bill[] = [];
  public historySearch = '';
  public historyStatusFilter = 'ALL';
  public isLoadingHistory = false;
  public selectedBillForVoid: Bill | null = null;
  public voidReason = 'Customer cancelled order';
  public voidNotes = '';
  public isVoiding = false;

  // End-of-Day Shift Closing state
  public closingTab: 'current' | 'history' = 'current';
  public shiftSummary: any = null;
  public openingCash = 0;
  public actualCash = 0;
  public closingNotes = '';
  public isSavingClosing = false;
  public pastClosings: PosDayClosing[] = [];

  // Printer Configuration state
  public printerSettings: PrinterConfig = this.printerService.loadConfig();

  ngOnInit(): void {
    // Read before the dishes land, so the first grid already honours it.
    this.restoreOutOfStockPreference();
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
    this.loadCombos();
    this.loadDeals();
    this.loadAddons();
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
    this.showHistoryModal = false;
    this.showVoidModal = false;
    this.showClosingModal = false;
    this.showPrintersModal = false;
    this.showComplimentaryModal = false;
    this.showItemNoteModal = false;
    this.closeCustomizationModal();
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
        if (res.success) {
          this.categories = res.data;
          this.offlinePos.cacheCatalog(this.products, this.categories);
        }
        this.settleCriticalLoad();
        setTimeout(() => this.updateCatScrollState());
      },
      error: (err) => {
        // Offline fallback
        const cached = this.offlinePos.getCachedCatalog();
        if (cached && cached.categories?.length > 0) {
          this.categories = cached.categories;
          this.settleCriticalLoad();
        } else {
          this.settleCriticalLoad(err);
        }
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts(1, 100, undefined, undefined, 'ACTIVE').subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
          this.filterProducts();
          this.offlinePos.cacheCatalog(this.products, this.categories);
        }
        this.settleCriticalLoad();
      },
      error: (err) => {
        // Offline fallback
        const cached = this.offlinePos.getCachedCatalog();
        if (cached && cached.products?.length > 0) {
          this.products = cached.products;
          this.filterProducts();
          this.settleCriticalLoad();
        } else {
          this.settleCriticalLoad(err);
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

    // Sold-out dishes can never be added to a bill, so the counter can have
    // them left out of the grid altogether rather than scrolling past them.
    const soldOut = list.filter((prod) => this.isOutOfStock(prod));
    this.hiddenOutOfStockCount = this.showOutOfStock ? 0 : soldOut.length;
    if (!this.showOutOfStock) {
      list = list.filter((prod) => !this.isOutOfStock(prod));
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

  /** Dish awaiting customization; null when modal is closed. */
  public get customizationVariants(): ProductVariant[] {
    return (this.customizationProduct?.variants || []).filter((v) => v.status !== 'INACTIVE');
  }

  // Backward compatibility alias for variant picker if referenced
  public get variantPickerProduct(): Product | null {
    return this.customizationProduct;
  }
  public set variantPickerProduct(val: Product | null) {
    this.customizationProduct = val;
  }
  public get variantPickerOptions(): ProductVariant[] {
    return this.customizationVariants;
  }

  public getApplicableAddons(product: Product | null): ProductAddon[] {
    if (!product) return [];
    return this.addonsList.filter(
      (a) => (a.is_available === true || a.is_available === 1) && (!a.product_id || a.product_id === product.id)
    );
  }

  openCustomizationModal(product: Product): void {
    this.customizationProduct = product;
    const variants = (product.variants || []).filter((v) => v.status !== 'INACTIVE');
    this.selectedCustomizationVariant = variants.length > 0 ? variants[0] : null;
    this.selectedCustomizationAddons = [];
    this.customizationNotes = '';
  }

  closeCustomizationModal(): void {
    this.customizationProduct = null;
    this.selectedCustomizationVariant = null;
    this.selectedCustomizationAddons = [];
    this.customizationNotes = '';
  }

  toggleAddonSelection(addon: ProductAddon): void {
    const index = this.selectedCustomizationAddons.findIndex((a) => a.id === addon.id);
    if (index >= 0) {
      this.selectedCustomizationAddons.splice(index, 1);
    } else {
      this.selectedCustomizationAddons.push(addon);
    }
  }

  isAddonSelected(addonId: number): boolean {
    return this.selectedCustomizationAddons.some((a) => a.id === addonId);
  }

  getCustomizationTotalPrice(): number {
    if (!this.customizationProduct) return 0;
    const base = this.selectedCustomizationVariant
      ? Number(this.selectedCustomizationVariant.selling_price)
      : Number(this.customizationProduct.selling_price);
    const addons = this.selectedCustomizationAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
    return base + addons;
  }

  confirmCustomization(): void {
    if (!this.customizationProduct) return;
    const prod = this.customizationProduct;
    const variant = this.selectedCustomizationVariant;
    const addons = [...this.selectedCustomizationAddons];
    const notes = this.customizationNotes?.trim() || undefined;

    const success = this.cartService.addItemWithCustomization(
      prod,
      variant,
      1,
      notes,
      addons,
      'PRODUCT'
    );

    const label = variant ? `${prod.name} (${variant.name})` : prod.name;
    if (!success) {
      this.notify.error(`Cannot add "${label}" (Out of Stock / Inactive)`);
    } else {
      const addonsSummary = addons.length > 0 ? ` with ${addons.length} add-on(s)` : '';
      this.notify.info(`Added "${label}"${addonsSummary} to cart`);
    }
    this.closeCustomizationModal();
  }

  addComboToCart(combo: ComboMeal): void {
    const dummyProduct: Product = {
      id: 90000 + combo.id,
      name: combo.name,
      selling_price: combo.combo_price,
      cost_price: 0,
      category_id: 0,
      category_name: 'Combo Meals',
      status: 'ACTIVE',
      sku: combo.code || `COMBO-${combo.id}`,
      tax_rate: 0,
      stock_quantity: 999,
      current_stock: 999,
      image_url: combo.image_url,
      description: combo.description || 'Special combo meal package',
    } as Product;
    const notes = combo.items && combo.items.length > 0
      ? combo.items.map((i) => `${i.quantity}x ${i.product_name || 'Dish'}`).join(', ')
      : undefined;

    this.cartService.addItemWithCustomization(
      dummyProduct,
      null,
      1,
      notes,
      [],
      'COMBO',
      combo.id
    );
    this.notify.success(`Added Combo: "${combo.name}" to cart!`);
  }

  addDealToCart(deal: MealDeal): void {
    const dummyProduct: Product = {
      id: 80000 + deal.id,
      name: deal.title,
      selling_price: deal.deal_price,
      cost_price: 0,
      category_id: 0,
      category_name: 'Meal Deals',
      status: 'ACTIVE',
      sku: deal.code || `DEAL-${deal.id}`,
      tax_rate: 0,
      stock_quantity: 999,
      current_stock: 999,
      image_url: deal.image_url,
      description: deal.description || 'Exclusive deal offer',
    } as Product;
    const notes = deal.items && deal.items.length > 0
      ? deal.items.map((i) => `${i.quantity}x ${i.product_name || 'Dish'}`).join(', ')
      : undefined;

    this.cartService.addItemWithCustomization(
      dummyProduct,
      null,
      1,
      notes,
      [],
      'DEAL',
      deal.id
    );
    this.notify.success(`Added Deal: "${deal.title}" to cart!`);
  }

  loadCombos(): void {
    this.productService.getCombos().subscribe({
      next: (res) => {
        if (res.success) {
          this.combosList = res.data;
        }
      },
      error: () => {},
    });
  }

  loadDeals(): void {
    this.productService.getDeals().subscribe({
      next: (res) => {
        if (res.success) {
          this.dealsList = res.data;
        }
      },
      error: () => {},
    });
  }

  loadAddons(): void {
    this.productService.getAddons().subscribe({
      next: (res) => {
        if (res.success) {
          this.addonsList = res.data.filter((a: any) => a.is_available === true || a.is_available === 1);
        }
      },
      error: () => {},
    });
  }

  /**
   * Adds a product to cart or opens customization modal if portion variants
   * or add-ons are available.
   */
  addToCart(product: Product): void {
    if (this.isOutOfStock(product)) {
      this.notify.warning(`"${product.name}" is currently Out of Stock`);
      return;
    }
    const variants = (product.variants || []).filter((v) => v.status !== 'INACTIVE');
    const addons = this.getApplicableAddons(product);
    if (variants.length > 0 || addons.length > 0) {
      this.openCustomizationModal(product);
      return;
    }
    this.commitToCart(product, null);
  }

  chooseVariant(variant: ProductVariant): void {
    const product = this.customizationProduct;
    if (!product) return;
    this.selectedCustomizationVariant = variant;
    this.confirmCustomization();
  }

  closeVariantPicker(): void {
    this.closeCustomizationModal();
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
      this.cartService.applyCoupon('');
      this.isPromoApplied = false;
      return;
    }

    const applied = this.cartService.applyCoupon(code);
    if (applied) {
      this.isPromoApplied = true;
      this.notify.success(`Coupon code ${code} applied successfully!`);
    } else {
      this.isPromoApplied = false;
      this.notify.error(`Invalid coupon code "${code}". Try SAVE50, WELCOME10, FLAT100, or FESTIVE20.`);
    }
  }

  // ── Complimentary & Item Notes ──
  openComplimentaryModal(item: CartItem): void {
    this.activeEditingItem = item;
    this.complimentaryReasonInput = item.complimentaryReason || 'Staff Authorized Courtesy';
    this.showComplimentaryModal = true;
  }

  saveComplimentary(): void {
    if (this.activeEditingItem) {
      this.cartService.setComplimentary(this.activeEditingItem.lineId, true, this.complimentaryReasonInput);
      this.showComplimentaryModal = false;
      this.notify.success(`Marked "${this.activeEditingItem.product.name}" as 100% complimentary.`);
    }
  }

  removeComplimentary(item: CartItem): void {
    this.cartService.setComplimentary(item.lineId, false);
    this.notify.info(`Removed complimentary status from "${item.product.name}".`);
  }

  openItemNoteModal(item: CartItem): void {
    this.activeEditingItem = item;
    this.itemNoteInput = item.notes || '';
    this.showItemNoteModal = true;
  }

  saveItemNote(): void {
    if (this.activeEditingItem) {
      this.cartService.setItemNotes(this.activeEditingItem.lineId, this.itemNoteInput);
      this.showItemNoteModal = false;
      this.notify.success('Kitchen cooking note saved.');
    }
  }

  // ── POS Transaction History & Ledger ──
  openHistoryModal(): void {
    this.loadHistoryBills();
    this.showHistoryModal = true;
  }

  loadHistoryBills(): void {
    this.isLoadingHistory = true;
    this.billService.getBills(1, 100).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        if (res.success) {
          this.historyBills = res.data;
        }
      },
      error: () => {
        this.isLoadingHistory = false;
      },
    });
  }

  filterHistoryBills(): Bill[] {
    let list = this.historyBills || [];
    if (this.historyStatusFilter === 'PAID') {
      list = list.filter((b) => !b.is_voided && !b.is_reopened);
    } else if (this.historyStatusFilter === 'VOIDED') {
      list = list.filter((b) => b.is_voided);
    } else if (this.historyStatusFilter === 'REOPENED') {
      list = list.filter((b) => b.is_reopened);
    }

    if (this.historySearch && this.historySearch.trim()) {
      const q = this.historySearch.toLowerCase().trim();
      list = list.filter((b) =>
        b.bill_number?.toLowerCase().includes(q) ||
        b.customer_name?.toLowerCase().includes(q) ||
        b.payment_reference?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  promptVoidBill(bill: Bill): void {
    this.selectedBillForVoid = bill;
    this.voidReason = 'Customer cancelled order';
    this.voidNotes = '';
    this.showVoidModal = true;
  }

  submitVoid(): void {
    if (!this.selectedBillForVoid) return;
    const fullReason = this.voidNotes ? `${this.voidReason} - ${this.voidNotes}` : this.voidReason;
    this.isVoiding = true;
    this.billService.voidBill(this.selectedBillForVoid.id, fullReason).subscribe({
      next: (res) => {
        this.isVoiding = false;
        this.showVoidModal = false;
        this.notify.success(`Bill #${this.selectedBillForVoid?.bill_number} has been voided and inventory restored.`);
        this.selectedBillForVoid = null;
        this.loadHistoryBills();
        this.loadProducts(); // refresh restored stock
      },
      error: () => {
        this.isVoiding = false;
      },
    });
  }

  reopenBill(bill: Bill): void {
    this.notify.confirm({
      title: 'Reopen Bill',
      message: `Reopen Bill #${bill.bill_number}? Items will be loaded into the cart for editing.`,
      confirmText: 'Reopen Order',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.billService.reopenBill(bill.id).subscribe({
          next: (res) => {
            this.notify.success(`Bill #${bill.bill_number} reopened.`);
            if (res.data && res.data.bill) {
              this.cartService.loadFromBill(res.data.bill, this.products);
            }
            this.showHistoryModal = false;
            this.loadHistoryBills();
          },
        });
      },
    });
  }

  duplicateBill(bill: Bill): void {
    this.billService.getDuplicate(bill.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cartService.loadFromBill(res.data, this.products);
          this.showHistoryModal = false;
          this.notify.success(`Loaded items from Bill #${bill.bill_number} into current cart.`);
        }
      },
    });
  }

  printReceiptFromHistory(bill: Bill): void {
    this.billService.getPrintData(bill.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.printerService.printThermalReceipt(res.data);
        }
      },
    });
  }

  printKotFromHistory(bill: Bill): void {
    this.billService.getKotPrintData(bill.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.printerService.printKot(res.data);
        }
      },
    });
  }

  // ── End-of-Day Shift Closing (Z-Report) ──
  openDayClosingModal(): void {
    this.closingTab = 'current';
    this.loadCurrentShiftSummary();
    this.showClosingModal = true;
  }

  loadCurrentShiftSummary(): void {
    this.posClosingService.getCurrentShift().subscribe({
      next: (res) => {
        if (res.success) {
          this.shiftSummary = res.data;
          this.actualCash = this.calcExpectedCash();
        }
      },
    });
  }

  loadPastClosings(): void {
    this.posClosingService.getHistory(1, 20).subscribe({
      next: (res) => {
        if (res.success) {
          this.pastClosings = res.data;
        }
      },
    });
  }

  calcExpectedCash(): number {
    const cashSales = Number(this.shiftSummary?.cashSales) || 0;
    const opening = Number(this.openingCash) || 0;
    return opening + cashSales;
  }

  calcCashVariance(): number {
    const actual = Number(this.actualCash) || 0;
    return actual - this.calcExpectedCash();
  }

  submitDayClosing(): void {
    this.isSavingClosing = true;
    const payload = {
      openingCash: Number(this.openingCash) || 0,
      actualCash: Number(this.actualCash) || 0,
      notes: this.closingNotes,
    };

    this.posClosingService.createDayClosing(payload).subscribe({
      next: (res) => {
        this.isSavingClosing = false;
        if (res.success) {
          this.notify.success('Shift closed successfully!');
          this.printerService.printDayClosingZReport(res.data);
          this.showClosingModal = false;
        }
      },
      error: () => {
        this.isSavingClosing = false;
      },
    });
  }

  printPastClosing(closing: PosDayClosing): void {
    this.printerService.printDayClosingZReport(closing);
  }

  // ── Printer Routing Configuration ──
  openPrintersModal(): void {
    this.printerSettings = this.printerService.loadConfig();
    this.showPrintersModal = true;
  }

  savePrinterSettings(): void {
    this.printerService.saveConfig(this.printerSettings);
    this.showPrintersModal = false;
    this.notify.success('Printer configuration saved.');
  }

  testPrintReceipt(): void {
    const dummyBill = {
      billNumber: 'TEST-001',
      orderType: 'WALK_IN',
      paymentMethod: 'CASH',
      items: [{ name: 'Thermal Printer Test Item', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      taxAmount: 5,
      totalAmount: 105,
      cashierName: 'POS System Test',
    };
    this.printerService.printThermalReceipt(dummyBill);
  }

  testPrintKot(): void {
    const dummyKot = {
      kotNumber: 'KOT-TEST',
      orderType: 'DINING',
      tableName: 'T-01',
      items: [{ name: 'Kitchen Test Dish', quantity: 2, notes: 'Extra crispy' }],
      cashierName: 'Kitchen Tester',
    };
    this.printerService.printKot(dummyKot);
  }

  // ── Draft Orders & Holding ──
  holdCurrentBill(): void {
    const items = this.cartService.items().map((i) => ({
      productId: i.product.id,
      variantId: i.variant?.id ?? null,
      quantity: i.quantity,
      notes: i.notes,
      itemType: i.itemType,
      comboId: i.comboId,
      dealId: i.dealId,
      selectedAddons: i.selectedAddons,
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

  // ── Checkout Execution (Online + Offline POS) ──
  executeCheckout(): void {
    this.isCheckingOut = true;

    const items = this.cartService.items().map((i) => ({
      productId: i.product.id,
      productName: i.product.name,
      variantId: i.variant?.id ?? null,
      variantName: i.variant?.name,
      quantity: i.quantity,
      unitPrice: i.isComplimentary ? 0 : i.unitPrice,
      subtotal: i.isComplimentary ? 0 : i.quantity * i.unitPrice,
      isComplimentary: i.isComplimentary,
      complimentaryReason: i.complimentaryReason,
      notes: i.notes,
      itemType: i.itemType,
      comboId: i.comboId,
      dealId: i.dealId,
      selectedAddons: i.selectedAddons,
    }));

    // ── OFFLINE CHECKOUT ROUTE ──
    // ── OFFLINE CHECKOUT ROUTE ──
    if (!this.offlinePos.isOnline()) {
      const syncId = `OFFLINE-ORD-${Date.now()}`;
      const offlineOrder = this.offlinePos.enqueueOfflineOrder({
        offlineSyncId: syncId,
        orderNumber: String(this.activeOrderId),
        billNumber: `OFF-${this.activeOrderId}`,
        timestamp: new Date().toISOString(),
        orderType: this.cartService.orderType(),
        paymentMethod: this.selectedPaymentMethod,
        paymentReference: this.paymentReference,
        customerId: this.cartService.selectedCustomer()?.id,
        customerName: this.cartService.selectedCustomer()?.name,
        diningTableId: this.cartService.selectedTable()?.id,
        tableNumber: this.cartService.selectedTable()?.table_number,
        items: this.cartService.items(),
        subtotal: this.cartService.subtotal(),
        discountAmount: this.cartService.discountAmount(),
        taxAmount: this.cartService.taxAmount(),
        serviceChargeAmount: this.cartService.serviceChargeAmount(),
        surchargeAmount: this.cartService.surchargeAmount(),
        couponCode: this.cartService.couponCode(),
        couponDiscount: this.cartService.couponDiscount(),
        grandTotal: this.cartService.grandTotal(),
        cashTendered: this.tenderedAmount,
        changeReturned: this.changeDue,
        isSynced: false,
      });

      // Decrement stock in local memory
      items.forEach((item) => {
        const p = this.products.find((prod) => prod.id === item.productId);
        if (p && p.current_stock !== undefined) {
          p.current_stock = Math.max(0, Number(p.current_stock) - item.quantity);
        }
      });
      this.filterProducts();

      // Offline print thermal receipt
      if (this.autoPrintReceipt && this.printerSettings.receiptPrinter.enabled) {
        this.printerService.printThermalReceipt({
          billNumber: offlineOrder.offlineSyncId,
          orderType: offlineOrder.orderType,
          paymentMethod: offlineOrder.paymentMethod,
          paymentReference: offlineOrder.paymentReference,
          subtotal: offlineOrder.subtotal,
          discountAmount: offlineOrder.discountAmount,
          serviceChargeAmount: offlineOrder.serviceChargeAmount,
          surchargeAmount: offlineOrder.surchargeAmount,
          taxAmount: offlineOrder.taxAmount,
          totalAmount: offlineOrder.grandTotal,
          cashTendered: offlineOrder.cashTendered,
          changeReturned: offlineOrder.changeReturned,
          items: offlineOrder.items,
          customerName: offlineOrder.customerName,
          offlineNotice: true,
        });
      }

      // Offline print kitchen KOT
      if (this.autoPrintKot && this.printerSettings.kitchenPrinter.enabled) {
        this.printerService.printKot({
          kotNumber: 'KOT-' + this.activeOrderId,
          orderType: offlineOrder.orderType,
          tableName: this.cartService.selectedTable() ? `Table ${this.cartService.selectedTable()?.table_number}` : undefined,
          items: offlineOrder.items.map((i: any) => ({ name: i.product?.name || i.name, quantity: i.quantity, notes: i.notes })),
        });
      }

      this.isCheckingOut = false;
      this.showPaymentModal = false;
      this.cartService.clearCart();
      this.activeOrderId = Math.floor(1000 + Math.random() * 9000);
      this.notify.warning(`Saved Offline! Order #${offlineOrder.offlineSyncId} stored locally and queued for auto-sync.`);
      return;
    }

    // ── ONLINE CHECKOUT ROUTE ──
    const payload = {
      customerId: this.cartService.selectedCustomer()?.id,
      diningTableId: this.cartService.selectedTable()?.id,
      orderType: this.cartService.orderType(),
      discountType: this.cartService.discountType(),
      discountValue: this.cartService.discountValue(),
      serviceChargeAmount: this.cartService.serviceChargeAmount(),
      surchargeAmount: this.cartService.surchargeAmount(),
      couponCode: this.cartService.couponCode(),
      paymentMethod: this.selectedPaymentMethod,
      paymentAmount: this.tenderedAmount || this.cartService.grandTotal(),
      paymentReference: this.paymentReference,
      cashTendered: this.selectedPaymentMethod === 'CASH' ? this.tenderedAmount : undefined,
      changeReturned: this.selectedPaymentMethod === 'CASH' ? this.changeDue : undefined,
      items: this.cartService.items().map((i) => ({
        productId: i.product.id,
        variantId: i.variant?.id ?? null,
        quantity: i.quantity,
        isComplimentary: i.isComplimentary,
        complimentaryReason: i.complimentaryReason,
        notes: i.notes,
        itemType: i.itemType,
        comboId: i.comboId,
        dealId: i.dealId,
        selectedAddons: i.selectedAddons,
      })),
    };

    this.checkoutService.checkout(payload).subscribe({
      next: (res) => {
        this.isCheckingOut = false;
        this.showPaymentModal = false;
        this.notify.success(`Bill #${res.data.bill_number} Settled Successfully!`);

        // Trigger KOT print
        if (this.autoPrintKot && this.printerSettings.kitchenPrinter.enabled) {
          this.billService.getKotPrintData(res.data.id).subscribe({
            next: (kotRes) => {
              if (kotRes.success && kotRes.data) {
                this.printerService.printKot(kotRes.data);
              }
            },
            error: () => {},
          });
        }

        // Trigger thermal receipt
        this.billService.getPrintData(res.data.id).subscribe({
          next: (printRes) => {
            if (printRes.success) {
              this.lastReceiptData = printRes.data;
              if (this.autoPrintReceipt && this.printerSettings.receiptPrinter.enabled) {
                this.printerService.printThermalReceipt(printRes.data);
              } else {
                this.showReceiptModal = true;
              }
            }
          },
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


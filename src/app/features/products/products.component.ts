import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product, Category, ProductAddon, ComboDeal } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { DishLayoutService } from '../../core/services/dish-layout.service';
import { DISH_LAYOUT_CSS } from '../../shared/styles/dish-layout.styles';

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading dishes…"
        subMessage="Fetching the product catalogue from the server."
        icon="restaurant_menu"
        (retry)="loadProducts()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- Breadcrumb left, the catalog's other record types right. Add-ons,
           combo deals are siblings of the dish list rather than views of
           it, so they live up here instead of among the four dish tabs. -->
      <div class="breadcrumbs-strip">
        <div class="breadcrumbs-row">
          <span>{{ settingsService.businessName() }}</span>
          <span class="breadcrumb-separator">›</span>
          <span>Menu Catalog</span>
          <span class="breadcrumb-separator">›</span>
          <span>Dishes & Products</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-current">Live Menu</span>
        </div>

        <div class="aux-tabs-bar">
          <!-- First in the group and the way back from the other three.
               It stays lit for any of the four dish tabs below, because
               those are all views OF products, not siblings of it. -->
          <button
            type="button"
            (click)="activeNavTab = 'overview'; currentPage = 1"
            class="aux-tab-btn"
            [class.is-active]="isCatalogTab"
          >
            <span class="material-symbols-outlined">restaurant_menu</span>
            <span>Products</span>
            <span class="tab-count-badge">{{ products.length }}</span>
          </button>

          <button
            type="button"
            (click)="activeNavTab = 'addons'; currentPage = 1"
            class="aux-tab-btn"
            [class.is-active]="activeNavTab === 'addons'"
          >
            <span class="material-symbols-outlined">extension</span>
            <span>Add-ons</span>
            <span class="tab-count-badge">{{ addonsList.length }}</span>
          </button>

          <button
            type="button"
            (click)="activeNavTab = 'combos'; currentPage = 1"
            class="aux-tab-btn"
            [class.is-active]="activeNavTab === 'combos'"
          >
            <span class="material-symbols-outlined">lunch_dining</span>
            <span>Combo Deals</span>
            <span class="tab-count-badge">{{ combosList.length }}</span>
          </button>

        </div>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">restaurant_menu</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Products & Menu Catalog</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ activeCount }} Live Dishes</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">category</span>
                <span>Sections: <strong>{{ categories.length }} Categories</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">warehouse</span>
                <span>Valuation: <strong>{{ totalInventoryValue | appCurrency:'1.0-0' }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadProducts()"
            class="action-btn btn-outline-purple"
            title="Refresh Products"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline-purple"
            title="Export CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            *ngIf="activeNavTab === 'addons'"
            type="button"
            (click)="openAddonModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>New Add-on</span>
          </button>

          <button
            *ngIf="activeNavTab === 'combos'"
            type="button"
            (click)="openComboModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>New Combo Deal</span>
          </button>

          <button
            *ngIf="isCatalogTab"
            type="button"
            (click)="goToAdd()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>New Dish</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION TABS                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- Dish views, dish metrics: both belong to Products, so they leave
           the page entirely on the add-on and combo deal tabs rather than
           sitting there describing records that are not on screen. -->
      <div class="module-tabs-bar" *ngIf="isCatalogTab">
        <button
          type="button"
          (click)="activeNavTab = 'overview'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'overview'"
        >
          <span class="material-symbols-outlined">dataset</span>
          <span>All Dishes</span>
          <span class="tab-count-badge">{{ products.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'active'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'active'"
        >
          <span class="material-symbols-outlined">check_circle</span>
          <span>Active Dishes</span>
          <span class="tab-count-badge">{{ activeCount }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'low_stock'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'low_stock'"
        >
          <span class="material-symbols-outlined">warning</span>
          <span>Low Stock Alerts</span>
          <span class="tab-count-badge">{{ lowStockCount }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'all_categories'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'all_categories'"
        >
          <span class="material-symbols-outlined">category</span>
          <span>Categories</span>
          <span class="tab-count-badge">{{ categories.length }}</span>
        </button>

        <!-- This row is the four dish views only. Add-ons and Combo Deals
             moved up to the breadcrumb strip: they share
             activeNavTab with these, so selecting one here clears them and
             vice versa. -->
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid" *ngIf="isCatalogTab">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Dishes</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">restaurant</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ products.length }}</span>
            <span class="kpi-pill pill-purple">Catalog</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Active Menu</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">check_circle</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ activeCount }}</span>
            <span class="kpi-pill pill-live">● Live</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Low Stock</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">inventory_2</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number" [ngClass]="lowStockCount > 0 ? 'text-[#DC2626]' : ''">{{ lowStockCount }}</span>
            <span class="kpi-pill pill-amber">Threshold</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Menu Valuation</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ totalInventoryValue | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-purple">Total</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Categories</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">category</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ categories.length }}</span>
            <span class="kpi-pill pill-blue">Sections</span>
          </div>
        </div>

        <!-- KPI 6 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Stock Health</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">verified</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ stockHealthPercent }}%</span>
            <span class="kpi-pill pill-success">✓ Healthy</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. FILTER & SEARCH ACTION TOOLBAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <!-- Search Box -->
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search dishes"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              [placeholder]="searchPlaceholder"
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; currentPage = 1"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Category / Status / Stock / Sort only describe dishes, so they
               step aside on the add-on and combo deal tabs rather than sitting
               there inert. Search, the count and Export serve every tab. -->

          <!-- Category Selector -->
          <app-custom-dropdown
            *ngIf="isCatalogTab"
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            (valueChange)="currentPage = 1"
            placeholder="All Categories"
            minWidth="175px"
          ></app-custom-dropdown>

          <!-- Status Selector -->
          <app-custom-dropdown
            *ngIf="isCatalogTab"
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            (valueChange)="currentPage = 1"
            placeholder="All Statuses"
            minWidth="155px"
          ></app-custom-dropdown>

          <!-- Stock Status Selector -->
          <app-custom-dropdown
            *ngIf="isCatalogTab"
            [options]="stockFilterOptions"
            [(ngModel)]="stockFilter"
            (valueChange)="currentPage = 1"
            placeholder="All Stock Levels"
            minWidth="170px"
          ></app-custom-dropdown>

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ currentCountLabel }}
          </span>
        </div>

        <div class="toolbar-actions-group">
          <!-- Sort Dropdown -->
          <app-custom-dropdown
            *ngIf="isCatalogTab"
            [options]="sortOptions"
            [(ngModel)]="sortBy"
            (valueChange)="currentPage = 1"
            placeholder="Sort by"
            minWidth="195px"
          ></app-custom-dropdown>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline-purple"
            title="Download CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. PRODUCTS DATA TABLE / ADD-ONS / COMBO DEALS                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">

        <!-- ─── TAB: ADD-ONS ─── -->
        <!-- No pane header or Create button here: the page header already
             carries "New Add-on", and the toolbar above owns search and
             export, exactly as the dish catalog tabs work. -->
        <div *ngIf="activeNavTab === 'addons'">
          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 34%;">Add-on Name</th>
                  <th style="width: 16%;">Category</th>
                  <th style="width: 15%;">Price (₹ / SAR)</th>
                  <th style="width: 20%;">Availability</th>
                  <th style="width: 15%; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of filteredAddons">
                  <td>
                    <div class="addon-identity">
                      <span class="addon-thumb" [class.is-empty]="!hasOfferImage('addon', a.id, a.image_url)">
                        <img
                          *ngIf="hasOfferImage('addon', a.id, a.image_url)"
                          [src]="settingsService.assetUrl(a.image_url!)"
                          [alt]="a.name"
                          loading="lazy"
                          draggable="false"
                          (error)="onOfferImageError('addon', a.id)"
                        />
                        <span
                          *ngIf="!hasOfferImage('addon', a.id, a.image_url)"
                          class="material-symbols-outlined"
                        >extension</span>
                      </span>
                      <span class="addon-name">{{ a.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="kpi-pill pill-purple">{{ a.category || 'General' }}</span>
                  </td>
                  <td class="addon-price font-mono">+{{ a.price | appCurrency:'1.0-2' }}</td>
                  <td>
                    <span class="kpi-pill" [ngClass]="a.is_available ? 'pill-success' : 'pill-rose'">
                      <i class="addon-state-dot"></i>{{ a.is_available ? 'Available' : 'Unavailable' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <div class="addon-row-actions">
                      <button type="button" (click)="openAddonModal(a)" class="offer-btn" title="Edit add-on" aria-label="Edit add-on">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button type="button" (click)="deleteAddon(a.id)" class="offer-btn is-danger" title="Delete add-on" aria-label="Delete add-on">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredAddons.length === 0">
                  <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">extension</span>
                      <div class="empty-title">No Add-ons Created</div>
                      <p class="empty-desc">Use "New Add-on" above to configure extra toppings, sauces, or sides.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── TAB: COMBO DEALS ─── -->
        <div *ngIf="activeNavTab === 'combos'" class="offers-stage">
          <div class="offers-grid">
            <article
              *ngFor="let c of filteredCombos"
              class="offer-card offer-card--combo"
              [class.is-dormant]="!c.is_available"
            >
              <!-- Photo, code chip and live state share one band: the chips
                   sit over the picture so the card keeps its six grid rows
                   whether or not a combo has been given an image. -->
              <div class="offer-hero" [class.is-empty]="!hasOfferImage('combo', c.id, c.image_url)">
                <img
                  *ngIf="hasOfferImage('combo', c.id, c.image_url)"
                  [src]="settingsService.assetUrl(c.image_url!)"
                  [alt]="c.name"
                  loading="lazy"
                  draggable="false"
                  (error)="onOfferImageError('combo', c.id)"
                />
                <span *ngIf="!hasOfferImage('combo', c.id, c.image_url)" class="material-symbols-outlined offer-hero-icon">lunch_dining</span>
                <header class="offer-head">
                  <span class="offer-kind">
                    <span class="material-symbols-outlined">lunch_dining</span>
                    <span class="offer-kind-code font-mono">{{ c.code || 'COMBO' }}</span>
                  </span>
                  <span class="offer-state" [class.is-off]="!c.is_available">
                    <i class="offer-dot"></i>{{ c.is_available ? 'Live' : 'Inactive' }}
                  </span>
                </header>
              </div>

              <h4 class="offer-title">{{ c.name }}</h4>
              <p class="offer-blurb">{{ c.description || 'Special combo bundle' }}</p>

              <!-- Contents. A bundle with nothing attached cannot price or
                   deduct stock at the till, so the empty case is a warning
                   rather than the grey italic aside it used to be. -->
              <div class="offer-contents" [class.is-unlinked]="!c.items?.length">
                <div class="offer-contents-label">
                  <span class="material-symbols-outlined">{{ c.items?.length ? 'checklist' : 'warning' }}</span>
                  <span>{{ c.items?.length ? 'Includes' : 'Nothing linked' }}</span>
                  <span *ngIf="c.items?.length" class="offer-count">{{ comboUnitCount(c) }}</span>
                </div>
                <ul *ngIf="c.items?.length" class="offer-items">
                  <li *ngFor="let item of c.items">
                    <span class="offer-qty font-mono">{{ item.quantity }}&times;</span>
                    <span class="offer-item-name">{{ item.product_name || 'Dish' }}</span>
                  </li>
                </ul>
                <p *ngIf="!c.items?.length" class="offer-warn">
                  The description names dishes but none are attached — this combo
                  will not price or deduct stock correctly.
                </p>
              </div>

              <footer class="offer-foot">
                <div class="offer-price">
                  <span class="offer-now font-mono">{{ c.combo_price | appCurrency:'1.0-2' }}</span>
                  <span
                    *ngIf="c.original_price && c.original_price > c.combo_price"
                    class="offer-was font-mono"
                  >{{ c.original_price | appCurrency:'1.0-2' }}</span>
                </div>
                <span *ngIf="c.savings_amount && c.savings_amount > 0" class="offer-save">
                  Save {{ c.savings_amount | appCurrency:'1.0-0' }}
                  <em *ngIf="comboSavingsPercent(c) as pct">{{ pct }}%</em>
                </span>
              </footer>

              <div class="offer-actions">
                <button type="button" (click)="openComboModal(c)" class="offer-btn">
                  <span class="material-symbols-outlined">edit</span><span>Edit</span>
                </button>
                <button
                  type="button"
                  (click)="deleteCombo(c.id)"
                  class="offer-btn is-danger"
                  title="Delete combo"
                  aria-label="Delete combo"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </article>
          </div>

          <div *ngIf="filteredCombos.length === 0" class="offers-empty">
            <span class="material-symbols-outlined">lunch_dining</span>
            <h4>No Combo Deals Created</h4>
            <p>Create delicious bundles like "Duo  Combo" or "Family Pack".</p>
          </div>
        </div>

        <!-- ─── STANDARD DISH CATALOG ─── -->
        <div *ngIf="isCatalogTab" [ngClass]="dishLayout.rootClass()" [ngStyle]="dishLayout.pageCssVars()">

        <!-- ─── Card designs: Bento, Glass, Brutalist, Editorial ───────── -->
        <div class="catalog-stage" *ngIf="showCatalogCards">
          <div class="dishes-cards-grid" *ngIf="paginatedProducts.length > 0">
            <div
              *ngFor="let p of paginatedProducts"
              class="dish-hero-card"
              [class.is-out-of-stock]="isOutOfStock(p)"
              role="button"
              tabindex="0"
              (click)="goToView(p)"
              (keydown.enter)="goToView(p)"
              (keydown.space)="goToView(p)"
              [title]="'Open ' + p.name"
            >
              <!-- Decorative layers. Each design turns on what it needs: the
                   tile sheen, the frosted highlight and halo, or the hatch. -->
              <span class="dish-deco dish-deco-a" aria-hidden="true"></span>
              <span class="dish-deco dish-deco-b" aria-hidden="true"></span>

              <div *ngIf="isOutOfStock(p)" class="out-of-stock-badge">
                <span>OUT OF STOCK</span>
              </div>

              <div class="dish-floating-avatar">
                <img
                  *ngIf="hasCardImage(p)"
                  class="dish-photo"
                  [src]="settingsService.assetUrl(p.image_url!)"
                  [alt]="p.name"
                  loading="lazy"
                  draggable="false"
                  (error)="onCardImageError(p)"
                />
                <span *ngIf="!hasCardImage(p)" class="material-symbols-outlined food-emoji">
                  restaurant
                </span>
              </div>

              <!-- DOM order is fixed; each design reorders it with CSS. -->
              <div class="dish-body">
                <h3 class="dish-title">{{ p.name }}</h3>

                <div class="dish-price-tag font-mono">
                  {{ p.selling_price | appCurrency:'1.0-0' }}
                </div>

                <p class="dish-desc">{{ p.description || 'Authentic traditional recipe' }}</p>

                <div class="dish-specs">
                  <div class="spec-row">
                    <span class="spec-label">Category</span>
                    <span class="spec-value">{{ p.category_name || 'General' }}</span>
                  </div>
                  <div class="spec-row">
                    <span class="spec-label">In Stock</span>
                    <span class="spec-value">{{ stockOf(p) }}</span>
                  </div>
                  <div class="spec-row">
                    <span class="spec-label">SKU</span>
                    <span class="spec-value">{{ p.sku }}</span>
                  </div>
                </div>

                <div class="dish-card-footer">
                  <span
                    class="status-dot-pill"
                    [ngClass]="p.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
                  >
                    <span class="status-dot"></span>
                    {{ p.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </span>
                  <span class="sales-count-badge">
                    Cost {{ p.cost_price | appCurrency:'1.0-0' }}
                  </span>
                </div>

                <div class="dish-cta" aria-hidden="true"><span>VIEW DISH</span></div>
              </div>

              <!-- Edit and delete still have to be reachable without going
                   back to the table, so they ride on the card. -->
              <div class="catalog-card-actions" (click)="$event.stopPropagation()">
                <button type="button" (click)="goToEdit(p)" [title]="'Edit ' + p.name">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  class="is-danger"
                  (click)="deleteProduct(p)"
                  [title]="'Delete ' + p.name"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>

          <div class="catalog-empty-box" *ngIf="filteredProducts.length === 0">
            <span class="material-symbols-outlined empty-icon">
              {{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'restaurant_menu' }}
            </span>
            <div class="empty-title">
              {{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Dishes Found' }}
            </div>
            <p class="empty-desc">
              {{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No dishes match your active filter or search query in the menu catalog.' }}
            </p>
          </div>
        </div>

        <!-- ─── Menu Table design, and whenever the setting is off ─────── -->
        <div class="table-responsive-wrapper" *ngIf="!showCatalogCards">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    title="Select all dishes"
                    type="checkbox"
                    [(ngModel)]="selectAll"
                    (change)="toggleSelectAll()"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </th>
                <th style="width: 28%;">Dish & Description</th>
                <th style="width: 14%;">SKU / Code</th>
                <th style="width: 14%;">Category</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 14%;">Selling Price</th>
                <th style="width: 14%;">Stock Level</th>
                <th style="width: 50px; text-align: center;">
                  <span
                    class="material-symbols-outlined cursor-pointer text-[#9CA3AF] hover:text-[#DC2626]"
                    title="Delete Selected"
                    (click)="deleteSelected()"
                  >delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let p of paginatedProducts"
                class="clickable-row"
                (click)="goToView(p)"
                title="Open dish view page"
              >
                <!-- Checkbox -->
                <td style="text-align: center;" class="row-select-cell" (click)="$event.stopPropagation()">
                  <input
                    title="Select this dish"
                    type="checkbox"
                    [(ngModel)]="p.selected"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </td>

                <!-- Dish Name & Avatar -->
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-bold text-xs text-[#7E22CE] shrink-0 shadow-xs">
                      <span class="material-symbols-outlined" style="font-size: 20px;">restaurant</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[#2E1065] text-xs truncate">{{ p.name }}</div>
                      <div class="text-[11px] text-[#6B7280] truncate max-w-xs">{{ p.description || 'Authentic traditional recipe' }}</div>
                    </div>
                  </div>
                </td>

                <!-- SKU -->
                <td>
                  <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">
                    {{ p.sku }}
                  </span>
                </td>

                <!-- Category -->
                <td>
                  <span
                    class="category-pill-badge"
                    [ngStyle]="getCategoryBadgeStyle(p.category_name)"
                  >
                    <span class="material-symbols-outlined cat-icon">{{ getCategoryIcon(p.category_name) }}</span>
                    <span>{{ p.category_name || 'General' }}</span>
                  </span>
                </td>

                <!-- Status Pill -->
                <td>
                  <span
                    class="status-dot-pill"
                    [ngClass]="p.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
                  >
                    <span class="status-dot"></span>
                    {{ p.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </span>
                </td>

                <!-- Selling Price & Cost -->
                <td>
                  <div class="font-mono font-bold text-xs text-[#2E1065]">
                    {{ p.selling_price | appCurrency:'1.0-0' }}
                  </div>
                  <div class="text-[10px] text-[#6B7280] font-mono">
                    Cost: {{ p.cost_price | appCurrency:'1.0-0' }}
                  </div>
                </td>

                <!-- Stock Level & Progress Bar -->
                <td>
                  <div class="space-y-1 max-w-[120px]">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-mono font-bold text-[#2E1065]">{{ stockOf(p) }} units</span>
                      <span class="text-[#6B7280] text-[9px]">Min: {{ p.low_stock_threshold }}</span>
                    </div>
                    <div class="w-full bg-[#E9D5FF] rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [style.width.%]="calcStockPercent(stockOf(p), p.low_stock_threshold)"
                        [ngClass]="{
                          '!bg-[#DC2626]': stockOf(p) <= 0,
                          '!bg-[#EA580C]': stockOf(p) > 0 && stockOf(p) <= p.low_stock_threshold,
                          '!bg-[#16A34A]': stockOf(p) > p.low_stock_threshold
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Actions -->
                <td style="text-align: center;" class="row-actions-cell" (click)="$event.stopPropagation()">
                  <div class="row-actions-flex">
                    <button
                      type="button"
                      (click)="goToView(p)"
                      class="action-icon-btn is-success"
                      title="View Dish"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">visibility</span>
                    </button>
                    <button
                      type="button"
                      (click)="goToEdit(p)"
                      class="action-icon-btn"
                      title="Edit Dish"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                    </button>
                    <button
                      type="button"
                      (click)="deleteProduct(p)"
                      class="action-icon-btn is-danger"
                      title="Delete Dish"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredProducts.length === 0">
                <td colspan="8" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'restaurant_menu' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Dishes Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No dishes match your active filter or search query in the menu catalog.' }}</p>
                    <button
                      type="button"
                      (click)="goToAdd()"
                      class="action-btn btn-gradient-purple mt-2"
                    >
                      <span class="material-symbols-outlined">add_circle</span>
                      <span>Add First Dish</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        </div><!-- /catalog design wrapper -->

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR (shared by every design)               -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="pagination-footer-bar" *ngIf="filteredProducts.length > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ filteredProducts.length }}</strong> dish entries
          </div>

          <div class="pagination-controls">
            <button
              type="button"
              [disabled]="currentPage <= 1"
              (click)="currentPage = currentPage - 1"
              class="page-nav-btn"
              title="Previous Page"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              *ngFor="let page of pageNumbers"
              (click)="currentPage = page"
              class="page-num-btn"
              [class.is-active]="currentPage === page"
            >
              {{ page }}
            </button>

            <button
              type="button"
              [disabled]="currentPage >= totalPages"
              (click)="currentPage = currentPage + 1"
              class="page-nav-btn"
              title="Next Page"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      <!-- Add-on Modal -->
      <div class="modal-backdrop" *ngIf="showAddonModal">
        <div class="modal-content shadow-2xl max-w-md">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-purple-200">
            <h3 class="text-lg font-black text-[#2E1065]">{{ editingAddon ? 'Edit Add-on' : 'Create New Add-on' }}</h3>
            <button type="button" (click)="showAddonModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form (ngSubmit)="saveAddon()" class="space-y-3">
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Add-on Name</label>
              <input type="text" [(ngModel)]="addonForm.name" name="addonName" class="form-control text-sm" placeholder="e.g. Extra Tahini Sauce" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Category</label>
                <input type="text" [(ngModel)]="addonForm.category" name="addonCat" class="form-control text-sm" placeholder="e.g. Sauces, Sides" />
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Price (₹ / SAR)</label>
                <input type="number" step="any" min="0" [(ngModel)]="addonForm.price" name="addonPrice" class="form-control text-sm font-mono font-bold" required />
              </div>
            </div>
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Add-on Photo</label>
              <div class="image-upload-row">
                <div class="image-upload-preview" [class.is-empty]="!addonForm.image_url">
                  <img
                    *ngIf="addonForm.image_url"
                    [src]="settingsService.assetUrl(addonForm.image_url)"
                    alt="Add-on photo preview"
                  />
                  <span *ngIf="!addonForm.image_url" class="material-symbols-outlined">add_photo_alternate</span>
                </div>
                <div class="image-upload-actions">
                  <input
                    type="file"
                    hidden
                    #addonPicker
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    (change)="onOfferImageFile($event, addonPicker, addonForm, 'addon')"
                    title="Choose add-on photo"
                  />
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      [disabled]="uploadingImageFor === 'addon'"
                      (click)="addonPicker.click()"
                    >
                      <span class="material-symbols-outlined">{{ uploadingImageFor === 'addon' ? 'progress_activity' : 'upload' }}</span>
                      <span>{{ uploadingImageFor === 'addon' ? 'Uploading…' : (addonForm.image_url ? 'Replace' : 'Choose Image') }}</span>
                    </button>
                    <button
                      *ngIf="addonForm.image_url && uploadingImageFor !== 'addon'"
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      (click)="addonForm.image_url = ''"
                    >
                      <span class="material-symbols-outlined">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  <p class="image-upload-hint">PNG, JPG, WEBP or GIF · up to 2 MB</p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="addonAvail" [(ngModel)]="addonForm.is_available" name="addonAvail" class="rounded border-gray-300 text-purple-600" />
              <label for="addonAvail" class="text-xs font-semibold text-gray-700">Available for ordering on POS</label>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button type="button" (click)="showAddonModal = false" class="action-btn btn-outline-purple">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple">Save Add-on ✓</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Combo Deal Modal -->
      <div class="modal-backdrop" *ngIf="showComboModal">
        <div class="modal-content shadow-2xl max-w-lg">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-purple-200">
            <h3 class="text-lg font-black text-[#2E1065]">{{ editingCombo ? 'Edit Combo Deal' : 'Create Combo Deal' }}</h3>
            <button type="button" (click)="showComboModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form (ngSubmit)="saveCombo()" class="space-y-3">
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Combo Deal Name</label>
              <input type="text" [(ngModel)]="comboForm.name" name="comboName" class="form-control text-sm" placeholder="e.g. Duo  Combo" required />
            </div>
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Description</label>
              <input type="text" [(ngModel)]="comboForm.description" name="comboDesc" class="form-control text-sm" placeholder="e.g. 2  + 2 Drinks + Salad" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Combo Price (₹)</label>
                <input type="number" step="any" min="0" [(ngModel)]="comboForm.combo_price" name="comboPrice" class="form-control text-sm font-mono font-bold text-emerald-700" required />
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Original Price (₹)</label>
                <input type="number" step="any" min="0" [(ngModel)]="comboForm.original_price" name="comboOrigPrice" class="form-control text-sm font-mono" placeholder="Sum of dishes" />
              </div>
            </div>
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Combo Photo</label>
              <div class="image-upload-row">
                <div class="image-upload-preview" [class.is-empty]="!comboForm.image_url">
                  <img
                    *ngIf="comboForm.image_url"
                    [src]="settingsService.assetUrl(comboForm.image_url)"
                    alt="Combo deal photo preview"
                  />
                  <span *ngIf="!comboForm.image_url" class="material-symbols-outlined">add_photo_alternate</span>
                </div>
                <div class="image-upload-actions">
                  <input
                    type="file"
                    hidden
                    #comboPicker
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    (change)="onOfferImageFile($event, comboPicker, comboForm, 'combo')"
                    title="Choose combo photo"
                  />
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      [disabled]="uploadingImageFor === 'combo'"
                      (click)="comboPicker.click()"
                    >
                      <span class="material-symbols-outlined">{{ uploadingImageFor === 'combo' ? 'progress_activity' : 'upload' }}</span>
                      <span>{{ uploadingImageFor === 'combo' ? 'Uploading…' : (comboForm.image_url ? 'Replace' : 'Choose Image') }}</span>
                    </button>
                    <button
                      *ngIf="comboForm.image_url && uploadingImageFor !== 'combo'"
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      (click)="comboForm.image_url = ''"
                    >
                      <span class="material-symbols-outlined">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  <p class="image-upload-hint">PNG, JPG, WEBP or GIF · up to 2 MB</p>
                </div>
              </div>
            </div>
            <!-- Included Items Section -->
            <div class="offer-items-block">
              <div class="offer-items-head">
                <span class="offer-items-label">Included Dishes</span>
                <button type="button" (click)="addComboItem()" class="add-dish-btn">
                  <span class="material-symbols-outlined">add_circle</span>
                  <span>Add Dish</span>
                </button>
              </div>

              <div class="offer-items-rows">
                <div *ngFor="let item of comboForm.items; let idx = index" class="offer-item-row">
                  <select
                    [(ngModel)]="item.product_id"
                    name="comboItemProd_{{idx}}"
                    class="form-control offer-item-dish"
                    aria-label="Dish"
                  >
                    <option *ngFor="let p of products" [value]="p.id">{{ p.name }} (₹{{ p.selling_price }})</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    [(ngModel)]="item.quantity"
                    name="comboItemQty_{{idx}}"
                    class="form-control offer-item-qty font-mono"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    (click)="removeComboItem(idx)"
                    class="offer-item-remove"
                    title="Remove dish"
                    aria-label="Remove dish"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>

                <p *ngIf="!comboForm.items?.length" class="offer-items-empty">
                  No dishes yet — use Add Dish to build the bundle.
                </p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button type="button" (click)="showComboModal = false" class="action-btn btn-outline-purple">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple">Save Combo Deal ✓</button>
            </div>
          </form>
        </div>
      </div>

  `,
  styles: [
    `
      /* ─── Breadcrumb row + the catalog's other record types ─── */
      .breadcrumbs-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      /* .breadcrumbs-row sets align-self: flex-start for when it stands
         alone; sharing a row with the tabs, it centres instead. */
      .breadcrumbs-strip > .breadcrumbs-row {
        align-self: center;
      }

      .aux-tabs-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        min-width: 0;
      }

      /* Quieter than .module-tab-btn on purpose: the four dish tabs below
         are the primary navigation, and these must not outrank them. */
      .aux-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border-radius: 999px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--card-bg, #ffffff) 82%, transparent);
        color: var(--text-muted, #6B7280);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .aux-tab-btn .material-symbols-outlined {
        font-size: 17px;
        color: var(--primary, #7E22CE);
      }

      .aux-tab-btn:hover {
        border-color: var(--primary, #C084FC);
        color: var(--primary, #7E22CE);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px -8px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      .aux-tab-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        border-color: var(--primary, #7E22CE);
        color: #ffffff;
        box-shadow: 0 6px 18px -8px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
      }

      .aux-tab-btn.is-active .material-symbols-outlined { color: #ffffff; }

      .aux-tab-btn.is-active .tab-count-badge {
        background: rgba(255, 255, 255, 0.22);
        color: #ffffff;
      }

      @media (max-width: 720px) {
        .breadcrumbs-strip { align-items: flex-start; }
        .aux-tabs-bar { width: 100%; }
      }

      /* ─── Dish image upload ─── */
      .image-upload-row { display: flex; align-items: center; gap: 0.875rem; }

      .image-upload-preview {
        width: 4.5rem;
        height: 4.5rem;
        flex-shrink: 0;
        border-radius: 14px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
      }

      .image-upload-preview.is-empty { border-style: dashed; }
      .image-upload-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .image-upload-preview .material-symbols-outlined { font-size: 26px; opacity: 0.55; }

      .image-upload-actions { display: flex; flex-direction: column; gap: 0.45rem; min-width: 0; }
      .image-upload-hint { margin: 0; font-size: 0.6875rem; color: var(--text-muted, #6B7280); }

      /* ─── Variant editor ─── */
      .variants-hint {
        margin: 0.3rem 0 0;
        font-size: 0.6875rem;
        line-height: 1.45;
        color: var(--text-muted, #6B7280);
        max-width: 42ch;
      }

      .variant-rows { display: flex; flex-direction: column; gap: 0.5rem; }

      .variant-row-head,
      .variant-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 6.5rem 5.5rem 2.25rem;
        gap: 0.5rem;
        align-items: center;
      }

      .variant-row-head span {
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #6B7280);
      }

      .variant-row .form-control { height: 38px; }

      .variants-empty {
        margin: 0;
        padding: 0.7rem 0.85rem;
        border-radius: 12px;
        border: 1px dashed var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        font-size: 0.6875rem;
        color: var(--text-muted, #6B7280);
      }

      /* ─── Catalog card designs ───
         Only the grid geometry lives here; the look of each design comes from
         the shared stylesheet below, which the Settings preview reads too. */
      .dishes-cards-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.25rem;
      }

      @media (min-width: 900px) {
        .dishes-cards-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }

      @media (max-width: 560px) {
        .dishes-cards-grid { grid-template-columns: minmax(0, 1fr); }
      }

      /* ─── Combo Deal cards ────────────────────────────────────────
         Written as real rules rather than utilities: the previous markup
         leaned on bg-purple-50 / text-amber-700 / md:grid-cols-2 and the
         like, none of which exist in styles.css, so the cards rendered as
         bare text on white. Everything below is scoped to this component
         and built from the theme variables, so it also follows dark mode. */

      .offers-stage {
        padding: 1rem;
      }

      .offers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
        gap: 1rem;
        align-items: stretch;
      }

      /* Cards are a grid, not a flex column, so the price footer and the
         action row sit on the same baseline across every card in a row
         however long the title or the item list runs. */
      .offer-card {
        display: grid;
        grid-template-rows: auto auto auto 1fr auto auto;
        gap: 0.5rem;
        padding: 1rem;
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: var(--radius-lg, 16px);
        background: var(--card-bg, #ffffff);
        box-shadow: 0 1px 2px rgba(var(--text-main-rgb, 46, 16, 101), 0.05);
        transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
        position: relative;
        overflow: hidden;
        min-width: 0;
      }

      /* A 3px spine is the only difference between the two card types. It
         tells them apart at a glance without a second colour scheme. */
      .offer-card::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 3px;
        background: var(--primary, #7E22CE);
      }

      /* Green spine: a bundle sold at a saving. Stated rather than left to
         inherit the base, so the intent survives a change to the base. */
      .offer-card--combo::before {
        background: var(--success, #16A34A);
      }

      .offer-card:hover {
        border-color: var(--primary, #C084FC);
        box-shadow: 0 8px 22px rgba(var(--primary-rgb, 126, 34, 206), 0.12);
        transform: translateY(-2px);
      }

      /* An inactive offer is still editable but must not read as live stock. */
      .offer-card.is-dormant {
        background: color-mix(in srgb, var(--card-bg, #ffffff) 92%, var(--text-muted, #6B7280));
        border-style: dashed;
      }

      .offer-card.is-dormant .offer-title,
      .offer-card.is-dormant .offer-now {
        color: var(--text-muted, #6B7280);
      }

      .offer-card.is-dormant::before {
        background: var(--text-dim, #9CA3AF);
      }

      .offer-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .offer-kind {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.5rem 0.2rem 0.35rem;
        border-radius: var(--radius-full, 999px);
        border: 1px solid var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--primary, #7E22CE) 8%, transparent);
        color: var(--primary, #7E22CE);
        min-width: 0;
      }

      .offer-kind .material-symbols-outlined {
        font-size: 15px;
      }

      .offer-kind-code {
        font-size: 0.625rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .offer-state {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.55rem;
        border-radius: var(--radius-full, 999px);
        border: 1px solid color-mix(in srgb, var(--success, #16A34A) 35%, transparent);
        background: color-mix(in srgb, var(--success, #16A34A) 10%, transparent);
        color: var(--success, #15803D);
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
        flex: none;
      }

      .offer-state.is-off {
        border-color: var(--card-border, #E5E7EB);
        background: transparent;
        color: var(--text-muted, #6B7280);
      }

      .offer-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex: none;
      }

      .offer-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 800;
        line-height: 1.3;
        color: var(--text-main, #2E1065);
        /* Two lines then ellipsis: a long name must not push the price of one
           card out of line with its neighbours. */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .offer-blurb {
        margin: 0;
        font-size: 0.75rem;
        line-height: 1.45;
        color: var(--text-muted, #6B7280);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* ── Contents panel ── */
      .offer-contents {
        padding: 0.6rem 0.7rem;
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: var(--radius-md, 12px);
        background: color-mix(in srgb, var(--primary, #7E22CE) 4%, transparent);
        min-width: 0;
      }

      /* An offer with no dishes attached is a live mispricing waiting to
         happen, so it is called out rather than whispered in grey italic. */
      .offer-contents.is-unlinked {
        border-color: color-mix(in srgb, var(--warning, #D97706) 45%, transparent);
        background: color-mix(in srgb, var(--warning, #D97706) 9%, transparent);
      }

      .offer-contents-label {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary, #7E22CE);
      }

      .offer-contents.is-unlinked .offer-contents-label {
        color: var(--warning, #B45309);
      }

      .offer-contents-label .material-symbols-outlined {
        font-size: 15px;
      }

      .offer-count {
        margin-left: auto;
        padding: 0.05rem 0.35rem;
        border-radius: var(--radius-full, 999px);
        background: color-mix(in srgb, var(--primary, #7E22CE) 14%, transparent);
        font-size: 0.5625rem;
        font-weight: 800;
      }

      .offer-items {
        list-style: none;
        margin: 0.4rem 0 0;
        padding: 0;
        display: grid;
        gap: 0.2rem;
      }

      .offer-items li {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: var(--text-main, #374151);
        min-width: 0;
      }

      .offer-qty {
        font-size: 0.6875rem;
        font-weight: 800;
        color: var(--primary, #7E22CE);
        flex: none;
      }

      .offer-item-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .offer-warn {
        margin: 0.35rem 0 0;
        font-size: 0.6875rem;
        line-height: 1.45;
        color: var(--warning, #B45309);
      }

      /* ── Price footer ── */
      .offer-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--card-border, #E9D5FF);
      }

      .offer-price {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        min-width: 0;
      }

      /* The price is the largest thing on the card on purpose: it is what the
         screen exists to set, and it used to be smaller than the Edit button. */
      .offer-now {
        font-size: 1.25rem;
        font-weight: 800;
        line-height: 1;
        color: var(--text-main, #2E1065);
      }

      .offer-was {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-dim, #9CA3AF);
        text-decoration: line-through;
      }

      .offer-save {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-full, 999px);
        background: color-mix(in srgb, var(--success, #16A34A) 12%, transparent);
        color: var(--success, #15803D);
        font-size: 0.6875rem;
        font-weight: 800;
        white-space: nowrap;
        flex: none;
      }

      .offer-save em {
        font-style: normal;
        opacity: 0.75;
      }

      .offer-save.is-discount {
        background: color-mix(in srgb, var(--primary, #7E22CE) 12%, transparent);
        color: var(--primary, #7E22CE);
      }

      /* ── Actions ── */
      .offer-actions {
        display: flex;
        gap: 0.4rem;
      }

      .offer-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        flex: 1;
        padding: 0.4rem 0.6rem;
        border-radius: var(--radius-md, 10px);
        border: 1px solid var(--card-border, #E9D5FF);
        background: transparent;
        color: var(--text-muted, #4B5563);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.18s ease;
      }

      .offer-btn .material-symbols-outlined {
        font-size: 16px;
      }

      .offer-btn:hover {
        border-color: var(--primary, #7E22CE);
        background: color-mix(in srgb, var(--primary, #7E22CE) 8%, transparent);
        color: var(--primary, #7E22CE);
      }

      /* Delete stays an icon-only square so it cannot be hit by accident
         while reaching for Edit, and only shows its intent on hover. */
      .offer-btn.is-danger {
        flex: none;
        width: 2.1rem;
        padding: 0.4rem 0;
        color: var(--danger, #DC2626);
      }

      .offer-btn.is-danger:hover {
        border-color: var(--danger, #DC2626);
        background: color-mix(in srgb, var(--danger, #DC2626) 10%, transparent);
        color: var(--danger, #DC2626);
      }

      /* ── Empty state ── */
      .offers-empty {
        display: grid;
        justify-items: center;
        gap: 0.35rem;
        padding: 2.5rem 1rem;
        border: 1px dashed var(--card-border, #E9D5FF);
        border-radius: var(--radius-lg, 16px);
        background: color-mix(in srgb, var(--primary, #7E22CE) 3%, transparent);
        text-align: center;
      }

      .offers-empty .material-symbols-outlined {
        font-size: 38px;
        color: var(--primary, #C084FC);
      }

      .offers-empty h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 800;
        color: var(--text-main, #374151);
      }

      .offers-empty p {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-muted, #6B7280);
      }

      @media (max-width: 520px) {
        .offers-grid { grid-template-columns: minmax(0, 1fr); }
        .offers-stage { padding: 0.75rem; }
      }

      .font-mono { font-family: 'JetBrains Mono', monospace; }


      /* ═══════════════════════════════════════════════════════════════
         Photos on add-ons and combo deals, plus the dish-picker rows
         inside the combo deal dialog.

         The dialog rows and the add-on table leaned on utility classes
         this project does not ship - w-16, p-1, py-0.5, bg-purple-100
         and the like - so the three controls in a row sat at three
         different heights and the pills rendered as bare text. What
         follows are real rules built from the theme variables.
         ═══════════════════════════════════════════════════════════ */

      /* ─── Offer card hero band ─────────────────────────────────── */

      /* Full-bleed: the negative margin cancels the card padding, and the
         card is already overflow:hidden so the photo takes its radius. */
      .offer-hero {
        position: relative;
        margin: -1rem -1rem 0;
        height: 8.5rem;
        overflow: hidden;
        background: color-mix(in srgb, var(--primary, #7E22CE) 7%, var(--card-bg, #ffffff));
      }

      .offer-card--combo .offer-hero {
        background: color-mix(in srgb, var(--success, #16A34A) 8%, var(--card-bg, #ffffff));
      }

      .offer-hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* No photo yet: the type icon stands in, faded enough to read as a
         placeholder rather than as artwork. */
      .offer-hero-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 44px;
        color: var(--primary, #7E22CE);
        opacity: 0.28;
      }

      .offer-card--combo .offer-hero-icon {
        color: var(--success, #16A34A);
      }

      .offer-hero.is-empty {
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }

      .offer-hero .offer-head {
        position: absolute;
        inset: 0.6rem 0.6rem auto 0.8rem;
      }

      /* A translucent chip disappears over a photograph, so on the hero the
         chips turn frosted white and keep only their text colour to say
         which state they report. */
      .offer-hero .offer-kind,
      .offer-hero .offer-state {
        background: rgba(255, 255, 255, 0.93);
        border-color: rgba(255, 255, 255, 0.85);
        box-shadow: 0 1px 4px rgba(var(--text-main-rgb, 46, 16, 101), 0.22);
      }

      /* The type spine has to stay legible across the picture. */
      .offer-card::before {
        z-index: 2;
      }

      .offer-card.is-dormant .offer-hero img {
        filter: grayscale(0.65);
        opacity: 0.75;
      }

      /* ─── Included-dishes rows in the combo deal dialog ─────────── */

      .offer-items-block {
        padding-top: 0.9rem;
        border-top: 1.5px solid var(--card-border, #E9D5FF);
      }

      .offer-items-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.7rem;
      }

      .offer-items-label {
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--text-muted, #6B7280);
      }

      .add-dish-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.42rem 0.75rem;
        border-radius: var(--radius-md, 10px);
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
        font-family: inherit;
        font-size: 0.7rem;
        font-weight: 800;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }

      .add-dish-btn:hover {
        background: var(--primary, #7E22CE);
        border-color: var(--primary, #7E22CE);
        color: #ffffff;
      }

      .add-dish-btn .material-symbols-outlined {
        font-size: 16px;
      }

      .offer-items-rows {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* One grid per row, so the dish, the quantity and the remove button
         line up down the column however long a dish name runs. All three
         take the 42px every other form control on the page stands at. */
      .offer-item-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 4.75rem 2.625rem;
        align-items: center;
        gap: 0.5rem;
      }

      .offer-item-dish,
      .offer-item-qty {
        height: 2.625rem;
        min-height: 2.625rem;
        font-size: 0.8125rem;
        padding: 0.4rem 0.6rem;
      }

      .offer-item-qty {
        text-align: center;
        font-weight: 700;
      }

      .offer-item-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.625rem;
        height: 2.625rem;
        padding: 0;
        border-radius: var(--radius-md, 10px);
        border: 1.5px solid color-mix(in srgb, var(--danger, #DC2626) 28%, transparent);
        background: color-mix(in srgb, var(--danger, #DC2626) 7%, transparent);
        color: var(--danger, #DC2626);
        cursor: pointer;
        transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }

      .offer-item-remove:hover {
        background: var(--danger, #DC2626);
        border-color: var(--danger, #DC2626);
        color: #ffffff;
      }

      .offer-item-remove .material-symbols-outlined {
        font-size: 18px;
      }

      .offer-items-empty {
        margin: 0;
        padding: 0.85rem;
        border: 1.5px dashed var(--card-border, #E9D5FF);
        border-radius: var(--radius-md, 10px);
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-muted, #6B7280);
      }

      /* ─── Add-on table rows ─────────────────────────────────────── */

      .addon-identity {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-width: 0;
      }

      .addon-thumb {
        width: 2.75rem;
        height: 2.75rem;
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md, 10px);
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        color: var(--primary, #7E22CE);
        overflow: hidden;
      }

      .addon-thumb.is-empty {
        border-style: dashed;
      }

      .addon-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .addon-thumb .material-symbols-outlined {
        font-size: 20px;
        opacity: 0.5;
      }

      .addon-name {
        min-width: 0;
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .addon-price {
        font-size: 0.8125rem;
        font-weight: 800;
        color: var(--primary, #7E22CE);
      }

      /* The same dot the offer cards use, so a live record reads the same
         on the table as it does on a card. */
      .addon-state-dot {
        width: 6px;
        height: 6px;
        margin-right: 0.3rem;
        border-radius: 50%;
        background: currentColor;
        flex: none;
      }

      .addon-row-actions {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
      }

      /* On a card these two stretch to share the row; in a table cell they
         are a pair of fixed squares instead. */
      .addon-row-actions .offer-btn {
        flex: none;
        width: 2rem;
        height: 2rem;
        padding: 0;
      }

      .addon-row-actions .offer-btn .material-symbols-outlined {
        font-size: 17px;
      }
    `,
    /* Must come last: it resets the card markup and then builds each design
       back up. See the note at the top of dish-layout.styles.ts. */
    DISH_LAYOUT_CSS,
  ]
})
export class ProductsComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public dishLayout = inject(DishLayoutService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  /**
   * Card designs replace the table; Menu Table recolours it instead, because
   * the table already carries selection, SKU, status, the stock bar and the
   * row actions and a card grid cannot show all of that at once.
   */
  public get showCatalogCards(): boolean {
    return this.dishLayout.enabled() && this.dishLayout.activeKey() !== 'table';
  }

  /** Dishes whose photo failed to load, so the card falls back to the icon. */
  private brokenCardImages = new Set<number>();

  public hasCardImage(p: Product): boolean {
    return !!p.image_url && !this.brokenCardImages.has(p.id);
  }

  public onCardImageError(p: Product): void {
    this.brokenCardImages.add(p.id);
  }

  public products: (Product & { selected?: boolean })[] = [];
  public categories: Category[] = [];

  public addonsList: ProductAddon[] = [];
  public combosList: ComboDeal[] = [];

  /** Total dishes in the bundle, not the number of distinct lines: a combo of
   *  2x  + 2x Ayran reads as 4 items on the plate. */
  public comboUnitCount(combo: ComboDeal): number {
    return (combo.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  }

  /** Saving as a share of the undiscounted price. Returns 0 when there is no
   *  original to compare against, which the template treats as "do not show":
   *  a bare currency saving means nothing without the basis.  */
  public comboSavingsPercent(combo: ComboDeal): number {
    const original = Number(combo.original_price) || 0;
    const price = Number(combo.combo_price) || 0;
    if (original <= 0 || price >= original) return 0;
    return Math.round(((original - price) / original) * 100);
  }

  public showAddonModal = false;
  public showComboModal = false;

  public editingAddon: ProductAddon | null = null;
  public editingCombo: ComboDeal | null = null;

  public addonForm: any = { name: '', price: 20, is_available: true, category: 'Sides', image_url: '' };
  public comboForm: any = { name: '', code: '', description: '', combo_price: 299, original_price: 350, items: [], image_url: '' };

  // ─── Photos on add-ons and combo deals ───────────────────────────────
  // All three ride the dish image endpoint: it takes a data URL and hands
  // back a stored path, with no notion of what the picture is of. One
  // handler serves all three forms because the only thing that differs is
  // which form object receives the returned url.

  private static readonly IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  private static readonly IMAGE_MAX_MB = 2;

  /** Which form is mid-upload, so only that picker shows the busy state. */
  public uploadingImageFor: 'addon' | 'combo' | null = null;

  public onOfferImageFile(
    event: Event,
    picker: HTMLInputElement,
    form: any,
    kind: 'addon' | 'combo'
  ): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared straight away so re-picking the same file after a failure
    // still fires a change event.
    picker.value = '';
    if (!file) return;

    if (!ProductsComponent.IMAGE_TYPES.includes(file.type)) {
      this.notify.error('Image must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > ProductsComponent.IMAGE_MAX_MB * 1024 * 1024) {
      this.notify.error(
        `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${ProductsComponent.IMAGE_MAX_MB} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.uploadingImageFor = null;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.productService.uploadProductImage(String(reader.result)).subscribe({
        next: (res) => {
          this.uploadingImageFor = null;
          if (res?.success && res.data?.url) {
            form.image_url = res.data.url;
            this.notify.success('Image uploaded — save to apply it.');
          } else {
            this.notify.error(res?.message || 'Image upload failed.');
          }
        },
        error: (err) => {
          this.uploadingImageFor = null;
          this.notify.error(err?.error?.message || 'Image upload failed.');
        },
      });
    };
    this.uploadingImageFor = kind;
    reader.readAsDataURL(file);
  }

  /** Offer records whose photo 404s, so the tile falls back to its icon. */
  private brokenOfferImages = new Set<string>();

  public hasOfferImage(kind: string, id: number, url?: string | null): boolean {
    return !!url && !this.brokenOfferImages.has(kind + ':' + id);
  }

  public onOfferImageError(kind: string, id: number): void {
    this.brokenOfferImages.add(kind + ':' + id);
  }

  public activeNavTab = 'overview';

  /** Add-ons and combo deals are their own records, not dishes, so the
   *  dish-shaped filters and the dish table only apply outside them. */
  get isCatalogTab(): boolean {
    return !['addons', 'combos'].includes(this.activeNavTab);
  }

  get searchPlaceholder(): string {
    switch (this.activeNavTab) {
      case 'addons': return 'Search add-on name or category...';
      case 'combos': return 'Search combo name or code...';
      default: return 'Search dish name, SKU, category...';
    }
  }

  get currentCountLabel(): string {
    switch (this.activeNavTab) {
      case 'addons': return `${this.filteredAddons.length} add-ons`;
      case 'combos': return `${this.filteredCombos.length} combo deals`;
      default: return `${this.filteredProducts.length} dishes`;
    }
  }

  get filteredAddons(): ProductAddon[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.addonsList;
    return this.addonsList.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q)
    );
  }

  get filteredCombos(): ComboDeal[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.combosList;
    return this.combosList.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
    );
  }

  public selectAll = false;

  public pageSize = 10;
  public currentPage = 1;
  public searchQuery = '';
  public selectedCategory: number | undefined = undefined;
  public selectedStatus = '';
  public stockFilter = 'ALL';
  public sortBy = 'name';

  public statusOptions: DropdownOption[] = [
    { value: '', label: 'All Statuses', icon: 'toggle_on' },
    { value: 'ACTIVE', label: 'Active Only', icon: 'check_circle' },
    { value: 'INACTIVE', label: 'Inactive Only', icon: 'pause_circle' },
  ];

  public stockFilterOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Stock Levels', icon: 'inventory' },
    { value: 'LOW', label: 'Low Stock Alert', icon: 'warning' },
    { value: 'IN_STOCK', label: 'In Stock Only', icon: 'check_box' },
  ];

  public sortOptions: DropdownOption[] = [
    { value: 'name', label: 'Sort: Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'price_asc', label: 'Sort: Price (Low to High)', icon: 'arrow_upward' },
    { value: 'price_desc', label: 'Sort: Price (High to Low)', icon: 'arrow_downward' },
    { value: 'stock', label: 'Sort: Stock Level', icon: 'bar_chart' },
  ];

  get categoryOptions(): DropdownOption[] {
    return [
      { value: undefined, label: 'All Categories', icon: 'category' },
      ...this.categories.map((c) => ({
        value: c.id,
        label: c.name,
        icon: 'restaurant_menu',
      })),
    ];
  }

  get formCategoryOptions(): DropdownOption[] {
    return this.categories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: 'restaurant_menu',
      description: c.description || 'Menu Category',
    }));
  }

  public formStatusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE', icon: 'check_circle', description: 'Item available on POS menu' },
    { value: 'INACTIVE', label: 'INACTIVE', icon: 'block', description: 'Item hidden from POS menu' },
  ];


  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadAddons();
    this.loadCombos();
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        if (res.success) {
          // Only used to label rows and fill the filter dropdown now — the
          // Add/Edit page picks its own default category.
          this.categories = res.data;
        }
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => { },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.loadError = null;
    this.productService
      // Fetched unfiltered on purpose - the toolbar filters run over this list
      // client-side, so narrowing it here would strand rows that a later
      // widening of the filters should bring back.
      .getProducts(1, 200)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.products = res.data.map((p) => ({ ...p, selected: false }));
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  loadAddons(): void {
    this.productService.getAddons().subscribe({
      next: (res) => {
        if (res.success) {
          this.addonsList = res.data;
        }
      },
      error: () => { },
    });
  }

  loadCombos(): void {
    this.productService.getComboDeals().subscribe({
      next: (res) => {
        if (res.success) {
          this.combosList = res.data;
        }
      },
      error: () => { },
    });
  }


  openAddonModal(addon?: ProductAddon): void {
    this.editingAddon = addon || null;
    this.addonForm = addon
      ? {
        name: addon.name,
        price: addon.price,
        is_available: !!addon.is_available,
        category: addon.category || 'Sides',
        image_url: addon.image_url || '',
      }
      : { name: '', price: 20, is_available: true, category: 'Sides', image_url: '' };
    this.showAddonModal = true;
  }

  saveAddon(): void {
    if (!this.addonForm.name) {
      this.notify.error('Please enter add-on name');
      return;
    }
    const obs = this.editingAddon
      ? this.productService.updateAddon(this.editingAddon.id, this.addonForm)
      : this.productService.createAddon(this.addonForm);

    obs.subscribe({
      next: () => {
        this.notify.success(`Add-on ${this.editingAddon ? 'updated' : 'created'} successfully`);
        this.showAddonModal = false;
        this.loadAddons();
      },
      error: (err) => this.notify.error(err?.error?.message || 'Failed to save add-on'),
    });
  }

  deleteAddon(id: number): void {
    this.notify.confirm({
      title: 'Delete Add-on',
      message: 'Are you sure you want to delete this add-on?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.productService.deleteAddon(id).subscribe({
          next: () => {
            this.notify.info('Add-on deleted');
            this.loadAddons();
          },
          error: (err) => this.notify.error(err?.error?.message || 'Failed to delete add-on'),
        });
      },
    });
  }

  openComboModal(combo?: ComboDeal): void {
    this.editingCombo = combo || null;
    this.comboForm = combo
      ? {
        name: combo.name,
        code: combo.code || '',
        description: combo.description || '',
        combo_price: combo.combo_price,
        original_price: combo.original_price || combo.combo_price,
        image_url: combo.image_url || '',
        items: combo.items ? [...combo.items] : [],
      }
      : {
        name: '',
        code: '',
        description: '',
        combo_price: 299,
        original_price: 350,
        image_url: '',
        items: this.products.length > 0 ? [{ product_id: this.products[0].id, quantity: 1 }] : [],
      };
    this.showComboModal = true;
  }

  addComboItem(): void {
    if (this.products.length > 0) {
      this.comboForm.items.push({ product_id: this.products[0].id, quantity: 1 });
    }
  }

  removeComboItem(index: number): void {
    this.comboForm.items.splice(index, 1);
  }

  saveCombo(): void {
    if (!this.comboForm.name) {
      this.notify.error('Please enter combo deal name');
      return;
    }
    const obs = this.editingCombo
      ? this.productService.updateComboDeal(this.editingCombo.id, this.comboForm)
      : this.productService.createComboDeal(this.comboForm);

    obs.subscribe({
      next: () => {
        this.notify.success(`Combo deal ${this.editingCombo ? 'updated' : 'created'} successfully`);
        this.showComboModal = false;
        this.loadCombos();
      },
      error: (err) => this.notify.error(err?.error?.message || 'Failed to save combo deal'),
    });
  }

  deleteCombo(id: number): void {
    this.notify.confirm({
      title: 'Delete Combo Deal',
      message: 'Are you sure you want to delete this combo deal?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.productService.deleteComboDeal(id).subscribe({
          next: () => {
            this.notify.info('Combo deal deleted');
            this.loadCombos();
          },
          error: (err) => this.notify.error(err?.error?.message || 'Failed to delete combo deal'),
        });
      },
    });
  }

  /**
   * Stock a dish actually has.
   *
   * Since dish variants arrived, stock lives on the linked ledger item
   * (stock_items.current_quantity, surfaced as linked_stock_quantity) — that is
   * what Purchase Entry and Adjustment move, and what checkout deducts from.
   * The legacy per-product counter is only mirrored in some paths, so reading
   * it alone reported every dish as out of stock. Prefer the ledger, fall back
   * to the old column for rows that have no ledger item.
   */
  stockOf(p: Product): number {
    // A product with no ledger row comes back with linked_stock_quantity NULL,
    // and Number(null) is 0 — which is finite, so a plain isFinite check
    // swallowed the fallback and reported every such dish as out of stock.
    // The null/undefined test has to come first.
    const ledger = p.linked_stock_quantity;
    if (ledger !== null && ledger !== undefined && `${ledger}`.trim() !== '') {
      const n = Number(ledger);
      if (Number.isFinite(n)) return n;
    }
    return Number(p.current_stock) || 0;
  }

  /** True only when the dish genuinely has nothing left. */
  isOutOfStock(p: Product): boolean {
    return this.stockOf(p) <= 0;
  }

  get activeCount(): number {
    return this.products.filter((p) => p.status === 'ACTIVE').length;
  }

  get lowStockCount(): number {
    return this.products.filter((p) => this.stockOf(p) <= p.low_stock_threshold).length;
  }

  get stockHealthPercent(): number {
    if (this.products.length === 0) return 100;
    const healthy = this.products.length - this.lowStockCount;
    return Math.round((healthy / this.products.length) * 100);
  }

  get totalInventoryValue(): number {
    return this.products.reduce((sum, p) => sum + this.stockOf(p) * p.selling_price, 0);
  }

  get filteredProducts(): (Product & { selected?: boolean })[] {
    let list = this.products;

    // Search, category and status are applied here rather than re-queried on
    // every keystroke: the catalog is already loaded in full, so filtering it
    // locally keeps the table in step with the input and lets clearing a
    // filter restore rows without another round trip.
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategory !== undefined && this.selectedCategory !== null) {
      list = list.filter((p) => p.category_id === this.selectedCategory);
    }

    if (this.selectedStatus) {
      list = list.filter((p) => p.status === this.selectedStatus);
    }

    if (this.activeNavTab === 'active') {
      list = list.filter((p) => p.status === 'ACTIVE');
    } else if (this.activeNavTab === 'low_stock') {
      list = list.filter((p) => this.stockOf(p) <= p.low_stock_threshold);
    }

    if (this.stockFilter === 'LOW') {
      list = list.filter((p) => this.stockOf(p) <= p.low_stock_threshold);
    } else if (this.stockFilter === 'IN_STOCK') {
      list = list.filter((p) => this.stockOf(p) > p.low_stock_threshold);
    }

    if (this.sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.selling_price - a.selling_price);
    } else if (this.sortBy === 'stock') {
      list = [...list].sort((a, b) => this.stockOf(a) - this.stockOf(b));
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }

  /**
   * The current page, never past the end of the filtered list.
   *
   * Deleting the last rows on the final page, or any refresh that returns
   * fewer records, used to leave `currentPage` pointing past the end and the
   * table rendering empty. Clamped on read rather than written back, so it
   * cannot fire a change-after-checked error during rendering.
   */
  get safePage(): number {
    return Math.min(Math.max(1, this.currentPage), this.totalPages);
  }

  get paginatedProducts(): (Product & { selected?: boolean })[] {
    const list = this.filteredProducts;
    const start = (this.safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredProducts.length === 0 ? 0 : (this.safePage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.safePage * this.pageSize, this.filteredProducts.length);
  }

  calcStockPercent(curr: number, threshold: number): number {
    const max = threshold * 3 || 30;
    return Math.min(100, Math.max(0, (curr / max) * 100));
  }

  toggleSelectAll(): void {
    this.paginatedProducts.forEach((p) => (p.selected = this.selectAll));
  }

  deleteSelected(): void {
    const selected = this.products.filter((p) => p.selected);
    if (selected.length === 0) {
      this.notify.info('No products selected');
      return;
    }

    this.notify.confirm({
      title: 'Delete Selected Dishes',
      message: `Are you sure you want to delete ${selected.length} selected dishes?`,
      confirmText: 'Delete All Selected',
      isDestructive: true,
      onConfirm: () => {
        let count = 0;
        selected.forEach((p) => {
          this.productService.deleteProduct(p.id).subscribe({
            next: () => {
              count++;
              if (count === selected.length) {
                this.notify.success(`${count} dishes removed from catalog`);
                this.loadProducts();
              }
            },
            // Reported by the global error interceptor; present so a failure
            // cannot escape as an unhandled rejection.
            error: () => { },
          });
        });
      },
    });
  }

  /** Add, edit and view each live on their own route. */
  goToAdd(): void {
    this.router.navigate(['/products/new']);
  }

  goToEdit(product: Product): void {
    this.router.navigate(['/products', product.id, 'edit']);
  }

  goToView(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  deleteProduct(product: Product): void {
    this.notify.confirm({
      title: 'Delete Product',
      message: `Delete dish "${product.name}"?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.notify.info('Product deleted');
            this.loadProducts();
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => { },
        });
      },
    });
  }

  exportCSV(): void {
    // Export follows the open tab, so the button means the same thing
    // everywhere: "download what I am looking at".
    const q = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    let name: string;
    let headers: string[];
    let rows: any[][];

    switch (this.activeNavTab) {
      case 'addons':
        name = 'menu_addons';
        headers = ['Name', 'Category', 'Price', 'Available'];
        rows = this.filteredAddons.map((a) => [q(a.name), q(a.category || 'General'), a.price, a.is_available ? 'Yes' : 'No']);
        break;

      case 'combos':
        name = 'menu_combo_deals';
        headers = ['Code', 'Name', 'Combo Price', 'Original Price', 'Savings', 'Items', 'Available'];
        rows = this.filteredCombos.map((c) => [
          q(c.code), q(c.name), c.combo_price, c.original_price ?? '', c.savings_amount ?? '',
          c.items?.length ?? 0, c.is_available ? 'Yes' : 'No',
        ]);
        break;

      default:
        name = 'menu_products';
        headers = ['SKU', 'Name', 'Category', 'Selling Price', 'Cost Price', 'Stock', 'Status'];
        rows = this.products.map((p) => [
          q(p.sku), q(p.name), q(p.category_name || ''),
          p.selling_price, p.cost_price, this.stockOf(p), p.status,
        ]);
        break;
    }

    if (rows.length === 0) {
      this.notify.info('Nothing to export on this tab');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Export downloaded');
  }

  getCategoryBadgeStyle(categoryName?: string): { [key: string]: string } {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
      return {
        'background-color': 'var(--warning-light, #FFFBEB)',
        'color': 'var(--warning, #B45309)',
        'border': '1px solid var(--warning-light, #FDE68A)'
      };
    }
    if (cat.includes('chicken') || cat.includes('meat') || cat.includes('mutton') || cat.includes('beef') || cat.includes('grill')) {
      return {
        'background-color': 'var(--bg-app, #FAF5FF)',
        'color': 'var(--primary, #7E22CE)',
        'border': '1px solid var(--card-border, #E9D5FF)'
      };
    }
    if (cat.includes('appetizer') || cat.includes('salad') || cat.includes('soup') || cat.includes('veg')) {
      return {
        'background-color': '#F0FDF4',
        'color': 'var(--success, #15803D)',
        'border': '1px solid var(--success-light, #BBF7D0)'
      };
    }
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('cake') || cat.includes('ice')) {
      return {
        'background-color': '#FFF1F2',
        'color': '#BE123C',
        'border': '1px solid #FECDD3'
      };
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee')) {
      return {
        'background-color': '#F0FDFA',
        'color': '#0F766E',
        'border': '1px solid #99F6E4'
      };
    }
    if (cat.includes('sea') || cat.includes('fish') || cat.includes('prawn')) {
      return {
        'background-color': '#EFF6FF',
        'color': '#1D4ED8',
        'border': '1px solid #BFDBFE'
      };
    }
    return {
      'background-color': '#EEF2FF',
      'color': '#4338CA',
      'border': '1px solid #C7D2FE'
    };
  }

  getCategoryIcon(categoryName?: string): string {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
      return 'rice_bowl';
    }
    if (cat.includes('chicken') || cat.includes('meat') || cat.includes('mutton') || cat.includes('beef') || cat.includes('grill')) {
      return 'kebab_dining';
    }
    if (cat.includes('appetizer') || cat.includes('salad') || cat.includes('soup') || cat.includes('veg')) {
      return 'lunch_dining';
    }
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('cake') || cat.includes('ice')) {
      return 'icecream';
    }
    if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice') || cat.includes('tea') || cat.includes('coffee')) {
      return 'local_cafe';
    }
    if (cat.includes('sea') || cat.includes('fish') || cat.includes('prawn')) {
      return 'set_meal';
    }
    return 'category';
  }
}

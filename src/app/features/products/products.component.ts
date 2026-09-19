import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product, Category, ProductAddon, ComboMeal, MealDeal } from '../../core/models';
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
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Menu Catalog</span>
        <span class="breadcrumb-separator">›</span>
        <span>Dishes & Products</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Live Menu</span>
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
            <span>New Combo Meal</span>
          </button>

          <button
            *ngIf="activeNavTab === 'deals'"
            type="button"
            (click)="openDealModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>New Meal Deal</span>
          </button>

          <button
            *ngIf="!['addons', 'combos', 'deals'].includes(activeNavTab)"
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
      <div class="module-tabs-bar">
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

        <button
          type="button"
          (click)="activeNavTab = 'addons'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'addons'"
        >
          <span class="material-symbols-outlined">extension</span>
          <span>Add-ons</span>
          <span class="tab-count-badge">{{ addonsList.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'combos'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'combos'"
        >
          <span class="material-symbols-outlined">lunch_dining</span>
          <span>Combo Meals</span>
          <span class="tab-count-badge">{{ combosList.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'deals'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'deals'"
        >
          <span class="material-symbols-outlined">local_offer</span>
          <span>Meal Deals</span>
          <span class="tab-count-badge">{{ dealsList.length }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
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
              placeholder="Search dish name, SKU, category..."
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

          <!-- Category Selector -->
          <app-custom-dropdown
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            (valueChange)="currentPage = 1"
            placeholder="All Categories"
            minWidth="175px"
          ></app-custom-dropdown>

          <!-- Status Selector -->
          <app-custom-dropdown
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            (valueChange)="currentPage = 1"
            placeholder="All Statuses"
            minWidth="155px"
          ></app-custom-dropdown>

          <!-- Stock Status Selector -->
          <app-custom-dropdown
            [options]="stockFilterOptions"
            [(ngModel)]="stockFilter"
            (valueChange)="currentPage = 1"
            placeholder="All Stock Levels"
            minWidth="170px"
          ></app-custom-dropdown>

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ filteredProducts.length }} dishes
          </span>
        </div>

        <div class="toolbar-actions-group">
          <!-- Sort Dropdown -->
          <app-custom-dropdown
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
      <!-- 5. PRODUCTS DATA TABLE / ADD-ONS / COMBOS / DEALS               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">

        <!-- ─── TAB: ADD-ONS ─── -->
        <div *ngIf="activeNavTab === 'addons'" class="p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-black text-[#2E1065]">Dish Add-ons & Modifiers</h3>
              <p class="text-xs text-gray-500">Extra sauces, toppings, portions and customizations selectable at POS order taking</p>
            </div>
            <button type="button" (click)="openAddonModal()" class="action-btn btn-gradient-purple !py-1.5 !px-3 !text-xs">
              <span class="material-symbols-outlined !text-sm">add</span>
              <span>Create Add-on</span>
            </button>
          </div>

          <div class="table-responsive-wrapper">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Add-on Name</th>
                  <th style="width: 20%;">Category</th>
                  <th style="width: 20%;">Price (₹ / SAR)</th>
                  <th style="width: 20%;">Availability</th>
                  <th style="width: 15%; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of addonsList">
                  <td class="font-bold text-xs text-[var(--text-main)]">{{ a.name }}</td>
                  <td>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {{ a.category || 'General' }}
                    </span>
                  </td>
                  <td class="font-mono font-bold text-xs text-purple-900">+{{ a.price | appCurrency:'1.0-2' }}</td>
                  <td>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="a.is_available ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'">
                      {{ a.is_available ? '● Available' : '○ Unavailable' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <div class="flex items-center justify-center gap-1.5">
                      <button type="button" (click)="openAddonModal(a)" class="action-btn btn-outline-purple !p-1" title="Edit">
                        <span class="material-symbols-outlined !text-sm">edit</span>
                      </button>
                      <button type="button" (click)="deleteAddon(a.id)" class="action-btn btn-outline-purple !p-1 text-red-600 hover:bg-red-50" title="Delete">
                        <span class="material-symbols-outlined !text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="addonsList.length === 0">
                  <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-box">
                      <span class="material-symbols-outlined empty-icon">extension</span>
                      <div class="empty-title">No Add-ons Created</div>
                      <p class="empty-desc">Click "Create Add-on" to configure extra toppings, sauces, or sides.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── TAB: COMBO MEALS ─── -->
        <div *ngIf="activeNavTab === 'combos'" class="p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-black text-[#2E1065]">Combo Meals & Value Bundles</h3>
              <p class="text-xs text-gray-500">Bundled dishes with promotional pricing and clear customer savings</p>
            </div>
            <button type="button" (click)="openComboModal()" class="action-btn btn-gradient-purple !py-1.5 !px-3 !text-xs">
              <span class="material-symbols-outlined !text-sm">add</span>
              <span>Create Combo Meal</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let c of combosList" class="p-4 rounded-2xl border border-[#E9D5FF] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{{ c.code || 'COMBO' }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="c.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                    {{ c.is_available ? '● Live' : '○ Inactive' }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-[#2E1065] mb-1">{{ c.name }}</h4>
                <p class="text-xs text-gray-600 mb-3">{{ c.description || 'Special combo bundle' }}</p>

                <!-- Included items list -->
                <div class="p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs mb-3 space-y-1">
                  <div class="font-bold text-[10px] uppercase text-purple-800 tracking-wider mb-1">Includes:</div>
                  <div *ngFor="let item of c.items" class="flex items-center justify-between text-gray-700">
                    <span>{{ item.quantity }}x {{ item.product_name || 'Dish' }}</span>
                  </div>
                  <div *ngIf="!c.items?.length" class="text-gray-400 italic">No items linked</div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-100 mb-3">
                  <div>
                    <span class="text-base font-black text-emerald-600 font-mono">{{ c.combo_price | appCurrency:'1.0-2' }}</span>
                    <span *ngIf="c.original_price && c.original_price > c.combo_price" class="text-xs text-gray-400 line-through ml-1.5 font-mono">{{ c.original_price | appCurrency:'1.0-2' }}</span>
                  </div>
                  <span *ngIf="c.savings_amount && c.savings_amount > 0" class="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Save {{ c.savings_amount | appCurrency:'1.0-0' }}
                  </span>
                </div>

                <div class="flex items-center justify-end gap-2">
                  <button type="button" (click)="openComboModal(c)" class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs">
                    <span class="material-symbols-outlined !text-sm">edit</span>
                    <span>Edit</span>
                  </button>
                  <button type="button" (click)="deleteCombo(c.id)" class="action-btn btn-outline-purple !py-1 !px-2 !text-xs text-red-600 hover:bg-red-50">
                    <span class="material-symbols-outlined !text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="combosList.length === 0" class="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-2">
            <span class="material-symbols-outlined text-4xl text-purple-400 mb-2">lunch_dining</span>
            <h4 class="text-sm font-bold text-gray-700">No Combo Meals Created</h4>
            <p class="text-xs text-gray-500">Create delicious bundles like "Duo Mandi Combo" or "Family Pack".</p>
          </div>
        </div>

        <!-- ─── TAB: MEAL DEALS ─── -->
        <div *ngIf="activeNavTab === 'deals'" class="p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-base font-black text-[#2E1065]">Promotional Meal Deals & Limited Offers</h3>
              <p class="text-xs text-gray-500">Scheduled promotions (Friday Feast, Lunch Special, Happy Hour) with discounts</p>
            </div>
            <button type="button" (click)="openDealModal()" class="action-btn btn-gradient-purple !py-1.5 !px-3 !text-xs">
              <span class="material-symbols-outlined !text-sm">add</span>
              <span>Create Meal Deal</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let d of dealsList" class="p-4 rounded-2xl border border-[#E9D5FF] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{{ d.code || 'DEAL' }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="d.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                    {{ d.is_active ? '● Active' : '○ Inactive' }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-[#2E1065] mb-1">{{ d.title }}</h4>
                <p class="text-xs text-gray-600 mb-2">{{ d.description || 'Limited time meal deal' }}</p>

                <!-- Schedule Pill -->
                <div class="flex items-center gap-1.5 text-[11px] text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 mb-3 font-semibold">
                  <span class="material-symbols-outlined text-sm">schedule</span>
                  <span>Days: {{ d.days_of_week || 'ALL' }} | {{ d.start_time || '00:00' }} - {{ d.end_time || '23:59' }}</span>
                </div>

                <!-- Included items -->
                <div class="p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs mb-3 space-y-1">
                  <div class="font-bold text-[10px] uppercase text-purple-800 tracking-wider mb-1">Items Included:</div>
                  <div *ngFor="let item of d.items" class="flex items-center justify-between text-gray-700">
                    <span>{{ item.quantity }}x {{ item.product_name || 'Dish' }}</span>
                  </div>
                  <div *ngIf="!d.items?.length" class="text-gray-400 italic">No dishes attached</div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-100 mb-3">
                  <div>
                    <span class="text-base font-black text-purple-900 font-mono">{{ d.deal_price | appCurrency:'1.0-2' }}</span>
                  </div>
                  <span *ngIf="d.discount_percentage && d.discount_percentage > 0" class="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {{ d.discount_percentage }}% OFF
                  </span>
                </div>

                <div class="flex items-center justify-end gap-2">
                  <button type="button" (click)="openDealModal(d)" class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs">
                    <span class="material-symbols-outlined !text-sm">edit</span>
                    <span>Edit</span>
                  </button>
                  <button type="button" (click)="deleteDeal(d.id)" class="action-btn btn-outline-purple !py-1 !px-2 !text-xs text-red-600 hover:bg-red-50">
                    <span class="material-symbols-outlined !text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="dealsList.length === 0" class="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-2">
            <span class="material-symbols-outlined text-4xl text-purple-400 mb-2">local_offer</span>
            <h4 class="text-sm font-bold text-gray-700">No Meal Deals Created</h4>
            <p class="text-xs text-gray-500">Create time-sensitive specials like "Friday Feast" or "Lunch Special 20% Off".</p>
          </div>
        </div>

        <!-- ─── STANDARD DISH CATALOG ─── -->
        <div *ngIf="!['addons', 'combos', 'deals'].includes(activeNavTab)" [ngClass]="dishLayout.rootClass()" [ngStyle]="dishLayout.pageCssVars()">

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

      <!-- Combo Meal Modal -->
      <div class="modal-backdrop" *ngIf="showComboModal">
        <div class="modal-content shadow-2xl max-w-lg">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-purple-200">
            <h3 class="text-lg font-black text-[#2E1065]">{{ editingCombo ? 'Edit Combo Meal' : 'Create Combo Meal' }}</h3>
            <button type="button" (click)="showComboModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form (ngSubmit)="saveCombo()" class="space-y-3">
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Combo Meal Name</label>
              <input type="text" [(ngModel)]="comboForm.name" name="comboName" class="form-control text-sm" placeholder="e.g. Duo Mandi Combo" required />
            </div>
            <div>
              <label class="form-label text-xs font-bold text-gray-700 uppercase">Description</label>
              <input type="text" [(ngModel)]="comboForm.description" name="comboDesc" class="form-control text-sm" placeholder="e.g. 2 Mandi + 2 Drinks + Salad" />
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
            <!-- Included Items Section -->
            <div class="pt-2 border-t border-purple-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-purple-900 uppercase">Included Dishes</span>
                <button type="button" (click)="addComboItem()" class="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">add_circle</span> Add Dish
                </button>
              </div>
              <div *ngFor="let item of comboForm.items; let idx = index" class="flex items-center gap-2 mb-2">
                <select [(ngModel)]="item.product_id" name="comboItemProd_{{idx}}" class="form-control text-xs flex-1">
                  <option *ngFor="let p of products" [value]="p.id">{{ p.name }} (₹{{ p.selling_price }})</option>
                </select>
                <input type="number" min="1" [(ngModel)]="item.quantity" name="comboItemQty_{{idx}}" class="form-control text-xs w-16 text-center" placeholder="Qty" />
                <button type="button" (click)="removeComboItem(idx)" class="text-red-500 hover:text-red-700 p-1">
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button type="button" (click)="showComboModal = false" class="action-btn btn-outline-purple">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple">Save Combo Meal ✓</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Meal Deal Modal -->
      <div class="modal-backdrop" *ngIf="showDealModal">
        <div class="modal-content shadow-2xl max-w-lg">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-purple-200">
            <h3 class="text-lg font-black text-[#2E1065]">{{ editingDeal ? 'Edit Meal Deal' : 'Create Meal Deal' }}</h3>
            <button type="button" (click)="showDealModal = false" class="modal-close-btn"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form (ngSubmit)="saveDeal()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Deal Title</label>
                <input type="text" [(ngModel)]="dealForm.title" name="dealTitle" class="form-control text-sm" placeholder="e.g. Friday Family Feast" required />
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Promo Code</label>
                <input type="text" [(ngModel)]="dealForm.code" name="dealCode" class="form-control font-mono text-sm" placeholder="e.g. FRIDAY50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Deal Price (₹)</label>
                <input type="number" step="any" min="0" [(ngModel)]="dealForm.deal_price" name="dealPrice" class="form-control text-sm font-mono font-bold text-purple-900" required />
              </div>
              <div>
                <label class="form-label text-xs font-bold text-gray-700 uppercase">Discount (%)</label>
                <input type="number" min="0" max="100" [(ngModel)]="dealForm.discount_percentage" name="dealDiscount" class="form-control text-sm font-mono" placeholder="e.g. 20" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="form-label text-[10px] font-bold text-gray-700 uppercase">Days of Week</label>
                <input type="text" [(ngModel)]="dealForm.days_of_week" name="dealDays" class="form-control text-xs" placeholder="ALL or FRI,SAT" />
              </div>
              <div>
                <label class="form-label text-[10px] font-bold text-gray-700 uppercase">Start Time</label>
                <input type="time" [(ngModel)]="dealForm.start_time" name="dealStart" class="form-control text-xs" />
              </div>
              <div>
                <label class="form-label text-[10px] font-bold text-gray-700 uppercase">End Time</label>
                <input type="time" [(ngModel)]="dealForm.end_time" name="dealEnd" class="form-control text-xs" />
              </div>
            </div>
            <!-- Included Items Section -->
            <div class="pt-2 border-t border-purple-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-purple-900 uppercase">Included Dishes</span>
                <button type="button" (click)="addDealItem()" class="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">add_circle</span> Add Dish
                </button>
              </div>
              <div *ngFor="let item of dealForm.items; let idx = index" class="flex items-center gap-2 mb-2">
                <select [(ngModel)]="item.product_id" name="dealItemProd_{{idx}}" class="form-control text-xs flex-1">
                  <option *ngFor="let p of products" [value]="p.id">{{ p.name }} (₹{{ p.selling_price }})</option>
                </select>
                <input type="number" min="1" [(ngModel)]="item.quantity" name="dealItemQty_{{idx}}" class="form-control text-xs w-16 text-center" placeholder="Qty" />
                <button type="button" (click)="removeDealItem(idx)" class="text-red-500 hover:text-red-700 p-1">
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
              <button type="button" (click)="showDealModal = false" class="action-btn btn-outline-purple">Cancel</button>
              <button type="submit" class="action-btn btn-gradient-purple">Save Meal Deal ✓</button>
            </div>
          </form>
        </div>
      </div>
  `,
  styles: [
    `
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

      .font-mono { font-family: 'JetBrains Mono', monospace; }

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
  public combosList: ComboMeal[] = [];
  public dealsList: MealDeal[] = [];

  public showAddonModal = false;
  public showComboModal = false;
  public showDealModal = false;

  public editingAddon: ProductAddon | null = null;
  public editingCombo: ComboMeal | null = null;
  public editingDeal: MealDeal | null = null;

  public addonForm: any = { name: '', price: 20, is_available: true, category: 'Sides' };
  public comboForm: any = { name: '', code: '', description: '', combo_price: 299, original_price: 350, items: [] };
  public dealForm: any = { title: '', code: '', description: '', deal_price: 499, discount_percentage: 20, days_of_week: 'ALL', start_time: '11:00', end_time: '23:00', items: [] };

  public activeNavTab = 'overview';
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
    this.loadDeals();
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
      error: () => {},
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.loadError = null;
    this.productService
      .getProducts(1, 200, this.searchQuery, this.selectedCategory, this.selectedStatus || undefined)
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
      error: () => {},
    });
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

  openAddonModal(addon?: ProductAddon): void {
    this.editingAddon = addon || null;
    this.addonForm = addon
      ? { name: addon.name, price: addon.price, is_available: !!addon.is_available, category: addon.category || 'Sides' }
      : { name: '', price: 20, is_available: true, category: 'Sides' };
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

  openComboModal(combo?: ComboMeal): void {
    this.editingCombo = combo || null;
    this.comboForm = combo
      ? {
          name: combo.name,
          code: combo.code || '',
          description: combo.description || '',
          combo_price: combo.combo_price,
          original_price: combo.original_price || combo.combo_price,
          items: combo.items ? [...combo.items] : [],
        }
      : {
          name: '',
          code: '',
          description: '',
          combo_price: 299,
          original_price: 350,
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
      this.notify.error('Please enter combo meal name');
      return;
    }
    const obs = this.editingCombo
      ? this.productService.updateCombo(this.editingCombo.id, this.comboForm)
      : this.productService.createCombo(this.comboForm);

    obs.subscribe({
      next: () => {
        this.notify.success(`Combo meal ${this.editingCombo ? 'updated' : 'created'} successfully`);
        this.showComboModal = false;
        this.loadCombos();
      },
      error: (err) => this.notify.error(err?.error?.message || 'Failed to save combo meal'),
    });
  }

  deleteCombo(id: number): void {
    this.notify.confirm({
      title: 'Delete Combo Meal',
      message: 'Are you sure you want to delete this combo meal?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.productService.deleteCombo(id).subscribe({
          next: () => {
            this.notify.info('Combo meal deleted');
            this.loadCombos();
          },
          error: (err) => this.notify.error(err?.error?.message || 'Failed to delete combo meal'),
        });
      },
    });
  }

  openDealModal(deal?: MealDeal): void {
    this.editingDeal = deal || null;
    this.dealForm = deal
      ? {
          title: deal.title,
          code: deal.code || '',
          description: deal.description || '',
          deal_price: deal.deal_price,
          discount_percentage: deal.discount_percentage || 0,
          days_of_week: deal.days_of_week || 'ALL',
          start_time: deal.start_time || '11:00',
          end_time: deal.end_time || '23:00',
          items: deal.items ? [...deal.items] : [],
        }
      : {
          title: '',
          code: '',
          description: '',
          deal_price: 499,
          discount_percentage: 20,
          days_of_week: 'ALL',
          start_time: '11:00',
          end_time: '23:00',
          items: this.products.length > 0 ? [{ product_id: this.products[0].id, quantity: 1 }] : [],
        };
    this.showDealModal = true;
  }

  addDealItem(): void {
    if (this.products.length > 0) {
      this.dealForm.items.push({ product_id: this.products[0].id, quantity: 1 });
    }
  }

  removeDealItem(index: number): void {
    this.dealForm.items.splice(index, 1);
  }

  saveDeal(): void {
    if (!this.dealForm.title) {
      this.notify.error('Please enter meal deal title');
      return;
    }
    const obs = this.editingDeal
      ? this.productService.updateDeal(this.editingDeal.id, this.dealForm)
      : this.productService.createDeal(this.dealForm);

    obs.subscribe({
      next: () => {
        this.notify.success(`Meal deal ${this.editingDeal ? 'updated' : 'created'} successfully`);
        this.showDealModal = false;
        this.loadDeals();
      },
      error: (err) => this.notify.error(err?.error?.message || 'Failed to save meal deal'),
    });
  }

  deleteDeal(id: number): void {
    this.notify.confirm({
      title: 'Delete Meal Deal',
      message: 'Are you sure you want to delete this meal deal?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.productService.deleteDeal(id).subscribe({
          next: () => {
            this.notify.info('Meal deal deleted');
            this.loadDeals();
          },
          error: (err) => this.notify.error(err?.error?.message || 'Failed to delete meal deal'),
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

  get paginatedProducts(): (Product & { selected?: boolean })[] {
    const list = this.filteredProducts;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredProducts.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
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
            error: () => {},
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
          error: () => {},
        });
      },
    });
  }

  exportCSV(): void {
    if (this.products.length === 0) {
      this.notify.info('No products to export');
      return;
    }

    const headers = ['SKU', 'Name', 'Category', 'Selling Price', 'Cost Price', 'Stock', 'Status'];
    const rows = this.products.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.category_name || '').replace(/"/g, '""')}"`,
      p.selling_price,
      p.cost_price,
      this.stockOf(p),
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `menu_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Export downloaded');
  }

  getCategoryBadgeStyle(categoryName?: string): { [key: string]: string } {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('mandi') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
      return {
        'background-color': '#FFFBEB',
        'color': '#B45309',
        'border': '1px solid #FDE68A'
      };
    }
    if (cat.includes('chicken') || cat.includes('meat') || cat.includes('mutton') || cat.includes('beef') || cat.includes('grill')) {
      return {
        'background-color': '#FAF5FF',
        'color': '#7E22CE',
        'border': '1px solid #E9D5FF'
      };
    }
    if (cat.includes('appetizer') || cat.includes('salad') || cat.includes('soup') || cat.includes('veg')) {
      return {
        'background-color': '#F0FDF4',
        'color': '#15803D',
        'border': '1px solid #BBF7D0'
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
    if (cat.includes('mandi') || cat.includes('madhbi') || cat.includes('madfoon') || cat.includes('rice') || cat.includes('biryani') || cat.includes('kabsa')) {
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

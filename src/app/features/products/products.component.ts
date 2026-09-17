import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product, Category } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
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
            type="button"
            (click)="openAddModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">add_circle</span>
            <span>+ New Dish</span>
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
      <!-- 5. PRODUCTS DATA TABLE                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
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
              <tr *ngFor="let p of paginatedProducts">
                <!-- Checkbox -->
                <td style="text-align: center;">
                  <input
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
                  <span class="badge badge-primary">
                    {{ p.category_name || 'General' }}
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
                      <span class="font-mono font-bold text-[#2E1065]">{{ p.current_stock }} units</span>
                      <span class="text-[#6B7280] text-[9px]">Min: {{ p.low_stock_threshold }}</span>
                    </div>
                    <div class="w-full bg-[#E9D5FF] rounded-full h-1.5 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [style.width.%]="calcStockPercent(p.current_stock, p.low_stock_threshold)"
                        [ngClass]="{
                          '!bg-[#DC2626]': p.current_stock <= 0,
                          '!bg-[#EA580C]': p.current_stock > 0 && p.current_stock <= p.low_stock_threshold,
                          '!bg-[#16A34A]': p.current_stock > p.low_stock_threshold
                        }"
                      ></div>
                    </div>
                  </div>
                </td>

                <!-- Actions -->
                <td style="text-align: center;">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      (click)="openEditModal(p)"
                      class="action-icon-btn text-[#7E22CE] hover:bg-[#F3E8FF]"
                      title="Edit Dish"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                    </button>
                    <button
                      type="button"
                      (click)="deleteProduct(p)"
                      class="action-icon-btn text-[#DC2626] hover:bg-[#FEE2E2]"
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
                      (click)="openAddModal()"
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

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR                                        -->
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

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 7. ADD / EDIT PRODUCT MODAL                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showProductModal">
        <div class="modal-content p-6 max-w-xl">
          <div class="flex items-center justify-between pb-3 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[#7E22CE] text-2xl">
                {{ editingProductId ? 'edit' : 'restaurant' }}
              </span>
              <h3 class="text-lg font-black text-[#2E1065]">
                {{ editingProductId ? 'Edit Product Dish' : 'Add New Menu Dish' }}
              </h3>
            </div>
            <button
              type="button"
              (click)="showProductModal = false"
              class="text-[#6B7280] hover:text-[#2E1065] p-1 rounded-lg hover:bg-[#F3E8FF]"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveProduct()" class="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Dish Name</label>
                <input
                  type="text"
                  [(ngModel)]="productForm.name"
                  name="name"
                  placeholder="e.g. Mutton Mandi Full"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">SKU / Item Code</label>
                <input
                  type="text"
                  [(ngModel)]="productForm.sku"
                  name="sku"
                  placeholder="e.g. MND-MUT-F"
                  class="form-control font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select [(ngModel)]="productForm.categoryId" name="categoryId" class="form-control" required>
                  <option *ngFor="let cat of categories" [ngValue]="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select [(ngModel)]="productForm.status" name="status" class="form-control">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                [(ngModel)]="productForm.description"
                name="description"
                rows="2"
                placeholder="Fragrant basmati rice served with roasted spiced meat..."
                class="form-control"
              ></textarea>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="form-group">
                <label class="form-label">Selling Price ({{ settingsService.currencySymbol() }})</label>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="productForm.sellingPrice"
                  name="sellingPrice"
                  class="form-control font-mono font-bold text-[#7E22CE]"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label">Cost Price ({{ settingsService.currencySymbol() }})</label>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="productForm.costPrice"
                  name="costPrice"
                  class="form-control font-mono"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="productForm.taxRate"
                  name="taxRate"
                  class="form-control font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="!editingProductId">
              <div class="form-group">
                <label class="form-label">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="productForm.initialStock"
                  name="initialStock"
                  class="form-control font-mono"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Low Stock Alert Level</label>
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="productForm.lowStockThreshold"
                  name="lowStockThreshold"
                  class="form-control font-mono"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showProductModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .action-icon-btn {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
      }
    `
  ]
})
export class ProductsComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);

  public products: (Product & { selected?: boolean })[] = [];
  public categories: Category[] = [];

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

  public showProductModal = false;
  public editingProductId: number | null = null;
  public productForm: any = {
    name: '',
    sku: '',
    categoryId: 1,
    description: '',
    sellingPrice: 0,
    costPrice: 0,
    taxRate: 5,
    initialStock: 20,
    lowStockThreshold: 10,
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data;
          if (this.categories.length > 0 && !this.productForm.categoryId) {
            this.productForm.categoryId = this.categories[0].id;
          }
        }
      },
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

  get activeCount(): number {
    return this.products.filter((p) => p.status === 'ACTIVE').length;
  }

  get lowStockCount(): number {
    return this.products.filter((p) => p.current_stock <= p.low_stock_threshold).length;
  }

  get stockHealthPercent(): number {
    if (this.products.length === 0) return 100;
    const healthy = this.products.length - this.lowStockCount;
    return Math.round((healthy / this.products.length) * 100);
  }

  get totalInventoryValue(): number {
    return this.products.reduce((sum, p) => sum + (p.current_stock * p.selling_price), 0);
  }

  get filteredProducts(): (Product & { selected?: boolean })[] {
    let list = this.products;

    if (this.activeNavTab === 'active') {
      list = list.filter((p) => p.status === 'ACTIVE');
    } else if (this.activeNavTab === 'low_stock') {
      list = list.filter((p) => p.current_stock <= p.low_stock_threshold);
    }

    if (this.stockFilter === 'LOW') {
      list = list.filter((p) => p.current_stock <= p.low_stock_threshold);
    } else if (this.stockFilter === 'IN_STOCK') {
      list = list.filter((p) => p.current_stock > p.low_stock_threshold);
    }

    if (this.sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.selling_price - a.selling_price);
    } else if (this.sortBy === 'stock') {
      list = [...list].sort((a, b) => a.current_stock - b.current_stock);
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
          });
        });
      },
    });
  }

  openAddModal(): void {
    this.editingProductId = null;
    this.productForm = {
      name: '',
      sku: '',
      categoryId: this.categories[0]?.id || 1,
      description: '',
      sellingPrice: 0,
      costPrice: 0,
      taxRate: 5,
      initialStock: 20,
      lowStockThreshold: 10,
      status: 'ACTIVE',
    };
    this.showProductModal = true;
  }

  openEditModal(product: Product): void {
    this.editingProductId = product.id;
    this.productForm = {
      name: product.name,
      sku: product.sku,
      categoryId: product.category_id,
      description: product.description,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price,
      taxRate: product.tax_rate,
      status: product.status,
    };
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (!this.productForm.name || !this.productForm.sku) {
      this.notify.error('Please enter name and SKU');
      return;
    }

    if (this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, this.productForm).subscribe({
        next: () => {
          this.notify.success('Product updated');
          this.showProductModal = false;
          this.loadProducts();
        },
      });
    } else {
      this.productService.createProduct(this.productForm).subscribe({
        next: () => {
          this.notify.success('Dish added to catalog');
          this.showProductModal = false;
          this.loadProducts();
        },
      });
    }
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
      p.current_stock,
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
}

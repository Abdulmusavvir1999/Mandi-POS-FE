import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Category } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Menu & Catalog</span>
        <span class="breadcrumb-separator">›</span>
        <span>Dishes & Products</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Category Directory</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">category</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Category Catalog</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ activeCount }} Active Sections</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">restaurant_menu</span>
                <span>Dishes Linked: <strong>{{ totalDishesCount }} Total Items</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">reorder</span>
                <span>Arrangement: <strong>Priority Sequenced</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadCategories()"
            class="action-btn btn-outline-purple"
            title="Refresh Catalog"
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
            <span>+ New Category</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION TABS                                          -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="activeTab = 'all'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'all'"
        >
          <span class="material-symbols-outlined">dataset</span>
          <span>All Categories</span>
          <span class="tab-count-badge">{{ categories.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'active'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'active'"
        >
          <span class="material-symbols-outlined">check_circle</span>
          <span>Active Sections</span>
          <span class="tab-count-badge">{{ activeCount }}</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'inactive'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'inactive'"
        >
          <span class="material-symbols-outlined">visibility_off</span>
          <span>Hidden / Inactive</span>
          <span class="tab-count-badge">{{ inactiveCount }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Categories</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">category</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ categories.length }}</span>
            <span class="kpi-pill pill-purple">Total</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Active Now</span>
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
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Linked Dishes</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">restaurant</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ totalDishesCount }}</span>
            <span class="kpi-pill pill-purple">Dishes</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Dishes / Cat</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ avgDishesPerCategory }}</span>
            <span class="kpi-pill pill-blue">Ratio</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Catalog Active</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">verified</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ activePercent }}%</span>
            <span class="kpi-pill pill-success">✓ Published</span>
          </div>
        </div>

        <!-- KPI 6 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Hidden / Draft</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">visibility_off</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number" [ngClass]="inactiveCount > 0 ? 'text-[#EA580C]' : ''">{{ inactiveCount }}</span>
            <span class="kpi-pill pill-amber">Draft</span>
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
              title="Search categories"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              placeholder="Search category name, description..."
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

          <!-- Status Filter -->
          <app-custom-dropdown
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            (valueChange)="currentPage = 1"
            placeholder="All Statuses"
            minWidth="160px"
          ></app-custom-dropdown>

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ filteredCategories.length }} categories
          </span>
        </div>

        <div class="toolbar-actions-group">
          <!-- Sort Dropdown -->
          <app-custom-dropdown
            [options]="sortOptions"
            [(ngModel)]="sortBy"
            (valueChange)="currentPage = 1"
            placeholder="Sort by"
            minWidth="200px"
          ></app-custom-dropdown>

          <button
            *ngIf="selectedIds.size > 0"
            (click)="deleteSelected()"
            class="action-btn btn-outline-purple !text-[#DC2626] !border-[#DC2626]/30 hover:!bg-[#FEE2E2]"
          >
            <span class="material-symbols-outlined">delete</span>
            <span>Delete ({{ selectedIds.size }})</span>
          </button>

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
      <!-- 5. CATEGORIES DATA TABLE                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    title="Select all categories"
                    type="checkbox"
                    [checked]="isAllSelected"
                    (change)="toggleSelectAll($event)"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </th>
                <th style="width: 32%;">Category & Section</th>
                <th style="width: 28%;">Description</th>
                <th style="width: 14%;">Order & Linked Dishes</th>
                <th style="width: 14%;">Status</th>
                <th style="width: 60px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of paginatedCategories" [class.bg-purple-50]="selectedIds.has(cat.id)">
                <!-- Checkbox -->
                <td style="text-align: center;">
                  <input
                    title="Select this category"
                    type="checkbox"
                    [checked]="selectedIds.has(cat.id)"
                    (change)="toggleSelection(cat.id)"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </td>

                <!-- Category Name & Icon -->
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-bold text-xs text-[#7E22CE] shrink-0 shadow-xs">
                      <span class="material-symbols-outlined" style="font-size: 20px;">folder</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[#2E1065] text-xs truncate">{{ cat.name }}</div>
                      <div class="text-[11px] text-[#6B7280] font-mono">ID: #{{ cat.id }}</div>
                    </div>
                  </div>
                </td>

                <!-- Description -->
                <td>
                  <span class="text-xs text-[#6B7280] truncate max-w-sm block">
                    {{ cat.description || 'Standard dish classification' }}
                  </span>
                </td>

                <!-- Order & Linked Dishes -->
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">
                      #{{ cat.display_order }}
                    </span>
                    <span class="text-xs font-semibold text-[#2E1065]">
                      {{ cat.product_count || 0 }} dishes
                    </span>
                  </div>
                </td>

                <!-- Status Pill -->
                <td>
                  <span
                    class="status-dot-pill"
                    [ngClass]="cat.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
                  >
                    <span class="status-dot"></span>
                    {{ cat.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="text-align: center;">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      (click)="openEditModal(cat)"
                      class="action-icon-btn"
                      title="Edit Category"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                    </button>
                    <button
                      type="button"
                      (click)="deleteCategory(cat)"
                      class="action-icon-btn is-danger"
                      title="Delete Category"
                    >
                      <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredCategories.length === 0">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'category' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Categories Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No categories match your current search query or active filter.' }}</p>
                    <button
                      type="button"
                      (click)="openAddModal()"
                      class="action-btn btn-gradient-purple mt-2"
                    >
                      <span class="material-symbols-outlined">add_circle</span>
                      <span>Create New Category</span>
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
        <div class="pagination-footer-bar" *ngIf="filteredCategories.length > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ filteredCategories.length }}</strong> categories
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
      <!-- 7. ADD / EDIT CATEGORY MODAL                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">{{ editingCategoryId ? 'edit' : 'category' }}</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  {{ editingCategoryId ? 'Edit Category' : 'Add New Category' }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Configure menu classification and catalog sorting</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveCategory()" class="space-y-3.5">
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Category Name
              </label>
              <input
                title="Category Name"
                type="text"
                [(ngModel)]="form.name"
                name="name"
                placeholder="e.g. Mandi Specials"
                class="form-control text-sm w-full"
                required
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Description
              </label>
              <input
                title="Description"
                type="text"
                [(ngModel)]="form.description"
                name="description"
                placeholder="Aromatic traditional rice dishes..."
                class="form-control text-sm w-full"
              />
            </div>

            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Display Order
                </label>
                <input
                  title="Display Order"
                  type="number"
                  [(ngModel)]="form.display_order"
                  name="display_order"
                  class="form-control font-mono font-bold text-sm w-full"
                  placeholder="1"
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Status
                </label>
                <select [(ngModel)]="form.status" name="status" class="form-control text-sm w-full">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Save Category ✓
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    `
  ]
})
export class CategoriesComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private categoryService = inject(CategoryService);
  private notify = inject(NotificationService);

  public categories: Category[] = [];
  public searchQuery = '';
  public statusFilter = 'ALL';
  public sortBy = 'display_order';
  public activeTab: 'all' | 'active' | 'inactive' = 'all';

  public statusOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Statuses', icon: 'toggle_on' },
    { value: 'ACTIVE', label: 'Active Only', icon: 'check_circle', description: 'Currently visible on POS' },
    { value: 'INACTIVE', label: 'Inactive Only', icon: 'pause_circle', description: 'Hidden from POS' },
  ];

  public sortOptions: DropdownOption[] = [
    { value: 'display_order', label: 'Sort: Display Order', icon: 'format_list_numbered' },
    { value: 'name', label: 'Sort: Category Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'product_count', label: 'Sort: Dish Count', icon: 'restaurant_menu' },
  ];

  public pageSize = 10;
  public currentPage = 1;
  public selectedIds = new Set<number>();

  public showModal = false;
  public editingCategoryId: number | null = null;
  public form: any = {
    name: '',
    description: '',
    display_order: 1,
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.loadError = null;
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
          this.isLoading = false;
        if (res.success) this.categories = res.data;
      },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  get activeCount(): number {
    return this.categories.filter((c) => c.status === 'ACTIVE').length;
  }

  get activePercent(): number {
    if (!this.categories.length) return 0;
    return Math.round((this.activeCount / this.categories.length) * 100);
  }

  get inactiveCount(): number {
    return this.categories.filter((c) => c.status !== 'ACTIVE').length;
  }

  get totalDishesCount(): number {
    return this.categories.reduce((sum, c) => sum + (c.product_count || 0), 0);
  }

  get avgDishesPerCategory(): string {
    if (!this.categories.length) return '0.0';
    return (this.totalDishesCount / this.categories.length).toFixed(1);
  }

  get filteredCategories(): Category[] {
    let list = this.categories;

    if (this.activeTab === 'active') {
      list = list.filter((c) => c.status === 'ACTIVE');
    } else if (this.activeTab === 'inactive') {
      list = list.filter((c) => c.status !== 'ACTIVE');
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter((c) => c.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (this.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy === 'product_count') {
      list = [...list].sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
    } else {
      list = [...list].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return list;
  }

  get paginatedCategories(): Category[] {
    const list = this.filteredCategories;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredCategories.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCategories.length);
  }

  get isAllSelected(): boolean {
    return (
      this.paginatedCategories.length > 0 &&
      this.paginatedCategories.every((c) => this.selectedIds.has(c.id))
    );
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.paginatedCategories.forEach((c) => this.selectedIds.add(c.id));
    } else {
      this.paginatedCategories.forEach((c) => this.selectedIds.delete(c.id));
    }
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  deleteSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.notify.confirm({
      title: 'Delete Selected Categories',
      message: `Are you sure you want to delete ${this.selectedIds.size} selected category(ies)?`,
      confirmText: 'Delete Selected',
      isDestructive: true,
      onConfirm: () => {
        let deleted = 0;
        this.selectedIds.forEach((id) => {
          this.categoryService.deleteCategory(id).subscribe({
            next: () => {
              deleted++;
              if (deleted === this.selectedIds.size) {
                this.notify.info('Categories deleted successfully');
                this.selectedIds.clear();
                this.loadCategories();
              }
            },
          });
        });
      },
    });
  }

  openAddModal(): void {
    this.editingCategoryId = null;
    this.form = {
      name: '',
      description: '',
      display_order: this.categories.length + 1,
      status: 'ACTIVE',
    };
    this.showModal = true;
  }

  openEditModal(cat: Category): void {
    this.editingCategoryId = cat.id;
    this.form = {
      name: cat.name,
      description: cat.description,
      display_order: cat.display_order,
      status: cat.status,
    };
    this.showModal = true;
  }

  saveCategory(): void {
    if (!this.form.name) {
      this.notify.error('Please enter category name');
      return;
    }

    if (this.editingCategoryId) {
      this.categoryService.updateCategory(this.editingCategoryId, this.form).subscribe({
        next: () => {
          this.notify.success('Category updated');
          this.showModal = false;
          this.loadCategories();
        },
      });
    } else {
      this.categoryService.createCategory(this.form).subscribe({
        next: () => {
          this.notify.success('Category created');
          this.showModal = false;
          this.loadCategories();
        },
      });
    }
  }

  deleteCategory(cat: Category): void {
    this.notify.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.categoryService.deleteCategory(cat.id).subscribe({
          next: () => {
            this.notify.info('Category deleted');
            this.loadCategories();
          },
        });
      },
    });
  }

  exportCSV(): void {
    if (this.categories.length === 0) {
      this.notify.info('No categories to export');
      return;
    }

    const headers = ['ID', 'Name', 'Description', 'Display Order', 'Status', 'Product Count'];
    const rows = this.categories.map((c) => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.display_order,
      c.status,
      c.product_count || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `categories_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Categories exported to CSV');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Category } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CategoryLayoutService } from '../../core/services/category-layout.service';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../shared/styles/default-action-buttons.styles';
import { CATEGORY_LAYOUT_CSS } from '../../shared/styles/category-layout.styles';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, CustomDropdownComponent, RouterLink],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading categories…"
        subMessage="Fetching menu categories from the server."
        icon="category"
        (retry)="loadCategories()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>Catalog</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Categories</span>
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

          <a
            routerLink="/settings"
            [queryParams]="{ tab: 'categorydesign' }"
            class="action-btn btn-outline-purple"
            style="text-decoration: none;"
            title="Customize Category Page Layout & Theme"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>Customize</span>
          </a>

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
            <span>New Category</span>
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
      <div
        class="category-stage"
        [ngClass]="categoryLayout.rootClass()"
        [ngStyle]="categoryLayout.pageCssVars()"
      >
        <!-- Empty State -->
        <div *ngIf="filteredCategories.length === 0" class="empty-state-cell w-full py-12">
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
        </div>

        <!-- 1. BENTO SHOWCASE -->
        <div *ngIf="categoryLayout.effectiveKey() === 'showcase' && filteredCategories.length > 0" class="cat-bento-grid">
          <div *ngFor="let cat of paginatedCategories" class="cat-bento-card" [class.bg-purple-50]="selectedIds.has(cat.id)">
            <div class="cat-bento-header">
              <div class="flex items-center gap-3">
                <input
                  title="Select category"
                  type="checkbox"
                  [checked]="selectedIds.has(cat.id)"
                  (change)="toggleSelection(cat.id)"
                  class="rounded border-[#E9D5FF] text-[#7E22CE]"
                />
                <div class="cat-bento-icon">
                  <img *ngIf="cat.image_url" [src]="settingsService.assetUrl(cat.image_url)" [alt]="cat.name" class="w-full h-full object-cover rounded-lg" />
                  <span *ngIf="!cat.image_url" class="material-symbols-outlined">folder</span>
                </div>
              </div>
              <div class="cat-bento-badges">
                <span class="cat-bento-dish-pill">
                  <span class="material-symbols-outlined" style="font-size: 13px;">restaurant_menu</span>
                  {{ cat.product_count || 0 }} dishes
                </span>
                <span class="cat-bento-status" [class.is-draft]="cat.status !== 'ACTIVE'">
                  ● {{ cat.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <div class="cat-bento-body">
              <h4 class="cat-bento-title">{{ cat.name }}</h4>
              <p class="cat-bento-desc">{{ cat.description || 'Standard dish classification' }}</p>
            </div>

            <div class="cat-bento-footer">
              <span class="cat-bento-order">Seq #{{ cat.display_order }}</span>
              <div class="cat-bento-actions">
                <button type="button" (click)="openEditModal(cat)" class="cat-bento-btn" title="Edit Category">
                  <span class="material-symbols-outlined" style="font-size: 15px;">edit</span>
                  <span>Edit</span>
                </button>
                <button type="button" (click)="deleteCategory(cat)" class="cat-bento-btn !text-red-500 hover:!bg-red-50" title="Delete Category">
                  <span class="material-symbols-outlined" style="font-size: 15px;">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. MINIMALIST CLEAN TABLE -->
        <div *ngIf="categoryLayout.effectiveKey() === 'clean' && filteredCategories.length > 0" class="cat-clean-table-card">
          <table class="cat-clean-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    title="Select all"
                    type="checkbox"
                    [checked]="isAllSelected"
                    (change)="toggleSelectAll($event)"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </th>
                <th style="width: 50px;">Seq</th>
                <th style="width: 32%;">Category Details</th>
                <th style="width: 28%;">Description</th>
                <th style="width: 14%;">Dishes</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 80px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of paginatedCategories" class="cat-clean-row" [class.bg-purple-50]="selectedIds.has(cat.id)">
                <td style="text-align: center;">
                  <input
                    title="Select this category"
                    type="checkbox"
                    [checked]="selectedIds.has(cat.id)"
                    (change)="toggleSelection(cat.id)"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </td>
                <td>
                  <span class="cat-clean-id">#{{ cat.display_order }}</span>
                </td>
                <td>
                  <div class="cat-clean-name-cell">
                    <div class="cat-clean-thumb">
                      <img *ngIf="cat.image_url" [src]="settingsService.assetUrl(cat.image_url)" [alt]="cat.name" class="w-full h-full object-cover rounded-md" />
                      <span *ngIf="!cat.image_url" class="material-symbols-outlined">folder</span>
                    </div>
                    <div>
                      <div class="cat-clean-title">{{ cat.name }}</div>
                      <div class="cat-clean-id">ID: #{{ cat.id }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="cat-clean-desc">{{ cat.description || 'Standard dish classification' }}</span>
                </td>
                <td>
                  <span class="cat-clean-metric">
                    <span class="material-symbols-outlined" style="font-size: 14px;">restaurant</span>
                    {{ cat.product_count || 0 }} dishes
                  </span>
                </td>
                <td>
                  <span class="cat-clean-badge" [class.is-draft]="cat.status !== 'ACTIVE'">
                    {{ cat.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-1">
                    <button type="button" (click)="openEditModal(cat)" class="cat-clean-btn" title="Edit">
                      <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                    </button>
                    <button type="button" (click)="deleteCategory(cat)" class="cat-clean-btn text-red-500 hover:bg-red-50" title="Delete">
                      <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 3. COMPACT BADGE TILES -->
        <div *ngIf="categoryLayout.effectiveKey() === 'compact' && filteredCategories.length > 0" class="cat-compact-grid">
          <div *ngFor="let cat of paginatedCategories" class="cat-compact-tile" [class.bg-purple-50]="selectedIds.has(cat.id)">
            <div class="cat-compact-header">
              <div class="flex items-center gap-2">
                <input
                  title="Select category"
                  type="checkbox"
                  [checked]="selectedIds.has(cat.id)"
                  (change)="toggleSelection(cat.id)"
                  class="rounded border-[#E9D5FF] text-[#7E22CE]"
                />
                <div class="cat-compact-icon">
                  <img *ngIf="cat.image_url" [src]="settingsService.assetUrl(cat.image_url)" [alt]="cat.name" class="w-full h-full object-cover rounded-md" />
                  <span *ngIf="!cat.image_url" class="material-symbols-outlined">folder</span>
                </div>
              </div>
              <span class="cat-compact-status" [class.is-draft]="cat.status !== 'ACTIVE'">
                {{ cat.status === 'ACTIVE' ? 'Live' : 'Draft' }}
              </span>
            </div>

            <div class="cat-compact-name">{{ cat.name }}</div>

            <div class="cat-compact-footer">
              <span class="cat-compact-count">
                <span class="material-symbols-outlined" style="font-size: 13px;">restaurant_menu</span>
                {{ cat.product_count || 0 }} dishes
              </span>
              <div class="cat-compact-actions">
                <button type="button" (click)="openEditModal(cat)" class="cat-compact-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
                </button>
                <button type="button" (click)="deleteCategory(cat)" class="cat-compact-btn text-red-500 hover:bg-red-50" title="Delete">
                  <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. LIST VIEW -->
        <div *ngIf="categoryLayout.effectiveKey() === 'list' && filteredCategories.length > 0" class="cat-list-container">
          <div *ngFor="let cat of paginatedCategories" class="cat-list-row" [class.bg-purple-50]="selectedIds.has(cat.id)">
            <input
              title="Select category"
              type="checkbox"
              [checked]="selectedIds.has(cat.id)"
              (change)="toggleSelection(cat.id)"
              class="rounded border-[#E9D5FF] text-[#7E22CE]"
            />
            <span class="cat-list-seq">{{ cat.display_order }}</span>

            <div class="cat-list-thumb">
              <img *ngIf="cat.image_url" [src]="settingsService.assetUrl(cat.image_url)" [alt]="cat.name" class="w-full h-full object-cover rounded-lg" />
              <span *ngIf="!cat.image_url" class="material-symbols-outlined">folder</span>
            </div>

            <div class="cat-list-info">
              <div class="cat-list-name">{{ cat.name }}</div>
              <div class="cat-list-desc">{{ cat.description || 'Standard dish classification' }}</div>
            </div>

            <div class="cat-list-count">
              <span class="material-symbols-outlined" style="font-size: 15px;">restaurant_menu</span>
              <span><strong>{{ cat.product_count || 0 }}</strong> dishes</span>
            </div>

            <div>
              <span class="cat-list-status" [class.is-draft]="cat.status !== 'ACTIVE'">
                {{ cat.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="cat-list-actions">
              <button type="button" (click)="openEditModal(cat)" class="cat-list-btn" title="Edit Category">
                <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
              </button>
              <button type="button" (click)="deleteCategory(cat)" class="cat-list-btn text-red-500 hover:bg-red-50" title="Delete Category">
                <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 5. CARD VIEW -->
        <div *ngIf="categoryLayout.effectiveKey() === 'card' && filteredCategories.length > 0" class="cat-card-grid">
          <div *ngFor="let cat of paginatedCategories" class="cat-card-item" [class.bg-purple-50]="selectedIds.has(cat.id)">
            <div class="cat-card-banner">
              <div class="flex items-center gap-2">
                <input
                  title="Select category"
                  type="checkbox"
                  [checked]="selectedIds.has(cat.id)"
                  (change)="toggleSelection(cat.id)"
                  class="rounded border-[#E9D5FF] text-[#7E22CE]"
                />
                <span class="cat-card-badge-top" [class.is-draft]="cat.status !== 'ACTIVE'">
                  {{ cat.status === 'ACTIVE' ? 'Active' : 'Draft' }}
                </span>
              </div>
              <div class="cat-card-avatar">
                <img *ngIf="cat.image_url" [src]="settingsService.assetUrl(cat.image_url)" [alt]="cat.name" class="w-full h-full object-cover rounded-full" />
                <span *ngIf="!cat.image_url" class="material-symbols-outlined" style="font-size: 28px;">folder</span>
              </div>
            </div>

            <div class="cat-card-content">
              <h4 class="cat-card-title">{{ cat.name }}</h4>
              <p class="cat-card-desc">{{ cat.description || 'Standard dish classification' }}</p>

              <div class="cat-card-progress">
                <div class="cat-card-progress-bar">
                  <div
                    class="cat-card-progress-fill"
                    [style.width.%]="(cat.product_count || 0) > 0 ? ((cat.product_count || 0) / 40) * 100 : 6"
                  ></div>
                </div>
                <span class="cat-card-progress-text">{{ cat.product_count || 0 }} Menu Dishes</span>
              </div>
            </div>

            <div class="cat-card-footer">
              <span class="cat-card-seq-pill">Seq #{{ cat.display_order }}</span>
              <div class="cat-card-actions">
                <button type="button" (click)="openEditModal(cat)" class="dv-btn is-primary" title="Edit">
                  <span class="material-symbols-outlined">edit</span>
                  <span>Edit</span>
                </button>
                <button type="button" (click)="deleteCategory(cat)" class="dv-btn is-icon is-danger" title="Delete">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
                placeholder="e.g.  Specials"
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
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1 block">
                  Status
                </label>
                <app-custom-dropdown
                  [options]="formStatusOptions"
                  [(ngModel)]="form.status"
                  name="status"
                  placeholder="Select Status"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Category Image (Optional)
              </label>
              <div class="image-upload-row">
                <div class="image-upload-preview" [class.is-empty]="!form.image_url">
                  <img *ngIf="form.image_url" [src]="settingsService.assetUrl(form.image_url)" alt="Category image preview" />
                  <span *ngIf="!form.image_url" class="material-symbols-outlined">add_photo_alternate</span>
                </div>
                <div class="image-upload-actions">
                  <input
                    type="file"
                    hidden
                    #catPicker
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    (change)="onCategoryImageFile($event, catPicker)"
                    title="Choose category image"
                  />
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      [disabled]="isUploadingImage"
                      (click)="catPicker.click()"
                    >
                      <span class="material-symbols-outlined">{{ isUploadingImage ? 'progress_activity' : 'upload' }}</span>
                      <span>{{ isUploadingImage ? 'Uploading…' : (form.image_url ? 'Replace' : 'Choose Image') }}</span>
                    </button>
                    <button
                      *ngIf="form.image_url && !isUploadingImage"
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      (click)="removeCategoryImage()"
                    >
                      <span class="material-symbols-outlined">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  <p class="image-upload-hint">PNG, JPG, WEBP or GIF · up to 2 MB</p>
                </div>
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
      /* ─── Category thumbnail in the list ─── */
      .category-thumb {
        width: 2.25rem;
        height: 2.25rem;
        flex-shrink: 0;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-light, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        box-shadow: 0 1px 2px rgba(var(--text-main-rgb, 46, 16, 101), 0.06);
      }

      .category-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .category-thumb .material-symbols-outlined {
        font-size: 20px;
      }

      /* ─── Order & linked dishes ───
         The sequence number is context, the dish count is the datum, so only
         the count carries colour. An empty category reads as an outline. */
      .order-dish-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .order-seq {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        border-radius: 7px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--text-muted, #6B7280);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.6875rem;
        font-weight: 700;
        line-height: 1;
      }

      .dish-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.2rem 0.6rem 0.2rem 0.45rem;
        border-radius: 999px;
        background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        font-size: 0.6875rem;
        white-space: nowrap;
      }

      .dish-chip .material-symbols-outlined {
        font-size: 14px;
      }

      .dish-chip strong {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .dish-chip-label {
        font-weight: 600;
        opacity: 0.75;
      }

      .dish-chip.is-empty {
        background: transparent;
        border-style: dashed;
        border-color: #E5E7EB;
        color: var(--text-dim, #9CA3AF);
      }

      /* ─── Image upload field ─── */
      .image-upload-row {
        display: flex;
        align-items: center;
        gap: 0.875rem;
      }

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
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .image-upload-preview.is-empty {
        border-style: dashed;
      }

      .image-upload-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .image-upload-preview .material-symbols-outlined {
        font-size: 26px;
        opacity: 0.55;
      }

      .image-upload-actions {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-width: 0;
      }

      .image-upload-hint {
        margin: 0;
        font-size: 0.6875rem;
        color: var(--text-muted, #6B7280);
      }
    `,
    CATEGORY_LAYOUT_CSS,
    DEFAULT_ACTION_BUTTON_CSS,
  ]
})
export class CategoriesComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public categoryLayout = inject(CategoryLayoutService);
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

  public formStatusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE', icon: 'check_circle', description: 'Category visible on POS' },
    { value: 'INACTIVE', label: 'INACTIVE', icon: 'block', description: 'Category hidden from POS' },
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
    image_url: '',
  };

  /** True while a picked file is being read and uploaded. */
  public isUploadingImage = false;

  private static readonly IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  private static readonly IMAGE_MAX_MB = 2;

  /**
   * Reads the picked file and uploads it immediately, so the form only ever
   * carries a stored URL. The server re-checks type and size — these checks
   * exist to fail fast without a round trip.
   */
  onCategoryImageFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared straight away so picking the same file after a failure still
    // fires a change event.
    picker.value = '';
    if (!file) return;

    if (!CategoriesComponent.IMAGE_TYPES.includes(file.type)) {
      this.notify.error('Category image must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > CategoriesComponent.IMAGE_MAX_MB * 1024 * 1024) {
      this.notify.error(
        `Category image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${CategoriesComponent.IMAGE_MAX_MB} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.categoryService.uploadCategoryImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.form.image_url = res.data.url;
            this.notify.success('Image uploaded — save the category to apply it.');
          } else {
            this.notify.error(res?.message || 'Category image upload failed.');
          }
        },
        error: (err) => {
          this.isUploadingImage = false;
          this.notify.error(err?.error?.message || 'Category image upload failed.');
        },
      });
    };

    this.isUploadingImage = true;
    reader.readAsDataURL(file);
  }

  /** Clears the image; the old file is deleted server-side when the row saves. */
  removeCategoryImage(): void {
    this.notify.confirm({
      title: 'Remove Image',
      message: 'Are you sure you want to remove this category image?',
      confirmText: 'Remove',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.form.image_url = '';
      },
    });
  }

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

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
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

  get paginatedCategories(): Category[] {
    const list = this.filteredCategories;
    const start = (this.safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredCategories.length === 0 ? 0 : (this.safePage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.safePage * this.pageSize, this.filteredCategories.length);
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
            // Reported by the global error interceptor; present so a failure
            // cannot escape as an unhandled rejection.
            error: () => { },
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
      image_url: '',
    };
    this.isUploadingImage = false;
    this.showModal = true;
  }

  openEditModal(cat: Category): void {
    this.editingCategoryId = cat.id;
    this.form = {
      name: cat.name,
      description: cat.description,
      display_order: cat.display_order,
      status: cat.status,
      image_url: cat.image_url || '',
    };
    this.isUploadingImage = false;
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
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => { },
      });
    } else {
      this.categoryService.createCategory(this.form).subscribe({
        next: () => {
          this.notify.success('Category created');
          this.showModal = false;
          this.loadCategories();
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => { },
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
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => { },
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

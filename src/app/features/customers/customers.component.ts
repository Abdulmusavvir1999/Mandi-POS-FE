import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { Customer } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { RouterLink } from '@angular/router';
import { CustomerLayoutService } from '../../core/services/customer-layout.service';
import { CUSTOMER_LAYOUT_CSS } from '../../shared/styles/customer-layout.styles';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, RouterLink, CustomDropdownComponent, AppCurrencyPipe],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading customers…"
        subMessage="Fetching customer records from the server."
        icon="groups"
        (retry)="loadCustomers()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>CRM & Guests</span>
        <span class="breadcrumb-separator">›</span>
        <span>Customer Directory</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Guest Profiles</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">contacts</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Customer & Guest Directory</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ customers.length }} Registered Guests</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">loyalty</span>
                <span>VIP Tier: <strong>{{ vipCount }} Members</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">payments</span>
                <span>Gross Spent: <strong>{{ totalSpentAll | appCurrency:'1.0-0' }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadCustomers()"
            class="action-btn btn-outline-purple"
            title="Refresh Directory"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <a
            routerLink="/settings"
            [queryParams]="{ tab: 'customerdesign' }"
            class="action-btn btn-outline-purple"
            style="text-decoration: none;"
            title="Customize Customer Directory Layout & Styling"
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
            <span class="material-symbols-outlined">person_add</span>
            <span>New Customer</span>
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
          <span class="material-symbols-outlined">group</span>
          <span>All Guests</span>
          <span class="tab-count-badge">{{ customers.length }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'vip'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'vip'"
        >
          <span class="material-symbols-outlined">diamond</span>
          <span>VIP Members</span>
          <span class="tab-count-badge">{{ vipCount }}</span>
        </button>

        <button
          type="button"
          (click)="activeNavTab = 'frequent'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="activeNavTab === 'frequent'"
        >
          <span class="material-symbols-outlined">repeat</span>
          <span>Frequent Guests</span>
          <span class="tab-count-badge">{{ frequentCount }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Guests</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">groups</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ customers.length }}</span>
            <span class="kpi-pill pill-purple">Profiles</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">VIP Guests</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">diamond</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ vipCount }}</span>
            <span class="kpi-pill pill-purple">VIP Club</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Visits</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ totalVisits }}</span>
            <span class="kpi-pill pill-blue">Check-ins</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Gross Revenue</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">payments</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ totalSpentAll | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-success">Spend</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Spend / Guest</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">calculate</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-amber-700">{{ avgSpend | appCurrency:'1.0-0' }}</span>
            <span class="kpi-pill pill-amber">Average</span>
          </div>
        </div>

        <!-- KPI 6 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Repeat Customers</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">repeat</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ repeatCustomerPercent | number:'1.0-1' }}%</span>
            <span class="kpi-pill pill-live">● Returning</span>
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
              title="Search guests"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              placeholder="Search guests by name, phone, address..."
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

          <!-- Spend Filter -->
          <app-custom-dropdown
            [options]="spendingOptions"
            [(ngModel)]="spendingFilter"
            (valueChange)="currentPage = 1"
            placeholder="All Spenders"
            minWidth="175px"
          ></app-custom-dropdown>

          <!-- Meta Record Count -->
          <span class="toolbar-meta-count hidden sm:inline-block">
            Displaying {{ filteredCustomers.length }} guests
          </span>
        </div>

        <div class="toolbar-actions-group">
          <!-- Sort Dropdown -->
          <app-custom-dropdown
            [options]="sortOptions"
            [(ngModel)]="sortBy"
            (valueChange)="currentPage = 1"
            placeholder="Sort by"
            minWidth="180px"
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
      <!-- 5. CUSTOMERS STAGE (5 DYNAMIC DESIGNS)                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="customer-stage" [ngClass]="customerLayout.rootClass()" [ngStyle]="customerLayout.pageCssVars()">
        <!-- Empty State -->
        <div *ngIf="filteredCustomers.length === 0" class="empty-state-box p-8 text-center bg-white rounded-2xl border border-purple-100 shadow-sm">
          <span class="material-symbols-outlined empty-icon text-5xl text-purple-400">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'contacts' }}</span>
          <div class="empty-title text-base font-bold text-slate-800 mt-2">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Guests Found' }}</div>
          <p class="empty-desc text-xs text-slate-500 max-w-sm mx-auto mt-1">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No customer profiles match your search criteria or spending filter.' }}</p>
          <button
            type="button"
            (click)="openAddModal()"
            class="action-btn btn-gradient-purple mt-3 inline-flex mx-auto"
          >
            <span class="material-symbols-outlined">person_add</span>
            <span>Register First Guest</span>
          </button>
        </div>

        <!-- DESIGN 1: EXECUTIVE VIP CARDS -->
        <div *ngIf="filteredCustomers.length > 0 && customerLayout.effectiveKey() === 'vipcard'" class="cust-vip-grid">
          <div *ngFor="let c of paginatedCustomers" class="cust-vip-card">
            <div class="cust-vip-header">
              <div class="flex items-center gap-3">
                <input
                  title="Select guest"
                  type="checkbox"
                  [(ngModel)]="c.selected"
                  class="rounded border-[#E9D5FF] text-[#7E22CE]"
                />
                <div class="cust-vip-avatar-wrap">
                  <div class="cust-vip-avatar">
                    <img *ngIf="c.image_url" [src]="settingsService.assetUrl(c.image_url)" [alt]="c.name" />
                    <span *ngIf="!c.image_url">{{ getInitials(c.name) }}</span>
                  </div>
                  <span class="cust-vip-online" title="Active Account"></span>
                </div>
              </div>
              <span class="cust-vip-badge" [style.background]="getTierBg(c)" [style.color]="getTierColor(c)">
                <span class="material-symbols-outlined" style="font-size: 13px;">diamond</span>
                {{ getTier(c) }}
              </span>
            </div>

            <div class="cust-vip-body">
              <h4 class="cust-vip-name">{{ c.name }}</h4>
              <div class="cust-vip-locality">
                <span class="material-symbols-outlined">location_on</span>
                <span>{{ c.address || 'Local Guest' }}</span>
              </div>

              <div class="cust-vip-chips-row">
                <span class="cust-vip-chip" *ngIf="c.phone">
                  <span class="material-symbols-outlined" style="font-size: 13px;">call</span>
                  {{ c.phone }}
                </span>
                <span class="cust-vip-chip" *ngIf="c.email">
                  <span class="material-symbols-outlined" style="font-size: 13px;">mail</span>
                  {{ c.email }}
                </span>
              </div>

              <div class="cust-vip-stats-bar">
                <div class="cust-vip-stat-item">
                  <span class="cust-vip-stat-label">Visits</span>
                  <span class="cust-vip-stat-val">{{ c.total_visits }}</span>
                </div>
                <div class="cust-vip-stat-item" style="text-align: right;">
                  <span class="cust-vip-stat-label">Total Spent</span>
                  <span class="cust-vip-stat-val is-spend">{{ c.total_spent | appCurrency:'1.0-0' }}</span>
                </div>
              </div>
            </div>

            <div class="cust-vip-actions">
              <div class="text-[11px] font-mono font-bold text-purple-700">
                #CUST-{{ c.id }}
              </div>
              <div class="cust-vip-btn-group">
                <button type="button" (click)="viewHistory(c)" class="cust-act is-vip" title="View Invoices">
                  <span class="material-symbols-outlined">receipt_long</span>
                </button>
                <button type="button" (click)="openEditModal(c)" class="cust-act is-vip" title="Edit Customer">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button type="button" (click)="deleteCustomer(c)" class="cust-act is-vip is-delete" title="Delete Customer">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- DESIGN 2: MINIMALIST CLEAN TABLE -->
        <div *ngIf="filteredCustomers.length > 0 && customerLayout.effectiveKey() === 'clean'" class="cust-clean-table-wrap">
          <table class="cust-clean-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input title="Select all" type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()" class="rounded" />
                </th>
                <th style="width: 28%;">Guest & Locality</th>
                <th style="width: 18%;">Phone</th>
                <th style="width: 14%;">Tier</th>
                <th style="width: 12%;">Visits</th>
                <th style="width: 14%;">Gross Spent</th>
                <th style="width: 90px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of paginatedCustomers">
                <td style="text-align: center;">
                  <input type="checkbox" [(ngModel)]="c.selected" class="rounded" />
                </td>
                <td>
                  <div class="cust-clean-name">{{ c.name }}</div>
                  <div class="cust-clean-locality">{{ c.address || 'Local Guest' }}</div>
                </td>
                <td>
                  <span class="cust-clean-phone">{{ c.phone }}</span>
                </td>
                <td>
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" [style.background]="getTierBg(c)" [style.color]="getTierColor(c)">
                    {{ getTier(c) }}
                  </span>
                </td>
                <td>
                  <span class="font-mono font-bold text-xs">{{ c.total_visits }} visits</span>
                </td>
                <td>
                  <span class="cust-clean-spend">{{ c.total_spent | appCurrency:'1.0-0' }}</span>
                </td>
                <td style="text-align: center;">
                  <div class="cust-clean-actions">
                    <button type="button" (click)="viewHistory(c)" class="cust-act is-clean" title="View Invoices">
                      <span class="material-symbols-outlined">receipt_long</span>
                    </button>
                    <button type="button" (click)="openEditModal(c)" class="cust-act is-clean" title="Edit Customer">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button type="button" (click)="deleteCustomer(c)" class="cust-act is-clean is-delete" title="Delete Customer">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- DESIGN 3: COMPACT CRM TILES -->
        <div *ngIf="filteredCustomers.length > 0 && customerLayout.effectiveKey() === 'compact'" class="cust-compact-grid">
          <div *ngFor="let c of paginatedCustomers" class="cust-compact-tile">
            <div class="cust-compact-top">
              <input type="checkbox" [(ngModel)]="c.selected" class="rounded" />
              <div class="cust-compact-avatar">
                <img *ngIf="c.image_url" [src]="settingsService.assetUrl(c.image_url)" [alt]="c.name" class="w-full h-full object-cover rounded-lg" />
                <span *ngIf="!c.image_url">{{ getInitials(c.name) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h5 class="cust-compact-title">{{ c.name }}</h5>
                <div class="cust-compact-phone">{{ c.phone }}</div>
              </div>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" [style.background]="getTierBg(c)" [style.color]="getTierColor(c)">
                {{ getTier(c) }}
              </span>
            </div>

            <div class="cust-compact-bottom">
              <span class="text-[11px] text-slate-500">{{ c.total_visits }} visits</span>
              <span class="cust-compact-spent">{{ c.total_spent | appCurrency:'1.0-0' }}</span>
              <div class="cust-compact-actions">
                <button type="button" (click)="viewHistory(c)" class="cust-act is-compact" title="Invoices">
                  <span class="material-symbols-outlined">receipt_long</span>
                </button>
                <button type="button" (click)="openEditModal(c)" class="cust-act is-compact" title="Edit">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button type="button" (click)="deleteCustomer(c)" class="cust-act is-compact is-delete" title="Delete">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- DESIGN 4: LIST VIEW (ENTERPRISE TABULAR) -->
        <div *ngIf="filteredCustomers.length > 0 && customerLayout.effectiveKey() === 'list'" class="cust-list-table-wrap">
          <table class="cust-list-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    title="Select all guests"
                    type="checkbox"
                    [(ngModel)]="selectAll"
                    (change)="toggleSelectAll()"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </th>
                <th style="width: 28%;">Guest & Locality</th>
                <th style="width: 18%;">Email</th>
                <th style="width: 16%;">Phone Number</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 12%;">Visits</th>
                <th style="width: 14%;">Total Spent</th>
                <th style="width: 70px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of paginatedCustomers">
                <td style="text-align: center;">
                  <input
                    title="Select this guest"
                    type="checkbox"
                    [(ngModel)]="c.selected"
                    class="rounded border-[#E9D5FF] text-[#7E22CE]"
                  />
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center font-black text-xs text-[#7E22CE] shrink-0 shadow-xs">
                      <img
                        *ngIf="c.image_url"
                        class="row-avatar-img w-full h-full object-cover rounded-xl"
                        [src]="settingsService.assetUrl(c.image_url)"
                        [alt]="c.name"
                      />
                      <span *ngIf="!c.image_url">{{ getInitials(c.name) }}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-[#2E1065] text-xs truncate">{{ c.name }}</div>
                      <div class="text-[11px] text-[#6B7280] truncate max-w-xs">{{ c.address || 'Local Guest' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-xs text-[#6B7280] font-mono truncate block">{{ c.email || '—' }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs font-bold text-[#7E22CE] bg-[#FAF5FF] px-2 py-0.5 rounded-md border border-[#E9D5FF]">
                    {{ c.phone }}
                  </span>
                </td>
                <td>
                  <span class="status-dot-pill is-active">
                    <span class="status-dot"></span>
                    Active
                  </span>
                </td>
                <td>
                  <span class="badge badge-primary font-mono">
                    {{ c.total_visits }} visits
                  </span>
                </td>
                <td>
                  <span class="font-mono font-black text-xs text-[#16A34A]">
                    {{ c.total_spent | appCurrency:'1.0-0' }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <div class="cust-list-actions">
                    <button type="button" (click)="viewHistory(c)" class="cust-act is-list" title="View Invoices">
                      <span class="material-symbols-outlined">receipt_long</span>
                    </button>
                    <button type="button" (click)="openEditModal(c)" class="cust-act is-list" title="Edit Customer">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button type="button" (click)="deleteCustomer(c)" class="cust-act is-list is-delete" title="Delete Customer">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- DESIGN 5: CARD VIEW (GUEST PROFILE CARDS) -->
        <div *ngIf="filteredCustomers.length > 0 && customerLayout.effectiveKey() === 'card'" class="cust-card-grid">
          <div *ngFor="let c of paginatedCustomers" class="cust-profile-card">
            <div class="cust-profile-cover">
              <div class="cust-profile-avatar-pos">
                <div class="cust-profile-avatar">
                  <img *ngIf="c.image_url" [src]="settingsService.assetUrl(c.image_url)" [alt]="c.name" class="w-full h-full object-cover rounded-lg" />
                  <span *ngIf="!c.image_url">{{ getInitials(c.name) }}</span>
                </div>
              </div>
              <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black" [style.background]="getTierBg(c)" [style.color]="getTierColor(c)">
                {{ getTier(c) }}
              </span>
            </div>

            <div class="cust-profile-card-content">
              <h4 class="cust-profile-name">{{ c.name }}</h4>
              <div class="cust-profile-loc">{{ c.address || 'Local Guest' }}</div>

              <div class="cust-profile-stats-row">
                <div>
                  <span class="text-[10px] text-slate-400 block font-bold uppercase">Visits</span>
                  <span class="font-mono font-bold text-xs">{{ c.total_visits }} visits</span>
                </div>
                <div style="text-align: right;">
                  <span class="text-[10px] text-slate-400 block font-bold uppercase">Gross Spent</span>
                  <span class="font-mono font-black text-xs text-green-700">{{ c.total_spent | appCurrency:'1.0-0' }}</span>
                </div>
              </div>

              <div class="text-xs font-mono text-slate-600 truncate mb-1">
                📞 {{ c.phone }}
              </div>
              <div class="text-xs font-mono text-slate-400 truncate" *ngIf="c.email">
                ✉️ {{ c.email }}
              </div>
            </div>

            <div class="cust-profile-card-footer">
              <input type="checkbox" [(ngModel)]="c.selected" class="rounded" />
              <div class="cust-card-actions">
                <button type="button" (click)="viewHistory(c)" class="cust-act is-card" title="Invoices">
                  <span class="material-symbols-outlined">receipt_long</span>
                </button>
                <button type="button" (click)="openEditModal(c)" class="cust-act is-card" title="Edit">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button type="button" (click)="deleteCustomer(c)" class="cust-act is-card is-delete" title="Delete">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="pagination-footer-bar" *ngIf="filteredCustomers.length > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ filteredCustomers.length }}</strong> guest entries
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
      <!-- 7. PURCHASE HISTORY DRAWER MODAL                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="historyCustomer">
        <div class="modal-content p-7 md:p-8 w-full max-w-2xl shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">receipt_long</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Purchase History — {{ historyCustomer.name }}</h3>
                <p class="text-xs text-[#6B7280] font-mono mt-0.5">{{ historyCustomer.phone }}</p>
              </div>
            </div>
            <button
              type="button"
              (click)="historyCustomer = null"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-3 max-h-[60vh] overflow-y-auto">
            <div *ngIf="purchaseHistory.length === 0" class="text-center py-8 text-[#6B7280] text-xs">
              <span class="material-symbols-outlined text-4xl text-[#D8B4FE] block mb-2">receipt_long</span>
              No previous bills recorded for this customer.
            </div>

            <div
              *ngFor="let bill of purchaseHistory"
              class="p-3.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-2 text-xs"
            >
              <div class="flex items-center justify-between border-b border-[#E9D5FF] pb-2">
                <span class="font-bold text-[#7E22CE] font-mono">#{{ bill.bill_number }}</span>
                <span class="text-[#6B7280]">{{ bill.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="space-y-1">
                <div *ngFor="let item of bill.items" class="flex justify-between text-[#2E1065]">
                  <span>{{ item.product_name }} x {{ item.quantity }}</span>
                  <span class="font-mono font-semibold">{{ item.total_amount | appCurrency:'1.0-0' }}</span>
                </div>
              </div>
              <div class="flex justify-between pt-2 border-t border-[#E9D5FF] font-bold">
                <span>Total Settled ({{ bill.payment_method }})</span>
                <span class="font-mono text-[#16A34A]">{{ bill.total_amount | appCurrency:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="pt-5 mt-4 border-t border-[#E9D5FF] flex justify-end">
            <button
              type="button"
              (click)="historyCustomer = null"
              class="action-btn btn-outline-purple"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 8. ADD / EDIT CUSTOMER MODAL                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">{{ editingCustomerId ? 'edit' : 'person_add' }}</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  {{ editingCustomerId ? 'Edit Guest Profile' : 'Register New Customer' }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Manage customer directory and CRM details</p>
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

          <form (ngSubmit)="saveCustomer()" class="space-y-3.5" autocomplete="off">
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Full Name
              </label>
              <input
                title="Full Name"
                type="text"
                [(ngModel)]="form.name"
                name="name"
                placeholder="e.g. Dr. Farooq Siddiqui"
                class="form-control text-sm w-full"
                required
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Phone Number
              </label>
              <input
                title="Phone Number"
                type="tel"
                [(ngModel)]="form.phone"
                name="phone"
                placeholder="10-digit mobile number"
                class="form-control font-mono font-bold text-sm w-full"
                required
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Email (Optional)
              </label>
              <input
                title="Email (Optional)"
                type="email"
                [(ngModel)]="form.email"
                name="email"
                placeholder="guest@example.com"
                class="form-control text-sm w-full"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Address / Locality
              </label>
              <input
                title="Address / Locality"
                type="text"
                [(ngModel)]="form.address"
                name="address"
                placeholder="Area / Locality"
                class="form-control text-sm w-full"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Customer Photo (Optional)
              </label>
              <div class="image-upload-row">
                <div class="image-upload-preview" [class.is-empty]="!form.image_url">
                  <img *ngIf="form.image_url" [src]="settingsService.assetUrl(form.image_url)" alt="Customer Photo preview" />
                  <span *ngIf="!form.image_url" class="material-symbols-outlined">add_a_photo</span>
                </div>
                <div class="image-upload-actions">
                  <input
                    type="file"
                    hidden
                    #custPicker
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    (change)="onPhotoFile($event, custPicker)"
                    title="Choose customer photo"
                  />
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      [disabled]="isUploadingImage"
                      (click)="custPicker.click()"
                    >
                      <span class="material-symbols-outlined">{{ isUploadingImage ? 'progress_activity' : 'upload' }}</span>
                      <span>{{ isUploadingImage ? 'Uploading…' : (form.image_url ? 'Replace' : 'Choose Photo') }}</span>
                    </button>
                    <button
                      *ngIf="form.image_url && !isUploadingImage"
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      (click)="form.image_url = ''"
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
                Save Customer ✓
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [CUSTOMER_LAYOUT_CSS],
})
export class CustomersComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public customerLayout = inject(CustomerLayoutService);
  private customerService = inject(CustomerService);
  private notify = inject(NotificationService);

  public customers: (Customer & { selected?: boolean })[] = [];
  public activeNavTab = 'overview';
  public selectAll = false;

  public searchQuery = '';
  public spendingFilter = 'ALL';
  public sortBy = 'name';

  public spendingOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Spenders', icon: 'payments' },
    { value: 'HIGH', label: 'High Spenders (Top Tier)', icon: 'star', description: 'VIP High Value Guests' },
    { value: 'REGULAR', label: 'Regular Spenders', icon: 'loyalty', description: 'Standard Dining Guests' },
  ];

  public sortOptions: DropdownOption[] = [
    { value: 'name', label: 'Sort: Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'spent_desc', label: 'Sort: Highest Spend', icon: 'currency_rupee' },
    { value: 'visits_desc', label: 'Sort: Most Visits', icon: 'repeat' },
  ];

  public pageSize = 10;
  public currentPage = 1;

  public showModal = false;
  public editingCustomerId: number | null = null;
  public form: any = {
    name: '',
    phone: '',
    email: '',
    address: '',
    image_url: '',
  };

  public historyCustomer: Customer | null = null;
  public purchaseHistory: any[] = [];

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.loadError = null;
    this.customerService.getCustomers(1, 200, this.searchQuery).subscribe({
      next: (res) => {
          this.isLoading = false;
        if (res.success) {
          this.customers = res.data.map((c) => ({ ...c, selected: false }));
        }
      },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load data from the server.';
        },
      });
  }

  get vipCount(): number {
    return this.customers.filter((c) => c.total_spent >= 2500).length;
  }

  get frequentCount(): number {
    return this.customers.filter((c) => c.total_visits >= 5).length;
  }

  getTier(c: Customer): string {
    if (c.total_spent >= 5000) return 'VIP Gold';
    if (c.total_spent >= 2500) return 'VIP Silver';
    if (c.total_visits >= 5) return 'Regular';
    return 'New Guest';
  }

  getTierBg(c: Customer): string {
    if (c.total_spent >= 5000) return '#FEF3C7';
    if (c.total_spent >= 2500) return '#F1F5F9';
    if (c.total_visits >= 5) return '#CCFBF1';
    return '#F3F4F6';
  }

  getTierColor(c: Customer): string {
    if (c.total_spent >= 5000) return '#B45309';
    if (c.total_spent >= 2500) return '#475569';
    if (c.total_visits >= 5) return '#0F766E';
    return '#6B7280';
  }

  get totalVisits(): number {
    return this.customers.reduce((sum, c) => sum + (c.total_visits || 0), 0);
  }

  get totalSpentAll(): number {
    return this.customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  }

  /** Share of customers who have visited more than once. */
  get repeatCustomerPercent(): number {
    if (this.customers.length === 0) return 0;
    const repeat = this.customers.filter((c) => (c.total_visits || 0) > 1).length;
    return (repeat / this.customers.length) * 100;
  }

  get avgSpend(): number {
    return this.customers.length === 0 ? 0 : this.totalSpentAll / this.customers.length;
  }

  get filteredCustomers(): (Customer & { selected?: boolean })[] {
    let list = this.customers;

    if (this.activeNavTab === 'vip') {
      list = list.filter((c) => c.total_spent >= 2500);
    } else if (this.activeNavTab === 'frequent') {
      list = list.filter((c) => c.total_visits >= 5);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    if (this.spendingFilter === 'HIGH') {
      list = list.filter((c) => c.total_spent >= 2000);
    } else if (this.spendingFilter === 'REGULAR') {
      list = list.filter((c) => c.total_spent < 2000);
    }

    if (this.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy === 'spent_desc') {
      list = [...list].sort((a, b) => b.total_spent - a.total_spent);
    } else if (this.sortBy === 'visits_desc') {
      list = [...list].sort((a, b) => b.total_visits - a.total_visits);
    }

    return list;
  }

  get paginatedCustomers(): (Customer & { selected?: boolean })[] {
    const list = this.filteredCustomers;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredCustomers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCustomers.length);
  }

  public isUploadingImage = false;

  private static readonly IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  private static readonly IMAGE_MAX_MB = 2;

  /**
   * Reads the picked file and uploads it straight away, so the form only ever
   * carries a stored URL. The server re-checks type and size; these checks are
   * here to fail fast without a round trip.
   */
  onPhotoFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared straight away so re-picking the same file after a failure still fires.
    picker.value = '';
    if (!file) return;

    const types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!types.includes(file.type)) {
      this.notify.error('Customer photo must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error(`Customer photo is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.customerService.uploadCustomerImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.form.image_url = res.data.url;
            this.notify.success('Photo uploaded — save to apply it.');
          } else {
            this.notify.error(res?.message || 'Photo upload failed.');
          }
        },
        error: (err) => {
          this.isUploadingImage = false;
          this.notify.error(err?.error?.message || 'Photo upload failed.');
        },
      });
    };

    this.isUploadingImage = true;
    reader.readAsDataURL(file);
  }

  getInitials(name: string): string {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  toggleSelectAll(): void {
    this.paginatedCustomers.forEach((c) => (c.selected = this.selectAll));
  }

  deleteSelected(): void {
    const selected = this.customers.filter((c) => c.selected);
    if (selected.length === 0) {
      this.notify.info('No guests selected');
      return;
    }

    this.notify.confirm({
      title: 'Delete Selected Guests',
      message: `Are you sure you want to delete ${selected.length} customer(s)?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        selected.forEach((c) => {
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          this.customerService.deleteCustomer(c.id).subscribe({ error: () => {} });
        });
        this.notify.success(`Deleted ${selected.length} customers`);
        this.loadCustomers();
      },
    });
  }

  exportCSV(): void {
    const items = this.filteredCustomers;
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Visits', 'Total Spent'];
    const rows = items.map((c) => [
      c.id,
      `"${c.name}"`,
      c.phone,
      `"${c.email || ''}"`,
      `"${c.address || ''}"`,
      c.total_visits,
      c.total_spent,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openAddModal(): void {
    this.editingCustomerId = null;
    this.form = { name: '', phone: '', email: '', address: '', image_url: '' };
    this.isUploadingImage = false;
    this.showModal = true;
  }

  openEditModal(c: Customer): void {
    this.editingCustomerId = c.id;
    this.form = { name: c.name, phone: c.phone, email: c.email, address: c.address, image_url: c.image_url || '' };
    this.isUploadingImage = false;
    this.showModal = true;
  }

  saveCustomer(): void {
    if (!this.form.name || !this.form.phone) {
      this.notify.error('Please enter customer name and phone');
      return;
    }

    if (this.editingCustomerId) {
      this.customerService.updateCustomer(this.editingCustomerId, this.form).subscribe({
        next: () => {
          this.notify.success('Customer updated');
          this.showModal = false;
          this.loadCustomers();
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => {},
      });
    } else {
      this.customerService.createCustomer(this.form).subscribe({
        next: () => {
          this.notify.success('Customer added');
          this.showModal = false;
          this.loadCustomers();
        },
        // Reported by the global error interceptor; present so a failure
        // cannot escape as an unhandled rejection.
        error: () => {},
      });
    }
  }

  deleteCustomer(c: Customer): void {
    this.notify.confirm({
      title: 'Delete Customer',
      message: `Are you sure you want to delete ${c.name}?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.customerService.deleteCustomer(c.id).subscribe({
          next: () => {
            this.notify.info('Customer deleted');
            this.loadCustomers();
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => {},
        });
      },
    });
  }

  viewHistory(c: Customer): void {
    this.historyCustomer = c;
    this.customerService.getPurchaseHistory(c.id).subscribe({
      next: (res) => {
        if (res.success) this.purchaseHistory = res.data;
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
    });
  }
}

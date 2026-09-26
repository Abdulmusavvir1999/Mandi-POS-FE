import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User, Role, Permission } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { StaffLayoutService } from '../../core/services/staff-layout.service';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../shared/styles/default-action-buttons.styles';
import { STAFF_LAYOUT_CSS } from '../../shared/styles/staff-layout.styles';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';

interface ModuleGroup {
  name: string;
  label: string;
  icon: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, CustomDropdownComponent, RouterLink, ActionLoadingDirective],
  styles: [STAFF_LAYOUT_CSS, DEFAULT_ACTION_BUTTON_CSS],
  template: `
    <div class="users-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading staff accounts…"
        subMessage="Fetching user records from the server."
        icon="group"
        (retry)="loadAllData()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>Team &amp; Roles</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ activeMainTab === 'users' ? 'Staff Accounts' : 'Dynamic Roles & Permissions' }}</span>
      </div>

      <div class="users-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">{{ activeMainTab === 'users' ? 'badge' : 'admin_panel_settings' }}</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">{{ activeMainTab === 'users' ? 'Staff Accounts & Access' : 'Dynamic Roles & Permission Matrix' }}</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ activeCount }} Active Staff</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">manage_accounts</span>
                <span>Fully Dynamic Role-Based Access Control (RBAC)</span>
              </span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">shield</span>
                <span>{{ roles.length }} Custom Roles Defined</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <a
            routerLink="/settings"
            [queryParams]="{ tab: 'staffdesign' }"
            class="action-btn btn-outline-purple"
            title="Customize Staff & Roles Page Design"
          >
            <span class="material-symbols-outlined">palette</span>
            <span>Customize</span>
          </a>

          <button
            type="button"
            (click)="loadAllData()"
            class="action-btn btn-outline-purple"
            title="Refresh records"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            *ngIf="activeMainTab === 'users'"
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline-purple"
            title="Export CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            *ngIf="activeMainTab === 'users'"
            type="button"
            (click)="openAddUserModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">person_add</span>
            <span>New Staff User</span>
          </button>

          <button
            *ngIf="activeMainTab === 'roles'"
            type="button"
            (click)="openAddRoleModal()"
            class="action-btn btn-gradient-purple"
            [title]="isRoleLimitReached
              ? 'Role limit reached - a maximum of ' + maxCustomRoles + ' custom roles can be created'
              : 'Create a new custom role'"
          >
            <span class="material-symbols-outlined">add_moderator</span>
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. PRIMARY NAVIGATION: STAFF ACCOUNTS vs ROLES & PERMISSIONS     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tabs-scroll-container">
        <button
          type="button"
          class="tab-scroll-arrow-btn prev"
          (click)="scrollTabs(primaryTabsRef, -220)"
          aria-label="Scroll primary tabs left"
          title="Scroll Left"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <div class="module-tabs-bar" #primaryTabsRef>
          <button
            type="button"
            (click)="switchMainTab('users', $event)"
            class="module-tab-btn"
            [class.is-active]="activeMainTab === 'users'"
          >
            <span class="material-symbols-outlined">group</span>
            <span>Staff Accounts</span>
            <span class="tab-count-badge">{{ users.length }}</span>
          </button>

          <button
            type="button"
            (click)="switchMainTab('roles', $event)"
            class="module-tab-btn"
            [class.is-active]="activeMainTab === 'roles'"
          >
            <span class="material-symbols-outlined">security</span>
            <span>Dynamic Roles &amp; Permissions</span>
            <span class="tab-count-badge">{{ roles.length }}</span>
          </button>
        </div>

        <button
          type="button"
          class="tab-scroll-arrow-btn next"
          (click)="scrollTabs(primaryTabsRef, 220)"
          aria-label="Scroll primary tabs right"
          title="Scroll Right"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- =============================================================== -->
      <!-- TAB 1: STAFF ACCOUNTS MANAGEMENT                                -->
      <!-- =============================================================== -->
      <ng-container *ngIf="activeMainTab === 'users'">
        <!-- Dynamic Sub-Navigation Role Tabs with Scroll to View Controls -->
        <div class="tabs-scroll-container">
          <button
            type="button"
            class="tab-scroll-arrow-btn prev"
            (click)="scrollTabs(roleTabsRef, -220)"
            aria-label="Scroll role filters left"
            title="Scroll Left"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <div class="module-tabs-bar" #roleTabsRef>
            <button
              type="button"
              (click)="selectRoleFilter('', $event)"
              class="module-tab-btn"
              [class.is-active]="selectedRole === ''"
            >
              <span class="material-symbols-outlined">group</span>
              <span>All Staff</span>
              <span class="tab-count-badge">{{ users.length }}</span>
            </button>

            <!-- Fully Dynamic Role Tabs from Database -->
            <button
              type="button"
              *ngFor="let r of roles"
              (click)="selectRoleFilter(r.name, $event)"
              class="module-tab-btn"
              [class.is-active]="selectedRole === r.name"
            >
              <span class="material-symbols-outlined">{{ getRoleIcon(r.name) }}</span>
              <span>{{ r.name }}</span>
              <span class="tab-count-badge">{{ countByRole(r.name) }}</span>
            </button>
          </div>

          <button
            type="button"
            class="tab-scroll-arrow-btn next"
            (click)="scrollTabs(roleTabsRef, 220)"
            aria-label="Scroll role filters right"
            title="Scroll Right"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <!-- 6 KPI Metric Mini Cards Strip -->
        <div class="kpi-cards-grid" id="staff-kpi-section">
          <!-- 1. Total Staff -->
          <div class="kpi-card card-accent-purple">
            <div class="kpi-header-row">
              <span class="kpi-title">Total Staff</span>
              <span class="kpi-icon-bubble bg-purple-tint">
                <span class="material-symbols-outlined">groups</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ users.length }}</span>
              <span class="kpi-pill pill-purple">Members</span>
            </div>
          </div>

          <!-- 2. Active Shifts -->
          <div class="kpi-card card-accent-green">
            <div class="kpi-header-row">
              <span class="kpi-title">Active Accounts</span>
              <span class="kpi-icon-bubble bg-green-tint">
                <span class="material-symbols-outlined">how_to_reg</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number text-green">{{ activeCount }}</span>
              <span class="kpi-pill pill-live">● Online</span>
            </div>
          </div>

          <!-- 3. Dynamic Top Role 1 -->
          <div class="kpi-card card-accent-purple" *ngIf="roles[0]">
            <div class="kpi-header-row">
              <span class="kpi-title">{{ roles[0].name }}</span>
              <span class="kpi-icon-bubble bg-purple-tint">
                <span class="material-symbols-outlined">{{ getRoleIcon(roles[0].name) }}</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ countByRole(roles[0].name) }}</span>
              <span class="kpi-pill pill-purple">Assigned</span>
            </div>
          </div>

          <!-- 4. Dynamic Top Role 2 -->
          <div class="kpi-card card-accent-amber" *ngIf="roles[1]">
            <div class="kpi-header-row">
              <span class="kpi-title">{{ roles[1].name }}</span>
              <span class="kpi-icon-bubble bg-amber-tint">
                <span class="material-symbols-outlined">{{ getRoleIcon(roles[1].name) }}</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ countByRole(roles[1].name) }}</span>
              <span class="kpi-pill pill-amber">Assigned</span>
            </div>
          </div>

          <!-- 5. Dynamic Top Role 3 -->
          <div class="kpi-card card-accent-teal" *ngIf="roles[2]">
            <div class="kpi-header-row">
              <span class="kpi-title">{{ roles[2].name }}</span>
              <span class="kpi-icon-bubble bg-teal-tint">
                <span class="material-symbols-outlined">{{ getRoleIcon(roles[2].name) }}</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number text-teal-700">{{ countByRole(roles[2].name) }}</span>
              <span class="kpi-pill pill-teal">Assigned</span>
            </div>
          </div>

          <!-- 6. Total Dynamic Role Groups -->
          <div class="kpi-card card-accent-blue">
            <div class="kpi-header-row">
              <span class="kpi-title">Dynamic Roles</span>
              <span class="kpi-icon-bubble bg-blue-tint">
                <span class="material-symbols-outlined">account_tree</span>
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-number">{{ roles.length }}</span>
              <span class="kpi-pill pill-blue">RBAC Tiers</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Action Toolbar -->
        <div class="filter-toolbar-card">
          <div class="filter-controls-group">
            <!-- Search Box -->
            <div class="search-input-wrapper">
              <span class="material-symbols-outlined search-icon">search</span>
              <input
                title="Search users"
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="currentPage = 1"
                placeholder="Search staff by name, username, email or role..."
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

            <!-- Fully Dynamic Role Selector Dropdown -->
            <app-custom-dropdown
              [options]="dynamicRoleOptions"
              [(ngModel)]="selectedRole"
              (valueChange)="currentPage = 1"
              placeholder="All Staff Roles"
              minWidth="200px"
            ></app-custom-dropdown>

            <span class="results-counter-pill">
              Showing {{ filteredUsers.length }} staff
            </span>
          </div>

          <div class="filter-actions-group">
            <button
              *ngIf="hasSelectedUsers"
              type="button"
              (click)="deleteSelectedUsers()"
              class="action-btn btn-sm btn-outline-danger"
            >
              <span class="material-symbols-outlined text-[17px]">delete</span>
              <span>Delete Selected ({{ selectedCount }})</span>
            </button>

            <button
              type="button"
              (click)="loadUsers()"
              class="action-btn btn-sm btn-outline-purple"
              title="Reload list"
            >
              <span class="material-symbols-outlined text-[17px]">refresh</span>
              <span>Reload</span>
            </button>

            <!-- Scroll to Table Button -->
            <button
              type="button"
              (click)="scrollToView('staff-table-section')"
              class="scroll-to-view-btn"
              title="Smoothly scroll to staff table"
            >
              <span class="material-symbols-outlined">south</span>
              <span>Scroll to View</span>
            </button>
          </div>
        </div>

        <!-- Users Dynamic Staff Stage (5 Radically Distinct Layouts) -->
        <div
          class="staff-stage"
          [ngClass]="staffLayout.rootClass()"
          [ngStyle]="staffLayout.pageCssVars()"
          id="staff-table-section"
        >
          <!-- 1. Executive Security ID Badge (idcard) -->
          <div *ngIf="staffLayout.effectiveKey() === 'idcard'" class="staff-id-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-id-card">
              <!-- Physical Lanyard Strap & Punch Slot -->
              <div class="staff-id-top-strap">
                <div class="staff-id-punch-slot"></div>
                <span class="staff-id-strap-label">SECURE ACCESS CREDENTIAL</span>
              </div>
              <div class="staff-id-hologram-strip"></div>

              <div class="staff-id-card-content">
                <div class="staff-id-avatar-circle">
                  <div class="staff-id-avatar-img-box">
                    <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                    <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                  </div>
                  <span
                    class="staff-id-active-pulse"
                    [class.is-inactive]="u.status !== 'ACTIVE'"
                    [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #10B981)' : 'var(--danger, #EF4444)'"
                  ></span>
                </div>

                <div class="flex items-center justify-center gap-1.5 mb-1">
                  <input
                    title="Select this user"
                    type="checkbox"
                    [(ngModel)]="u.selected"
                    class="custom-checkbox"
                  />
                  <h4 class="staff-id-title-name">{{ u.name }}</h4>
                </div>
                <div class="staff-id-handle-tag">&#64;{{ u.username }}</div>

                <div class="staff-id-clearance-badge" [ngStyle]="getRoleBadgeStyle(u.role)">
                  <span class="material-symbols-outlined" style="font-size: 14px;">{{ getRoleIcon(u.role) }}</span>
                  <span>{{ u.role }} · CLEARANCE</span>
                </div>

                <div class="staff-id-contact-chips">
                  <div class="staff-id-chip-row">
                    <span class="material-symbols-outlined" style="font-size: 13px; color: var(--staff-accent-color, #4F46E5);">mail</span>
                    <span class="truncate">{{ u.email }}</span>
                  </div>
                  <div class="staff-id-chip-row font-mono" *ngIf="u.phone">
                    <span class="material-symbols-outlined" style="font-size: 13px; color: var(--staff-accent-color, #4F46E5);">call</span>
                    <span>{{ u.phone }}</span>
                  </div>
                </div>
              </div>

              <!-- Barcode Graphic Footer -->
              <div class="staff-id-barcode-footer">
                <div class="staff-id-barcode-art">
                  <span class="staff-id-barcode-bar w-thick"></span>
                  <span class="staff-id-barcode-bar"></span>
                  <span class="staff-id-barcode-bar w-mid"></span>
                  <span class="staff-id-barcode-bar"></span>
                  <span class="staff-id-barcode-bar w-thick"></span>
                  <span class="staff-id-barcode-bar w-mid"></span>
                  <span class="staff-id-barcode-bar"></span>
                  <span class="staff-id-barcode-bar w-thick"></span>
                  <span class="staff-id-barcode-bar"></span>
                </div>
                <span class="staff-id-barcode-label">EMP-00{{ u.id }}</span>
                <div class="staff-id-card-actions">
                  <button type="button" (click)="openEditUserModal(u)" class="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-indigo-600" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="w-7 h-7 rounded flex items-center justify-center text-rose-400 hover:text-rose-600" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Obsidian Dark Matrix (darkneon) -->
          <div *ngIf="staffLayout.effectiveKey() === 'darkneon'" class="staff-dark-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-dark-card">
              <div class="staff-dark-hud-bar">
                <span>TERMINAL // SYS-0{{ u.id }}</span>
                <div class="flex items-center gap-1.5">
                  <input
                    title="Select user"
                    type="checkbox"
                    [(ngModel)]="u.selected"
                    class="custom-checkbox"
                  />
                  <span class="staff-dark-radar-dot" [class.is-off]="u.status !== 'ACTIVE'"></span>
                  <span>{{ u.status === 'ACTIVE' ? 'LIVE' : 'OFFLINE' }}</span>
                </div>
              </div>

              <div class="staff-dark-center">
                <div class="staff-dark-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <div>
                  <h4 class="staff-dark-name">{{ u.name }}</h4>
                  <div class="staff-dark-sub">&#64;{{ u.username }}</div>
                  <span class="staff-dark-role-pill">[ {{ u.role | uppercase }} ]</span>
                </div>
              </div>

              <div class="staff-dark-console-box">
                <div class="flex items-center justify-between">
                  <span>CLEARANCE:</span>
                  <span class="text-cyan-400 font-bold">LEVEL {{ u.id }} // PERM: {{ countUserPermissions(u) }}</span>
                </div>
                <div class="flex items-center justify-between truncate">
                  <span>CONTACT:</span>
                  <span class="text-slate-300 truncate">{{ u.email }}</span>
                </div>
              </div>

              <div class="staff-dark-footer">
                <span class="text-[10px] font-mono text-slate-400">
                  LOGIN: {{ (u.last_login_at || u.lastLoginAt) ? ((u.last_login_at || u.lastLoginAt) | date:'dd/MM HH:mm') : 'OFFLINE' }}
                </span>
                <div class="flex items-center gap-1.5">
                  <button type="button" (click)="openEditUserModal(u)" class="staff-dark-btn-glow" title="Configure">
                    <span class="material-symbols-outlined" style="font-size: 13px;">tune</span>
                    <span>CONFIG</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-dark-btn-danger" title="Purge">
                    <span class="material-symbols-outlined" style="font-size: 13px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Horizontal Roster Stream (roster) -->
          <div *ngIf="staffLayout.effectiveKey() === 'roster'" class="staff-roster-list">
            <div *ngFor="let u of paginatedUsers" class="staff-roster-strip">
              <div class="staff-roster-left">
                <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                <div class="staff-roster-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <div class="staff-roster-meta">
                  <h4 class="staff-roster-name">{{ u.name }}</h4>
                  <span class="staff-roster-sub">&#64;{{ u.username }} · {{ u.role }}</span>
                </div>
              </div>

              <!-- Center Permissions Coverage Gauge -->
              <div class="staff-roster-gauge-col">
                <div class="staff-roster-gauge-head">
                  <span>Permissions Active</span>
                  <span class="text-teal-700 font-bold">{{ countUserPermissions(u) }} / {{ permissions.length || 24 }}</span>
                </div>
                <div class="staff-roster-gauge-bar">
                  <div class="staff-roster-gauge-fill" [style.width.%]="calculatePermissionProgress(u)"></div>
                </div>
              </div>

              <div class="staff-roster-contacts hidden md:flex">
                <span class="font-medium text-slate-700">{{ u.email }}</span>
                <span class="font-mono text-[11px] text-slate-400" *ngIf="u.phone">{{ u.phone }}</span>
              </div>

              <div class="staff-roster-actions">
                <button type="button" (click)="openEditUserModal(u)" class="staff-roster-pill-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
                  <span>Edit Staff</span>
                </button>
                <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-roster-pill-btn is-delete" title="Delete">
                  <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. Enterprise SaaS Power Table (list) -->
          <div *ngIf="staffLayout.effectiveKey() === 'list'" class="staff-power-table-card">
            <table class="staff-power-table">
              <thead>
                <tr>
                  <th style="width: 44px; text-align: center;">
                    <input title="Select all" type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()" class="custom-checkbox" />
                  </th>
                  <th style="width: 28%;">Staff Member</th>
                  <th style="width: 20%;">Role Assignment</th>
                  <th style="width: 24%;">Contact Details</th>
                  <th style="width: 14%;">Status</th>
                  <th style="width: 14%; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of paginatedUsers">
                  <td style="text-align: center;">
                    <input title="Select this user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                  </td>
                  <td>
                    <div class="staff-power-user">
                      <div class="staff-power-avatar">
                        <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                        <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900">{{ u.name }}</div>
                        <div class="text-xs text-slate-400 font-mono">&#64;{{ u.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="staff-power-badge" [ngStyle]="getRoleBadgeStyle(u.role)">
                      <span class="material-symbols-outlined text-[13px]">{{ getRoleIcon(u.role) }}</span>
                      <span>{{ u.role }}</span>
                    </span>
                  </td>
                  <td>
                    <div class="flex flex-col text-xs">
                      <span class="font-medium text-slate-800">{{ u.email }}</span>
                      <span class="text-slate-400 font-mono" *ngIf="u.phone">{{ u.phone }}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #16A34A)' : 'var(--text-muted, #64748B)'"
                      ></span>
                      {{ u.status || 'Active' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <div class="flex items-center justify-center gap-1">
                      <button type="button" (click)="openEditUserModal(u)" class="dv-btn is-icon" title="Edit">
                        <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                      </button>
                      <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="dv-btn is-icon is-danger" title="Delete">
                        <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 5. Modern Bento Metric Profile (bento) -->
          <div *ngIf="staffLayout.effectiveKey() === 'bento'" class="staff-bento-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-bento-card">
              <div class="staff-bento-hero">
                <div class="flex items-center gap-2">
                  <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                  <span class="staff-bento-status-pill" [class.is-off]="u.status !== 'ACTIVE'">
                    {{ u.status || 'ACTIVE' }}
                  </span>
                </div>
              </div>

              <div class="staff-bento-body">
                <div class="staff-bento-avatar-bubble">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <h4 class="staff-bento-name">{{ u.name }}</h4>
                <div class="staff-bento-handle">&#64;{{ u.username }}</div>
                <span class="staff-bento-role-chip" [ngStyle]="getRoleBadgeStyle(u.role)">{{ u.role }}</span>

                <!-- Two Inner Bento Stat Tiles -->
                <div class="staff-bento-stat-boxes">
                  <div class="staff-bento-tile">
                    <span class="staff-bento-tile-lbl">Access Tier</span>
                    <span class="staff-bento-tile-val truncate">{{ u.role }}</span>
                  </div>
                  <div class="staff-bento-tile">
                    <span class="staff-bento-tile-lbl">Permissions</span>
                    <span class="staff-bento-tile-val">{{ countUserPermissions(u) }} Active</span>
                  </div>
                </div>

                <div class="staff-bento-contacts">
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="material-symbols-outlined text-[13px] text-purple-600">mail</span>
                    <span class="truncate">{{ u.email }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 truncate font-mono text-[11px]" *ngIf="u.phone">
                    <span class="material-symbols-outlined text-[13px] text-purple-600">call</span>
                    <span>{{ u.phone }}</span>
                  </div>
                </div>
              </div>

              <div class="staff-bento-footer">
                <span class="text-[11px] text-slate-500">
                  <strong>{{ (u.last_login_at || u.lastLoginAt) ? ((u.last_login_at || u.lastLoginAt) | date:'dd/MM/yy') : 'Never' }}</strong>
                </span>
                <div class="flex items-center gap-1">
                  <button type="button" (click)="openEditUserModal(u)" class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 hover:bg-purple-100" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Frosted Glass Aurora (glassmorphism) -->
          <div *ngIf="staffLayout.effectiveKey() === 'glassmorphism'" class="staff-glass-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-glass-card">
              <div class="staff-glass-avatar">
                <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
              </div>
              <div class="flex items-center gap-2 mb-1">
                <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                <h4 class="staff-glass-name">{{ u.name }}</h4>
              </div>
              <div class="staff-glass-handle">&#64;{{ u.username }}</div>
              <div class="staff-glass-role">
                <span class="staff-glass-status" [style.color]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #34D399)' : 'var(--danger, #EF4444)'" [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #34D399)' : 'var(--danger, #EF4444)'"></span>
                <span class="material-symbols-outlined" style="font-size: 13px;">{{ getRoleIcon(u.role) }}</span>
                <span>{{ u.role }}</span>
              </div>
              <div class="staff-glass-info">
                <div class="flex items-center gap-1.5 truncate">
                  <span class="material-symbols-outlined" style="font-size: 13px;">mail</span>
                  <span class="truncate">{{ u.email }}</span>
                </div>
                <div class="flex items-center gap-1.5" *ngIf="u.phone">
                  <span class="material-symbols-outlined" style="font-size: 13px;">call</span>
                  <span>{{ u.phone }}</span>
                </div>
              </div>
              <div class="staff-glass-actions">
                <button type="button" (click)="openEditUserModal(u)" class="staff-glass-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
                  <span>Edit</span>
                </button>
                <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-glass-btn is-delete" title="Delete">
                  <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 7. Neo-Brutalism Pop (retrobrutalist) -->
          <div *ngIf="staffLayout.effectiveKey() === 'retrobrutalist'" class="staff-brutal-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-brutal-card">
              <div class="staff-brutal-header">
                <span class="staff-brutal-header-label">STAFF // {{ u.role | uppercase }}</span>
                <span class="staff-brutal-status-tag" [class.is-off]="u.status !== 'ACTIVE'">
                  {{ u.status === 'ACTIVE' ? 'ONLINE' : 'OFFLINE' }}
                </span>
              </div>
              <div class="staff-brutal-body">
                <div class="staff-brutal-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <div class="staff-brutal-meta">
                  <div class="flex items-center gap-2">
                    <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                    <h4 class="staff-brutal-name">{{ u.name }}</h4>
                  </div>
                  <div class="staff-brutal-handle">&#64;{{ u.username }}</div>
                  <span class="staff-brutal-role-sticker" [ngStyle]="getRoleBadgeStyle(u.role)">{{ u.role }}</span>
                </div>
              </div>
              <div class="staff-brutal-contact">
                <span>{{ u.email }}</span>
                <span *ngIf="u.phone" class="font-mono">{{ u.phone }}</span>
              </div>
              <div class="staff-brutal-footer">
                <span class="text-[10px] font-mono font-bold text-slate-700">
                  PERMS: {{ countUserPermissions(u) }} / {{ permissions.length || 24 }}
                </span>
                <div class="flex items-center gap-2">
                  <button type="button" (click)="openEditUserModal(u)" class="staff-brutal-btn" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 13px;">edit</span>
                    <span>EDIT</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-brutal-btn is-delete" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 13px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 8. Flat Metro Grid (metro) -->
          <div *ngIf="staffLayout.effectiveKey() === 'metro'" class="staff-metro-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-metro-tile">
              <span class="staff-metro-watermark">{{ u.role }}</span>
              <div class="staff-metro-check">
                <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
              </div>
              <span class="staff-metro-status" [style.backgroundColor]="u.status === 'ACTIVE' ? 'var(--staff-status-active-color, #34D399)' : 'var(--danger, #EF4444)'"></span>
              <div class="staff-metro-content">
                <div class="staff-metro-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <h4 class="staff-metro-name">{{ u.name }}</h4>
                <div class="staff-metro-sub">&#64;{{ u.username }} · {{ u.email }}</div>
                <span class="staff-metro-role-tag">
                  <span class="material-symbols-outlined" style="font-size: 12px;">{{ getRoleIcon(u.role) }}</span>
                  {{ u.role }}
                </span>
                <div class="staff-metro-actions">
                  <button type="button" (click)="openEditUserModal(u)" class="staff-metro-btn" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-metro-btn" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Vertical Activity Timeline (timeline) -->
          <div *ngIf="staffLayout.effectiveKey() === 'timeline'" class="staff-timeline-feed">
            <div *ngFor="let u of paginatedUsers" class="staff-timeline-item">
              <div class="staff-timeline-node" [class.is-active]="u.status === 'ACTIVE'"></div>
              <div class="staff-timeline-card">
                <div class="staff-timeline-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
                <div class="staff-timeline-meta">
                  <div class="flex items-center gap-2">
                    <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                    <h4 class="staff-timeline-name">{{ u.name }}</h4>
                  </div>
                  <div class="staff-timeline-handle">&#64;{{ u.username }}</div>
                  <div class="staff-timeline-tags">
                    <span class="staff-timeline-role" [ngStyle]="getRoleBadgeStyle(u.role)">
                      <span class="material-symbols-outlined" style="font-size: 11px;">{{ getRoleIcon(u.role) }}</span>
                      {{ u.role }}
                    </span>
                    <span class="staff-timeline-time">
                      <span class="material-symbols-outlined" style="font-size: 11px;">schedule</span>
                      {{ (u.last_login_at || u.lastLoginAt) ? ((u.last_login_at || u.lastLoginAt) | date:'dd/MM HH:mm') : 'Never' }}
                    </span>
                  </div>
                  <div class="staff-timeline-contact">
                    <span>{{ u.email }}</span>
                    <span *ngIf="u.phone" class="font-mono text-xs">{{ u.phone }}</span>
                  </div>
                </div>
                <div class="staff-timeline-actions">
                  <button type="button" (click)="openEditUserModal(u)" class="staff-timeline-btn" title="Edit">
                    <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                  </button>
                  <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-timeline-btn is-delete" title="Delete">
                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 10. Floating Capsule Chips (compactpill) -->
          <div *ngIf="staffLayout.effectiveKey() === 'compactpill'" class="staff-pill-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-pill-chip">
              <div class="staff-pill-avatar">
                <span class="staff-pill-halo" [class.is-active]="u.status === 'ACTIVE'"></span>
                <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
              </div>
              <div class="staff-pill-meta">
                <div class="flex items-center gap-2">
                  <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                  <span class="staff-pill-name">{{ u.name }}</span>
                </div>
                <span class="staff-pill-handle">&#64;{{ u.username }}</span>
              </div>
              <span class="staff-pill-role" [ngStyle]="getRoleBadgeStyle(u.role)">
                <span class="material-symbols-outlined" style="font-size: 12px;">{{ getRoleIcon(u.role) }}</span>
                {{ u.role }}
              </span>
              <div class="staff-pill-contact hidden md:flex">
                <span>{{ u.email }}</span>
                <span *ngIf="u.phone" class="font-mono text-xs">{{ u.phone }}</span>
              </div>
              <div class="staff-pill-actions">
                <button type="button" (click)="openEditUserModal(u)" class="staff-pill-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                </button>
                <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-pill-btn is-delete" title="Delete">
                  <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 11. Sci-Fi Radial HUD (radialhud) -->
          <div *ngIf="staffLayout.effectiveKey() === 'radialhud'" class="staff-hud-grid">
            <div *ngFor="let u of paginatedUsers" class="staff-hud-card">
              <div class="staff-hud-coords">
                <span>UNIT-{{ u.id }}</span>
                <span>{{ u.status === 'ACTIVE' ? '◉ ONLINE' : '○ OFFLINE' }}</span>
              </div>
              <div class="staff-hud-ring-wrap" [style.--perm-pct]="calculatePermissionProgress(u)">
                <div class="staff-hud-perm-ring"></div>
                <div class="staff-hud-avatar">
                  <img *ngIf="u.image_url" [src]="settingsService.assetUrl(u.image_url)" [alt]="u.name" />
                  <span *ngIf="!u.image_url">{{ getInitials(u.name) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 mb-1">
                <input title="Select user" type="checkbox" [(ngModel)]="u.selected" class="custom-checkbox" />
                <h4 class="staff-hud-name">{{ u.name }}</h4>
              </div>
              <div class="staff-hud-handle">&#64;{{ u.username }}</div>
              <span class="staff-hud-role" [ngStyle]="getRoleBadgeStyle(u.role)">
                <span class="material-symbols-outlined" style="font-size: 12px;">{{ getRoleIcon(u.role) }}</span>
                {{ u.role }}
              </span>
              <div class="staff-hud-telemetry">
                <div class="staff-hud-stat">
                  <span class="staff-hud-stat-label">Perms</span>
                  <span class="staff-hud-stat-value">{{ countUserPermissions(u) }}/{{ permissions.length || 24 }}</span>
                </div>
                <div class="staff-hud-stat">
                  <span class="staff-hud-stat-label">Access</span>
                  <span class="staff-hud-stat-value">L{{ u.id }}</span>
                </div>
              </div>
              <div class="staff-hud-contact">
                <span>{{ u.email }}</span>
                <span *ngIf="u.phone">{{ u.phone }}</span>
              </div>
              <div class="staff-hud-actions">
                <button type="button" (click)="openEditUserModal(u)" class="staff-hud-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
                  <span>MODIFY</span>
                </button>
                <button *ngIf="u.username !== 'admin'" type="button" (click)="deleteUser(u)" class="staff-hud-btn is-delete" title="Delete">
                  <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredUsers.length === 0" class="empty-state-box my-8">
            <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'group_off' }}</span>
            <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Staff Accounts Found' }}</div>
            <p class="empty-desc">{{ isLoading ? 'Fetching records from server…' : loadError ? loadError : 'No users match your selected role filter or search query.' }}</p>
            <button type="button" (click)="selectedRole = ''; searchQuery = ''; currentPage = 1" class="action-btn btn-sm btn-outline-purple mt-2">
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

          <!-- Bottom Pagination Bar -->
          <div class="pagination-footer-bar" *ngIf="filteredUsers.length > 0">
            <div class="pagination-info">
              Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ filteredUsers.length }}</strong> users
            </div>

            <div class="pagination-controls">
              <button
                type="button"
                [disabled]="currentPage <= 1"
                (click)="currentPage = currentPage - 1"
                class="page-nav-btn"
                title="Previous page"
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
                title="Next page"
              >
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
      </ng-container>

      <!-- =============================================================== -->
      <!-- TAB 2: DYNAMIC ROLES & PERMISSIONS MATRIX                       -->
      <!-- =============================================================== -->
      <ng-container *ngIf="activeMainTab === 'roles'">
        <!-- Roles Grid -->
        <div class="roles-grid" id="roles-grid-section">
          <div *ngFor="let r of roles" class="role-manage-card">
            <div>
              <div class="role-card-top">
                <div class="role-icon-box" [ngStyle]="getRoleIconBoxStyle(r.name)">
                  <span class="material-symbols-outlined text-[24px]">{{ getRoleIcon(r.name) }}</span>
                </div>
                <div class="role-info-col">
                  <h3 class="role-name-title">
                    <span>{{ r.name }}</span>
                    <span
                      class="role-origin-badge"
                      [class.is-default]="r.is_system"
                      [class.is-manual]="!r.is_system"
                      [title]="r.is_system
                        ? 'Built-in role, shipped with the system'
                        : 'Created manually, counts towards the limit of ' + maxCustomRoles"
                    >
                      <span class="material-symbols-outlined">
                        {{ r.is_system ? 'lock' : 'edit' }}
                      </span>
                      {{ r.is_system ? 'Default' : 'Manual' }}
                    </span>
                  </h3>
                  <p class="role-desc-text">{{ r.description || 'Custom defined staff role' }}</p>
                </div>
              </div>

              <div class="role-stats-pills">
                <div class="role-stat-pill">
                  <span class="material-symbols-outlined text-[15px]">group</span>
                  <span>{{ r.user_count || 0 }} Staff Assigned</span>
                </div>
                <div class="role-stat-pill text-purple-700">
                  <span class="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>{{ (r.permissions?.length || 0) }} / {{ permissions.length }} Permissions</span>
                </div>
              </div>
            </div>

            <div class="role-card-actions">
              <button
                type="button"
                (click)="openConfigureRoleModal(r)"
                class="action-btn btn-sm btn-outline-purple flex-1 justify-center"
              >
                <span class="material-symbols-outlined text-[16px]">tune</span>
                <span>Edit Permissions</span>
              </button>

              <button
                *ngIf="!r.is_system"
                type="button"
                (click)="deleteRole(r)"
                class="btn-action-icon is-danger ml-2"
                title="Delete this role"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- USER ADD / EDIT MODAL                                           -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="showUserModal" class="modal-backdrop-layer">
        <div class="custom-modal-box">
          <div class="modal-header-bar">
            <div class="flex items-center gap-3">
              <div class="modal-icon-badge">
                <span class="material-symbols-outlined">{{ editingUserId ? 'manage_accounts' : 'person_add' }}</span>
              </div>
              <div>
                <h2 class="text-base font-bold text-[var(--text-main, #1F2937)] leading-tight m-0">
                  {{ editingUserId ? 'Edit Staff Account' : 'Add New Staff Member' }}
                </h2>
                <p class="text-xs text-[var(--text-muted, #6B7280)] m-0 mt-0.5">
                  {{ editingUserId ? 'Update user profile and assign dynamic roles.' : 'Create a new staff login with dynamic RBAC permissions.' }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="showUserModal = false"
              class="modal-close-btn"
              title="Close dialog"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveUser()" class="p-6 space-y-4" autocomplete="off">
            <!-- Hidden dummy inputs to capture and neutralize aggressive browser credential autofill -->
            <input type="text" name="fake_username_remembered" style="display:none" tabindex="-1" autocomplete="off" />
            <input type="password" name="fake_password_remembered" style="display:none" tabindex="-1" autocomplete="new-password" />

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                Full Name
              </label>
              <input
                title="Full Name"
                type="text"
                [(ngModel)]="userForm.name"
                name="staff_name"
                autocomplete="off"
                placeholder="e.g. Rahul Sharma"
                class="form-control text-sm w-full font-medium"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                  Username
                </label>
                <input
                  title="Username"
                  type="text"
                  [(ngModel)]="userForm.username"
                  name="staff_username"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  placeholder="e.g. cashier1"
                  class="form-control font-mono text-sm w-full"
                  [disabled]="!!editingUserId"
                  required
                />
              </div>

              <!-- Fully Dynamic Role Select Dropdown -->
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-1 block">
                  Staff Role (Dynamic)
                </label>
                <app-custom-dropdown
                  [options]="formRoleOptions"
                  [(ngModel)]="userForm.roleId"
                  name="staff_roleId"
                  placeholder="Select Staff Role"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                Email Address
              </label>
              <input
                title="Email Address"
                type="email"
                [(ngModel)]="userForm.email"
                name="staff_email"
                autocomplete="off"
                placeholder="user@projectx.com"
                class="form-control text-sm w-full"
                [disabled]="!!editingUserId"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                  Phone Number (Optional)
                </label>
                <input
                  title="Phone Number (Optional)"
                  type="tel"
                  [(ngModel)]="userForm.phone"
                  name="staff_phone"
                  autocomplete="off"
                  placeholder="+91 98765 00000"
                  class="form-control font-mono text-sm w-full"
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-1 block">
                  Status
                </label>
                <app-custom-dropdown
                  [options]="statusOptions"
                  [(ngModel)]="userForm.status"
                  name="staff_status"
                  placeholder="Select Status"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                {{ editingUserId ? 'New Password (Leave blank to keep unchanged)' : 'Password' }}
              </label>
              <input
                [title]="editingUserId ? 'New Password (Leave blank to keep unchanged)' : 'Password'"
                type="password"
                [(ngModel)]="userForm.password"
                name="staff_password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="form-control font-mono text-sm w-full"
                [required]="!editingUserId"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                Staff Photo (Optional)
              </label>
              <div class="image-upload-row">
                <div class="image-upload-preview" [class.is-empty]="!userForm.image_url">
                  <img *ngIf="userForm.image_url" [src]="settingsService.assetUrl(userForm.image_url)" alt="Staff Photo preview" />
                  <span *ngIf="!userForm.image_url" class="material-symbols-outlined">add_a_photo</span>
                </div>
                <div class="image-upload-actions">
                  <input
                    type="file"
                    hidden
                    #staffPicker
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    (change)="onPhotoFile($event, staffPicker)"
                    title="Choose staff photo"
                  />
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      [disabled]="isUploadingImage"
                      (click)="staffPicker.click()"
                    >
                      <span class="material-symbols-outlined">{{ isUploadingImage ? 'progress_activity' : 'upload' }}</span>
                      <span>{{ isUploadingImage ? 'Uploading…' : (userForm.image_url ? 'Replace' : 'Choose Photo') }}</span>
                    </button>
                    <button
                      *ngIf="userForm.image_url && !isUploadingImage"
                      type="button"
                      class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                      (click)="userForm.image_url = ''"
                    >
                      <span class="material-symbols-outlined">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                  <p class="image-upload-hint">PNG, JPG, WEBP or GIF · up to 2 MB</p>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[var(--card-border, #E9D5FF)]">
              <button
                type="button"
                (click)="showUserModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                {{ editingUserId ? 'Save Changes ✓' : 'Create Account ✓' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DYNAMIC ROLE CREATION / PERMISSIONS MATRIX MODAL                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="showRoleModal" class="modal-backdrop-layer">
        <div class="custom-modal-box is-wide">
          <div class="modal-header-bar">
            <div class="flex items-center gap-3">
              <div class="modal-icon-badge">
                <span class="material-symbols-outlined">{{ editingRoleId ? 'tune' : 'add_moderator' }}</span>
              </div>
              <div>
                <h2 class="text-base font-bold text-[var(--text-main, #1F2937)] leading-tight m-0">
                  {{ editingRoleId ? 'Edit Role & Permissions: ' + roleForm.name : 'Create Custom Role' }}
                </h2>
                <p class="text-xs text-[var(--text-muted, #6B7280)] m-0 mt-0.5">
                  <ng-container *ngIf="!editingRoleId">
                    Using {{ customRoles.length }} of {{ maxCustomRoles }} custom roles.
                  </ng-container>
                  Configure role name, description, and module access permissions.
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="showRoleModal = false"
              class="modal-close-btn"
              title="Close dialog"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveRole()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                  Role Name <span class="text-red-500">*</span>
                </label>
                <input
                  title="Role Name"
                  type="text"
                  [(ngModel)]="roleForm.name"
                  name="roleName"
                  placeholder="e.g. Kitchen Lead, Shift Supervisor, Barista..."
                  class="form-control text-sm w-full font-bold uppercase"
                  required
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[var(--text-muted, #4B5563)] uppercase tracking-wider mb-0 block">
                  Description
                </label>
                <input
                  title="Description"
                  type="text"
                  [(ngModel)]="roleForm.description"
                  name="roleDescription"
                  placeholder="e.g. Manages order queue and kitchen display operations"
                  class="form-control text-sm w-full"
                />
              </div>
            </div>

            <!-- Permission Matrix Header with Bulk Select Controls -->
            <div class="perm-matrix-bar">
              <div class="perm-matrix-title-group">
                <span class="perm-matrix-title">Access Permissions Matrix</span>
                <span class="tab-count-badge">
                  {{ roleForm.permissionIds.length }} of {{ permissions.length }} granted
                </span>
              </div>

              <div class="perm-matrix-actions">
                <button
                  type="button"
                  (click)="selectAllPermissions()"
                  class="perm-link-btn"
                >
                  <span class="material-symbols-outlined">done_all</span>
                  Grant All
                </button>
                <span class="perm-matrix-divider"></span>
                <button
                  type="button"
                  (click)="deselectAllPermissions()"
                  class="perm-link-btn is-muted"
                >
                  <span class="material-symbols-outlined">remove_done</span>
                  Revoke All
                </button>
              </div>
            </div>

            <!-- Permission Modules List -->
            <div class="perm-matrix-wrapper">
              <div *ngFor="let mod of moduleGroups" class="perm-module-card">
                <div class="perm-module-header">
                  <div class="perm-module-title-group">
                    <span class="material-symbols-outlined">{{ mod.icon }}</span>
                    <span>{{ mod.label }}</span>
                  </div>
                  <button
                    type="button"
                    (click)="toggleModulePermissions(mod)"
                    class="perm-link-btn"
                    [class.is-muted]="isModuleAllSelected(mod)"
                  >
                    <span class="material-symbols-outlined">
                      {{ isModuleAllSelected(mod) ? 'remove_done' : 'done_all' }}
                    </span>
                    {{ isModuleAllSelected(mod) ? 'Deselect all' : 'Select all' }}
                  </button>
                </div>

                <div class="perm-items-grid">
                  <div
                    *ngFor="let p of mod.permissions"
                    (click)="togglePermission(p.id)"
                    class="perm-checkbox-tile"
                    [class.is-selected]="isPermissionSelected(p.id)"
                  >
                    <input
                      title="Permission checkbox"
                      type="checkbox"
                      [checked]="isPermissionSelected(p.id)"
                      (change)="$event.stopPropagation(); togglePermission(p.id)"
                      class="custom-checkbox mt-0.5"
                    />
                    <div class="perm-label-content">
                      <span class="perm-code-badge">{{ p.code }}</span>
                      <span class="perm-desc-text">{{ p.description || p.code }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--card-border, #E9D5FF)]">
              <button
                type="button"
                (click)="showRoleModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
                [disabled]="isSavingRole"
              >
                {{ isSavingRole ? 'Saving...' : (editingRoleId ? 'Update Role & Permissions ✓' : 'Create Role ✓') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  public activeMainTab: 'users' | 'roles' = 'users';
  public isLoading = false;
  public loadError: string | null = null;
  public isSavingRole = false;

  public settingsService = inject(SettingsService);
  public staffLayout = inject(StaffLayoutService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  // Data Collections
  public users: (User & { selected?: boolean })[] = [];
  public roles: Role[] = [];
  public permissions: Permission[] = [];
  public moduleGroups: ModuleGroup[] = [];

  // Filtering & Pagination
  public selectAll = false;
  public selectedRole = '';
  public searchQuery = '';
  public pageSize = 10;
  public currentPage = 1;

  // User Add/Edit Dialog State
  public showUserModal = false;
  public editingUserId: number | null = null;
  public userForm: any = {
    name: '',
    username: '',
    email: '',
    phone: '',
    image_url: '',
    roleId: null,
    password: '',
    status: 'ACTIVE',
  };

  /**
   * How many roles may be created by hand. Built-in roles (is_system = 1) are
   * not counted. Mirrors MAX_CUSTOM_ROLES in the backend roles controller,
   * which is the authoritative check.
   */
  public readonly maxCustomRoles = 2;

  /** Roles created by hand, i.e. everything except the built-in ones. */
  public get customRoles(): Role[] {
    return this.roles.filter((r) => !r.is_system);
  }

  public get isRoleLimitReached(): boolean {
    return this.customRoles.length >= this.maxCustomRoles;
  }

  // Role Add/Edit Dialog State
  public showRoleModal = false;
  public editingRoleId: number | null = null;
  public roleForm: {
    name: string;
    description: string;
    permissionIds: number[];
  } = {
      name: '',
      description: '',
      permissionIds: [],
    };

  ngOnInit(): void {
    this.staffLayout.loadFromSettings();
    this.staffLayout.applyLayout();
    this.loadAllData();
  }

  public countUserPermissions(u: User): number {
    const role = this.roles.find((r) => r.name === u.role);
    if (!role) return 0;
    return role.permissions ? role.permissions.length : 0;
  }

  public calculatePermissionProgress(u: User): number {
    if (!this.permissions.length) return 50;
    const count = this.countUserPermissions(u);
    return Math.min(100, Math.round((count / this.permissions.length) * 100));
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadError = null;
    this.loadRoles();
    this.loadPermissions();
    this.loadUsers();
  }

  /**
   * Roles and permissions back the role editor rather than the user table, so
   * a failure here is reported by the interceptor's toast and does not block
   * the page — but the callback must exist, or the rethrown error escapes as an
   * unhandled rejection. loadUsers() alone drives the page loader.
   */
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data;
          if (this.roles.length > 0 && !this.userForm.roleId) {
            this.userForm.roleId = this.roles[0].id;
          }
        }
      },
      error: () => {},
    });
  }

  loadPermissions(): void {
    this.userService.getPermissions().subscribe({
      next: (res) => {
        if (res.success) {
          this.permissions = res.data;
          this.buildModuleGroups();
        }
      },
      error: () => {},
    });
  }

  buildModuleGroups(): void {
    const moduleMap = new Map<string, Permission[]>();
    for (const p of this.permissions) {
      const mod = p.module || 'GENERAL';
      if (!moduleMap.has(mod)) {
        moduleMap.set(mod, []);
      }
      moduleMap.get(mod)!.push(p);
    }

    const icons: Record<string, string> = {
      AUTH: 'key',
      POS: 'point_of_sale',
      ORDERS: 'receipt_long',
      DINING: 'table_restaurant',
      QUEUE: 'confirmation_number',
      PRODUCTS: 'inventory_2',
      CATEGORIES: 'category',
      STOCK: 'warehouse',
      CUSTOMERS: 'group',
      BILLS: 'receipt',
      REPORTS: 'analytics',
      DASHBOARD: 'dashboard',
      SETTINGS: 'settings',
      USERS: 'manage_accounts',
      AUDIT: 'history',
      GENERAL: 'shield',
    };

    const friendlyLabels: Record<string, string> = {
      AUTH: 'Authentication & Session',
      POS: 'POS Billing & Cashier Operations',
      ORDERS: 'Orders & Kitchen Management',
      DINING: 'Dining Layout & Tables',
      QUEUE: 'Takeaway Queue Tokens',
      PRODUCTS: 'Products & Price Catalog',
      CATEGORIES: 'Product Categories',
      STOCK: 'Stock & Inventory Ledger',
      CUSTOMERS: 'Customers & CRM Directory',
      BILLS: 'Sales Bills & Tax Receipts',
      REPORTS: 'Reports & Analytics',
      DASHBOARD: 'Dashboard & Metrics Overview',
      SETTINGS: 'System & Theme Settings',
      USERS: 'Staff Accounts & Dynamic RBAC',
      AUDIT: 'Audit Trail & Security Logs',
      GENERAL: 'General Access',
    };

    this.moduleGroups = Array.from(moduleMap.entries()).map(([name, perms]) => ({
      name,
      label: friendlyLabels[name] || name,
      icon: icons[name] || 'shield',
      permissions: perms,
    }));
  }

  loadUsers(): void {
    this.isLoading = true;
    this.loadError = null;
    // The default page size is 50; the role filter and search box work over
    // whatever is loaded here, so a smaller page would hide staff from them.
    this.userService.getUsers(1, 200).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.users = res.data.map((u) => ({ ...u, selected: false }));
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load staff records from server.';
      },
    });
  }

  get dynamicRoleOptions(): DropdownOption[] {
    const opts: DropdownOption[] = [
      { value: '', label: 'All Staff Roles', icon: 'groups', description: 'Show all team members' },
    ];
    for (const r of this.roles) {
      opts.push({
        value: r.name,
        label: r.name,
        icon: this.getRoleIcon(r.name),
        description: r.description || `${r.name} access level`,
      });
    }
    return opts;
  }

  get formRoleOptions(): DropdownOption[] {
    return this.roles.map((r) => ({
      value: r.id,
      label: r.name,
      icon: this.getRoleIcon(r.name),
      description: r.description || `${r.name} access level`,
      badge: r.is_system ? 'System' : 'Custom',
    }));
  }

  public statusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE', icon: 'check_circle', description: 'Active account with full login access' },
    { value: 'INACTIVE', label: 'INACTIVE', icon: 'block', description: 'Disabled account with suspended access' },
  ];

  get activeCount(): number {
    return this.users.filter((u) => u.status === 'ACTIVE').length;
  }

  countByRole(roleName: string): number {
    if (!roleName) return 0;
    return this.users.filter((u) => (u.role || '').toLowerCase() === roleName.toLowerCase()).length;
  }

  get hasSelectedUsers(): boolean {
    return this.users.some((u) => u.selected && u.username !== 'admin');
  }

  get selectedCount(): number {
    return this.users.filter((u) => u.selected && u.username !== 'admin').length;
  }

  getRoleBadgeStyle(roleName: string): { background: string; color: string; border: string } {
    if (!roleName) {
      return { background: '#F3F4F6', color: 'var(--text-muted, #4B5563)', border: '1px solid #E5E7EB' };
    }
    const palettes = [
      { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }, // Blue
      { background: 'var(--bg-app, #FAF5FF)', color: 'var(--primary, #7E22CE)', border: '1px solid var(--card-border, #E9D5FF)' }, // Purple
      { background: '#F0FDF4', color: 'var(--success, #15803D)', border: '1px solid var(--success-light, #BBF7D0)' }, // Green
      { background: 'var(--warning-light, #FFFBEB)', color: 'var(--warning, #B45309)', border: '1px solid var(--warning-light, #FDE68A)' }, // Amber
      { background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4' }, // Teal
      { background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }, // Rose
      { background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }, // Indigo
      { background: '#FDF2F8', color: '#BE185D', border: '1px solid #FBCFE8' }, // Pink
      { background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC' }, // Cyan
    ];
    let hash = 0;
    for (let i = 0; i < roleName.length; i++) {
      hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  }

  getRoleIconBoxStyle(roleName: string): { background: string; color: string; border: string } {
    const badge = this.getRoleBadgeStyle(roleName);
    return {
      background: badge.background,
      color: badge.color,
      border: badge.border,
    };
  }

  getRoleIcon(roleName: string): string {
    const name = (roleName || '').toLowerCase();
    if (name.includes('admin') || name.includes('super')) return 'shield_person';
    if (name.includes('manage') || name.includes('lead') || name.includes('director')) return 'manage_accounts';
    if (name.includes('cash') || name.includes('pos') || name.includes('bill') || name.includes('counter')) return 'point_of_sale';
    if (name.includes('chef') || name.includes('kitchen') || name.includes('cook')) return 'outdoor_grill';
    if (name.includes('table') || name.includes('wait') || name.includes('server') || name.includes('floor')) return 'restaurant';
    if (name.includes('barista') || name.includes('cafe') || name.includes('drink')) return 'local_cafe';
    if (name.includes('account') || name.includes('finance') || name.includes('tax')) return 'calculate';
    if (name.includes('stock') || name.includes('store') || name.includes('inventory')) return 'warehouse';
    return 'badge';
  }

  get filteredUsers(): (User & { selected?: boolean })[] {
    let list = this.users;

    if (this.selectedRole) {
      list = list.filter((u) => (u.role || '').toLowerCase() === this.selectedRole.toLowerCase());
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      );
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

  get paginatedUsers(): (User & { selected?: boolean })[] {
    const list = this.filteredUsers;
    const start = (this.safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.safePage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.safePage * this.pageSize, this.filteredUsers.length);
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
      this.notify.error('Staff photo must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error(`Staff photo is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.userService.uploadUserImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.userForm.image_url = res.data.url;
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
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  toggleSelectAll(): void {
    this.paginatedUsers.forEach((u) => (u.selected = this.selectAll));
  }

  deleteSelectedUsers(): void {
    const selected = this.users.filter((u) => u.selected && u.username !== 'admin');
    if (selected.length === 0) {
      this.notify.info('No users selected');
      return;
    }

    this.notify.confirm({
      title: 'Delete Selected Users',
      message: `Are you sure you want to delete ${selected.length} user(s)?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        selected.forEach((u) => {
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          this.userService.deleteUser(u.id).subscribe({ error: () => {} });
        });
        this.notify.success(`Deleted ${selected.length} user(s)`);
        this.loadUsers();
      },
    });
  }

  exportCSV(): void {
    const items = this.filteredUsers;
    const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Last Login'];
    const rows = items.map((u) => [
      u.id,
      `"${u.name}"`,
      u.username,
      u.email,
      u.role,
      u.status,
      u.last_login_at || u.lastLoginAt || 'Never',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Staff list exported successfully!');
  }

  // -------------------------------------------------------------------------
  // User Accounts Actions
  // -------------------------------------------------------------------------
  openAddUserModal(): void {
    this.editingUserId = null;
    this.userForm = {
      name: '',
      username: '',
      email: '',
      phone: '',
      roleId: this.roles[0]?.id || null,
      password: '',
      status: 'ACTIVE',
    };
    this.showUserModal = true;
  }

  openEditUserModal(u: any): void {
    this.editingUserId = u.id;
    this.userForm = {
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      roleId: u.role_id || (this.roles.find((r) => r.name === u.role)?.id) || this.roles[0]?.id,
      password: '',
      status: u.status,
    };
    this.showUserModal = true;
  }

  saveUser(): void {
    if (!this.userForm.name) {
      this.notify.error('Please enter full name');
      return;
    }

    if (!this.userForm.roleId) {
      this.notify.error('Please select a staff role');
      return;
    }

    if (this.editingUserId) {
      this.userService.updateUser(this.editingUserId, this.userForm).subscribe({
        next: () => {
          this.notify.success('Staff account updated successfully');
          this.showUserModal = false;
          this.loadUsers();
          this.loadRoles();
        },
        error: (err) => {
          this.notify.error(err?.error?.message || 'Failed to update user');
        },
      });
    } else {
      if (!this.userForm.username || !this.userForm.email || !this.userForm.password) {
        this.notify.error('Please fill username, email and password');
        return;
      }
      this.userService.createUser(this.userForm).subscribe({
        next: () => {
          this.notify.success('Staff account created successfully');
          this.showUserModal = false;
          this.loadUsers();
          this.loadRoles();
        },
        error: (err) => {
          this.notify.error(err?.error?.message || 'Failed to create user');
        },
      });
    }
  }

  deleteUser(u: User): void {
    this.notify.confirm({
      title: 'Delete Staff Account',
      message: `Are you sure you want to delete ${u.name} (${u.username})?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.userService.deleteUser(u.id).subscribe({
          next: () => {
            this.notify.info('Staff user deleted');
            this.loadUsers();
            this.loadRoles();
          },
          error: (err) => {
            this.notify.error(err?.error?.message || 'Failed to delete user');
          },
        });
      },
    });
  }

  // -------------------------------------------------------------------------
  // Dynamic Roles Actions
  // -------------------------------------------------------------------------
  openAddRoleModal(): void {
    // The button stays clickable at the limit so the reason can be explained,
    // rather than leaving a dead control the user gets no feedback from.
    if (this.isRoleLimitReached) {
      this.notify.confirm({
        title: 'Custom role limit reached',
        message:
          `You already have ${this.customRoles.length} of ${this.maxCustomRoles} custom roles ` +
          `(${this.customRoles.map((r) => r.name).join(', ')}). ` +
          `Delete one of them first, then create the new role. Built-in roles do not count towards this limit.`,
        confirmText: 'Got it',
        cancelText: 'Close',
        onConfirm: () => { },
      });
      return;
    }
    this.editingRoleId = null;
    this.roleForm = {
      name: '',
      description: '',
      permissionIds: [],
    };
    this.showRoleModal = true;
  }

  openConfigureRoleModal(r: Role): void {
    this.editingRoleId = r.id;
    const currentPermIds = (r.permissions || []).map((p) => p.id);
    this.roleForm = {
      name: r.name,
      description: r.description || '',
      permissionIds: [...currentPermIds],
    };
    this.showRoleModal = true;
  }

  isPermissionSelected(pId: number): boolean {
    return this.roleForm.permissionIds.includes(pId);
  }

  togglePermission(pId: number): void {
    if (this.isPermissionSelected(pId)) {
      this.roleForm.permissionIds = this.roleForm.permissionIds.filter((id) => id !== pId);
    } else {
      this.roleForm.permissionIds = [...this.roleForm.permissionIds, pId];
    }
  }

  isModuleAllSelected(mod: ModuleGroup): boolean {
    if (!mod.permissions || mod.permissions.length === 0) return false;
    return mod.permissions.every((p) => this.isPermissionSelected(p.id));
  }

  toggleModulePermissions(mod: ModuleGroup): void {
    const allSelected = this.isModuleAllSelected(mod);
    const modPermIds = mod.permissions.map((p) => p.id);
    if (allSelected) {
      this.roleForm.permissionIds = this.roleForm.permissionIds.filter((id) => !modPermIds.includes(id));
    } else {
      const set = new Set([...this.roleForm.permissionIds, ...modPermIds]);
      this.roleForm.permissionIds = Array.from(set);
    }
  }

  selectAllPermissions(): void {
    this.roleForm.permissionIds = this.permissions.map((p) => p.id);
  }

  deselectAllPermissions(): void {
    this.roleForm.permissionIds = [];
  }

  saveRole(): void {
    if (!this.roleForm.name || !this.roleForm.name.trim()) {
      this.notify.error('Please enter a role name');
      return;
    }

    this.isSavingRole = true;

    if (this.editingRoleId) {
      this.userService
        .updateRole(this.editingRoleId, {
          name: this.roleForm.name.trim(),
          description: this.roleForm.description.trim(),
          permissionIds: this.roleForm.permissionIds,
        })
        .subscribe({
          next: () => {
            this.isSavingRole = false;
            this.notify.success(`Role '${this.roleForm.name}' updated successfully!`);
            this.showRoleModal = false;
            this.loadRoles();
            this.loadUsers();
          },
          error: (err) => {
            this.isSavingRole = false;
            this.notify.error(err?.error?.message || 'Failed to update role');
          },
        });
    } else {
      this.userService
        .createRole({
          name: this.roleForm.name.trim(),
          description: this.roleForm.description.trim(),
          permissionIds: this.roleForm.permissionIds,
        })
        .subscribe({
          next: () => {
            this.isSavingRole = false;
            this.notify.success(`Role '${this.roleForm.name}' created successfully!`);
            this.showRoleModal = false;
            this.loadRoles();
          },
          error: (err) => {
            this.isSavingRole = false;
            this.notify.error(err?.error?.message || 'Failed to create role');
          },
        });
    }
  }

  deleteRole(r: Role): void {
    if (r.is_system) {
      this.notify.error(`Default system role '${r.name}' cannot be deleted.`);
      return;
    }

    const userCount = r.user_count || this.countByRole(r.name);
    if (userCount > 0) {
      this.notify.error(
        `Cannot delete role '${r.name}': ${userCount} staff user(s) are currently assigned to this role. Please reassign them first.`
      );
      return;
    }

    this.notify.confirm({
      title: 'Delete Custom Role',
      message: `Are you sure you want to permanently delete role '${r.name}'?`,
      confirmText: 'Delete Role',
      isDestructive: true,
      onConfirm: () => {
        this.userService.deleteRole(r.id).subscribe({
          next: () => {
            this.notify.success(`Role '${r.name}' deleted successfully`);
            this.loadRoles();
          },
          error: (err) => {
            this.notify.error(err?.error?.message || 'Failed to delete role');
          },
        });
      },
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // SCROLL-TO-VIEW & HORIZONTAL TABS NAVIGATION METHODS
  // ═════════════════════════════════════════════════════════════════

  public scrollTabs(container: HTMLElement, amount: number): void {
    if (!container) return;
    container.scrollBy({ left: amount, behavior: 'smooth' });
  }

  public switchMainTab(tab: 'users' | 'roles', event?: Event): void {
    this.activeMainTab = tab;
    if (event && event.currentTarget) {
      (event.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    setTimeout(() => {
      const targetId = tab === 'users' ? 'staff-kpi-section' : 'roles-grid-section';
      this.scrollToView(targetId);
    }, 60);
  }

  public selectRoleFilter(roleName: string, event?: Event): void {
    this.selectedRole = roleName;
    this.currentPage = 1;
    if (event && event.currentTarget) {
      (event.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    setTimeout(() => {
      this.scrollToView('staff-table-section');
    }, 60);
  }

  public scrollToView(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}


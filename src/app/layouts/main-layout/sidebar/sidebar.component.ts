import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  iconName: string;
  badge?: string;
  permission?: string;
  roles?: string[];
  isPos?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="sidebar-container"
      [class.is-collapsed]="isCollapsed"
      aria-label="Main Navigation"
    >
      <!-- 1. Brand Header (64px) -->
      <div class="brand-header">
        <div class="brand-content" [title]="isCollapsed ? settingsService.businessName() : ''">
          <div class="brand-logo-container" [attr.aria-hidden]="true">
            <img
              *ngIf="settingsService.brandLogoUrl() as logo; else brandGlyph"
              [src]="logo"
              alt=""
              class="brand-logo-img"
            />
            <ng-template #brandGlyph>
              <span class="material-symbols-outlined g-icon-md brand-logo-icon">storefront</span>
            </ng-template>
          </div>

          <div class="brand-meta" *ngIf="!isCollapsed">
            <span class="brand-title">{{ settingsService.businessName() }}</span>
            <span class="brand-subtitle">POS Management</span>
          </div>
        </div>

        <!-- Collapse / Expand Toggle Button -->
        <button
          type="button"
          class="collapse-toggle-btn"
          (click)="toggleCollapse.emit()"
          [attr.aria-label]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          [title]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <span class="material-symbols-outlined g-icon-sm toggle-icon">{{ isCollapsed ? 'menu_open' : 'dock_to_left' }}</span>
        </button>
      </div>

      <!-- 2. Navigation Groups (Scrollable) -->
      <nav class="sidebar-nav-scroll" role="navigation">
        <div class="nav-groups-wrapper">
          <ng-container *ngFor="let section of navSections">
            <div class="nav-section" *ngIf="hasVisibleItems(section)">
              <!-- Section Label -->
              <div class="section-label" *ngIf="!isCollapsed">
                {{ section.title }}
              </div>
              <div class="section-divider-collapsed" *ngIf="isCollapsed"></div>

              <!-- Menu Items -->
              <div class="section-items">
                <ng-container *ngFor="let item of section.items">
                  <a
                    *ngIf="canAccess(item)"
                    [routerLink]="item.route"
                    [queryParams]="item.queryParams || null"
                    routerLinkActive="is-active"
                    [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' || item.route === '/pos' || (item.queryParams !== undefined) }"
                    class="menu-item"
                    [class.pos-special-item]="item.isPos"
                    [attr.aria-label]="item.label"
                    [attr.id]="'nav-item-' + item.id"
                  >
                    <!-- Active Left Indicator Bar -->
                    <span class="active-indicator"></span>

                    <!-- Google Icon Wrapper -->
                    <div class="item-icon-wrapper">
                      <span class="material-symbols-outlined g-icon-sm">{{ item.iconName }}</span>
                    </div>

                    <!-- Menu Text -->
                    <span class="item-label" *ngIf="!isCollapsed">{{ item.label }}</span>

                    <!-- Subtle Badge / Hotkey hint -->
                    <span *ngIf="!isCollapsed && item.badge" class="item-badge">
                      {{ item.badge }}
                    </span>

                    <!-- Collapsed Tooltip -->
                    <span *ngIf="isCollapsed" class="collapsed-tooltip" role="tooltip">
                      {{ item.label }}
                    </span>
                  </a>
                </ng-container>
              </div>
            </div>
          </ng-container>
        </div>
      </nav>

      <!-- 3. Bottom Section: User Profile & Logout -->
      <div class="sidebar-footer" *ngIf="authService.currentUser() as user">
        <!-- User Profile Card -->
        <div class="user-profile-card" [class.user-card-collapsed]="isCollapsed">
          <div class="user-avatar-wrapper" [title]="isCollapsed ? (user.name + ' (' + (user.role || 'Staff') + ')') : ''">
            <div class="user-avatar">
              {{ getInitials(user.name) }}
            </div>
            <span class="online-indicator" title="Active"></span>
          </div>

          <div class="user-details" *ngIf="!isCollapsed">
            <span class="user-name" [title]="user.name">{{ user.name }}</span>
            <span class="user-role">{{ user.role || 'Cashier' }}</span>
          </div>

          <!-- Logout Button (Expanded) -->
          <button
            *ngIf="!isCollapsed"
            type="button"
            class="logout-button"
            (click)="handleLogout()"
            aria-label="Logout"
            title="Sign out of system"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
          </button>
        </div>

        <!-- Standalone Logout Button when Collapsed -->
        <div class="collapsed-logout-wrap" *ngIf="isCollapsed">
          <button
            type="button"
            class="collapsed-logout-btn"
            (click)="handleLogout()"
            aria-label="Logout"
            title="Sign out"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
            <span class="collapsed-tooltip" role="tooltip">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        flex-shrink: 0;
        user-select: none;
        -webkit-user-select: none;
      }

      .sidebar-container {
        display: flex;
        flex-direction: column;
        width: 240px;
        min-width: 230px;
        max-width: 250px;
        height: 100%;
        background-color: var(--sidebar-bg, #2E1065);
        border-right: 1px solid var(--sidebar-border, #581C87);
        box-sizing: border-box;
        transition: width 180ms ease, min-width 180ms ease, max-width 180ms ease;
        position: relative;
        z-index: 30;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .sidebar-container.is-collapsed {
        width: 68px;
        min-width: 68px;
        max-width: 68px;
      }

      /* 1. BRAND HEADER (64px) */
      .brand-header {
        height: 64px;
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        /* Same treatment as the header bar so the divider runs unbroken
           across the brand and the navbar. */
        border-bottom: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 70%, #FFFFFF 30%);
        box-sizing: border-box;
        gap: 8px;
      }

      .brand-content {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;
      }

      .is-collapsed .brand-header {
        justify-content: center;
        padding: 0 8px;
      }

      .is-collapsed .brand-content {
        justify-content: center;
        flex: none;
      }

      .brand-logo-container {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background-color: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--sidebar-active-accent, #C084FC);
        flex-shrink: 0;
        transition: background-color 150ms ease, border-color 150ms ease;
      }

      /* Fills the crest square, minus the 1px border, when a logo is uploaded. */
      .brand-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 7px;
      }

      .brand-logo-icon {
        color: var(--sidebar-active-accent, #C084FC);
      }

      .brand-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
      }

      .brand-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--sidebar-text, #FAF5FF);
        letter-spacing: 0.02em;
        line-height: 1.2;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .brand-subtitle {
        font-size: 11px;
        font-weight: 400;
        color: var(--sidebar-text-muted, #D8B4FE);
        line-height: 1.2;
        margin-top: 2px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .collapse-toggle-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--sidebar-text-muted, #D8B4FE);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
        flex-shrink: 0;
        padding: 0;
      }

      .collapse-toggle-btn:hover {
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
        border-color: var(--sidebar-border, #581C87);
      }

      .collapse-toggle-btn:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
        outline-offset: 2px;
      }

      .toggle-icon {
        color: currentColor;
      }

      .is-collapsed .collapse-toggle-btn {
        display: none;
      }

      /* 2. NAVIGATION SCROLL AREA */
      .sidebar-nav-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
        box-sizing: border-box;
      }

      .is-collapsed .sidebar-nav-scroll {
        padding: 12px 8px;
      }

      .sidebar-nav-scroll::-webkit-scrollbar {
        width: 4px;
      }

      .sidebar-nav-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .sidebar-nav-scroll::-webkit-scrollbar-thumb {
        background: var(--sidebar-surface, #3B0764);
        border-radius: 4px;
      }

      .sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
        background: var(--sidebar-border, #581C87);
      }

      .nav-groups-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .nav-section {
        display: flex;
        flex-direction: column;
      }

      .section-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: var(--sidebar-active-accent, #A855F7);
        text-transform: uppercase;
        padding: 0 8px;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .section-divider-collapsed {
        height: 1px;
        background-color: var(--sidebar-border, #581C87);
        margin: 6px 4px;
      }

      .section-items {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      /* 3. MENU ITEM DESIGN */
      .menu-item {
        position: relative;
        display: flex;
        align-items: center;
        height: 44px;
        min-height: 44px;
        padding: 0 10px;
        border-radius: 8px;
        background-color: transparent;
        color: var(--sidebar-text, #FAF5FF);
        text-decoration: none;
        box-sizing: border-box;
        cursor: pointer;
        outline: none;
        gap: 12px;
        transition: background-color 150ms ease, color 150ms ease;
      }

      .is-collapsed .menu-item {
        justify-content: center;
        padding: 0;
        gap: 0;
      }

      .menu-item:hover {
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
      }

      .menu-item:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
        outline-offset: 1px;
      }

      /* Left Active Indicator */
      .active-indicator {
        display: none;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 22px;
        border-radius: 0 3px 3px 0;
        background-color: var(--sidebar-active-accent, #C084FC);
      }

      /* Active State */
      .menu-item.is-active {
        background-color: var(--sidebar-surface, #3B0764);
        color: #FFFFFF;
      }

      .menu-item.is-active .active-indicator {
        display: block;
      }

      .menu-item.is-active .item-icon-wrapper {
        color: var(--sidebar-active-accent, #C084FC);
      }

      /* POS Active & Featured State */
      .menu-item.pos-special-item.is-active {
        background-color: var(--sidebar-surface, #3B0764);
        color: #FFFFFF;
      }

      /* Item Icon */
      .item-icon-wrapper {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--sidebar-text-muted, #D8B4FE);
        transition: color 150ms ease;
      }

      .menu-item:hover .item-icon-wrapper {
        color: var(--sidebar-text, #FAF5FF);
      }

      /* Item Label */
      .item-label {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        text-align: left;
      }

      /* Item Badge (e.g. F1) */
      .item-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text-muted, #D8B4FE);
        border: 1px solid var(--sidebar-border, #581C87);
        letter-spacing: 0.04em;
      }

      .menu-item.is-active .item-badge {
        border-color: var(--sidebar-active-accent, #C084FC);
        color: var(--sidebar-text, #FAF5FF);
      }

      /* 4. COLLAPSED TOOLTIP */
      .collapsed-tooltip {
        position: absolute;
        left: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%) translateX(-4px);
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
        border: 1px solid var(--sidebar-border, #581C87);
        border-radius: 6px;
        padding: 5px 9px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 140ms ease, transform 140ms ease, visibility 140ms ease;
        z-index: 100;
      }

      .menu-item:hover .collapsed-tooltip,
      .collapsed-logout-btn:hover .collapsed-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(0);
      }

      /* 5. USER PROFILE & FOOTER */
      .sidebar-footer {
        padding: 12px;
        border-top: 1px solid var(--sidebar-border, #581C87);
        box-sizing: border-box;
      }

      .is-collapsed .sidebar-footer {
        padding: 12px 8px;
      }

      .user-profile-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        border-radius: 8px;
        background-color: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
      }

      .user-profile-card.user-card-collapsed {
        padding: 6px;
        justify-content: center;
        background: transparent;
        border-color: transparent;
      }

      .user-avatar-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #9333EA) 100%);
        color: #FAF5FF;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      .online-indicator {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--success, #16A34A);
        border: 1.5px solid var(--sidebar-bg, #2E1065);
      }

      .user-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex: 1;
        overflow: hidden;
      }

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--sidebar-text, #FAF5FF);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .user-role {
        font-size: 11px;
        font-weight: 400;
        color: var(--sidebar-text-muted, #D8B4FE);
        line-height: 1.2;
        margin-top: 2px;
        text-transform: capitalize;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .logout-button {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: var(--sidebar-text-muted, #D8B4FE);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease;
        padding: 0;
        flex-shrink: 0;
      }

      .logout-button:hover {
        background-color: var(--sidebar-surface, #581C87);
        color: var(--sidebar-text, #FAF5FF);
      }

      .logout-button:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
      }

      .collapsed-logout-wrap {
        margin-top: 8px;
        display: flex;
        justify-content: center;
      }

      .collapsed-logout-btn {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--sidebar-text-muted, #D8B4FE);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease;
      }

      .collapsed-logout-btn:hover {
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
      }

      .collapsed-logout-btn:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  public navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          route: '/dashboard',
          iconName: 'dashboard',
          permission: 'dashboard.view',
        },
        {
          id: 'pos',
          label: 'POS Billing',
          route: '/pos',
          iconName: 'point_of_sale',
          permission: 'pos.billing',
          isPos: true,
        },
        {
          id: 'orders',
          label: 'Orders',
          route: '/orders',
          iconName: 'receipt_long',
          permission: 'order.manage',
        },
        {
          id: 'dining',
          label: 'Dining Floor',
          route: '/dining',
          iconName: 'table_restaurant',
          permission: 'dining.manage',
        },
        {
          id: 'queue',
          label: 'Queue',
          route: '/queue',
          iconName: 'takeout_dining',
          permission: 'queue.manage',
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          id: 'products',
          label: 'Products',
          route: '/products',
          iconName: 'inventory_2',
          permission: 'product.manage',
        },
        {
          id: 'categories',
          label: 'Categories',
          route: '/categories',
          iconName: 'category',
          permission: 'category.manage',
        },
        {
          id: 'stock',
          label: 'Stock Ledger',
          route: '/stock',
          iconName: 'warehouse',
          permission: 'stock.view',
        },
        {
          id: 'customers',
          label: 'Customers',
          route: '/customers',
          iconName: 'group',
          permission: 'customer.view',
        },
        {
          id: 'bills',
          label: 'Sales Bills',
          route: '/bills',
          iconName: 'receipt',
          permission: 'bill.view',
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          id: 'reports',
          label: 'Reports & Analytics',
          route: '/reports',
          iconName: 'analytics',
          permission: 'reports.view',
        },
        {
          id: 'users',
          label: 'Staff & Roles',
          route: '/users',
          iconName: 'manage_accounts',
          permission: 'user.manage',
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          route: '/audit',
          iconName: 'history',
          permission: 'audit.view',
        },
        {
          id: 'settings',
          label: 'POS Settings',
          route: '/settings',
          iconName: 'settings',
          permission: 'settings.manage',
        },
      ],
    },
  ];

  public canAccess(item: NavItem): boolean {
    if (!item.permission) return true;
    return this.authService.hasPermission(item.permission);
  }

  public hasVisibleItems(section: NavSection): boolean {
    return section.items.some((item) => this.canAccess(item));
  }

  public getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  public handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

import { Component, Input, Output, EventEmitter, HostBinding, inject } from '@angular/core';
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
    <!-- Mobile Backdrop Overlay (< 1024px) -->
    <div
      *ngIf="isMobileOpen"
      class="mobile-sidebar-backdrop"
      (click)="closeMobileDrawer.emit()"
      aria-hidden="true"
    ></div>

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

        <!-- Desktop Collapse / Expand Toggle Button -->
        <button
          type="button"
          class="collapse-toggle-btn"
          (click)="toggleCollapse.emit()"
          [attr.aria-label]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          [title]="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <span class="material-symbols-outlined g-icon-sm toggle-icon">{{ isCollapsed ? 'menu_open' : 'dock_to_left' }}</span>
        </button>

        <!-- Mobile Close Drawer Button -->
        <button
          type="button"
          class="mobile-close-btn"
          (click)="closeMobileDrawer.emit()"
          aria-label="Close navigation menu"
          title="Close Menu"
        >
          <span class="material-symbols-outlined text-[20px]">close</span>
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
                    (click)="onNavItemClick()"
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
        transition: width 180ms ease, min-width 180ms ease, max-width 180ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
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

      .mobile-close-btn {
        display: none;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        color: var(--sidebar-text, #FAF5FF);
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        transition: all 0.15s ease;
      }
      .mobile-close-btn:hover {
        background: rgba(220, 38, 38, 0.2);
        color: #F87171;
        border-color: #F87171;
      }

      /* 2. NAVIGATION GROUPS (Scrollable) */
      .sidebar-nav-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px 8px;
        scrollbar-width: thin;
        scrollbar-color: var(--sidebar-surface, #3B0764) transparent;
      }

      .sidebar-nav-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .sidebar-nav-scroll::-webkit-scrollbar-thumb {
        background: var(--sidebar-surface, #3B0764);
        border-radius: 4px;
      }

      .nav-groups-wrapper {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .nav-section {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .section-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--sidebar-section-label, #C084FC);
        padding: 4px 10px;
        margin-bottom: 2px;
      }

      .section-divider-collapsed {
        height: 1px;
        background-color: var(--sidebar-border, #581C87);
        margin: 6px 4px;
      }

      .section-items {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      /* MENU ITEM (40px) */
      .menu-item {
        position: relative;
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 10px;
        border-radius: 8px;
        color: var(--sidebar-text-muted, #D8B4FE);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        gap: 10px;
        transition: background-color 150ms ease, color 150ms ease;
        box-sizing: border-box;
      }

      .menu-item:hover {
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
      }

      .is-collapsed .menu-item {
        justify-content: center;
        padding: 0;
      }

      /* Active Indicator Bar */
      .active-indicator {
        position: absolute;
        left: 0;
        top: 6px;
        bottom: 6px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background-color: transparent;
        transition: background-color 150ms ease;
      }

      .menu-item.is-active {
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
        font-weight: 600;
      }

      .menu-item.is-active .active-indicator {
        background-color: var(--sidebar-active-accent, #C084FC);
      }

      .menu-item.is-active .item-icon-wrapper {
        color: var(--sidebar-active-accent, #C084FC);
      }

      .item-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: inherit;
      }

      .item-label {
        flex: 1;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .item-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;
        background-color: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        color: var(--sidebar-active-accent, #C084FC);
      }

      /* Special Accent for POS Item */
      .pos-special-item {
        color: #FBCFE8;
      }
      .pos-special-item .item-icon-wrapper {
        color: #F472B6;
      }
      .pos-special-item.is-active {
        background: linear-gradient(90deg, rgba(244, 114, 182, 0.2), transparent);
        color: #FFFFFF;
      }
      .pos-special-item.is-active .active-indicator {
        background-color: #F472B6;
      }

      /* Collapsed Tooltip */
      .collapsed-tooltip {
        display: none;
        position: absolute;
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
        background-color: var(--sidebar-surface, #3B0764);
        color: var(--sidebar-text, #FAF5FF);
        border: 1px solid var(--sidebar-border, #581C87);
        padding: 5px 9px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        z-index: 50;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      }

      .is-collapsed .menu-item:hover .collapsed-tooltip,
      .is-collapsed .collapsed-logout-btn:hover .collapsed-tooltip {
        display: block;
      }

      /* 3. FOOTER (56px) */
      .sidebar-footer {
        min-height: 56px;
        padding: 8px 10px;
        border-top: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 70%, #FFFFFF 30%);
        box-sizing: border-box;
        display: flex;
        align-items: center;
      }

      .user-profile-card {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 8px;
        min-width: 0;
      }

      .user-avatar-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        color: var(--sidebar-active-accent, #C084FC);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }

      .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
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
        font-size: 12px;
        font-weight: 600;
        color: var(--sidebar-text, #FAF5FF);
        line-height: 1.2;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .user-role {
        font-size: 10px;
        color: var(--sidebar-text-muted, #D8B4FE);
        line-height: 1.2;
        margin-top: 1px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      .logout-button {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--sidebar-text-muted, #D8B4FE);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 150ms ease, color 150ms ease;
        flex-shrink: 0;
        padding: 0;
      }

      .logout-button:hover {
        background-color: rgba(220, 38, 38, 0.15);
        color: #F87171;
      }

      .collapsed-logout-wrap {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      .collapsed-logout-btn {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--sidebar-text-muted, #D8B4FE);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }
      .collapsed-logout-btn:hover {
        background-color: rgba(220, 38, 38, 0.15);
        color: #F87171;
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* MOBILE & TABLET RESPONSIVE OVERLAY DRAWER (< 1024px)            */
      /* ═══════════════════════════════════════════════════════════════ */
      @media (max-width: 1023px) {
        :host {
          display: none;
        }

        :host.is-mobile-active {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 1000;
        }

        .sidebar-container {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px !important;
          min-width: 280px !important;
          max-width: 85vw !important;
          z-index: 1001;
          box-shadow: 12px 0 32px rgba(15, 23, 42, 0.55);
          transform: translateX(-100%);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        :host.is-mobile-active .sidebar-container {
          transform: translateX(0);
        }

        .mobile-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          animation: fadeInBackdrop 0.2s ease-out;
        }

        .mobile-close-btn {
          display: flex;
        }

        .collapse-toggle-btn {
          display: none;
        }
      }

      @keyframes fadeInBackdrop {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() isMobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobileDrawer = new EventEmitter<void>();

  @HostBinding('class.is-mobile-active') get mobileActive() {
    return this.isMobileOpen;
  }

  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  public navSections: NavSection[] = [
    {
      title: 'POS COUNTER & OPERATIONS',
      items: [
        {
          id: 'pos',
          label: 'POS Billing',
          route: '/pos',
          iconName: 'point_of_sale',
          badge: 'F1',
          permission: 'pos.billing',
          isPos: true,
        },
        {
          id: 'orders',
          label: 'Kitchen Display (KDS)',
          route: '/orders',
          iconName: 'receipt_long',
          permission: 'order.manage',
        },
        {
          id: 'dining',
          label: 'Dining & Tables',
          route: '/dining',
          iconName: 'table_restaurant',
          permission: 'dining.manage',
        },
        {
          id: 'queue',
          label: 'Takeaway Queue',
          route: '/queue',
          iconName: 'takeout_dining',
          permission: 'queue.manage',
        },
        {
          id: 'drafts',
          label: 'Held Drafts',
          route: '/draft-bills',
          iconName: 'drafts',
          permission: 'pos.hold_bill',
        },
      ],
    },
    {
      title: 'CATALOG & INVENTORY',
      items: [
        {
          id: 'dashboard',
          label: 'Live Dashboard',
          route: '/dashboard',
          iconName: 'dashboard',
          permission: 'dashboard.view',
        },
        {
          id: 'products',
          label: 'Dishes & Products',
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

  public onNavItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.closeMobileDrawer.emit();
    }
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

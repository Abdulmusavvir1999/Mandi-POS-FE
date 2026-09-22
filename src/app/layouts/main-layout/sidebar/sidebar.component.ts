import { Component, Input, Output, EventEmitter, HostBinding, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SidebarLayoutService } from '../../../core/services/sidebar-layout.service';
import { SIDEBAR_LAYOUT_CSS } from '../../../shared/styles/sidebar-layout.styles';
import {
  NavItem,
  NavSection,
  SIDEBAR_ALERTS_SHORTCUT,
  SIDEBAR_NAV_SECTIONS,
} from '../../../core/config/sidebar-nav.config';

// The menu moved to core/config so the Settings page can list it for renaming
// without importing this component. Re-exported here because callers have
// always taken these two from the rail.
export type { NavItem, NavSection };

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
      [ngClass]="sidebarLayout.rootClass()"
      [ngStyle]="sidebarLayout.pageCssVars()"
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

      <!-- 1b. Quick Action Shortcuts (template capability) -->
      <div
        class="sb-quick-actions"
        *ngIf="sidebarLayout.pageCaps().quickActions && !isCollapsed"
      >
        <a
          *ngIf="canAccess(alertsShortcut)"
          [routerLink]="alertsShortcut.route"
          (click)="onNavItemClick()"
          class="sb-quick-btn"
          title="Live kitchen order alerts"
        >
          <span class="sb-quick-dot" aria-hidden="true"></span>
          <span class="material-symbols-outlined">notifications</span>
          <span>Alerts</span>
        </a>
        <button
          type="button"
          class="sb-quick-btn"
          (click)="showShortcutHelp()"
          title="Navigation & shortcut help"
        >
          <span class="material-symbols-outlined">help</span>
          <span>Help</span>
        </button>
      </div>

      <!-- 1c. Menu Search (template capability) -->
      <div class="sb-search-wrap" *ngIf="sidebarLayout.pageCaps().hasSearch && !isCollapsed">
        <div class="sb-search-field">
          <span class="material-symbols-outlined sb-search-icon">search</span>
          <input
            type="text"
            class="sb-search-input"
            placeholder="Search menu…"
            aria-label="Filter navigation menu"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
          <button
            *ngIf="searchQuery()"
            type="button"
            class="sb-search-clear"
            (click)="clearSearch()"
            aria-label="Clear menu search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <!-- 2. Navigation Groups (Scrollable) -->
      <nav class="sidebar-nav-scroll" role="navigation">
        <div class="nav-groups-wrapper">
          <ng-container *ngFor="let section of filteredSections()">
            <div class="nav-section" *ngIf="hasVisibleItems(section)">
              <!-- Section Label — a button when the template allows folding -->
              <ng-container *ngIf="!isCollapsed">
                <button
                  *ngIf="sidebarLayout.pageCaps().collapsibleSections; else staticLabel"
                  type="button"
                  class="section-label"
                  [class.is-folded]="isFolded(section)"
                  (click)="toggleSection(section)"
                  [attr.aria-expanded]="!isFolded(section)"
                >
                  <span>{{ sectionName(section) }}</span>
                  <span class="material-symbols-outlined section-chevron">expand_more</span>
                </button>
                <ng-template #staticLabel>
                  <div class="section-label">{{ sectionName(section) }}</div>
                </ng-template>
              </ng-container>
              <div class="section-divider-collapsed" *ngIf="isCollapsed"></div>

              <!-- Menu Items -->
              <div class="section-items" [class.is-folded]="isFolded(section)">
                <ng-container *ngFor="let item of section.items">
                  <a
                    *ngIf="canAccess(item)"
                    [routerLink]="item.route"
                    [queryParams]="item.queryParams || null"
                    (click)="onNavItemClick()"
                    (mouseenter)="showTip($event, itemName(item))"
                    (mouseleave)="hideTip()"
                    (focus)="showTip($event, itemName(item))"
                    (blur)="hideTip()"
                    routerLinkActive="is-active"
                    [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' || item.route === '/pos' || item.route === '/settings' || (item.queryParams !== undefined) }"
                    class="menu-item"
                    [class.pos-special-item]="item.isPos"
                    [attr.aria-label]="itemName(item)"
                    [attr.id]="'nav-item-' + item.id"
                  >
                    <!-- Active Left Indicator Bar -->
                    <span class="active-indicator"></span>

                    <!-- Google Icon Wrapper -->
                    <div class="item-icon-wrapper">
                      <span class="material-symbols-outlined g-icon-sm">{{ item.iconName }}</span>
                    </div>

                    <!-- Menu Text -->
                    <span class="item-label" *ngIf="!isCollapsed">{{ itemName(item) }}</span>

                    <!-- Subtle Badge / Hotkey hint -->
                    <span *ngIf="!isCollapsed && item.badge" class="item-badge">
                      {{ item.badge }}
                    </span>

                  </a>
                </ng-container>
              </div>
            </div>
          </ng-container>

          <!-- Empty search state -->
          <div class="sb-empty-results" *ngIf="searchQuery() && !hasAnyResult()">
            <span class="material-symbols-outlined">search_off</span>
            <span>No menu matches “{{ searchQuery() }}”</span>
          </div>
        </div>
      </nav>

      <!-- 3. Bottom Section: User Profile & Logout -->
      <div class="sidebar-footer" *ngIf="authService.currentUser() as user">
        <!-- User Profile Card -->
        <a
          routerLink="/profile"
          (click)="onNavItemClick()"
          class="user-profile-card"
          [class.user-card-collapsed]="isCollapsed"
          title="View & Manage Profile"
        >
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
            (click)="handleLogout($event)"
            aria-label="Logout"
            title="Sign out of system"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
          </button>
        </a>

        <!-- Standalone Logout Button when Collapsed -->
        <div class="collapsed-logout-wrap" *ngIf="isCollapsed">
          <button
            type="button"
            class="collapsed-logout-btn"
            (click)="handleLogout()"
            (mouseenter)="showTip($event, 'Logout')"
            (mouseleave)="hideTip()"
            aria-label="Logout"
            title="Sign out"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
          </button>
        </div>
      </div>

      <!-- Rail tooltip, rendered outside the scrolling nav so it is never clipped -->
      <span
        class="rail-tooltip"
        role="tooltip"
        *ngIf="tooltip() as tip"
        [style.top.px]="tip.top"
      >{{ tip.label }}</span>
    </aside>
  `,
  styles: [SIDEBAR_LAYOUT_CSS],
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
  public sidebarLayout = inject(SidebarLayoutService);
  private notify = inject(NotificationService);

  public searchQuery = signal('');
  public tooltip = signal<{ label: string; top: number } | null>(null);
  private foldedSections = signal<Record<string, boolean>>({});

  /** The shipped menu. Renames are applied at render time, not here, so
   *  this stays the single description of what the rail contains. */
  public navSections: NavSection[] = SIDEBAR_NAV_SECTIONS;
  /** Shortcut surfaced by templates with the quickActions capability. */
  public readonly alertsShortcut: NavItem = SIDEBAR_ALERTS_SHORTCUT;

  /**
   * What a row is called here: the operator's name for it if they have set
   * one in Settings, otherwise the shipped wording.
   */
  public itemName(item: NavItem): string {
    return this.sidebarLayout.itemLabel(item.id, item.label);
  }

  public sectionName(section: NavSection): string {
    return this.sidebarLayout.sectionLabel(section.id, section.title);
  }

  /**
   * Menu items are never added or removed by a template — search only hides
   * rows that do not match, and permissions still gate every row downstream.
   *
   * Matching is against the displayed name, so searching for what the operator
   * renamed a module to finds it. Reads the rename signals, so the list
   * recomputes the moment a name changes.
   */
  public readonly filteredSections = computed<NavSection[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.navSections;
    return this.navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            this.itemName(item).toLowerCase().includes(q) ||
            this.sectionName(section).toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0);
  });

  public hasAnyResult(): boolean {
    return this.filteredSections().some((section) => this.hasVisibleItems(section));
  }

  public canAccess(item: NavItem): boolean {
    if (!item.permission) return true;
    return this.authService.hasPermission(item.permission);
  }

  public hasVisibleItems(section: NavSection): boolean {
    return section.items.some((item) => this.canAccess(item));
  }

  public isFolded(section: NavSection): boolean {
    if (this.isCollapsed) return false;
    if (!this.sidebarLayout.pageCaps().collapsibleSections) return false;
    if (this.searchQuery().trim()) return false; // never hide search hits
    return !!this.foldedSections()[section.id];
  }

  public toggleSection(section: NavSection): void {
    const current = { ...this.foldedSections() };
    current[section.id] = !current[section.id];
    this.foldedSections.set(current);
  }

  /**
   * Collapsed rails need the label somewhere; Compact keeps tooltips even when
   * expanded because its 200px rail truncates the longer module names.
   */
  private showsTooltips(): boolean {
    return this.isCollapsed || this.sidebarLayout.effectiveKey() === 'iconfocus';
  }

  public showTip(event: Event, label: string): void {
    if (!this.showsTooltips()) return;
    const row = event.currentTarget as HTMLElement | null;
    const rail = row?.closest('.sidebar-container') as HTMLElement | null;
    if (!row || !rail) return;
    const rowBox = row.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    this.tooltip.set({ label, top: rowBox.top - railBox.top + rowBox.height / 2 });
  }

  public hideTip(): void {
    this.tooltip.set(null);
  }

  public onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  public clearSearch(): void {
    this.searchQuery.set('');
  }

  public showShortcutHelp(): void {
    this.notify.info(
      'F1 opens POS Billing. Use the rail toggle in the brand header to collapse navigation to icons — hover any icon for its label.',
    );
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

  public handleLogout(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.authService.logout();
  }
}

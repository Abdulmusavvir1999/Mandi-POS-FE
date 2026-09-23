import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header-bar">
      <!-- Left: Mobile Menu Hamburger Button (< 1024px) -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="mobile-menu-btn"
          (click)="toggleMobileSidebar.emit()"
          aria-label="Open Navigation Menu"
          title="Open Menu"
        >
          <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
      </div>

      <!-- Center: Iconic Quick Navigation Hub (≥ 1200px) -->
      <div class="nav-hub">
        <a
          routerLink="/pos"
          routerLinkActive="active-hub-pill"
          [routerLinkActiveOptions]="{ exact: true }"
          class="hub-pill"
        >
          <span class="material-symbols-outlined g-icon-sm">point_of_sale</span>
          <span>POS Billing</span>
        </a>

        <a
          routerLink="/orders"
          routerLinkActive="active-hub-pill"
          class="hub-pill"
        >
          <span class="material-symbols-outlined g-icon-sm">receipt_long</span>
          <span>Kitchen Orders</span>
        </a>

        <a
          routerLink="/dining"
          routerLinkActive="active-hub-pill"
          class="hub-pill"
        >
          <span class="material-symbols-outlined g-icon-sm">table_restaurant</span>
          <span>Dining Floor</span>
        </a>

        <a
          routerLink="/queue"
          routerLinkActive="active-hub-pill"
          class="hub-pill"
        >
          <span class="material-symbols-outlined g-icon-sm">takeout_dining</span>
          <span>Takeaway Queue</span>
        </a>
      </div>

      <!-- Right: Live Real-Time Clock, Dark Mode Switcher & User Profile Bar -->
      <div class="flex items-center gap-2 sm:gap-3" *ngIf="authService.currentUser() as user">
        <!-- Digital Live Clock (≥ 768px) -->
        <div class="clock-badge">
          <div class="live-pulse"></div>
          <div>
            <div class="clock-time">{{ currentTime }}</div>
            <div class="clock-date">{{ currentDate }}</div>
          </div>
        </div>

        <!-- Dark Mode Toggle Button (Visibility controlled by Theme Service Dark Mode setting) -->
        <button
          *ngIf="themeService.darkModeToggleEnabled()"
          type="button"
          (click)="themeService.toggleMode()"
          class="theme-toggle-btn"
          [class.is-dark]="themeService.isDarkMode()"
          [attr.aria-label]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          [title]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <div class="toggle-icon-wrap">
            <span class="material-symbols-outlined toggle-icon">
              {{ themeService.isDarkMode() ? 'light_mode' : 'dark_mode' }}
            </span>
          </div>
          <span class="toggle-text">
            {{ themeService.isDarkMode() ? 'Light' : 'Dark' }}
          </span>
        </button>

        <!-- User Profile Card (Clickable to open Profile page) -->
        <a
          routerLink="/profile"
          routerLinkActive="active-user-card"
          class="user-card"
          title="My Profile & Account Settings"
        >
          <div class="relative">
            <div class="user-avatar">
              {{ user.name.charAt(0) }}
            </div>
            <span class="user-online"></span>
          </div>

          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role-badge">
              {{ user.role }}
            </div>
          </div>

          <!-- Sign Out Action -->
          <button
            type="button"
            (click)="onLogout($event)"
            class="signout-btn"
            title="Sign Out of POS System"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
          </button>
        </a>
      </div>
    </header>
  `,
  styles: [
    `
      .header-bar {
        height: 64px;
        min-height: 64px;
        background: var(--sidebar-bg, #2E1065);
        border-bottom: 1px solid color-mix(in srgb, var(--sidebar-border, #581C87) 70%, #FFFFFF 30%);
        padding: 0 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 30;
        user-select: none;
        flex-shrink: 0;
        gap: 0.75rem;
      }

      @media (min-width: 640px) {
        .header-bar {
          padding: 0 1.25rem;
        }
      }

      .mobile-menu-btn {
        display: none;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        color: var(--sidebar-text, #FAF5FF);
        cursor: pointer;
        padding: 0;
        transition: all 0.15s ease;
      }
      .mobile-menu-btn:hover {
        background: var(--primary, #7E22CE);
        border-color: #C084FC;
      }

      @media (max-width: 1023px) {
        .mobile-menu-btn {
          display: flex;
        }
      }

      .nav-hub {
        display: none;
        align-items: center;
        gap: 0.5rem;
        background: var(--sidebar-surface, #3B0764);
        padding: 0.375rem;
        border-radius: 1rem;
        border: 1px solid var(--sidebar-border, #581C87);
        margin-inline: auto;
      }
      @media (min-width: 1200px) {
        .nav-hub {
          display: flex;
        }
      }

      .hub-pill {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.875rem;
        border-radius: 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--sidebar-text, #E9D5FF);
        text-decoration: none;
        transition: all 0.2s;
      }
      .hub-pill:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }

      .active-hub-pill {
        background: linear-gradient(90deg, var(--primary, #7E22CE), var(--primary-hover, #6B21A8)) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        box-shadow: 0 4px 12px rgba(var(--primary-rgb, 126, 34, 206), 0.4);
      }

      .clock-badge {
        display: none;
        align-items: center;
        gap: 0.625rem;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        padding: 0.375rem 0.75rem;
        border-radius: 0.75rem;
        text-align: right;
      }
      @media (min-width: 768px) {
        .clock-badge {
          display: flex;
        }
      }

      .live-pulse {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 9999px;
        background-color: var(--success, #16A34A);
        animation: pulse-animation 2s infinite;
      }

      .clock-time {
        font-size: 0.75rem;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        color: var(--sidebar-active-accent, #C084FC);
        line-height: 1;
      }
      .clock-date {
        font-size: 9px;
        color: var(--sidebar-text-muted, #E9D5FF);
        margin-top: 0.125rem;
      }

      /* Dark Mode Toggle Button */
      .theme-toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        padding: 0.35rem 0.65rem;
        border-radius: 0.75rem;
        color: var(--sidebar-text, #FAF5FF);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 700;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
      }
      .theme-toggle-btn:hover {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.45);
        border-color: var(--sidebar-active-accent, #C084FC);
        box-shadow: 0 4px 14px rgba(var(--primary-rgb, 126, 34, 206), 0.35);
        transform: translateY(-1px);
      }
      .theme-toggle-btn:active {
        transform: translateY(0);
      }
      .toggle-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .theme-toggle-btn .toggle-icon {
        font-size: 17px !important;
        transition: transform 0.35s ease, color 0.2s ease;
      }
      .theme-toggle-btn:hover .toggle-icon {
        transform: rotate(20deg) scale(1.1);
      }
      .theme-toggle-btn.is-dark .toggle-icon-wrap {
        background: rgba(245, 158, 11, 0.2);
        color: #FBBF24;
      }
      .theme-toggle-btn.is-dark:hover .toggle-icon-wrap {
        background: rgba(245, 158, 11, 0.35);
        color: #FDE68A;
      }
      .theme-toggle-btn:not(.is-dark) .toggle-icon-wrap {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.25);
        color: var(--sidebar-active-accent, #C084FC);
      }
      .toggle-text {
        display: none;
        letter-spacing: 0.02em;
      }
      @media (min-width: 640px) {
        .toggle-text {
          display: inline-block;
        }
      }

      .user-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        padding: 0.35rem 0.55rem;
        border-radius: 1rem;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .user-card:hover {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.45);
        border-color: #C084FC;
        box-shadow: 0 4px 12px rgba(var(--primary-rgb, 126, 34, 206), 0.3);
        transform: translateY(-1px);
      }
      .active-user-card {
        border-color: #C084FC !important;
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.5) !important;
        box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.35) !important;
      }
      @media (min-width: 640px) {
        .user-card {
          gap: 0.625rem;
          padding: 0.375rem 0.625rem;
        }
      }

      .user-avatar {
        width: 1.85rem;
        height: 1.85rem;
        border-radius: 0.55rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #6B21A8));
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #ffffff;
        font-size: 0.8rem;
      }
      @media (min-width: 640px) {
        .user-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
        }
      }

      .user-online {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 0.45rem;
        height: 0.45rem;
        background-color: var(--success, #16A34A);
        border: 1.5px solid var(--sidebar-bg, #2E1065);
        border-radius: 9999px;
      }

      .user-info {
        display: none;
      }
      @media (min-width: 640px) {
        .user-info {
          display: block;
        }
      }

      .user-name {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--sidebar-text, #FAF5FF);
        line-height: 1.2;
        max-width: 90px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      @media (min-width: 1024px) {
        .user-name {
          max-width: 120px;
        }
      }

      .user-role-badge {
        font-size: 9px;
        font-weight: 700;
        color: var(--sidebar-active-accent, #C084FC);
        text-transform: uppercase;
      }

      .signout-btn {
        padding: 0.35rem;
        border-radius: 0.5rem;
        color: var(--sidebar-text-muted, #E9D5FF);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .signout-btn:hover {
        color: var(--danger, #DC2626);
        background: rgba(var(--danger-rgb, 220, 38, 38), 0.15);
      }
    `,
  ],
})
export class HeaderComponent {
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public currentTime = '';
  public currentDate = '';

  constructor() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  public onLogout(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.authService.logout();
  }
}

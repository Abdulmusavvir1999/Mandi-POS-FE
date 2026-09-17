import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

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

      <!-- Right: Live Real-Time Clock & User Profile Bar -->
      <div class="flex items-center gap-2 sm:gap-3" *ngIf="authService.currentUser() as user">
        <!-- Digital Live Clock (≥ 768px) -->
        <div class="clock-badge">
          <div class="live-pulse"></div>
          <div>
            <div class="clock-time">{{ currentTime }}</div>
            <div class="clock-date">{{ currentDate }}</div>
          </div>
        </div>

        <!-- User Profile Card -->
        <div class="user-card">
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
            (click)="authService.logout()"
            class="signout-btn"
            title="Sign Out of POS System"
          >
            <span class="material-symbols-outlined g-icon-sm">logout</span>
          </button>
        </div>
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
        box-shadow: 0 4px 12px rgba(126, 34, 206, 0.4);
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

      .user-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--sidebar-surface, #3B0764);
        border: 1px solid var(--sidebar-border, #581C87);
        padding: 0.35rem 0.55rem;
        border-radius: 1rem;
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
        background: rgba(220, 38, 38, 0.15);
      }
    `,
  ],
})
export class HeaderComponent {
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  public authService = inject(AuthService);
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
}

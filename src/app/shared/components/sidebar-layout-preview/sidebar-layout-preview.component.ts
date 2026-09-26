import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SidebarLayoutService,
  SidebarTemplateCaps,
  SidebarTemplateKey,
} from '../../../core/services/sidebar-layout.service';
import { SIDEBAR_NAV_SECTIONS } from '../../../core/config/sidebar-nav.config';
import { SIDEBAR_LAYOUT_CSS } from '../../styles/sidebar-layout.styles';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

interface PreviewNavItem {
  label: string;
  iconName: string;
  badge?: string;
  isPos?: boolean;
  isActive?: boolean;
}

interface PreviewNavSection {
  title: string;
  items: PreviewNavItem[];
}

/**
 * Pixel-accurate, non-interactive replica of the real navigation rail.
 *
 * It reuses the exact class names and SIDEBAR_LAYOUT_CSS that SidebarComponent
 * renders, so whatever is previewed here is literally what ships — only the
 * data is sample data and the links are inert.
 */
@Component({
  selector: 'app-sidebar-layout-preview',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <div class="sb-preview-stage">
      <!-- Faux app chrome so floating / glass rails read correctly -->
      <div class="sb-preview-shell">
        <aside
          class="sidebar-container"
          [class.is-collapsed]="previewCollapsed()"
          [ngClass]="'tpl-' + layoutKey"
          [ngStyle]="cssVars"
          aria-hidden="true"
        >
          <!-- Brand Header -->
          <div class="brand-header">
            <div class="brand-content">
              <div class="brand-logo-container">
                <span class="material-symbols-outlined g-icon-md brand-logo-icon">storefront</span>
              </div>
              <div class="brand-meta" *ngIf="!previewCollapsed()">
                <span class="brand-title"> POS</span>
                <span class="brand-subtitle">POS Management</span>
              </div>
            </div>
            <button type="button" class="collapse-toggle-btn" tabindex="-1">
              <span class="material-symbols-outlined g-icon-sm toggle-icon">
                {{ previewCollapsed() ? 'menu_open' : 'dock_to_left' }}
              </span>
            </button>
          </div>

          <!-- Quick Actions -->
          <div class="sb-quick-actions" *ngIf="caps?.quickActions && !previewCollapsed()">
            <span class="sb-quick-btn">
              <span class="sb-quick-dot"></span>
              <span class="material-symbols-outlined">notifications</span>
              <span>Alerts</span>
            </span>
            <span class="sb-quick-btn">
              <span class="material-symbols-outlined">help</span>
              <span>Help</span>
            </span>
          </div>

          <!-- Menu Search -->
          <div class="sb-search-wrap" *ngIf="caps?.hasSearch && !previewCollapsed()">
            <div class="sb-search-field">
              <span class="material-symbols-outlined sb-search-icon">search</span>
              <input
                type="text"
                class="sb-search-input"
                placeholder="Search menu…"
                readonly
                tabindex="-1"
              />
            </div>
          </div>

          <!-- Navigation Groups -->
          <nav class="sidebar-nav-scroll">
            <div class="nav-groups-wrapper">
              <div class="nav-section" *ngFor="let section of sampleSections()">
                <ng-container *ngIf="!previewCollapsed()">
                  <div
                    *ngIf="caps?.collapsibleSections; else plainLabel"
                    class="section-label"
                  >
                    <span>{{ section.title }}</span>
                    <span class="material-symbols-outlined section-chevron">expand_more</span>
                  </div>
                  <ng-template #plainLabel>
                    <div class="section-label">{{ section.title }}</div>
                  </ng-template>
                </ng-container>
                <div class="section-divider-collapsed" *ngIf="previewCollapsed()"></div>

                <div class="section-items">
                  <span
                    *ngFor="let item of section.items"
                    class="menu-item"
                    [class.is-active]="item.isActive"
                    [class.pos-special-item]="item.isPos"
                  >
                    <span class="active-indicator"></span>
                    <div class="item-icon-wrapper">
                      <span class="material-symbols-outlined g-icon-sm">{{ item.iconName }}</span>
                    </div>
                    <span class="item-label" *ngIf="!previewCollapsed()">{{ item.label }}</span>
                    <span class="item-badge" *ngIf="!previewCollapsed() && item.badge">
                      {{ item.badge }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </nav>

          <!-- Footer -->
          <div class="sidebar-footer">
            <span class="user-profile-card">
              <span class="user-avatar-wrapper">
                <span class="user-avatar">AM</span>
                <span class="online-indicator"></span>
              </span>
              <span class="user-details" *ngIf="!previewCollapsed()">
                <span class="user-name">Abdul Musavir</span>
                <span class="user-role">Administrator</span>
              </span>
              <span class="logout-button" *ngIf="!previewCollapsed()">
                <span class="material-symbols-outlined g-icon-sm">logout</span>
              </span>
            </span>
            <div class="collapsed-logout-wrap" *ngIf="previewCollapsed()">
              <span class="collapsed-logout-btn">
                <span class="material-symbols-outlined g-icon-sm">logout</span>
              </span>
            </div>
          </div>
        </aside>

        <!-- Faux content canvas -->
        <div class="sb-preview-canvas">
          <div class="sb-preview-topbar">
            <span class="sb-fake-pill sbw-24"></span>
            <span class="sb-fake-pill sbw-14"></span>
            <span class="sb-fake-avatar"></span>
          </div>
          <div class="sb-preview-body">
            <div class="sb-fake-card" *ngFor="let n of [1, 2, 3, 4]">
              <span class="sb-fake-line sbw-16"></span>
              <span class="sb-fake-line-lg sbw-10"></span>
              <span class="sb-fake-line sbw-20"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview controls -->
      <div class="sb-preview-controls">
        <button
          type="button"
          class="sb-preview-toggle"
          [class.is-on]="!previewCollapsed()"
          (click)="previewCollapsed.set(false)"
        >
          <span class="material-symbols-outlined">left_panel_open</span>
          <span>Expanded</span>
        </button>
        <button
          type="button"
          class="sb-preview-toggle"
          [class.is-on]="previewCollapsed()"
          (click)="previewCollapsed.set(true)"
        >
          <span class="material-symbols-outlined">left_panel_close</span>
          <span>Collapsed (icon rail)</span>
        </button>
        <span class="sb-preview-hint">
          <span class="material-symbols-outlined">touch_app</span>
          Hover the menu rows to feel the interaction
        </span>
      </div>
    </div>
  `,
  styles: [
    SIDEBAR_LAYOUT_CSS,
    `
      .sb-preview-stage {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
      }

      .sb-preview-shell {
        display: flex;
        height: 520px;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid var(--card-border, #E9D5FF);
        background:
          radial-gradient(1200px 400px at -10% -10%, color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 22%, transparent), transparent 60%),
          linear-gradient(135deg, var(--bg-app, #F8FAFC), var(--card-hover, #F1F5F9));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      /* The rail inside the preview is always a docked panel, never fixed */
      .sb-preview-shell .sidebar-container {
        position: relative;
        flex-shrink: 0;
      }

      .sb-preview-canvas {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        padding: 14px;
        gap: 14px;
      }

      .sb-preview-topbar {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 44px;
        padding: 0 14px;
        border-radius: 12px;
        background: #FFFFFF;
        border: 1px solid var(--card-border, #E2E8F0);
        box-shadow: 0 2px 8px -4px rgba(15, 23, 42, 0.18);
      }

      .sb-preview-body {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        gap: 12px;
      }

      .sb-fake-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 9px;
        padding: 16px;
        border-radius: 14px;
        background: #FFFFFF;
        border: 1px solid var(--card-border, #E2E8F0);
        box-shadow: 0 4px 14px -8px rgba(15, 23, 42, 0.25);
      }

      .sb-fake-line,
      .sb-fake-line-lg,
      .sb-fake-pill {
        display: block;
        height: 8px;
        border-radius: 999px;
        background: var(--card-border, #E2E8F0);
      }
      .sb-fake-line-lg {
        height: 16px;
        background: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 32%, var(--card-border, #E2E8F0));
      }
      .sb-fake-pill {
        height: 10px;
      }
      .sb-fake-avatar {
        margin-left: auto;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--sidebar-active-accent, #C084FC) 40%, var(--card-border, #E2E8F0));
      }
      /* Named sbw-* rather than w-*: the global utilities in styles.css set
         width AND height with !important, which would square these bars off. */
      .sbw-10 { width: 40%; }
      .sbw-14 { width: 56px; }
      .sbw-16 { width: 64%; }
      .sbw-20 { width: 48%; }
      .sbw-24 { width: 96px; }

      .sb-preview-controls {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .sb-preview-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: #FFFFFF;
        color: var(--primary-variant, #6B21A8);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .sb-preview-toggle:hover {
        border-color: #C084FC;
        transform: translateY(-1px);
        box-shadow: 0 6px 14px -8px rgba(var(--primary-rgb, 126, 34, 206), 0.6);
      }
      .sb-preview-toggle.is-on {
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #A855F7));
        border-color: var(--primary, #7E22CE);
        color: #FFFFFF;
        box-shadow: 0 6px 16px -8px rgba(var(--primary-rgb, 126, 34, 206), 0.8);
      }
      .sb-preview-toggle .material-symbols-outlined {
        font-size: 16px !important;
      }

      .sb-preview-hint {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: auto;
        font-size: 11px;
        font-weight: 500;
        color: var(--text-muted, #64748B);
      }
      .sb-preview-hint .material-symbols-outlined {
        font-size: 15px !important;
      }

      @media (max-width: 767px) {
        .sb-preview-shell {
          height: 440px;
        }
        .sb-preview-body {
          grid-template-columns: minmax(0, 1fr);
        }
        .sb-preview-hint {
          display: none;
        }
      }
    `,
  ],
})
export class SidebarLayoutPreviewComponent {
  @Input() layoutKey: SidebarTemplateKey = 'classic';
  @Input() cssVars: Record<string, string> = {};
  @Input() caps: SidebarTemplateCaps | null = null;

  public previewCollapsed = signal(false);

  private sidebarLayout = inject(SidebarLayoutService);

  /**
   * Built from the real menu rather than a copy of it, and through the same
   * rename resolver the rail uses — so an operator renaming a module in the
   * card above sees it change here as they type. Each group is trimmed to
   * the first few rows: the preview is a shape to judge a design by, not a
   * second copy of the navigation.
   */
  private static readonly PREVIEW_ROWS = 4;

  public sampleSections = computed<PreviewNavSection[]>(() =>
    SIDEBAR_NAV_SECTIONS.map((section, sectionIndex) => ({
      title: this.sidebarLayout.sectionLabel(section.id, section.title),
      items: section.items
        .slice(0, SidebarLayoutPreviewComponent.PREVIEW_ROWS)
        .map((item, itemIndex) => ({
          label: this.sidebarLayout.itemLabel(item.id, item.label),
          iconName: item.iconName,
          badge: item.badge,
          isPos: item.isPos,
          // One row is drawn active so the design's active treatment is
          // visible; the second row of the first group, as before.
          isActive: sectionIndex === 0 && itemIndex === 1,
        })),
    })),
  );
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService, ToastPosition } from '../../core/services/notification.service';
import { ThemeService, DEFAULT_THEME_PALETTES, ThemePalette } from '../../core/services/theme.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

type SettingsTab = 'theme' | 'toast' | 'business' | 'hardware';

/** Branding images that can be replaced from the Store tab. */
type BrandingSlotKey = 'logo' | 'login' | 'favicon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent, PageLoaderComponent],
  template: `
    <div class="settings-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading settings…"
        subMessage="Fetching saved configuration from the server."
        icon="settings"
        (retry)="loadSettings()"
      ></app-page-loader>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TOP EXECUTIVE HEADER & PERSISTENT ACTION BAR                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="settings-header-card">
        <div class="header-info-group">
          <div class="header-icon-badge">
            <span class="material-symbols-outlined">tune</span>
          </div>
          <div>
            <div class="header-title-row">
              <h1 class="header-title">System & POS Settings Hub</h1>
            </div>
            <p class="header-subtitle">
              Configure dynamic UI palettes, toast positioning, tax calculations, thermal receipts & POS controls.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            (click)="resetToDefaultTheme()"
            class="custom-btn btn-outline-purple"
            title="Revert color scheme to Royal Purple"
          >
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Reset Colors</span>
          </button>

          <button
            type="button"
            (click)="saveSettings()"
            [disabled]="isSaving"
            class="custom-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined" [class.spin-icon]="isSaving">
              {{ isSaving ? 'progress_activity' : 'check_circle' }}
            </span>
            <span>{{ isSaving ? 'Saving Changes...' : 'Save Configuration' }}</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- LUXURY TAB NAVIGATION BAR                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tab-nav-bar">
        <button
          type="button"
          (click)="activeTab = 'theme'"
          class="tab-btn"
          [class.is-active]="activeTab === 'theme'"
        >
          <span class="material-symbols-outlined">palette</span>
          <span>Brand Theme & UI Palette</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'toast'"
          class="tab-btn"
          [class.is-active]="activeTab === 'toast'"
        >
          <span class="material-symbols-outlined">notifications_active</span>
          <span>Super Toaster Notifications</span>
          <span class="active-dot"></span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'business'"
          class="tab-btn"
          [class.is-active]="activeTab === 'business'"
        >
          <span class="material-symbols-outlined">storefront</span>
          <span>Store & Tax Engine</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'hardware'"
          class="tab-btn"
          [class.is-active]="activeTab === 'hardware'"
        >
          <span class="material-symbols-outlined">print</span>
          <span>Receipts & Hardware</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: BRAND THEME & UI PALETTE                                 -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'theme'" class="tab-content-pane">
        <!-- Preset Palettes -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">
                <span class="material-symbols-outlined icon-purple">auto_fix_high</span>
                <span>Curated Luxury Theme Presets</span>
              </h2>
              <p class="card-subtitle">Select a designer palette or fine-tune individual tokens below.</p>
            </div>
            <span class="active-preset-tag">
              Active: <strong>{{ activePresetKey | uppercase }}</strong>
            </span>
          </div>

          <div class="presets-grid">
            <button
              type="button"
              *ngFor="let key of presetKeys"
              (click)="selectPreset(key)"
              class="preset-item-card"
              [class.is-selected]="activePresetKey === key && !showCustomFields"
            >
              <div class="preset-header">
                <span class="preset-emoji">{{ presets[key].icon }}</span>
                <span *ngIf="activePresetKey === key && !showCustomFields" class="material-symbols-outlined check-badge">check_circle</span>
              </div>
              <div class="preset-name">{{ presets[key].name }}</div>
              
              <!-- Color swatch strip -->
              <div class="preset-swatch-row">
                <span class="swatch-dot" [style.background-color]="presets[key].palette.primary"></span>
                <span class="swatch-dot" [style.background-color]="presets[key].palette.sidebarBg"></span>
                <span class="swatch-dot" [style.background-color]="presets[key].palette.bgApp"></span>
                <span class="swatch-dot" [style.background-color]="presets[key].palette.success"></span>
              </div>
            </button>

            <!-- 6th Custom Palette Card -->
            <button
              type="button"
              (click)="openCustomThemeCard()"
              class="preset-item-card preset-custom-card"
              [class.is-selected]="activePresetKey === 'custom' || showCustomFields"
            >
              <div class="preset-header">
                <span class="preset-emoji">🎨</span>
                <span *ngIf="activePresetKey === 'custom' || showCustomFields" class="material-symbols-outlined check-badge">tune</span>
              </div>
              <div class="preset-name">Custom Palette</div>
              
              <!-- Dynamic Color Swatches -->
              <div class="preset-swatch-row">
                <span class="swatch-dot" [style.background-color]="settingsMap['THEME_PRIMARY_COLOR']"></span>
                <span class="swatch-dot" [style.background-color]="settingsMap['THEME_SIDEBAR_BG']"></span>
                <span class="swatch-dot" [style.background-color]="settingsMap['THEME_SUCCESS_COLOR']"></span>
                <span class="swatch-dot" [style.background-color]="settingsMap['THEME_WARNING_COLOR']"></span>
              </div>
            </button>
          </div>
        </div>

        <!-- Preset Active Clean Notice (Shown when a preset is active and custom fields are hidden) -->
        <div *ngIf="!showCustomFields && activePresetKey !== 'custom'" class="preset-active-banner">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" style="background: var(--primary-light); border: 1px solid var(--card-border); color: var(--primary);">
              <span class="material-symbols-outlined">palette</span>
            </div>
            <div>
              <div class="font-bold text-xs" style="color: var(--text-main)">Active Theme Preset: <strong>{{ getActivePresetName() }}</strong></div>
              <p class="text-[11px]" style="color: var(--text-muted)">Designer theme palette is applied across the app. Click the <strong>Custom Palette</strong> card above or click <strong>Fine-Tune Colors</strong> to customize individual color tokens.</p>
            </div>
          </div>
          <button
            type="button"
            (click)="openCustomThemeCard()"
            class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
          >
            <span class="material-symbols-outlined" style="font-size: 16px;">tune</span>
            <span>Fine-Tune Individual Colors</span>
          </button>
        </div>

        <!-- Detailed Color Token Groups (Only visible when Custom Palette is active or clicked) -->
        <div *ngIf="showCustomFields || activePresetKey === 'custom'" class="custom-tokens-section">
          <div class="flex items-center justify-between pb-2 mb-3" style="border-bottom: 1.5px solid var(--card-border);">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined" style="color: var(--primary)">tune</span>
              <h3 class="text-xs font-black uppercase tracking-wider" style="color: var(--text-main)">Custom Color Tokens & Pickers</h3>
            </div>
            <button
              type="button"
              (click)="showCustomFields = false"
              class="text-xs font-semibold flex items-center gap-1 cursor-pointer"
              style="color: var(--text-muted);"
            >
              <span>Collapse Custom Fields</span>
              <span class="material-symbols-outlined text-sm">expand_less</span>
            </button>
          </div>

          <div class="three-col-grid">
            <!-- Group 1: Core Brand Colors -->
            <div class="setting-card">
              <div class="group-header">
                <span class="material-symbols-outlined icon-purple">brand_awareness</span>
                <h3 class="group-title">Core Brand & Accents</h3>
              </div>

              <!-- Primary -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Primary Brand Color</label>
                  <span class="hex-badge">{{ settingsMap['THEME_PRIMARY_COLOR'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Primary Brand Color"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_PRIMARY_COLOR']"
                    (ngModelChange)="onColorChanged('primary', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Primary Brand Color"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_PRIMARY_COLOR']"
                    (ngModelChange)="onColorChanged('primary', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- Primary Hover -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Primary Hover State</label>
                  <span class="hex-badge">{{ settingsMap['THEME_PRIMARY_HOVER'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Primary Hover State"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_PRIMARY_HOVER']"
                    (ngModelChange)="onColorChanged('primaryHover', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Primary Hover State"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_PRIMARY_HOVER']"
                    (ngModelChange)="onColorChanged('primaryHover', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- Sidebar Accent -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Active Nav Highlight</label>
                  <span class="hex-badge">{{ settingsMap['THEME_SIDEBAR_ACCENT'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Active Nav Highlight"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_ACCENT']"
                    (ngModelChange)="onColorChanged('sidebarActiveAccent', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Active Nav Highlight"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_ACCENT']"
                    (ngModelChange)="onColorChanged('sidebarActiveAccent', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>
            </div>

            <!-- Group 2: Layout & Surfaces -->
            <div class="setting-card">
              <div class="group-header">
                <span class="material-symbols-outlined icon-purple">layers</span>
                <h3 class="group-title">Navigation & Surfaces</h3>
              </div>

              <!-- Sidebar BG -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Sidebar & Nav Background</label>
                  <span class="hex-badge">{{ settingsMap['THEME_SIDEBAR_BG'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Sidebar & Nav Background"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_BG']"
                    (ngModelChange)="onColorChanged('sidebarBg', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Sidebar & Nav Background"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_BG']"
                    (ngModelChange)="onColorChanged('sidebarBg', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- Sidebar Text -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Sidebar Text & Icons</label>
                  <span class="hex-badge">{{ settingsMap['THEME_SIDEBAR_TEXT'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Sidebar Text & Icons"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_TEXT']"
                    (ngModelChange)="onColorChanged('sidebarText', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Sidebar Text & Icons"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_SIDEBAR_TEXT']"
                    (ngModelChange)="onColorChanged('sidebarText', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- App BG -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Application Canvas Background</label>
                  <span class="hex-badge">{{ settingsMap['THEME_APP_BG'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Application Canvas Background"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_APP_BG']"
                    (ngModelChange)="onColorChanged('bgApp', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Application Canvas Background"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_APP_BG']"
                    (ngModelChange)="onColorChanged('bgApp', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>
            </div>

            <!-- Group 3: Status & Typography -->
            <div class="setting-card">
              <div class="group-header">
                <span class="material-symbols-outlined icon-purple">traffic</span>
                <h3 class="group-title">Status & Feedback</h3>
              </div>

              <!-- Success -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Success / Available</label>
                  <span class="hex-badge">{{ settingsMap['THEME_SUCCESS_COLOR'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Success / Available"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_SUCCESS_COLOR']"
                    (ngModelChange)="onColorChanged('success', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Success / Available"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_SUCCESS_COLOR']"
                    (ngModelChange)="onColorChanged('success', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- Warning -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Warning / In-Progress</label>
                  <span class="hex-badge">{{ settingsMap['THEME_WARNING_COLOR'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Warning / In-Progress"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_WARNING_COLOR']"
                    (ngModelChange)="onColorChanged('warning', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Warning / In-Progress"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_WARNING_COLOR']"
                    (ngModelChange)="onColorChanged('warning', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>

              <!-- Danger -->
              <div class="token-input-box">
                <div class="token-label-row">
                  <label class="token-label">Danger / Stock Alert</label>
                  <span class="hex-badge">{{ settingsMap['THEME_DANGER_COLOR'] }}</span>
                </div>
                <div class="token-controls">
                  <input
                    title="Danger / Stock Alert"
                    type="color"
                    [(ngModel)]="settingsMap['THEME_DANGER_COLOR']"
                    (ngModelChange)="onColorChanged('danger', $event)"
                    class="color-picker-input"
                  />
                  <input
                    title="Danger / Stock Alert"
                    type="text"
                    [(ngModel)]="settingsMap['THEME_DANGER_COLOR']"
                    (ngModelChange)="onColorChanged('danger', $event)"
                    class="hex-text-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Real-time Preview Sandbox -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">preview</span>
              <h3 class="card-title-sm">Live Component Preview Sandbox</h3>
            </div>
            <span class="info-note">Changes apply immediately across all screens</span>
          </div>

          <div class="sandbox-container" [style.background-color]="settingsMap['THEME_APP_BG']">
            <!-- Mock Sidebar -->
            <div class="mock-sidebar-card" [style.background-color]="settingsMap['THEME_SIDEBAR_BG']" [style.color]="settingsMap['THEME_SIDEBAR_TEXT']">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined" [style.color]="settingsMap['THEME_SIDEBAR_ACCENT']">storefront</span>
                <span class="mock-logo-text">{{ settingsService.businessName() }}</span>
              </div>
              <span class="mock-hotkey-badge" [style.background-color]="settingsMap['THEME_PRIMARY_COLOR']" [style.color]="'#FFFFFF'">ACTIVE</span>
            </div>

            <!-- Mock Actions -->
            <div class="mock-action-card" [style.border-color]="settingsMap['THEME_CARD_BORDER']">
              <button class="custom-btn btn-sm text-white" [style.background]="'linear-gradient(135deg, ' + settingsMap['THEME_PRIMARY_COLOR'] + ', ' + settingsMap['THEME_PRIMARY_HOVER'] + ')'">
                Primary Action
              </button>
              <button class="custom-btn btn-sm btn-outline-purple" [style.border-color]="settingsMap['THEME_CARD_BORDER']" [style.color]="settingsMap['THEME_TEXT_MAIN']">
                Secondary
              </button>
            </div>

            <!-- Mock Badges -->
            <div class="mock-badges-card" [style.border-color]="settingsMap['THEME_CARD_BORDER']">
              <span class="mini-status-badge" [style.background-color]="settingsMap['THEME_SUCCESS_COLOR'] + '25'" [style.color]="settingsMap['THEME_SUCCESS_COLOR']">
                ● Available
              </span>
              <span class="mini-status-badge" [style.background-color]="settingsMap['THEME_WARNING_COLOR'] + '25'" [style.color]="settingsMap['THEME_WARNING_COLOR']">
                ● Cooking
              </span>
              <span class="mini-status-badge" [style.background-color]="settingsMap['THEME_DANGER_COLOR'] + '25'" [style.color]="settingsMap['THEME_DANGER_COLOR']">
                ● Alert
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: SUPER TOASTER & NOTIFICATIONS (PROFESSIONAL WIREFRAME)  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'toast'" class="tab-content-pane">
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">
                <span class="material-symbols-outlined icon-purple">desktop_windows</span>
                <span>Interactive Viewport Toast Placement (6 Screen Positions)</span>
              </h2>
              <p class="card-subtitle">
                Click any position anchor on the monitor canvas below to configure where toasts appear on your screen.
              </p>
            </div>
            <div class="flex-align-center gap-2">
              <span class="position-label-tag">Active Position:</span>
              <span class="badge-pill-purple">
                {{ (settingsMap['TOAST_POSITION'] || 'top-right') | uppercase }}
              </span>
            </div>
          </div>

          <!-- INTERACTIVE SCREEN VIEWPORT CANVAS -->
          <div class="viewport-screen-frame">
            <!-- Mock Header Bar in screen wireframe -->
            <div class="screen-top-bar">
              <div class="screen-dots-group">
                <span class="dot dot-red"></span>
                <span class="dot dot-amber"></span>
                <span class="dot dot-green"></span>
                <span class="screen-meta-title">POS Screen Viewport Simulation</span>
              </div>
              <div class="screen-res-tag">
                <span class="material-symbols-outlined text-[14px]">wifi</span>
                <span>1920 × 1080</span>
              </div>
            </div>

            <!-- TOP 3 POSITIONS ROW -->
            <div class="positions-row">
              <!-- Top Left -->
              <button
                type="button"
                (click)="setToastPosition('top-left')"
                class="position-pad pos-align-left"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'top-left'"
              >
                <div class="pad-title-row">
                  <span class="pad-name">
                    <span class="material-symbols-outlined">north_west</span>
                    <span>Top Left</span>
                  </span>
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'top-left'" class="material-symbols-outlined check-icon">check_circle</span>
                </div>
                <p class="pad-subtext">Upper-left corner overlay</p>
              </button>

              <!-- Top Center -->
              <button
                type="button"
                (click)="setToastPosition('top-center')"
                class="position-pad pos-align-center"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'top-center'"
              >
                <div class="pad-title-row justify-center">
                  <span class="pad-name">
                    <span class="material-symbols-outlined">north</span>
                    <span>Top Center</span>
                  </span>
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'top-center'" class="material-symbols-outlined check-icon">check_circle</span>
                </div>
                <p class="pad-subtext">Centered alert banner</p>
              </button>

              <!-- Top Right (Default ⭐) -->
              <button
                type="button"
                (click)="setToastPosition('top-right')"
                class="position-pad pos-align-right"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'top-right' || !settingsMap['TOAST_POSITION']"
              >
                <div class="pad-title-row justify-between">
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'top-right' || !settingsMap['TOAST_POSITION']" class="material-symbols-outlined check-icon">check_circle</span>
                  <span class="pad-name ml-auto">
                    <span>Top Right ⭐</span>
                    <span class="material-symbols-outlined">north_east</span>
                  </span>
                </div>
                <p class="pad-subtext text-gold">⭐ Recommended Default</p>
              </button>
            </div>

            <!-- CENTER WORKSPACE MOCKUP -->
            <div class="center-workspace-box">
              <div class="mock-order-board">
                <span class="board-title">POS Main Workspace & Order Grid</span>
                <p class="board-desc">Toasts float seamlessly above this area without obstructing fast cashier operations</p>
              </div>
            </div>

            <!-- BOTTOM 3 POSITIONS ROW -->
            <div class="positions-row">
              <!-- Bottom Left -->
              <button
                type="button"
                (click)="setToastPosition('bottom-left')"
                class="position-pad pos-align-left"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'bottom-left'"
              >
                <div class="pad-title-row">
                  <span class="pad-name">
                    <span class="material-symbols-outlined">south_west</span>
                    <span>Bottom Left</span>
                  </span>
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'bottom-left'" class="material-symbols-outlined check-icon">check_circle</span>
                </div>
                <p class="pad-subtext">Lower-left sidebar corner</p>
              </button>

              <!-- Bottom Center -->
              <button
                type="button"
                (click)="setToastPosition('bottom-center')"
                class="position-pad pos-align-center"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'bottom-center'"
              >
                <div class="pad-title-row justify-center">
                  <span class="pad-name">
                    <span class="material-symbols-outlined">south</span>
                    <span>Bottom Center</span>
                  </span>
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'bottom-center'" class="material-symbols-outlined check-icon">check_circle</span>
                </div>
                <p class="pad-subtext">Mobile & tablet friendly</p>
              </button>

              <!-- Bottom Right -->
              <button
                type="button"
                (click)="setToastPosition('bottom-right')"
                class="position-pad pos-align-right"
                [class.is-selected]="settingsMap['TOAST_POSITION'] === 'bottom-right'"
              >
                <div class="pad-title-row justify-between">
                  <span *ngIf="settingsMap['TOAST_POSITION'] === 'bottom-right'" class="material-symbols-outlined check-icon">check_circle</span>
                  <span class="pad-name ml-auto">
                    <span>Bottom Right</span>
                    <span class="material-symbols-outlined">south_east</span>
                  </span>
                </div>
                <p class="pad-subtext">Lower-right corner</p>
              </button>
            </div>
          </div>

          <!-- BEHAVIOR & TIMING CONTROLS -->
          <div class="controls-five-grid">
            <!-- Duration -->
            <div class="control-box">
              <label class="control-label">Duration (ms)</label>
              <input
                title="Duration (ms)"
                type="number"
                step="500"
                min="1000"
                max="10000"
                [(ngModel)]="settingsMap['TOAST_DURATION']"
                (ngModelChange)="onToastConfigChanged()"
                class="control-input font-mono"
                placeholder="4000"
              />
              <span class="control-hint">Auto-dismiss time</span>
            </div>

            <!-- Max Visible -->
            <div class="control-box">
              <label class="control-label">Max Visible Toasts</label>
              <app-custom-dropdown
                [options]="toastMaxVisibleOptions"
                [(ngModel)]="settingsMap['TOAST_MAX_VISIBLE']"
                (ngModelChange)="onToastConfigChanged()"
                placeholder="Select limit"
                minWidth="100%"
              ></app-custom-dropdown>
              <span class="control-hint">Max stack limit</span>
            </div>

            <!-- Animation Style -->
            <div class="control-box">
              <label class="control-label">Animation Style</label>
              <app-custom-dropdown
                [options]="toastAnimationOptions"
                [(ngModel)]="settingsMap['TOAST_ANIMATION']"
                (ngModelChange)="onToastConfigChanged()"
                placeholder="Select animation"
                minWidth="100%"
              ></app-custom-dropdown>
              <span class="control-hint">Entrance curve</span>
            </div>

            <!-- Close Button -->
            <div class="control-box">
              <label class="control-label">Close Button</label>
              <app-custom-dropdown
                [options]="toastShowCloseOptions"
                [(ngModel)]="settingsMap['TOAST_SHOW_CLOSE']"
                (ngModelChange)="onToastConfigChanged()"
                placeholder="Select close behavior"
                minWidth="100%"
              ></app-custom-dropdown>
              <span class="control-hint">Dismiss icon on card</span>
            </div>

            <!-- Pause on Hover -->
            <div class="control-box">
              <label class="control-label">Pause On Hover</label>
              <app-custom-dropdown
                [options]="toastPauseHoverOptions"
                [(ngModel)]="settingsMap['TOAST_PAUSE_HOVER']"
                (ngModelChange)="onToastConfigChanged()"
                placeholder="Select pause behavior"
                minWidth="100%"
              ></app-custom-dropdown>
              <span class="control-hint">Hover stops timer</span>
            </div>
          </div>

          <!-- LIVE TEST SUITE -->
          <div class="playground-card">
            <div class="playground-header">
              <div class="flex-align-center gap-3">
                <span class="playground-icon-badge">
                  <span class="material-symbols-outlined">science</span>
                </span>
                <div>
                  <h3 class="playground-title">Live Toast Notification Playground</h3>
                  <p class="playground-sub">Trigger real-time sample toasts to test timing, animations & positions.</p>
                </div>
              </div>

              <button
                type="button"
                (click)="clearAllToasts()"
                class="custom-btn btn-sm btn-outline-purple"
              >
                <span class="material-symbols-outlined">clear_all</span>
                <span>Dismiss All Toasts</span>
              </button>
            </div>

            <div class="test-buttons-grid">
              <button
                type="button"
                (click)="testToast('success')"
                class="custom-btn btn-test btn-test-success"
              >
                <span class="material-symbols-outlined">check_circle</span>
                <span>Success Toast</span>
              </button>

              <button
                type="button"
                (click)="testToast('error')"
                class="custom-btn btn-test btn-test-error"
              >
                <span class="material-symbols-outlined">cancel</span>
                <span>Error Toast</span>
              </button>

              <button
                type="button"
                (click)="testToast('warning')"
                class="custom-btn btn-test btn-test-warning"
              >
                <span class="material-symbols-outlined">warning</span>
                <span>Warning Toast</span>
              </button>

              <button
                type="button"
                (click)="testToast('info')"
                class="custom-btn btn-test btn-test-info"
              >
                <span class="material-symbols-outlined">info</span>
                <span>Info Toast</span>
              </button>

              <button
                type="button"
                (click)="testToast('loading')"
                class="custom-btn btn-test btn-test-loading"
              >
                <span class="material-symbols-outlined spin-icon">progress_activity</span>
                <span>Loading Toast</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 3: STORE PROFILE & TAX ENGINE                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'business'" class="tab-content-pane">
        <div class="two-col-grid">
          <!-- 1. Store Profile -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">store</span>
                <div>
                  <h3 class="card-title-sm">Trade & Business Profile</h3>
                  <p class="card-subtitle">Official trade details printed on customer receipts</p>
                </div>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Business Name</label>
              <input title="Business Name" type="text" [(ngModel)]="settingsMap['BUSINESS_NAME']" class="control-input font-bold" />
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Phone Numbers</label>
                <input title="Phone Numbers" type="text" [(ngModel)]="settingsMap['BUSINESS_PHONE']" class="control-input" />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Email Address</label>
                <input title="Email Address" type="email" [(ngModel)]="settingsMap['BUSINESS_EMAIL']" class="control-input" />
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Physical Address</label>
              <textarea [(ngModel)]="settingsMap['BUSINESS_ADDRESS']" rows="2" class="control-textarea"></textarea>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">GSTIN / Tax ID</label>
                <input title="GSTIN / Tax ID" type="text" [(ngModel)]="settingsMap['BUSINESS_GSTIN']" class="control-input font-mono font-bold" />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Currency Symbol</label>
                <input title="Currency Symbol" type="text" [(ngModel)]="settingsMap['CURRENCY_SYMBOL']" class="control-input font-mono font-bold text-purple" />
              </div>
            </div>
          </div>

          <!-- 2. Tax / GST Engine -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">percent</span>
                <div>
                  <h3 class="card-title-sm">Tax & GST Calculation Engine</h3>
                  <p class="card-subtitle">Financial tax rates computed automatically on invoices</p>
                </div>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Tax Calculation Mode</label>
              <app-custom-dropdown
                [options]="taxCalculationOptions"
                [(ngModel)]="settingsMap['TAX_ENABLED']"
                placeholder="Select tax mode"
                minWidth="100%"
              ></app-custom-dropdown>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Standard Tax Rate (%)</label>
                <input title="Standard Tax Rate (%)" type="number" [(ngModel)]="settingsMap['TAX_PERCENTAGE']" class="control-input font-mono font-bold text-purple" />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Tax Display Label</label>
                <input title="Tax Display Label" type="text" [(ngModel)]="settingsMap['TAX_NAME']" class="control-input font-bold" />
              </div>
            </div>

            <!-- POS Behavior Controls -->
            <div class="sub-section-divider">
              <div class="sub-section-title">POS Operational Rules</div>
              <div class="two-input-row">
                <div class="form-vertical-group">
                  <label class="control-label">Allow Negative Stock</label>
                  <app-custom-dropdown
                    [options]="negativeStockOptions"
                    [(ngModel)]="settingsMap['POS_ALLOW_NEGATIVE_STOCK']"
                    placeholder="Select policy"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
                <div class="form-vertical-group">
                  <label class="control-label">Default Order Type</label>
                  <app-custom-dropdown
                    [options]="defaultOrderTypeOptions"
                    [(ngModel)]="settingsMap['POS_DEFAULT_ORDER_TYPE']"
                    placeholder="Select default type"
                    minWidth="100%"
                  ></app-custom-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Application Branding -->
        <div class="setting-card">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">imagesmode</span>
              <div>
                <h3 class="card-title-sm">Application Branding</h3>
                <p class="card-subtitle">Sign-in artwork, browser favicon & window title used across the system</p>
              </div>
            </div>
          </div>

          <div class="form-vertical-group">
            <label class="control-label">Window / Browser Tab Title</label>
            <input
              title="Window / Browser Tab Title"
              type="text"
              [(ngModel)]="settingsMap['BRANDING_APP_TITLE']"
              placeholder="Project X — POS & Management System"
              class="control-input font-bold"
            />
            <p class="branding-hint">Shown in the browser tab and the desktop window title bar. Leave it empty to keep the built-in title.</p>
          </div>

          <div class="branding-grid">
            <div class="branding-slot" *ngFor="let slot of brandingSlots">
              <div class="branding-slot-head">
                <span class="material-symbols-outlined icon-purple">{{ slot.icon }}</span>
                <div>
                  <div class="branding-slot-title">{{ slot.title }}</div>
                  <p class="branding-hint">{{ slot.hint }}</p>
                </div>
              </div>

              <div class="branding-preview" [class.is-crest]="slot.key !== 'login'">
                <img *ngIf="brandingPreview(slot.key) as src" [src]="src" [alt]="slot.title" />
                <div *ngIf="!brandingPreview(slot.key)" class="branding-empty">
                  <span class="material-symbols-outlined">hide_image</span>
                  <span>Built-in image in use</span>
                </div>
              </div>

              <div class="branding-actions">
                <input
                  title="Choose image file"
                  type="file"
                  hidden
                  #picker
                  [accept]="slot.accept"
                  (change)="onBrandingFile($event, slot.key, picker)"
                />
                <button
                  type="button"
                  class="custom-btn btn-outline-purple"
                  [disabled]="uploadingSlot !== null"
                  (click)="picker.click()"
                >
                  <span class="material-symbols-outlined" [class.spin-icon]="uploadingSlot === slot.key">
                    {{ uploadingSlot === slot.key ? 'progress_activity' : 'upload' }}
                  </span>
                  <span>{{ uploadingSlot === slot.key ? 'Uploading...' : 'Upload Image' }}</span>
                </button>
                <button
                  type="button"
                  class="custom-btn btn-outline-purple"
                  *ngIf="brandingPreview(slot.key)"
                  (click)="clearBranding(slot.key)"
                >
                  <span class="material-symbols-outlined">restart_alt</span>
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          <p class="branding-hint">
            Uploaded images are stored on the POS server — press <strong>Save Configuration</strong> to publish them to every terminal.
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 4: THERMAL RECEIPTS & HARDWARE                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'hardware'" class="tab-content-pane">
        <div class="two-col-grid">
          <!-- Thermal Printer -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">print</span>
                <div>
                  <h3 class="card-title-sm">Thermal Receipt Printer Format</h3>
                  <p class="card-subtitle">Header lines, footer greetings & thermal paper width</p>
                </div>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Receipt Header Lines</label>
              <textarea [(ngModel)]="settingsMap['RECEIPT_HEADER']" rows="2" class="control-textarea font-mono"></textarea>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Receipt Tagline / Subtitle</label>
              <input title="Receipt Tagline / Subtitle" type="text" [(ngModel)]="settingsMap['RECEIPT_TAGLINE']" class="control-input font-mono" placeholder="Authentic Dum Mandi & Arabian Delicacies" />
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Receipt Footer Message</label>
              <textarea [(ngModel)]="settingsMap['RECEIPT_FOOTER']" rows="3" class="control-textarea font-mono"></textarea>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Paper Width</label>
                <app-custom-dropdown
                  [options]="paperWidthOptions"
                  [(ngModel)]="settingsMap['RECEIPT_PAPER_WIDTH']"
                  placeholder="Select width"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Show Customer Name</label>
                <app-custom-dropdown
                  [options]="showCustomerOptions"
                  [(ngModel)]="settingsMap['RECEIPT_SHOW_CUSTOMER']"
                  placeholder="Select option"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>
          </div>

          <!-- Sound FX & Operational Audio -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">volume_up</span>
                <div>
                  <h3 class="card-title-sm">Operational Audio & Terminal Cues</h3>
                  <p class="card-subtitle">Sound effects on billing, barcode scans & checkout</p>
                </div>
              </div>
            </div>

            <div class="audio-toggle-card">
              <div>
                <div class="audio-title">POS Audio Chimes & Sound Effects</div>
                <div class="audio-sub">Plays gentle confirmation chimes upon completing an order</div>
              </div>
              <app-custom-dropdown
                [options]="soundEffectsOptions"
                [(ngModel)]="settingsMap['POS_SOUND_EFFECTS']"
                placeholder="Sound option"
                minWidth="150px"
              ></app-custom-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* === SYSTEM SETTINGS HUB DEDICATED DESIGN SYSTEM === */
      .settings-page-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 1280px;
        margin: 0 auto;
        padding-bottom: 3rem;
      }

      /* Top Header Card */
      .settings-header-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-left: 4px solid var(--primary, #7E22CE);
        border-radius: 18px;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.06);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .settings-header-card {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }

      .header-info-group {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .header-icon-badge {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: var(--primary-light, #F3E8FF);
        border: 1.5px solid var(--card-border, #D8B4FE);
        color: var(--primary, #7E22CE);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px var(--primary-light, rgba(126, 34, 206, 0.12));
      }

      .header-icon-badge .material-symbols-outlined {
        font-size: 26px;
      }

      .header-title-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-wrap: wrap;
      }

      .header-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 1.35rem;
        font-weight: 900;
        color: var(--text-main, #2E1065);
        letter-spacing: -0.02em;
        margin: 0;
      }

      .header-subtitle {
        font-size: 0.775rem;
        font-weight: 500;
        color: var(--text-muted, #6B7280);
        margin-top: 0.2rem;
      }

      .badge-pill-purple {
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
        border: 1px solid var(--card-border, #D8B4FE);
        border-radius: 9999px;
        padding: 0.2rem 0.65rem;
        font-size: 0.675rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      /* Custom Button System */
      .custom-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.8125rem;
        font-weight: 700;
        padding: 0.625rem 1.15rem;
        border-radius: 12px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        outline: none;
        user-select: none;
        white-space: nowrap;
      }

      .custom-btn:hover {
        transform: translateY(-2px);
      }

      .custom-btn:active {
        transform: translateY(0) scale(0.98);
      }

      .btn-gradient-purple {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #ffffff;
        border: 1px solid var(--primary, #7E22CE);
        box-shadow: 0 4px 14px var(--primary-glow, rgba(126, 34, 206, 0.35));
      }

      .btn-gradient-purple:hover {
        background: linear-gradient(135deg, var(--primary-hover, #9333EA) 0%, var(--primary, #7E22CE) 100%);
        box-shadow: 0 8px 22px var(--primary-glow, rgba(126, 34, 206, 0.45));
      }

      .btn-outline-purple {
        background: var(--card-bg, #ffffff);
        color: var(--text-main, #2E1065);
        border: 1.5px solid var(--card-border, #E9D5FF);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }

      .btn-outline-purple:hover {
        background: var(--bg-app, #FAF5FF);
        border-color: var(--primary, #A855F7);
        color: var(--primary, #7E22CE);
        box-shadow: 0 4px 12px var(--primary-light, rgba(126, 34, 206, 0.12));
      }

      .btn-sm {
        padding: 0.45rem 0.875rem;
        font-size: 0.75rem;
        border-radius: 10px;
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* LUXURY TAB NAVIGATION BAR                                       */
      /* ═══════════════════════════════════════════════════════════════ */
      .tab-nav-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        overflow-x: auto;
        padding: 0.5rem 0.25rem 0.65rem 0.25rem;
        margin: -0.25rem 0;
        scrollbar-width: none;
      }

      .tab-nav-bar::-webkit-scrollbar {
        display: none;
      }

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.15rem;
        border-radius: 14px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        color: var(--text-main, #2E1065);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        outline: none;
        white-space: nowrap;
        user-select: none;
      }

      .tab-btn .material-symbols-outlined {
        font-size: 19px;
        color: var(--primary, #7E22CE);
        transition: transform 0.2s ease;
      }

      .tab-btn:hover {
        background: var(--bg-app, #FAF5FF);
        border-color: var(--primary, #C084FC);
        color: var(--primary, #7E22CE);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--primary-light, rgba(126, 34, 206, 0.12));
      }

      .tab-btn:hover .material-symbols-outlined {
        transform: scale(1.1);
      }

      .tab-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #ffffff;
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 6px 20px var(--primary-glow, rgba(126, 34, 206, 0.35));
        transform: translateY(-1px);
      }

      .tab-btn.is-active .material-symbols-outlined {
        color: #ffffff;
      }

      .active-dot {
        width: 7px;
        height: 7px;
        border-radius: 9999px;
        background: var(--success, #4ade80);
        box-shadow: 0 0 8px var(--success, #4ade80);
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* CARDS & PANES                                                   */
      /* ═══════════════════════════════════════════════════════════════ */
      .tab-content-pane {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        animation: paneFadeIn 0.2s ease-out forwards;
      }

      @keyframes paneFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .setting-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-left: 4px solid var(--primary, #7E22CE);
        border-radius: 18px;
        padding: 1.5rem;
        box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .card-header-bar {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-bottom: 0.875rem;
        border-bottom: 1.5px solid var(--card-border, #F3E8FF);
      }

      @media (min-width: 640px) {
        .card-header-bar {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }

      .card-title {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
      }

      .card-title-sm {
        font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .card-subtitle {
        font-size: 0.75rem;
        color: var(--text-muted, #6B7280);
        font-weight: 500;
        margin-top: 0.15rem;
      }

      .icon-purple {
        color: var(--primary, #7E22CE);
      }

      .active-preset-tag {
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        color: var(--text-main, #2E1065);
        padding: 0.35rem 0.75rem;
        border-radius: 10px;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .active-preset-tag strong {
        color: var(--primary, #7E22CE);
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* PRESET PALETTES GRID                                            */
      /* ═══════════════════════════════════════════════════════════════ */
      .presets-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.875rem;
      }

      @media (min-width: 640px) {
        .presets-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .presets-grid {
          grid-template-columns: repeat(6, 1fr);
        }
      }

      .preset-item-card {
        padding: 1rem;
        border-radius: 14px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      }

      .preset-custom-card {
        border-style: dashed;
        background: var(--bg-app, #FAFAFE);
      }

      .preset-custom-card:hover {
        border-style: solid;
        background: var(--bg-app, #FAF5FF);
      }

      .preset-item-card:hover {
        border-color: var(--primary, #C084FC);
        background: var(--bg-app, #FAF5FF);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--primary-light, rgba(126, 34, 206, 0.1));
      }

      .preset-item-card.is-selected {
        border-color: var(--primary, #7E22CE);
        background: var(--primary-light, #F3E8FF);
        box-shadow: 0 0 0 2px var(--primary-light, rgba(126, 34, 206, 0.25)), 0 6px 16px var(--primary-glow, rgba(126, 34, 206, 0.12));
      }

      .preset-active-banner {
        background: linear-gradient(135deg, var(--bg-app, #FAF5FF) 0%, var(--primary-light, #F3E8FF) 100%);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-left: 4px solid var(--primary, #7E22CE);
        border-radius: 16px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        animation: bannerFadeIn 0.25s ease-out;
      }

      @media (min-width: 640px) {
        .preset-active-banner {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }

      @keyframes bannerFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .custom-tokens-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: paneFadeIn 0.25s ease-out;
      }

      .preset-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .preset-emoji {
        font-size: 1.25rem;
      }

      .check-badge {
        font-size: 18px;
        color: var(--primary, #7E22CE);
      }

      .preset-name {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .preset-swatch-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin-top: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--card-border, rgba(233, 213, 255, 0.7));
      }

      .swatch-dot {
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* TOKEN CONTROLS & GRIDS                                          */
      /* ═══════════════════════════════════════════════════════════════ */
      .three-col-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      @media (min-width: 1024px) {
        .three-col-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .two-col-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      @media (min-width: 1024px) {
        .two-col-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1.5px solid var(--card-border, #F3E8FF);
      }

      .group-title {
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .token-input-box {
        padding: 0.75rem;
        border-radius: 12px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .token-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .token-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
      }

      .hex-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
      }

      .token-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .color-picker-input {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1.5px solid var(--card-border, #D8B4FE);
        background: transparent;
        cursor: pointer;
        padding: 2px;
      }

      .hex-text-input {
        flex: 1;
        height: 36px;
        padding: 0 0.75rem;
        border-radius: 10px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        color: var(--text-main, #2E1065);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 700;
        outline: none;
        transition: all 0.15s ease;
      }

      .hex-text-input:focus {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.15));
      }

      /* Sandbox */
      .sandbox-container {
        padding: 1.25rem;
        border-radius: 14px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .sandbox-container {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .mock-sidebar-card {
        padding: 1rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .mock-logo-text {
        font-weight: 900;
        font-size: 0.85rem;
      }

      .mock-hotkey-badge {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
      }

      .mock-action-card {
        padding: 1rem;
        background: #ffffff;
        border: 1.5px solid #E9D5FF;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mock-badges-card {
        padding: 1rem;
        background: #ffffff;
        border: 1.5px solid #E9D5FF;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: space-around;
      }

      .mini-status-badge {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 0.25rem 0.6rem;
        border-radius: 8px;
      }

      /* ═══════════════════════════════════════════════════════════════ */
      /* TAB 2: SUPER TOASTER INTERACTIVE VIEWPORT WIREFRAME            */
      /* ═══════════════════════════════════════════════════════════════ */
      .viewport-screen-frame {
        background: #0f172a;
        border: 3px solid #1e293b;
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 340px;
        box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.4);
        position: relative;
      }

      .screen-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #334155;
      }

      .screen-dots-group {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 9999px;
      }
      .dot-red { background: #ef4444; }
      .dot-amber { background: #f59e0b; }
      .dot-green { background: #10b981; }

      .screen-meta-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        color: #94a3b8;
        margin-left: 0.5rem;
      }

      .screen-res-tag {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        color: #64748b;
      }

      .positions-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        padding: 0.5rem 0;
      }

      .position-pad {
        padding: 0.875rem 1rem;
        border-radius: 12px;
        border: 1.5px solid #334155;
        background: rgba(30, 41, 59, 0.85);
        color: #cbd5e1;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.2s ease;
      }

      .position-pad:hover {
        border-color: #64748b;
        background: #334155;
        transform: translateY(-2px);
      }

      .position-pad.is-selected {
        border-color: #A855F7;
        background: rgba(126, 34, 206, 0.35);
        color: #ffffff;
        box-shadow: 0 0 0 2px #7E22CE, 0 8px 20px rgba(126, 34, 206, 0.4);
      }

      .pad-title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .pad-name {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.775rem;
        font-weight: 800;
      }

      .pad-subtext {
        font-size: 0.6875rem;
        color: #94a3b8;
        margin: 0;
      }

      .text-gold {
        color: #fde047;
        font-weight: 700;
      }

      .check-icon {
        font-size: 18px;
        color: #4ade80;
      }

      .pos-align-center {
        text-align: center;
        align-items: center;
      }

      .pos-align-right {
        text-align: right;
        align-items: flex-end;
      }

      .center-workspace-box {
        padding: 1.5rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mock-order-board {
        padding: 0.875rem 1.5rem;
        background: rgba(30, 41, 59, 0.5);
        border: 1px dashed #475569;
        border-radius: 12px;
        text-align: center;
      }

      .board-title {
        font-size: 0.75rem;
        font-weight: 800;
        color: #e2e8f0;
      }

      .board-desc {
        font-size: 0.6875rem;
        color: #94a3b8;
        margin-top: 0.2rem;
      }

      /* Five Controls Grid */
      .controls-five-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 0.875rem;
      }

      @media (min-width: 640px) {
        .controls-five-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .controls-five-grid {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      .control-box {
        padding: 0.875rem;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .control-label {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-main, #2E1065);
      }

      .control-input, .control-select, .control-textarea {
        width: 100%;
        height: 38px;
        padding: 0 0.75rem;
        border-radius: 10px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        color: var(--text-main, #2E1065);
        font-size: 0.775rem;
        font-weight: 600;
        outline: none;
        transition: all 0.15s ease;
      }

      .control-textarea {
        height: auto;
        padding: 0.5rem 0.75rem;
      }

      .control-input:focus, .control-select:focus, .control-textarea:focus {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.15));
      }

      .control-hint {
        font-size: 0.65rem;
        color: var(--primary, #8B5CF6);
        font-weight: 500;
      }

      /* Playground Card */
      .playground-card {
        padding: 1.25rem;
        border-radius: 16px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #D8B4FE);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .playground-header {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      @media (min-width: 640px) {
        .playground-header {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }

      .playground-icon-badge {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: var(--primary, #7E22CE);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px var(--primary-glow, rgba(126, 34, 206, 0.3));
      }

      .playground-title {
        font-size: 0.8125rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-main, #2E1065);
        margin: 0;
      }

      .playground-sub {
        font-size: 0.725rem;
        color: var(--text-muted, #6B7280);
        font-weight: 500;
        margin-top: 0.1rem;
      }

      .test-buttons-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      @media (min-width: 640px) {
        .test-buttons-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .test-buttons-grid {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      .btn-test {
        color: #ffffff;
        padding: 0.65rem 0.875rem;
        font-size: 0.75rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .btn-test-success { background: linear-gradient(135deg, #16a34a, #15803d); }
      .btn-test-error { background: linear-gradient(135deg, #dc2626, #b91c1c); }
      .btn-test-warning { background: linear-gradient(135deg, #ea580c, #c2410c); }
      .btn-test-info { background: linear-gradient(135deg, var(--primary, #7e22ce), var(--primary-hover, #6b21a8)); }
      .btn-test-loading { background: linear-gradient(135deg, #2563eb, #1d4ed8); }

      /* Form inputs in other tabs */
      .form-vertical-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .two-input-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.875rem;
      }


      /* Application branding - login image & favicon slots */
      .branding-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      @media (min-width: 768px) {
        .branding-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .branding-slot {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border: 1.5px solid var(--card-border, #F3E8FF);
        border-radius: 14px;
        background: var(--bg-app, #FAF5FF);
      }

      .branding-slot-head {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .branding-slot-title {
        font-size: 0.8125rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .branding-hint {
        font-size: 0.7rem;
        line-height: 1.35;
        color: var(--text-muted, #6B7280);
        font-weight: 500;
      }

      .branding-preview {
        height: 130px;
        border-radius: 12px;
        border: 1.5px dashed var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .branding-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* A logo or favicon is small - show it at icon size instead of stretching it. */
      .branding-preview.is-crest img {
        width: auto;
        height: 64px;
        object-fit: contain;
        image-rendering: crisp-edges;
      }

      .branding-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted, #9CA3AF);
      }

      .branding-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .sub-section-divider {
        padding-top: 0.875rem;
        border-top: 1.5px solid var(--card-border, #F3E8FF);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .sub-section-title {
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        color: var(--text-main, #2E1065);
      }

      .audio-toggle-card {
        padding: 1.25rem;
        border-radius: 14px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .audio-title {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .audio-sub {
        font-size: 0.7rem;
        color: var(--text-muted, #6B7280);
        margin-top: 0.15rem;
      }

      /* Helpers */
      .flex-align-center {
        display: flex;
        align-items: center;
      }

      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 0.75rem; }
      .justify-between { justify-content: space-between; }
      .justify-center { justify-content: center; }
      .ml-auto { margin-left: auto; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      .font-bold { font-weight: 700; }
      .text-purple { color: #7E22CE; }
      .spin-icon { animation: spin 1s linear infinite; }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  public settingsService = inject(SettingsService);
  public themeService = inject(ThemeService);
  public notify = inject(NotificationService);

  public activeTab: SettingsTab = 'theme';
  public settingsMap: Record<string, string> = {};
  public isSaving = false;
  public isLoading = false;
  public loadError: string | null = null;
  public presets = DEFAULT_THEME_PALETTES;
  public presetKeys = Object.keys(DEFAULT_THEME_PALETTES);
  public activePresetKey = 'purple';
  public showCustomFields = false;

  // Custom Dropdown Option Arrays
  public readonly toastMaxVisibleOptions: DropdownOption[] = [
    { value: '1', label: '1 Toast (Single Alert)', icon: 'looks_one', description: 'Displays 1 toast at a time' },
    { value: '3', label: '3 Toasts (Standard)', icon: 'looks_3', description: 'Recommended default toast stack' },
    { value: '5', label: '5 Toasts (Busy Terminal)', icon: 'looks_5', description: 'Displays up to 5 concurrent toasts' },
    { value: '8', label: '8 Toasts (High Volume)', icon: 'format_list_numbered', description: 'Maximum visible notification stack' },
  ];

  public readonly toastAnimationOptions: DropdownOption[] = [
    { value: 'slide', label: 'Slide In & Out', icon: 'swipe', description: 'Smooth lateral slide transition' },
    { value: 'fade', label: 'Smooth Fade', icon: 'blur_on', description: 'Gentle opacity fade in/out' },
    { value: 'bounce', label: 'Spring Bounce', icon: 'animation', description: 'Playful bouncy elastic curve' },
    { value: 'flip', label: '3D Card Flip', icon: 'flip', description: 'Modern 3D card rotation entrance' },
  ];

  public readonly toastShowCloseOptions: DropdownOption[] = [
    { value: 'true', label: 'Show Close Button', icon: 'close', description: 'Explicit dismiss button on toast card' },
    { value: 'false', label: 'Hide Close Button', icon: 'visibility_off', description: 'Minimalist clean card layout' },
  ];

  public readonly toastPauseHoverOptions: DropdownOption[] = [
    { value: 'true', label: 'Pause on Hover', icon: 'pause_circle', description: 'Timer freezes when hovering over toast' },
    { value: 'false', label: 'Do Not Pause', icon: 'play_circle', description: 'Toasts dismiss on fixed countdown' },
  ];

  public readonly taxCalculationOptions: DropdownOption[] = [
    { value: 'true', label: 'Tax Computation Enabled', icon: 'check_circle', description: 'Automatically calculate GST/Tax on orders' },
    { value: 'false', label: 'Tax Computation Disabled', icon: 'block', description: 'Prices are all-inclusive without extra tax' },
  ];

  public readonly negativeStockOptions: DropdownOption[] = [
    { value: 'false', label: 'Disallow Negative Stock (Strict)', icon: 'inventory_2', description: 'Blocks orders if stock reaches zero' },
    { value: 'true', label: 'Allow Negative Stock (Flexible)', icon: 'published_with_changes', description: 'Allows billing even if stock count is zero' },
  ];

  public readonly defaultOrderTypeOptions: DropdownOption[] = [
    { value: 'WALK_IN', label: 'Walk-In / Counter', icon: 'directions_walk', description: 'Fast takeaway & walk-in ordering' },
    { value: 'DINE_IN', label: 'Dine-In / Table Service', icon: 'table_restaurant', description: 'Table order management' },
    { value: 'TAKEAWAY', label: 'Takeaway / Parcel', icon: 'shopping_bag', description: 'Pack & parcel orders' },
    { value: 'DELIVERY', label: 'Home Delivery', icon: 'delivery_dining', description: 'Direct delivery orders' },
  ];

  public readonly paperWidthOptions: DropdownOption[] = [
    { value: '80mm', label: '80mm (Standard POS Thermal)', icon: 'receipt_long', description: 'Standard 3-inch thermal roll' },
    { value: '58mm', label: '58mm (Compact Mobile Printer)', icon: 'receipt', description: 'Compact 2-inch mini thermal roll' },
  ];

  public readonly showCustomerOptions: DropdownOption[] = [
    { value: 'true', label: 'Show Customer Info', icon: 'person', description: 'Prints customer name & phone on receipt' },
    { value: 'false', label: 'Hide Customer Info', icon: 'person_off', description: 'Compact receipt without customer header' },
  ];

  public readonly soundEffectsOptions: DropdownOption[] = [
    { value: 'true', label: 'Chimes Enabled', icon: 'volume_up', description: 'Audible feedback on checkout & billing' },
    { value: 'false', label: 'Muted / Silent', icon: 'volume_off', description: 'Completely silent operations' },
  ];

  /**
   * The two uploadable branding images. `settingKey` is where the stored URL
   * lands in `settingsMap`, and the limits mirror what the API accepts so a
   * rejected file is caught before it is read and posted.
   */
  public readonly brandingSlots: {
    key: BrandingSlotKey;
    settingKey: string;
    title: string;
    hint: string;
    icon: string;
    accept: string;
    maxMb: number;
  }[] = [
    {
      key: 'logo',
      settingKey: 'BRANDING_LOGO',
      title: 'Brand Logo',
      hint: 'Crest in the sidebar header and on the sign-in card. PNG, JPG, WEBP or GIF, up to 2 MB.',
      icon: 'storefront',
      accept: 'image/png,image/jpeg,image/webp,image/gif',
      maxMb: 2,
    },
    {
      key: 'login',
      settingKey: 'BRANDING_LOGIN_IMAGE',
      title: 'Login Image',
      hint: 'Artwork beside the sign-in form. PNG, JPG, WEBP or GIF, up to 5 MB.',
      icon: 'wallpaper',
      accept: 'image/png,image/jpeg,image/webp,image/gif',
      maxMb: 5,
    },
    {
      key: 'favicon',
      settingKey: 'BRANDING_FAVICON',
      title: 'Favicon',
      hint: 'Icon in the browser tab and window title bar. ICO or PNG, up to 1 MB.',
      icon: 'star',
      accept: 'image/x-icon,image/png,image/webp,image/gif,.ico',
      maxMb: 1,
    },
  ];

  /** Slot currently being uploaded, so its button can show progress. */
  public uploadingSlot: BrandingSlotKey | null = null;

  private brandingSlot(key: BrandingSlotKey) {
    return this.brandingSlots.find((slot) => slot.key === key)!;
  }

  /** Resolved URL of the configured image, or '' while the built-in one is in use. */
  public brandingPreview(key: BrandingSlotKey): string {
    return this.settingsService.assetUrl(this.settingsMap[this.brandingSlot(key).settingKey] || '');
  }

  /**
   * Uploads the picked file and remembers the returned URL. Nothing is applied
   * until Save Configuration writes it with the rest of the Store tab.
   */
  public onBrandingFile(event: Event, key: BrandingSlotKey, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared straight away, so picking the same file again after a failed
    // upload still fires a change event.
    picker.value = '';
    if (!file) return;

    const slot = this.brandingSlot(key);
    if (file.size > slot.maxMb * 1024 * 1024) {
      this.notify.error(
        `${slot.title} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${slot.maxMb} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.uploadingSlot = null;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.settingsService.uploadBrandingImage(key, String(reader.result)).subscribe({
        next: (res) => {
          this.uploadingSlot = null;
          if (res.success && res.data?.url) {
            this.settingsMap[slot.settingKey] = res.data.url;
            this.notify.success(`${slot.title} uploaded — save the configuration to apply it.`);
          } else {
            this.notify.error(res?.message || `Upload failed for ${slot.title}.`);
          }
        },
        error: (err) => {
          this.uploadingSlot = null;
          this.notify.error(err?.error?.message || `Upload failed for ${slot.title}.`);
        },
      });
    };

    this.uploadingSlot = key;
    reader.readAsDataURL(file);
  }

  /** Drops the configured image so the built-in one is used again. */
  public clearBranding(key: BrandingSlotKey): void {
    const slot = this.brandingSlot(key);
    this.settingsMap[slot.settingKey] = '';
    this.notify.info(`${slot.title} reset to the built-in image — save the configuration to apply it.`);
  }


  getActivePresetName(): string {
    if (this.activePresetKey === 'custom') return 'Custom Dynamic Palette';
    return this.presets[this.activePresetKey]?.name || 'Curated Palette';
  }

  openCustomThemeCard(): void {
    this.activePresetKey = 'custom';
    this.showCustomFields = true;
    this.notify.info('Custom Theme Editor active. Adjust color tokens below.');
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private flattenGroupedSettings(data: any): Record<string, string> {
    if (!data || typeof data !== 'object') return {};
    const flat: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !['system_theme', 'system_toast', 'system_business', 'system_hardware', 'system_branding'].includes(key)) {
        Object.assign(flat, this.flattenGroupedSettings(val));
      } else {
        flat[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    }

    // Unpack system_business JSON
    const rawBusiness = flat['system_business'] || flat['SYSTEM_BUSINESS'];
    if (rawBusiness) {
      try {
        const b = typeof rawBusiness === 'string' ? JSON.parse(rawBusiness) : rawBusiness;
        if (b && typeof b === 'object') {
          const name = b.restaurant_name || b.businessName || '';
          const phone = b.receipt_phone || b.businessPhone || '';
          const email = b.businessEmail || '';
          const address = b.receipt_address || b.businessAddress || '';
          const gstin = b.tax_identification_number || b.businessGstin || '';
          const currency = b.currency_symbol || b.currencySymbol || '₹';
          const taxRate = b.tax_rate_percentage !== undefined ? b.tax_rate_percentage : (b.taxPercentage !== undefined ? b.taxPercentage : 5);
          const header = b.receipt_header_title || b.receiptHeader || name;
          const tagline = b.receipt_tagline || b.receiptTagline || '';
          const footer = b.receipt_footer_note || b.receiptFooter || 'Thank you for dining with us! Come again.';

          flat['BUSINESS_NAME'] = name;
          flat['restaurant_name'] = name;
          flat['BUSINESS_PHONE'] = phone;
          flat['receipt_phone'] = phone;
          flat['BUSINESS_EMAIL'] = email;
          flat['BUSINESS_ADDRESS'] = address;
          flat['receipt_address'] = address;
          flat['BUSINESS_GSTIN'] = gstin;
          flat['tax_identification_number'] = gstin;
          flat['CURRENCY_SYMBOL'] = currency;
          flat['currency_symbol'] = currency;
          flat['TAX_PERCENTAGE'] = String(taxRate);
          flat['tax_rate_percentage'] = String(taxRate);
          flat['RECEIPT_HEADER'] = header;
          flat['receipt_header_title'] = header;
          flat['RECEIPT_TAGLINE'] = tagline;
          flat['receipt_tagline'] = tagline;
          flat['RECEIPT_FOOTER'] = footer;
          flat['receipt_footer_note'] = footer;
          if (b.taxEnabled !== undefined) flat['TAX_ENABLED'] = String(b.taxEnabled);
          if (b.taxName) flat['TAX_NAME'] = b.taxName;
          if (b.allowNegativeStock !== undefined) flat['POS_ALLOW_NEGATIVE_STOCK'] = String(b.allowNegativeStock);
          if (b.defaultOrderType) flat['POS_DEFAULT_ORDER_TYPE'] = b.defaultOrderType;
        }
      } catch (_) {}
    }


    // Unpack system_branding JSON
    const rawBranding = flat['system_branding'] || flat['SYSTEM_BRANDING'];
    if (rawBranding) {
      try {
        const br = typeof rawBranding === 'string' ? JSON.parse(rawBranding) : rawBranding;
        if (br && typeof br === 'object') {
          flat['BRANDING_LOGO'] = br.logo || '';
          flat['BRANDING_LOGIN_IMAGE'] = br.loginImage || '';
          flat['BRANDING_FAVICON'] = br.favicon || '';
          flat['BRANDING_APP_TITLE'] = br.appTitle || '';
        }
      } catch (_) {}
    }
    // Unpack system_hardware JSON
    const rawHardware = flat['system_hardware'] || flat['SYSTEM_HARDWARE'];
    if (rawHardware) {
      try {
        const h = typeof rawHardware === 'string' ? JSON.parse(rawHardware) : rawHardware;
        if (h && typeof h === 'object') {
          if (h.receiptHeader || h.receipt_header_title) {
            flat['RECEIPT_HEADER'] = h.receiptHeader || h.receipt_header_title;
            flat['receipt_header_title'] = flat['RECEIPT_HEADER'];
          }
          if (h.receiptFooter || h.receipt_footer_note) {
            flat['RECEIPT_FOOTER'] = h.receiptFooter || h.receipt_footer_note;
            flat['receipt_footer_note'] = flat['RECEIPT_FOOTER'];
          }
          if (h.receiptTagline || h.receipt_tagline) {
            flat['RECEIPT_TAGLINE'] = h.receiptTagline || h.receipt_tagline;
            flat['receipt_tagline'] = flat['RECEIPT_TAGLINE'];
          }
          if (h.receiptPaperWidth || h.thermal_printer_paper_width) {
            flat['RECEIPT_PAPER_WIDTH'] = h.receiptPaperWidth || h.thermal_printer_paper_width;
            flat['thermal_printer_paper_width'] = flat['RECEIPT_PAPER_WIDTH'];
          }
          if (h.receiptShowCustomer !== undefined) flat['RECEIPT_SHOW_CUSTOMER'] = String(h.receiptShowCustomer);
          if (h.posSoundEffects !== undefined) flat['POS_SOUND_EFFECTS'] = String(h.posSoundEffects);
        }
      } catch (_) {}
    }

    // Unpack system_toast JSON
    const rawToast = flat['system_toast'] || flat['SYSTEM_TOAST'];
    if (rawToast) {
      try {
        const t = typeof rawToast === 'string' ? JSON.parse(rawToast) : rawToast;
        if (t && typeof t === 'object') {
          if (t.position) flat['TOAST_POSITION'] = t.position;
          if (t.duration) flat['TOAST_DURATION'] = String(t.duration);
          if (t.maxVisible) flat['TOAST_MAX_VISIBLE'] = String(t.maxVisible);
          if (t.showClose !== undefined) flat['TOAST_SHOW_CLOSE'] = String(t.showClose);
          if (t.pauseOnHover !== undefined) flat['TOAST_PAUSE_HOVER'] = String(t.pauseOnHover);
          if (t.animation) flat['TOAST_ANIMATION'] = t.animation;
        }
      } catch (_) {}
    }

    return flat;
  }

  loadSettings(): void {
    this.isLoading = true;
    this.loadError = null;
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          // Flatten pure grouped category dictionary
          this.settingsMap = this.flattenGroupedSettings(res.data.map || res.data);
          // First sync from database map into ThemeService
          this.themeService.syncFromSettingsMap(this.settingsMap);
          // Then ensure settingsMap has updated values
          this.themeService.exportToSettingsMap(this.settingsMap);
          this.activePresetKey = this.themeService.activePresetKey();
          this.showCustomFields = (this.activePresetKey === 'custom');
          this.notify.syncFromSettingsMap(this.settingsMap);
        }
      },
      error: (err: any) => {
        // Settings fall back to the locally held theme so the page stays
        // operable, but the failure is still stated rather than looking like a
        // successful load of defaults.
        this.isLoading = false;
        this.loadError =
          err?.error?.message || 'Unable to load saved settings. Showing the currently applied values.';
        this.themeService.exportToSettingsMap(this.settingsMap);
        this.activePresetKey = this.themeService.activePresetKey();
        this.notify.exportToSettingsMap(this.settingsMap);
      },
    });
  }

  selectPreset(presetKey: string): void {
    this.activePresetKey = presetKey;
    this.showCustomFields = false;
    const preset = this.presets[presetKey];
    if (preset) {
      this.themeService.applyPreset(presetKey);
      this.themeService.exportToSettingsMap(this.settingsMap);
      this.notify.info(`Switched to ${preset.name}`);
    }
  }

  onColorChanged(key: keyof ThemePalette, hexValue: string): void {
    if (!hexValue) return;
    this.settingsMap['THEME_PRIMARY_COLOR'] = this.themeService.currentPalette().primary;
    this.themeService.updateSettingColor(key, hexValue);
    this.themeService.exportToSettingsMap(this.settingsMap);
    this.activePresetKey = 'custom';
    this.showCustomFields = true;
  }

  resetToDefaultTheme(): void {
    this.selectPreset('purple');
    this.showCustomFields = false;
    this.notify.success('Restored default Royal Purple palette!');
  }

  setToastPosition(pos: ToastPosition): void {
    this.settingsMap['TOAST_POSITION'] = pos;
    this.notify.updateConfig({ position: pos });
    this.notify.info(`Toast position updated to ${pos.replace('-', ' ').toUpperCase()}`);
  }

  onToastConfigChanged(): void {
    this.notify.syncFromSettingsMap(this.settingsMap);
  }

  testToast(type: 'success' | 'error' | 'warning' | 'info' | 'loading'): void {
    switch (type) {
      case 'success':
        this.notify.success('Order #1042 created successfully! KOT printed.');
        break;
      case 'error':
        this.notify.error('Unable to sync cloud order. Please check network connection.');
        break;
      case 'warning':
        this.notify.warning('Chicken Mandi is running low on stock (2 portions left).');
        break;
      case 'info':
        this.notify.info('POS database automated backup completed.');
        break;
      case 'loading':
        const id = this.notify.loading('Synchronizing table reservations and bills...');
        setTimeout(() => {
          this.notify.remove(id);
          this.notify.success('Table reservations synced successfully!');
        }, 3000);
        break;
    }
  }

  clearAllToasts(): void {
    this.notify.clearAll();
  }

  public getTabTitle(tab: SettingsTab): string {
    switch (tab) {
      case 'theme': return 'Brand Theme & UI Palette';
      case 'toast': return 'Super Toaster Notifications';
      case 'business': return 'Store & Tax Engine';
      case 'hardware': return 'Receipts & Hardware';
      default: return 'Settings';
    }
  }

  private getTabSettingsPayload(tab: SettingsTab): Record<string, any> {
    const payload: Record<string, any> = {};

    if (tab === 'theme') {
      const palette = this.themeService.currentPalette();
      const activeKey = this.themeService.activePresetKey();
      const themePayload = {
        activePresetKey: activeKey,
        theme: activeKey,
        primaryColor: palette.primary,
        primaryHover: palette.primaryHover,
        background: palette.bgApp,
        surface: palette.cardBg,
        text: palette.textMain,
        secondaryText: palette.sidebarText,
        border: palette.cardBorder,
        icon: palette.sidebarActiveAccent,
        logoUrl: this.settingsMap['logoUrl'] || this.settingsMap['THEME_LOGO_URL'] || '',
        favicon: this.settingsMap['favicon'] || this.settingsMap['THEME_FAVICON'] || '',
        ...palette,
      };
      payload['system_theme'] = JSON.stringify(themePayload);
    } else if (tab === 'toast') {
      const cfg = this.notify.config();
      const toastPayload = {
        position: this.settingsMap['TOAST_POSITION'] || cfg.position,
        duration: parseInt(this.settingsMap['TOAST_DURATION'], 10) || cfg.duration,
        maxVisible: parseInt(this.settingsMap['TOAST_MAX_VISIBLE'], 10) || cfg.maxVisible,
        showClose: this.settingsMap['TOAST_SHOW_CLOSE'] === 'true' || cfg.showCloseButton,
        pauseOnHover: this.settingsMap['TOAST_PAUSE_HOVER'] === 'true' || cfg.pauseOnHover,
        animation: this.settingsMap['TOAST_ANIMATION'] || cfg.animation,
      };
      payload['system_toast'] = JSON.stringify(toastPayload);
    } else if (tab === 'business') {
      const name = this.settingsMap['BUSINESS_NAME'] || this.settingsMap['restaurant_name'] || '';
      const phone = this.settingsMap['BUSINESS_PHONE'] || this.settingsMap['receipt_phone'] || '';
      const email = this.settingsMap['BUSINESS_EMAIL'] || '';
      const address = this.settingsMap['BUSINESS_ADDRESS'] || this.settingsMap['receipt_address'] || '';
      const gstin = this.settingsMap['BUSINESS_GSTIN'] || this.settingsMap['tax_identification_number'] || '';
      const currency = this.settingsMap['CURRENCY_SYMBOL'] || this.settingsMap['currency_symbol'] || '₹';
      const taxRate = Number(this.settingsMap['TAX_PERCENTAGE'] || this.settingsMap['tax_rate_percentage']) || 5;
      const header = this.settingsMap['RECEIPT_HEADER'] || this.settingsMap['receipt_header_title'] || name;
      const tagline = this.settingsMap['RECEIPT_TAGLINE'] || this.settingsMap['receipt_tagline'] || '';
      const footer = this.settingsMap['RECEIPT_FOOTER'] || this.settingsMap['receipt_footer_note'] || 'Thank you for dining with us! Come again.';

      const businessPayload = {
        restaurant_name: name,
        currency_symbol: currency,
        tax_rate_percentage: taxRate,
        tax_identification_number: gstin,
        receipt_header_title: header,
        receipt_tagline: tagline,
        receipt_footer_note: footer,
        receipt_phone: phone,
        receipt_address: address,

        businessName: name,
        businessPhone: phone,
        businessEmail: email,
        businessAddress: address,
        businessGstin: gstin,
        currencySymbol: currency,
        taxPercentage: taxRate,
        taxEnabled: String(this.settingsMap['TAX_ENABLED']) === 'true' ? 'true' : 'false',
        taxName: this.settingsMap['TAX_NAME'] || 'GST',
        allowNegativeStock: this.settingsMap['POS_ALLOW_NEGATIVE_STOCK'] === 'true' ? 'true' : 'false',
        defaultOrderType: this.settingsMap['POS_DEFAULT_ORDER_TYPE'] || 'WALK_IN',
      };
      payload['system_business'] = JSON.stringify(businessPayload);

      // Branding lives in its own key: saving system_business purges every
      // BUSINESS_%/TAX_% row, and the images have nothing to do with the receipt.
      payload['system_branding'] = JSON.stringify({
        logo: this.settingsMap['BRANDING_LOGO'] || '',
        loginImage: this.settingsMap['BRANDING_LOGIN_IMAGE'] || '',
        favicon: this.settingsMap['BRANDING_FAVICON'] || '',
        appTitle: this.settingsMap['BRANDING_APP_TITLE'] || '',
      });
    } else if (tab === 'hardware') {
      const hardwarePayload = {
        receipt_header_title: this.settingsMap['RECEIPT_HEADER'] || this.settingsMap['receipt_header_title'] || '',
        receipt_tagline: this.settingsMap['RECEIPT_TAGLINE'] || this.settingsMap['receipt_tagline'] || '',
        receipt_footer_note: this.settingsMap['RECEIPT_FOOTER'] || this.settingsMap['receipt_footer_note'] || '',
        thermal_printer_paper_width: this.settingsMap['RECEIPT_PAPER_WIDTH'] || '80mm',

        receiptHeader: this.settingsMap['RECEIPT_HEADER'] || '',
        receiptTagline: this.settingsMap['RECEIPT_TAGLINE'] || '',
        receiptFooter: this.settingsMap['RECEIPT_FOOTER'] || '',
        receiptPaperWidth: this.settingsMap['RECEIPT_PAPER_WIDTH'] || '80mm',
        receiptShowCustomer: this.settingsMap['RECEIPT_SHOW_CUSTOMER'] === 'false' ? 'false' : 'true',
        posSoundEffects: this.settingsMap['POS_SOUND_EFFECTS'] === 'false' ? 'false' : 'true',
      };
      payload['system_hardware'] = JSON.stringify(hardwarePayload);
    }

    return payload;
  }

  saveSettings(): void {
    this.isSaving = true;
    const tabPayload = this.getTabSettingsPayload(this.activeTab);

    this.settingsService.saveTabSettings(this.activeTab, tabPayload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.settingsMap = this.flattenGroupedSettings(res.data.map || res.data);
          this.themeService.syncFromSettingsMap(this.settingsMap);
          this.notify.syncFromSettingsMap(this.settingsMap);
        }
        const title = this.getTabTitle(this.activeTab);
        this.notify.success(`${title} settings saved successfully!`);
      },
      error: (err) => {
        this.isSaving = false;
        this.themeService.syncFromSettingsMap(this.settingsMap);
        this.notify.syncFromSettingsMap(this.settingsMap);
        const errorMsg = err?.error?.message || 'Server connection error';
        this.notify.error(`Failed to persist to database: ${errorMsg}`);
      },
    });
  }
}

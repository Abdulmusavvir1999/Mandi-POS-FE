import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService, ToastPosition } from '../../core/services/notification.service';
import { ThemeService, DEFAULT_THEME_PALETTES, ThemePalette } from '../../core/services/theme.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DragScrollDirective } from '../../shared/directives/drag-scroll.directive';
import { PosDesignPreviewComponent } from '../../shared/components/pos-design-preview/pos-design-preview.component';
import {
  CARDS_PER_ROW_MAX,
  CARDS_PER_ROW_MIN,
  PosDesignService,
  PosDesign,
  PosDesignKey,
  PosTokenKey,
  PosTokenMeta,
} from '../../core/services/pos-design.service';
import { DishLayoutPreviewComponent } from '../../shared/components/dish-layout-preview/dish-layout-preview.component';
import {
  DISH_COLUMNS_MAX,
  DISH_COLUMNS_MIN,
  DishLayoutService,
  DishLayoutKey,
  DishTokenGroup,
  DishTokenKey,
  DishTokenMeta,
} from '../../core/services/dish-layout.service';
import { DiningLayoutPreviewComponent } from '../../shared/components/dining-layout-preview/dining-layout-preview.component';
import {
  DiningLayoutService,
  DiningDesignKey,
  DiningTokenGroup,
  DiningTokenKey,
  DiningTokenMeta,
} from '../../core/services/dining-layout.service';
import { CategoryLayoutPreviewComponent } from '../../shared/components/category-layout-preview/category-layout-preview.component';
import {
  CategoryLayoutService,
  CategoryDesignKey,
  CategoryTokenGroup,
  CategoryTokenKey,
  CategoryTokenMeta,
  CATEGORY_DESIGN_OPTIONS,
  CATEGORY_TOKEN_META,
} from '../../core/services/category-layout.service';
import { StockLayoutPreviewComponent } from '../../shared/components/stock-layout-preview/stock-layout-preview.component';
import {
  StockLayoutService,
  StockDesignKey,
  StockTokenGroup,
  StockTokenKey,
  StockTokenMeta,
  STOCK_DESIGN_OPTIONS,
  STOCK_TOKEN_META,
} from '../../core/services/stock-layout.service';
import { CustomerLayoutPreviewComponent } from '../../shared/components/customer-layout-preview/customer-layout-preview.component';
import {
  CustomerLayoutService,
  CustomerDesignKey,
  CustomerTokenGroup,
  CustomerTokenKey,
  CustomerTokenMeta,
  CUSTOMER_DESIGN_OPTIONS,
  CUSTOMER_TOKEN_META,
} from '../../core/services/customer-layout.service';
import { StaffLayoutPreviewComponent } from '../../shared/components/staff-layout-preview/staff-layout-preview.component';
import {
  StaffLayoutService,
  StaffDesignKey,
  StaffTokenGroup,
  StaffTokenKey,
  StaffTokenMeta,
  STAFF_DESIGN_OPTIONS,
  STAFF_TOKEN_META,
} from '../../core/services/staff-layout.service';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

type SettingsTab = 'theme' | 'toast' | 'business' | 'hardware' | 'posdesign' | 'dishpage' | 'dining' | 'categorydesign' | 'stockdesign' | 'customerdesign' | 'staffdesign' | 'sidebardesign';

/** Branding images that can be replaced from the Store tab. */
import { SidebarLayoutPreviewComponent } from '../../shared/components/sidebar-layout-preview/sidebar-layout-preview.component';
import {
  SidebarLayoutService,
  SidebarTemplateKey,
  SidebarTokenGroup,
  SidebarTokenKey,
  SidebarTokenMeta,
  SIDEBAR_TEMPLATE_OPTIONS,
  SIDEBAR_TOKEN_META,
} from '../../core/services/sidebar-layout.service';

type BrandingSlotKey = 'logo' | 'login' | 'favicon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomDropdownComponent,
    PageLoaderComponent,
    PosDesignPreviewComponent,
    DishLayoutPreviewComponent,
    DiningLayoutPreviewComponent,
    CategoryLayoutPreviewComponent,
    StockLayoutPreviewComponent,
    CustomerLayoutPreviewComponent,
    StaffLayoutPreviewComponent,
    SidebarLayoutPreviewComponent,
    DragScrollDirective,
  ],
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
      <!-- The tab row outgrows its width once every customize tab is in, so it
           scrolls: natively by touch, by drag with a mouse, and by these arrows,
           which hide themselves when nothing overflows. -->
      <div class="tab-scroll-shell">
        <button
          type="button"
          class="tab-scroll-arrow prev"
          [class.is-hidden]="!tabRail.canScroll"
          [disabled]="!tabRail.canScrollLeft"
          (click)="tabRail.step(-300)"
          aria-label="Scroll tabs left"
          title="Scroll tabs left"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <div class="tab-nav-bar" appDragScroll #tabRail="dragScroll">
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

          <button
            type="button"
            (click)="activeTab = 'posdesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'posdesign'"
          >
            <span class="material-symbols-outlined">dashboard_customize</span>
            <span>POS Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'dishpage'"
            class="tab-btn"
            [class.is-active]="activeTab === 'dishpage'"
          >
            <span class="material-symbols-outlined">view_quilt</span>
            <span>Catalog Page Design</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'dining'"
            class="tab-btn"
            [class.is-active]="activeTab === 'dining'"
          >
            <span class="material-symbols-outlined">table_restaurant</span>
            <span>Dining Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'categorydesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'categorydesign'"
          >
            <span class="material-symbols-outlined">category</span>
            <span>Category Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'stockdesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'stockdesign'"
          >
            <span class="material-symbols-outlined">warehouse</span>
            <span>Stock Ledger Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'customerdesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'customerdesign'"
          >
            <span class="material-symbols-outlined">badge</span>
            <span>Customer Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'staffdesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'staffdesign'"
          >
            <span class="material-symbols-outlined">admin_panel_settings</span>
            <span>Staff &amp; Roles Customize</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'sidebardesign'"
            class="tab-btn"
            [class.is-active]="activeTab === 'sidebardesign'"
          >
            <span class="material-symbols-outlined">left_panel_open</span>
            <span>Sidebar Template</span>
          </button>
        </div>

        <button
          type="button"
          class="tab-scroll-arrow next"
          [class.is-hidden]="!tabRail.canScroll"
          [disabled]="!tabRail.canScrollRight"
          (click)="tabRail.step(300)"
          aria-label="Scroll tabs right"
          title="Scroll tabs right"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- POS DESIGN PREVIEW (sample dishes, read-only)                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="previewDesignKey" (click)="closePosPreview()">
        <div class="modal-content p-6 max-w-4xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined">visibility</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">
                  {{ previewDesignName }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">
                  One row at {{ posDesign.cardsPerRow() }} per row, with your current colours
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="closePosPreview()"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <app-pos-design-preview
            *ngIf="previewDesignKey"
            [designKey]="previewDesignKey!"
            [cssVars]="posDesign.cssVars(previewDesignKey!)"
            [cardsPerRow]="posDesign.cardsPerRow()"
          ></app-pos-design-preview>

          <div class="flex items-center justify-end gap-3 pt-5 mt-1 border-t border-[#E9D5FF]">
            <button type="button" (click)="closePosPreview()" class="action-btn btn-outline-purple">
              Close
            </button>
            <button
              type="button"
              *ngIf="posDesign.activeKey() !== previewDesignKey"
              (click)="useAndClosePosPreview()"
              class="action-btn btn-gradient-purple"
            >
              <span class="material-symbols-outlined">check</span>
              <span>Use this design</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DISH PAGE DESIGN PREVIEW (sample dishes, read-only)             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="previewLayoutKey" (click)="closeDishPreview()">
        <div class="modal-content p-6 max-w-5xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined">visibility</span>
              </span>
              <div>
                <h3 class="text-lg font-black text-[#2E1065] leading-tight">
                  {{ previewLayoutName }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">
                  {{ previewLayoutHint }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="closeDishPreview()"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <app-dish-layout-preview
            *ngIf="previewLayoutKey"
            [layoutKey]="previewLayoutKey!"
            [cssVars]="dishLayout.cssVars(previewLayoutKey!)"
            [columnsPerRow]="dishLayout.columnsPerRow()"
          ></app-dish-layout-preview>

          <div class="flex items-center justify-end gap-3 pt-5 mt-1 border-t border-[#E9D5FF]">
            <button type="button" (click)="closeDishPreview()" class="action-btn btn-outline-purple">
              Close
            </button>
            <button
              type="button"
              *ngIf="!dishLayout.enabled() || dishLayout.activeKey() !== previewLayoutKey"
              (click)="useAndCloseDishPreview()"
              class="action-btn btn-gradient-purple"
            >
              <span class="material-symbols-outlined">check</span>
              <span>Use this design</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 5: POS CUSTOMIZE                                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'posdesign'" class="tab-content-pane">
        <!-- Template chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">grid_view</span>
              <div>
                <h2 class="card-title">POS Dish Card Design</h2>
                <p class="card-subtitle">
                  Pick the layout the POS billing grid uses. Each one ships with the palette
                  from its reference artwork and can be recoloured below.
                </p>
              </div>
            </div>
          </div>

          <div class="design-grid">
            <button
              *ngFor="let d of posDesign.designs"
              type="button"
              class="design-card"
              [class.is-selected]="posDesign.activeKey() === d.key"
              (click)="posDesign.selectDesign(d.key)"
              [attr.aria-pressed]="posDesign.activeKey() === d.key"
            >
              <!-- Live preview: same tokens the POS renders, so edits show here -->
              <div class="design-preview" [ngClass]="'preview-' + d.key" [ngStyle]="posDesign.cssVars(d.key)">
                <div class="preview-card" *ngFor="let n of [1, 2, 3]" [attr.data-i]="n">
                  <div class="preview-art"><span class="preview-glyph">🍽</span></div>
                  <div class="preview-body">
                    <span class="preview-title"></span>
                    <span class="preview-line"></span>
                    <span class="preview-price"></span>
                    <span class="preview-btn"></span>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">{{ d.name }}</span>
                  <div class="design-name-actions">
                    <!-- A button inside a button is invalid, so this is a span
                         acting as one; the card's own click is stopped here. -->
                    <span
                      class="design-preview-btn"
                      role="button"
                      tabindex="0"
                      (click)="openPosPreview(d.key, $event)"
                      (keydown.enter)="openPosPreview(d.key, $event)"
                      (keydown.space)="openPosPreview(d.key, $event)"
                      title="Preview with sample dishes"
                    >
                      <span class="material-symbols-outlined">visibility</span>
                      <span>Preview</span>
                    </span>
                    <span class="design-check" *ngIf="posDesign.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <p class="design-blurb">{{ d.blurb }}</p>
              </div>
            </button>
          </div>

          <!-- Grid density -->
          <div class="density-row">
            <div class="density-copy">
              <label class="form-label" for="cardsPerRow">Products per row</label>
              <p class="form-hint">
                How many dish cards the billing grid fits across on a desktop till.
                Tablets and phones keep their own narrower layout.
              </p>
            </div>
            <div class="density-input">
              <input
                id="cardsPerRow"
                type="number"
                [min]="cardsPerRowMin"
                [max]="cardsPerRowMax"
                step="1"
                class="form-control font-mono font-bold text-sm"
                [value]="posDesign.cardsPerRow()"
                (change)="onCardsPerRowInput($event)"
                title="Products per row"
              />
              <span class="density-unit">per row</span>
            </div>
          </div>
        </div>

        <!-- Token editor for whichever design is selected -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">palette</span>
              <div>
                <h2 class="card-title">Customize “{{ posDesign.activeDesign().name }}”</h2>
                <p class="card-subtitle">
                  Every colour this design uses. Changes appear in the preview above
                  immediately; press Save to apply them to the POS.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-3 !text-xs"
                (click)="openPosPreview(posDesign.activeKey(), $event)"
              >
                <span class="material-symbols-outlined">visibility</span>
                <span>Preview</span>
              </button>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetPosDesign()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to design default</span>
              </button>
            </div>
          </div>

          <div *ngFor="let group of posTokenGroups" class="token-group">
            <h3 class="token-group-title">{{ group }}</h3>
            <div class="token-grid">
              <div *ngFor="let meta of posTokensIn(group)" class="token-field">
                <label class="form-label">{{ meta.label }}</label>

                <!-- Sizes: a slider to feel it, a number box to be exact. -->
                <div class="token-input-row" *ngIf="meta.kind === 'size'">
                  <input
                    type="range"
                    class="token-range"
                    [min]="meta.min"
                    [max]="meta.max"
                    [step]="meta.step"
                    [value]="posSizeValue(meta.key)"
                    (input)="onPosSizeInput(meta.key, $event)"
                    [title]="meta.label"
                  />
                  <input
                    type="number"
                    class="form-control font-mono text-xs token-size-box"
                    [min]="meta.min"
                    [max]="meta.max"
                    [step]="meta.step"
                    [value]="posSizeValue(meta.key)"
                    (change)="onPosSizeInput(meta.key, $event)"
                    [title]="meta.label + ' in rem'"
                  />
                  <span class="token-unit">rem</span>
                </div>

                <div class="token-input-row" *ngIf="meta.kind !== 'size'">
                  <input
                    type="color"
                    class="token-swatch"
                    [value]="posTokenValue(meta.key)"
                    (input)="onPosTokenInput(meta.key, $event)"
                    [title]="meta.label"
                  />
                  <input
                    type="text"
                    class="form-control font-mono text-xs"
                    [value]="posTokenValue(meta.key)"
                    (change)="onPosTokenInput(meta.key, $event)"
                    [title]="meta.label + ' hex value'"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 6: DISH PAGE DESIGN                                         -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'dishpage'" class="tab-content-pane">
        <!-- Design chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">view_quilt</span>
              <div>
                <h2 class="card-title">Catalog Page Design</h2>
                <p class="card-subtitle">
                  How <strong>Products &amp; Menu Catalog</strong> lists your dishes: the shape
                  of the grid and which details each dish shows. Each design ships with its own
                  palette and can be recoloured below.
                </p>
              </div>
            </div>
            <label class="switch-row" title="Drive the catalog listing with this setting">
              <input
                type="checkbox"
                [checked]="dishLayout.enabled()"
                (change)="onDishEnabledToggle($event)"
              />
              <span class="switch-track"><span class="switch-knob"></span></span>
              <span class="switch-label">{{ dishLayout.enabled() ? 'On' : 'Off' }}</span>
            </label>
          </div>

          <div *ngIf="!dishLayout.enabled()" class="design-override-note is-muted">
            <span class="material-symbols-outlined">lightbulb</span>
            <p>
              While this is off the catalog keeps its current data table. Picking any design
              below switches it on.
            </p>
          </div>

          <div class="design-grid is-five">
            <button
              *ngFor="let l of dishLayout.layouts"
              type="button"
              class="design-card"
              [class.is-selected]="dishLayout.enabled() && dishLayout.activeKey() === l.key"
              (click)="dishLayout.selectLayout(l.key)"
              [attr.aria-pressed]="dishLayout.enabled() && dishLayout.activeKey() === l.key"
            >
              <!-- Miniature of the real thing: same tokens the POS renders, so
                   recolouring shows up here immediately. -->
              <div
                class="layout-preview"
                [ngClass]="'lp-' + l.key"
                [ngStyle]="dishLayout.cssVars(l.key)"
              >
                <div class="lp-tile" *ngFor="let n of [1, 2, 3, 4]" [attr.data-i]="n">
                  <div class="lp-art"><span class="lp-glyph">🍽</span></div>
                  <div class="lp-body">
                    <span class="lp-kicker"></span>
                    <span class="lp-title"></span>
                    <span class="lp-line"></span>
                    <span class="lp-price"></span>
                    <span class="lp-btn"></span>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">{{ l.icon }}</span>
                    {{ l.name }}
                  </span>
                  <div class="design-name-actions">
                    <!-- A button inside a button is invalid, so this is a span
                         acting as one; the card's own click is stopped here. -->
                    <span
                      class="design-preview-btn"
                      role="button"
                      tabindex="0"
                      (click)="openDishPreview(l.key, $event)"
                      (keydown.enter)="openDishPreview(l.key, $event)"
                      (keydown.space)="openDishPreview(l.key, $event)"
                      title="Preview with sample dishes"
                    >
                      <span class="material-symbols-outlined">visibility</span>
                      <span>Preview</span>
                    </span>
                    <span
                      class="design-check"
                      *ngIf="dishLayout.enabled() && dishLayout.activeKey() === l.key"
                    >
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <p class="design-blurb">{{ l.blurb }}</p>
              </div>
            </button>
          </div>

          <!-- Grid density. Hidden for designs that have no columns to set. -->
          <div class="density-row" *ngIf="dishLayout.activeLayout().usesColumns">
            <div class="density-copy">
              <label class="form-label" for="dishColumns">Dishes per row</label>
              <p class="form-hint">
                How many dishes the catalog fits across on a desktop screen. Tablets and
                phones keep their own narrower layout.
              </p>
            </div>
            <div class="density-input">
              <input
                id="dishColumns"
                type="number"
                [min]="dishColumnsMin"
                [max]="dishColumnsMax"
                step="1"
                class="form-control font-mono font-bold text-sm"
                [value]="dishLayout.columnsPerRow()"
                (change)="onDishColumnsInput($event)"
                title="Dishes per row"
              />
              <span class="density-unit">per row</span>
            </div>
          </div>

          <div class="density-row" *ngIf="!dishLayout.activeLayout().usesColumns">
            <div class="density-copy">
              <label class="form-label">Dishes per row</label>
              <p class="form-hint">
                {{ dishLayout.activeLayout().name }} puts one dish on each line, so there is no
                column count to set.
              </p>
            </div>
          </div>
        </div>

        <!-- Token editor for whichever design is selected -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">palette</span>
              <div>
                <h2 class="card-title">Customize “{{ dishLayout.activeLayout().name }}”</h2>
                <p class="card-subtitle">
                  Every colour this design uses. Changes appear in the previews above
                  immediately; press Save to apply them to the POS.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-3 !text-xs"
                (click)="openDishPreview(dishLayout.activeKey(), $event)"
              >
                <span class="material-symbols-outlined">visibility</span>
                <span>Preview</span>
              </button>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetDishLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to design default</span>
              </button>
            </div>
          </div>

          <!-- A group with no tokens for this design is skipped entirely, so
               the table chrome never shows up under a card design. -->
          <ng-container *ngFor="let group of dishLayout.tokenGroups">
            <div *ngIf="dishTokensIn(group).length" class="token-group">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of dishTokensIn(group)" class="token-field">
                  <label class="form-label">{{ meta.label }}</label>
                  <div class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="dishTokenSwatch(meta.key)"
                      (input)="onDishTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="dishTokenValue(meta.key)"
                      (change)="onDishTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 7: DINING CUSTOMIZE                                         -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'dining'" class="tab-content-pane">
        <!-- Design Chooser Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">table_restaurant</span>
              <div>
                <h2 class="card-title">Dining Page Floor Designs</h2>
                <p class="card-subtitle">
                  Select from five floor plan designs: three faithful recreations from reference artwork,
                  plus executive List View and Card List View.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetDiningLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset Design</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- 5 Design Option Cards Grid -->
          <div class="design-grid is-five">
            <button
              *ngFor="let d of diningLayout.designs"
              type="button"
              class="design-card"
              [class.is-selected]="diningLayout.activeKey() === d.key"
              (click)="diningLayout.selectDesign(d.key)"
              [attr.aria-pressed]="diningLayout.activeKey() === d.key"
            >
              <!-- Mini Graphic Thumbnail representing each design -->
              <div class="dining-mini-thumb" [ngClass]="'thumb-' + d.key" [ngStyle]="diningLayout.cssVars(d.key)">
                <!-- Checkered Thumbnail -->
                <div *ngIf="d.key === 'checkered'" class="thumb-checkered-wrap">
                  <div class="thumb-chk-round">
                    <span class="thumb-chk-arc"></span>
                    <span class="thumb-chk-code">T-03</span>
                  </div>
                  <div class="thumb-chk-banquet">
                    <span class="thumb-chk-diamond"></span>
                    <span class="thumb-chk-code-sm">T-01</span>
                  </div>
                  <div class="thumb-chk-square">
                    <span class="thumb-chk-stripe"></span>
                    <span class="thumb-chk-code">T-07</span>
                  </div>
                </div>

                <!-- Neumorphic Thumbnail -->
                <div *ngIf="d.key === 'neumorphic'" class="thumb-neumorphic-wrap">
                  <div class="thumb-neu-card neu-a1">
                    <span class="thumb-neu-pill neu-p-top"></span>
                    <span class="thumb-neu-badge badge-dark">A1</span>
                    <span class="thumb-neu-pill neu-p-bot"></span>
                  </div>
                  <div class="thumb-neu-card neu-a2">
                    <span class="thumb-neu-pill neu-p-top"></span>
                    <span class="thumb-neu-badge badge-red">A2</span>
                    <span class="thumb-neu-pill neu-p-bot"></span>
                  </div>
                  <div class="thumb-neu-card neu-a3">
                    <span class="thumb-neu-pill neu-p-top"></span>
                    <span class="thumb-neu-badge badge-blue">A3</span>
                    <span class="thumb-neu-pill neu-p-bot"></span>
                  </div>
                </div>

                <!-- Illustrated Thumbnail -->
                <div *ngIf="d.key === 'illustrated'" class="thumb-illustrated-wrap">
                  <div class="thumb-ill-card ill-mint">
                    <span class="thumb-ill-title">Table #1</span>
                    <span class="thumb-ill-cap">👥 6</span>
                  </div>
                  <div class="thumb-ill-card ill-pink">
                    <span class="thumb-ill-title">Table #2</span>
                    <span class="thumb-ill-cap">👥 2</span>
                  </div>
                  <div class="thumb-ill-card ill-lavender">
                    <span class="thumb-ill-title">Table #5</span>
                    <span class="thumb-ill-cap">👥 0</span>
                  </div>
                </div>

                <!-- List View Thumbnail -->
                <div *ngIf="d.key === 'list'" class="thumb-list-wrap">
                  <div class="thumb-list-row">
                    <span class="thumb-list-code">T-01</span>
                    <span class="thumb-list-bar"></span>
                    <span class="thumb-list-pill is-busy"></span>
                  </div>
                  <div class="thumb-list-row">
                    <span class="thumb-list-code">T-02</span>
                    <span class="thumb-list-bar"></span>
                    <span class="thumb-list-pill is-free"></span>
                  </div>
                  <div class="thumb-list-row">
                    <span class="thumb-list-code">T-03</span>
                    <span class="thumb-list-bar"></span>
                    <span class="thumb-list-pill is-blocked"></span>
                  </div>
                </div>

                <!-- Card List View Thumbnail -->
                <div *ngIf="d.key === 'cardlist'" class="thumb-cardlist-wrap">
                  <div class="thumb-cardlist-item">
                    <span class="thumb-cl-badge is-busy">T-01</span>
                    <div class="thumb-cl-body">
                      <span class="thumb-cl-line w-16"></span>
                      <span class="thumb-cl-dwell"></span>
                    </div>
                  </div>
                  <div class="thumb-cardlist-item">
                    <span class="thumb-cl-badge is-free">T-02</span>
                    <div class="thumb-cl-body">
                      <span class="thumb-cl-line w-12"></span>
                      <span class="thumb-cl-dwell"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">{{ d.icon }}</span>
                    {{ d.name }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="diningLayout.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-0.5">
                  {{ d.badge }}
                </div>
                <p class="design-blurb mt-1">{{ d.blurb }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ diningLayout.activeDesign().name }}</h2>
                <p class="card-subtitle">
                  Accurate live representation of the dining floor. All changes to colors, scale,
                  and spacing are rendered in real time.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag !bg-emerald-50 !text-emerald-700 !border-emerald-200">
                <span class="swatch-dot !bg-emerald-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-dining-layout-preview
              [layoutKey]="diningLayout.activeKey()"
              [cssVars]="diningLayout.cssVars(diningLayout.activeKey())"
            ></app-dining-layout-preview>
          </div>
        </div>

        <!-- Visual Token Customization Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">tune</span>
              <div>
                <h2 class="card-title">Customize “{{ diningLayout.activeDesign().name }}”</h2>
                <p class="card-subtitle">
                  Adjust colors, sizing, spacing, and typography. Each design maintains its own
                  saved customizations independently.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetDiningLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Token Groups -->
          <ng-container *ngFor="let group of diningLayout.tokenGroups">
            <div class="token-group" *ngIf="diningTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of diningTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span *ngIf="meta.type === 'range'" class="font-mono text-xs font-bold text-purple-700">
                      {{ diningTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>

                  <!-- Color Input -->
                  <div *ngIf="meta.type === 'color'" class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="diningTokenSwatch(meta.key)"
                      (input)="onDiningTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="diningTokenValue(meta.key)"
                      (change)="onDiningTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>

                  <!-- Range Slider Input -->
                  <div *ngIf="meta.type === 'range'" class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-purple-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="diningTokenValue(meta.key)"
                      (input)="onDiningTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect immediately on the actual Dining page once saved.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetDiningLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Dining Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 8: CATEGORY CUSTOMIZE                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'categorydesign'" class="tab-content-pane">
        <!-- Five Category Page Designs Chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Category Page Layout Designs</h2>
              <p class="card-subtitle">
                Select from five distinct category directory styles. Each layout has unique cards, metrics, and visual hierarchy.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                Active: <strong>{{ getCategoryDesignLabel(categoryLayout.activeKey()) }}</strong>
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                (click)="resetCategoryLayout()"
                title="Reset layout overrides"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- Five Design Cards Grid -->
          <div class="design-grid is-five">
            <button
              *ngFor="let d of categoryDesigns"
              type="button"
              class="design-card"
              [class.is-selected]="categoryLayout.activeKey() === d.key"
              (click)="categoryLayout.setActiveDesign(d.key)"
              [attr.aria-pressed]="categoryLayout.activeKey() === d.key"
            >
              <!-- Mini Graphic Thumbnail -->
              <div class="category-mini-thumb" [ngClass]="'thumb-cat-' + d.key">
                <!-- Showcase Thumbnail -->
                <div *ngIf="d.key === 'showcase'" class="thumb-cat-showcase-wrap">
                  <div class="thumb-cat-sc-card">
                    <div class="thumb-cat-sc-head">
                      <span class="thumb-cat-sc-icon">☕</span>
                      <span class="thumb-cat-sc-pill">32 items</span>
                    </div>
                    <div class="thumb-cat-sc-line"></div>
                    <div class="thumb-cat-sc-sub"></div>
                  </div>
                </div>

                <!-- Clean Table Thumbnail -->
                <div *ngIf="d.key === 'clean'" class="thumb-cat-clean-wrap">
                  <div class="thumb-cat-clean-row">
                    <span class="thumb-cat-seq">#1</span>
                    <span class="thumb-cat-bar w-14"></span>
                    <span class="thumb-cat-metric">32</span>
                  </div>
                  <div class="thumb-cat-clean-row">
                    <span class="thumb-cat-seq">#2</span>
                    <span class="thumb-cat-bar w-10"></span>
                    <span class="thumb-cat-metric">18</span>
                  </div>
                </div>

                <!-- Compact Badge Tiles Thumbnail -->
                <div *ngIf="d.key === 'compact'" class="thumb-cat-compact-wrap">
                  <div class="thumb-cat-compact-tile">
                    <span class="thumb-cat-c-icon">🍕</span>
                    <span class="thumb-cat-c-dot"></span>
                  </div>
                  <div class="thumb-cat-compact-tile">
                    <span class="thumb-cat-c-icon">🍔</span>
                    <span class="thumb-cat-c-dot"></span>
                  </div>
                </div>

                <!-- List View Thumbnail -->
                <div *ngIf="d.key === 'list'" class="thumb-cat-list-wrap">
                  <div class="thumb-cat-list-row">
                    <span class="thumb-cat-dot"></span>
                    <span class="thumb-cat-bar w-16"></span>
                    <span class="thumb-cat-tag">Active</span>
                  </div>
                  <div class="thumb-cat-list-row">
                    <span class="thumb-cat-dot"></span>
                    <span class="thumb-cat-bar w-12"></span>
                    <span class="thumb-cat-tag">Active</span>
                  </div>
                </div>

                <!-- Card View Thumbnail -->
                <div *ngIf="d.key === 'card'" class="thumb-cat-card-wrap">
                  <div class="thumb-cat-exec-card">
                    <div class="thumb-cat-banner"></div>
                    <div class="thumb-cat-exec-body">
                      <span class="thumb-cat-bar w-12"></span>
                      <span class="thumb-cat-progress"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">category</span>
                    {{ d.label }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="categoryLayout.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-0.5">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb mt-1">{{ d.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ getCategoryDesignLabel(categoryLayout.activeKey()) }}</h2>
                <p class="card-subtitle">
                  Accurate live representation of the Category page. All adjustments to colors, scale, and metrics are rendered in real time.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag !bg-purple-50 !text-purple-700 !border-purple-200">
                <span class="swatch-dot !bg-purple-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-category-layout-preview
              [layoutKey]="categoryLayout.activeKey()"
              [cssVars]="categoryLayout.cssVars()"
            ></app-category-layout-preview>
          </div>
        </div>

        <!-- Visual Token Customization Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">tune</span>
              <div>
                <h2 class="card-title">Customize “{{ getCategoryDesignLabel(categoryLayout.activeKey()) }}”</h2>
                <p class="card-subtitle">
                  Fine-tune colors, cards, borders, typography, and spacing metrics. Each design retains its own independent values.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetCategoryLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Category Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Token Groups -->
          <ng-container *ngFor="let group of categoryTokenGroups">
            <div class="token-group" *ngIf="categoryTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of categoryTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span *ngIf="meta.type === 'range'" class="font-mono text-xs font-bold text-purple-700">
                      {{ categoryTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>

                  <!-- Color Input -->
                  <div *ngIf="meta.type === 'color'" class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="categoryTokenSwatch(meta.key)"
                      (input)="onCategoryTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="categoryTokenValue(meta.key)"
                      (change)="onCategoryTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>

                  <!-- Range Slider Input -->
                  <div *ngIf="meta.type === 'range'" class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-purple-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="categoryTokenValue(meta.key)"
                      (input)="onCategoryTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect immediately on the actual Category page once saved.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetCategoryLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Category Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 9: STOCK LEDGER CUSTOMIZE                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'stockdesign'" class="tab-content-pane">
        <!-- Five Stock Ledger Page Designs Chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Stock Ledger Page Layout Designs</h2>
              <p class="card-subtitle">
                Select from five distinct inventory styles. Choose the optimal layout for your warehouse, stock auditing, or executive tracking.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                Active: <strong>{{ getStockDesignLabel(stockLayout.activeKey()) }}</strong>
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                (click)="resetStockLayout()"
                title="Reset layout overrides"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- Five Design Cards Grid -->
          <div class="design-grid is-five">
            <button
              *ngFor="let d of stockDesigns"
              type="button"
              class="design-card"
              [class.is-selected]="stockLayout.activeKey() === d.key"
              (click)="stockLayout.setActiveDesign(d.key)"
              [attr.aria-pressed]="stockLayout.activeKey() === d.key"
            >
              <!-- Mini Graphic Thumbnail -->
              <div class="stock-mini-thumb" [ngClass]="'thumb-stk-' + d.key">
                <!-- Warehouse Thumbnail -->
                <div *ngIf="d.key === 'warehouse'" class="thumb-stk-wh-wrap">
                  <div class="thumb-stk-wh-card">
                    <div class="thumb-stk-wh-head">
                      <span class="thumb-stk-sku">STK-01</span>
                      <span class="thumb-stk-dot-green"></span>
                    </div>
                    <div class="thumb-stk-bar-bg">
                      <span class="thumb-stk-bar-green w-14"></span>
                    </div>
                    <div class="thumb-stk-chips">
                      <span class="thumb-stk-val">$682</span>
                      <span class="thumb-stk-unit">kg</span>
                    </div>
                  </div>
                </div>

                <!-- Financial Ledger Thumbnail -->
                <div *ngIf="d.key === 'financial'" class="thumb-stk-fin-wrap">
                  <div class="thumb-stk-fin-row">
                    <span class="thumb-stk-sku-sm">#01</span>
                    <span class="thumb-stk-line w-12"></span>
                    <span class="thumb-stk-val-sm">$450</span>
                  </div>
                  <div class="thumb-stk-fin-row">
                    <span class="thumb-stk-sku-sm">#02</span>
                    <span class="thumb-stk-line w-8"></span>
                    <span class="thumb-stk-val-sm">$120</span>
                  </div>
                </div>

                <!-- Compact Kanban Thumbnail -->
                <div *ngIf="d.key === 'kanban'" class="thumb-stk-kanban-wrap">
                  <div class="thumb-stk-kan-tile">
                    <span class="thumb-stk-dot-green"></span>
                    <span class="thumb-stk-qty-num">45.5</span>
                  </div>
                  <div class="thumb-stk-kan-tile">
                    <span class="thumb-stk-dot-amber"></span>
                    <span class="thumb-stk-qty-num">12.0</span>
                  </div>
                </div>

                <!-- List View Thumbnail -->
                <div *ngIf="d.key === 'list'" class="thumb-stk-list-wrap">
                  <div class="thumb-stk-list-row">
                    <span class="thumb-stk-sku-sm">STK</span>
                    <span class="thumb-stk-line w-16"></span>
                    <span class="thumb-stk-bar-green w-10"></span>
                  </div>
                  <div class="thumb-stk-list-row">
                    <span class="thumb-stk-sku-sm">STK</span>
                    <span class="thumb-stk-line w-10"></span>
                    <span class="thumb-stk-bar-amber w-6"></span>
                  </div>
                </div>

                <!-- Card View Thumbnail -->
                <div *ngIf="d.key === 'card'" class="thumb-stk-card-wrap">
                  <div class="thumb-stk-exec-card">
                    <div class="thumb-stk-exec-head">
                      <span class="thumb-stk-sku-sm">SKU</span>
                      <span class="thumb-stk-unit">PCS</span>
                    </div>
                    <div class="thumb-stk-big-num">120</div>
                    <div class="thumb-stk-bar-green w-16"></div>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">warehouse</span>
                    {{ d.label }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="stockLayout.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-blue-600 mt-0.5">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb mt-1">{{ d.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ getStockDesignLabel(stockLayout.activeKey()) }}</h2>
                <p class="card-subtitle">
                  Accurate live representation of the Stock Ledger. All adjustments to colors, health indicators, and valuation badges render in real time.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag !bg-blue-50 !text-blue-700 !border-blue-200">
                <span class="swatch-dot !bg-blue-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-stock-layout-preview
              [layoutKey]="stockLayout.activeKey()"
              [cssVars]="stockLayout.cssVars()"
            ></app-stock-layout-preview>
          </div>
        </div>

        <!-- Visual Token Customization Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">tune</span>
              <div>
                <h2 class="card-title">Customize “{{ getStockDesignLabel(stockLayout.activeKey()) }}”</h2>
                <p class="card-subtitle">
                  Fine-tune colors, status badges, sizing, and metrics. Each design retains its own independent values.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetStockLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Stock Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Token Groups -->
          <ng-container *ngFor="let group of stockTokenGroups">
            <div class="token-group" *ngIf="stockTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of stockTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span *ngIf="meta.type === 'range'" class="font-mono text-xs font-bold text-blue-700">
                      {{ stockTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>

                  <!-- Color Input -->
                  <div *ngIf="meta.type === 'color'" class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="stockTokenSwatch(meta.key)"
                      (input)="onStockTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="stockTokenValue(meta.key)"
                      (change)="onStockTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>

                  <!-- Range Slider Input -->
                  <div *ngIf="meta.type === 'range'" class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-blue-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="stockTokenValue(meta.key)"
                      (input)="onStockTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect immediately on the actual Stock page once saved.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetStockLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Stock Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 10: CUSTOMER CUSTOMIZE                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'customerdesign'" class="tab-content-pane">
        <!-- Five Customer Page Designs Chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Customer Directory Layout Designs</h2>
              <p class="card-subtitle">
                Select from five distinct CRM directory styles: Executive VIP Cards, Minimalist Clean Table, Compact CRM Tiles, List View, and Card View.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                Active: <strong>{{ getCustomerDesignLabel(customerLayout.activeKey()) }}</strong>
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                (click)="resetCustomerLayout()"
                title="Reset layout overrides"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- Five Design Cards Grid -->
          <div class="design-grid is-five">
            <button
              *ngFor="let d of customerDesigns"
              type="button"
              class="design-card"
              [class.is-selected]="customerLayout.activeKey() === d.key"
              (click)="customerLayout.setActiveDesign(d.key)"
              [attr.aria-pressed]="customerLayout.activeKey() === d.key"
            >
              <!-- Mini Graphic Thumbnail -->
              <div class="customer-mini-thumb" [ngClass]="'thumb-cust-' + d.key">
                <!-- VIP Card Thumb -->
                <div *ngIf="d.key === 'vipcard'" class="thumb-cust-vip-wrap">
                  <div class="thumb-cust-vip-card">
                    <div class="thumb-cust-vip-head">
                      <div class="thumb-cust-avatar-sm">SJ</div>
                      <span class="thumb-cust-vip-pill">GOLD</span>
                    </div>
                    <div class="thumb-cust-line w-14"></div>
                    <div class="thumb-cust-bar-gold w-10"></div>
                  </div>
                </div>

                <!-- Clean Table Thumb -->
                <div *ngIf="d.key === 'clean'" class="thumb-cust-clean-wrap">
                  <div class="thumb-cust-clean-row">
                    <span class="thumb-cust-seq">#1</span>
                    <span class="thumb-cust-line w-12"></span>
                    <span class="thumb-cust-pill-blue">VIP</span>
                  </div>
                  <div class="thumb-cust-clean-row">
                    <span class="thumb-cust-seq">#2</span>
                    <span class="thumb-cust-line w-10"></span>
                    <span class="thumb-cust-pill-green">REG</span>
                  </div>
                </div>

                <!-- Compact Tiles Thumb -->
                <div *ngIf="d.key === 'compact'" class="thumb-cust-compact-wrap">
                  <div class="thumb-cust-compact-tile">
                    <span class="thumb-cust-avatar-xs">SJ</span>
                    <span class="thumb-cust-line w-8"></span>
                  </div>
                  <div class="thumb-cust-compact-tile">
                    <span class="thumb-cust-avatar-xs">RM</span>
                    <span class="thumb-cust-line w-8"></span>
                  </div>
                </div>

                <!-- List View Thumb -->
                <div *ngIf="d.key === 'list'" class="thumb-cust-list-wrap">
                  <div class="thumb-cust-list-row">
                    <span class="thumb-cust-check"></span>
                    <span class="thumb-cust-line w-14"></span>
                    <span class="thumb-cust-tag-green">Active</span>
                  </div>
                  <div class="thumb-cust-list-row">
                    <span class="thumb-cust-check"></span>
                    <span class="thumb-cust-line w-10"></span>
                    <span class="thumb-cust-tag-green">Active</span>
                  </div>
                </div>

                <!-- Card View Thumb -->
                <div *ngIf="d.key === 'card'" class="thumb-cust-card-wrap">
                  <div class="thumb-cust-exec-card">
                    <div class="thumb-cust-card-banner"></div>
                    <div class="thumb-cust-card-body">
                      <div class="thumb-cust-avatar-xs">SJ</div>
                      <span class="thumb-cust-line w-10"></span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">badge</span>
                    {{ d.label }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="customerLayout.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-0.5">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb mt-1">{{ d.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ getCustomerDesignLabel(customerLayout.activeKey()) }}</h2>
                <p class="card-subtitle">
                  Accurate live representation of the Customer Directory. All adjustments to colors, VIP badges, and surfaces render in real time.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                <span class="swatch-dot !bg-purple-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-customer-layout-preview
              [layoutKey]="customerLayout.activeKey()"
              [cssVars]="customerLayout.cssVars(customerLayout.activeKey())"
            ></app-customer-layout-preview>
          </div>
        </div>

        <!-- Customer Layout Token Editor -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">palette</span>
              <div>
                <h2 class="card-title">Customize “{{ getCustomerDesignLabel(customerLayout.activeKey()) }}”</h2>
                <p class="card-subtitle">
                  Configure surfaces, VIP tier badges, spend accents, typography, and card scaling for this layout.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetCustomerLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Customer Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Token Groups -->
          <ng-container *ngFor="let group of customerTokenGroups">
            <div class="token-group" *ngIf="customerTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of customerTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span *ngIf="meta.type === 'range'" class="font-mono text-xs font-bold text-purple-700">
                      {{ customerTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>

                  <!-- Color Input -->
                  <div *ngIf="meta.type === 'color'" class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="customerTokenSwatch(meta.key)"
                      (input)="onCustomerTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="customerTokenValue(meta.key)"
                      (change)="onCustomerTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>

                  <!-- Range Slider Input -->
                  <div *ngIf="meta.type === 'range'" class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-purple-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="customerTokenValue(meta.key)"
                      (input)="onCustomerTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect immediately on the actual Customer page once saved.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetCustomerLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Customer Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 11: STAFF & ROLES CUSTOMIZE                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'staffdesign'" class="tab-content-pane">
        <!-- Five Staff Page Designs Chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Staff Accounts &amp; Roles Layout Designs</h2>
              <p class="card-subtitle">
                Select from five radically distinct visual styles: Executive Security ID Badge, Obsidian Dark Matrix, Horizontal Roster Stream, Enterprise SaaS Power Table, and Modern Bento Metric Profile.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                Active: <strong>{{ getStaffDesignLabel(staffLayout.activeKey()) }}</strong>
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                (click)="resetStaffLayout()"
                title="Reset layout overrides"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- Five Design Cards Grid -->
          <div class="design-grid is-five">
            <button
              *ngFor="let d of staffDesigns"
              type="button"
              class="design-card"
              [class.is-selected]="staffLayout.activeKey() === d.key"
              (click)="staffLayout.setActiveDesign(d.key)"
              [attr.aria-pressed]="staffLayout.activeKey() === d.key"
            >
              <!-- Mini Graphic Thumbnail -->
              <div class="staff-mini-thumb" [ngClass]="'thumb-staff-' + d.key">
                <!-- 1. Executive Staff ID Card Thumb -->
                <div *ngIf="d.key === 'idcard'" class="thumb-staff-id-wrap">
                  <div class="thumb-staff-id-card">
                    <div class="thumb-staff-id-slot"></div>
                    <div class="thumb-staff-id-head">
                      <div class="thumb-staff-avatar-sm">SJ</div>
                      <span class="thumb-staff-pill-green">ON</span>
                    </div>
                    <div class="thumb-staff-line w-12"></div>
                    <div class="thumb-staff-pill-indigo">CLEARANCE</div>
                    <div class="thumb-staff-barcode-line"></div>
                  </div>
                </div>

                <!-- 2. Obsidian Dark Matrix Thumb -->
                <div *ngIf="d.key === 'darkneon'" class="thumb-staff-darkneon-wrap">
                  <div class="thumb-staff-darkneon-card">
                    <div class="thumb-staff-darkneon-head">
                      <span class="thumb-staff-darkneon-sys">SYS//01</span>
                      <span class="thumb-staff-darkneon-radar"></span>
                    </div>
                    <div class="thumb-staff-darkneon-body">
                      <div class="thumb-staff-avatar-neon">SJ</div>
                      <div class="thumb-staff-darkneon-lines">
                        <div class="thumb-staff-line-neon w-10"></div>
                        <div class="thumb-staff-line-dim w-6"></div>
                      </div>
                    </div>
                    <div class="thumb-staff-darkneon-btn">EXEC</div>
                  </div>
                </div>

                <!-- 3. Horizontal Roster Stream Thumb -->
                <div *ngIf="d.key === 'roster'" class="thumb-staff-roster-wrap">
                  <div class="thumb-staff-roster-row">
                    <span class="thumb-staff-avatar-xs !bg-teal-100 !text-teal-700">SJ</span>
                    <div class="thumb-staff-roster-info">
                      <span class="thumb-staff-line w-8"></span>
                      <div class="thumb-staff-roster-gauge"><div class="thumb-staff-gauge-bar" style="width: 75%;"></div></div>
                    </div>
                    <span class="thumb-staff-pill-teal">12/16</span>
                  </div>
                  <div class="thumb-staff-roster-row">
                    <span class="thumb-staff-avatar-xs !bg-teal-100 !text-teal-700">EC</span>
                    <div class="thumb-staff-roster-info">
                      <span class="thumb-staff-line w-6"></span>
                      <div class="thumb-staff-roster-gauge"><div class="thumb-staff-gauge-bar" style="width: 45%;"></div></div>
                    </div>
                    <span class="thumb-staff-pill-teal">7/16</span>
                  </div>
                </div>

                <!-- 4. Enterprise SaaS Power Table Thumb -->
                <div *ngIf="d.key === 'list'" class="thumb-staff-list-wrap">
                  <div class="thumb-staff-list-head">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line-head w-6"></span>
                    <span class="thumb-staff-line-head w-8"></span>
                    <span class="thumb-staff-line-head w-4"></span>
                  </div>
                  <div class="thumb-staff-list-row zebra-w">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line w-10"></span>
                    <span class="thumb-staff-tag-blue">Lead</span>
                  </div>
                  <div class="thumb-staff-list-row zebra-s">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line w-8"></span>
                    <span class="thumb-staff-tag-blue">Staff</span>
                  </div>
                </div>

                <!-- 5. Modern Bento Metric Profile Thumb -->
                <div *ngIf="d.key === 'bento'" class="thumb-staff-bento-wrap">
                  <div class="thumb-staff-bento-card">
                    <div class="thumb-staff-bento-hero"></div>
                    <div class="thumb-staff-bento-avatar">SJ</div>
                    <div class="thumb-staff-bento-metrics">
                      <div class="thumb-staff-bento-box">TIER 1</div>
                      <div class="thumb-staff-bento-box">14 PERMS</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">{{ d.icon }}</span>
                    {{ d.label }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="staffLayout.activeKey() === d.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-0.5">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb mt-1">{{ d.description }}</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview Card -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ getStaffDesignLabel(staffLayout.activeKey()) }}</h2>
                <p class="card-subtitle">
                  Accurate live representation of Staff Accounts &amp; Roles. All adjustments to colors, badges, and surfaces render in real time.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                <span class="swatch-dot !bg-indigo-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-staff-layout-preview
              [layoutKey]="staffLayout.activeKey()"
              [cssVars]="staffLayout.cssVars(staffLayout.activeKey())"
            ></app-staff-layout-preview>
          </div>
        </div>

        <!-- Staff Layout Token Editor -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">palette</span>
              <div>
                <h2 class="card-title">Customize “{{ getStaffDesignLabel(staffLayout.activeKey()) }}”</h2>
                <p class="card-subtitle">
                  Configure surfaces, role badges, active status indicator, typography, and card scaling for this layout.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetStaffLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Staff Settings' }}</span>
              </button>
            </div>
          </div>

          <!-- Token Groups -->
          <ng-container *ngFor="let group of staffTokenGroups">
            <div class="token-group" *ngIf="staffTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of staffTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span *ngIf="meta.type === 'range'" class="font-mono text-xs font-bold text-purple-700">
                      {{ staffTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>

                  <!-- Color Input -->
                  <div *ngIf="meta.type === 'color'" class="token-input-row">
                    <input
                      type="color"
                      class="token-swatch"
                      [value]="staffTokenSwatch(meta.key)"
                      (input)="onStaffTokenInput(meta.key, $event)"
                      [title]="meta.label"
                    />
                    <input
                      type="text"
                      class="form-control font-mono text-xs"
                      [value]="staffTokenValue(meta.key)"
                      (change)="onStaffTokenInput(meta.key, $event)"
                      [title]="meta.label + ' hex value'"
                    />
                  </div>

                  <!-- Range Slider Input -->
                  <div *ngIf="meta.type === 'range'" class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-purple-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="staffTokenValue(meta.key)"
                      (input)="onStaffTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect immediately on the Staff Accounts page once saved.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetStaffLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Staff Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 12: SIDEBAR TEMPLATE                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'sidebardesign'" class="tab-content-pane">
        <!-- Eleven Sidebar Template Chooser -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Sidebar Navigation Templates</h2>
              <p class="card-subtitle">
                Eleven rail designs sharing the exact same menu items, routing and permissions — only the
                layout, spacing, elevation and interaction change. Colours always follow your active Brand Theme.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag">
                Active: <strong>{{ getSidebarTemplateLabel(sidebarLayout.activeKey()) }}</strong>
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                (click)="resetSidebarLayout()"
                title="Reset this template's tweaks"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div class="design-grid">
            <button
              *ngFor="let t of sidebarTemplates"
              type="button"
              class="design-card"
              [class.is-selected]="sidebarLayout.activeKey() === t.key"
              (click)="sidebarLayout.setActiveTemplate(t.key)"
              [attr.aria-pressed]="sidebarLayout.activeKey() === t.key"
            >
              <!-- Miniature rail, styled per template -->
              <div class="sb-mini-thumb" [ngClass]="'thumb-sb-' + t.key">
                <div class="sb-mini-rail">
                  <div class="sb-mini-head">
                    <span class="sb-mini-logo"></span>
                    <span class="sb-mini-brand"></span>
                  </div>
                  <div class="sb-mini-search" *ngIf="t.caps.hasSearch"></div>
                  <div class="sb-mini-quick" *ngIf="t.caps.quickActions">
                    <span></span><span></span>
                  </div>
                  <div class="sb-mini-rows">
                    <span class="sb-mini-row is-active"><i></i><b></b></span>
                    <span class="sb-mini-row"><i></i><b></b></span>
                    <span class="sb-mini-row"><i></i><b></b></span>
                    <span class="sb-mini-row"><i></i><b></b></span>
                  </div>
                  <div class="sb-mini-foot">
                    <span class="sb-mini-avatar"></span>
                    <span class="sb-mini-brand"></span>
                  </div>
                </div>
                <div class="sb-mini-canvas">
                  <span class="sb-mini-block"></span>
                  <span class="sb-mini-block"></span>
                </div>
              </div>

              <div class="design-meta">
                <div class="design-name-row">
                  <span class="design-name">
                    <span class="material-symbols-outlined design-name-icon">left_panel_open</span>
                    {{ t.label }}
                  </span>
                  <div class="design-name-actions">
                    <span class="design-check" *ngIf="sidebarLayout.activeKey() === t.key">
                      <span class="material-symbols-outlined">check_circle</span>
                    </span>
                  </div>
                </div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-purple-600 mt-0.5">
                  {{ t.badge || t.subtitle }}
                </div>
                <p class="design-blurb mt-1">{{ t.description }}</p>

                <!-- Motion / interaction highlights -->
                <div class="sb-highlight-row">
                  <span class="sb-highlight-chip" *ngFor="let h of t.highlights">
                    <span class="material-symbols-outlined">bolt</span>{{ h }}
                  </span>
                </div>

                <!-- Extra behaviour this template switches on -->
                <div class="sb-cap-row" *ngIf="sidebarCapLabels(t.key).length">
                  <span class="sb-cap-chip" *ngFor="let c of sidebarCapLabels(t.key)">{{ c }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Live Interactive Preview -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ getSidebarTemplateLabel(sidebarLayout.activeKey()) }}</h2>
                <p class="card-subtitle">
                  The real rail markup and stylesheet, rendered with sample menu data. Hover the rows and flip
                  between expanded and collapsed to check every interaction before you save.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag !bg-purple-50 !text-purple-700 !border-purple-200">
                <span class="swatch-dot !bg-purple-500"></span>
                <span>Active Live Preview</span>
              </span>
            </div>
          </div>

          <div class="p-4 md:p-6 bg-slate-50/70 border-t border-b border-purple-100/60">
            <app-sidebar-layout-preview
              [layoutKey]="sidebarLayout.activeKey()"
              [cssVars]="sidebarLayout.cssVars()"
              [caps]="sidebarLayout.caps()"
            ></app-sidebar-layout-preview>
          </div>
        </div>

        <!-- Token Customization -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">tune</span>
              <div>
                <h2 class="card-title">Customize “{{ getSidebarTemplateLabel(sidebarLayout.activeKey()) }}”</h2>
                <p class="card-subtitle">
                  Geometry, motion and elevation only — each template keeps its own independent values.
                  Rail colours stay under <strong>Brand Theme &amp; UI Palette</strong> so branding never forks.
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetSidebarLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-1.5 !px-4 !text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Sidebar Settings' }}</span>
              </button>
            </div>
          </div>

          <ng-container *ngFor="let group of sidebarTokenGroups">
            <div class="token-group" *ngIf="sidebarTokensIn(group).length">
              <h3 class="token-group-title">{{ group }}</h3>
              <div class="token-grid">
                <div *ngFor="let meta of sidebarTokensIn(group)" class="token-field">
                  <div class="flex items-center justify-between mb-1">
                    <label class="form-label !mb-0">{{ meta.label }}</label>
                    <span class="font-mono text-xs font-bold text-purple-700">
                      {{ sidebarTokenValue(meta.key) }}{{ meta.unit }}
                    </span>
                  </div>
                  <div class="token-range-row flex items-center gap-3 pt-1">
                    <input
                      type="range"
                      class="range-slider w-full accent-purple-600 cursor-pointer"
                      [min]="meta.min"
                      [max]="meta.max"
                      [step]="meta.step"
                      [value]="sidebarTokenValue(meta.key)"
                      (input)="onSidebarTokenInput(meta.key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              The rail on the left updates instantly; saving stores the template for every till on this store.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-2 !px-4 text-xs"
                (click)="resetSidebarLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset to Default</span>
              </button>
              <button
                type="button"
                class="action-btn btn-gradient-purple !py-2 !px-5 text-xs"
                (click)="saveSettings()"
                [disabled]="isSaving"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">save</span>
                <span>{{ isSaving ? 'Saving…' : 'Save Sidebar Settings' }}</span>
              </button>
            </div>
          </div>
        </div>
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
              class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
              title="Hide the individual colour tokens"
            >
              <span class="material-symbols-outlined" style="font-size: 16px;">expand_less</span>
              <span>Collapse Custom Fields</span>
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
      /* Shell holds the arrows outside the scrolling area, so they stay put
         while the tabs move under them. */
      .tab-scroll-shell {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        min-width: 0;
      }

      .tab-scroll-arrow {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.1rem;
        height: 2.1rem;
        border-radius: 999px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        color: var(--primary, #7E22CE);
        cursor: pointer;
        transition:
          opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
          border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.26s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .tab-scroll-arrow .material-symbols-outlined { font-size: 19px; }

      .tab-scroll-arrow:hover:not(:disabled) {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 4px 12px -6px var(--primary-glow, rgba(126, 34, 206, 0.35));
      }

      .tab-scroll-arrow:disabled { opacity: 0.32; cursor: not-allowed; }

      /* Nothing overflows: the pair leaves rather than sitting there inert. */
      .tab-scroll-arrow.is-hidden { display: none; }

      .tab-nav-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        padding: 0.5rem 0.25rem 0.65rem 0.25rem;
        margin: -0.25rem 0;
        scroll-behavior: smooth;
        /* Touch keeps native horizontal scrolling and its momentum; only the
           mouse is given drag-to-scroll. */
        touch-action: pan-x;
        cursor: grab;
        scrollbar-width: none;
      }

      .tab-nav-bar.is-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
        -webkit-user-select: none;
        user-select: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .tab-nav-bar { scroll-behavior: auto; }
      }

      .tab-nav-bar::-webkit-scrollbar {
        display: none;
      }

      /* ─── POS Customize ─── */
    .design-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.15rem;
      padding: 1.25rem 1.5rem 1.5rem;
    }

    .design-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 0.85rem;
      border-radius: 18px;
      border: 2px solid var(--card-border, #E9D5FF);
      background: var(--card-bg, #ffffff);
      text-align: left;
      cursor: pointer;
      transition:
        border-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .design-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -10px var(--primary-glow, rgba(126, 34, 206, 0.35));
    }

    .design-card.is-selected {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 0 0 4px var(--primary-light, rgba(126, 34, 206, 0.12));
    }

    .density-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin: 0 1.5rem 1.5rem;
      padding: 1rem 1.15rem;
      border-radius: 14px
      ;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
    }

    .density-copy { min-width: 0; }

    .density-copy .form-hint {
      margin: 0.2rem 0 0;
      max-width: 52ch;
      font-size: 0.6875rem;
      line-height: 1.5;
      color: var(--text-muted, #6B7280);
    }

    .density-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .density-input .form-control { width: 5.5rem; text-align: center; }

    .density-unit {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted, #6B7280);
    }

    .design-name-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .design-preview-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--card-bg, #fff);
      color: var(--primary, #7E22CE);
      font-size: 0.625rem;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      transition:
        border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .design-preview-btn .material-symbols-outlined { font-size: 14px; }

    .design-preview-btn:hover {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 4px 12px -6px var(--primary-glow, rgba(126, 34, 206, 0.35));
    }

    .design-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .design-name {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    .design-check .material-symbols-outlined {
      font-size: 20px;
      color: var(--primary, #7E22CE);
    }

    .design-blurb {
      margin: 0.2rem 0 0;
      font-size: 0.6875rem;
      line-height: 1.5;
      color: var(--text-muted, #6B7280);
    }

    /* Miniature of the real card layout, driven by the same tokens */
    .design-preview {
      display: flex;
      gap: 0.4rem;
      padding: 0.7rem;
      border-radius: 12px;
      background: var(--pos-bg-app);
      overflow: hidden;
    }

    .preview-card {
      flex: 1 1 0;
      min-width: 0;
      position: relative;
      display: flex;
      flex-direction: column;
      height: 108px;
      border-radius: 9px;
      overflow: hidden;
      background: var(--pos-card-bg);
      border: 1px solid var(--pos-card-border);
    }

    .preview-card[data-i='1'] { --a: var(--pos-accent1); }
    .preview-card[data-i='2'] { --a: var(--pos-accent2); }
    .preview-card[data-i='3'] { --a: var(--pos-accent3); }

    .preview-art {
      position: relative;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .preview-glyph { font-size: 15px; position: relative; z-index: 2; }

    .preview-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px 5px 5px;
      position: relative;
      z-index: 2;
    }

    .preview-title { height: 4px; width: 66%; border-radius: 2px; background: var(--pos-title-color); }
    .preview-line { height: 3px; width: 86%; border-radius: 2px; background: var(--pos-body-color); opacity: 0.55; }
    .preview-price { height: 6px; width: 40%; border-radius: 3px; background: var(--pos-price-color); }
    .preview-btn {
      margin-top: auto;
      height: 8px;
      width: 62%;
      border-radius: 999px;
      background: var(--pos-button-bg);
    }

    /* 1. Neon Spotlight — glow behind the dish, accent rule under it */
    .preview-neon .preview-art::after {
      content: '';
      position: absolute;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background: var(--a);
      filter: blur(9px);
      opacity: 0.85;
    }
    .preview-neon .preview-body { border-top: 1px solid var(--a); }

    /* 2. Diagonal Split — angled colour block */
    .preview-diagonal .preview-card::before {
      content: '';
      position: absolute;
      inset: 0 0 0 38%;
      background: var(--a);
      clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%);
    }
    .preview-diagonal .preview-price { background: #FFFFFF; margin-left: auto; }
    .preview-diagonal .preview-title { background: var(--a); }

    /* 3. Colour Arch — rounded arch behind the dish */
    .preview-arch .preview-art::before {
      content: '';
      position: absolute;
      top: 4px;
      width: 46px;
      height: 46px;
      border-radius: 999px 999px 6px 6px;
      background: var(--a);
    }
    .preview-arch .preview-price {
      background: var(--a);
      width: 52%;
      height: 8px;
    }

    /* 4. Half Colour — solid colour base under a pale top */
    .preview-split .preview-body { background: var(--a); }
    .preview-split .preview-art::before {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 999px;
      background: var(--pos-bg-app);
    }
    .preview-split .preview-title { background: var(--pos-title-color); }
    .preview-split .preview-btn { background: var(--pos-button-bg); }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* DISH PAGE DESIGN — chooser chrome and miniatures                    */
    /* ═══════════════════════════════════════════════════════════════════ */

    /* Five designs rather than four, so the cards are allowed to be a little
       narrower before the grid wraps. */
    .design-grid.is-five { grid-template-columns: repeat(auto-fit, minmax(242px, 1fr)); }

    .design-name { display: inline-flex; align-items: center; gap: 0.35rem; }
    .design-name .design-name-icon { font-size: 16px; color: var(--primary, #7E22CE); }

    /* Note explaining which of the two design settings owns the grid. */
    .design-override-note {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      margin: 0 1.5rem;
      padding: 0.7rem 0.9rem;
      border-radius: 12px;
      border: 1px solid var(--primary, #C084FC);
      background: var(--primary-light, rgba(126, 34, 206, 0.09));
    }

    .design-override-note.is-muted {
      border-color: var(--card-border, #E9D5FF);
      background: var(--bg-app, #FAF5FF);
    }

    .design-override-note .material-symbols-outlined {
      flex-shrink: 0;
      font-size: 19px;
      color: var(--primary, #7E22CE);
    }

    .design-override-note p {
      flex: 1;
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--text-main, #2E1065);
    }

    .design-override-note .note-action {
      flex-shrink: 0;
      padding: 0.35rem 0.7rem;
      border: 1.5px solid var(--primary, #C084FC);
      border-radius: 9px;
      background: var(--card-bg, #fff);
      color: var(--primary, #7E22CE);
      font-family: inherit;
      font-size: 0.6875rem;
      font-weight: 800;
      cursor: pointer;
    }

    .design-override-note .note-action:hover { background: var(--bg-app, #FAF5FF); }

    /* On/off switch for the whole setting. */
    .switch-row {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      cursor: pointer;
      user-select: none;
    }

    .switch-row input { position: absolute; opacity: 0; width: 0; height: 0; }

    .switch-track {
      position: relative;
      width: 2.65rem;
      height: 1.4rem;
      flex-shrink: 0;
      border-radius: 999px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--bg-app, #F3E8FF);
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .switch-knob {
      position: absolute;
      top: 50%;
      left: 0.16rem;
      width: 1rem;
      height: 1rem;
      transform: translateY(-50%);
      border-radius: 999px;
      background: #FFFFFF;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.28);
      transition: left 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .switch-row input:checked + .switch-track {
      background: var(--primary, #7E22CE);
      border-color: var(--primary, #7E22CE);
    }

    .switch-row input:checked + .switch-track .switch-knob { left: 1.32rem; }

    .switch-row input:focus-visible + .switch-track {
      box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.25));
    }

    .switch-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    /* ─── Miniatures, driven by the same tokens the POS renders ────────── */
    .layout-preview {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.35rem;
      padding: 0.7rem;
      border-radius: 12px;
      background: var(--dl-bg-app);
      overflow: hidden;
    }

    .lp-tile {
      position: relative;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 104px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--dl-card-bg);
      border: 1px solid var(--dl-card-border);
    }

    .lp-tile[data-i='1'] { --a: var(--dl-accent1); }
    .lp-tile[data-i='2'] { --a: var(--dl-accent2); }
    .lp-tile[data-i='3'] { --a: var(--dl-accent3); }
    .lp-tile[data-i='4'] { --a: var(--dl-accent4); }

    .lp-art {
      position: relative;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .lp-glyph { position: relative; z-index: 2; font-size: 13px; }

    .lp-body {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 5px 5px;
    }

    .lp-kicker { display: none; height: 3px; width: 34%; border-radius: 2px; background: var(--a); }
    .lp-title { height: 4px; width: 66%; border-radius: 2px; background: var(--dl-title-color); }
    .lp-line { height: 3px; width: 88%; border-radius: 2px; background: var(--dl-body-color); opacity: 0.5; }
    .lp-price { height: 5px; width: 38%; border-radius: 3px; background: var(--dl-price-color); }
    .lp-btn {
      margin-top: auto;
      height: 8px;
      width: 60%;
      border-radius: 999px;
      background: var(--dl-button-bg);
    }

    /* 1. Bento Showcase — accent-filled tiles, two of them double-wide */
    .lp-showcase { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 62px; }
    .lp-showcase .lp-tile { height: auto; border: none; background: var(--a); }
    .lp-showcase .lp-tile[data-i='1'],
    .lp-showcase .lp-tile[data-i='4'] { grid-column: span 2; flex-direction: row-reverse; }
    .lp-showcase .lp-tile[data-i='1'] .lp-art,
    .lp-showcase .lp-tile[data-i='4'] .lp-art { height: auto; flex: 1; }
    .lp-showcase .lp-tile[data-i='1'] .lp-body,
    .lp-showcase .lp-tile[data-i='4'] .lp-body { flex: 1; }
    .lp-showcase .lp-body { justify-content: flex-end; }
    .lp-showcase .lp-line { background: #FFFFFF; opacity: 0.55; }
    .lp-showcase .lp-price { display: none; }
    .lp-showcase .lp-btn { height: 9px; width: 56%; }

    /* 2. Menu Table — a header strip over striped single-line rows */
    .lp-table { display: block; }
    .lp-table::before {
      content: '';
      display: block;
      height: 11px;
      border-radius: 6px 6px 0 0;
      background: var(--dl-head-bg);
    }
    .lp-table .lp-tile {
      height: 22px;
      flex-direction: row;
      align-items: center;
      gap: 5px;
      padding: 0 5px;
      border: none;
      border-bottom: 1px solid var(--dl-card-border);
      border-radius: 0;
      background: var(--dl-card-bg);
    }
    .lp-table .lp-tile:nth-child(even) { background: var(--dl-row-alt-bg); }
    .lp-table .lp-tile:last-child { border-bottom: none; border-radius: 0 0 6px 6px; }
    .lp-table .lp-art {
      flex: 0 0 14px;
      width: 14px;
      height: 14px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--a) 22%, transparent);
    }
    .lp-table .lp-glyph { font-size: 8px; }
    .lp-table .lp-body { flex-direction: row; align-items: center; gap: 5px; padding: 0; }
    .lp-table .lp-kicker { display: block; flex: 0 0 18%; width: auto; }
    .lp-table .lp-title { flex: 1; width: auto; }
    .lp-table .lp-line { display: none; }
    .lp-table .lp-price { flex: 0 0 14%; width: auto; height: 4px; }
    .lp-table .lp-btn {
      flex: 0 0 16%;
      width: auto;
      height: 9px;
      margin-top: 0;
      border-radius: 3px;
    }

    /* 3. Liquid Glass — frosted tiles over accent pools */
    .lp-glass {
      background:
        radial-gradient(60% 60% at 15% 8%, color-mix(in srgb, var(--dl-accent1) 55%, transparent), transparent 70%),
        radial-gradient(55% 55% at 85% 18%, color-mix(in srgb, var(--dl-accent3) 50%, transparent), transparent 70%),
        var(--dl-bg-app);
    }
    .lp-glass .lp-tile {
      border-radius: 11px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border: 1px solid color-mix(in srgb, var(--dl-card-border) 40%, transparent);
      background: color-mix(in srgb, var(--dl-card-bg) 45%, transparent);
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
    }
    .lp-glass .lp-art::after {
      content: '';
      position: absolute;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: var(--a);
      filter: blur(10px);
      opacity: 0.7;
    }
    .lp-glass .lp-btn { width: 100%; }

    /* 4. Neo Brutalist — hard outlines and offset block shadows */
    .lp-brutal { gap: 0.6rem; padding: 0.7rem 0.85rem 0.9rem; }
    .lp-brutal .lp-tile {
      border: 2px solid var(--dl-card-border);
      border-radius: 3px;
      box-shadow: 3px 3px 0 var(--dl-card-border);
    }
    .lp-brutal .lp-art { background: var(--a); border-bottom: 2px solid var(--dl-card-border); }
    .lp-brutal .lp-price {
      order: -1;
      height: 6px;
      width: 32%;
      border: 1px solid var(--dl-card-border);
      border-radius: 0;
      background: var(--dl-price-bg);
    }
    .lp-brutal .lp-btn {
      width: 100%;
      border: 1px solid var(--dl-card-border);
      border-radius: 0;
    }

    /* 5. Editorial Minimal — hairline rules, no boxes, a text-link action */
    .lp-editorial .lp-tile {
      border: none;
      border-top: 1px solid var(--dl-card-border);
      border-radius: 0;
      background: none;
      padding-top: 5px;
    }
    .lp-editorial .lp-art { height: 40px; background: var(--dl-card-bg); }
    .lp-editorial .lp-kicker { display: block; width: 42%; }
    .lp-editorial .lp-title { width: 74%; }
    .lp-editorial .lp-price { height: 7px; width: 34%; border-radius: 1px; }
    .lp-editorial .lp-btn { height: 3px; width: 46%; border-radius: 0; background: var(--dl-highlight); }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* DINING DESIGN CHOOSER MINI THUMBNAILS                              */
    /* ═══════════════════════════════════════════════════════════════════ */
    .dining-mini-thumb {
      height: 110px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: var(--dining-canvas-bg, #F9F9FB);
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* Checkered Thumbnail */
    .thumb-checkered-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }
    .thumb-chk-round {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #FCE9DF;
      border: 1px solid #ECCDC0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-chk-arc {
      position: absolute;
      bottom: 2px;
      left: 3px;
      right: 3px;
      height: 12px;
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
      border-bottom: 3px solid #EAB308;
    }
    .thumb-chk-code { font-size: 8px; font-weight: 800; color: #1E293B; }
    .thumb-chk-banquet {
      width: 72px;
      height: 48px;
      border-radius: 8px;
      background: #FCE9DF;
      border: 1px solid #ECCDC0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .thumb-chk-diamond {
      width: 32px;
      height: 32px;
      transform: rotate(45deg);
      background: repeating-conic-gradient(#E23B3B 0% 25%, #FFFFFF 0% 50%) 50% / 8px 8px;
    }
    .thumb-chk-code-sm {
      position: absolute;
      bottom: 2px;
      right: 3px;
      font-size: 7px;
      font-weight: 800;
      color: #1E293B;
      background: #F8A5A5;
      padding: 1px 2px;
      border-radius: 2px;
    }
    .thumb-chk-square {
      width: 38px;
      height: 38px;
      border-radius: 6px;
      background: #FCE9DF;
      border: 1px solid #ECCDC0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-chk-stripe {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: #3B82F6;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    /* Neumorphic Thumbnail */
    .thumb-neumorphic-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }
    .thumb-neu-card {
      width: 44px;
      height: 46px;
      border-radius: 8px;
      background: #FFFFFF;
      box-shadow: 0 3px 8px rgba(0,0,0,0.06);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-neu-pill {
      position: absolute;
      width: 18px;
      height: 4px;
      border-radius: 9999px;
      background: #E2E8F0;
    }
    .neu-p-top { top: -5px; }
    .neu-p-bot { bottom: -5px; }
    .thumb-neu-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Illustrated Thumbnail */
    .thumb-illustrated-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
    }
    .thumb-ill-card {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .thumb-ill-card.ill-mint { background: #B2E8DC; color: #0F594D; }
    .thumb-ill-card.ill-pink { background: #FFDFD8; color: #D84C1C; }
    .thumb-ill-card.ill-lavender { background: #E8EEFF; color: #4338CA; }
    .thumb-ill-title { font-size: 7px; font-weight: 800; }
    .thumb-ill-cap { font-size: 7px; font-weight: 700; opacity: 0.9; }

    /* List View Thumbnail */
    .thumb-list-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 85%;
    }
    .thumb-list-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
    }
    .thumb-list-code { font-size: 8px; font-weight: 800; font-family: monospace; color: #0F172A; }
    .thumb-list-bar { height: 4px; width: 40px; background: #CBD5E1; border-radius: 2px; }
    .thumb-list-pill { width: 8px; height: 8px; border-radius: 50%; }
    .thumb-list-pill.is-busy { background: #F97316; }
    .thumb-list-pill.is-free { background: #10B981; }
    .thumb-list-pill.is-blocked { background: #EF4444; }

    /* Card List Thumbnail */
    .thumb-cardlist-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 90%;
    }
    .thumb-cardlist-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
    }
    .thumb-cl-badge {
      font-size: 8px;
      font-weight: 800;
      color: #FFFFFF;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .thumb-cl-badge.is-busy { background: #7E22CE; }
    .thumb-cl-badge.is-free { background: #10B981; }
    .thumb-cl-body { display: flex; flex-direction: column; gap: 3px; }
    .thumb-cl-line { height: 3px; background: #94A3B8; border-radius: 2px; }
    .thumb-cl-dwell { height: 2px; width: 30px; background: #F97316; border-radius: 1px; }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* CATEGORY DESIGN CHOOSER MINI THUMBNAILS                            */
    /* ═══════════════════════════════════════════════════════════════════ */
    .category-mini-thumb {
      height: 110px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #F9F9FB;
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* Showcase Thumb */
    .thumb-cat-showcase-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cat-sc-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid #E9D5FF;
      border-radius: 10px;
      padding: 8px;
      box-shadow: 0 4px 10px rgba(126, 34, 206, 0.08);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .thumb-cat-sc-head { display: flex; align-items: center; justify-content: space-between; }
    .thumb-cat-sc-icon { font-size: 14px; }
    .thumb-cat-sc-pill { font-size: 8px; font-weight: 700; color: #7E22CE; background: #F3E8FF; padding: 1px 4px; border-radius: 4px; }
    .thumb-cat-sc-line { height: 4px; width: 70%; background: #2E1065; border-radius: 2px; }
    .thumb-cat-sc-sub { height: 3px; width: 45%; background: #94A3B8; border-radius: 2px; }

    /* Clean Table Thumb */
    .thumb-cat-clean-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cat-clean-row {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .thumb-cat-seq { font-size: 8px; font-weight: 700; color: #0F766E; }
    .thumb-cat-bar { height: 4px; background: #334155; border-radius: 2px; }
    .thumb-cat-metric { font-size: 8px; font-weight: 800; color: #059669; }

    /* Compact Tiles Thumb */
    .thumb-cat-compact-wrap { display: flex; gap: 8px; justify-content: center; width: 100%; }
    .thumb-cat-compact-tile {
      width: 48px;
      height: 48px;
      background: #FFFFFF;
      border: 1.5px solid #E9D5FF;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .thumb-cat-c-icon { font-size: 18px; }
    .thumb-cat-c-dot { position: absolute; top: 4px; right: 4px; width: 5px; height: 5px; border-radius: 50%; background: #10B981; }

    /* List View Thumb */
    .thumb-cat-list-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cat-list-row {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .thumb-cat-dot { width: 6px; height: 6px; border-radius: 50%; background: #7E22CE; }
    .thumb-cat-tag { margin-left: auto; font-size: 7px; font-weight: 700; color: #16A34A; background: #DCFCE7; padding: 1px 3px; border-radius: 3px; }

    /* Card View Thumb */
    .thumb-cat-card-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cat-exec-card {
      width: 100px;
      background: #FFFFFF;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.04);
    }
    .thumb-cat-banner { height: 16px; background: linear-gradient(135deg, #7E22CE, #C084FC); }
    .thumb-cat-exec-body { padding: 6px; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cat-progress { height: 3px; width: 80%; background: #7E22CE; border-radius: 2px; }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* SIDEBAR TEMPLATE CHOOSER MINI THUMBNAILS                           */
    /* One markup, eleven looks — each thumb-sb-* block restyles the same  */
    /* miniature rail so the card reads like the template it selects.      */
    /* ═══════════════════════════════════════════════════════════════════ */
    .sb-mini-thumb {
      height: 118px;
      width: 100%;
      display: flex;
      gap: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E9D5FF;
      background: linear-gradient(135deg, #F8FAFC, #F1F5F9);
      padding: 0;
      transition: box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .design-card:hover .sb-mini-thumb {
      box-shadow: 0 10px 22px -12px rgba(46, 16, 101, 0.55);
    }

    .sb-mini-rail {
      width: 52%;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 7px 6px;
      background: #2E1065;
      box-sizing: border-box;
    }
    .sb-mini-head { display: flex; align-items: center; gap: 4px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.12); }
    .sb-mini-logo { width: 12px; height: 12px; border-radius: 4px; background: #C084FC; flex-shrink: 0; }
    .sb-mini-brand { height: 4px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.4); }
    .sb-mini-search { height: 9px; border-radius: 4px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.18); }
    .sb-mini-quick { display: flex; gap: 3px; }
    .sb-mini-quick span { flex: 1; height: 9px; border-radius: 4px; background: rgba(255,255,255,0.14); }
    .sb-mini-rows { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .sb-mini-row {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 11px;
      padding: 0 4px;
      border-radius: 3px;
      background: transparent;
    }
    .sb-mini-row i { width: 6px; height: 6px; border-radius: 2px; background: rgba(255,255,255,0.45); flex-shrink: 0; }
    .sb-mini-row b { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.28); }
    .sb-mini-row.is-active { background: rgba(192,132,252,0.22); }
    .sb-mini-row.is-active i { background: #C084FC; }
    .sb-mini-row.is-active b { background: rgba(255,255,255,0.75); }
    .sb-mini-foot { display: flex; align-items: center; gap: 4px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.12); }
    .sb-mini-avatar { width: 11px; height: 11px; border-radius: 50%; background: rgba(192,132,252,0.55); flex-shrink: 0; }

    .sb-mini-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 9px 8px;
      box-sizing: border-box;
    }
    .sb-mini-block { flex: 1; border-radius: 6px; background: #FFFFFF; border: 1px solid #E2E8F0; }

    /* 1 · Default — flat rail, accent bar on the active row */
    .thumb-sb-default .sb-mini-row.is-active { box-shadow: inset 2px 0 0 #C084FC; }

    /* 2 · Classic — square full-bleed rows, hairline separators */
    .thumb-sb-classic .sb-mini-rail { padding: 7px 0; gap: 4px; }
    .thumb-sb-classic .sb-mini-head,
    .thumb-sb-classic .sb-mini-foot { padding-left: 6px; padding-right: 6px; }
    .thumb-sb-classic .sb-mini-rows { padding: 0; }
    .thumb-sb-classic .sb-mini-row { border-radius: 0; padding: 0 6px; height: 12px; }
    .thumb-sb-classic .sb-mini-row.is-active {
      background: linear-gradient(90deg, rgba(192,132,252,0.3), transparent);
      box-shadow: inset 3px 0 0 #C084FC;
    }

    /* 3 · Minimal — airy pills, trailing dot, no chrome */
    .thumb-sb-minimal .sb-mini-rail { gap: 7px; }
    .thumb-sb-minimal .sb-mini-head,
    .thumb-sb-minimal .sb-mini-foot { border-color: rgba(255,255,255,0.06); }
    .thumb-sb-minimal .sb-mini-rows { gap: 6px; }
    .thumb-sb-minimal .sb-mini-row { border-radius: 6px; }
    .thumb-sb-minimal .sb-mini-row.is-active { background: rgba(192,132,252,0.16); }

    /* 4 · Compact — narrow rail, tight rows */
    .thumb-sb-compact .sb-mini-rail { width: 40%; gap: 3px; padding: 6px 4px; }
    .thumb-sb-compact .sb-mini-rows { gap: 2px; }
    .thumb-sb-compact .sb-mini-row { height: 9px; border-radius: 3px; }

    /* 5 · Floating — detached rounded panel with real elevation */
    .thumb-sb-floating { background: linear-gradient(135deg, #EEF2FF, #F8FAFC); padding: 7px; gap: 7px; }
    .thumb-sb-floating .sb-mini-rail {
      border-radius: 11px;
      box-shadow: 0 8px 18px -6px rgba(46, 16, 101, 0.6);
    }
    .thumb-sb-floating .sb-mini-canvas { padding: 0; }
    .thumb-sb-floating .sb-mini-row { border-radius: 6px; }
    .thumb-sb-floating .sb-mini-row.is-active {
      background: linear-gradient(135deg, rgba(192,132,252,0.45), rgba(192,132,252,0.12));
      box-shadow: 0 4px 8px -3px rgba(0,0,0,0.5);
    }

    /* 6 · Icon Focus — oversized glyph tiles */
    .thumb-sb-iconfocus .sb-mini-rows { gap: 5px; }
    .thumb-sb-iconfocus .sb-mini-row { height: 15px; }
    .thumb-sb-iconfocus .sb-mini-row i {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.22);
    }
    .thumb-sb-iconfocus .sb-mini-row.is-active i { background: #C084FC; border-color: #C084FC; }
    .thumb-sb-iconfocus .sb-mini-row.is-active { background: rgba(255,255,255,0.07); }

    /* 7 · Elegant — gradient wash and hairline heading rule */
    .thumb-sb-elegant .sb-mini-rail {
      background: linear-gradient(180deg, #2E1065, #1E0A45);
    }
    .thumb-sb-elegant .sb-mini-row { border-radius: 5px; }
    .thumb-sb-elegant .sb-mini-row.is-active {
      background: linear-gradient(90deg, rgba(192,132,252,0.32), transparent 85%);
      box-shadow: inset 2px 0 0 #C084FC;
    }
    .thumb-sb-elegant .sb-mini-head { border-bottom-color: rgba(192,132,252,0.4); }

    /* 8 · Dashboard Pro — widest rail, solid accent active row */
    .thumb-sb-dashboardpro .sb-mini-rail { width: 58%; }
    .thumb-sb-dashboardpro .sb-mini-row.is-active { background: #C084FC; }
    .thumb-sb-dashboardpro .sb-mini-row.is-active i { background: #2E1065; }
    .thumb-sb-dashboardpro .sb-mini-row.is-active b { background: rgba(46,16,101,0.6); }

    /* 9 · Glass — translucent frosted panel over a colourful canvas */
    .thumb-sb-glass {
      background:
        radial-gradient(60px 60px at 75% 25%, rgba(192,132,252,0.55), transparent 70%),
        radial-gradient(70px 70px at 90% 90%, rgba(96,165,250,0.5), transparent 70%),
        linear-gradient(135deg, #EDE9FE, #E0F2FE);
      padding: 6px;
      gap: 6px;
    }
    .thumb-sb-glass .sb-mini-rail {
      border-radius: 10px;
      background: rgba(46, 16, 101, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.28);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .thumb-sb-glass .sb-mini-canvas { padding: 0; }
    .thumb-sb-glass .sb-mini-block { background: rgba(255,255,255,0.55); border-color: rgba(255,255,255,0.7); }
    .thumb-sb-glass .sb-mini-row { border-radius: 7px; }
    .thumb-sb-glass .sb-mini-row.is-active {
      background: rgba(192,132,252,0.35);
      border: 1px solid rgba(255,255,255,0.35);
    }

    /* 10 · Smart — adaptive rail, animated indicator */
    .thumb-sb-smart .sb-mini-row { border-radius: 6px; }
    .thumb-sb-smart .sb-mini-row.is-active {
      background: rgba(192,132,252,0.18);
      box-shadow: inset 3px 0 0 #C084FC, 0 3px 7px -3px rgba(0,0,0,0.5);
    }
    .thumb-sb-smart .sb-mini-head::after {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #C084FC;
      flex-shrink: 0;
    }

    /* 11 · Collapsible Pro — half the rows shown as collapsed glowing tiles */
    .thumb-sb-collapsiblepro .sb-mini-rail { width: 46%; }
    .thumb-sb-collapsiblepro .sb-mini-row { border-radius: 7px; height: 12px; }
    .thumb-sb-collapsiblepro .sb-mini-row.is-active {
      background: rgba(192,132,252,0.2);
      box-shadow: 0 0 0 1.5px rgba(192,132,252,0.7);
    }
    .thumb-sb-collapsiblepro .sb-mini-row:nth-child(3) b,
    .thumb-sb-collapsiblepro .sb-mini-row:nth-child(4) b { opacity: 0.25; }

    /* Highlight & capability chips on the chooser cards */
    .sb-highlight-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 0.5rem;
    }
    .sb-highlight-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 0.625rem;
      font-weight: 600;
      color: #6B21A8;
      background: #FAF5FF;
      border: 1px solid #E9D5FF;
    }
    .sb-highlight-chip .material-symbols-outlined {
      font-size: 12px !important;
      color: #A855F7;
    }
    .sb-cap-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 0.35rem;
    }
    .sb-cap-chip {
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #0F766E;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
    }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* STOCK DESIGN CHOOSER MINI THUMBNAILS                               */
    /* ═══════════════════════════════════════════════════════════════════ */
    .stock-mini-thumb {
      height: 110px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #F8FAFC;
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* Warehouse Thumb */
    .thumb-stk-wh-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-stk-wh-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 8px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    }
    .thumb-stk-wh-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-stk-sku { font-size: 8px; font-weight: 800; font-family: monospace; color: #2563EB; background: #EFF6FF; padding: 1px 3px; border-radius: 3px; }
    .thumb-stk-dot-green { width: 6px; height: 6px; border-radius: 50%; background: #16A34A; }
    .thumb-stk-dot-amber { width: 6px; height: 6px; border-radius: 50%; background: #D97706; }
    .thumb-stk-bar-bg { height: 4px; width: 100%; background: #E2E8F0; border-radius: 2px; overflow: hidden; }
    .thumb-stk-bar-green { height: 100%; background: #16A34A; border-radius: 2px; display: block; }
    .thumb-stk-bar-amber { height: 100%; background: #D97706; border-radius: 2px; display: block; }
    .thumb-stk-chips { display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; font-family: monospace; }
    .thumb-stk-val { color: #7E22CE; }
    .thumb-stk-unit { color: #64748B; }

    /* Financial Ledger Thumb */
    .thumb-stk-fin-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-stk-fin-row {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .thumb-stk-sku-sm { font-size: 8px; font-family: monospace; font-weight: 700; color: #0F766E; }
    .thumb-stk-line { height: 3px; background: #64748B; border-radius: 1px; }
    .thumb-stk-val-sm { font-size: 8px; font-family: monospace; font-weight: 700; color: #0369A1; }

    /* Compact Kanban Thumb */
    .thumb-stk-kanban-wrap { display: flex; gap: 8px; justify-content: center; width: 100%; }
    .thumb-stk-kan-tile {
      width: 52px;
      height: 48px;
      background: #FFFFFF;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .thumb-stk-qty-num { font-size: 11px; font-weight: 800; font-family: monospace; color: #2E1065; text-align: center; }

    /* List View Thumb */
    .thumb-stk-list-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-stk-list-row {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Card View Thumb */
    .thumb-stk-card-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-stk-exec-card {
      width: 105px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 4px 8px rgba(15, 23, 42, 0.05);
    }
    .thumb-stk-exec-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-stk-big-num { font-size: 13px; font-weight: 800; font-family: monospace; color: #0F172A; }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* CUSTOMER DESIGN CHOOSER MINI THUMBNAILS                             */
    /* ═══════════════════════════════════════════════════════════════════ */
    .customer-mini-thumb {
      height: 110px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #FAF5FF;
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* VIP Card Thumb */
    .thumb-cust-vip-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cust-vip-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid #E9D5FF;
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 4px 10px rgba(126, 34, 206, 0.08);
    }
    .thumb-cust-vip-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-cust-avatar-sm { width: 20px; height: 20px; border-radius: 6px; background: #F3E8FF; color: #7E22CE; font-size: 8px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .thumb-cust-vip-pill { font-size: 7px; font-weight: 800; color: #B45309; background: #FEF3C7; padding: 1px 4px; border-radius: 3px; }
    .thumb-cust-bar-gold { height: 4px; background: #F59E0B; border-radius: 2px; }

    /* Clean Table Thumb */
    .thumb-cust-clean-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cust-clean-row { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px 6px; display: flex; justify-content: space-between; align-items: center; }
    .thumb-cust-seq { font-size: 8px; font-weight: 700; color: #64748B; }
    .thumb-cust-pill-blue { font-size: 7px; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 1px 3px; border-radius: 2px; }
    .thumb-cust-pill-green { font-size: 7px; font-weight: 800; color: #047857; background: #ECFDF5; padding: 1px 3px; border-radius: 2px; }

    /* Compact Tiles Thumb */
    .thumb-cust-compact-wrap { width: 100%; display: flex; gap: 6px; justify-content: center; }
    .thumb-cust-compact-tile { width: 50px; background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 4px; display: flex; flex-direction: column; gap: 3px; align-items: center; }
    .thumb-cust-avatar-xs { width: 16px; height: 16px; border-radius: 4px; background: #CCFBF1; color: #0F766E; font-size: 7px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

    /* List View Thumb */
    .thumb-cust-list-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cust-list-row { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 4px; }
    .thumb-cust-check { width: 5px; height: 5px; border-radius: 2px; border: 1px solid #7E22CE; }
    .thumb-cust-tag-green { margin-left: auto; font-size: 7px; font-weight: 700; color: #16A34A; background: #DCFCE7; padding: 1px 3px; border-radius: 2px; }

    /* Card View Thumb */
    .thumb-cust-card-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cust-exec-card { width: 95px; background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); }
    .thumb-cust-card-banner { height: 14px; background: linear-gradient(135deg, #7E22CE, #C084FC); }
    .thumb-cust-card-body { padding: 4px; display: flex; align-items: center; gap: 4px; }
    .thumb-cust-line { height: 4px; background: #334155; border-radius: 2px; }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* STAFF DESIGN CHOOSER MINI THUMBNAILS                                */
    /* ═══════════════════════════════════════════════════════════════════ */
    .staff-mini-thumb {
      height: 110px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #F8FAFC;
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* 1. Executive Staff ID Card Thumb */
    .thumb-staff-id-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-id-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
      position: relative;
    }
    .thumb-staff-id-slot { height: 3px; width: 24px; background: #94A3B8; border-radius: 2px; margin: 0 auto; }
    .thumb-staff-id-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-staff-avatar-sm { width: 18px; height: 18px; border-radius: 6px; background: #EEF2FF; color: #4F46E5; font-size: 8px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .thumb-staff-pill-green { font-size: 7px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 1px 4px; border-radius: 3px; }
    .thumb-staff-pill-indigo { font-size: 6px; font-weight: 800; color: #4F46E5; background: #EEF2FF; padding: 1px 4px; border-radius: 3px; width: fit-content; }
    .thumb-staff-line { height: 4px; background: #334155; border-radius: 2px; }
    .thumb-staff-barcode-line {
      height: 5px;
      width: 80%;
      margin: 2px auto 0;
      background: repeating-linear-gradient(90deg, #1E293B 0, #1E293B 2px, transparent 2px, transparent 4px);
    }

    /* 2. Obsidian Dark Matrix Thumb */
    .thumb-staff-darkneon-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-darkneon-card {
      width: 110px;
      background: #0B0F19;
      border: 1.5px solid #06B6D4;
      border-radius: 8px;
      padding: 5px 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
    }
    .thumb-staff-darkneon-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-staff-darkneon-sys { font-family: monospace; font-size: 6px; font-weight: bold; color: #22D3EE; }
    .thumb-staff-darkneon-radar { width: 5px; height: 5px; border-radius: 50%; background: #10B981; box-shadow: 0 0 4px #10B981; }
    .thumb-staff-darkneon-body { display: flex; gap: 4px; align-items: center; }
    .thumb-staff-avatar-neon { width: 16px; height: 16px; border-radius: 4px; background: rgba(6, 182, 212, 0.2); border: 1px solid #06B6D4; color: #22D3EE; font-size: 7px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
    .thumb-staff-darkneon-lines { display: flex; flex-direction: column; gap: 2px; }
    .thumb-staff-line-neon { height: 3px; background: #22D3EE; border-radius: 2px; }
    .thumb-staff-line-dim { height: 3px; background: #374151; border-radius: 2px; }
    .thumb-staff-darkneon-btn { background: #06B6D4; color: #000; font-size: 6px; font-weight: 800; text-align: center; padding: 1px 3px; border-radius: 2px; }

    /* 3. Horizontal Roster Stream Thumb */
    .thumb-staff-roster-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-staff-roster-row { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 3px 5px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-roster-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .thumb-staff-roster-gauge { width: 100%; height: 3px; background: #E2E8F0; border-radius: 2px; overflow: hidden; }
    .thumb-staff-gauge-bar { height: 100%; background: #0D9488; border-radius: 2px; }
    .thumb-staff-pill-teal { font-size: 6px; font-weight: 800; color: #0F766E; background: #CCFBF1; padding: 1px 3px; border-radius: 2px; }

    /* 4. Enterprise SaaS Power Table Thumb */
    .thumb-staff-list-wrap { width: 100%; display: flex; flex-direction: column; }
    .thumb-staff-list-head { background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 4px 4px 0 0; padding: 2px 4px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-line-head { height: 3px; background: #94A3B8; border-radius: 1px; }
    .thumb-staff-list-row { border: 1px solid #E2E8F0; border-top: none; padding: 3px 4px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-list-row.zebra-w { background: #FFFFFF; }
    .thumb-staff-list-row.zebra-s { background: #F8FAFC; border-radius: 0 0 4px 4px; }
    .thumb-staff-tag-blue { margin-left: auto; font-size: 6px; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 1px 3px; border-radius: 2px; }

    /* 5. Modern Bento Metric Profile Thumb */
    .thumb-staff-bento-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-bento-card {
      width: 105px;
      background: #FFFFFF;
      border: 1.5px solid #F3E8FF;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 3px 8px rgba(139, 92, 246, 0.1);
    }
    .thumb-staff-bento-hero { height: 14px; background: linear-gradient(135deg, #8B5CF6, #EC4899); }
    .thumb-staff-bento-avatar {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 2px solid #8B5CF6;
      color: #8B5CF6;
      font-size: 7px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: -9px auto 2px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .thumb-staff-bento-metrics { display: flex; gap: 2px; padding: 2px 4px 4px; }
    .thumb-staff-bento-box {
      flex: 1;
      background: #FAF5FF;
      border: 1px solid #EDE9FE;
      border-radius: 3px;
      font-size: 5px;
      font-weight: 800;
      color: #6D28D9;
      text-align: center;
      padding: 1px 0;
    }

    .token-range-row { width: 100%; }
    .range-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 3px;
      background: #E2E8F0;
      outline: none;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #7E22CE;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(126, 34, 206, 0.35);
      transition: transform 0.1s ease;
    }
    .range-slider::-webkit-slider-thumb:hover {
      transform: scale(1.15);
    }

    /* Token editor */
    .token-group { padding: 0 1.5rem 1.15rem; }

    .token-group-title {
      margin: 0 0 0.6rem;
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-variant, #6B21A8);
    }

    .token-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 0.85rem;
    }

    .token-input-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .token-range {
      flex: 1;
      min-width: 0;
      height: 1.6rem;
      accent-color: var(--primary, #7E22CE);
      cursor: pointer;
    }

    .token-size-box { width: 4.5rem; text-align: center; flex-shrink: 0; }

    .token-unit {
      flex-shrink: 0;
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-muted, #6B7280);
    }

    .token-swatch {
      width: 2.5rem;
      height: 2.35rem;
      flex-shrink: 0;
      padding: 2px;
      border-radius: 10px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--card-bg, #fff);
      cursor: pointer;
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
  private route = inject(ActivatedRoute);
  public settingsService = inject(SettingsService);
  public themeService = inject(ThemeService);
  public notify = inject(NotificationService);

  public activeTab: SettingsTab = 'theme';

  // ── POS Customize ─────────────────────────────────────────────────
  public posDesign = inject(PosDesignService);

  /** Group headings, in the order the token editor renders them. */
  public readonly posTokenGroups: PosTokenMeta['group'][] = [
    'Sizing',
    'Surface',
    'Text',
    'Price',
    'Button',
    'Accents',
    'Navigation',
  ];

  /** Tokens in one group, limited to those the active design actually reads. */
  posTokensIn(group: PosTokenMeta['group']): PosTokenMeta[] {
    const uses = this.posDesign.activeDesign().uses;
    return this.posDesign.tokenMeta.filter((m) => m.group === group && uses.includes(m.key));
  }

  posTokenValue(token: PosTokenKey): string {
    const value = this.posDesign.activeTokens()[token];
    // <input type="color"> rejects anything that is not #rrggbb, and one of the
    // defaults is "transparent"; fall back to the card colour so the swatch
    // still renders rather than silently resetting itself to black.
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      return this.posDesign.activeTokens().cardBg || '#ffffff';
    }
    return value;
  }

  posSizeValue(token: PosTokenKey): number {
    return this.posDesign.sizeValue(this.posDesign.activeKey(), token);
  }

  onPosSizeInput(token: PosTokenKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.posDesign.setSize(this.posDesign.activeKey(), token, input.value);
    // The service clamps to the token's bounds, so reflect what was accepted.
    input.value = String(this.posSizeValue(token));
  }

  onPosTokenInput(token: PosTokenKey, event: Event): void {
    const value = (event.target as HTMLInputElement).value?.trim();
    if (!value) return;
    this.posDesign.setToken(this.posDesign.activeKey(), token, value);
  }

  /** Design being previewed, or null when the modal is closed. */
  public previewDesignKey: PosDesignKey | null = null;

  get previewDesignName(): string {
    const found = this.posDesign.designs.find((d) => d.key === this.previewDesignKey);
    return found ? found.name : 'Preview';
  }

  /**
   * Opens the sample-dish preview. The click is stopped because the button sits
   * inside the design card, whose own click would otherwise also select it —
   * previewing a design should not change the active one.
   */
  openPosPreview(key: PosDesignKey, event?: Event): void {
    event?.stopPropagation();
    this.previewDesignKey = key;
  }

  closePosPreview(): void {
    this.previewDesignKey = null;
  }

  /** Selecting from inside the preview, for when the sample sells it. */
  useAndClosePosPreview(): void {
    if (this.previewDesignKey) this.posDesign.selectDesign(this.previewDesignKey);
    this.previewDesignKey = null;
  }

  public readonly cardsPerRowMin = CARDS_PER_ROW_MIN;
  public readonly cardsPerRowMax = CARDS_PER_ROW_MAX;

  onCardsPerRowInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.posDesign.setCardsPerRow(input.value);
    // The service clamps, so reflect the accepted value back into the field
    // rather than leaving an out-of-range number on screen.
    input.value = String(this.posDesign.cardsPerRow());
  }

  resetPosDesign(): void {
    this.posDesign.resetDesign(this.posDesign.activeKey());
    this.notify.info(`"${this.posDesign.activeDesign().name}" restored to its default palette.`);
  }

  // ── Dish Page Design ──────────────────────────────────────────────
  public dishLayout = inject(DishLayoutService);

  public readonly dishColumnsMin = DISH_COLUMNS_MIN;
  public readonly dishColumnsMax = DISH_COLUMNS_MAX;

  /** Tokens in one group, limited to those the active design actually reads. */
  dishTokensIn(group: DishTokenGroup): DishTokenMeta[] {
    const uses = this.dishLayout.activeLayout().uses;
    return this.dishLayout.tokenMeta.filter((m) => m.group === group && uses.includes(m.key));
  }

  /** The stored value, shown in the text field exactly as it will be used. */
  dishTokenValue(token: DishTokenKey): string {
    return this.dishLayout.activeTokens()[token];
  }

  /**
   * The same value, made safe for <input type="color">, which rejects anything
   * that is not #rrggbb — and several defaults are "transparent". Falling back
   * to the tile colour keeps the swatch rendering instead of silently showing
   * black and writing that back on the next click.
   */
  dishTokenSwatch(token: DishTokenKey): string {
    const value = this.dishTokenValue(token);
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      const fallback = this.dishLayout.activeTokens().cardBg;
      return /^#[0-9a-f]{6}$/i.test(fallback) ? fallback : '#ffffff';
    }
    return value;
  }

  onDishTokenInput(token: DishTokenKey, event: Event): void {
    const value = (event.target as HTMLInputElement).value?.trim();
    if (!value) return;
    this.dishLayout.setToken(this.dishLayout.activeKey(), token, value);
  }

  onDishEnabledToggle(event: Event): void {
    this.dishLayout.setEnabled((event.target as HTMLInputElement).checked);
  }

  onDishColumnsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dishLayout.setColumnsPerRow(input.value);
    // The service clamps, so reflect the accepted value back into the field
    // rather than leaving an out-of-range number on screen.
    input.value = String(this.dishLayout.columnsPerRow());
  }

  resetDishLayout(): void {
    this.dishLayout.resetLayout(this.dishLayout.activeKey());
    this.notify.info(`"${this.dishLayout.activeLayout().name}" restored to its default palette.`);
  }

  /** Design being previewed, or null when the modal is closed. */
  public previewLayoutKey: DishLayoutKey | null = null;

  get previewLayoutName(): string {
    return this.previewLayoutKey ? this.dishLayout.layoutFor(this.previewLayoutKey).name : 'Preview';
  }

  get previewLayoutHint(): string {
    if (!this.previewLayoutKey) return '';
    const layout = this.dishLayout.layoutFor(this.previewLayoutKey);
    if (layout.usesColumns) {
      return `One row at ${this.dishLayout.columnsPerRow()} per row, with your current colours`;
    }
    // Menu Table recolours the catalog's own table, which has more columns
    // than a modal can show, so this is indicative rather than the real thing.
    return 'Indicative rows — the catalog keeps its full table, in these colours';
  }

  /**
   * Opens the sample-dish preview. The click is stopped because the button sits
   * inside the design card, whose own click would otherwise also select it —
   * previewing a design should not change the active one.
   */
  openDishPreview(key: DishLayoutKey, event?: Event): void {
    event?.stopPropagation();
    this.previewLayoutKey = key;
  }

  closeDishPreview(): void {
    this.previewLayoutKey = null;
  }

  /** Selecting from inside the preview, for when the sample sells it. */
  useAndCloseDishPreview(): void {
    if (this.previewLayoutKey) this.dishLayout.selectLayout(this.previewLayoutKey);
    this.previewLayoutKey = null;
  }

  // ── Dining Page Design ──────────────────────────────────────────────
  public diningLayout = inject(DiningLayoutService);

  diningTokensIn(group: DiningTokenGroup): DiningTokenMeta[] {
    return this.diningLayout.tokenMeta.filter((m) => m.group === group);
  }

  diningTokenValue(token: DiningTokenKey): any {
    return this.diningLayout.activeTokens()[token];
  }

  diningTokenSwatch(token: DiningTokenKey): string {
    const value = String(this.diningTokenValue(token));
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      return '#7E22CE';
    }
    return value;
  }

  onDiningTokenInput(token: DiningTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'range' || target.type === 'number'
      ? Number(target.value)
      : target.value?.trim();
    if (value === undefined || value === '') return;
    this.diningLayout.setToken(this.diningLayout.activeKey(), token, value);
  }

  resetDiningLayout(): void {
    this.diningLayout.resetDesign(this.diningLayout.activeKey());
    this.notify.info(`"${this.diningLayout.activeDesign().name}" restored to default layout settings.`);
  }

  // ── Category Page Design ───────────────────────────────────────────
  public categoryLayout = inject(CategoryLayoutService);
  public categoryDesigns = CATEGORY_DESIGN_OPTIONS;
  public categoryTokenGroups: CategoryTokenGroup[] = [
    'Surface & Background',
    'Typography & Colors',
    'Status & Badges',
    'Sizing & Spacing',
    'Buttons & Actions',
  ];

  getCategoryDesignLabel(key: CategoryDesignKey): string {
    const found = this.categoryDesigns.find((d) => d.key === key);
    return found ? found.label : 'Category Layout';
  }

  categoryTokensIn(group: CategoryTokenGroup): CategoryTokenMeta[] {
    return CATEGORY_TOKEN_META.filter((m) => m.group === group);
  }

  categoryTokenValue(token: CategoryTokenKey): any {
    return this.categoryLayout.tokens()[token];
  }

  categoryTokenSwatch(token: CategoryTokenKey): string {
    const val = String(this.categoryTokenValue(token));
    if (!/^#[0-9a-f]{6}$/i.test(val)) return '#7E22CE';
    return val;
  }

  onCategoryTokenInput(token: CategoryTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'range' || target.type === 'number'
      ? Number(target.value)
      : target.value?.trim();
    if (value === undefined || value === '') return;
    this.categoryLayout.setToken(token, value as any);
  }

  resetCategoryLayout(): void {
    this.categoryLayout.resetActiveDesignToDefaults();
    this.notify.info(`"${this.getCategoryDesignLabel(this.categoryLayout.activeKey())}" restored to default layout settings.`);
  }

  // ── Stock Ledger Page Design ───────────────────────────────────────
  public stockLayout = inject(StockLayoutService);
  public stockDesigns = STOCK_DESIGN_OPTIONS;
  public stockTokenGroups: StockTokenGroup[] = [
    'Surface & Background',
    'Typography & Colors',
    'Stock Health & Valuation',
    'Sizing & Spacing',
    'Buttons & Actions',
  ];

  getStockDesignLabel(key: StockDesignKey): string {
    const found = this.stockDesigns.find((d) => d.key === key);
    return found ? found.label : 'Stock Ledger Layout';
  }

  stockTokensIn(group: StockTokenGroup): StockTokenMeta[] {
    return STOCK_TOKEN_META.filter((m) => m.group === group);
  }

  stockTokenValue(token: StockTokenKey): any {
    return this.stockLayout.tokens()[token];
  }

  stockTokenSwatch(token: StockTokenKey): string {
    const val = String(this.stockTokenValue(token));
    if (!/^#[0-9a-f]{6}$/i.test(val)) return '#2563EB';
    return val;
  }

  onStockTokenInput(token: StockTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'range' || target.type === 'number'
      ? Number(target.value)
      : target.value?.trim();
    if (value === undefined || value === '') return;
    this.stockLayout.setToken(token, value as any);
  }

  resetStockLayout(): void {
    this.stockLayout.resetActiveDesignToDefaults();
    this.notify.info(`"${this.getStockDesignLabel(this.stockLayout.activeKey())}" restored to default layout settings.`);
  }

  // ── Customer Page Design ──────────────────────────────────────────
  public customerLayout = inject(CustomerLayoutService);
  public customerDesigns = CUSTOMER_DESIGN_OPTIONS;
  public customerTokenGroups: CustomerTokenGroup[] = [
    'Surface & Background',
    'Typography & Colors',
    'Loyalty & Badges',
    'Sizing & Spacing',
    'Buttons & Actions',
  ];

  getCustomerDesignLabel(key: CustomerDesignKey): string {
    const found = this.customerDesigns.find((d) => d.key === key);
    return found ? found.label || found.name : 'Customer Layout';
  }

  customerTokensIn(group: CustomerTokenGroup): CustomerTokenMeta[] {
    return CUSTOMER_TOKEN_META.filter((m) => m.group === group);
  }

  customerTokenValue(token: CustomerTokenKey): any {
    return this.customerLayout.tokens()[token];
  }

  customerTokenSwatch(token: CustomerTokenKey): string {
    const val = String(this.customerTokenValue(token));
    if (!/^#[0-9a-f]{6}$/i.test(val)) return '#7E22CE';
    return val;
  }

  onCustomerTokenInput(token: CustomerTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'range' || target.type === 'number'
      ? Number(target.value)
      : target.value?.trim();
    if (value === undefined || value === '') return;
    this.customerLayout.setToken(token, value as any);
  }

  resetCustomerLayout(): void {
    this.customerLayout.resetActiveDesignToDefaults();
    this.notify.info(`"${this.getCustomerDesignLabel(this.customerLayout.activeKey())}" restored to default layout settings.`);
  }

  // ── Staff & Roles Page Design ──────────────────────────────────────
  public staffLayout = inject(StaffLayoutService);
  public staffDesigns = STAFF_DESIGN_OPTIONS;
  public staffTokenGroups: StaffTokenGroup[] = [
    'Surface & Background',
    'Typography & Colors',
    'Role & Access',
    'Sizing & Spacing',
    'Buttons & Actions',
  ];

  getStaffDesignLabel(key: StaffDesignKey): string {
    const found = this.staffDesigns.find((d) => d.key === key);
    return found ? found.label || found.name : 'Staff Layout';
  }

  staffTokensIn(group: StaffTokenGroup): StaffTokenMeta[] {
    return STAFF_TOKEN_META.filter((m) => m.group === group);
  }

  staffTokenValue(token: StaffTokenKey): any {
    return this.staffLayout.tokens()[token];
  }

  staffTokenSwatch(token: StaffTokenKey): string {
    const val = String(this.staffTokenValue(token));
    if (!/^#[0-9a-f]{6}$/i.test(val)) return '#6366F1';
    return val;
  }

  onStaffTokenInput(token: StaffTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'range' || target.type === 'number'
      ? Number(target.value)
      : target.value?.trim();
    if (value === undefined || value === '') return;
    this.staffLayout.setToken(token, value as any);
  }

  resetStaffLayout(): void {
    this.staffLayout.resetActiveDesignToDefaults();
    this.notify.info(`"${this.getStaffDesignLabel(this.staffLayout.activeKey())}" restored to default layout settings.`);
  }

  // ── Sidebar Navigation Template ────────────────────────────────────
  public sidebarLayout = inject(SidebarLayoutService);
  public sidebarTemplates = SIDEBAR_TEMPLATE_OPTIONS;
  public sidebarTokenGroups: SidebarTokenGroup[] = [
    'Rail Geometry',
    'Menu Rows',
    'Typography & Icons',
    'Motion & Elevation',
  ];

  getSidebarTemplateLabel(key: SidebarTemplateKey): string {
    const found = this.sidebarTemplates.find((t) => t.key === key);
    return found ? found.label : 'Sidebar Template';
  }

  /** Human labels for the extra behaviour a template switches on, if any. */
  sidebarCapLabels(key: SidebarTemplateKey): string[] {
    const found = this.sidebarTemplates.find((t) => t.key === key);
    if (!found) return [];
    const labels: string[] = [];
    if (found.caps.hasSearch) labels.push('Menu search');
    if (found.caps.collapsibleSections) labels.push('Foldable groups');
    if (found.caps.quickActions) labels.push('Quick shortcuts');
    if (found.caps.prefersCollapsed) labels.push('Opens narrow');
    return labels;
  }

  sidebarTokensIn(group: SidebarTokenGroup): SidebarTokenMeta[] {
    return SIDEBAR_TOKEN_META.filter((m) => m.group === group);
  }

  sidebarTokenValue(token: SidebarTokenKey): number {
    return this.sidebarLayout.tokens()[token];
  }

  onSidebarTokenInput(token: SidebarTokenKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    if (Number.isNaN(value)) return;
    this.sidebarLayout.setToken(token, value);
  }

  resetSidebarLayout(): void {
    this.sidebarLayout.resetActiveTemplateToDefaults();
    this.notify.info(
      `"${this.getSidebarTemplateLabel(this.sidebarLayout.activeKey())}" restored to default rail settings.`,
    );
  }

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

    // Listen to query parameters to switch tabs directly from URLs like /settings?tab=categorydesign
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab && this.isValidTab(tab)) {
        this.activeTab = tab as SettingsTab;
        setTimeout(() => {
          this.scrollActiveTabIntoView();
        }, 150);
      }
    });
  }

  private isValidTab(tab: string): tab is SettingsTab {
    return [
      'theme',
      'toast',
      'business',
      'hardware',
      'posdesign',
      'dishpage',
      'dining',
      'categorydesign',
      'stockdesign',
      'customerdesign',
      'staffdesign',
      'sidebardesign',
    ].includes(tab);
  }

  public scrollActiveTabIntoView(): void {
    if (typeof document !== 'undefined') {
      const activeBtn = document.querySelector('.tab-nav-bar .tab-btn.is-active') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
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
      case 'posdesign': return 'POS Dish Card Design';
      case 'dishpage': return 'Catalog Page Design';
      case 'dining': return 'Dining Customize';
      case 'categorydesign': return 'Category Customize';
      case 'stockdesign': return 'Stock Ledger Customize';
      case 'customerdesign': return 'Customer Customize';
      case 'staffdesign': return 'Staff & Roles Customize';
      case 'sidebardesign': return 'Sidebar Template';
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
    } else if (tab === 'posdesign') {
      Object.assign(payload, this.posDesign.toPayload());
    } else if (tab === 'dishpage') {
      Object.assign(payload, this.dishLayout.toPayload());
    } else if (tab === 'dining') {
      Object.assign(payload, this.diningLayout.toPayload());
    } else if (tab === 'categorydesign') {
      Object.assign(payload, this.categoryLayout.toPayload());
    } else if (tab === 'stockdesign') {
      Object.assign(payload, this.stockLayout.toPayload());
    } else if (tab === 'customerdesign') {
      Object.assign(payload, this.customerLayout.toPayload());
    } else if (tab === 'staffdesign') {
      Object.assign(payload, this.staffLayout.toPayload());
    } else if (tab === 'sidebardesign') {
      Object.assign(payload, this.sidebarLayout.toPayload());
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

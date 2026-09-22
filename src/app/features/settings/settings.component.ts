import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { BackupService, BackupInfo, FolderCheck, BrowseResult } from '../../core/services/backup.service';
import { AuthService } from '../../core/auth/services/auth.service';
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
import {
  CustomizationService,
  CustomizationModule,
  CustomizationModuleKey,
} from '../../core/services/customization.service';
import { PrinterService } from '../../core/services/printer.service';

type SettingsTab = 'customization' | 'theme' | 'toast' | 'business' | 'hardware' | 'posdesign' | 'dishpage' | 'dining' | 'categorydesign' | 'stockdesign' | 'customerdesign' | 'staffdesign' | 'sidebardesign' | 'printer' | 'notification' | 'invoice' | 'databackup';

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
import {
  NavItem,
  NavSection,
  SIDEBAR_NAV_SECTIONS,
} from '../../core/config/sidebar-nav.config';

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
            (click)="activeTab = 'customization'"
            class="tab-btn"
            [class.is-active]="activeTab === 'customization'"
          >
            <span class="material-symbols-outlined">toggle_on</span>
            <span>POS Customization</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'theme'"
            class="tab-btn"
            [class.is-active]="isThemeGroupTab(activeTab)"
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
            (click)="activeTab = 'printer'"
            class="tab-btn"
            [class.is-active]="activeTab === 'printer'"
          >
            <span class="material-symbols-outlined">print_connect</span>
            <span>Printer Settings</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'notification'"
            class="tab-btn"
            [class.is-active]="activeTab === 'notification'"
          >
            <span class="material-symbols-outlined">campaign</span>
            <span>Notification Settings</span>
          </button>

          <button
            type="button"
            (click)="activeTab = 'invoice'"
            class="tab-btn"
            [class.is-active]="activeTab === 'invoice'"
          >
            <span class="material-symbols-outlined">receipt</span>
            <span>Invoice Settings</span>
          </button>

          <!-- Administrators only: a backup is every row of every table,
               including password hashes, so the tab is hidden rather than
               shown-and-refused for anyone else. -->
          <button
            *ngIf="isAdmin"
            type="button"
            (click)="openDataBackup()"
            class="tab-btn"
            [class.is-active]="activeTab === 'databackup'"
          >
            <span class="material-symbols-outlined">database</span>
            <span>Data Backup</span>
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
      <!-- BRAND THEME SUB-TABS                                            -->
      <!-- The palette and the eight page designs all belong to branding,  -->
      <!-- so they share one rail here instead of crowding the main tab    -->
      <!-- bar. activeTab stays the single source of truth, which keeps    -->
      <!-- ?tab= deep links and the Configure buttons working unchanged.   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="isThemeGroupTab(activeTab)" class="subtab-scroll-shell">
        <button
          type="button"
          class="tab-scroll-arrow prev"
          [class.is-hidden]="!subTabRail.canScroll"
          [disabled]="!subTabRail.canScrollLeft"
          (click)="subTabRail.step(-280)"
          aria-label="Scroll theme tabs left"
          title="Scroll theme tabs left"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </button>

        <div class="subtab-nav-bar" appDragScroll #subTabRail="dragScroll">
          <button
            type="button"
            *ngFor="let t of themeGroupTabs"
            (click)="activeTab = t.tab"
            class="subtab-btn"
            [class.is-active]="activeTab === t.tab"
          >
            {{ t.label }}
          </button>
        </div>

        <button
          type="button"
          class="tab-scroll-arrow next"
          [class.is-hidden]="!subTabRail.canScroll"
          [disabled]="!subTabRail.canScrollRight"
          (click)="subTabRail.step(280)"
          aria-label="Scroll theme tabs right"
          title="Scroll theme tabs right"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>


      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- WHETHER THE PAGE BEING CONFIGURED ACTUALLY USES THIS DESIGN     -->
      <!-- One bar for all eight customize tabs: the editor is always live,-->
      <!-- but the design only reaches the page while the switch is on.    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div
        *ngIf="activeModule as m"
        class="customization-status-bar"
        [class.is-off]="!customization.isEnabled(m.key)"
      >
        <span class="material-symbols-outlined">
          {{ customization.isEnabled(m.key) ? 'check_circle' : 'info' }}
        </span>
        <p>
          <strong>{{ m.name }}</strong> customization is
          <strong>{{ customization.isEnabled(m.key) ? 'ON' : 'OFF' }}</strong> —
          <ng-container *ngIf="customization.isEnabled(m.key); else offCopy">
            this page renders the design saved here.
          </ng-container>
          <ng-template #offCopy>
            the page renders its existing default design. Anything you change here is
            still saved, and applies the moment you switch it on.
          </ng-template>
        </p>
        <button
          type="button"
          class="note-action"
          [disabled]="savingModuleKey !== null"
          (click)="toggleCustomizationFor(m)"
        >
          {{ customization.isEnabled(m.key) ? 'Turn off' : 'Turn on' }}
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 0: POS CUSTOMIZATION — one switch per page                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'customization'" class="tab-content-pane">
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">toggle_on</span>
              <div>
                <h2 class="card-title">POS Customization</h2>
                <p class="card-subtitle">
                  Choose which customized designs are active. A page that is switched off
                  uses the existing default design — its saved customization is kept, and
                  switching it back on restores it exactly as it was. Each page is
                  independent; changing one never changes another.
                </p>
              </div>
            </div>
            <div class="custom-master">
              <span class="custom-count-pill">
                {{ enabledCustomizationCount }} of {{ customization.modules.length }} on
              </span>

              <label
                class="switch-row"
                title="Turn every page's customization on, or all of them off"
              >
                <input
                  type="checkbox"
                  [checked]="allCustomizationsOn"
                  [indeterminate]="someCustomizationsOn"
                  [disabled]="savingModuleKey !== null"
                  (change)="onCustomizationMasterToggle($event)"
                />
                <span class="switch-track" [class.is-mixed]="someCustomizationsOn">
                  <span class="switch-knob"></span>
                </span>
                <span class="switch-label">
                  {{ savingModuleKey === 'all'
                      ? 'Saving…'
                      : (allCustomizationsOn ? 'All ON' : (someCustomizationsOn ? 'Mixed' : 'All OFF')) }}
                </span>
              </label>
            </div>
          </div>

          <div class="custom-row-list">
            <div
              *ngFor="let m of customization.modules"
              class="custom-row"
              [class.is-on]="customization.isEnabled(m.key)"
            >
              <span class="material-symbols-outlined custom-row-icon">{{ m.icon }}</span>

              <div class="custom-row-text">
                <div class="custom-row-name">{{ m.name }}</div>
                <p class="custom-row-desc">{{ m.description }}</p>
                <p class="custom-row-status">
                  Customization:
                  <strong [class.is-on]="customization.isEnabled(m.key)">
                    {{ customization.isEnabled(m.key) ? 'ON' : 'OFF' }}
                  </strong>
                  <span *ngIf="!customization.isEnabled(m.key)"> · {{ m.defaultBlurb }}</span>
                </p>
              </div>

              <div class="custom-row-actions">
                <label
                  class="switch-row"
                  [title]="'Apply the saved ' + m.name + ' design to its page'"
                >
                  <input
                    type="checkbox"
                    [checked]="customization.isEnabled(m.key)"
                    [disabled]="savingModuleKey !== null"
                    (change)="onCustomizationToggle(m, $event)"
                  />
                  <span class="switch-track"><span class="switch-knob"></span></span>
                  <span class="switch-label">
                    {{ savingModuleKey === m.key ? 'Saving…' : (customization.isEnabled(m.key) ? 'ON' : 'OFF') }}
                  </span>
                </label>

                <button
                  type="button"
                  class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                  (click)="openCustomizationTab(m)"
                  [title]="'Open the ' + m.name + ' editor'"
                >
                  <span class="material-symbols-outlined">tune</span>
                  <span>Configure</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- POS DESIGN PREVIEW (sample dishes, read-only)                   -->

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DISH PAGE DESIGN PREVIEW (sample dishes, read-only)             -->

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
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetPosDesign()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset Design</span>
              </button>
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
                  <span class="design-check" *ngIf="posDesign.activeKey() === d.key">
                    <span class="material-symbols-outlined">check_circle</span>
                  </span>
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

        <!-- Live Interactive Preview Card. Always on: every colour and size
             edit below renders here as it is made, with nothing to click. -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ posDesign.activeDesign().name }}</h2>
                <p class="card-subtitle">
                  One row of sample dishes at {{ posDesign.cardsPerRow() }} per row, drawn with
                  the same stylesheet the POS billing grid uses. Every change below appears here
                  immediately.
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
            <app-pos-design-preview
              [designKey]="posDesign.activeKey()"
              [cssVars]="posDesign.cssVars()"
              [cardsPerRow]="posDesign.cardsPerRow()"
            ></app-pos-design-preview>
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
                  immediately; press <strong>Save Configuration</strong> at the top of this page
                  to apply them to the POS.
                </p>
              </div>
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
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetDishLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset Design</span>
              </button>
            </div>
          </div>

          <div class="design-grid is-five">
            <button
              *ngFor="let l of dishLayout.layouts"
              type="button"
              class="design-card"
              [class.is-selected]="dishLayout.activeKey() === l.key"
              (click)="dishLayout.selectLayout(l.key)"
              [attr.aria-pressed]="dishLayout.activeKey() === l.key"
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
                    <span
                      class="design-check"
                      *ngIf="dishLayout.activeKey() === l.key"
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

        <!-- Live Interactive Preview Card. Always on: every colour and size
             edit below renders here as it is made, with nothing to click. -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div class="card-title-group">
              <span class="material-symbols-outlined card-icon">visibility</span>
              <div>
                <h2 class="card-title">Live Preview: {{ dishLayout.activeLayout().name }}</h2>
                <p class="card-subtitle">
                  Sample dishes at {{ dishLayout.columnsPerRow() }} per row, drawn with the same
                  stylesheet the catalogue uses. Every change below appears here immediately.
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
            <app-dish-layout-preview
              [layoutKey]="dishLayout.activeKey()"
              [cssVars]="dishLayout.cssVars()"
              [columnsPerRow]="dishLayout.columnsPerRow()"
            ></app-dish-layout-preview>
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
                  immediately; press <strong>Save Configuration</strong> at the top of this page
                  to apply them to the POS.
                </p>
              </div>
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
            <!-- Saving is handled once, by "Save Configuration" in the sticky page
                 header. Only the design-level reset lives here. -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                (click)="resetDiningLayout()"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset Design</span>
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
                      <span class="thumb-cl-line tbw-16"></span>
                      <span class="thumb-cl-dwell"></span>
                    </div>
                  </div>
                  <div class="thumb-cardlist-item">
                    <span class="thumb-cl-badge is-free">T-02</span>
                    <div class="thumb-cl-body">
                      <span class="thumb-cl-line tbw-12"></span>
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
                <div class="design-kicker">
                  {{ d.badge }}
                </div>
                <p class="design-blurb">{{ d.blurb }}</p>
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

          <!-- Bottom note — no buttons: one Save lives in the page header. -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect on the actual Dining page once you press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page.
            </p>
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
                <span>Reset Design</span>
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
              <!-- Mini Graphic Thumbnail.
                   Widths use the local .cw-* helpers below, never the global
                   .w-N utilities: those force a square (width AND height, both
                   !important) because they were written for icon boxes. -->
              <div class="category-mini-thumb" [ngClass]="'thumb-cat-' + d.key">
                <!-- Design 1 · Bento Showcase: one hero tile + two supporting tiles -->
                <div *ngIf="d.key === 'showcase'" class="cat-thumb cat-bento">
                  <div class="cat-bento-hero">
                    <span class="cat-avatar is-lg">☕</span>
                    <div class="cat-stack">
                      <span class="cat-line is-title cw-70"></span>
                      <span class="cat-line cw-45"></span>
                    </div>
                    <span class="cat-chip is-count">32</span>
                  </div>
                  <div class="cat-bento-row">
                    <div class="cat-bento-tile">
                      <span class="cat-avatar">🍕</span>
                      <span class="cat-line cw-60"></span>
                    </div>
                    <div class="cat-bento-tile">
                      <span class="cat-avatar">🥗</span>
                      <span class="cat-line cw-60"></span>
                    </div>
                  </div>
                </div>

                <!-- Design 2 · Minimalist Clean Table: header rule + data rows -->
                <div *ngIf="d.key === 'clean'" class="cat-thumb cat-table">
                  <div class="cat-table-head">
                    <span class="cat-col cw-20"></span>
                    <span class="cat-col cw-50"></span>
                    <span class="cat-col cw-25"></span>
                  </div>
                  <div class="cat-table-row" *ngFor="let r of [1, 2, 3]">
                    <span class="cat-seq">#{{ r }}</span>
                    <span class="cat-line is-name cw-60"></span>
                    <span class="cat-chip is-soft">{{ r === 1 ? '32' : r === 2 ? '18' : '9' }}</span>
                  </div>
                </div>

                <!-- Design 3 · Compact Badge Tiles: dense masonry of icon badges -->
                <div *ngIf="d.key === 'compact'" class="cat-thumb cat-tiles">
                  <div class="cat-tile" *ngFor="let g of ['🍕', '🍔', '🥗', '🍰', '☕', '🍜']">
                    <span class="cat-tile-glyph">{{ g }}</span>
                    <span class="cat-tile-dot"></span>
                  </div>
                </div>

                <!-- Design 4 · List View: full-width rows with status + actions -->
                <div *ngIf="d.key === 'list'" class="cat-thumb cat-list">
                  <div class="cat-list-row" *ngFor="let r of [1, 2, 3]">
                    <span class="cat-seq is-boxed">{{ r }}</span>
                    <span class="cat-avatar is-sm"></span>
                    <div class="cat-stack is-grow">
                      <span class="cat-line is-name cw-70"></span>
                      <span class="cat-line cw-40"></span>
                    </div>
                    <span class="cat-chip is-live">●</span>
                    <span class="cat-kebab"></span>
                  </div>
                </div>

                <!-- Design 5 · Card View: banner cards with overlapping avatar + meter -->
                <div *ngIf="d.key === 'card'" class="cat-thumb cat-cards">
                  <div class="cat-card" *ngFor="let c of [1, 2]">
                    <span class="cat-card-banner"></span>
                    <span class="cat-avatar is-float">{{ c === 1 ? '🍕' : '☕' }}</span>
                    <div class="cat-card-body">
                      <span class="cat-line is-name cw-75"></span>
                      <span class="cat-line cw-50"></span>
                      <span class="cat-meter"><i [style.width.%]="c === 1 ? 72 : 44"></i></span>
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
                <div class="design-kicker">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb">{{ d.description }}</p>
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

          <!-- Bottom note - no buttons: one Save lives in the page header. -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect on the Category page once you press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page.
            </p>
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
                <span>Reset Design</span>
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
                      <span class="thumb-stk-bar-green tbw-14"></span>
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
                    <span class="thumb-stk-line tbw-12"></span>
                    <span class="thumb-stk-val-sm">$450</span>
                  </div>
                  <div class="thumb-stk-fin-row">
                    <span class="thumb-stk-sku-sm">#02</span>
                    <span class="thumb-stk-line tbw-8"></span>
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
                    <span class="thumb-stk-line tbw-16"></span>
                    <span class="thumb-stk-bar-green tbw-10"></span>
                  </div>
                  <div class="thumb-stk-list-row">
                    <span class="thumb-stk-sku-sm">STK</span>
                    <span class="thumb-stk-line tbw-10"></span>
                    <span class="thumb-stk-bar-amber tbw-6"></span>
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
                    <div class="thumb-stk-bar-green tbw-16"></div>
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
                <div class="design-kicker">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb">{{ d.description }}</p>
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

          <!-- Bottom note - no buttons: one Save lives in the page header. -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect on the Stock page once you press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page.
            </p>
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
                <span>Reset Design</span>
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
                    <div class="thumb-cust-line tbw-14"></div>
                    <div class="thumb-cust-bar-gold tbw-10"></div>
                  </div>
                </div>

                <!-- Clean Table Thumb -->
                <div *ngIf="d.key === 'clean'" class="thumb-cust-clean-wrap">
                  <div class="thumb-cust-clean-row">
                    <span class="thumb-cust-seq">#1</span>
                    <span class="thumb-cust-line tbw-12"></span>
                    <span class="thumb-cust-pill-blue">VIP</span>
                  </div>
                  <div class="thumb-cust-clean-row">
                    <span class="thumb-cust-seq">#2</span>
                    <span class="thumb-cust-line tbw-10"></span>
                    <span class="thumb-cust-pill-green">REG</span>
                  </div>
                </div>

                <!-- Compact Tiles Thumb -->
                <div *ngIf="d.key === 'compact'" class="thumb-cust-compact-wrap">
                  <div class="thumb-cust-compact-tile">
                    <span class="thumb-cust-avatar-xs">SJ</span>
                    <span class="thumb-cust-line tbw-8"></span>
                  </div>
                  <div class="thumb-cust-compact-tile">
                    <span class="thumb-cust-avatar-xs">RM</span>
                    <span class="thumb-cust-line tbw-8"></span>
                  </div>
                </div>

                <!-- List View Thumb -->
                <div *ngIf="d.key === 'list'" class="thumb-cust-list-wrap">
                  <div class="thumb-cust-list-row">
                    <span class="thumb-cust-check"></span>
                    <span class="thumb-cust-line tbw-14"></span>
                    <span class="thumb-cust-tag-green">Active</span>
                  </div>
                  <div class="thumb-cust-list-row">
                    <span class="thumb-cust-check"></span>
                    <span class="thumb-cust-line tbw-10"></span>
                    <span class="thumb-cust-tag-green">Active</span>
                  </div>
                </div>

                <!-- Card View Thumb -->
                <div *ngIf="d.key === 'card'" class="thumb-cust-card-wrap">
                  <div class="thumb-cust-exec-card">
                    <div class="thumb-cust-card-banner"></div>
                    <div class="thumb-cust-card-body">
                      <div class="thumb-cust-avatar-xs">SJ</div>
                      <span class="thumb-cust-line tbw-10"></span>
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
                <div class="design-kicker">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb">{{ d.description }}</p>
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

          <!-- Bottom note - no buttons: one Save lives in the page header. -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect on the Customer page once you press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page.
            </p>
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
                <span>Reset Design</span>
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
                    <div class="thumb-staff-line tbw-12"></div>
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
                        <div class="thumb-staff-line-neon tbw-10"></div>
                        <div class="thumb-staff-line-dim tbw-6"></div>
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
                      <span class="thumb-staff-line tbw-8"></span>
                      <div class="thumb-staff-roster-gauge"><div class="thumb-staff-gauge-bar" style="width: 75%;"></div></div>
                    </div>
                    <span class="thumb-staff-pill-teal">12/16</span>
                  </div>
                  <div class="thumb-staff-roster-row">
                    <span class="thumb-staff-avatar-xs !bg-teal-100 !text-teal-700">EC</span>
                    <div class="thumb-staff-roster-info">
                      <span class="thumb-staff-line tbw-6"></span>
                      <div class="thumb-staff-roster-gauge"><div class="thumb-staff-gauge-bar" style="width: 45%;"></div></div>
                    </div>
                    <span class="thumb-staff-pill-teal">7/16</span>
                  </div>
                </div>

                <!-- 4. Enterprise SaaS Power Table Thumb -->
                <div *ngIf="d.key === 'list'" class="thumb-staff-list-wrap">
                  <div class="thumb-staff-list-head">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line-head tbw-6"></span>
                    <span class="thumb-staff-line-head tbw-8"></span>
                    <span class="thumb-staff-line-head tbw-4"></span>
                  </div>
                  <div class="thumb-staff-list-row zebra-w">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line tbw-10"></span>
                    <span class="thumb-staff-tag-blue">Lead</span>
                  </div>
                  <div class="thumb-staff-list-row zebra-s">
                    <span class="thumb-staff-check"></span>
                    <span class="thumb-staff-line tbw-8"></span>
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

                <!-- 6. Frosted Glass Aurora Thumb -->
                <div *ngIf="d.key === 'glassmorphism'" class="thumb-staff-glass-wrap">
                  <div class="thumb-staff-glass-card">
                    <div class="thumb-staff-glass-orb"></div>
                    <div class="thumb-staff-avatar-xs !bg-violet-200/50 !text-violet-300 !border !border-violet-300/30 !rounded-full">SJ</div>
                    <div class="thumb-staff-line-glass tbw-10"></div>
                    <div class="thumb-staff-pill-glass">MGR</div>
                  </div>
                </div>

                <!-- 7. Neo-Brutalism Pop Thumb -->
                <div *ngIf="d.key === 'retrobrutalist'" class="thumb-staff-brutal-wrap">
                  <div class="thumb-staff-brutal-card">
                    <div class="thumb-staff-brutal-head"></div>
                    <div class="thumb-staff-brutal-body-inner">
                      <div class="thumb-staff-avatar-xs !bg-cyan-200 !text-black !border-2 !border-black !rounded-none">SJ</div>
                      <div class="thumb-staff-brutal-lines">
                        <div class="thumb-staff-line tbw-10"></div>
                        <div class="thumb-staff-brutal-sticker">ADMIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 8. Flat Metro Grid Thumb -->
                <div *ngIf="d.key === 'metro'" class="thumb-staff-metro-wrap">
                  <div class="thumb-staff-metro-tile tile-blue">
                    <span class="thumb-staff-metro-wm">M</span>
                    <div class="thumb-staff-line-white tbw-10"></div>
                  </div>
                  <div class="thumb-staff-metro-tile tile-red">
                    <span class="thumb-staff-metro-wm">C</span>
                    <div class="thumb-staff-line-white tbw-8"></div>
                  </div>
                  <div class="thumb-staff-metro-tile tile-green">
                    <span class="thumb-staff-metro-wm">S</span>
                    <div class="thumb-staff-line-white tbw-6"></div>
                  </div>
                  <div class="thumb-staff-metro-tile tile-amber">
                    <span class="thumb-staff-metro-wm">L</span>
                    <div class="thumb-staff-line-white tbw-8"></div>
                  </div>
                </div>

                <!-- 9. Vertical Activity Timeline Thumb -->
                <div *ngIf="d.key === 'timeline'" class="thumb-staff-timeline-wrap">
                  <div class="thumb-staff-timeline-track"></div>
                  <div class="thumb-staff-timeline-node-t"></div>
                  <div class="thumb-staff-timeline-bubble">
                    <span class="thumb-staff-avatar-xs !bg-violet-100 !text-violet-600">SJ</span>
                    <span class="thumb-staff-line tbw-8"></span>
                  </div>
                  <div class="thumb-staff-timeline-node-t"></div>
                  <div class="thumb-staff-timeline-bubble">
                    <span class="thumb-staff-avatar-xs !bg-violet-100 !text-violet-600">AR</span>
                    <span class="thumb-staff-line tbw-6"></span>
                  </div>
                </div>

                <!-- 10. Floating Capsule Chips Thumb -->
                <div *ngIf="d.key === 'compactpill'" class="thumb-staff-pill-wrap">
                  <div class="thumb-staff-pill-row">
                    <span class="thumb-staff-avatar-xs !rounded-full !bg-orange-100 !text-orange-600">SJ</span>
                    <span class="thumb-staff-line tbw-8"></span>
                    <span class="thumb-staff-pill-orange">MGR</span>
                  </div>
                  <div class="thumb-staff-pill-row">
                    <span class="thumb-staff-avatar-xs !rounded-full !bg-orange-100 !text-orange-600">EC</span>
                    <span class="thumb-staff-line tbw-6"></span>
                    <span class="thumb-staff-pill-orange">STAFF</span>
                  </div>
                </div>

                <!-- 11. Sci-Fi Radial HUD Thumb -->
                <div *ngIf="d.key === 'radialhud'" class="thumb-staff-hud-wrap">
                  <div class="thumb-staff-hud-card">
                    <div class="thumb-staff-hud-ring">
                      <div class="thumb-staff-avatar-xs !rounded-full !bg-emerald-900/40 !text-emerald-400 !border !border-emerald-400/50">SJ</div>
                    </div>
                    <div class="thumb-staff-line-emerald tbw-10"></div>
                    <div class="thumb-staff-hud-stats">
                      <span class="thumb-staff-hud-box">24</span>
                      <span class="thumb-staff-hud-box">L4</span>
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
                <div class="design-kicker">
                  {{ d.badge || d.subtitle }}
                </div>
                <p class="design-blurb">{{ d.description }}</p>
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

          <!-- Bottom note - no buttons: one Save lives in the page header. -->
          <div class="flex items-center justify-between p-4 md:p-6 mt-4 border-t border-purple-100 bg-purple-50/40 rounded-b-2xl">
            <p class="text-xs text-slate-500 m-0">
              Changes take effect on the Staff Accounts page once you press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page.
            </p>
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
                <span>Reset Design</span>
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
                <div class="design-kicker">
                  {{ t.badge || t.subtitle }}
                </div>
                <p class="design-blurb">{{ t.description }}</p>

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

        <!-- Menu Names -->
        <div class="setting-card">
          <div class="card-header-bar">
            <div>
              <h2 class="card-title">Menu Names</h2>
              <p class="card-subtitle">
                Rename any group or module on the rail to the wording your floor actually uses. Routing,
                icons and permissions are untouched — only the text changes. Leave a box empty to keep the
                name it ships with.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="active-preset-tag" *ngIf="sidebarLayout.hasCustomNames()">
                <strong>{{ renamedCount() }}</strong> renamed
              </span>
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs"
                [disabled]="!sidebarLayout.hasCustomNames()"
                (click)="resetSidebarMenuNames()"
                title="Put every group and module back to its shipped name"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset Names</span>
              </button>
            </div>
          </div>

          <div class="menu-name-groups">
            <section class="menu-name-group" *ngFor="let section of sidebarNavSections">
              <header class="menu-name-group-head">
                <span class="material-symbols-outlined">folder</span>
                <input
                  type="text"
                  class="form-control menu-name-input is-group"
                  [value]="sidebarLayout.sectionLabel(section.id, section.title)"
                  (input)="onSectionNameInput(section, $event)"
                  [attr.placeholder]="section.title"
                  [attr.aria-label]="'Name for the ' + section.title + ' group'"
                />
                <span
                  class="menu-name-shipped"
                  *ngIf="sidebarLayout.sectionNames()[section.id]"
                  [title]="'Ships as ' + section.title"
                >was {{ section.title }}</span>
              </header>

              <div class="menu-name-rows">
                <div class="menu-name-row" *ngFor="let item of section.items">
                  <span class="menu-name-icon">
                    <span class="material-symbols-outlined">{{ item.iconName }}</span>
                  </span>
                  <input
                    type="text"
                    class="form-control menu-name-input"
                    [value]="sidebarLayout.itemLabel(item.id, item.label)"
                    (input)="onItemNameInput(item, $event)"
                    [attr.placeholder]="item.label"
                    [attr.aria-label]="'Name for the ' + item.label + ' module'"
                  />
                  <span class="menu-name-route font-mono">{{ item.route }}</span>
                  <button
                    type="button"
                    class="menu-name-revert"
                    *ngIf="sidebarLayout.itemNames()[item.id]"
                    (click)="revertItemName(item)"
                    [title]="'Back to ' + item.label"
                    [attr.aria-label]="'Reset this module to ' + item.label"
                  >
                    <span class="material-symbols-outlined">undo</span>
                  </button>
                </div>
              </div>
            </section>
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
              The rail on the left updates instantly; press
              <strong class="text-purple-700">Save Configuration</strong> at the top of this page to store
              the template for every till on this store.
            </p>
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

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 5: PRINTER SETTINGS — the physical print stations           -->
      <!-- Receipts & Hardware owns what is *printed*; this tab owns which -->
      <!-- device prints it, how it is reached and how the paper behaves.  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'printer'" class="tab-content-pane">
        <div class="module-note">
          <span class="material-symbols-outlined">info</span>
          <p>
            <strong>Receipts &amp; Hardware</strong> sets the wording printed on a receipt.
            This tab sets the <strong>machines</strong> that print it — one station per role,
            plus how the POS reaches them. The receipt and kitchen print paths pick the
            stations up as soon as they are edited; everything else publishes on save.
          </p>
        </div>

        <div class="three-col-grid">
          <div class="setting-card" *ngFor="let station of printerStations">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">{{ station.icon }}</span>
                <div>
                  <h3 class="card-title-sm">{{ station.title }}</h3>
                  <p class="card-subtitle">{{ station.subtitle }}</p>
                </div>
              </div>
            </div>

            <div class="switch-row">
              <div>
                <div class="switch-row-title">Station Status</div>
                <div class="switch-row-sub">Disabled keeps this station out of the print queue</div>
              </div>
              <app-custom-dropdown
                [options]="stationStatusOptions"
                [(ngModel)]="settingsMap[station.enabledKey]"
                (ngModelChange)="onPrinterConfigChanged()"
                placeholder="Status"
                minWidth="150px"
              ></app-custom-dropdown>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Printer / Queue Name</label>
              <input
                [title]="station.title + ' queue name'"
                type="text"
                [(ngModel)]="settingsMap[station.nameKey]"
                (ngModelChange)="onPrinterConfigChanged()"
                class="control-input"
              />
              <p class="control-hint">Spell it exactly as the operating system lists the printer.</p>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Paper Width</label>
                <app-custom-dropdown
                  [options]="paperWidthOptions"
                  [(ngModel)]="settingsMap[station.widthKey]"
                  (ngModelChange)="onPrinterConfigChanged()"
                  placeholder="Select width"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Copies Per Job</label>
                <input
                  [title]="station.title + ' copies per job'"
                  type="number"
                  min="1"
                  max="5"
                  [(ngModel)]="settingsMap[station.copiesKey]"
                  class="control-input font-mono font-bold text-purple"
                />
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">{{ station.autoLabel }}</label>
              <app-custom-dropdown
                [options]="autoPrintOptions"
                [(ngModel)]="settingsMap[station.autoKey]"
                (ngModelChange)="onPrinterConfigChanged()"
                placeholder="Select behaviour"
                minWidth="100%"
              ></app-custom-dropdown>
            </div>
          </div>
        </div>

        <div class="two-col-grid">
          <!-- How this terminal reaches the hardware -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">cable</span>
                <div>
                  <h3 class="card-title-sm">Device Connection</h3>
                  <p class="card-subtitle">How this terminal reaches the thermal hardware</p>
                </div>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Connection Type</label>
              <app-custom-dropdown
                [options]="printerConnectionOptions"
                [(ngModel)]="settingsMap['PRINTER_CONNECTION']"
                placeholder="Select connection"
                minWidth="100%"
              ></app-custom-dropdown>
            </div>

            <div class="two-input-row" *ngIf="settingsMap['PRINTER_CONNECTION'] === 'network'">
              <div class="form-vertical-group">
                <label class="control-label">Printer IP Address</label>
                <input
                  title="Printer IP address"
                  type="text"
                  [(ngModel)]="settingsMap['PRINTER_DEVICE_IP']"
                  placeholder="192.168.1.50"
                  class="control-input font-mono"
                />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Port</label>
                <input
                  title="Printer network port"
                  type="number"
                  [(ngModel)]="settingsMap['PRINTER_DEVICE_PORT']"
                  class="control-input font-mono font-bold text-purple"
                />
              </div>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Character Set</label>
                <app-custom-dropdown
                  [options]="printerCharsetOptions"
                  [(ngModel)]="settingsMap['PRINTER_CHARSET']"
                  placeholder="Select code page"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Print Density</label>
                <app-custom-dropdown
                  [options]="printerDensityOptions"
                  [(ngModel)]="settingsMap['PRINTER_DENSITY']"
                  placeholder="Select density"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="sub-section-divider">
              <div class="sub-section-title">Verify The Wiring</div>
              <p class="control-hint">
                Sends a sample page through the print dialog using the stations above —
                nothing is billed and no kitchen action is triggered.
              </p>
              <div class="printer-test-actions">
                <button type="button" class="custom-btn btn-outline-purple" (click)="sendTestPrint('receipt')">
                  <span class="material-symbols-outlined">receipt_long</span>
                  <span>Test Receipt</span>
                </button>
                <button type="button" class="custom-btn btn-outline-purple" (click)="sendTestPrint('kot')">
                  <span class="material-symbols-outlined">soup_kitchen</span>
                  <span>Test Kitchen Ticket</span>
                </button>
              </div>
            </div>
          </div>

          <!-- What the paper and drawer do once a job finishes -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">content_cut</span>
                <div>
                  <h3 class="card-title-sm">Paper &amp; Drawer Behaviour</h3>
                  <p class="card-subtitle">What the hardware does once a job finishes</p>
                </div>
              </div>
            </div>

            <div class="switch-stack">
              <div class="switch-row">
                <div>
                  <div class="switch-row-title">Auto Cut Paper</div>
                  <div class="switch-row-sub">Guillotines the roll after every printed job</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['PRINTER_AUTO_CUT']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>

              <div class="switch-row">
                <div>
                  <div class="switch-row-title">Open Cash Drawer</div>
                  <div class="switch-row-sub">Kicks the drawer open on cash settlements</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['PRINTER_CASH_DRAWER']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>

              <div class="switch-row">
                <div>
                  <div class="switch-row-title">Buzzer On Kitchen Ticket</div>
                  <div class="switch-row-sub">Sounds the printer buzzer when a KOT lands</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['PRINTER_BUZZER']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Blank Feed Lines After Cut</label>
              <input
                title="Blank feed lines after cut"
                type="number"
                min="0"
                max="10"
                [(ngModel)]="settingsMap['PRINTER_FEED_LINES']"
                class="control-input font-mono font-bold text-purple"
              />
              <p class="control-hint">Extra blank lines so the tear-off edge clears the print head.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 6: NOTIFICATION SETTINGS — which events raise an alert      -->
      <!-- Super Toaster owns how a toast *looks*; this tab owns which     -->
      <!-- operational events are worth raising, and who they reach.       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'notification'" class="tab-content-pane">
        <div class="module-note">
          <span class="material-symbols-outlined">info</span>
          <p>
            <strong>Super Toaster Notifications</strong> styles the on-screen toast — position,
            duration, animation. This tab decides <strong>which events</strong> are worth raising
            at all, and which channels carry them.
          </p>
        </div>

        <div class="two-col-grid">
          <!-- 1. Which floor events raise an alert -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">notification_important</span>
                <div>
                  <h3 class="card-title-sm">Operational Alert Triggers</h3>
                  <p class="card-subtitle">Floor events the system announces to staff</p>
                </div>
              </div>
            </div>

            <div class="switch-stack">
              <div class="switch-row" *ngFor="let trigger of notificationTriggers">
                <div>
                  <div class="switch-row-title">{{ trigger.title }}</div>
                  <div class="switch-row-sub">{{ trigger.subtitle }}</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap[trigger.key]"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-vertical-group" *ngIf="settingsMap['NOTIFY_LOW_STOCK'] === 'true'">
              <label class="control-label">Low Stock Threshold (units)</label>
              <input
                title="Low stock threshold"
                type="number"
                min="1"
                [(ngModel)]="settingsMap['NOTIFY_LOW_STOCK_THRESHOLD']"
                class="control-input font-mono font-bold text-purple"
              />
              <p class="control-hint">An item at or below this count raises the low-stock alert.</p>
            </div>
          </div>

          <!-- 2. Where a raised alert is delivered -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">forward_to_inbox</span>
                <div>
                  <h3 class="card-title-sm">Delivery Channels</h3>
                  <p class="card-subtitle">Where an alert is sent once it is raised</p>
                </div>
              </div>
            </div>

            <div class="switch-stack">
              <div class="switch-row">
                <div>
                  <div class="switch-row-title">In-App Toast</div>
                  <div class="switch-row-sub">Shown on the terminal that is signed in</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['NOTIFY_CHANNEL_INAPP']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>

              <div class="switch-row">
                <div>
                  <div class="switch-row-title">Desktop Notification</div>
                  <div class="switch-row-sub">System pop-up, even when the POS sits behind another window</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['NOTIFY_CHANNEL_DESKTOP']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>

              <div class="switch-row">
                <div>
                  <div class="switch-row-title">Email</div>
                  <div class="switch-row-sub">Sends owner-facing alerts to a mailbox</div>
                </div>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['NOTIFY_CHANNEL_EMAIL']"
                  placeholder="Select"
                  minWidth="150px"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-vertical-group" *ngIf="settingsMap['NOTIFY_CHANNEL_EMAIL'] === 'true'">
              <label class="control-label">Email Recipients</label>
              <input
                title="Email recipients"
                type="text"
                [(ngModel)]="settingsMap['NOTIFY_EMAIL_RECIPIENTS']"
                placeholder="owner@restaurant.com, manager@restaurant.com"
                class="control-input font-mono"
              />
              <p class="control-hint">Separate several addresses with a comma.</p>
            </div>

            <div class="switch-row">
              <div>
                <div class="switch-row-title">SMS</div>
                <div class="switch-row-sub">Text message for alerts that cannot wait for a screen</div>
              </div>
              <app-custom-dropdown
                [options]="enabledDisabledOptions"
                [(ngModel)]="settingsMap['NOTIFY_CHANNEL_SMS']"
                placeholder="Select"
                minWidth="150px"
              ></app-custom-dropdown>
            </div>

            <div class="form-vertical-group" *ngIf="settingsMap['NOTIFY_CHANNEL_SMS'] === 'true'">
              <label class="control-label">SMS Recipients</label>
              <input
                title="SMS recipients"
                type="text"
                [(ngModel)]="settingsMap['NOTIFY_SMS_RECIPIENTS']"
                placeholder="+91 98765 43210, +91 90000 11111"
                class="control-input font-mono"
              />
              <p class="control-hint">Separate several numbers with a comma.</p>
            </div>
          </div>
        </div>

        <!-- 3. Sound, quiet hours and the daily digest -->
        <div class="setting-card">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">schedule</span>
              <div>
                <h3 class="card-title-sm">Sound, Quiet Hours &amp; Daily Digest</h3>
                <p class="card-subtitle">When an alert may make a noise, and when the day is summarised</p>
              </div>
            </div>
          </div>

          <div class="two-input-row">
            <div class="form-vertical-group">
              <label class="control-label">Alert Sound</label>
              <app-custom-dropdown
                [options]="enabledDisabledOptions"
                [(ngModel)]="settingsMap['NOTIFY_SOUND']"
                placeholder="Select"
                minWidth="100%"
              ></app-custom-dropdown>
            </div>
            <div class="form-vertical-group">
              <label class="control-label">Alert Tone</label>
              <app-custom-dropdown
                [options]="notifyToneOptions"
                [(ngModel)]="settingsMap['NOTIFY_SOUND_TONE']"
                placeholder="Select tone"
                minWidth="100%"
              ></app-custom-dropdown>
            </div>
          </div>

          <div class="sub-section-divider">
            <div class="sub-section-title">Quiet Hours</div>
            <p class="control-hint">
              Alerts still appear on screen inside this window, but stay silent. Leave both
              times empty to never mute.
            </p>
            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Silence From</label>
                <input title="Quiet hours start" type="time" [(ngModel)]="settingsMap['NOTIFY_QUIET_START']" class="control-input font-mono" />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Silence Until</label>
                <input title="Quiet hours end" type="time" [(ngModel)]="settingsMap['NOTIFY_QUIET_END']" class="control-input font-mono" />
              </div>
            </div>
          </div>

          <div class="sub-section-divider">
            <div class="sub-section-title">Daily Sales Digest</div>
            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Send A Daily Summary</label>
                <app-custom-dropdown
                  [options]="enabledDisabledOptions"
                  [(ngModel)]="settingsMap['NOTIFY_DAILY_SUMMARY']"
                  placeholder="Select"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group" *ngIf="settingsMap['NOTIFY_DAILY_SUMMARY'] === 'true'">
                <label class="control-label">Digest Time</label>
                <input title="Daily digest time" type="time" [(ngModel)]="settingsMap['NOTIFY_DAILY_SUMMARY_TIME']" class="control-input font-mono" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- TAB 7: INVOICE SETTINGS — numbering, format and printed blocks  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'invoice'" class="tab-content-pane">
        <div class="preview-strip">
          <div>
            <div class="preview-strip-label">Next Invoice Number</div>
            <div class="preview-strip-value">{{ invoiceNumberPreview }}</div>
          </div>
          <div>
            <div class="preview-strip-label">Series Resets</div>
            <div class="preview-strip-value">{{ invoiceResetLabel }}</div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- LIVE INVOICE PREVIEW                                            -->
        <!-- Sample data, real settings: every field below redraws this the  -->
        <!-- moment it changes, so the paper size, blocks, date format and   -->
        <!-- money format can be judged without printing anything.           -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="setting-card">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">preview</span>
              <div>
                <h3 class="card-title-sm">Live Invoice Preview</h3>
                <p class="card-subtitle">Sample order, your settings — updates as you edit below</p>
              </div>
            </div>
            <span class="active-preset-tag">{{ invoicePaperLabel }}</span>
          </div>

          <div class="invoice-preview-stage">
            <div class="invoice-sheet" [ngClass]="invoicePaperClass">
              <!-- Header: business identity -->
              <div class="inv-head">
                <div class="inv-head-brand">
                  <div class="inv-logo" *ngIf="settingsMap['INVOICE_SHOW_LOGO'] === 'true'">
                    {{ invoiceBrandInitials }}
                  </div>
                  <div>
                    <div class="inv-biz-name">{{ settingsMap['BUSINESS_NAME'] || 'Your Restaurant' }}</div>
                    <div class="inv-biz-line" *ngIf="settingsMap['BUSINESS_ADDRESS']">{{ settingsMap['BUSINESS_ADDRESS'] }}</div>
                    <div class="inv-biz-line" *ngIf="settingsMap['BUSINESS_PHONE']">{{ settingsMap['BUSINESS_PHONE'] }}</div>
                    <div class="inv-biz-line" *ngIf="settingsMap['BUSINESS_GSTIN']">
                      GSTIN: <strong>{{ settingsMap['BUSINESS_GSTIN'] }}</strong>
                    </div>
                  </div>
                </div>
                <div class="inv-head-meta">
                  <div class="inv-doc-title">{{ settingsMap['INVOICE_TITLE'] || 'TAX INVOICE' }}</div>
                  <div class="inv-meta-row"><span>No.</span><strong>{{ invoiceNumberPreview }}</strong></div>
                  <div class="inv-meta-row"><span>Date</span><strong>{{ invoiceIssueDate }}</strong></div>
                  <div class="inv-meta-row" *ngIf="invoiceDueDays > 0"><span>Due</span><strong>{{ invoiceDueDate }}</strong></div>
                </div>
              </div>

              <!-- Line items -->
              <table class="inv-table">
                <thead>
                  <tr>
                    <th class="inv-col-desc">Item</th>
                    <th class="inv-col-num">Qty</th>
                    <th class="inv-col-num">Rate</th>
                    <th class="inv-col-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let line of invoicePreviewItems">
                    <td class="inv-col-desc">{{ line.name }}</td>
                    <td class="inv-col-num">{{ line.qty }}</td>
                    <td class="inv-col-num">{{ invoiceMoney(line.rate) }}</td>
                    <td class="inv-col-num">{{ invoiceMoney(line.qty * line.rate) }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Tax slab table, only when the breakdown is switched on -->
              <table class="inv-table inv-tax-table" *ngIf="settingsMap['INVOICE_SHOW_TAX_BREAKDOWN'] === 'true' && invoiceTaxRate > 0">
                <thead>
                  <tr>
                    <th class="inv-col-desc">Tax</th>
                    <th class="inv-col-num">Taxable</th>
                    <th class="inv-col-num">Rate</th>
                    <th class="inv-col-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="inv-col-desc">{{ invoiceTaxLabel }}</td>
                    <td class="inv-col-num">{{ invoiceMoney(invoiceSubtotal) }}</td>
                    <td class="inv-col-num">{{ invoiceTaxRate }}%</td>
                    <td class="inv-col-num">{{ invoiceMoney(invoiceTaxAmount) }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals -->
              <div class="inv-totals">
                <div class="inv-total-row"><span>Subtotal</span><span>{{ invoiceMoney(invoiceSubtotal) }}</span></div>
                <div class="inv-total-row" *ngIf="invoiceTaxRate > 0">
                  <span>{{ invoiceTaxLabel }} ({{ invoiceTaxRate }}%)</span>
                  <span>{{ invoiceMoney(invoiceTaxAmount) }}</span>
                </div>
                <div class="inv-total-row is-grand"><span>Total</span><span>{{ invoiceMoney(invoiceGrandTotal) }}</span></div>
              </div>

              <!-- Payment QR and signature block -->
              <div
                class="inv-foot-blocks"
                *ngIf="settingsMap['INVOICE_SHOW_QR'] === 'true' || settingsMap['INVOICE_SHOW_SIGNATURE'] === 'true'"
              >
                <div class="inv-qr-block" *ngIf="settingsMap['INVOICE_SHOW_QR'] === 'true'">
                  <!-- Stand-in for the real code: the invoice printer renders
                       the scannable one, this only holds its place. -->
                  <div class="inv-qr-glyph" aria-hidden="true"></div>
                  <div class="inv-qr-text">
                    <div>Scan to pay</div>
                    <strong>{{ settingsMap['INVOICE_UPI_ID'] || 'restaurant@upi' }}</strong>
                  </div>
                </div>
                <div class="inv-sign-block" *ngIf="settingsMap['INVOICE_SHOW_SIGNATURE'] === 'true'">
                  <div class="inv-sign-rule"></div>
                  <div>{{ settingsMap['INVOICE_SIGNATORY'] || 'Authorised Signatory' }}</div>
                </div>
              </div>

              <!-- Legal text -->
              <div class="inv-terms" *ngIf="settingsMap['INVOICE_TERMS']">
                <div class="inv-terms-label">Terms &amp; Conditions</div>
                <div>{{ settingsMap['INVOICE_TERMS'] }}</div>
              </div>
              <div class="inv-footer-note" *ngIf="settingsMap['INVOICE_FOOTER_NOTE']">
                {{ settingsMap['INVOICE_FOOTER_NOTE'] }}
              </div>
            </div>
          </div>
        </div>

        <div class="two-col-grid">
          <!-- 1. How every invoice reference is composed -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">tag</span>
                <div>
                  <h3 class="card-title-sm">Invoice Numbering Series</h3>
                  <p class="card-subtitle">How every invoice reference is composed</p>
                </div>
              </div>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Prefix</label>
                <input title="Invoice prefix" type="text" [(ngModel)]="settingsMap['INVOICE_PREFIX']" placeholder="INV-" class="control-input font-mono font-bold" />
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Next Number</label>
                <input title="Next invoice number" type="number" min="1" [(ngModel)]="settingsMap['INVOICE_NEXT_NUMBER']" class="control-input font-mono font-bold text-purple" />
              </div>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Number Padding</label>
                <app-custom-dropdown
                  [options]="invoicePadOptions"
                  [(ngModel)]="settingsMap['INVOICE_PAD_LENGTH']"
                  placeholder="Select padding"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Reset Cycle</label>
                <app-custom-dropdown
                  [options]="invoiceResetOptions"
                  [(ngModel)]="settingsMap['INVOICE_RESET_CYCLE']"
                  placeholder="Select cycle"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <p class="control-hint">
              Moving the next number forward never renumbers invoices already issued — the
              series simply continues from the value set here.
            </p>
          </div>

          <!-- 2. Paper, dates and how money is written -->
          <div class="setting-card">
            <div class="card-header-bar pb-3">
              <div class="flex-align-center gap-2">
                <span class="material-symbols-outlined icon-purple">description</span>
                <div>
                  <h3 class="card-title-sm">Document Format</h3>
                  <p class="card-subtitle">Paper, dates and how money is written</p>
                </div>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Document Title</label>
              <input title="Invoice document title" type="text" [(ngModel)]="settingsMap['INVOICE_TITLE']" placeholder="TAX INVOICE" class="control-input font-bold" />
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Paper Size</label>
                <app-custom-dropdown
                  [options]="invoicePaperOptions"
                  [(ngModel)]="settingsMap['INVOICE_PAPER_SIZE']"
                  placeholder="Select size"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Date Format</label>
                <app-custom-dropdown
                  [options]="invoiceDateFormatOptions"
                  [(ngModel)]="settingsMap['INVOICE_DATE_FORMAT']"
                  placeholder="Select format"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="two-input-row">
              <div class="form-vertical-group">
                <label class="control-label">Decimal Places</label>
                <app-custom-dropdown
                  [options]="invoiceDecimalOptions"
                  [(ngModel)]="settingsMap['INVOICE_DECIMALS']"
                  placeholder="Select precision"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
              <div class="form-vertical-group">
                <label class="control-label">Currency Position</label>
                <app-custom-dropdown
                  [options]="invoiceCurrencyPositionOptions"
                  [(ngModel)]="settingsMap['INVOICE_CURRENCY_POSITION']"
                  placeholder="Select position"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-vertical-group">
              <label class="control-label">Payment Due (days)</label>
              <input title="Payment due days" type="number" min="0" [(ngModel)]="settingsMap['INVOICE_DUE_DAYS']" class="control-input font-mono font-bold text-purple" />
              <p class="control-hint">Zero prints the invoice as payable immediately.</p>
            </div>
          </div>
        </div>

        <!-- 3. What appears besides the line items -->
        <div class="setting-card">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">checklist</span>
              <div>
                <h3 class="card-title-sm">Printed Blocks &amp; Legal Text</h3>
                <p class="card-subtitle">What appears on the invoice besides the line items</p>
              </div>
            </div>
          </div>

          <div class="switch-stack">
            <div class="switch-row" *ngFor="let block of invoiceBlocks">
              <div>
                <div class="switch-row-title">{{ block.title }}</div>
                <div class="switch-row-sub">{{ block.subtitle }}</div>
              </div>
              <app-custom-dropdown
                [options]="shownHiddenOptions"
                [(ngModel)]="settingsMap[block.key]"
                placeholder="Select"
                minWidth="150px"
              ></app-custom-dropdown>
            </div>
          </div>

          <div class="two-input-row">
            <div class="form-vertical-group" *ngIf="settingsMap['INVOICE_SHOW_QR'] === 'true'">
              <label class="control-label">UPI / Payment ID For The QR</label>
              <input title="UPI payment id" type="text" [(ngModel)]="settingsMap['INVOICE_UPI_ID']" placeholder="restaurant@upi" class="control-input font-mono" />
            </div>
            <div class="form-vertical-group" *ngIf="settingsMap['INVOICE_SHOW_SIGNATURE'] === 'true'">
              <label class="control-label">Signatory Line</label>
              <input title="Signatory line" type="text" [(ngModel)]="settingsMap['INVOICE_SIGNATORY']" placeholder="Authorised Signatory" class="control-input" />
            </div>
          </div>

          <div class="form-vertical-group">
            <label class="control-label">Terms &amp; Conditions</label>
            <textarea [(ngModel)]="settingsMap['INVOICE_TERMS']" rows="3" class="control-textarea"></textarea>
          </div>

          <div class="form-vertical-group">
            <label class="control-label">Invoice Footer Note</label>
            <textarea [(ngModel)]="settingsMap['INVOICE_FOOTER_NOTE']" rows="2" class="control-textarea"></textarea>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DATA BACKUP                                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="activeTab === 'databackup'" class="tab-content-pane">
        <div class="preview-strip">
          <div>
            <div class="preview-strip-label">Backup File Name</div>
            <div class="preview-strip-value">{{ backupFileName }}</div>
          </div>
          <div>
            <div class="preview-strip-label">Tables</div>
            <div class="preview-strip-value">{{ backupInfo ? backupInfo.totalTables : '—' }}</div>
          </div>
          <div>
            <div class="preview-strip-label">Approx. Size</div>
            <div class="preview-strip-value">{{ backupInfo ? formatBytes(backupInfo.totalSizeBytes) : '—' }}</div>
          </div>
        </div>

        <div class="setting-card">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">cloud_download</span>
              <div>
                <h3 class="card-title-sm">Back Up The Database</h3>
                <p class="card-subtitle">
                  Exports every table and every row to a single .sql file you can restore from
                </p>
              </div>
            </div>
            <span class="active-preset-tag" *ngIf="backupInfo">{{ backupInfo.database }}</span>
          </div>

          <div class="backup-body">
            <!-- ─────────────────────────────────────────────────────────── -->
            <!-- BACKUP LOCATION                                             -->
            <!-- A path on the machine running the POS server. Said plainly   -->
            <!-- because on a multi-PC install it is NOT the machine the      -->
            <!-- operator is sitting at, and a wrong assumption there means   -->
            <!-- looking for backups on the wrong computer.                   -->
            <!-- ─────────────────────────────────────────────────────────── -->
            <div class="form-vertical-group">
              <label class="control-label" for="backupFolderPath">Backup Location</label>
              <div class="backup-path-row">
                <input
                  id="backupFolderPath"
                  type="text"
                  class="control-input"
                  [(ngModel)]="backupFolderPath"
                  (ngModelChange)="backupFolderDirty = true; backupFolderCheck = null"
                  placeholder="C:\POS Backups"
                  spellcheck="false"
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="btn-path-browse"
                  [disabled]="isPickingNatively"
                  title="Browse for a folder on the POS server"
                  (click)="openFolderBrowser()"
                >
                  <span class="material-symbols-outlined" [class.is-spinning]="isPickingNatively">
                    {{ isPickingNatively ? 'progress_activity' : 'folder_open' }}
                  </span>
                  <span>{{ isPickingNatively ? 'Waiting…' : 'Browse' }}</span>
                </button>

                <button
                  type="button"
                  class="btn-path-save"
                  [disabled]="isSavingFolder || !backupFolderPath.trim()"
                  (click)="saveBackupFolder()"
                >
                  <span class="material-symbols-outlined" [class.is-spinning]="isSavingFolder">
                    {{ isSavingFolder ? 'progress_activity' : 'save' }}
                  </span>
                  <span>{{ isSavingFolder ? 'Checking…' : 'Save Location' }}</span>
                </button>
              </div>

              <p class="control-hint">
                Full path on the computer running the POS server — the same PC as this browser on a
                standard single-machine install. Every backup is written here automatically.
              </p>

              <div
                class="backup-path-status"
                *ngIf="backupFolderCheck"
                [class.is-ok]="backupFolderCheck.ok"
                [class.is-bad]="!backupFolderCheck.ok"
              >
                <span class="material-symbols-outlined">
                  {{ backupFolderCheck.ok ? 'check_circle' : 'error' }}
                </span>
                <span>{{ backupFolderCheck.message }}</span>
              </div>

              <!-- Offered only when the folder is genuinely missing, so the
                   operator can create it without leaving the screen. -->
              <button
                type="button"
                class="btn-path-create"
                *ngIf="backupFolderCheck && !backupFolderCheck.ok && !backupFolderCheck.exists && backupFolderPath.trim()"
                [disabled]="isSavingFolder"
                (click)="saveBackupFolder(true)"
              >
                <span class="material-symbols-outlined">create_new_folder</span>
                <span>Create this folder and use it</span>
              </button>
            </div>

            <div class="backup-note" *ngIf="backupFolderConfigured">
              <span class="material-symbols-outlined">folder_open</span>
              <p>
                <strong>Backup Now</strong> writes <strong>{{ backupFileName }}</strong> into
                <strong>{{ backupFolderSaved }}</strong>. If a backup for today is already there,
                the new one is saved as <strong>{{ backupSecondFileName }}</strong> so nothing is
                overwritten.
              </p>
            </div>

            <div class="backup-note is-warning" *ngIf="!backupFolderConfigured && backupSupportsFolder">
              <span class="material-symbols-outlined">info</span>
              <p>
                No location set yet, so <strong>Backup Now</strong> will ask you to choose a folder
                each time. Set a location above to have every backup saved there automatically.
              </p>
            </div>

            <!-- Firefox and Safari cannot let a page write to a chosen folder,
                 so the UI says where the file will actually land rather than
                 implying the location was picked. -->
            <div class="backup-note is-warning" *ngIf="!backupFolderConfigured && !backupSupportsFolder">
              <span class="material-symbols-outlined">info</span>
              <p>
                No location set, and this browser cannot open a folder picker, so the backup will go
                to your <strong>downloads folder</strong> as <strong>{{ backupFileName }}</strong>.
                Set a location above to save backups on the server instead.
              </p>
            </div>

            <div class="backup-actions">
              <button
                type="button"
                class="btn-backup-now"
                [disabled]="isBackingUp"
                (click)="runBackup()"
              >
                <span class="material-symbols-outlined" [class.is-spinning]="isBackingUp">
                  {{ isBackingUp ? 'progress_activity' : 'backup' }}
                </span>
                <span>{{ isBackingUp ? 'Backing up…' : 'Backup Now' }}</span>
              </button>

              <div class="backup-status" *ngIf="backupStatus">
                <span
                  class="material-symbols-outlined"
                  [class.status-ok]="backupStatus.kind === 'ok'"
                  [class.status-bad]="backupStatus.kind === 'error'"
                >
                  {{ backupStatus.kind === 'ok' ? 'check_circle' : 'error' }}
                </span>
                <span>{{ backupStatus.message }}</span>
              </div>
            </div>

            <div class="backup-safety">
              <span class="material-symbols-outlined">verified_user</span>
              <span>
                Reading only — a backup never changes, deletes or locks your data.
              </span>
            </div>
          </div>
        </div>

        <div class="setting-card" *ngIf="backupInfo">
          <div class="card-header-bar pb-3">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">table_rows</span>
              <div>
                <h3 class="card-title-sm">What Gets Backed Up</h3>
                <p class="card-subtitle">
                  {{ backupInfo.totalTables }} tables, roughly
                  {{ backupInfo.totalRows | number }} rows
                </p>
              </div>
            </div>
          </div>

          <div class="backup-table-grid">
            <div class="backup-table-chip" *ngFor="let t of backupInfo.tables">
              <span class="chip-name">{{ t.name }}</span>
              <span class="chip-rows">{{ t.rows | number }}</span>
            </div>
          </div>

          <p class="backup-footnote">
            Row counts are the database's own estimates. Uploaded images live on disk, not in the
            database, so they are not part of this file.
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- FOLDER BROWSER                                                  -->
      <!-- Browses the POS server's filesystem, because the destination     -->
      <!-- must be a path the API can write to and the browser's own picker  -->
      <!-- never reveals a path.                                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="fb-backdrop" *ngIf="showFolderBrowser" (click)="closeFolderBrowser()">
        <div class="fb-dialog" (click)="$event.stopPropagation()">
          <div class="fb-head">
            <div class="flex-align-center gap-2">
              <span class="material-symbols-outlined icon-purple">folder_open</span>
              <div>
                <h3 class="card-title-sm">Choose Backup Folder</h3>
                <p class="card-subtitle">Folders on the computer running the POS server</p>
              </div>
            </div>
            <button type="button" class="fb-close" (click)="closeFolderBrowser()" title="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="fb-bar">
            <button
              type="button"
              class="fb-icon-btn"
              [disabled]="!browseResult?.parent || isBrowsing"
              title="Up one level"
              (click)="browseTo(browseResult!.parent!)"
            >
              <span class="material-symbols-outlined">arrow_upward</span>
            </button>

            <div class="fb-path">{{ browseResult?.path || 'This computer' }}</div>

            <button
              type="button"
              class="fb-icon-btn"
              [disabled]="isBrowsing || !browseResult?.path"
              title="New folder here"
              (click)="startNewFolder()"
            >
              <span class="material-symbols-outlined">create_new_folder</span>
            </button>
          </div>

          <div class="fb-drives" *ngIf="browseResult?.roots?.length">
            <button
              type="button"
              class="fb-drive"
              *ngFor="let d of browseResult!.roots"
              [class.is-active]="browseResult!.path === d.path"
              (click)="browseTo(d.path)"
            >
              <span class="material-symbols-outlined">hard_drive</span>
              <span>{{ d.name }}</span>
            </button>
          </div>

          <!-- Inline new-folder row, shown only while naming one. -->
          <div class="fb-newfolder" *ngIf="isNamingFolder">
            <span class="material-symbols-outlined">create_new_folder</span>
            <input
              type="text"
              class="control-input"
              [(ngModel)]="newFolderName"
              placeholder="Folder name"
              (keyup.enter)="createFolderHere()"
              (keyup.escape)="isNamingFolder = false"
              #newFolderInput
            />
            <button type="button" class="btn-path-save" [disabled]="isCreatingFolder" (click)="createFolderHere()">
              <span class="material-symbols-outlined" [class.is-spinning]="isCreatingFolder">
                {{ isCreatingFolder ? 'progress_activity' : 'check' }}
              </span>
              <span>Create</span>
            </button>
            <button type="button" class="fb-icon-btn" (click)="isNamingFolder = false" title="Cancel">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="fb-list">
            <div class="fb-loading" *ngIf="isBrowsing">
              <span class="material-symbols-outlined is-spinning">progress_activity</span>
              <span>Reading folder…</span>
            </div>

            <div class="fb-error" *ngIf="!isBrowsing && browseResult?.error">
              <span class="material-symbols-outlined">lock</span>
              <span>{{ browseResult!.error }}</span>
            </div>

            <div
              class="fb-empty"
              *ngIf="!isBrowsing && !browseResult?.error && browseResult?.folders?.length === 0"
            >
              <span class="material-symbols-outlined">folder_off</span>
              <span>No sub-folders here. You can still select this folder.</span>
            </div>

            <button
              type="button"
              class="fb-row"
              *ngFor="let f of browseResult?.folders"
              (dblclick)="browseTo(f.path)"
              (click)="selectedBrowsePath = f.path"
              [class.is-selected]="selectedBrowsePath === f.path"
            >
              <span class="material-symbols-outlined">folder</span>
              <span class="fb-row-name">{{ f.name }}</span>
              <span
                class="material-symbols-outlined fb-enter"
                title="Open"
                (click)="$event.stopPropagation(); browseTo(f.path)"
                >chevron_right</span
              >
            </button>
          </div>

          <div class="fb-foot">
            <div class="fb-chosen">
              <span class="fb-chosen-label">Selected</span>
              <span class="fb-chosen-path">{{ selectedBrowsePath || browseResult?.path || '—' }}</span>
            </div>
            <div class="fb-foot-actions">
              <button type="button" class="btn-path-browse" (click)="closeFolderBrowser()">Cancel</button>
              <button
                type="button"
                class="btn-backup-now"
                [disabled]="!(selectedBrowsePath || browseResult?.path)"
                (click)="useSelectedFolder()"
              >
                <span class="material-symbols-outlined">check</span>
                <span>Use This Folder</span>
              </button>
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
      /* Sticky: it now carries the only Save on the page, so it has to stay
         reachable however far down a customize tab the user has scrolled. */
      .settings-header-card {
        position: sticky;
        top: 0;
        z-index: 30;
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
        box-shadow: 0 2px 8px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
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
        box-shadow: 0 4px 14px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      .btn-gradient-purple:hover {
        background: linear-gradient(135deg, var(--primary-hover, #9333EA) 0%, var(--primary, #7E22CE) 100%);
        box-shadow: 0 8px 22px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
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
        box-shadow: 0 4px 12px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
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
        box-shadow: 0 4px 12px -6px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
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

      /* ═══════════════════════════════════════════════════════════════ */
      /* LIVE INVOICE PREVIEW                                            */
      /* ═══════════════════════════════════════════════════════════════ */
      /* The sheet is intentionally printed-paper white and near-black in
         both themes: an invoice does not follow the brand palette, and
         showing it recoloured would misrepresent what comes out of the
         printer. Only the stage around it follows the theme. */
      .invoice-preview-stage {
        display: flex;
        justify-content: center;
        padding: 1.25rem;
        border-radius: 16px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px dashed var(--card-border, #E9D5FF);
        overflow-x: auto;
      }

      .invoice-sheet {
        width: 100%;
        flex-shrink: 0;
        background: #ffffff;
        color: #1f2937;
        border-radius: 6px;
        box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.35);
        padding: 1.5rem 1.6rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.75rem;
        line-height: 1.5;
      }

      .invoice-sheet.is-a4 { max-width: 700px; }
      .invoice-sheet.is-a5 { max-width: 500px; }

      /* The till roll is genuinely this narrow, so the preview stops
         pretending otherwise: one column, monospace, no rules. */
      .invoice-sheet.is-thermal {
        max-width: 300px;
        padding: 1.1rem 0.9rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.6875rem;
      }

      .inv-head {
        display: flex;
        justify-content: space-between;
        gap: 1.25rem;
        padding-bottom: 0.9rem;
        border-bottom: 2px solid #111827;
      }

      .invoice-sheet.is-thermal .inv-head {
        flex-direction: column;
        text-align: center;
        gap: 0.6rem;
        border-bottom-style: dashed;
        border-bottom-width: 1px;
      }

      .inv-head-brand {
        display: flex;
        gap: 0.7rem;
        align-items: flex-start;
        min-width: 0;
      }

      .invoice-sheet.is-thermal .inv-head-brand {
        flex-direction: column;
        align-items: center;
      }

      .inv-logo {
        flex-shrink: 0;
        width: 2.6rem;
        height: 2.6rem;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #111827;
        color: #ffffff;
        font-weight: 800;
        font-size: 0.8125rem;
        letter-spacing: 0.02em;
      }

      .inv-biz-name {
        font-weight: 800;
        font-size: 0.9375rem;
        color: #111827;
        line-height: 1.25;
      }

      .inv-biz-line {
        font-size: 0.6875rem;
        color: #4b5563;
        white-space: pre-line;
      }

      .inv-head-meta {
        text-align: right;
        flex-shrink: 0;
      }

      .invoice-sheet.is-thermal .inv-head-meta { text-align: center; }

      .inv-doc-title {
        font-weight: 800;
        font-size: 0.9375rem;
        letter-spacing: 0.08em;
        color: #111827;
        margin-bottom: 0.35rem;
      }

      .inv-meta-row {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: #4b5563;
      }

      .invoice-sheet.is-thermal .inv-meta-row { justify-content: center; }

      .inv-meta-row strong { color: #111827; }

      .inv-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.9rem;
      }

      .inv-table th {
        text-align: left;
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
        border-bottom: 1px solid #d1d5db;
        padding: 0.35rem 0.4rem;
      }

      .inv-table td {
        padding: 0.4rem;
        border-bottom: 1px solid #f3f4f6;
        color: #1f2937;
      }

      .inv-col-num { text-align: right; white-space: nowrap; }
      .inv-table th.inv-col-num { text-align: right; }

      .inv-tax-table { margin-top: 0.75rem; }

      .inv-totals {
        margin-top: 0.85rem;
        margin-left: auto;
        width: 62%;
      }

      .invoice-sheet.is-thermal .inv-totals { width: 100%; }

      .inv-total-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.22rem 0;
        color: #4b5563;
      }

      .inv-total-row.is-grand {
        margin-top: 0.3rem;
        padding-top: 0.45rem;
        border-top: 2px solid var(--text-main, #111827);
        font-weight: 800;
        font-size: 0.875rem;
        color: var(--text-main, #111827);
      }

      .inv-foot-blocks {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1.25rem;
        margin-top: 1.4rem;
      }

      .invoice-sheet.is-thermal .inv-foot-blocks {
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
      }

      .inv-qr-block {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      /* A placeholder, not a scannable code — the print path renders the
         real one. The checker pattern reads as "QR goes here" at a glance. */
      .inv-qr-glyph {
        width: 3.1rem;
        height: 3.1rem;
        flex-shrink: 0;
        border: 2px solid #111827;
        border-radius: 4px;
        background-image:
          linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%),
          linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%);
        background-size: 0.62rem 0.62rem;
        background-position: 0 0, 0.31rem 0.31rem;
      }

      .inv-qr-text { font-size: 0.625rem; color: #4b5563; }
      .inv-qr-text strong { display: block; color: #111827; font-size: 0.6875rem; }

      .inv-sign-block {
        text-align: center;
        font-size: 0.6875rem;
        color: #4b5563;
        min-width: 9rem;
      }

      .inv-sign-rule {
        height: 2.2rem;
        border-bottom: 1px solid #9ca3af;
        margin-bottom: 0.3rem;
      }

      .inv-terms {
        margin-top: 1.3rem;
        padding-top: 0.7rem;
        border-top: 1px dashed #d1d5db;
        font-size: 0.625rem;
        color: #4b5563;
        white-space: pre-line;
      }

      .inv-terms-label {
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #111827;
        margin-bottom: 0.15rem;
      }

      .inv-footer-note {
        margin-top: 0.8rem;
        text-align: center;
        font-size: 0.6875rem;
        font-style: italic;
        color: #4b5563;
        white-space: pre-line;
      }

      /* ─── Brand Theme sub-tab rail ─── */
      /* Plain text tabs on a hairline: the active one goes bold and claims its
         stretch of the rule. No pills or icons here, so the main rail above
         stays the louder of the two. */
      .subtab-scroll-shell {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        min-width: 0;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }

      .subtab-nav-bar {
        display: flex;
        align-items: stretch;
        gap: 1.75rem;
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        scroll-behavior: smooth;
        touch-action: pan-x;
        cursor: grab;
        scrollbar-width: none;
      }

      .subtab-nav-bar.is-dragging {
        cursor: grabbing;
        scroll-behavior: auto;
        -webkit-user-select: none;
        user-select: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .subtab-nav-bar { scroll-behavior: auto; }
      }

      .subtab-nav-bar::-webkit-scrollbar {
        display: none;
      }

      .subtab-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding: 0.7rem 0.15rem 0.8rem;
        border: none;
        background: none;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-muted, #7C6BA0);
        cursor: pointer;
        outline: none;
        white-space: nowrap;
        user-select: none;
        transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Sits on the shell's hairline rather than under it, so the two read as
         one line the active tab has taken over. */
      .subtab-btn::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        border-radius: 2px;
        background: var(--primary, #7E22CE);
        opacity: 0;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .subtab-btn:hover {
        color: var(--text-main, #2E1065);
      }

      .subtab-btn.is-active {
        color: var(--text-main, #2E1065);
        font-weight: 800;
      }

      .subtab-btn.is-active::after {
        opacity: 1;
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
      align-items: stretch;
    }

    .design-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 0.85rem;
      height: 100%;
      box-sizing: border-box;
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
      box-shadow: 0 10px 24px -10px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
    }

    .design-card.is-selected {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 0 0 4px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
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
      box-shadow: 0 4px 12px -6px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
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
      margin: 0;
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
    /* Five-card choosers: auto-fit used to leave a single orphan card on its
       own row at common widths. An explicit column ladder keeps the set
       balanced — all five abreast on a wide screen, then 3 / 2 / 1. */
    .design-grid.is-five { grid-template-columns: repeat(5, minmax(0, 1fr)); }

    @media (max-width: 1439px) {
      .design-grid.is-five { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 1023px) {
      .design-grid.is-five { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 639px) {
      .design-grid,
      .design-grid.is-five {
        grid-template-columns: minmax(0, 1fr);
        padding: 1rem 1rem 1.25rem;
        gap: 0.9rem;
      }
    }

    .design-name { display: inline-flex; align-items: center; gap: 0.35rem; }
    .design-name .design-name-icon { font-size: 16px; color: var(--primary, #7E22CE); }

    /* The meta block had no layout of its own, so its rows relied entirely on
       utility margins and sat unevenly. It owns its rhythm now, and grows to
       fill the card so every card in a row ends at the same height. */
    .design-meta {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
      min-width: 0;
    }

    /* "DESIGN 1 · BENTO" kicker. Replaces a text-purple-600 / text-blue-600
       utility pair that is not defined in styles.css, so the line was
       rendering in the default near-black instead of the accent. */
    .design-kicker {
      font-size: 0.625rem;
      font-weight: 800;
      line-height: 1.3;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary, #7E22CE);
    }

    /* Note explaining which of the two design settings owns the grid. */
    .design-override-note {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      margin: 0 1.5rem;
      padding: 0.7rem 0.9rem;
      border-radius: 12px;
      border: 1px solid var(--primary, #C084FC);
      background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.09));
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
      box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.25));
    }

    .switch-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
      min-width: 2.4rem;
    }

    /* ─── POS Customization: one switch per page ───────────────────────── */
    .custom-count-pill {
      flex-shrink: 0;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--bg-app, #FAF5FF);
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--text-main, #2E1065);
      white-space: nowrap;
    }

    .custom-master {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .custom-master .switch-label { min-width: 3.9rem; }

    /* Some on, some off: the knob sits centred so the master switch never
       claims a state none of the eight pages are actually in. */
    .custom-master .switch-track.is-mixed {
      background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.25));
      border-color: var(--primary, #C084FC);
    }

    .custom-master .switch-track.is-mixed .switch-knob { left: 0.74rem; }

    .custom-master .switch-row input:disabled + .switch-track {
      opacity: 0.55;
      cursor: progress;
    }

    .custom-row-list {
      display: flex;
      flex-direction: column;
      padding: 0.35rem 1.5rem 1.5rem;
    }

    .custom-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0.15rem;
      border-bottom: 1px solid var(--card-border, #E9D5FF);
    }

    .custom-row:last-child { border-bottom: none; }

    .custom-row-icon {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 12px;
      border: 1.5px solid var(--card-border, #E9D5FF);
      background: var(--bg-app, #FAF5FF);
      color: var(--text-muted, #6B7280);
      font-size: 20px;
      transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }

    .custom-row.is-on .custom-row-icon {
      border-color: var(--primary, #C084FC);
      background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.09));
      color: var(--primary, #7E22CE);
    }

    .custom-row-text { flex: 1; min-width: 0; }

    .custom-row-name {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    .custom-row-desc {
      margin: 0.15rem 0 0;
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--text-muted, #6B7280);
    }

    .custom-row-status {
      margin: 0.3rem 0 0;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted, #6B7280);
    }

    .custom-row-status strong {
      font-weight: 900;
      letter-spacing: 0.04em;
      color: var(--text-muted, #6B7280);
    }

    .custom-row-status strong.is-on { color: var(--primary, #7E22CE); }

    .custom-row-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .custom-row-actions .switch-row input:disabled + .switch-track {
      opacity: 0.55;
      cursor: progress;
    }

    @media (max-width: 720px) {
      .custom-row {
        flex-wrap: wrap;
        row-gap: 0.75rem;
      }

      .custom-row-text { flex-basis: calc(100% - 3.5rem); }

      .custom-row-actions {
        flex-basis: 100%;
        justify-content: space-between;
      }
    }

    /* Applied-or-not bar shown above every customize tab. */
    .customization-status-bar {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      margin: 0 0 1.25rem;
      padding: 0.7rem 0.95rem;
      border-radius: 14px;
      border: 1.5px solid var(--primary, #C084FC);
      background: var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.09));
    }

    .customization-status-bar.is-off {
      border-color: var(--card-border, #E9D5FF);
      background: var(--bg-app, #FAF5FF);
    }

    .customization-status-bar .material-symbols-outlined {
      flex-shrink: 0;
      font-size: 20px;
      color: var(--primary, #7E22CE);
    }

    .customization-status-bar.is-off .material-symbols-outlined {
      color: var(--text-muted, #6B7280);
    }

    .customization-status-bar p {
      flex: 1;
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.55;
      color: var(--text-main, #2E1065);
    }

    .customization-status-bar .note-action {
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

    .customization-status-bar .note-action:hover:not(:disabled) {
      background: var(--bg-app, #FAF5FF);
    }

    .customization-status-bar .note-action:disabled {
      opacity: 0.55;
      cursor: progress;
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
      background: var(--card-border, #E2E8F0);
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
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 4px;
    }
    .thumb-list-code { font-size: 8px; font-weight: 800; font-family: monospace; color: #0F172A; }
    .thumb-list-bar { height: 4px; width: 40px; background: var(--card-border, #CBD5E1); border-radius: 2px; }
    .thumb-list-pill { width: 8px; height: 8px; border-radius: 50%; }
    .thumb-list-pill.is-busy { background: #F97316; }
    .thumb-list-pill.is-free { background: #10B981; }
    .thumb-list-pill.is-blocked { background: var(--danger, #EF4444); }

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
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 6px;
    }
    .thumb-cl-badge {
      font-size: 8px;
      font-weight: 800;
      color: #FFFFFF;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .thumb-cl-badge.is-busy { background: var(--primary, #7E22CE); }
    .thumb-cl-badge.is-free { background: #10B981; }
    .thumb-cl-body { display: flex; flex-direction: column; gap: 3px; }
    .thumb-cl-line { height: 3px; background: var(--text-dim, #94A3B8); border-radius: 2px; }
    .thumb-cl-dwell { height: 2px; width: 30px; background: #F97316; border-radius: 1px; }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* CATEGORY DESIGN CHOOSER MINI THUMBNAILS                            */
    /* ═══════════════════════════════════════════════════════════════════ */
    .category-mini-thumb {
      height: 112px;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: stretch;
      padding: 9px;
      background: linear-gradient(135deg, #FDFCFF 0%, #F5F3FF 100%);
      border: 1px solid #EDE9FE;
      position: relative;
      box-sizing: border-box;
      transition: box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                  border-color 0.25s ease;
    }
    .design-card:hover .category-mini-thumb {
      border-color: #C084FC;
      box-shadow: 0 10px 22px -14px rgba(var(--primary-rgb, 126, 34, 206), 0.65);
    }
    .design-card.is-selected .category-mini-thumb {
      border-color: var(--primary-hover, #A855F7);
    }

    /* ═══════════════════════════════════════════════════════════════════ */
    /* THUMBNAIL BAR WIDTHS                                               */
    /* Every design chooser draws its "text" as thin bars and used to size */
    /* them with the global .w-N utilities. Those set width AND height,    */
    /* both !important (they exist for square icon boxes), so each bar     */
    /* rendered as a block — and .w-14 is not defined at all, so those     */
    /* bars collapsed to nothing. These are width-only replacements that   */
    /* keep the original 0.25rem scale.                                    */
    /* ═══════════════════════════════════════════════════════════════════ */
    .tbw-4 { width: 16px; }
    .tbw-6 { width: 24px; }
    .tbw-8 { width: 32px; }
    .tbw-10 { width: 40px; }
    .tbw-12 { width: 48px; }
    .tbw-14 { width: 56px; }
    .tbw-16 { width: 64px; }

    /* Percentage width helpers for the rebuilt category thumbnails. */
    .category-mini-thumb .cw-20 { width: 20%; }
    .category-mini-thumb .cw-25 { width: 25%; }
    .category-mini-thumb .cw-40 { width: 40%; }
    .category-mini-thumb .cw-45 { width: 45%; }
    .category-mini-thumb .cw-50 { width: 50%; }
    .category-mini-thumb .cw-60 { width: 60%; }
    .category-mini-thumb .cw-70 { width: 70%; }
    .category-mini-thumb .cw-75 { width: 75%; }

    /* Shared miniature primitives */
    .cat-thumb {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .cat-line {
      display: block;
      height: 4px;
      border-radius: 2px;
      background: var(--card-border, #CBD5E1);
      flex-shrink: 0;
    }
    .cat-line.is-title { height: 5px; background: #5B21B6; }
    .cat-line.is-name { height: 4px; background: #7C3AED; }
    .cat-stack { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .cat-stack.is-grow { flex: 1; }
    .cat-avatar {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      background: var(--primary-light, #F3E8FF);
      border: 1px solid var(--card-border, #E9D5FF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      line-height: 1;
      flex-shrink: 0;
    }
    .cat-avatar.is-lg { width: 26px; height: 26px; border-radius: 8px; font-size: 14px; }
    .cat-avatar.is-sm { width: 14px; height: 14px; border-radius: 5px; background: #EDE9FE; }
    .cat-chip {
      font-size: 7.5px;
      font-weight: 800;
      line-height: 1;
      padding: 3px 5px;
      border-radius: 5px;
      flex-shrink: 0;
    }
    .cat-chip.is-count { color: #FFFFFF; background: var(--primary, #7E22CE); }
    .cat-chip.is-soft { color: #6D28D9; background: var(--primary-light, #F3E8FF); }
    .cat-chip.is-live { color: var(--success, #16A34A); background: var(--success-light, #DCFCE7); font-size: 6px; padding: 3px 4px; }
    .cat-seq { font-size: 7.5px; font-weight: 800; color: var(--text-dim, #94A3B8); flex-shrink: 0; }
    .cat-seq.is-boxed {
      color: #6D28D9;
      background: #F5F3FF;
      border: 1px solid #EDE9FE;
      border-radius: 4px;
      padding: 2px 4px;
      line-height: 1;
    }
    .cat-kebab {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--card-border, #CBD5E1);
      box-shadow: 0 -4px 0 var(--card-border, #CBD5E1), 0 4px 0 var(--card-border, #CBD5E1);
      flex-shrink: 0;
      margin-right: 1px;
    }

    /* Design 1 · Bento Showcase */
    .cat-bento { gap: 6px; }
    .cat-bento-hero {
      flex: 1.25;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 8px;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 9px;
      box-shadow: 0 3px 8px -4px rgba(var(--primary-rgb, 126, 34, 206), 0.28);
    }
    .cat-bento-hero .cat-stack { flex: 1; }
    .cat-bento-row { flex: 1; display: flex; gap: 6px; }
    .cat-bento-tile {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0 6px;
      background: #FFFFFF;
      border: 1px solid #EDE9FE;
      border-radius: 8px;
    }

    /* Design 2 · Minimalist Clean Table */
    .cat-table {
      gap: 0;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 8px;
      overflow: hidden;
    }
    .cat-table-head {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      height: 18px;
      background: var(--bg-app, #F8FAFC);
      border-bottom: 1px solid var(--card-border, #E2E8F0);
    }
    .cat-col { height: 3px; border-radius: 2px; background: var(--text-dim, #94A3B8); opacity: 0.55; }
    .cat-table-row {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 0 8px;
      border-bottom: 1px solid var(--card-border, #F1F5F9);
    }
    .cat-table-row:last-child { border-bottom: none; }
    .cat-table-row .cat-line { flex: 1; }
    .cat-table-row .cat-chip { margin-left: auto; }

    /* Design 3 · Compact Badge Tiles */
    .cat-tiles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 6px;
    }
    .cat-tile {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 8px;
      box-shadow: 0 2px 5px -3px rgba(var(--primary-rgb, 126, 34, 206), 0.3);
    }
    .cat-tile-glyph { font-size: 13px; line-height: 1; }
    .cat-tile-dot {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #10B981;
    }

    /* Design 4 · List View */
    .cat-list { gap: 5px; }
    .cat-list-row {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 7px;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 7px;
    }

    /* Design 5 · Card View */
    .cat-cards { flex-direction: row; gap: 7px; }
    .cat-card {
      position: relative;
      flex: 1;
      min-width: 0;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 9px;
      overflow: hidden;
      box-shadow: 0 4px 10px -6px rgba(15, 23, 42, 0.3);
      display: flex;
      flex-direction: column;
    }
    .cat-card-banner {
      display: block;
      height: 26px;
      background: linear-gradient(135deg, var(--primary, #7E22CE), #C084FC);
      flex-shrink: 0;
    }
    .cat-avatar.is-float {
      position: absolute;
      top: 16px;
      left: 7px;
      width: 18px;
      height: 18px;
      border-radius: 6px;
      background: #FFFFFF;
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 2px 5px rgba(15, 23, 42, 0.18);
    }
    .cat-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      padding: 8px 7px 6px;
    }
    .cat-meter {
      display: block;
      height: 3px;
      width: 100%;
      border-radius: 2px;
      background: var(--card-hover, #F1F5F9);
      overflow: hidden;
      margin-top: 1px;
    }
    .cat-meter i {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--primary, #7E22CE), #C084FC);
    }

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
      border: 1px solid var(--card-border, #E9D5FF);
      background: linear-gradient(135deg, var(--bg-app, #F8FAFC), var(--card-hover, #F1F5F9));
      padding: 0;
      transition: box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .design-card:hover .sb-mini-thumb {
      box-shadow: 0 10px 22px -12px rgba(var(--text-main-rgb, 46, 16, 101), 0.55);
    }

    .sb-mini-rail {
      width: 52%;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 7px 6px;
      background: var(--text-main, #2E1065);
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
    .sb-mini-block { flex: 1; border-radius: 6px; background: #FFFFFF; border: 1px solid var(--card-border, #E2E8F0); }

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
    .thumb-sb-floating { background: linear-gradient(135deg, #EEF2FF, var(--bg-app, #F8FAFC)); padding: 7px; gap: 7px; }
    .thumb-sb-floating .sb-mini-rail {
      border-radius: 11px;
      box-shadow: 0 8px 18px -6px rgba(var(--text-main-rgb, 46, 16, 101), 0.6);
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
      background: linear-gradient(180deg, var(--text-main, #2E1065), #1E0A45);
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
    .thumb-sb-dashboardpro .sb-mini-row.is-active i { background: var(--text-main, #2E1065); }
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
      background: rgba(var(--text-main-rgb, 46, 16, 101), 0.55);
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
    /* .design-meta owns the vertical rhythm, so these rows carry no margin. */
    .sb-highlight-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 0.15rem;
    }
    .sb-highlight-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--primary-variant, #6B21A8);
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
    }
    .sb-highlight-chip .material-symbols-outlined {
      font-size: 12px !important;
      color: var(--primary-hover, #A855F7);
    }
    .sb-cap-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 0;
      padding-top: 0.1rem;
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
      background: var(--bg-app, #F8FAFC);
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* Warehouse Thumb */
    .thumb-stk-wh-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-stk-wh-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid var(--card-border, #CBD5E1);
      border-radius: 8px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    }
    .thumb-stk-wh-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-stk-sku { font-size: 8px; font-weight: 800; font-family: monospace; color: #2563EB; background: #EFF6FF; padding: 1px 3px; border-radius: 3px; }
    .thumb-stk-dot-green { width: 6px; height: 6px; border-radius: 50%; background: var(--success, #16A34A); }
    .thumb-stk-dot-amber { width: 6px; height: 6px; border-radius: 50%; background: var(--warning, #D97706); }
    .thumb-stk-bar-bg { height: 4px; width: 100%; background: var(--card-border, #E2E8F0); border-radius: 2px; overflow: hidden; }
    .thumb-stk-bar-green { height: 100%; background: var(--success, #16A34A); border-radius: 2px; display: block; }
    .thumb-stk-bar-amber { height: 100%; background: var(--warning, #D97706); border-radius: 2px; display: block; }
    .thumb-stk-chips { display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; font-family: monospace; }
    .thumb-stk-val { color: var(--primary, #7E22CE); }
    .thumb-stk-unit { color: var(--text-muted, #64748B); }

    /* Financial Ledger Thumb */
    .thumb-stk-fin-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-stk-fin-row {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E2E8F0);
      border-radius: 5px;
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .thumb-stk-sku-sm { font-size: 8px; font-family: monospace; font-weight: 700; color: #0F766E; }
    .thumb-stk-line { height: 3px; background: var(--text-muted, #64748B); border-radius: 1px; }
    .thumb-stk-val-sm { font-size: 8px; font-family: monospace; font-weight: 700; color: #0369A1; }

    /* Compact Kanban Thumb */
    .thumb-stk-kanban-wrap { display: flex; gap: 8px; justify-content: center; width: 100%; }
    .thumb-stk-kan-tile {
      width: 52px;
      height: 48px;
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 8px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .thumb-stk-qty-num { font-size: 11px; font-weight: 800; font-family: monospace; color: var(--text-main, #2E1065); text-align: center; }

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
      border: 1.5px solid var(--card-border, #E2E8F0);
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
      background: var(--bg-app, #FAF5FF);
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* VIP Card Thumb */
    .thumb-cust-vip-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cust-vip-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid var(--card-border, #E9D5FF);
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 4px 10px rgba(var(--primary-rgb, 126, 34, 206), 0.08);
    }
    .thumb-cust-vip-head { display: flex; justify-content: space-between; align-items: center; }
    .thumb-cust-avatar-sm { width: 20px; height: 20px; border-radius: 6px; background: var(--primary-light, #F3E8FF); color: var(--primary, #7E22CE); font-size: 8px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .thumb-cust-vip-pill { font-size: 7px; font-weight: 800; color: var(--warning, #B45309); background: var(--warning-light, #FEF3C7); padding: 1px 4px; border-radius: 3px; }
    .thumb-cust-bar-gold { height: 4px; background: #F59E0B; border-radius: 2px; }

    /* Clean Table Thumb */
    .thumb-cust-clean-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cust-clean-row { background: #FFFFFF; border: 1px solid var(--card-border, #E2E8F0); border-radius: 4px; padding: 4px 6px; display: flex; justify-content: space-between; align-items: center; }
    .thumb-cust-seq { font-size: 8px; font-weight: 700; color: var(--text-muted, #64748B); }
    .thumb-cust-pill-blue { font-size: 7px; font-weight: 800; color: #1D4ED8; background: #EFF6FF; padding: 1px 3px; border-radius: 2px; }
    .thumb-cust-pill-green { font-size: 7px; font-weight: 800; color: #047857; background: #ECFDF5; padding: 1px 3px; border-radius: 2px; }

    /* Compact Tiles Thumb */
    .thumb-cust-compact-wrap { width: 100%; display: flex; gap: 6px; justify-content: center; }
    .thumb-cust-compact-tile { width: 50px; background: #FFFFFF; border: 1.5px solid var(--card-border, #CBD5E1); border-radius: 6px; padding: 4px; display: flex; flex-direction: column; gap: 3px; align-items: center; }
    .thumb-cust-avatar-xs { width: 16px; height: 16px; border-radius: 4px; background: #CCFBF1; color: #0F766E; font-size: 7px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

    /* List View Thumb */
    .thumb-cust-list-wrap { width: 100%; display: flex; flex-direction: column; gap: 4px; }
    .thumb-cust-list-row { background: #FFFFFF; border: 1px solid var(--card-border, #E2E8F0); border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; gap: 4px; }
    .thumb-cust-check { width: 5px; height: 5px; border-radius: 2px; border: 1px solid var(--primary, #7E22CE); }
    .thumb-cust-tag-green { margin-left: auto; font-size: 7px; font-weight: 700; color: var(--success, #16A34A); background: var(--success-light, #DCFCE7); padding: 1px 3px; border-radius: 2px; }

    /* Card View Thumb */
    .thumb-cust-card-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-cust-exec-card { width: 95px; background: #FFFFFF; border: 1.5px solid var(--card-border, #E2E8F0); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); }
    .thumb-cust-card-banner { height: 14px; background: linear-gradient(135deg, var(--primary, #7E22CE), #C084FC); }
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
      background: var(--bg-app, #F8FAFC);
      border: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* 1. Executive Staff ID Card Thumb */
    .thumb-staff-id-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-id-card {
      width: 110px;
      background: #FFFFFF;
      border: 1.5px solid var(--card-border, #CBD5E1);
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
      position: relative;
    }
    .thumb-staff-id-slot { height: 3px; width: 24px; background: var(--text-dim, #94A3B8); border-radius: 2px; margin: 0 auto; }
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
    .thumb-staff-roster-row { background: #FFFFFF; border: 1px solid var(--card-border, #E2E8F0); border-radius: 6px; padding: 3px 5px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-roster-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .thumb-staff-roster-gauge { width: 100%; height: 3px; background: var(--card-border, #E2E8F0); border-radius: 2px; overflow: hidden; }
    .thumb-staff-gauge-bar { height: 100%; background: #0D9488; border-radius: 2px; }
    .thumb-staff-pill-teal { font-size: 6px; font-weight: 800; color: #0F766E; background: #CCFBF1; padding: 1px 3px; border-radius: 2px; }

    /* 4. Enterprise SaaS Power Table Thumb */
    .thumb-staff-list-wrap { width: 100%; display: flex; flex-direction: column; }
    .thumb-staff-list-head { background: var(--card-hover, #F1F5F9); border: 1px solid var(--card-border, #CBD5E1); border-radius: 4px 4px 0 0; padding: 2px 4px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-line-head { height: 3px; background: var(--text-dim, #94A3B8); border-radius: 1px; }
    .thumb-staff-list-row { border: 1px solid var(--card-border, #E2E8F0); border-top: none; padding: 3px 4px; display: flex; align-items: center; gap: 4px; }
    .thumb-staff-list-row.zebra-w { background: #FFFFFF; }
    .thumb-staff-list-row.zebra-s { background: var(--bg-app, #F8FAFC); border-radius: 0 0 4px 4px; }
    .thumb-staff-tag-blue { margin-left: auto; font-size: 6px; font-weight: 700; color: #1D4ED8; background: #EFF6FF; padding: 1px 3px; border-radius: 2px; }

    /* 5. Modern Bento Metric Profile Thumb */
    .thumb-staff-bento-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-bento-card {
      width: 105px;
      background: #FFFFFF;
      border: 1.5px solid var(--card-border, #F3E8FF);
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
      background: var(--bg-app, #FAF5FF);
      border: 1px solid #EDE9FE;
      border-radius: 3px;
      font-size: 5px;
      font-weight: 800;
      color: #6D28D9;
      text-align: center;
      padding: 1px 0;
    }

    /* 6. Glassmorphism Thumb */
    .thumb-staff-glass-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-glass-card {
      width: 50px; background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.22); border-radius: 8px;
      padding: 6px; display: flex; flex-direction: column; align-items: center; gap: 3px;
      position: relative; overflow: hidden;
    }
    .thumb-staff-glass-orb {
      position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
      border-radius: 50%; background: radial-gradient(circle, rgba(167,139,250,0.35), transparent 70%); filter: blur(4px);
    }
    .thumb-staff-line-glass { height: 2px; background: rgba(255,255,255,0.25); border-radius: 1px; }
    .thumb-staff-pill-glass {
      font-size: 4px; font-weight: 800; text-transform: uppercase;
      background: rgba(167,139,250,0.25); color: #C4B5FD; border-radius: 99px;
      padding: 1px 5px; border: 1px solid rgba(167,139,250,0.2);
    }

    /* 7. Brutalist Thumb */
    .thumb-staff-brutal-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-brutal-card {
      width: 56px; background: #FFF; border: 2px solid #000; box-shadow: 3px 3px 0 #000;
      overflow: hidden;
    }
    .thumb-staff-brutal-head { height: 8px; background: #F43F5E; border-bottom: 2px solid #000; }
    .thumb-staff-brutal-body-inner { padding: 4px; display: flex; gap: 3px; align-items: flex-start; }
    .thumb-staff-brutal-lines { display: flex; flex-direction: column; gap: 2px; }
    .thumb-staff-brutal-sticker {
      font-size: 4px; font-weight: 900; text-transform: uppercase;
      background: #A5F3FC; color: #000; border: 1px solid #000; padding: 0 3px;
      transform: rotate(-1deg);
    }

    /* 8. Metro Thumb */
    .thumb-staff-metro-wrap { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; }
    .thumb-staff-metro-tile {
      padding: 4px; position: relative; overflow: hidden; display: flex;
      flex-direction: column; justify-content: flex-end; min-height: 22px;
    }
    .thumb-staff-metro-tile.tile-blue { background: #2563EB; }
    .thumb-staff-metro-tile.tile-red { background: var(--danger, #DC2626); }
    .thumb-staff-metro-tile.tile-green { background: #059669; }
    .thumb-staff-metro-tile.tile-amber { background: var(--warning, #D97706); }
    .thumb-staff-metro-wm {
      position: absolute; top: -2px; right: 0; font-size: 18px; font-weight: 900;
      color: rgba(0,0,0,0.12); line-height: 1;
    }
    .thumb-staff-line-white { height: 2px; background: rgba(255,255,255,0.5); border-radius: 1px; }

    /* 9. Timeline Thumb */
    .thumb-staff-timeline-wrap {
      width: 100%; display: flex; flex-direction: column; align-items: flex-start;
      padding-left: 12px; gap: 3px; position: relative;
    }
    .thumb-staff-timeline-track {
      position: absolute; left: 8px; top: 0; bottom: 0; width: 2px;
      background: linear-gradient(180deg, #7C3AED, rgba(124,58,237,0.1)); border-radius: 2px;
    }
    .thumb-staff-timeline-node-t {
      width: 6px; height: 6px; border-radius: 50%; background: #7C3AED;
      margin-left: -4px; z-index: 1; box-shadow: 0 0 0 1.5px var(--bg-app, #F8FAFC), 0 0 0 3px #7C3AED;
    }
    .thumb-staff-timeline-bubble {
      display: flex; gap: 3px; align-items: center;
      background: #FFF; border: 1px solid var(--card-border, #E2E8F0); border-radius: 5px; padding: 2px 4px;
      margin-left: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* 10. Capsule Pill Thumb */
    .thumb-staff-pill-wrap { width: 100%; display: flex; flex-direction: column; gap: 3px; }
    .thumb-staff-pill-row {
      display: flex; align-items: center; gap: 3px;
      background: #FFF; border: 1px solid var(--card-border, #E2E8F0); border-radius: 99px;
      padding: 2px 4px 2px 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .thumb-staff-pill-orange {
      font-size: 4px; font-weight: 800; text-transform: uppercase;
      background: #FFF7ED; color: #C2410C; border-radius: 99px;
      padding: 1px 4px;
    }

    /* 11. Radial HUD Thumb */
    .thumb-staff-hud-wrap { width: 100%; display: flex; justify-content: center; }
    .thumb-staff-hud-card {
      width: 52px; background: rgba(15,23,42,0.85);
      border: 1px solid rgba(52,211,153,0.35); border-radius: 8px;
      padding: 5px; display: flex; flex-direction: column; align-items: center; gap: 3px;
    }
    .thumb-staff-hud-ring {
      width: 24px; height: 24px; border-radius: 50%;
      background: conic-gradient(#34D399 65%, rgba(148,163,184,0.15) 0);
      display: flex; align-items: center; justify-content: center;
      padding: 3px;
    }
    .thumb-staff-line-emerald { height: 2px; background: rgba(52,211,153,0.4); border-radius: 1px; }
    .thumb-staff-hud-stats { display: flex; gap: 2px; width: 100%; }
    .thumb-staff-hud-box {
      flex: 1; text-align: center; font-size: 5px; font-weight: 800;
      color: #34D399; font-family: monospace;
      background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.15);
      border-radius: 2px; padding: 1px 0;
    }

    .token-range-row { width: 100%; }
    .range-slider {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 3px;
      background: var(--card-border, #E2E8F0);
      outline: none;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--primary, #7E22CE);
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(var(--primary-rgb, 126, 34, 206), 0.35);
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
        box-shadow: 0 6px 16px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
      }

      .tab-btn:hover .material-symbols-outlined {
        transform: scale(1.1);
      }

      .tab-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        color: #ffffff;
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 6px 20px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
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

      /* ─── Menu Names editor ─────────────────────────────────────────
         One row per module, so renaming the rail reads as a list of the
         rail rather than a form. The icon and route travel with each row:
         they are how an operator tells two similarly named modules apart
         once the shipped wording is gone. */

      .menu-name-groups {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
        padding: 0.25rem 0 0.15rem;
      }

      .menu-name-group {
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: var(--radius-lg, 16px);
        background: var(--card-bg, #ffffff);
        overflow: hidden;
      }

      .menu-name-group-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 0.85rem;
        background: var(--bg-app, #FAF5FF);
        border-bottom: 1.5px solid var(--card-border, #E9D5FF);
      }

      .menu-name-group-head > .material-symbols-outlined {
        font-size: 18px;
        color: var(--primary, #7E22CE);
        flex: none;
      }

      .menu-name-rows {
        display: flex;
        flex-direction: column;
      }

      .menu-name-row {
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr) auto 2rem;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0.85rem;
        border-bottom: 1px solid var(--card-border, #F3E8FF);
      }

      .menu-name-row:last-child {
        border-bottom: none;
      }

      .menu-name-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 9px;
        background: var(--primary-light, #F3E8FF);
        color: var(--primary, #7E22CE);
        flex: none;
      }

      .menu-name-icon .material-symbols-outlined {
        font-size: 17px;
      }

      .menu-name-input {
        height: 2.3rem;
        min-height: 2.3rem;
        font-size: 0.8125rem;
        padding: 0.35rem 0.6rem;
      }

      .menu-name-input.is-group {
        font-weight: 800;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        font-size: 0.75rem;
      }

      /* The shipped wording, kept in view once a group carries a new name so
         the change is reversible from memory rather than from a backup. */
      .menu-name-shipped {
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--text-muted, #6B7280);
        white-space: nowrap;
        flex: none;
      }

      .menu-name-route {
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--text-dim, #9CA3AF);
        white-space: nowrap;
      }

      .menu-name-revert {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border-radius: 9px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: transparent;
        color: var(--text-muted, #6B7280);
        cursor: pointer;
        transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
      }

      .menu-name-revert:hover {
        background: var(--primary, #7E22CE);
        border-color: var(--primary, #7E22CE);
        color: #ffffff;
      }

      .menu-name-revert .material-symbols-outlined {
        font-size: 16px;
      }

      /* The route is the first thing worth dropping on a narrow screen: the
         icon and the name together already identify the row. */
      @media (max-width: 767px) {
        .menu-name-row {
          grid-template-columns: 2rem minmax(0, 1fr) 2rem;
        }

        .menu-name-route {
          display: none;
        }
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
        box-shadow: 0 6px 16px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.1));
      }

      .preset-item-card.is-selected {
        border-color: var(--primary, #7E22CE);
        background: var(--primary-light, #F3E8FF);
        box-shadow: 0 0 0 2px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.25)), 0 6px 16px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.12));
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
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
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
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mock-badges-card {
        padding: 1rem;
        background: #ffffff;
        border: 1.5px solid var(--card-border, #E9D5FF);
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
      .dot-red { background: var(--danger, #EF4444); }
      .dot-amber { background: #f59e0b; }
      .dot-green { background: #10b981; }

      .screen-meta-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-dim, #94A3B8);
        margin-left: 0.5rem;
      }

      .screen-res-tag {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted, #64748B);
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
        color: var(--text-dim, #CBD5E1);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: all 0.2s ease;
      }

      .position-pad:hover {
        border-color: var(--text-muted, #64748B);
        background: #334155;
        transform: translateY(-2px);
      }

      .position-pad.is-selected {
        border-color: var(--primary-hover, #A855F7);
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.35);
        color: #ffffff;
        box-shadow: 0 0 0 2px var(--primary, #7E22CE), 0 8px 20px rgba(var(--primary-rgb, 126, 34, 206), 0.4);
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
        color: var(--text-dim, #94A3B8);
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
        color: var(--text-dim, #E2E8F0);
      }

      .board-desc {
        font-size: 0.6875rem;
        color: var(--text-dim, #94A3B8);
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
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
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
        box-shadow: 0 2px 8px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.3));
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

      .btn-test-success { background: linear-gradient(135deg, var(--success, #16A34A), var(--success, #15803D)); }
      .btn-test-error { background: linear-gradient(135deg, var(--danger, #DC2626), var(--danger, #B91C1C)); }
      .btn-test-warning { background: linear-gradient(135deg, var(--warning, #EA580C), #c2410c); }
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

      /* Printer / Notification / Invoice modules */
      .module-note {
        display: flex;
        align-items: flex-start;
        gap: 0.625rem;
        padding: 0.875rem 1.125rem;
        border-radius: 14px;
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.06);
        border: 1.5px dashed var(--card-border, #E9D5FF);
      }

      .module-note p {
        margin: 0;
        font-size: 0.72rem;
        line-height: 1.55;
        color: var(--text-muted, #6B7280);
      }

      .module-note strong {
        color: var(--text-main, #2E1065);
        font-weight: 800;
      }

      .module-note .material-symbols-outlined {
        font-size: 19px;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .switch-stack {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .switch-row {
        padding: 0.875rem 1rem;
        border-radius: 12px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .switch-row-title {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .switch-row-sub {
        font-size: 0.7rem;
        color: var(--text-muted, #6B7280);
        margin-top: 0.15rem;
      }

      .preview-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;
        padding: 1.125rem 1.375rem;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(var(--primary-rgb, 126, 34, 206), 0.1), rgba(var(--primary-rgb, 147, 51, 234), 0.03));
        border: 1.5px solid var(--card-border, #E9D5FF);
      }

      .preview-strip-label {
        font-size: 0.62rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted, #6B7280);
      }

      .preview-strip-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--primary, #7E22CE);
        margin-top: 0.2rem;
        word-break: break-all;
      }

      .printer-test-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.625rem;
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
      .text-purple { color: var(--primary, #7E22CE); }
      .spin-icon { animation: spin 1s linear infinite; }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* ── Data Backup ─────────────────────────────────────────────── */
      .backup-body {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
        padding-top: 0.25rem;
      }

      .backup-path-row {
        display: flex;
        gap: 0.6rem;
        align-items: stretch;
      }
      .backup-path-row .control-input {
        flex: 1 1 auto;
        min-width: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82rem;
      }

      .btn-path-save,
      .btn-path-create,
      .btn-path-browse {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0 1.05rem;
        border-radius: 10px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--surface-muted, #F5F3FF);
        color: #6D28D9;
        font-size: 0.8rem;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .btn-path-save:hover:not(:disabled),
      .btn-path-create:hover:not(:disabled),
      .btn-path-browse:hover:not(:disabled) {
        background: #EDE9FE;
        border-color: #C4B5FD;
      }
      .btn-path-save:disabled,
      .btn-path-create:disabled,
      .btn-path-browse:disabled { opacity: 0.55; cursor: not-allowed; }
      .btn-path-save .material-symbols-outlined,
      .btn-path-create .material-symbols-outlined,
      .btn-path-browse .material-symbols-outlined { font-size: 1.1rem; }
      .btn-path-save .is-spinning,
      .btn-path-browse .is-spinning { animation: spin 1s linear infinite; }

      .btn-path-create {
        margin-top: 0.6rem;
        padding: 0.55rem 1rem;
        align-self: flex-start;
      }

      .backup-path-status {
        display: flex;
        align-items: flex-start;
        gap: 0.45rem;
        margin-top: 0.55rem;
        font-size: 0.79rem;
        font-weight: 600;
        line-height: 1.45;
      }
      .backup-path-status .material-symbols-outlined { font-size: 1.1rem; flex-shrink: 0; }
      .backup-path-status.is-ok { color: var(--success, #16A34A); }
      .backup-path-status.is-bad { color: var(--danger, #DC2626); }

      .backup-note {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.9rem 1rem;
        border-radius: 12px;
        background: var(--surface-muted, #F5F3FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .backup-note .material-symbols-outlined {
        font-size: 1.3rem;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }
      .backup-note p {
        margin: 0;
        font-size: 0.83rem;
        line-height: 1.55;
        color: var(--text-muted, #6B7280);
      }
      .backup-note strong { color: var(--text-main, #2E1065); font-weight: 700; }
      .backup-note.is-warning {
        background: var(--warning-light, #FFFBEB);
        border-color: var(--warning-light, #FDE68A);
      }
      .backup-note.is-warning .material-symbols-outlined { color: var(--warning, #B45309); }

      .backup-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .btn-backup-now {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        border: 1px solid #6D28D9;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, #6D28D9 100%);
        color: #FFFFFF;
        font-size: 0.86rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(109, 40, 217, 0.32);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-backup-now:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(109, 40, 217, 0.4);
      }
      .btn-backup-now:disabled { opacity: 0.65; cursor: progress; }
      .btn-backup-now .is-spinning { animation: spin 1s linear infinite; }

      .backup-status {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
      }
      .backup-status .status-ok { color: var(--success, #16A34A); }
      .backup-status .status-bad { color: var(--danger, #DC2626); }

      .backup-safety {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--success, #16A34A);
      }
      .backup-safety .material-symbols-outlined { font-size: 1.15rem; }

      .backup-table-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
        gap: 0.5rem;
        padding-top: 0.25rem;
      }
      .backup-table-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 9px;
        background: var(--surface-muted, #F9FAFB);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .chip-name {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-main, #2E1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chip-rows {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .backup-footnote {
        margin: 0.9rem 0 0;
        font-size: 0.75rem;
        line-height: 1.5;
        color: var(--text-muted, #6B7280);
      }

      /* ── Folder browser dialog ───────────────────────────────────── */
      .fb-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: rgba(17, 12, 34, 0.55);
        backdrop-filter: blur(2px);
      }

      .fb-dialog {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 620px;
        max-height: 82vh;
        border-radius: 16px;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        box-shadow: 0 24px 60px rgba(17, 12, 34, 0.35);
        overflow: hidden;
      }

      .fb-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.05rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .fb-close {
        display: inline-flex;
        padding: 0.35rem;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--text-muted, #6B7280);
        cursor: pointer;
      }
      .fb-close:hover { background: var(--surface-muted, #F5F3FF); color: #6D28D9; }

      .fb-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
        background: var(--surface-muted, #FAFAFA);
      }
      .fb-path {
        flex: 1 1 auto;
        min-width: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-main, #2E1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        direction: rtl;
        text-align: left;
      }

      .fb-icon-btn {
        display: inline-flex;
        padding: 0.35rem;
        border-radius: 8px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        color: #6D28D9;
        cursor: pointer;
        flex-shrink: 0;
      }
      .fb-icon-btn:hover:not(:disabled) { background: #EDE9FE; }
      .fb-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .fb-icon-btn .material-symbols-outlined { font-size: 1.15rem; }

      .fb-drives {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        padding: 0.65rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }
      .fb-drive {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        border: 1px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        font-size: 0.76rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
        cursor: pointer;
      }
      .fb-drive .material-symbols-outlined { font-size: 1rem; color: #6D28D9; }
      .fb-drive:hover { background: #F5F3FF; }
      .fb-drive.is-active { background: #EDE9FE; border-color: #C4B5FD; }

      .fb-newfolder {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.25rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
        background: var(--warning-light, #FFFBEB);
      }
      .fb-newfolder .material-symbols-outlined { color: var(--warning, #B45309); font-size: 1.15rem; }
      .fb-newfolder .control-input { flex: 1 1 auto; min-width: 0; }

      .fb-list {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 0.4rem 0.6rem;
        min-height: 180px;
      }

      .fb-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.55rem 0.7rem;
        border: 1px solid transparent;
        border-radius: 9px;
        background: transparent;
        text-align: left;
        cursor: pointer;
      }
      .fb-row:hover { background: var(--surface-muted, #F9FAFB); }
      .fb-row.is-selected {
        background: #EDE9FE;
        border-color: #C4B5FD;
      }
      .fb-row > .material-symbols-outlined { font-size: 1.2rem; color: #A78BFA; flex-shrink: 0; }
      .fb-row-name {
        flex: 1 1 auto;
        min-width: 0;
        font-size: 0.83rem;
        font-weight: 600;
        color: var(--text-main, #2E1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fb-enter { color: var(--text-muted, #9CA3AF) !important; }
      .fb-enter:hover { color: #6D28D9 !important; }

      .fb-loading,
      .fb-error,
      .fb-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem 1rem;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
        text-align: center;
      }
      .fb-error { color: var(--warning, #B45309); }
      .fb-loading .is-spinning { animation: spin 1s linear infinite; }

      .fb-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.9rem 1.25rem;
        border-top: 1px solid var(--card-border, #E9D5FF);
        background: var(--surface-muted, #FAFAFA);
        flex-wrap: wrap;
      }
      .fb-chosen { min-width: 0; flex: 1 1 200px; }
      .fb-chosen-label {
        display: block;
        font-size: 0.66rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted, #9CA3AF);
      }
      .fb-chosen-path {
        display: block;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.76rem;
        font-weight: 600;
        color: var(--text-main, #2E1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fb-foot-actions { display: flex; gap: 0.6rem; flex-shrink: 0; }
      .fb-foot-actions .btn-path-browse { padding: 0.6rem 1.1rem; }

      @media (max-width: 640px) {
        .fb-dialog { max-height: 90vh; }
        .fb-foot { flex-direction: column; align-items: stretch; }
        .fb-foot-actions { justify-content: stretch; }
        .fb-foot-actions > * { flex: 1 1 auto; justify-content: center; }
      }

      @media (max-width: 640px) {
        .backup-actions { flex-direction: column; align-items: stretch; }
        .btn-backup-now { justify-content: center; }
        .backup-path-row { flex-direction: column; }
        .btn-path-save { justify-content: center; padding: 0.6rem 1rem; }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public settingsService = inject(SettingsService);
  public themeService = inject(ThemeService);
  public notify = inject(NotificationService);
  public printer = inject(PrinterService);
  private backup = inject(BackupService);
  private auth = inject(AuthService);

  public activeTab: SettingsTab = 'customization';

  // ── Data Backup ────────────────────────────────────────────────────────
  public backupInfo: BackupInfo | null = null;
  public isBackingUp = false;
  public backupStatus: { kind: 'ok' | 'error'; message: string } | null = null;

  /** What is in the input box — may differ from what is saved until saved. */
  public backupFolderPath = '';
  /** The path actually persisted on the server. */
  public backupFolderSaved = '';
  public backupFolderConfigured = false;
  public backupFolderDirty = false;
  public isSavingFolder = false;
  public backupFolderCheck: FolderCheck | null = null;

  // Folder browser dialog
  public showFolderBrowser = false;
  public isBrowsing = false;
  public browseResult: BrowseResult | null = null;
  /** Single-click highlight; empty means "the folder currently open". */
  public selectedBrowsePath = '';
  public isNamingFolder = false;
  public newFolderName = '';
  public isCreatingFolder = false;

  /** Null until probed; false sends Browse to the in-app browser. */
  public nativePickerAvailable: boolean | null = null;
  public isPickingNatively = false;

  /** Whether this browser can offer a real folder picker. */
  public get backupSupportsFolder(): boolean {
    return this.backup.canChooseFolder;
  }

  /** `21-09-2026.sql` — recomputed per render so it is right past midnight. */
  public get backupFileName(): string {
    return this.backup.suggestedFileName();
  }

  /** The name a second backup on the same day would take. */
  public get backupSecondFileName(): string {
    return this.backupFileName.replace(/\.sql$/i, '_2.sql');
  }

  /** A full export includes password hashes, so it is administrators only. */
  public get isAdmin(): boolean {
    return this.auth.userRole() === 'ADMIN';
  }

  /** The palette plus the eight page designs, as one rail under Brand Theme. */
  public readonly themeGroupTabs: ReadonlyArray<{ tab: SettingsTab; label: string }> = [
    { tab: 'theme', label: 'Brand Palette' },
    { tab: 'posdesign', label: 'POS Customize' },
    { tab: 'dishpage', label: 'Catalog Page Design' },
    { tab: 'dining', label: 'Dining Customize' },
    { tab: 'categorydesign', label: 'Category Customize' },
    { tab: 'stockdesign', label: 'Stock Ledger Customize' },
    { tab: 'customerdesign', label: 'Customer Customize' },
    { tab: 'staffdesign', label: 'Staff & Roles Customize' },
    { tab: 'sidebardesign', label: 'Sidebar Template' },
  ];

  /** True while any Brand Theme sub-tab is open, so the sub-rail shows and the
   *  main Brand Theme button stays lit for all nine of them. */
  public isThemeGroupTab(tab: SettingsTab): boolean {
    return this.themeGroupTabs.some((t) => t.tab === tab);
  }

  // ── POS Customization: which pages apply their saved design ───────────
  public customization = inject(CustomizationService);

  /**
   * What is in flight, so no two saves overlap: one page's key, or 'all' for
   * the master switch.
   */
  public savingModuleKey: CustomizationModuleKey | 'all' | null = null;

  get allCustomizationsOn(): boolean {
    return this.customization.modules.every((m) => this.customization.isEnabled(m.key));
  }

  /** True only in the in-between state, which the master switch shows as mixed. */
  get someCustomizationsOn(): boolean {
    return this.enabledCustomizationCount > 0 && !this.allCustomizationsOn;
  }

  get enabledCustomizationCount(): number {
    return this.customization.modules.filter((m) => this.customization.isEnabled(m.key)).length;
  }

  /** The module the open tab configures, or null on a non-customize tab. */
  get activeModule(): CustomizationModule | null {
    return this.customization.modules.find((m) => m.tab === this.activeTab) || null;
  }

  onCustomizationToggle(module: CustomizationModule, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.persistCustomization(module, input.checked, input);
  }

  toggleCustomizationFor(module: CustomizationModule): void {
    this.persistCustomization(module, !this.customization.isEnabled(module.key));
  }

  /**
   * The master switch: every page on, or every page off once they all are.
   * From a mixed state it switches them all on, which is what the checkbox
   * itself does when clicked out of indeterminate.
   */
  onCustomizationMasterToggle(event: Event): void {
    this.persistAllCustomization(!this.allCustomizationsOn, event.target as HTMLInputElement);
  }

  /**
   * Writes all eight flags in one save. They stay eight independent settings —
   * this only spares the admin eight round trips — so a page can be switched
   * back on its own immediately afterwards.
   */
  private persistAllCustomization(next: boolean, input?: HTMLInputElement): void {
    if (this.savingModuleKey !== null) return;

    const previous = this.customization.snapshot();
    if (this.customization.modules.every((m) => previous[m.key] === next)) return;

    this.customization.setAll(next);
    this.savingModuleKey = 'all';

    this.settingsService.saveTabSettings('customization', this.customization.toPayload()).subscribe({
      next: (res) => {
        this.savingModuleKey = null;
        if (res.success && res.data) {
          this.settingsMap = this.flattenGroupedSettings(res.data.map || res.data);
        }
        this.notify.success(
          next
            ? 'Customization turned ON for all pages.'
            : 'Customization turned OFF for all pages. Saved designs are kept.'
        );
      },
      error: (err) => {
        this.savingModuleKey = null;
        this.customization.restore(previous);
        if (input) input.checked = this.allCustomizationsOn;
        const errorMsg = err?.error?.message || 'Server connection error';
        this.notify.error('Failed to persist to database: ' + errorMsg);
      },
    });
  }

  /**
   * Saves one page's switch on its own. Only the customization key is sent, so
   * no design, palette or unrelated setting is rewritten, and a rejected save
   * puts the previous flags back rather than leaving the UI ahead of the
   * database.
   */
  private persistCustomization(
    module: CustomizationModule,
    next: boolean,
    input?: HTMLInputElement
  ): void {
    if (this.savingModuleKey !== null) return;

    const previous = this.customization.snapshot();
    if (previous[module.key] === next) return;

    this.customization.setEnabled(module.key, next);
    this.savingModuleKey = module.key;

    this.settingsService.saveTabSettings('customization', this.customization.toPayload()).subscribe({
      next: (res) => {
        this.savingModuleKey = null;
        if (res.success && res.data) {
          this.settingsMap = this.flattenGroupedSettings(res.data.map || res.data);
        }
        this.notify.success(
          module.name + ' customization turned ' + (next ? 'ON' : 'OFF') + '.'
        );
      },
      error: (err) => {
        this.savingModuleKey = null;
        this.customization.restore(previous);
        if (input) input.checked = previous[module.key];
        const errorMsg = err?.error?.message || 'Server connection error';
        this.notify.error('Failed to persist to database: ' + errorMsg);
      },
    });
  }

  /** Opens the editor for one page, from its row's Configure button. */
  openCustomizationTab(module: CustomizationModule): void {
    if (!this.isValidTab(module.tab)) return;
    this.activeTab = module.tab as SettingsTab;
    setTimeout(() => this.scrollActiveTabIntoView(), 150);
  }

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
      return 'var(--primary, #7E22CE)';
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
    if (!/^#[0-9a-f]{6}$/i.test(val)) return 'var(--primary, #7E22CE)';
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
    if (!/^#[0-9a-f]{6}$/i.test(val)) return 'var(--primary, #7E22CE)';
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

  // ── Menu names ────────────────────────────────────────────────────────
  // The rail and this editor read the same SIDEBAR_NAV_SECTIONS, so a module
  // added to the menu shows up here to be renamed without any further work.

  public sidebarNavSections: NavSection[] = SIDEBAR_NAV_SECTIONS;

  /** How many groups and modules currently carry a name of the operator's. */
  renamedCount(): number {
    return (
      Object.keys(this.sidebarLayout.itemNames()).length +
      Object.keys(this.sidebarLayout.sectionNames()).length
    );
  }

  onItemNameInput(item: NavItem, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.sidebarLayout.setItemName(item.id, value, item.label);
  }

  onSectionNameInput(section: NavSection, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.sidebarLayout.setSectionName(section.id, value, section.title);
  }

  revertItemName(item: NavItem): void {
    this.sidebarLayout.setItemName(item.id, '', item.label);
  }

  resetSidebarMenuNames(): void {
    this.sidebarLayout.resetMenuNames();
    this.notify.info('Every group and module is back to the name it ships with.');
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

  // ═══════════════════════════════════════════════════════════════════════
  // PRINTER / NOTIFICATION / INVOICE MODULES
  //
  // Each one is a single JSON settings row (`system_printer`, and so on) that
  // is unpacked into flat `PRINTER_*` / `NOTIFY_*` / `INVOICE_*` keys for the
  // template to bind against. The field maps below are the only place the two
  // spellings meet, so packing and unpacking cannot drift apart.
  // ═══════════════════════════════════════════════════════════════════════

  /** Printer stations, connection and paper behaviour — stored as `system_printer`. */
  public readonly printerFieldMap: Record<string, string> = {
    receiptEnabled: 'PRINTER_RECEIPT_ENABLED',
    receiptName: 'PRINTER_RECEIPT_NAME',
    receiptPaperWidth: 'PRINTER_RECEIPT_WIDTH',
    receiptAutoPrint: 'PRINTER_RECEIPT_AUTO',
    receiptCopies: 'PRINTER_RECEIPT_COPIES',
    kitchenEnabled: 'PRINTER_KITCHEN_ENABLED',
    kitchenName: 'PRINTER_KITCHEN_NAME',
    kitchenPaperWidth: 'PRINTER_KITCHEN_WIDTH',
    kitchenAutoPrint: 'PRINTER_KITCHEN_AUTO',
    kitchenCopies: 'PRINTER_KITCHEN_COPIES',
    barEnabled: 'PRINTER_BAR_ENABLED',
    barName: 'PRINTER_BAR_NAME',
    barPaperWidth: 'PRINTER_BAR_WIDTH',
    barAutoPrint: 'PRINTER_BAR_AUTO',
    barCopies: 'PRINTER_BAR_COPIES',
    connection: 'PRINTER_CONNECTION',
    deviceIp: 'PRINTER_DEVICE_IP',
    devicePort: 'PRINTER_DEVICE_PORT',
    charset: 'PRINTER_CHARSET',
    density: 'PRINTER_DENSITY',
    autoCut: 'PRINTER_AUTO_CUT',
    cashDrawer: 'PRINTER_CASH_DRAWER',
    buzzer: 'PRINTER_BUZZER',
    feedLines: 'PRINTER_FEED_LINES',
  };

  /** Which events alert, through which channel — stored as `system_notification`. */
  public readonly notificationFieldMap: Record<string, string> = {
    newOrder: 'NOTIFY_NEW_ORDER',
    orderReady: 'NOTIFY_ORDER_READY',
    billVoided: 'NOTIFY_BILL_VOID',
    lowStock: 'NOTIFY_LOW_STOCK',
    lowStockThreshold: 'NOTIFY_LOW_STOCK_THRESHOLD',
    dayClose: 'NOTIFY_DAY_CLOSE',
    channelInApp: 'NOTIFY_CHANNEL_INAPP',
    channelDesktop: 'NOTIFY_CHANNEL_DESKTOP',
    channelEmail: 'NOTIFY_CHANNEL_EMAIL',
    emailRecipients: 'NOTIFY_EMAIL_RECIPIENTS',
    channelSms: 'NOTIFY_CHANNEL_SMS',
    smsRecipients: 'NOTIFY_SMS_RECIPIENTS',
    sound: 'NOTIFY_SOUND',
    soundTone: 'NOTIFY_SOUND_TONE',
    quietStart: 'NOTIFY_QUIET_START',
    quietEnd: 'NOTIFY_QUIET_END',
    dailySummary: 'NOTIFY_DAILY_SUMMARY',
    dailySummaryTime: 'NOTIFY_DAILY_SUMMARY_TIME',
  };

  /** Invoice numbering, format and printed blocks — stored as `system_invoice`. */
  public readonly invoiceFieldMap: Record<string, string> = {
    prefix: 'INVOICE_PREFIX',
    nextNumber: 'INVOICE_NEXT_NUMBER',
    padLength: 'INVOICE_PAD_LENGTH',
    resetCycle: 'INVOICE_RESET_CYCLE',
    title: 'INVOICE_TITLE',
    paperSize: 'INVOICE_PAPER_SIZE',
    dateFormat: 'INVOICE_DATE_FORMAT',
    decimals: 'INVOICE_DECIMALS',
    currencyPosition: 'INVOICE_CURRENCY_POSITION',
    showLogo: 'INVOICE_SHOW_LOGO',
    showTaxBreakdown: 'INVOICE_SHOW_TAX_BREAKDOWN',
    showQr: 'INVOICE_SHOW_QR',
    upiId: 'INVOICE_UPI_ID',
    showSignature: 'INVOICE_SHOW_SIGNATURE',
    signatory: 'INVOICE_SIGNATORY',
    dueDays: 'INVOICE_DUE_DAYS',
    terms: 'INVOICE_TERMS',
    footerNote: 'INVOICE_FOOTER_NOTE',
  };

  /**
   * What a terminal shows before any of these three tabs has ever been saved.
   * Only keys the settings map is missing entirely are filled in, so a value
   * deliberately cleared to an empty string is never resurrected.
   */
  public readonly extendedModuleDefaults: Record<string, string> = {
    PRINTER_RECEIPT_ENABLED: 'true',
    PRINTER_RECEIPT_NAME: 'Cashier Thermal Receipt Printer',
    PRINTER_RECEIPT_WIDTH: '80mm',
    PRINTER_RECEIPT_AUTO: 'true',
    PRINTER_RECEIPT_COPIES: '1',
    PRINTER_KITCHEN_ENABLED: 'true',
    PRINTER_KITCHEN_NAME: 'Kitchen Order Ticket (KOT) Printer',
    PRINTER_KITCHEN_WIDTH: '80mm',
    PRINTER_KITCHEN_AUTO: 'true',
    PRINTER_KITCHEN_COPIES: '1',
    PRINTER_BAR_ENABLED: 'false',
    PRINTER_BAR_NAME: 'Bar Beverage Printer',
    PRINTER_BAR_WIDTH: '80mm',
    PRINTER_BAR_AUTO: 'false',
    PRINTER_BAR_COPIES: '1',
    PRINTER_CONNECTION: 'usb',
    PRINTER_DEVICE_IP: '',
    PRINTER_DEVICE_PORT: '9100',
    PRINTER_CHARSET: 'CP437',
    PRINTER_DENSITY: 'normal',
    PRINTER_AUTO_CUT: 'true',
    PRINTER_CASH_DRAWER: 'true',
    PRINTER_BUZZER: 'false',
    PRINTER_FEED_LINES: '3',

    NOTIFY_NEW_ORDER: 'true',
    NOTIFY_ORDER_READY: 'true',
    NOTIFY_BILL_VOID: 'true',
    NOTIFY_LOW_STOCK: 'true',
    NOTIFY_LOW_STOCK_THRESHOLD: '5',
    NOTIFY_DAY_CLOSE: 'true',
    NOTIFY_CHANNEL_INAPP: 'true',
    NOTIFY_CHANNEL_DESKTOP: 'false',
    NOTIFY_CHANNEL_EMAIL: 'false',
    NOTIFY_EMAIL_RECIPIENTS: '',
    NOTIFY_CHANNEL_SMS: 'false',
    NOTIFY_SMS_RECIPIENTS: '',
    NOTIFY_SOUND: 'true',
    NOTIFY_SOUND_TONE: 'chime',
    NOTIFY_QUIET_START: '',
    NOTIFY_QUIET_END: '',
    NOTIFY_DAILY_SUMMARY: 'false',
    NOTIFY_DAILY_SUMMARY_TIME: '23:30',

    INVOICE_PREFIX: 'INV-',
    INVOICE_NEXT_NUMBER: '1',
    INVOICE_PAD_LENGTH: '4',
    INVOICE_RESET_CYCLE: 'yearly',
    INVOICE_TITLE: 'TAX INVOICE',
    INVOICE_PAPER_SIZE: 'A4',
    INVOICE_DATE_FORMAT: 'dd/MM/yyyy',
    INVOICE_DECIMALS: '2',
    INVOICE_CURRENCY_POSITION: 'prefix',
    INVOICE_SHOW_LOGO: 'true',
    INVOICE_SHOW_TAX_BREAKDOWN: 'true',
    INVOICE_SHOW_QR: 'false',
    INVOICE_UPI_ID: '',
    INVOICE_SHOW_SIGNATURE: 'true',
    INVOICE_SIGNATORY: 'Authorised Signatory',
    INVOICE_DUE_DAYS: '0',
    INVOICE_TERMS: 'Goods once sold will not be taken back or exchanged.',
    INVOICE_FOOTER_NOTE: 'Thank you for your business.',
  };

  /** The three print stations, each a row in the Printer Settings grid. */
  public readonly printerStations: {
    title: string;
    subtitle: string;
    icon: string;
    enabledKey: string;
    nameKey: string;
    widthKey: string;
    autoKey: string;
    autoLabel: string;
    copiesKey: string;
  }[] = [
    {
      title: 'Cashier Receipt Station',
      subtitle: 'The customer bill printed at the till',
      icon: 'receipt_long',
      enabledKey: 'PRINTER_RECEIPT_ENABLED',
      nameKey: 'PRINTER_RECEIPT_NAME',
      widthKey: 'PRINTER_RECEIPT_WIDTH',
      autoKey: 'PRINTER_RECEIPT_AUTO',
      autoLabel: 'Print On Checkout',
      copiesKey: 'PRINTER_RECEIPT_COPIES',
    },
    {
      title: 'Kitchen (KOT) Station',
      subtitle: 'The order ticket the chef line works from',
      icon: 'soup_kitchen',
      enabledKey: 'PRINTER_KITCHEN_ENABLED',
      nameKey: 'PRINTER_KITCHEN_NAME',
      widthKey: 'PRINTER_KITCHEN_WIDTH',
      autoKey: 'PRINTER_KITCHEN_AUTO',
      autoLabel: 'Print On Order Placed',
      copiesKey: 'PRINTER_KITCHEN_COPIES',
    },
    {
      title: 'Bar / Beverage Station',
      subtitle: 'Drinks split onto their own ticket',
      icon: 'local_bar',
      enabledKey: 'PRINTER_BAR_ENABLED',
      nameKey: 'PRINTER_BAR_NAME',
      widthKey: 'PRINTER_BAR_WIDTH',
      autoKey: 'PRINTER_BAR_AUTO',
      autoLabel: 'Print On Order Placed',
      copiesKey: 'PRINTER_BAR_COPIES',
    },
  ];

  /** The floor events the Notification Settings tab can switch on and off. */
  public readonly notificationTriggers: { key: string; title: string; subtitle: string }[] = [
    { key: 'NOTIFY_NEW_ORDER', title: 'New Order Placed', subtitle: 'Announces every order the moment it is sent to the kitchen' },
    { key: 'NOTIFY_ORDER_READY', title: 'Order Ready To Serve', subtitle: 'Tells the floor when the kitchen marks a ticket done' },
    { key: 'NOTIFY_BILL_VOID', title: 'Bill Voided Or Refunded', subtitle: 'Flags reversals so they are never silent' },
    { key: 'NOTIFY_LOW_STOCK', title: 'Stock Running Low', subtitle: 'Warns before an item runs out mid-service' },
    { key: 'NOTIFY_DAY_CLOSE', title: 'Day Close Reminder', subtitle: 'Prompts the cashier to settle the till at shift end' },
  ];

  /** The optional blocks an invoice can carry besides its line items. */
  public readonly invoiceBlocks: { key: string; title: string; subtitle: string }[] = [
    { key: 'INVOICE_SHOW_LOGO', title: 'Business Logo', subtitle: 'Prints the brand crest in the invoice header' },
    { key: 'INVOICE_SHOW_TAX_BREAKDOWN', title: 'Tax Breakdown Table', subtitle: 'Itemises each tax slab instead of one total' },
    { key: 'INVOICE_SHOW_QR', title: 'Payment QR Code', subtitle: 'Lets the guest settle by scanning the invoice' },
    { key: 'INVOICE_SHOW_SIGNATURE', title: 'Signature Line', subtitle: 'Leaves room for an authorised signature' },
  ];

  public readonly enabledDisabledOptions: DropdownOption[] = [
    { value: 'true', label: 'Enabled', icon: 'check_circle', description: 'Active on every terminal' },
    { value: 'false', label: 'Disabled', icon: 'block', description: 'Switched off entirely' },
  ];

  public readonly shownHiddenOptions: DropdownOption[] = [
    { value: 'true', label: 'Printed', icon: 'visibility', description: 'Included on the invoice' },
    { value: 'false', label: 'Omitted', icon: 'visibility_off', description: 'Left off the invoice' },
  ];

  public readonly stationStatusOptions: DropdownOption[] = [
    { value: 'true', label: 'Station Online', icon: 'print', description: 'Jobs are routed to this printer' },
    { value: 'false', label: 'Station Offline', icon: 'print_disabled', description: 'Skipped by the print queue' },
  ];

  public readonly autoPrintOptions: DropdownOption[] = [
    { value: 'true', label: 'Print Automatically', icon: 'bolt', description: 'No dialog — the job goes straight to paper' },
    { value: 'false', label: 'Ask First', icon: 'touch_app', description: 'Staff confirm before anything prints' },
  ];

  public readonly printerConnectionOptions: DropdownOption[] = [
    { value: 'usb', label: 'USB / Local Cable', icon: 'usb', description: 'Printer wired directly into this terminal' },
    { value: 'network', label: 'Network (LAN / Wi-Fi)', icon: 'lan', description: 'Reached over IP, shared by every till' },
    { value: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', description: 'Paired wireless mobile printer' },
    { value: 'serial', label: 'Serial / COM Port', icon: 'settings_input_component', description: 'Legacy RS-232 thermal unit' },
    { value: 'browser', label: 'System Print Dialog', icon: 'open_in_browser', description: 'Falls back to the operating system dialog' },
  ];

  public readonly printerCharsetOptions: DropdownOption[] = [
    { value: 'CP437', label: 'CP437 (US / Default)', icon: 'abc', description: 'Standard ESC/POS code page' },
    { value: 'CP850', label: 'CP850 (Western Europe)', icon: 'abc', description: 'Accented Latin characters' },
    { value: 'CP858', label: 'CP858 (Euro Symbol)', icon: 'euro', description: 'CP850 with the euro glyph' },
    { value: 'CP720', label: 'CP720 (Arabic)', icon: 'translate', description: 'Arabic script receipts' },
    { value: 'UTF-8', label: 'UTF-8 (Unicode)', icon: 'language', description: 'Only for printers that declare Unicode support' },
  ];

  public readonly printerDensityOptions: DropdownOption[] = [
    { value: 'light', label: 'Light', icon: 'exposure_neg_1', description: 'Saves the print head, fainter text' },
    { value: 'normal', label: 'Normal', icon: 'exposure_zero', description: 'Balanced contrast on standard rolls' },
    { value: 'dark', label: 'Dark', icon: 'exposure_plus_1', description: 'Heavier burn for older thermal paper' },
  ];

  public readonly notifyToneOptions: DropdownOption[] = [
    { value: 'chime', label: 'Soft Chime', icon: 'notifications', description: 'Gentle two-note confirmation' },
    { value: 'bell', label: 'Counter Bell', icon: 'doorbell', description: 'Sharp single ring, carries across a room' },
    { value: 'ping', label: 'Short Ping', icon: 'graphic_eq', description: 'Minimal blip for busy terminals' },
    { value: 'alert', label: 'Urgent Alert', icon: 'e911_emergency', description: 'Reserved for reversals and failures' },
  ];

  public readonly invoicePadOptions: DropdownOption[] = [
    { value: '3', label: '3 Digits (001)', icon: 'pin', description: 'Up to 999 invoices per cycle' },
    { value: '4', label: '4 Digits (0001)', icon: 'pin', description: 'Up to 9,999 invoices per cycle' },
    { value: '5', label: '5 Digits (00001)', icon: 'pin', description: 'Up to 99,999 invoices per cycle' },
    { value: '6', label: '6 Digits (000001)', icon: 'pin', description: 'High-volume multi-outlet numbering' },
  ];

  public readonly invoiceResetOptions: DropdownOption[] = [
    { value: 'never', label: 'Never Reset', icon: 'all_inclusive', description: 'One continuous series forever' },
    { value: 'daily', label: 'Reset Daily', icon: 'today', description: 'Numbering restarts each trading day' },
    { value: 'monthly', label: 'Reset Monthly', icon: 'calendar_month', description: 'Numbering restarts on the 1st' },
    { value: 'yearly', label: 'Reset Yearly', icon: 'event_repeat', description: 'Numbering restarts each financial year' },
  ];

  public readonly invoicePaperOptions: DropdownOption[] = [
    { value: 'A4', label: 'A4 (210 x 297mm)', icon: 'description', description: 'Standard office invoice sheet' },
    { value: 'A5', label: 'A5 (148 x 210mm)', icon: 'article', description: 'Half sheet, saves paper' },
    { value: '80mm', label: '80mm Thermal Roll', icon: 'receipt_long', description: 'Invoice printed on the till roll' },
  ];

  public readonly invoiceDateFormatOptions: DropdownOption[] = [
    { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy', icon: 'calendar_today', description: '19/09/2026' },
    { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy', icon: 'calendar_today', description: '09/19/2026' },
    { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd', icon: 'calendar_today', description: '2026-09-19 (ISO)' },
    { value: 'dd MMM yyyy', label: 'dd MMM yyyy', icon: 'calendar_today', description: '19 Sep 2026' },
  ];

  public readonly invoiceDecimalOptions: DropdownOption[] = [
    { value: '0', label: 'Whole Numbers', icon: 'looks_one', description: 'Rounded amounts, no paise' },
    { value: '2', label: 'Two Decimals', icon: 'looks_two', description: 'Standard money precision' },
    { value: '3', label: 'Three Decimals', icon: 'looks_3', description: 'For currencies with a 1000 sub-unit' },
  ];

  public readonly invoiceCurrencyPositionOptions: DropdownOption[] = [
    { value: 'prefix', label: 'Before The Amount', icon: 'format_align_left', description: 'Rendered as the symbol, then the figure' },
    { value: 'suffix', label: 'After The Amount', icon: 'format_align_right', description: 'Rendered as the figure, then the symbol' },
  ];

  /** The reference the next invoice will carry, rebuilt as the fields are edited. */
  get invoiceNumberPreview(): string {
    const prefix = this.settingsMap['INVOICE_PREFIX'] ?? this.extendedModuleDefaults['INVOICE_PREFIX'];
    const pad = Math.min(Math.max(Number(this.settingsMap['INVOICE_PAD_LENGTH']) || 4, 1), 10);
    const next = Math.max(Number(this.settingsMap['INVOICE_NEXT_NUMBER']) || 1, 0);
    const cycle = this.settingsMap['INVOICE_RESET_CYCLE'] || 'yearly';

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let cycleToken = '';
    if (cycle === 'yearly') cycleToken = yyyy + '-';
    else if (cycle === 'monthly') cycleToken = yyyy + mm + '-';
    else if (cycle === 'daily') cycleToken = yyyy + mm + dd + '-';

    return prefix + cycleToken + String(next).padStart(pad, '0');
  }

  // ── Live invoice preview ────────────────────────────────────────────
  // Sample order, deliberately fixed: the preview exists to judge layout and
  // formatting, so the figures must not move for reasons unrelated to a
  // setting the user just changed.
  public readonly invoicePreviewItems: ReadonlyArray<{ name: string; qty: number; rate: number }> = [
    { name: 'Chicken Mandi (Full)', qty: 1, rate: 58 },
    { name: 'Lamb Madfoon (Half)', qty: 2, rate: 42.5 },
    { name: 'Fresh Mint Lemonade', qty: 3, rate: 9 },
  ];

  get invoiceTaxRate(): number {
    if (this.settingsMap['TAX_ENABLED'] === 'false') return 0;
    const rate = Number(this.settingsMap['TAX_PERCENTAGE']);
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  }

  get invoiceTaxLabel(): string {
    return this.settingsMap['TAX_NAME'] || 'Tax';
  }

  get invoiceSubtotal(): number {
    return this.invoicePreviewItems.reduce((sum, l) => sum + l.qty * l.rate, 0);
  }

  get invoiceTaxAmount(): number {
    return this.invoiceSubtotal * (this.invoiceTaxRate / 100);
  }

  get invoiceGrandTotal(): number {
    return this.invoiceSubtotal + this.invoiceTaxAmount;
  }

  get invoiceDueDays(): number {
    const days = Number(this.settingsMap['INVOICE_DUE_DAYS']);
    return Number.isFinite(days) && days > 0 ? days : 0;
  }

  get invoiceIssueDate(): string {
    return this.invoiceFormatDate(new Date());
  }

  get invoiceDueDate(): string {
    const due = new Date();
    due.setDate(due.getDate() + this.invoiceDueDays);
    return this.invoiceFormatDate(due);
  }

  /** Paper choice drives the sheet width, which is the whole point of seeing it. */
  get invoicePaperClass(): string {
    switch (this.settingsMap['INVOICE_PAPER_SIZE']) {
      case 'A5': return 'is-a5';
      case '80mm': return 'is-thermal';
      default: return 'is-a4';
    }
  }

  get invoicePaperLabel(): string {
    const match = this.invoicePaperOptions.find((o) => o.value === (this.settingsMap['INVOICE_PAPER_SIZE'] || 'A4'));
    return match ? match.label : 'A4 (210 x 297mm)';
  }

  /** Stands in for a logo the settings screen has no upload for yet. */
  get invoiceBrandInitials(): string {
    const name = (this.settingsMap['BUSINESS_NAME'] || 'Your Restaurant').trim();
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

  /** Applies the decimal count and symbol placement chosen on this tab. */
  public invoiceMoney(amount: number): string {
    const raw = Number(this.settingsMap['INVOICE_DECIMALS']);
    const decimals = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 3) : 2;
    const symbol = this.settingsMap['CURRENCY_SYMBOL'] || '₹';
    const figure = (Number.isFinite(amount) ? amount : 0).toFixed(decimals);
    return this.settingsMap['INVOICE_CURRENCY_POSITION'] === 'suffix' ? `${figure} ${symbol}` : `${symbol}${figure}`;
  }

  /** Hand-rolled rather than DatePipe: the stored format strings are the
   *  four offered above, not the full Angular pattern language. */
  public invoiceFormatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    const MMM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];

    switch (this.settingsMap['INVOICE_DATE_FORMAT']) {
      case 'MM/dd/yyyy': return `${MM}/${dd}/${yyyy}`;
      case 'yyyy-MM-dd': return `${yyyy}-${MM}-${dd}`;
      case 'dd MMM yyyy': return `${dd} ${MMM} ${yyyy}`;
      default: return `${dd}/${MM}/${yyyy}`;
    }
  }

  /** Plain-language echo of the reset cycle, shown beside the number preview. */
  get invoiceResetLabel(): string {
    const cycle = this.settingsMap['INVOICE_RESET_CYCLE'] || 'yearly';
    const match = this.invoiceResetOptions.find((o) => o.value === cycle);
    return match ? match.label : 'Never Reset';
  }

  /**
   * Fills in the Printer / Notification / Invoice defaults and hands the print
   * stations to PrinterService, which is what the receipt and KOT print paths
   * actually read. Runs on every refresh of the settings map.
   */
  private hydrateExtendedModules(flat: Record<string, string>): Record<string, string> {
    for (const [key, value] of Object.entries(this.extendedModuleDefaults)) {
      const current = flat[key];
      if (current === undefined || current === 'undefined' || current === 'null') {
        flat[key] = value;
      }
    }
    this.applyPrinterStations(flat);
    return flat;
  }

  /** Copies the three stations out of the settings map into PrinterService. */
  private applyPrinterStations(map: Record<string, string>): void {
    const width = (value: string): '80mm' | '58mm' => (value === '58mm' ? '58mm' : '80mm');
    try {
      this.printer.saveConfig({
        receiptPrinter: {
          enabled: map['PRINTER_RECEIPT_ENABLED'] === 'true',
          name: map['PRINTER_RECEIPT_NAME'] || this.extendedModuleDefaults['PRINTER_RECEIPT_NAME'],
          paperWidth: width(map['PRINTER_RECEIPT_WIDTH']),
          autoPrintOnCheckout: map['PRINTER_RECEIPT_AUTO'] === 'true',
        },
        kitchenPrinter: {
          enabled: map['PRINTER_KITCHEN_ENABLED'] === 'true',
          name: map['PRINTER_KITCHEN_NAME'] || this.extendedModuleDefaults['PRINTER_KITCHEN_NAME'],
          paperWidth: width(map['PRINTER_KITCHEN_WIDTH']),
          autoPrintKot: map['PRINTER_KITCHEN_AUTO'] === 'true',
        },
        barPrinter: {
          enabled: map['PRINTER_BAR_ENABLED'] === 'true',
          name: map['PRINTER_BAR_NAME'] || this.extendedModuleDefaults['PRINTER_BAR_NAME'],
          paperWidth: width(map['PRINTER_BAR_WIDTH']),
          autoPrintKot: map['PRINTER_BAR_AUTO'] === 'true',
        },
      });
    } catch (_) {}
  }

  /** Edits on the Printer tab reach the print paths without waiting for a save. */
  public onPrinterConfigChanged(): void {
    this.applyPrinterStations(this.settingsMap);
  }

  /** Reads one module's flat keys back into the JSON shape that is stored. */
  private packExtendedModule(fields: Record<string, string>): Record<string, string> {
    const packed: Record<string, string> = {};
    for (const [jsonKey, flatKey] of Object.entries(fields)) {
      const value = this.settingsMap[flatKey];
      packed[jsonKey] =
        value === undefined || value === null
          ? this.extendedModuleDefaults[flatKey] ?? ''
          : String(value);
    }
    return packed;
  }

  /** Spreads one stored JSON row back out over its flat keys. */
  private unpackExtendedModule(
    flat: Record<string, string>,
    raw: string | undefined,
    fields: Record<string, string>,
  ): void {
    if (!raw) return;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object') return;
      for (const [jsonKey, flatKey] of Object.entries(fields)) {
        if (parsed[jsonKey] !== undefined && parsed[jsonKey] !== null) {
          flat[flatKey] = String(parsed[jsonKey]);
        }
      }
    } catch (_) {}
  }

  /**
   * Pushes a sample page through the configured stations so the wiring can be
   * checked without ringing up a real order.
   */
  public sendTestPrint(kind: 'receipt' | 'kot'): void {
    this.applyPrinterStations(this.settingsMap);
    try {
      if (kind === 'receipt') {
        this.printer.printThermalReceipt(
          {
            bill_number: 'TEST-0001',
            order_type: 'WALK_IN',
            created_at: new Date().toISOString(),
            cashier_name: 'Test Print',
            items: [
              { product_name: 'Chicken Mandi', quantity: 1, unit_price: 320, subtotal: 320 },
              { product_name: 'Mint Lemonade', quantity: 2, unit_price: 60, subtotal: 120 },
            ],
            subtotal: 440,
            tax_amount: 22,
            total_amount: 462,
            payment_method: 'CASH',
          },
          {
            businessName: this.settingsMap['BUSINESS_NAME'] || 'Test Print',
            address: this.settingsMap['BUSINESS_ADDRESS'] || '',
            phone: this.settingsMap['BUSINESS_PHONE'] || '',
            gstin: this.settingsMap['BUSINESS_GSTIN'] || '',
            footer: 'This is a test page — no sale was recorded.',
          },
        );
      } else {
        this.printer.printKot({
          kotNumber: 'KOT-TEST',
          orderType: 'DINE_IN',
          tableNumber: 'T-01',
          orderTime: new Date().toISOString(),
          cashierName: 'Test Print',
          notes: 'Test ticket — no kitchen action needed',
          items: [{ productName: 'Chicken Mandi', quantity: 1 }],
        });
      }
      this.notify.info('Test page sent to the print dialog.');
    } catch (_) {
      this.notify.error('Could not open the print dialog. Check the browser popup blocker.');
    }
  }

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
      'customization',
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
      'printer',
      'notification',
      'invoice',
      'databackup',
    ].includes(tab);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DATA BACKUP
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Opens the tab and loads what a backup would contain.
   *
   * The summary is fetched on open rather than with the rest of the settings
   * because it queries INFORMATION_SCHEMA across every table, and nobody
   * visiting the theme tab should pay for that.
   */
  public openDataBackup(): void {
    this.activeTab = 'databackup';
    this.backupStatus = null;

    // Always re-read the folder: it may have been changed from another
    // session, and showing a stale path would send someone looking for
    // backups in the wrong place.
    this.loadBackupFolder();

    if (this.backupInfo) return;

    this.backup
      .getInfo()
      .then((res) => {
        if (res.success && res.data) this.backupInfo = res.data;
      })
      .catch(() => {
        // The summary is a nicety; Backup Now works without it, so a failure
        // here is not worth a toast.
        this.backupInfo = null;
      });
  }

  private loadBackupFolder(): void {
    this.backup
      .getFolder()
      .then((res) => {
        const data = res.data;
        if (!data) return;

        this.backupFolderConfigured = !!data.configured;
        this.backupFolderSaved = data.path ?? '';

        // Only overwrite the input when the operator has not started editing,
        // so a reload cannot discard something half-typed.
        if (!this.backupFolderDirty) {
          this.backupFolderPath = data.path ?? '';
        }

        // Surface a saved-but-now-broken path — a removed USB drive or a
        // renamed folder — rather than waiting for a backup to fail.
        this.backupFolderCheck =
          data.configured && !data.ok
            ? {
                path: data.path,
                ok: false,
                exists: data.exists,
                writable: data.writable,
                created: false,
                message: data.message,
              }
            : null;
      })
      .catch(() => {
        this.backupFolderConfigured = false;
      });
  }

  // ── Folder browser ─────────────────────────────────────────────────────

  /**
   * Browse: Windows' own Select Folder dialog where the server can open it,
   * the in-app folder browser otherwise.
   *
   * The native dialog opens on the POS server's desktop, which on a standard
   * single-PC install is the screen in front of the operator. It is preferred
   * because it is the file picker they already know — drives, Quick Access,
   * New folder, a path box. The in-app browser stays as the fallback for a
   * non-Windows server, or one with no interactive desktop.
   */
  public async openFolderBrowser(): Promise<void> {
    if (this.isPickingNatively) return;

    // Probed once and remembered, so Browse does not pay for the check every
    // time it is clicked.
    if (this.nativePickerAvailable === null) {
      try {
        const probe = await this.backup.pickerAvailable();
        this.nativePickerAvailable = probe.data?.available ?? false;
      } catch {
        this.nativePickerAvailable = false;
      }
    }

    if (!this.nativePickerAvailable) {
      this.openInAppBrowser();
      return;
    }

    this.isPickingNatively = true;
    try {
      const res = await this.backup.pickFolderNatively(this.backupFolderPath.trim() || undefined);
      const data = res.data;

      if (!data || data.status === 'unsupported') {
        this.nativePickerAvailable = false;
        this.openInAppBrowser();
        return;
      }

      // Cancelling is not a failure and leaves everything as it was.
      if (data.status === 'cancelled') return;

      if (data.path) {
        this.backupFolderPath = data.path;
        this.backupFolderDirty = true;
        this.backupFolderCheck = null;
        // Chosen from the OS dialog, so save it straight away rather than
        // making them press Save Location as well.
        await this.saveBackupFolder();
      }
    } catch (err: any) {
      // A timeout means the dialog had nowhere to appear — an API running as a
      // service with no desktop. Fall back rather than leaving Browse dead.
      this.notify.warning(
        err?.error?.message ??
          'The Windows folder dialog could not be opened. Using the built-in browser instead.',
        'Opening Built-in Browser'
      );
      this.nativePickerAvailable = false;
      this.openInAppBrowser();
    } finally {
      this.isPickingNatively = false;
    }
  }

  /**
   * Opens the in-app browser at whatever is already in the box, so it
   * continues from the current location rather than the drive list.
   */
  public openInAppBrowser(): void {
    this.showFolderBrowser = true;
    this.isNamingFolder = false;
    this.newFolderName = '';
    this.selectedBrowsePath = '';
    this.browseTo(this.backupFolderPath.trim() || undefined);
  }

  public closeFolderBrowser(): void {
    this.showFolderBrowser = false;
    this.isNamingFolder = false;
  }

  /** Lists a folder. Passing nothing lists the drive roots. */
  public browseTo(folderPath?: string): void {
    this.isBrowsing = true;
    this.isNamingFolder = false;
    this.selectedBrowsePath = '';

    this.backup
      .browse(folderPath)
      .then((res) => {
        this.browseResult = res.data ?? null;

        // A path typed into the box that no longer exists would leave the
        // dialog stuck on an error with nothing to click, so fall back to the
        // drive list.
        if (this.browseResult?.error && folderPath && this.browseResult.path === '') {
          this.browseTo(undefined);
        }
      })
      .catch(() => {
        this.browseResult = null;
        this.notify.error('The folder list could not be loaded.', 'Browse Failed');
      })
      .finally(() => {
        this.isBrowsing = false;
      });
  }

  public startNewFolder(): void {
    this.isNamingFolder = true;
    this.newFolderName = '';
  }

  /** Creates a subfolder in the open folder, then navigates into it. */
  public async createFolderHere(): Promise<void> {
    const parent = this.browseResult?.path;
    const name = this.newFolderName.trim();
    if (!parent || !name || this.isCreatingFolder) return;

    this.isCreatingFolder = true;
    try {
      const res = await this.backup.createFolder(parent, name);
      if (res.success && res.data?.ok) {
        this.isNamingFolder = false;
        this.newFolderName = '';
        this.browseTo(res.data.path);
      }
    } catch (err: any) {
      this.notify.error(
        err?.error?.message ?? 'The folder could not be created.',
        'Folder Not Created'
      );
    } finally {
      this.isCreatingFolder = false;
    }
  }

  /**
   * Takes the highlighted folder — or the open one when nothing is highlighted
   * — and saves it as the destination in one step, so choosing a folder does
   * not also require pressing Save Location.
   */
  public async useSelectedFolder(): Promise<void> {
    const chosen = this.selectedBrowsePath || this.browseResult?.path;
    if (!chosen) return;

    this.backupFolderPath = chosen;
    this.backupFolderDirty = true;
    this.closeFolderBrowser();
    await this.saveBackupFolder();
  }

  /** Validates the typed path and, if usable, saves it as the destination. */
  public async saveBackupFolder(create = false): Promise<void> {
    const folder = this.backupFolderPath.trim();
    if (!folder || this.isSavingFolder) return;

    this.isSavingFolder = true;
    this.backupFolderCheck = null;

    try {
      const res = await this.backup.saveFolder(folder, create);
      this.backupFolderCheck = res.data ?? null;

      if (res.success && res.data?.ok) {
        this.backupFolderSaved = res.data.path;
        this.backupFolderPath = res.data.path;
        this.backupFolderConfigured = true;
        this.backupFolderDirty = false;
        this.notify.success(
          res.data.created ? 'Folder created and saved as the backup location.' : 'Backup location saved.',
          'Location Saved'
        );
      }
    } catch (err: any) {
      // A rejected path comes back as a 400 with the reason attached, which is
      // more useful on the field than in a toast.
      const check = err?.error?.error?.details ?? err?.error?.details;
      this.backupFolderCheck = check ?? {
        path: folder,
        ok: false,
        exists: false,
        writable: false,
        created: false,
        message: err?.error?.message ?? 'The location could not be saved.',
      };
    } finally {
      this.isSavingFolder = false;
    }
  }

  /**
   * Runs the backup: folder picker where the browser supports it, ordinary
   * download where it does not.
   *
   * Dismissing the picker is not a failure — it leaves no message at all,
   * because an error toast for "I changed my mind" is noise.
   */
  public async runBackup(): Promise<void> {
    if (this.isBackingUp) return;

    this.isBackingUp = true;
    this.backupStatus = null;

    try {
      // A configured folder wins: the server writes the file itself, so there
      // is nothing to pick and nothing to download. The picker and the plain
      // download remain the fallbacks for when no location has been set.
      const result = this.backupFolderConfigured
        ? await this.backup.backupToConfiguredFolder()
        : this.backup.canChooseFolder
          ? await this.backup.backupToFolder()
          : await this.backup.backupToDownloads();

      const size = this.formatBytes(result.bytes);

      if (result.via === 'server') {
        this.backupStatus = {
          kind: 'ok',
          message: result.renamedFrom
            ? `Saved as ${result.filePath} (${size}) — ${result.renamedFrom} already existed.`
            : `Saved to ${result.filePath} (${size}).`,
        };
        this.notify.success(
          result.renamedFrom
            ? `A backup for today already existed, so this one was saved as ${result.fileName}.`
            : `${result.fileName} saved to ${this.backupFolderSaved}.`,
          'Backup Saved'
        );
      } else if (result.renamedFrom) {
        this.backupStatus = {
          kind: 'ok',
          message: `Saved as ${result.fileName} (${size}) — ${result.renamedFrom} already existed.`,
        };
        this.notify.success(
          `A backup for today already existed, so this one was saved as ${result.fileName}.`,
          'Backup Saved'
        );
      } else if (result.via === 'download') {
        this.backupStatus = {
          kind: 'ok',
          message: `${result.fileName} (${size}) saved to your downloads folder.`,
        };
        this.notify.success(`${result.fileName} saved to your downloads folder.`, 'Backup Saved');
      } else {
        this.backupStatus = {
          kind: 'ok',
          message: `${result.fileName} (${size}) saved to the folder you chose.`,
        };
        this.notify.success(`${result.fileName} saved successfully.`, 'Backup Saved');
      }
    } catch (err: any) {
      const code = String(err?.message ?? '');

      if (code === 'BACKUP_CANCELLED') {
        this.backupStatus = null;
      } else if (code === 'FOLDER_PICKER_UNSUPPORTED') {
        this.backupStatus = {
          kind: 'error',
          message: 'This browser cannot open a folder picker. Try Chrome or Edge.',
        };
      } else {
        this.backupStatus = { kind: 'error', message: code || 'The backup could not be completed.' };
        this.notify.error(code || 'The backup could not be completed.', 'Backup Failed');
      }
    } finally {
      this.isBackingUp = false;
    }
  }

  public formatBytes(bytes: number): string {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  public scrollActiveTabIntoView(): void {
    if (typeof document !== 'undefined') {
      const activeBtn = document.querySelector('.tab-nav-bar .tab-btn.is-active') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      // A Brand Theme sub-tab reached by deep link or Configure button also has
      // to be brought into view on its own rail, not just the main one.
      const activeSubBtn = document.querySelector('.subtab-nav-bar .subtab-btn.is-active') as HTMLElement;
      if (activeSubBtn) {
        activeSubBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

    // Unpack the Printer / Notification / Invoice JSON rows
    this.unpackExtendedModule(flat, flat['system_printer'] || flat['SYSTEM_PRINTER'], this.printerFieldMap);
    this.unpackExtendedModule(flat, flat['system_notification'] || flat['SYSTEM_NOTIFICATION'], this.notificationFieldMap);
    this.unpackExtendedModule(flat, flat['system_invoice'] || flat['SYSTEM_INVOICE'], this.invoiceFieldMap);

    return this.hydrateExtendedModules(flat);
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
      case 'customization': return 'POS Customization';
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
      case 'printer': return 'Printer Settings';
      case 'notification': return 'Notification Settings';
      case 'invoice': return 'Invoice Settings';
      default: return 'Settings';
    }
  }

  private getTabSettingsPayload(tab: SettingsTab): Record<string, any> {
    const payload: Record<string, any> = {};

    if (tab === 'customization') {
      Object.assign(payload, this.customization.toPayload());
    } else if (tab === 'theme') {
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
    } else if (tab === 'printer') {
      payload['system_printer'] = JSON.stringify(this.packExtendedModule(this.printerFieldMap));
    } else if (tab === 'notification') {
      payload['system_notification'] = JSON.stringify(this.packExtendedModule(this.notificationFieldMap));
    } else if (tab === 'invoice') {
      payload['system_invoice'] = JSON.stringify(this.packExtendedModule(this.invoiceFieldMap));
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

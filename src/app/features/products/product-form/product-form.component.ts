import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { StockService } from '../../../core/services/stock.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Category, Product, ProductVariant, StockItem, ProductAddon, ProductAddonMapping, VariantStockMode } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';

/**
 * Add / Edit Dish.
 *
 * One component serves both routes: /products/new has no :id, /products/:id/edit
 * does. Keeping them together means the form, its validation and the variant/addon
 * editor cannot drift between "create" and "update".
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent, ActionLoadingDirective],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>Catalog</span>
        <span class="breadcrumb-separator">›</span>
        <a routerLink="/products" class="breadcrumb-link">Dishes &amp; Products</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ isEdit ? 'Edit Dish' : 'Add New Dish' }}</span>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. PAGE HEADER                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-header-card">
        <div class="header-left">
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="back-btn"
              title="Back to Dishes"
              aria-label="Back to Dishes"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>

            <span class="modal-icon-badge">
              <span class="material-symbols-outlined">{{ isEdit ? 'edit' : 'restaurant' }}</span>
            </span>

            <div>
              <h1 class="module-title">{{ isEdit ? 'Edit Menu Dish' : 'Add New Menu Dish' }}</h1>
              <p class="module-subtitle">Configure dish information, pricing, variants and attached add-ons</p>
            </div>
          </div>
        </div>
      </div>

      <div class="loading-note" *ngIf="isLoading">Loading dish…</div>

      <form (ngSubmit)="save()" class="product-form-grid" *ngIf="!isLoading">
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- LEFT COLUMN: Dish Information                               -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="form-column">
          <!-- Identity -->
          <section class="form-card">
            <h2 class="form-card-title">
              <span class="material-symbols-outlined">restaurant</span>
              <span>Dish Details</span>
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label">Dish Name <span class="text-rose-500">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                  placeholder="e.g. Chicken Biryani"
                  class="form-control text-sm w-full"
                  title="Dish Name"
                />
              </div>

              <div class="form-group mb-0">
                <div class="flex items-center justify-between">
                  <label class="form-label">SKU / Item Code <span class="text-rose-500">*</span></label>
                  <span *ngIf="isCheckingSku" class="text-[11px] text-purple-600 font-semibold animate-pulse">Checking…</span>
                  <span *ngIf="!isCheckingSku && skuChecked && !isSkuDuplicate" class="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-xs">check_circle</span> Available
                  </span>
                </div>
                <input
                  type="text"
                  [(ngModel)]="form.sku"
                  (ngModelChange)="onSkuInput($event)"
                  (blur)="checkSkuUniqueness()"
                  name="sku"
                  required
                  placeholder="e.g. BIR-001"
                  class="form-control text-sm font-mono w-full"
                  [class.is-invalid]="isSkuDuplicate"
                  title="SKU / Item Code"
                />
                <p *ngIf="isSkuDuplicate" class="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">error</span>
                  <span>{{ skuDuplicateMessage }}</span>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label">Category <span class="text-rose-500">*</span></label>
                <app-custom-dropdown
                  [options]="categoryOptions"
                  [(ngModel)]="form.categoryId"
                  name="categoryId"
                  [searchable]="true"
                  placeholder="Select Category"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Menu Status</label>
                <app-custom-dropdown
                  [options]="statusOptions"
                  [(ngModel)]="form.status"
                  name="status"
                  placeholder="Select Status"
                  minWidth="100%"
                ></app-custom-dropdown>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Description</label>
              <textarea
                title="Description"
                [(ngModel)]="form.description"
                name="description"
                rows="3"
                placeholder="Fragrant spiced basmati rice served with tender meat…"
                class="form-control text-sm w-full"
              ></textarea>
            </div>
          </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- RIGHT COLUMN: Image & Pricing                               -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="form-column">
          <!-- Dish Image -->
          <section class="form-card">
            <h2 class="form-card-title">
              <span class="material-symbols-outlined">image</span>
              <span>Dish Image</span>
            </h2>

            <div class="image-upload-row">
              <div class="image-upload-preview" [class.is-empty]="!form.imageUrl">
                <img *ngIf="form.imageUrl" [src]="settingsService.assetUrl(form.imageUrl)" alt="Dish image preview" />
                <span *ngIf="!form.imageUrl" class="material-symbols-outlined">add_photo_alternate</span>
              </div>
              <div class="image-upload-actions">
                <input
                  type="file"
                  hidden
                  #dishPicker
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  (change)="onImageFile($event, dishPicker)"
                  title="Choose dish image"
                />
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                    [disabled]="isUploadingImage"
                    (click)="dishPicker.click()"
                  >
                    <span class="material-symbols-outlined">{{ isUploadingImage ? 'progress_activity' : 'upload' }}</span>
                    <span>{{ isUploadingImage ? 'Uploading…' : (form.imageUrl ? 'Replace' : 'Choose Image') }}</span>
                  </button>
                  <button
                    *ngIf="form.imageUrl && !isUploadingImage"
                    type="button"
                    class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs"
                    (click)="form.imageUrl = ''"
                  >
                    <span class="material-symbols-outlined">delete</span>
                    <span>Remove</span>
                  </button>
                </div>
                <p class="form-hint">PNG, JPG, WEBP or GIF · up to 2 MB</p>
              </div>
            </div>
          </section>

          <!-- Pricing & Tax -->
          <section class="form-card">
            <h2 class="form-card-title">
              <span class="material-symbols-outlined">{{ form.variants.length > 0 ? 'percent' : 'payments' }}</span>
              <span>{{ form.variants.length > 0 ? 'Tax' : 'Pricing &amp; Tax' }}</span>
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start" *ngIf="form.variants.length === 0">
              <div class="form-group mb-0">
                <label class="form-label">Selling Price ({{ settingsService.currencySymbol() }})</label>
                <input
                  title="Selling Price"
                  type="number"
                  min="0"
                  step="any"
                  [(ngModel)]="form.sellingPrice"
                  name="sellingPrice"
                  class="form-control font-mono font-bold text-sm w-full"
                  placeholder="0.00"
                />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Tax Rate (%)</label>
                <input
                  title="Tax Rate"
                  type="number"
                  min="0"
                  step="any"
                  [(ngModel)]="form.taxRate"
                  name="taxRate"
                  class="form-control font-mono text-sm w-full"
                  placeholder="5"
                />
              </div>

              <div class="form-group mb-0 md:col-span-2">
                <label class="form-label">Stock Master Item</label>
                <app-custom-dropdown
                  [options]="stockItemOptions"
                  [(ngModel)]="form.stockId"
                  name="stockId"
                  [searchable]="true"
                  placeholder="Select stock master item…"
                  minWidth="100%"
                ></app-custom-dropdown>
                <p class="form-hint" *ngIf="selectedStockItem">
                  Balance: <strong>{{ selectedStockItem.current_quantity }} {{ selectedStockItem.unit_type }}</strong>
                  · Code: <span class="font-mono">{{ selectedStockItem.stock_code }}</span>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3.5 items-start" *ngIf="form.variants.length > 0">
              <div class="form-group mb-0">
                <label class="form-label">Tax Rate (%)</label>
                <input
                  title="Tax Rate"
                  type="number"
                  min="0"
                  step="any"
                  [(ngModel)]="form.taxRate"
                  name="taxRate"
                  class="form-control font-mono text-sm w-full"
                  placeholder="5"
                />
              </div>

              <p class="form-note">
                <span class="material-symbols-outlined">info</span>
                <span>
                  This dish is priced and stocked by its portions — configure prices and stock sources in the <strong>Dish Variants</strong> table below.
                </span>
              </p>
            </div>
          </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- FULL WIDTH: Dish Variants Table                             -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <section class="form-card is-full-width">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 class="form-card-title !mb-1">
                <span class="material-symbols-outlined">lunch_dining</span>
                <span>Dish Variants</span>
              </h2>
              <p class="form-hint variant-mode-hint" [ngSwitch]="form.variantStockMode">
                <ng-container *ngSwitchCase="'EACH'">
                  Each portion uses <strong>its own single stock item</strong> — e.g. Full uses Mutton, Half uses Chicken.
                </ng-container>
                <ng-container *ngSwitchCase="'MULTI'">
                  Each portion uses <strong>several stock items at once</strong> — e.g. Full uses Mutton 2 + Chicken 4 + Rice 1.
                </ng-container>
                <ng-container *ngSwitchDefault>
                  Every portion uses <strong>one shared stock item</strong> — set how much each portion takes, e.g. Full uses 4, Half uses 2.
                </ng-container>
              </p>
            </div>
            <div class="variant-header-controls">
              <div class="mode-switch" role="group" aria-label="Stock source mode">
                <button
                  type="button"
                  class="mode-btn"
                  [class.is-active]="form.variantStockMode === 'COMMON'"
                  (click)="setStockMode('COMMON')"
                  title="All portions draw from one stock item"
                >
                  <span class="material-symbols-outlined">inventory_2</span>
                  <span>Common Stock</span>
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  [class.is-active]="form.variantStockMode === 'EACH'"
                  (click)="setStockMode('EACH')"
                  title="Each portion picks its own stock item"
                >
                  <span class="material-symbols-outlined">list</span>
                  <span>Each Stock</span>
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  [class.is-active]="form.variantStockMode === 'MULTI'"
                  (click)="setStockMode('MULTI')"
                  title="Each portion uses several stock items at once"
                >
                  <span class="material-symbols-outlined">stacks</span>
                  <span>Multi Stock</span>
                </button>
              </div>

              <button
                *ngIf="form.variants.length > 0 && form.variantStockMode !== 'MULTI'"
                type="button"
                class="action-btn btn-outline-danger !py-1.5 !px-3 !text-xs shrink-0"
                (click)="clearAllVariants()"
                title="Remove all variants and sell as a single item"
              >
                <span class="material-symbols-outlined">delete_sweep</span>
                <span>Remove All Variants</span>
              </button>

              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs shrink-0"
                (click)="addVariant()"
              >
                <span class="material-symbols-outlined">add</span>
                <span>{{ form.variantStockMode === 'MULTI' ? 'Add Portion' : 'Add Variant' }}</span>
              </button>
            </div>
          </div>

          <!-- COMMON: one source for every portion -->
          <div class="form-group mb-0" *ngIf="form.variantStockMode === 'COMMON'">
            <label class="form-label font-semibold text-purple-950">Stock Master Item — every portion consumes this</label>
            <app-custom-dropdown
              [options]="stockItemOptions"
              [(ngModel)]="form.stockId"
              name="stockId"
              [searchable]="true"
              placeholder="Select stock master item…"
              minWidth="100%"
            ></app-custom-dropdown>
            <p class="form-hint" *ngIf="selectedStockItem">
              Balance: <strong>{{ selectedStockItem.current_quantity }} {{ selectedStockItem.unit_type }}</strong>
              · Code: <span class="font-mono">{{ selectedStockItem.stock_code }}</span>
            </p>
          </div>

          <!-- MULTI: every portion lists all the stock items it uses -->
          <div class="multi-stock" *ngIf="form.variantStockMode === 'MULTI'">
            <div class="multi-howto">
              <span class="material-symbols-outlined">tips_and_updates</span>
              <span>
                Selling <strong>1 portion</strong> takes <strong>every</strong> stock item listed on it, at the quantity shown.
                A sale is blocked if any one of them runs short.
              </span>
            </div>

            <div
              class="portion-card"
              *ngFor="let v of form.variants; let i = index"
              [class.is-default]="v.isDefault"
            >
              <!-- Portion basics -->
              <div class="portion-head">
                <span class="portion-index" [title]="'Portion ' + (i + 1)">{{ i + 1 }}</span>

                <div class="portion-field portion-name">
                  <label class="form-label" [for]="'mName' + i">Portion name</label>
                  <input
                    [id]="'mName' + i"
                    type="text"
                    [(ngModel)]="v.name"
                    [name]="'variantName' + i"
                    placeholder="e.g. Full, Half, Regular"
                    class="form-control text-sm"
                    [class.is-invalid]="triedSave && !(v.name || '').trim()"
                  />
                </div>

                <div class="portion-field portion-order">
                  <label class="form-label" [for]="'mOrder' + i">Order</label>
                  <input
                    [id]="'mOrder' + i"
                    type="number"
                    min="1"
                    step="1"
                    [(ngModel)]="v.displayOrder"
                    (ngModelChange)="onDisplayOrderChange($event, i)"
                    [name]="'variantOrder' + i"
                    class="form-control font-mono font-bold text-sm text-center"
                    [class.is-invalid]="isDuplicateOrder(v.displayOrder, i)"
                    title="Position on the POS (must be unique)"
                  />
                </div>

                <div class="portion-actions">
                  <button
                    type="button"
                    class="default-toggle-btn"
                    [class.is-default]="v.isDefault"
                    (click)="setDefaultVariant(i)"
                    [title]="v.isDefault ? 'Default portion on the POS' : 'Make this the default portion'"
                  >
                    <span class="material-symbols-outlined">{{ v.isDefault ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
                    <span>{{ v.isDefault ? 'Default' : 'Set Default' }}</span>
                  </button>
                  <button
                    *ngIf="form.variants.length > 1"
                    type="button"
                    class="action-icon-btn is-danger"
                    (click)="removeVariant(i)"
                    title="Remove this portion"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>

              <!-- Recipe: the stock items one portion takes -->
              <div class="recipe">
                <div class="recipe-title">
                  <span class="material-symbols-outlined">stacks</span>
                  <span>Stock used by 1 {{ (v.name || '').trim() || 'portion' }}</span>
                  <span class="recipe-count">{{ v.stocks.length }} {{ v.stocks.length === 1 ? 'item' : 'items' }}</span>
                </div>

                <div class="recipe-head" *ngIf="v.stocks.length > 0">
                  <span></span>
                  <span>Stock item</span>
                  <span>Qty per portion</span>
                  <span>In stock · cost</span>
                  <span></span>
                </div>

                <div class="recipe-line" *ngFor="let line of v.stocks; let j = index">
                  <span class="recipe-num">{{ j + 1 }}</span>

                  <div class="recipe-stock" [class.is-invalid]="triedSave && !line.stockId">
                    <app-custom-dropdown
                      [options]="lineStockOptions(i, j)"
                      [(ngModel)]="line.stockId"
                      [name]="'mStock' + i + '_' + j"
                      [searchable]="true"
                      placeholder="Pick a stock item…"
                      minWidth="100%"
                    ></app-custom-dropdown>
                  </div>

                  <div class="recipe-qty">
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      [(ngModel)]="line.quantity"
                      [name]="'mQty' + i + '_' + j"
                      placeholder="0"
                      class="form-control font-mono font-bold text-sm text-center"
                      [class.is-invalid]="triedSave && !(Number(line.quantity) > 0)"
                      title="How much of this stock item one portion uses"
                    />
                    <span class="recipe-unit">{{ stockFor(line.stockId)?.unit_type || 'unit' }}</span>
                  </div>

                  <div class="recipe-meta">
                    <ng-container *ngIf="stockFor(line.stockId) as s; else pickHint">
                      <span [class.is-short]="Number(line.quantity) > 0 && Number(s.current_quantity) < Number(line.quantity)">
                        {{ Number(s.current_quantity) | number: '1.0-3' }} {{ s.unit_type }}
                      </span>
                      <span class="recipe-cost">{{ settingsService.currencySymbol() }}{{ lineCost(line) | number: '1.2-2' }}</span>
                    </ng-container>
                    <ng-template #pickHint><span class="recipe-muted">Pick an item</span></ng-template>
                  </div>

                  <button
                    type="button"
                    class="action-icon-btn is-danger"
                    (click)="removeRecipeLine(v, j)"
                    [disabled]="v.stocks.length === 1"
                    [title]="v.stocks.length === 1 ? 'A portion needs at least one stock item' : 'Remove this stock item'"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>

                <button type="button" class="recipe-add" (click)="addRecipeLine(v)">
                  <span class="material-symbols-outlined">add</span>
                  <span>Add stock item</span>
                </button>
              </div>

              <!-- Costing: the whole portion's cost, price and profit in one place -->
              <div class="portion-costing">
                <!-- 1. Total stock cost, with each item's share -->
                <div class="cost-tile">
                  <span class="cost-tile-label">
                    <span class="material-symbols-outlined">receipt_long</span>
                    Total stock cost
                  </span>
                  <span class="cost-tile-value">{{ settingsService.currencySymbol() }}{{ portionCost(v) | number: '1.2-2' }}</span>
                  <div class="cost-breakdown" *ngIf="costedLines(v).length > 0; else noCost">
                    <div class="cost-breakdown-row" *ngFor="let line of costedLines(v)">
                      <span class="cost-breakdown-name">
                        {{ stockFor(line.stockId)?.name }}
                        <span class="cost-breakdown-qty">× {{ Number(line.quantity) | number: '1.0-3' }} {{ stockFor(line.stockId)?.unit_type }}</span>
                      </span>
                      <span class="cost-breakdown-amt">{{ settingsService.currencySymbol() }}{{ lineCost(line) | number: '1.2-2' }}</span>
                    </div>
                  </div>
                  <ng-template #noCost><span class="cost-tile-note">Pick stock items above to see the cost</span></ng-template>
                </div>

                <span class="cost-op" aria-hidden="true">→</span>

                <!-- 2. Selling price (editable) -->
                <div class="cost-tile is-price">
                  <label class="cost-tile-label" [for]="'mPrice' + i">
                    <span class="material-symbols-outlined">sell</span>
                    Selling price
                  </label>
                  <div class="price-input">
                    <span class="price-input-prefix">{{ settingsService.currencySymbol() }}</span>
                    <input
                      [id]="'mPrice' + i"
                      type="number"
                      min="0"
                      step="any"
                      [(ngModel)]="v.sellingPrice"
                      [name]="'variantPrice' + i"
                      placeholder="0.00"
                      title="What the guest pays for one portion"
                    />
                  </div>
                  <span class="cost-tile-note">What the guest pays for 1 {{ (v.name || '').trim() || 'portion' }}</span>
                </div>

                <span class="cost-op" aria-hidden="true">=</span>

                <!-- 3. Profit -->
                <div
                  class="cost-tile"
                  [class.is-profit]="portionMargin(v) > 0"
                  [class.is-loss]="portionMargin(v) < 0"
                >
                  <span class="cost-tile-label">
                    <span class="material-symbols-outlined">{{ portionMargin(v) < 0 ? 'trending_down' : 'trending_up' }}</span>
                    {{ portionMargin(v) < 0 ? 'Loss per portion' : 'Profit per portion' }}
                  </span>
                  <span class="cost-tile-value">
                    {{ portionMargin(v) < 0 ? '−' : '' }}{{ settingsService.currencySymbol() }}{{ absValue(portionMargin(v)) | number: '1.2-2' }}
                  </span>
                  <div class="margin-bar" *ngIf="Number(v.sellingPrice) > 0">
                    <span class="margin-bar-fill" [style.width.%]="marginBarWidth(v)"></span>
                  </div>
                  <span class="cost-tile-note">
                    <ng-container *ngIf="Number(v.sellingPrice) > 0; else noPrice">
                      {{ marginPercent(v) | number: '1.0-0' }}% margin{{ portionMargin(v) < 0 ? ' — stock costs more than the price' : '' }}
                    </ng-container>
                    <ng-template #noPrice>Enter a selling price</ng-template>
                  </span>
                </div>

                <!-- 4. What current stock allows -->
                <div class="cost-tile is-compact" [class.is-loss]="canMake(v) === 0">
                  <span class="cost-tile-label">
                    <span class="material-symbols-outlined">inventory</span>
                    Can make now
                  </span>
                  <span class="cost-tile-value">{{ canMake(v) ?? '—' }}</span>
                  <span class="cost-tile-note">{{ canMake(v) === null ? 'Pick stock items' : 'portions from current stock' }}</span>
                </div>
              </div>
            </div>

            <div class="empty-variants-box multi-empty" *ngIf="form.variants.length === 0">
              <span class="material-symbols-outlined text-purple-400 text-3xl">stacks</span>
              <p class="empty-text">Add a portion, then list every stock item it uses.</p>
            </div>

            <button type="button" class="add-portion-btn" (click)="addVariant()">
              <span class="material-symbols-outlined">add_circle</span>
              <span>{{ form.variants.length === 0 ? 'Add first portion' : 'Add another portion' }}</span>
            </button>
          </div>

          <!-- Variants Table -->
          <div class="variants-table-container" *ngIf="form.variantStockMode !== 'MULTI'">
            <table class="variant-table">
              <thead>
                <tr>
                  <th class="col-name">Portion / Size Name</th>
                  <th class="col-stock" *ngIf="form.variantStockMode === 'EACH'">Stock Master Item</th>
                  <th class="col-price">Selling Price ({{ settingsService.currencySymbol() }})</th>
                  <th class="col-consumption text-center">Stock Usage / Qty</th>
                  <th class="col-order text-center">Display Order</th>
                  <th class="col-default text-center">Default Portion</th>
                  <th class="col-action text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of form.variants; let i = index" class="variant-tr">
                  <td class="col-name">
                    <input
                      type="text"
                      [(ngModel)]="v.name"
                      [name]="'variantName' + i"
                      placeholder="e.g. Full, Half, Regular"
                      class="form-control text-sm"
                      title="Portion name"
                      required
                    />
                  </td>
                  <td class="col-stock" *ngIf="form.variantStockMode === 'EACH'">
                    <app-custom-dropdown
                      [options]="stockItemOptions"
                      [(ngModel)]="v.stockId"
                      [name]="'variantStock' + i"
                      [searchable]="true"
                      placeholder="Select stock item…"
                      minWidth="100%"
                    ></app-custom-dropdown>
                  </td>
                  <td class="col-price">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      [(ngModel)]="v.sellingPrice"
                      [name]="'variantPrice' + i"
                      placeholder="0.00"
                      class="form-control font-mono font-bold text-sm"
                      title="Portion selling price"
                      required
                    />
                  </td>
                  <td class="col-consumption text-center">
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      [(ngModel)]="v.stockConsumption"
                      [name]="'variantConsumption' + i"
                      placeholder="1.000"
                      class="form-control font-mono font-bold text-sm text-center"
                      title="Units of stock consumed per portion (e.g. 1 for Full, 0.5 for Half)"
                      required
                    />
                  </td>
                  <td class="col-order text-center">
                    <div class="order-input-wrapper">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        [(ngModel)]="v.displayOrder"
                        (ngModelChange)="onDisplayOrderChange($event, i)"
                        [name]="'variantOrder' + i"
                        placeholder="1"
                        class="form-control font-mono font-bold text-sm text-center"
                        [class.is-invalid]="isDuplicateOrder(v.displayOrder, i)"
                        title="Display order number (must be unique)"
                        required
                      />
                      <span *ngIf="isDuplicateOrder(v.displayOrder, i)" class="duplicate-badge" title="Duplicate Display Order">
                        Duplicate!
                      </span>
                    </div>
                  </td>
                  <td class="col-default text-center">
                    <button
                      type="button"
                      class="default-toggle-btn"
                      [class.is-default]="v.isDefault"
                      (click)="setDefaultVariant(i)"
                      [title]="v.isDefault ? 'Default Portion (Primary)' : 'Click to make this portion default'"
                    >
                      <span class="material-symbols-outlined">{{ v.isDefault ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
                      <span>{{ v.isDefault ? 'Default' : 'Set Default' }}</span>
                    </button>
                  </td>
                  <td class="col-action text-right">
                    <button
                      *ngIf="form.variants.length > 2"
                      type="button"
                      class="action-icon-btn is-danger"
                      (click)="removeVariant(i)"
                      title="Remove portion"
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="form.variants.length === 0">
                  <td [attr.colspan]="form.variantStockMode === 'EACH' ? 7 : 6" class="empty-table-cell">
                    <div class="empty-variants-box">
                      <span class="material-symbols-outlined text-purple-400 text-3xl">layers_clear</span>
                      <p class="empty-text">No variants added — this dish sells as a single item and one sale consumes 1 stock unit.</p>
                      <button type="button" class="action-btn btn-outline-purple !py-1 !px-3 !text-xs mt-1" (click)="addVariant()">
                        <span class="material-symbols-outlined">add</span>
                        <span>Add Variants (2)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- FULL WIDTH: Dish Add-ons (Free / Paid)                      -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <section class="form-card is-full-width">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 class="form-card-title !mb-1">
                <span class="material-symbols-outlined">extension</span>
                <span>Dish Add-ons (Free / Paid)</span>
              </h2>
              <p class="form-hint !max-w-[60ch]">
                Attach optional add-ons to this dish. Configure whether each add-on is charged as an <strong>Amount</strong> (custom price per add-on) or <strong>Free</strong> with a max selection limit.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs shrink-0"
                (click)="addAddonMapping()"
                [disabled]="allCatalogAddons.length === 0"
              >
                <span class="material-symbols-outlined">add</span>
                <span>Attach Add-on</span>
              </button>
            </div>
          </div>

          <!-- Add-ons Table -->
          <div class="variants-table-container">
            <table class="variant-table">
              <thead>
                <tr>
                  <th class="col-name">Add-on Item</th>
                  <th class="col-stock">Pricing Type</th>
                  <th class="col-price">Price / Free Limit</th>
                  <th class="col-action text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of form.addonMappings; let i = index" class="variant-tr">
                  <td class="col-name">
                    <app-custom-dropdown
                      [options]="getAddonSelectOptions(m.addon_id)"
                      [(ngModel)]="m.addon_id"
                      [name]="'addonSelect' + i"
                      (ngModelChange)="onAddonSelected(m)"
                      [searchable]="true"
                      placeholder="Select add-on…"
                      minWidth="100%"
                    ></app-custom-dropdown>
                  </td>

                  <td class="col-stock">
                    <div class="mode-switch" role="group" aria-label="Add-on pricing type">
                      <button
                        type="button"
                        class="mode-btn"
                        [class.is-active]="m.is_free === 'Amount'"
                        (click)="m.is_free = 'Amount'"
                        title="Charge this add-on as paid amount"
                      >
                        <span class="material-symbols-outlined">payments</span>
                        <span>Amount</span>
                      </button>
                      <button
                        type="button"
                        class="mode-btn"
                        [class.is-active]="m.is_free === 'Free'"
                        (click)="m.is_free = 'Free'"
                        title="Provide this add-on for free up to limit"
                      >
                        <span class="material-symbols-outlined">redeem</span>
                        <span>Free</span>
                      </button>
                    </div>
                  </td>

                  <td class="col-price">
                    <!-- When Amount is selected: show Price/Amount input -->
                    <div *ngIf="m.is_free === 'Amount'" class="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        [(ngModel)]="m.amount"
                        [name]="'addonAmount' + i"
                        placeholder="0.00"
                        class="form-control font-mono font-bold text-sm"
                        title="Price per add-on"
                        required
                      />
                      <span class="text-xs font-semibold text-gray-500 whitespace-nowrap">{{ settingsService.currencySymbol() }}</span>
                    </div>

                    <!-- When Free is selected: show Free Quantity/Limit input with Unlimited toggle -->
                    <div *ngIf="m.is_free === 'Free'" class="flex items-center gap-2 flex-wrap">
                      <div class="flex items-center gap-1.5" *ngIf="m.free_limit !== null && m.free_limit !== undefined">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          [(ngModel)]="m.free_limit"
                          [name]="'addonLimit' + i"
                          placeholder="e.g. 5"
                          class="form-control font-mono font-bold text-sm"
                          title="Max number of free add-ons"
                          style="width: 85px;"
                          required
                        />
                        <span class="text-xs font-semibold text-emerald-600 whitespace-nowrap">Free Limit</span>
                      </div>

                      <button
                        type="button"
                        class="free-limit-pill-btn"
                        [class.is-unlimited]="m.free_limit === null || m.free_limit === undefined"
                        (click)="m.free_limit = (m.free_limit === null || m.free_limit === undefined ? 1 : null)"
                        [title]="(m.free_limit === null || m.free_limit === undefined) ? 'Currently Unlimited. Click to set a numeric limit' : 'Click to make this free add-on Unlimited'"
                      >
                        <span class="material-symbols-outlined">{{ (m.free_limit === null || m.free_limit === undefined) ? 'all_inclusive' : 'tune' }}</span>
                        <span>{{ (m.free_limit === null || m.free_limit === undefined) ? '∞ Unlimited Free' : 'Set Unlimited' }}</span>
                      </button>
                    </div>
                  </td>

                  <td class="col-action text-right">
                    <button
                      type="button"
                      class="action-icon-btn is-danger"
                      (click)="removeAddonMapping(i)"
                      title="Remove add-on"
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>

                <tr *ngIf="form.addonMappings.length === 0">
                  <td colspan="4" class="empty-table-cell">
                    <div class="empty-variants-box">
                      <span class="material-symbols-outlined text-purple-400 text-3xl">extension_off</span>
                      <p class="empty-text">No add-ons attached to this dish.</p>
                      <button
                        type="button"
                        class="action-btn btn-outline-purple !py-1 !px-3 !text-xs mt-1"
                        (click)="addAddonMapping()"
                        [disabled]="allCatalogAddons.length === 0"
                      >
                        <span class="material-symbols-outlined">add</span>
                        <span>Attach First Add-on</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- STICKY ACTION BAR                                           -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="form-action-bar">
          <button type="button" (click)="goBack()" class="action-btn btn-outline-purple">
            Cancel
          </button>
          <button type="submit" class="action-btn btn-gradient-purple" [disabled]="isSaving">
            <span class="material-symbols-outlined">{{ isSaving ? 'progress_activity' : 'check' }}</span>
            <span>{{ isSaving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Dish') }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .product-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.25rem;
        align-items: start;
      }

      @media (max-width: 1100px) {
        .product-form-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      .form-column {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        min-width: 0;
      }

      /* Full width cards span both columns */
      .form-card.is-full-width {
        grid-column: 1 / -1;
      }

      .form-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.35rem 1.5rem;
        border-radius: 18px;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.1);
      }

      .form-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary-variant, #6B21A8);
      }

      .form-card-title .material-symbols-outlined {
        font-size: 19px;
        color: var(--primary, #7E22CE);
      }

      .form-note {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin: 0;
        padding: 0.7rem 0.85rem;
        border-radius: 12px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        font-size: 0.6875rem;
        line-height: 1.5;
        color: var(--text-muted, #6B7280);
      }

      .form-note .material-symbols-outlined {
        font-size: 16px;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .form-hint {
        margin: 0;
        font-size: 0.6875rem;
        line-height: 1.45;
        color: var(--text-muted, #6B7280);
      }

      .loading-note {
        padding: 2rem;
        text-align: center;
        font-size: 0.8125rem;
        color: var(--text-muted, #6B7280);
      }

      /* Image picker */
      .image-upload-row {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }

      .image-upload-preview {
        width: 80px;
        height: 80px;
        border-radius: 14px;
        overflow: hidden;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .image-upload-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-upload-preview.is-empty .material-symbols-outlined {
        font-size: 32px;
        color: var(--text-muted, #9CA3AF);
      }

      .image-upload-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* Variant editor */
      .variant-header-controls {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-shrink: 0;
      }

      /* Common / Each switch */
      .mode-switch {
        display: inline-flex;
        padding: 3px;
        border-radius: 999px;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
      }

      .mode-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.32rem 0.8rem;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--text-muted, #6B7280);
        font-family: inherit;
        font-size: 0.6875rem;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        transition:
          color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
          background-color 0.24s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .mode-btn .material-symbols-outlined { font-size: 15px; }

      .mode-btn.is-active {
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
        color: #FFFFFF;
        box-shadow: 0 3px 10px -4px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
      }

      /* Table Styles */
      .variants-table-container {
        width: 100%;
        overflow-x: auto;
        border-radius: 14px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
      }

      .variant-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }

      .variant-table th {
        padding: 0.75rem 1rem;
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border-bottom: 1.5px solid var(--card-border, #E9D5FF);
      }

      .variant-table td {
        padding: 0.6rem 0.85rem;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
        vertical-align: middle;
      }

      .variant-tr:last-child td {
        border-bottom: none;
      }

      .col-name { min-width: 150px; }
      .col-stock { min-width: 200px; }
      .col-price { min-width: 120px; }
      .col-consumption { width: 130px; min-width: 110px; }
      .col-order { width: 110px; min-width: 90px; }
      .col-default { width: 135px; min-width: 115px; text-align: center; }
      .col-action { width: 50px; }

      .default-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.32rem 0.75rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 700;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        color: var(--text-muted, #6B7280);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
      }

      .default-toggle-btn .material-symbols-outlined {
        font-size: 15px;
      }

      .default-toggle-btn:hover {
        border-color: var(--primary, #7E22CE);
        color: var(--primary, #7E22CE);
      }

      .default-toggle-btn.is-default {
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
        border-color: var(--primary, #7E22CE);
        color: #FFFFFF;
        box-shadow: 0 2px 8px -2px rgba(126, 34, 206, 0.35);
      }

      .order-input-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      input.is-invalid {
        border-color: #EF4444 !important;
        background-color: rgba(239, 68, 68, 0.08) !important;
        color: #EF4444 !important;
      }

      .duplicate-badge {
        font-size: 0.625rem;
        font-weight: 800;
        color: #EF4444;
        white-space: nowrap;
      }

      .free-limit-pill-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.32rem 0.75rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 700;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        color: var(--text-muted, #6B7280);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
      }

      .free-limit-pill-btn .material-symbols-outlined {
        font-size: 15px;
      }

      .free-limit-pill-btn:hover {
        border-color: #10B981;
        color: #059669;
      }

      .free-limit-pill-btn.is-unlimited {
        background: linear-gradient(135deg, #10B981, #059669);
        border-color: #059669;
        color: #FFFFFF;
        box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.35);
      }

      .empty-table-cell {
        padding: 2.25rem 1rem !important;
        text-align: center;
      }

      .empty-variants-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
      }

      .empty-text {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-muted, #6B7280);
      }

      .variant-header-controls { flex-wrap: wrap; justify-content: flex-end; }
      .variant-mode-hint { max-width: 62ch; }
      .variant-mode-hint strong { color: var(--text-main, #2E1065); }

      /* ── Multi Stock: portion cards with their stock lists ─────────── */
      .multi-stock {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
      }

      .multi-howto {
        display: flex;
        align-items: flex-start;
        gap: 0.55rem;
        padding: 0.7rem 0.9rem;
        border-radius: 12px;
        background: var(--primary-light, rgba(126, 34, 206, 0.08));
        border: 1px dashed color-mix(in srgb, var(--primary, #7E22CE) 45%, transparent);
        color: var(--text-main, #2E1065);
        font-size: 0.78rem;
        line-height: 1.5;
      }

      .multi-howto .material-symbols-outlined {
        font-size: 18px;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .portion-card {
        display: flex;
        flex-direction: column;
        border-radius: 16px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--card-bg, #ffffff);
        overflow: hidden;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .portion-card.is-default {
        border-color: color-mix(in srgb, var(--primary, #7E22CE) 55%, var(--card-border, #E9D5FF));
        box-shadow: 0 6px 20px -12px rgba(var(--primary-rgb, 126, 34, 206), 0.45);
      }

      .portion-head {
        display: grid;
        grid-template-columns: auto minmax(180px, 1fr) 90px auto;
        align-items: end;
        gap: 0.75rem;
        padding: 0.9rem 1rem;
        background: var(--bg-app, #FAF5FF);
        border-bottom: 1.5px solid var(--card-border, #E9D5FF);
      }

      .portion-index {
        width: 30px;
        height: 30px;
        margin-bottom: 4px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 800;
        color: #FFFFFF;
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #9333EA));
      }

      .portion-field { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }

      .portion-actions {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding-bottom: 3px;
      }

      .recipe {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.9rem 1rem 0.75rem;
      }

      .recipe-title {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--label-color, var(--text-main, #2E1065));
      }

      .recipe-title .material-symbols-outlined { font-size: 17px; color: var(--primary, #7E22CE); }

      .recipe-count {
        margin-left: auto;
        padding: 0.12rem 0.55rem;
        border-radius: 999px;
        font-size: 0.66rem;
        font-weight: 800;
        color: var(--primary, #7E22CE);
        background: var(--primary-light, rgba(126, 34, 206, 0.1));
      }

      .recipe-head,
      .recipe-line {
        display: grid;
        grid-template-columns: 26px minmax(180px, 2fr) minmax(150px, 1fr) minmax(130px, 1fr) 34px;
        align-items: center;
        gap: 0.6rem;
      }

      .recipe-head span {
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6B7280);
      }

      .recipe-line {
        padding: 0.45rem 0.5rem;
        border-radius: 12px;
        border: 1px solid transparent;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }

      .recipe-line:hover {
        background: var(--bg-app, #FAF5FF);
        border-color: var(--card-border, #E9D5FF);
      }

      .recipe-num {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--primary, #7E22CE);
        background: var(--primary-light, rgba(126, 34, 206, 0.1));
      }

      .recipe-stock { min-width: 0; border-radius: 12px; }
      .recipe-stock.is-invalid { box-shadow: 0 0 0 2px var(--danger, #EF4444); }

      .recipe-qty {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .recipe-qty input { max-width: 110px; }

      .recipe-unit {
        min-width: 44px;
        padding: 0.3rem 0.5rem;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 800;
        text-align: center;
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }

      .recipe-meta {
        display: flex;
        flex-direction: column;
        gap: 1px;
        font-size: 0.72rem;
        color: var(--text-muted, #6B7280);
        line-height: 1.35;
      }

      .recipe-meta .is-short { color: var(--danger, #EF4444); font-weight: 800; }
      .recipe-cost { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; color: var(--text-main, #2E1065); }
      .recipe-muted { font-style: italic; opacity: 0.8; }

      .recipe-line .action-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }

      .recipe-add {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        margin-left: 32px;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        border: 1.5px dashed color-mix(in srgb, var(--primary, #7E22CE) 55%, transparent);
        background: transparent;
        color: var(--primary, #7E22CE);
        font-family: inherit;
        font-size: 0.72rem;
        font-weight: 800;
        cursor: pointer;
        transition: background-color 0.18s ease, border-style 0.18s ease;
      }

      .recipe-add .material-symbols-outlined { font-size: 16px; }
      .recipe-add:hover { background: var(--primary-light, rgba(126, 34, 206, 0.08)); border-style: solid; }

      /* Costing panel: cost → price = profit, plus what stock allows */
      .portion-costing {
        display: grid;
        grid-template-columns: minmax(220px, 1.4fr) auto minmax(190px, 1fr) auto minmax(190px, 1fr) minmax(140px, 0.7fr);
        align-items: stretch;
        gap: 0.6rem;
        padding: 0.9rem 1rem 1rem;
        border-top: 1px dashed var(--card-border, #E9D5FF);
        background: color-mix(in srgb, var(--bg-app, #FAF5FF) 55%, transparent);
      }

      .cost-op {
        align-self: center;
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--text-muted, #6B7280);
        opacity: 0.7;
      }

      .cost-tile {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
        padding: 0.75rem 0.85rem;
        border-radius: 14px;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
      }

      .cost-tile-label {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        margin: 0 !important;
        font-size: 0.66rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--label-color, var(--text-muted, #6B7280));
      }

      .cost-tile-label .material-symbols-outlined { font-size: 15px; }

      .cost-tile-value {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 1.25rem;
        font-weight: 800;
        line-height: 1.2;
        color: var(--text-main, #2E1065);
      }

      .cost-tile-note {
        font-size: 0.7rem;
        color: var(--text-muted, #6B7280);
        line-height: 1.35;
      }

      .cost-breakdown {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-top: 0.15rem;
        padding-top: 0.4rem;
        border-top: 1px dashed var(--card-border, #E9D5FF);
      }

      .cost-breakdown-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.72rem;
      }

      .cost-breakdown-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-main, #2E1065);
        font-weight: 600;
      }

      .cost-breakdown-qty { color: var(--text-muted, #6B7280); font-weight: 500; }

      .cost-breakdown-amt {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: 700;
        color: var(--text-main, #2E1065);
        flex-shrink: 0;
      }

      /* The one editable tile: highlighted so it reads as "set this" */
      .cost-tile.is-price {
        border-color: color-mix(in srgb, var(--primary, #7E22CE) 55%, var(--card-border, #E9D5FF));
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.08));
      }

      .cost-tile.is-price .cost-tile-label { color: var(--primary, #7E22CE); }

      .price-input {
        display: flex;
        align-items: center;
        border-radius: 10px;
        border: 1.5px solid var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        overflow: hidden;
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .price-input:focus-within {
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.12));
      }

      .price-input-prefix {
        padding: 0 0.6rem;
        align-self: stretch;
        display: flex;
        align-items: center;
        font-weight: 800;
        color: var(--primary, #7E22CE);
        background: var(--primary-light, rgba(126, 34, 206, 0.1));
      }

      .price-input input {
        flex: 1;
        min-width: 0;
        border: none;
        outline: none;
        background: transparent;
        padding: 0.45rem 0.6rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
      }

      .cost-tile.is-profit {
        border-color: color-mix(in srgb, var(--success, #10B981) 40%, var(--card-border, #E9D5FF));
        background: var(--success-light, rgba(16, 185, 129, 0.08));
      }

      .cost-tile.is-profit .cost-tile-label,
      .cost-tile.is-profit .cost-tile-value { color: var(--success, #10B981); }

      .cost-tile.is-loss {
        border-color: color-mix(in srgb, var(--danger, #EF4444) 40%, var(--card-border, #E9D5FF));
        background: var(--danger-light, rgba(239, 68, 68, 0.08));
      }

      .cost-tile.is-loss .cost-tile-label,
      .cost-tile.is-loss .cost-tile-value { color: var(--danger, #EF4444); }

      .margin-bar {
        height: 6px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--text-muted, #6B7280) 18%, transparent);
        overflow: hidden;
      }

      .margin-bar-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--text-muted, #6B7280);
        transition: width 0.25s ease;
      }

      .cost-tile.is-profit .margin-bar-fill { background: var(--success, #10B981); }
      .cost-tile.is-loss .margin-bar-fill { background: var(--danger, #EF4444); }

      @media (max-width: 1200px) {
        .portion-costing { grid-template-columns: 1fr 1fr; }
        .cost-op { display: none; }
      }

      @media (max-width: 640px) {
        .portion-costing { grid-template-columns: 1fr; }
      }

      .multi-empty {
        padding: 1.5rem 1rem;
        border-radius: 14px;
        border: 1.5px dashed var(--card-border, #E9D5FF);
      }

      .add-portion-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        width: 100%;
        padding: 0.8rem 1rem;
        border-radius: 14px;
        border: 1.5px dashed color-mix(in srgb, var(--primary, #7E22CE) 50%, var(--card-border, #E9D5FF));
        background: transparent;
        color: var(--primary, #7E22CE);
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 800;
        cursor: pointer;
        transition: background-color 0.18s ease, border-style 0.18s ease;
      }

      .add-portion-btn:hover { background: var(--primary-light, rgba(126, 34, 206, 0.08)); border-style: solid; }

      @media (max-width: 900px) {
        .portion-head { grid-template-columns: auto 1fr 80px; }
        .portion-actions { grid-column: 2 / -1; justify-content: flex-end; }
        .recipe-head { display: none; }
        .recipe-line {
          grid-template-columns: 26px 1fr 34px;
          grid-template-areas: 'num stock del' '. qty qty' '. meta meta';
        }
        .recipe-num { grid-area: num; }
        .recipe-stock { grid-area: stock; }
        .recipe-qty { grid-area: qty; }
        .recipe-meta { grid-area: meta; flex-direction: row; gap: 0.75rem; }
        .recipe-line .action-icon-btn { grid-area: del; }
        .recipe-add { margin-left: 0; }
      }

      /* Action bar spans both columns and stays reachable on long forms */
      .form-action-bar {
        grid-column: 1 / -1;
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0.9rem 1.25rem;
        border-radius: 16px;
        background: color-mix(in srgb, var(--card-bg, #ffffff) 88%, transparent);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        border: 1.5px solid var(--card-border, #E9D5FF);
        box-shadow: 0 -4px 18px -8px rgba(0, 0, 0, 0.18);
        z-index: 10;
      }
    `,
  ],
})
export class ProductFormComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private stockService = inject(StockService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public productId: number | null = null;
  public categories: Category[] = [];
  public allCatalogAddons: ProductAddon[] = [];
  public isLoading = false;
  public isSaving = false;
  public isUploadingImage = false;
  public isCheckingSku = false;
  public isSkuDuplicate = false;
  public skuChecked = false;
  public skuDuplicateMessage = '';
  private skuDebounceTimer: any = null;

  public form: any = {
    name: '',
    sku: '',
    categoryId: 1,
    description: '',
    imageUrl: '',
    sellingPrice: 0,
    taxRate: 5,
    status: 'ACTIVE',
    stockId: null as number | null,
    variantStockMode: 'COMMON' as VariantStockMode,
    variants: [] as any[],
    addonMappings: [] as ProductAddonMapping[],
  };

  public stockItems: StockItem[] = [];

  /** Template access to Number() for the Multi Stock arithmetic. */
  readonly Number = Number;

  /** Set on the first Save attempt, so empty Multi Stock fields show red only after that. */
  public triedSave = false;

  /**
   * Stock items a saved recipe names that the active list does not carry (an
   * item made inactive since), so the form can still show their name, unit
   * and cost instead of a blank line.
   */
  private recipeStockInfo = new Map<number, Partial<StockItem>>();

  /** lineStockOptions() results, reused while a portion's picks stay the same. */
  private lineOptionsCache = new Map<string, { key: string; options: DropdownOption[] }>();

  get stockItemOptions(): DropdownOption[] {
    return this.stockItems.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.stock_code})`,
      icon: 'inventory_2',
      badge: s.unit_type,
      description: `Balance: ${s.current_quantity} ${s.unit_type}`,
    }));
  }

  get selectedStockItem(): StockItem | undefined {
    return this.stockItems.find((s) => s.id === Number(this.form.stockId));
  }

  get availableAddonsForSelect(): ProductAddon[] {
    return this.allCatalogAddons.filter((a) => a.is_available);
  }

  getAddonSelectOptions(currentAddonId?: number): DropdownOption[] {
    return this.allCatalogAddons.map((a) => ({
      value: a.id,
      label: `${a.name} (${a.category || 'Extras'})`,
      icon: 'extension',
      badge: `${this.settingsService.currencySymbol()}${a.price}`,
      description: `Default Price: ${this.settingsService.currencySymbol()}${a.price}`,
    }));
  }

  /**
   * COMMON — every portion consumes the one stock item chosen for the dish.
   * EACH   — a portion names its own, for a dish whose sizes draw on different
   *          raw materials.
   * MULTI  — a portion lists several stock items it takes at once.
   *
   * Switching carries what is already set across, so nothing has to be
   * re-entered: into MULTI each portion starts from the item (and quantity)
   * it drew before; out of MULTI each portion keeps its first item. A
   * portion's MULTI list is kept while in another mode, so switching back
   * restores it.
   */
  setStockMode(mode: VariantStockMode): void {
    const from = this.form.variantStockMode as VariantStockMode;
    if (from === mode) return;

    if (mode === 'MULTI') {
      if (this.form.variants.length === 0) {
        // A Multi Stock dish is always sold by portion; start with one.
        this.form.variants.push(this.newPortion(1, true, (this.form.name || '').trim() ? 'Regular' : ''));
      }
      for (const v of this.form.variants) {
        this.ensureStocks(v);
        const hasPicks = v.stocks.some((l: any) => l.stockId);
        const carried = from === 'EACH' ? v.stockId : this.form.stockId;
        if (!hasPicks && carried) {
          v.stocks = [{ stockId: Number(carried), quantity: Number(v.stockConsumption) > 0 ? Number(v.stockConsumption) : 1 }];
        }
      }
    } else if (from === 'MULTI') {
      const firstOf = (v: any) => (v.stocks || []).find((l: any) => l.stockId) || null;
      if (mode === 'EACH') {
        for (const v of this.form.variants) {
          const first = firstOf(v);
          if (!v.stockId && first) {
            v.stockId = first.stockId;
            v.stockConsumption = Number(first.quantity) || 1;
          }
        }
      } else if (!this.form.stockId) {
        const first = this.form.variants.map(firstOf).find(Boolean);
        if (first) this.form.stockId = first.stockId;
      }
      // Common and Each sell a dish as one item or as 2+ portions, so a lone
      // Multi Stock portion becomes the single item.
      if (this.form.variants.length === 1) {
        const only = this.form.variants[0];
        this.form.sellingPrice = Number(only.sellingPrice) || this.form.sellingPrice;
        if (!this.form.stockId) this.form.stockId = only.stockId || firstOf(only)?.stockId || null;
        this.form.variants = [];
        this.notify.info('The single portion became the dish price — add 2 or more portions to sell by size.');
      }
    }

    this.form.variantStockMode = mode;
    this.triedSave = false;
  }

  private newPortion(displayOrder: number, isDefault: boolean, name = ''): any {
    return {
      name,
      stockId: this.form.stockId ?? null,
      stockConsumption: 1,
      sellingPrice: Number(this.form.sellingPrice) || 0,
      displayOrder,
      isDefault,
      // Unused outside Multi Stock, where setStockMode fills it on the switch.
      stocks: [{ stockId: null, quantity: 1 }],
    };
  }

  private ensureStocks(v: any): void {
    if (!Array.isArray(v.stocks)) v.stocks = [];
    if (v.stocks.length === 0) v.stocks.push({ stockId: null, quantity: 1 });
  }

  addRecipeLine(v: any): void {
    if (!Array.isArray(v.stocks)) v.stocks = [];
    v.stocks.push({ stockId: null, quantity: 1 });
  }

  removeRecipeLine(v: any, index: number): void {
    if (v.stocks.length <= 1) return;
    v.stocks.splice(index, 1);
  }

  /**
   * Options for one recipe line: every active stock item except the ones
   * other lines of the same portion already use, so an item cannot be listed
   * twice. Cached per line while the portion's picks are unchanged - a fresh
   * array on every change-detection pass would make the dropdown rebuild.
   */
  lineStockOptions(portionIndex: number, lineIndex: number): DropdownOption[] {
    const v = this.form.variants[portionIndex];
    const taken = (v?.stocks || [])
      .filter((_: any, j: number) => j !== lineIndex)
      .map((l: any) => Number(l.stockId))
      .filter(Boolean);
    const own = Number(v?.stocks?.[lineIndex]?.stockId) || 0;
    const key = `${this.stockItems.length}|${taken.join(',')}|${own}`;
    const cacheKey = `${portionIndex}_${lineIndex}`;
    const hit = this.lineOptionsCache.get(cacheKey);
    if (hit && hit.key === key) return hit.options;

    const options = this.stockItemOptions.filter((o) => !taken.includes(Number(o.value)));
    // Keep a saved pick that is no longer active visible on its own line.
    if (own && !options.some((o) => Number(o.value) === own)) {
      const info = this.recipeStockInfo.get(own);
      if (info) {
        options.unshift({
          value: own,
          label: `${info.name} (${info.stock_code || 'inactive'})`,
          icon: 'inventory_2',
          badge: info.unit_type,
          description: 'Inactive stock item - pick another one',
        });
      }
    }
    this.lineOptionsCache.set(cacheKey, { key, options });
    return options;
  }

  stockFor(stockId: any): Partial<StockItem> | undefined {
    const id = Number(stockId);
    if (!id) return undefined;
    return this.stockItems.find((s) => s.id === id) || this.recipeStockInfo.get(id);
  }

  lineCost(line: any): number {
    const s = this.stockFor(line.stockId);
    return (Number(line.quantity) || 0) * (Number(s?.average_unit_price) || 0);
  }

  portionCost(v: any): number {
    return (v.stocks || []).reduce((sum: number, l: any) => sum + this.lineCost(l), 0);
  }

  portionMargin(v: any): number {
    return (Number(v.sellingPrice) || 0) - this.portionCost(v);
  }

  marginPercent(v: any): number {
    const price = Number(v.sellingPrice) || 0;
    return price > 0 ? (this.portionMargin(v) / price) * 100 : 0;
  }

  absValue(n: number): number {
    return Math.abs(n);
  }

  /** Recipe lines that are complete enough to price: an item and a quantity. */
  costedLines(v: any): any[] {
    return (v.stocks || []).filter((l: any) => l.stockId && Number(l.quantity) > 0 && this.stockFor(l.stockId));
  }

  /** Width of the margin bar: the margin as a share of the price, 0-100. */
  marginBarWidth(v: any): number {
    return Math.max(0, Math.min(100, Math.abs(this.marginPercent(v))));
  }

  /**
   * How many of this portion the current balances can make: the scarcest
   * item decides. Null until at least one line has an item and a quantity.
   */
  canMake(v: any): number | null {
    const lines = (v.stocks || []).filter((l: any) => l.stockId && Number(l.quantity) > 0);
    if (lines.length === 0) return null;
    return Math.max(0, Math.min(
      ...lines.map((l: any) => Math.floor((Number(this.stockFor(l.stockId)?.current_quantity) || 0) / Number(l.quantity)))
    ));
  }

  public statusOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE', icon: 'check_circle', description: 'Item available on POS menu' },
    { value: 'INACTIVE', label: 'INACTIVE', icon: 'block', description: 'Item hidden from POS menu' },
  ];

  private static readonly IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  private static readonly IMAGE_MAX_MB = 2;

  get isEdit(): boolean {
    return this.productId !== null;
  }

  get categoryOptions(): DropdownOption[] {
    return this.categories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: 'restaurant_menu',
      description: c.description || 'Menu Category',
    }));
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadStockItems();
    this.loadCatalogAddons();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.productId = Number(idParam);
      this.loadProduct(this.productId);
    }
  }

  private loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data;
          if (!this.isEdit && this.categories.length > 0) {
            this.form.categoryId = this.categories[0].id;
          }
        }
      },
      error: () => { },
    });
  }

  private loadStockItems(): void {
    this.stockService.getStock(1, 200, undefined, undefined, false, 'active').subscribe({
      next: (res) => {
        if (res.success) this.stockItems = res.data;
      },
      error: () => { },
    });
  }

  private loadCatalogAddons(): void {
    this.productService.getAddons().subscribe({
      next: (res) => {
        if (res.success) {
          this.allCatalogAddons = res.data || [];
        }
      },
      error: () => { },
    });
  }

  private loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success || !res.data) {
          this.notify.error('Dish not found');
          this.router.navigate(['/products']);
          return;
        }
        const p: Product = res.data;
        this.form = {
          name: p.name,
          sku: p.sku,
          categoryId: p.category_id,
          description: p.description || '',
          imageUrl: p.image_url || '',
          sellingPrice: Number(p.selling_price) || 0,
          taxRate: p.tax_rate,
          status: p.status,
          stockId: p.stock_id ?? p.resolved_stock_id ?? null,
          variantStockMode: p.variant_stock_mode || 'COMMON',
          variants: (p.variants || []).map((v: ProductVariant, idx: number) => ({
            name: v.name,
            stockId: v.stock_id ?? null,
            stockConsumption: v.stock_consumption !== undefined && v.stock_consumption !== null
              ? Number(v.stock_consumption)
              : (v.stockConsumption !== undefined && v.stockConsumption !== null ? Number(v.stockConsumption) : 1),
            sellingPrice: Number(v.selling_price),
            displayOrder: v.display_order !== undefined && v.display_order !== null ? Number(v.display_order) : idx + 1,
            isDefault: Boolean(Number(v.is_default) === 1),
            stocks: (v.stocks || []).map((s) => ({ stockId: Number(s.stock_id), quantity: Number(s.stock_consumption) })),
          })),
          addonMappings: [],
        };

        // Keep what the API said about every recipe item, so a line whose item
        // has since gone inactive still shows its name, unit and cost.
        this.recipeStockInfo.clear();
        this.lineOptionsCache.clear();
        for (const v of p.variants || []) {
          for (const s of v.stocks || []) {
            this.recipeStockInfo.set(Number(s.stock_id), {
              id: Number(s.stock_id),
              name: s.stock_name,
              stock_code: s.stock_code,
              unit_type: s.unit_type as any,
              current_quantity: Number(s.current_quantity) || 0,
              average_unit_price: Number(s.average_unit_price) || 0,
              status: s.stock_status,
            });
          }
        }
        if (this.form.variantStockMode === 'MULTI') {
          for (const v of this.form.variants) this.ensureStocks(v);
        }

        if (this.form.variants.length > 0 && !this.form.variants.some((v: any) => v.isDefault)) {
          this.form.variants[0].isDefault = true;
        }

        // Load attached add-ons
        this.productService.getProductAddons(id).subscribe({
          next: (addonRes) => {
            if (addonRes.success && Array.isArray(addonRes.data)) {
              this.form.addonMappings = addonRes.data.map((a: ProductAddon) => ({
                addon_id: a.id,
                is_free: a.is_free || 'Amount',
                amount: a.amount !== undefined && a.amount !== null ? Number(a.amount) : Number(a.default_price ?? a.price ?? 0),
                free_limit: a.free_limit !== undefined && a.free_limit !== null && Number(a.free_limit) > 0 ? Number(a.free_limit) : null,
                name: a.name,
                category: a.category,
                default_price: Number(a.default_price ?? a.price ?? 0),
              }));
            }
          },
          error: () => { },
        });
      },
      error: () => {
        this.isLoading = false;
        this.notify.error('Could not load dish');
        this.router.navigate(['/products']);
      },
    });
  }

  addVariant(): void {
    if (this.form.variantStockMode === 'MULTI') {
      // Multi Stock adds one portion at a time; a single portion is valid.
      const used = new Set(this.form.variants.map((v: any) => Number(v.displayOrder)));
      let next = 1;
      while (used.has(next)) next++;
      this.form.variants.push(this.newPortion(next, this.form.variants.length === 0));
      return;
    }

    if (this.form.variants.length === 0) {
      // When zero rows, insert 2 variants
      this.form.variants.push(
        {
          name: '',
          stockId: this.form.stockId ?? null,
          stockConsumption: 1,
          sellingPrice: Number(this.form.sellingPrice) || 0,
          displayOrder: 1,
          isDefault: true,
        },
        {
          name: '',
          stockId: this.form.stockId ?? null,
          stockConsumption: 1,
          sellingPrice: Number(this.form.sellingPrice) || 0,
          displayOrder: 2,
          isDefault: false,
        }
      );
    } else {
      // Find the next lowest positive integer not currently used
      const usedOrders = new Set(
        this.form.variants
          .map((v: any) => Number(v.displayOrder))
          .filter((n: number) => Number.isFinite(n) && n > 0)
      );
      let nextOrder = 1;
      while (usedOrders.has(nextOrder)) {
        nextOrder++;
      }

      this.form.variants.push({
        name: '',
        stockId: this.form.stockId ?? null,
        stockConsumption: 1,
        sellingPrice: Number(this.form.sellingPrice) || 0,
        displayOrder: nextOrder,
        isDefault: false,
      });
    }
  }

  isDuplicateOrder(order: any, currentIndex: number): boolean {
    const num = Number(order);
    if (!Number.isFinite(num) || num <= 0) return false;
    return this.form.variants.some((v: any, idx: number) => idx !== currentIndex && Number(v.displayOrder) === num);
  }

  onDisplayOrderChange(newVal: any, index: number): void {
    const num = Number(newVal);
    if (Number.isFinite(num) && num > 0) {
      const duplicateIdx = this.form.variants.findIndex((v: any, idx: number) => idx !== index && Number(v.displayOrder) === num);
      if (duplicateIdx >= 0) {
        const otherName = this.form.variants[duplicateIdx]?.name?.trim() || `Portion #${duplicateIdx + 1}`;
        this.notify.warning(`Display Order ${num} is already used by "${otherName}". Numbers cannot be repeated.`);
      }
    }
  }

  setDefaultVariant(index: number): void {
    this.form.variants.forEach((v: any, idx: number) => {
      v.isDefault = idx === index;
    });
  }

  clearAllVariants(): void {
    this.notify.confirm({
      title: 'Remove All Variants',
      message: 'Are you sure you want to remove all variants? This dish will sell as a single item.',
      confirmText: 'Remove All',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.form.variants = [];
      },
    });
  }

  removeVariant(index: number): void {
    const isMulti = this.form.variantStockMode === 'MULTI';
    if (isMulti && this.form.variants.length <= 1) return;
    if (!isMulti && this.form.variants.length <= 2) {
      this.clearAllVariants();
      return;
    }
    const variant = this.form.variants[index];
    const label = variant?.name?.trim() || 'this portion';

    this.notify.confirm({
      title: 'Remove Portion',
      message: `Are you sure you want to remove ${label} from this dish?`,
      confirmText: 'Remove',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        const wasDefault = Boolean(this.form.variants[index]?.isDefault);
        this.form.variants.splice(index, 1);
        // Lines are cached by position, which just shifted.
        this.lineOptionsCache.clear();
        if (wasDefault && this.form.variants.length > 0) {
          this.form.variants[0].isDefault = true;
        }
      },
    });
  }

  addAddonMapping(): void {
    if (this.allCatalogAddons.length === 0) {
      this.notify.error('No add-ons available in catalog. Please create add-ons first.');
      return;
    }

    // Find first addon not yet attached
    const usedIds = new Set(this.form.addonMappings.map((m: any) => m.addon_id));
    const nextAddon = this.allCatalogAddons.find((a) => !usedIds.has(a.id)) || this.allCatalogAddons[0];

    this.form.addonMappings.push({
      addon_id: nextAddon.id,
      is_free: 'Amount',
      amount: Number(nextAddon.price) || 0,
      free_limit: null,
      name: nextAddon.name,
      category: nextAddon.category,
      default_price: Number(nextAddon.price) || 0,
    });
  }

  onAddonSelected(mapping: ProductAddonMapping): void {
    const addon = this.allCatalogAddons.find((a) => a.id === Number(mapping.addon_id));
    if (addon) {
      mapping.name = addon.name;
      mapping.category = addon.category;
      mapping.default_price = Number(addon.price) || 0;
      if (mapping.amount === undefined || mapping.amount === 0) {
        mapping.amount = Number(addon.price) || 0;
      }
    }
  }

  removeAddonMapping(index: number): void {
    this.form.addonMappings.splice(index, 1);
  }

  onImageFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    picker.value = '';
    if (!file) return;

    if (!ProductFormComponent.IMAGE_TYPES.includes(file.type)) {
      this.notify.error('Dish image must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > ProductFormComponent.IMAGE_MAX_MB * 1024 * 1024) {
      this.notify.error(
        `Dish image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${ProductFormComponent.IMAGE_MAX_MB} MB.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.productService.uploadProductImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.form.imageUrl = res.data.url;
            this.notify.success('Image uploaded — save the dish to apply it.');
          } else {
            this.notify.error(res?.message || 'Dish image upload failed.');
          }
        },
        error: (err) => {
          this.isUploadingImage = false;
          this.notify.error(err?.error?.message || 'Dish image upload failed.');
        },
      });
    };

    this.isUploadingImage = true;
    reader.readAsDataURL(file);
  }

  onSkuInput(value: string): void {
    if (this.skuDebounceTimer) {
      clearTimeout(this.skuDebounceTimer);
    }
    const trimmed = (value || '').trim();
    if (!trimmed) {
      this.isSkuDuplicate = false;
      this.skuChecked = false;
      this.skuDuplicateMessage = '';
      return;
    }
    this.skuDebounceTimer = setTimeout(() => {
      this.checkSkuUniqueness();
    }, 400);
  }

  checkSkuUniqueness(): void {
    const sku = (this.form.sku || '').trim();
    if (!sku) {
      this.isSkuDuplicate = false;
      this.skuChecked = false;
      return;
    }

    this.isCheckingSku = true;
    this.productService.checkSkuUnique(sku, this.productId || undefined).subscribe({
      next: (res) => {
        this.isCheckingSku = false;
        this.skuChecked = true;
        if (res.success && res.data) {
          if (!res.data.isUnique) {
            this.isSkuDuplicate = true;
            const existingName = res.data.existingProduct?.name || 'another dish';
            this.skuDuplicateMessage = `Item Code "${sku}" is already in use by "${existingName}". Choose a unique code.`;
            this.notify.warning(this.skuDuplicateMessage);
          } else {
            this.isSkuDuplicate = false;
            this.skuDuplicateMessage = '';
          }
        }
      },
      error: () => {
        this.isCheckingSku = false;
      },
    });
  }

  save(): void {
    if (!this.form.name || !this.form.sku) {
      this.notify.error('Please enter name and SKU');
      return;
    }

    if (this.isSkuDuplicate) {
      this.notify.error(this.skuDuplicateMessage || `Item Code "${this.form.sku}" is already in use. Please choose a unique SKU.`);
      return;
    }

    const isMulti = this.form.variantStockMode === 'MULTI';
    this.triedSave = true;

    const rawVariants = this.form.variants || [];
    const variants = rawVariants.filter((v: any) => String(v.name || '').trim());

    if (rawVariants.length > 0 && variants.length < rawVariants.length) {
      this.notify.error('Please enter a name for all portion variant rows.');
      return;
    }

    if (isMulti && variants.length === 0) {
      this.notify.error('Multi Stock needs at least one portion — add one and list the stock items it uses.');
      return;
    }

    if (!isMulti && variants.length > 0 && variants.length < 2) {
      this.notify.error('At least 2 variants are required when adding portions (or remove all rows to sell as a single item).');
      return;
    }

    const names = variants.map((v: any) => String(v.name).trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      this.notify.error('Each portion needs a distinct name.');
      return;
    }

    if (variants.length > 0) {
      // Validate display order
      const orders = variants.map((v: any) => Number(v.displayOrder));
      if (orders.some((o: number) => !Number.isFinite(o) || o <= 0)) {
        this.notify.error('Each portion must have a valid positive Display Order number.');
        return;
      }
      const duplicateOrder = orders.find((o, idx) => orders.indexOf(o) !== idx);
      if (duplicateOrder !== undefined) {
        this.notify.error(`Display Order "${duplicateOrder}" is repeated. Each portion must have a unique order number.`);
        return;
      }

      // Ensure only one default exists
      const defaultIndex = variants.findIndex((v: any) => Boolean(v.isDefault));
      const activeDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
      variants.forEach((v: any, idx: number) => {
        v.isDefault = idx === activeDefaultIndex;
      });
    }

    if (isMulti) {
      // Same rules the server applies, checked here so the message names the line.
      for (const v of variants) {
        const portion = String(v.name).trim();
        const lines = (v.stocks || []).filter((l: any) => l.stockId || Number(l.quantity) > 0);
        if (lines.length === 0) {
          this.notify.error(`Portion "${portion}" needs at least one stock item.`);
          return;
        }
        if (lines.some((l: any) => !l.stockId)) {
          this.notify.error(`Portion "${portion}": pick a stock item on every line, or remove the empty line.`);
          return;
        }
        const bad = lines.find((l: any) => !(Number(l.quantity) > 0));
        if (bad) {
          this.notify.error(`Portion "${portion}": enter how much ${this.stockFor(bad.stockId)?.name || 'of each item'} one portion uses.`);
          return;
        }
        const ids = lines.map((l: any) => Number(l.stockId));
        if (new Set(ids).size !== ids.length) {
          this.notify.error(`Portion "${portion}" lists the same stock item twice — combine it into one line.`);
          return;
        }
      }
    } else if (this.form.variantStockMode === 'EACH') {
      const missing = variants.find((v: any) => !v.stockId);
      if (missing) {
        this.notify.error(`Portion "${missing.name}" needs a stock master item.`);
        return;
      }
    } else if (variants.length > 0 && !this.form.stockId) {
      this.notify.error('Choose the stock master item every portion consumes.');
      return;
    }

    // Addon validation
    const validAddonMappings: ProductAddonMapping[] = [];
    const seenAddonIds = new Set<number>();
    for (const m of this.form.addonMappings || []) {
      const aId = Number(m.addon_id);
      if (!aId || seenAddonIds.has(aId)) continue;
      seenAddonIds.add(aId);

      const isFree = m.is_free === 'Free' ? 'Free' : 'Amount';
      let freeLimit: number | null = null;
      if (isFree === 'Free') {
        if (m.free_limit !== null && m.free_limit !== undefined && m.free_limit !== '' && Number(m.free_limit) > 0) {
          freeLimit = Math.floor(Number(m.free_limit));
        } else {
          freeLimit = null; // Unlimited free
        }
      }

      validAddonMappings.push({
        addon_id: aId,
        is_free: isFree,
        amount: isFree === 'Amount' ? Math.max(0, Number(m.amount) || 0) : 0,
        free_limit: freeLimit,
      });
    }

    const payload = {
      ...this.form,
      // A Multi Stock dish draws only through its portions (the server clears it too).
      stockId: isMulti ? null : this.form.stockId,
      variants: variants.map((v: any, idx: number) => ({
        ...v,
        stockConsumption: Number(v.stockConsumption) > 0 ? Number(v.stockConsumption) : 1,
        displayOrder: Number(v.displayOrder) || idx + 1,
        isDefault: Boolean(v.isDefault),
        stockId: this.form.variantStockMode === 'EACH' ? v.stockId : null,
        stocks: isMulti
          ? (v.stocks || [])
              .filter((l: any) => l.stockId)
              .map((l: any) => ({ stockId: Number(l.stockId), stockConsumption: Number(l.quantity) }))
          : [],
      })),
    };

    if (variants.length > 0) {
      const prices = variants
        .map((v: any) => Number(v.sellingPrice))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      if (prices.length) payload.sellingPrice = Math.min(...prices);
    }

    this.isSaving = true;

    const saveAddonMappings = (prodId: number, message: string) => {
      this.productService.linkProductAddons(prodId, validAddonMappings).subscribe({
        next: () => {
          this.isSaving = false;
          this.notify.success(message);
          this.router.navigate(['/products']);
        },
        error: () => {
          this.isSaving = false;
          this.notify.success(message);
          this.router.navigate(['/products']);
        },
      });
    };

    const failed = (err: any) => {
      this.isSaving = false;
      this.notify.error(err?.error?.message || 'Could not save dish');
    };

    if (this.isEdit) {
      this.productService.updateProduct(this.productId!, payload).subscribe({
        next: (res) => saveAddonMappings(this.productId!, 'Dish updated successfully'),
        error: failed,
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (res) => {
          const newId = res.data?.id || (res as any).id;
          if (newId) {
            saveAddonMappings(newId, 'Dish added to catalog');
          } else {
            this.isSaving = false;
            this.notify.success('Dish added to catalog');
            this.router.navigate(['/products']);
          }
        },
        error: failed,
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}

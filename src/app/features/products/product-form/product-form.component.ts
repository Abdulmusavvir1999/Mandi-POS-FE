import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { StockService } from '../../../core/services/stock.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Category, Product, ProductVariant, StockItem, ProductAddon, ProductAddonMapping } from '../../../core/models';
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
              <p class="form-hint !max-w-[50ch]">
                Stock is not entered here. Each portion declares how much of this dish's
                linked stock item one sale consumes — e.g. Full uses 4, Half uses 2.
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
              </div>

              <button
                *ngIf="form.variants.length > 0"
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
                <span>Add Variant</span>
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

          <!-- Variants Table -->
          <div class="variants-table-container">
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
    variantStockMode: 'COMMON' as 'COMMON' | 'EACH',
    variants: [] as any[],
    addonMappings: [] as ProductAddonMapping[],
  };

  public stockItems: StockItem[] = [];

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
   */
  setStockMode(mode: 'COMMON' | 'EACH'): void {
    this.form.variantStockMode = mode;
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
          })),
          addonMappings: [],
        };

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
    if (this.form.variants.length <= 2) {
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

    const rawVariants = this.form.variants || [];
    const variants = rawVariants.filter((v: any) => String(v.name || '').trim());

    if (rawVariants.length > 0 && variants.length < rawVariants.length) {
      this.notify.error('Please enter a name for all portion variant rows.');
      return;
    }

    if (variants.length > 0 && variants.length < 2) {
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

    if (this.form.variantStockMode === 'EACH') {
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
      variants: variants.map((v: any, idx: number) => ({
        ...v,
        stockConsumption: Number(v.stockConsumption) > 0 ? Number(v.stockConsumption) : 1,
        displayOrder: Number(v.displayOrder) || idx + 1,
        isDefault: Boolean(v.isDefault),
        stockId: this.form.variantStockMode === 'EACH' ? v.stockId : null,
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

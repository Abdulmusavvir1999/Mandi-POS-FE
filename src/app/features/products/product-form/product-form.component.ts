import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { StockService } from '../../../core/services/stock.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Category, Product, ProductVariant, StockItem } from '../../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../../shared/components/custom-dropdown/custom-dropdown.component';

/**
 * Add / Edit Dish.
 *
 * One component serves both routes: /products/new has no :id, /products/:id/edit
 * does. Keeping them together means the form, its validation and the variant
 * editor cannot drift between "create" and "update".
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent],
  template: `
    <div class="module-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS                                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Menu Catalog</span>
        <span class="breadcrumb-separator">›</span>
        <a routerLink="/products" class="breadcrumb-link">Dishes & Products</a>
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
              <p class="module-subtitle">Configure pricing, tax, category and dish variants</p>
            </div>
          </div>
        </div>
      </div>

      <div class="loading-note" *ngIf="isLoading">Loading dish…</div>

      <form (ngSubmit)="save()" class="product-form-grid" *ngIf="!isLoading">
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- LEFT COLUMN                                                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="form-column">
          <!-- Identity -->
          <section class="form-card">
            <h2 class="form-card-title">
              <span class="material-symbols-outlined">badge</span>
              <span>Dish Identity</span>
            </h2>

            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label">Dish Name</label>
                <input
                  title="Dish Name"
                  type="text"
                  [(ngModel)]="form.name"
                  name="name"
                  placeholder="e.g. Mutton Mandi Full"
                  class="form-control text-sm w-full"
                  required
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label">SKU / Item Code</label>
                <input
                  title="SKU / Item Code"
                  type="text"
                  [(ngModel)]="form.sku"
                  name="sku"
                  placeholder="e.g. MND-MUT-F"
                  class="form-control font-mono text-sm w-full"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label">Category</label>
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
                <label class="form-label">Status</label>
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
                placeholder="Fragrant basmati rice served with roasted spiced meat…"
                class="form-control text-sm w-full"
              ></textarea>
            </div>
          </section>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- RIGHT COLUMN                                                -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="form-column">
          <!-- Image -->
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

          <!-- Pricing -->
          <section class="form-card">
            <h2 class="form-card-title">
              <span class="material-symbols-outlined">payments</span>
              <span>Pricing &amp; Tax</span>
            </h2>

            <div class="grid grid-cols-3 gap-3.5 items-start">
              <!-- Price is set per portion once the dish has any, so these two
                   drop out rather than sit there as a second answer to the
                   same question. They come back if every portion is removed,
                   because a single-item dish has nothing else to price it. -->
              <ng-container *ngIf="form.variants.length === 0">
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
                  />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">Cost Price ({{ settingsService.currencySymbol() }})</label>
                  <input
                    title="Cost Price"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="form.costPrice"
                    name="costPrice"
                    class="form-control font-mono text-sm w-full"
                  />
                </div>
              </ng-container>
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
                />
              </div>
            </div>

            <p class="form-note" *ngIf="form.variants.length > 0">
              <span class="material-symbols-outlined">info</span>
              <span>
                This dish is priced by its portions — set each price under
                <strong>Dish Variants</strong> below. The dish price shown elsewhere in the app
                is the cheapest portion.
              </span>
            </p>
          </section>
        </div>

        <!-- Variants: spans both columns — the row editor needs the width -->
        <section class="form-card is-full-width">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="form-card-title !mb-1">
                <span class="material-symbols-outlined">lunch_dining</span>
                <span>Dish Variants</span>
              </h2>
              <p class="form-hint !max-w-[46ch]">
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
                  <span>Common</span>
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  [class.is-active]="form.variantStockMode === 'EACH'"
                  (click)="setStockMode('EACH')"
                  title="Each portion picks its own stock item"
                >
                  <span class="material-symbols-outlined">list</span>
                  <span>Each</span>
                </button>
              </div>

              <button
                type="button"
                class="action-btn btn-outline-purple !py-1.5 !px-3 !text-xs shrink-0"
                (click)="addVariant()"
              >
                <span class="material-symbols-outlined">add</span>
                <span>Add</span>
              </button>
            </div>
          </div>

          <!-- COMMON: one source for every portion -->
          <div class="form-group mb-0" *ngIf="form.variantStockMode === 'COMMON'">
            <label class="form-label">Stock Master Item — every portion consumes this</label>
            <app-custom-dropdown
              [options]="stockItemOptions"
              [(ngModel)]="form.stockItemId"
              name="stockItemId"
              [searchable]="true"
              placeholder="Select stock master item…"
              minWidth="100%"
            ></app-custom-dropdown>
            <p class="form-hint" *ngIf="selectedStockItem">
              Balance {{ selectedStockItem.current_quantity }} {{ selectedStockItem.unit_type }}
              · code {{ selectedStockItem.stock_code }}
            </p>
          </div>

          <div
            class="variant-rows"
            [class.is-each]="form.variantStockMode === 'EACH'"
            *ngIf="form.variants.length > 0"
          >
            <div class="variant-row-head">
              <span>Portion name</span>
              <span *ngIf="form.variantStockMode === 'EACH'">Stock master item</span>
              <span>Price</span>
              <span>Uses</span>
              <span></span>
            </div>
            <div class="variant-row" *ngFor="let v of form.variants; let i = index">
              <input
                type="text"
                [(ngModel)]="v.name"
                [name]="'variantName' + i"
                placeholder="e.g. Full"
                class="form-control text-sm"
                title="Portion name"
              />
              <app-custom-dropdown
                *ngIf="form.variantStockMode === 'EACH'"
                [options]="stockItemOptions"
                [(ngModel)]="v.stockItemId"
                [name]="'variantStock' + i"
                [searchable]="true"
                placeholder="Select stock item…"
                minWidth="100%"
              ></app-custom-dropdown>
              <input
                type="number"
                min="0"
                step="any"
                [(ngModel)]="v.sellingPrice"
                [name]="'variantPrice' + i"
                placeholder="0.00"
                class="form-control font-mono text-sm"
                title="Portion selling price"
              />
              <input
                type="number"
                min="0.001"
                step="any"
                [(ngModel)]="v.stockConsumption"
                [name]="'variantUses' + i"
                placeholder="1"
                class="form-control font-mono text-sm"
                title="Stock consumed per sale"
              />
              <button
                type="button"
                class="action-icon-btn is-danger"
                (click)="removeVariant(i)"
                title="Remove portion"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>

          <p class="empty-note" *ngIf="form.variants.length === 0">
            No variants — this dish sells as a single item and one sale consumes 1 stock unit.
          </p>
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

      /* Variants sits below both columns and spans them. */
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
        box-shadow: 0 2px 10px -4px rgba(46, 16, 101, 0.1);
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
      .image-upload-row { display: flex; align-items: center; gap: 0.875rem; }

      .image-upload-preview {
        width: 5.5rem;
        height: 5.5rem;
        flex-shrink: 0;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-app, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
      }

      .image-upload-preview.is-empty { border-style: dashed; }
      .image-upload-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .image-upload-preview .material-symbols-outlined { font-size: 30px; opacity: 0.55; }
      .image-upload-actions { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }

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
        box-shadow: 0 3px 10px -4px var(--primary-glow, rgba(126, 34, 206, 0.35));
      }

      .variant-rows { display: flex; flex-direction: column; gap: 0.5rem; }

      /* gap and alignment belong to both modes — COMMON was inheriting
         neither, which left its Price and Uses fields butted against the
         column before them. */
      .variant-row-head,
      .variant-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.28fr) minmax(6rem, 0.22fr) 2.25rem;
        gap: 0.5rem;
        align-items: center;
      }

      /* EACH mode inserts the source column between name and price */
      .variant-rows.is-each .variant-row-head,
      .variant-rows.is-each .variant-row {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr) minmax(7rem, 0.26fr) minmax(6rem, 0.2fr) 2.25rem;
      }

      .variant-row-head span {
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted, #6B7280);
      }

      .variant-row .form-control { height: 38px; }

      .empty-note {
        margin: 0;
        padding: 0.7rem 0.85rem;
        border-radius: 12px;
        border: 1px dashed var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        font-size: 0.6875rem;
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
        box-shadow: 0 -4px 18px -8px rgba(46, 16, 101, 0.18);
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

  public isLoading = false;
  public isSaving = false;
  public isUploadingImage = false;
  public productId: number | null = null;
  public categories: Category[] = [];

  public form: any = {
    name: '',
    sku: '',
    categoryId: 1,
    description: '',
    imageUrl: '',
    sellingPrice: 0,
    costPrice: 0,
    taxRate: 5,
    status: 'ACTIVE',
    stockItemId: null as number | null,
    variantStockMode: 'COMMON' as 'COMMON' | 'EACH',
    variants: [] as any[],
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
    return this.stockItems.find((s) => s.id === Number(this.form.stockItemId));
  }

  /**
   * COMMON — every portion consumes the one stock item chosen for the dish.
   * EACH   — a portion names its own, for a dish whose sizes draw on different
   *          raw materials. Switching does not clear the other mode's choice,
   *          so flipping back and forth is not destructive.
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
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
    });
  }

  private loadStockItems(): void {
    this.stockService.getStock(1, 200, undefined, undefined, false, 'active').subscribe({
      next: (res) => {
        if (res.success) this.stockItems = res.data;
      },
      error: () => {
        // The dropdown simply stays empty; the dish can still be saved and the
        // legacy per-product stock link continues to apply.
      },
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
          sellingPrice: p.selling_price,
          costPrice: p.cost_price,
          taxRate: p.tax_rate,
          status: p.status,
          stockItemId: p.stock_item_id ?? p.resolved_stock_item_id ?? null,
          variantStockMode: p.variant_stock_mode || 'COMMON',
          variants: (p.variants || []).map((v: ProductVariant) => ({
            name: v.name,
            stockItemId: v.stock_item_id ?? null,
            sellingPrice: Number(v.selling_price),
            stockConsumption: Number(v.stock_consumption),
          })),
        };
      },
      error: () => {
        this.isLoading = false;
        this.notify.error('Could not load dish');
        this.router.navigate(['/products']);
      },
    });
  }

  addVariant(): void {
    this.form.variants.push({
      name: '',
      // A new row inherits the dish-level source so EACH mode starts somewhere
      // sensible rather than empty.
      stockItemId: this.form.stockItemId ?? null,
      sellingPrice: Number(this.form.sellingPrice) || 0,
      stockConsumption: 1,
    });
  }

  removeVariant(index: number): void {
    const variant = this.form.variants[index];
    const label = variant?.name?.trim() || 'this portion';

    this.notify.confirm({
      title: 'Remove Portion',
      message: `Are you sure you want to remove ${label} from this dish?`,
      confirmText: 'Remove',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.form.variants.splice(index, 1);
      },
    });
  }

  onImageFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared straight away so re-picking the same file after a failure still fires.
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

  save(): void {
    if (!this.form.name || !this.form.sku) {
      this.notify.error('Please enter name and SKU');
      return;
    }

    // Blank rows are dropped rather than rejected — an empty row is just an
    // "Add" the cashier changed their mind about.
    const variants = (this.form.variants || []).filter((v: any) => String(v.name || '').trim());
    for (const v of variants) {
      const uses = Number(v.stockConsumption);
      if (!Number.isFinite(uses) || uses <= 0) {
        this.notify.error(`Portion "${v.name}" must consume more than 0 stock.`);
        return;
      }
    }
    const names = variants.map((v: any) => String(v.name).trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      this.notify.error('Each portion needs a distinct name.');
      return;
    }

    if (this.form.variantStockMode === 'EACH') {
      const missing = variants.find((v: any) => !v.stockItemId);
      if (missing) {
        this.notify.error(`Portion "${missing.name}" needs a stock master item.`);
        return;
      }
    } else if (variants.length > 0 && !this.form.stockItemId) {
      this.notify.error('Choose the stock master item every portion consumes.');
      return;
    }

    // In COMMON mode the per-row choices are irrelevant; clearing them keeps
    // the stored data honest about which mode produced it.
    const payload = {
      ...this.form,
      variants: variants.map((v: any) => ({
        ...v,
        stockItemId: this.form.variantStockMode === 'EACH' ? v.stockItemId : null,
      })),
    };

    // With portions in play the dish-level price is no longer typed, so it is
    // derived from them here. Everything outside this form still reads
    // selling_price — the catalog column, the POS fallback, the reports — and
    // leaving it at 0 would make a priced dish look free in all three.
    if (variants.length > 0) {
      const prices = variants
        .map((v: any) => Number(v.sellingPrice))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      if (prices.length) payload.sellingPrice = Math.min(...prices);
    }

    this.isSaving = true;

    const done = (message: string) => {
      this.isSaving = false;
      this.notify.success(message);
      this.router.navigate(['/products']);
    };
    const failed = (err: any) => {
      this.isSaving = false;
      this.notify.error(err?.error?.message || 'Could not save dish');
    };

    if (this.isEdit) {
      this.productService.updateProduct(this.productId!, payload).subscribe({
        next: () => done('Dish updated'),
        error: failed,
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => done('Dish added to catalog'),
        error: failed,
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}

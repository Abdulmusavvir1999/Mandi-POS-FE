import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Product, ProductVariant } from '../../../core/models';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

/**
 * Product View — strictly read-only.
 *
 * Nothing on this page writes: it issues one GET and renders it. Every number
 * shown is either stored or derived in the browser, so opening the page can
 * never move stock or change a product. Editing lives on /products/:id/edit.
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, AppCurrencyPipe],
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
        <a routerLink="/products" class="breadcrumb-link">Dishes &amp; Products</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ product?.name || 'Product View' }}</span>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. HERO HEADER                                                  -->
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

            <div class="dish-hero-thumb">
              <img
                *ngIf="product?.image_url"
                [src]="settingsService.assetUrl(product!.image_url!)"
                [alt]="product?.name || 'Product image'"
              />
              <span *ngIf="!product?.image_url" class="material-symbols-outlined">restaurant</span>
            </div>

            <div>
              <h1 class="module-title">{{ product?.name || 'Product View' }}</h1>
              <p class="module-subtitle">
                <span class="font-mono">{{ product?.sku }}</span>
                <span *ngIf="product?.category_name"> · {{ product?.category_name }}</span>
                <span class="readonly-chip">Read-only</span>
              </p>
            </div>

            <span
              class="status-dot-pill ml-1"
              *ngIf="product"
              [ngClass]="product.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
            >
              <span class="status-dot"></span>
              {{ product.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="header-actions" *ngIf="product">
          <button type="button" class="action-btn btn-outline-purple" (click)="edit()">
            <span class="material-symbols-outlined">edit</span>
            <span>Edit Dish</span>
          </button>
        </div>
      </div>

      <div class="loading-note" *ngIf="isLoading">Loading product…</div>
      <div class="loading-note" *ngIf="!isLoading && !product">This product could not be found.</div>

      <ng-container *ngIf="!isLoading && product">
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 3. STOCK SUMMARY                                            -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="detail-metric-grid">
          <div class="detail-metric">
            <span class="metric-label">Current Stock</span>
            <span class="metric-value font-mono">
              {{ currentStock | number:'1.0-3' }}
              <span class="metric-unit">{{ unit }}</span>
            </span>
            <span class="metric-note" *ngIf="product.linked_stock_code">
              Ledger item {{ product.linked_stock_code }}
            </span>
          </div>

          <div class="detail-metric">
            <span class="metric-label">Reserved</span>
            <span class="metric-value font-mono">
              {{ reservedStock | number:'1.0-3' }}
              <span class="metric-unit">{{ unit }}</span>
            </span>
            <span class="metric-note">Held against open orders</span>
          </div>

          <div class="detail-metric" [class.is-warning]="availableQuantity <= 0">
            <span class="metric-label">Available Quantity</span>
            <span class="metric-value font-mono">
              {{ availableQuantity | number:'1.0-3' }}
              <span class="metric-unit">{{ unit }}</span>
            </span>
            <span class="metric-note">Current − Reserved</span>
          </div>

          <div class="detail-metric" [class.is-warning]="isLowStock">
            <span class="metric-label">Low Stock Alert</span>
            <span class="metric-value font-mono">
              {{ minAlert | number:'1.0-3' }}
              <span class="metric-unit">{{ unit }}</span>
            </span>
            <span class="metric-note">{{ isLowStock ? 'Below threshold' : 'Above threshold' }}</span>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 4. STOCK CONSUMPTION BY VARIANT                             -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="table-container-card">
          <div class="detail-section-head">
            <h2 class="detail-section-title">
              <span class="material-symbols-outlined">lunch_dining</span>
              <span>Stock &amp; Variant Details</span>
            </h2>
            <span class="detail-section-note">
              What one sale of each portion takes out of
              <strong>{{ availableQuantity | number:'1.0-3' }} {{ unit }}</strong> available
            </span>
          </div>

          <div class="table-responsive-wrapper" *ngIf="hasVariants">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Dish Variant</th>
                  <th style="width: 16%;">Price</th>
                  <th style="width: 18%; text-align: right;">Stock Consumption</th>
                  <th style="width: 18%; text-align: right;">Remaining Stock</th>
                  <th style="width: 26%; text-align: right;">Servings Possible</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of product.variants">
                  <td>
                    <span class="variant-name">{{ v.name }}</span>
                    <span class="variant-default" *ngIf="v.is_default">Default</span>
                  </td>
                  <td class="font-mono font-bold">{{ v.selling_price | appCurrency:'1.0-2' }}</td>
                  <td class="font-mono" style="text-align: right;">
                    {{ v.stock_consumption | number:'1.0-3' }}
                    <span class="cell-unit">{{ unit }}</span>
                  </td>
                  <td class="font-mono" style="text-align: right;">
                    <span [class.text-danger]="remainingAfterOne(v) < 0">
                      {{ remainingAfterOne(v) | number:'1.0-3' }}
                    </span>
                    <span class="cell-unit">{{ unit }}</span>
                  </td>
                  <td style="text-align: right;">
                    <span class="servings-pill" [class.is-none]="servingsPossible(v) === 0">
                      {{ servingsPossible(v) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="section-note" *ngIf="hasVariants">
            <span class="material-symbols-outlined">info</span>
            <span>
              Remaining Stock is the balance after <strong>one</strong> sale of that portion —
              each row is measured from the same {{ availableQuantity | number:'1.0-3' }} {{ unit }},
              not run cumulatively. Servings Possible is how many of that portion the
              current balance can still cover.
            </span>
          </p>

          <p class="empty-note" *ngIf="!hasVariants">
            No variants assigned. This product sells as a single item and one sale consumes
            1 {{ unit }}. Add portions from the Edit page to control consumption per size.
          </p>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 5. PRODUCT DETAILS                                          -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="detail-columns">
          <div class="table-container-card">
            <div class="detail-section-head">
              <h2 class="detail-section-title">
                <span class="material-symbols-outlined">badge</span>
                <span>Product Details</span>
              </h2>
            </div>

            <dl class="detail-list">
              <div class="detail-row">
                <dt>Product Name</dt>
                <dd>{{ product.name }}</dd>
              </div>
              <div class="detail-row">
                <dt>Product Code / SKU</dt>
                <dd class="font-mono">{{ product.sku }}</dd>
              </div>
              <div class="detail-row">
                <dt>Category</dt>
                <dd>{{ product.category_name || '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Unit</dt>
                <dd>{{ unit }}</dd>
              </div>
              <div class="detail-row">
                <dt>Stock Ledger Code</dt>
                <dd class="font-mono">{{ product.linked_stock_code || 'Not linked' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd>
                  <span
                    class="status-dot-pill"
                    [ngClass]="product.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
                  >
                    <span class="status-dot"></span>
                    {{ product.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                  </span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>Created Date</dt>
                <dd>{{ formatDate(product.created_at) }}</dd>
              </div>
              <div class="detail-row">
                <dt>Last Updated</dt>
                <dd>{{ formatDate(product.updated_at) }}</dd>
              </div>
            </dl>
          </div>

          <div class="table-container-card">
            <div class="detail-section-head">
              <h2 class="detail-section-title">
                <span class="material-symbols-outlined">payments</span>
                <span>Pricing, Tax &amp; Discount</span>
              </h2>
            </div>

            <dl class="detail-list">
              <div class="detail-row">
                <dt>Selling Price</dt>
                <dd class="font-mono font-bold">{{ product.selling_price | appCurrency:'1.0-2' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Purchase Price</dt>
                <dd class="font-mono">{{ product.cost_price | appCurrency:'1.0-2' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Weighted Avg Cost</dt>
                <dd class="font-mono">
                  {{ (product.linked_avg_cost || 0) | appCurrency:'1.0-4' }}
                  <span class="cell-unit">/ {{ unit }}</span>
                </dd>
              </div>
              <div class="detail-row">
                <dt>Margin</dt>
                <dd class="font-mono">{{ marginPercent }}</dd>
              </div>
              <div class="detail-row">
                <dt>Tax Rate</dt>
                <dd class="font-mono">{{ product.tax_rate }}%</dd>
              </div>
              <div class="detail-row">
                <dt>Tax on Selling Price</dt>
                <dd class="font-mono">{{ taxAmount | appCurrency:'1.0-2' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Price incl. Tax</dt>
                <dd class="font-mono font-bold">{{ priceInclTax | appCurrency:'1.0-2' }}</dd>
              </div>
              <div class="detail-row is-muted">
                <dt>Discount</dt>
                <dd>
                  Not set per product
                  <span class="detail-hint">Applied per bill or order at the till</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- 6. DESCRIPTION                                              -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="table-container-card" *ngIf="product.description">
          <div class="detail-section-head">
            <h2 class="detail-section-title">
              <span class="material-symbols-outlined">notes</span>
              <span>Description</span>
            </h2>
          </div>
          <p class="detail-description">{{ product.description }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .dish-hero-thumb {
        width: 3rem;
        height: 3rem;
        flex-shrink: 0;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-light, #F3E8FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
      }

      .dish-hero-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .dish-hero-thumb .material-symbols-outlined { font-size: 24px; }

      .readonly-chip {
        display: inline-block;
        margin-left: 0.5rem;
        padding: 0.05rem 0.45rem;
        border-radius: 999px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--text-muted, #6B7280);
        font-size: 0.5625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .loading-note {
        padding: 2.5rem;
        text-align: center;
        font-size: 0.8125rem;
        color: var(--text-muted, #6B7280);
      }

      .detail-metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 1rem;
      }

      .detail-metric {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 1.1rem 1.25rem;
        border-radius: 16px;
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #E9D5FF);
        box-shadow: 0 2px 10px -4px rgba(46, 16, 101, 0.1);
      }

      .detail-metric.is-warning { border-color: #FCA5A5; background: #FEF2F2; }

      .metric-label {
        font-size: 0.625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6B7280);
      }

      .metric-value {
        font-size: 1.25rem;
        font-weight: 900;
        color: var(--text-main, #2E1065);
      }

      .metric-unit,
      .cell-unit {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--text-muted, #6B7280);
      }

      .metric-note { font-size: 0.625rem; color: var(--text-muted, #6B7280); }

      .detail-section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.1rem 1.35rem 0.85rem;
        flex-wrap: wrap;
      }

      .detail-section-title {
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

      .detail-section-title .material-symbols-outlined {
        font-size: 19px;
        color: var(--primary, #7E22CE);
      }

      .detail-section-note { font-size: 0.6875rem; color: var(--text-muted, #6B7280); }

      .variant-name { font-weight: 800; color: var(--text-main, #2E1065); font-size: 0.8125rem; }

      .variant-default {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.05rem 0.45rem;
        border-radius: 999px;
        background: var(--primary-light, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        font-size: 0.5625rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .text-danger { color: var(--danger, #DC2626); font-weight: 800; }

      .servings-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.25rem;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        background: #DCFCE7;
        border: 1px solid #86EFAC;
        color: #15803D;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .servings-pill.is-none { background: #FEE2E2; border-color: #FCA5A5; color: #B91C1C; }

      .section-note {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin: 0 1.35rem 1.35rem;
        padding: 0.75rem 0.9rem;
        border-radius: 12px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        font-size: 0.6875rem;
        line-height: 1.55;
        color: var(--text-muted, #6B7280);
      }

      .section-note .material-symbols-outlined {
        font-size: 16px;
        color: var(--primary, #7E22CE);
        flex-shrink: 0;
      }

      .empty-note {
        margin: 0 1.35rem 1.35rem;
        padding: 0.85rem 1rem;
        border-radius: 12px;
        border: 1px dashed var(--card-border, #E9D5FF);
        background: var(--bg-app, #FAF5FF);
        font-size: 0.75rem;
        line-height: 1.5;
        color: var(--text-muted, #6B7280);
      }

      .detail-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1.25rem;
        align-items: start;
      }

      @media (max-width: 1000px) {
        .detail-columns { grid-template-columns: minmax(0, 1fr); }
      }

      .detail-list { margin: 0; padding: 0 1.35rem 1.35rem; }

      .detail-row {
        display: grid;
        grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
        gap: 1rem;
        align-items: baseline;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }

      .detail-row:last-child { border-bottom: none; }

      .detail-row dt {
        margin: 0;
        font-size: 0.6875rem;
        font-weight: 700;
        color: var(--text-muted, #6B7280);
      }

      .detail-row dd {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-main, #2E1065);
      }

      .detail-row.is-muted dd { color: var(--text-muted, #6B7280); font-weight: 500; }

      .detail-hint {
        display: block;
        margin-top: 0.1rem;
        font-size: 0.625rem;
        color: var(--text-dim, #9CA3AF);
      }

      .detail-description {
        margin: 0 1.35rem 1.35rem;
        font-size: 0.8125rem;
        line-height: 1.6;
        color: var(--text-main, #2E1065);
      }
    `,
  ],
})
export class ProductDetailComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public isLoading = false;
  public product: Product | null = null;

  get hasVariants(): boolean {
    return (this.product?.variants?.length || 0) > 0;
  }

  /** Unit of the linked ledger item — what every quantity on this page is in. */
  get unit(): string {
    return this.product?.linked_unit_type || 'units';
  }

  /** Ledger balance when the dish is linked, else the legacy per-product count. */
  get currentStock(): number {
    if (!this.product) return 0;
    const linked = Number(this.product.linked_stock_quantity);
    return Number.isFinite(linked) ? linked : Number(this.product.current_stock) || 0;
  }

  get reservedStock(): number {
    return Number(this.product?.reserved_stock) || 0;
  }

  /** What can actually be sold: the balance minus what open orders hold. */
  get availableQuantity(): number {
    return this.currentStock - this.reservedStock;
  }

  get minAlert(): number {
    const linked = Number(this.product?.linked_min_alert);
    if (Number.isFinite(linked)) return linked;
    return Number(this.product?.min_stock_alert) || Number(this.product?.low_stock_threshold) || 0;
  }

  get isLowStock(): boolean {
    return this.availableQuantity <= this.minAlert;
  }

  get marginPercent(): string {
    const sell = Number(this.product?.selling_price) || 0;
    const cost = Number(this.product?.cost_price) || 0;
    if (sell <= 0) return '—';
    return `${(((sell - cost) / sell) * 100).toFixed(1)}%`;
  }

  get taxAmount(): number {
    const sell = Number(this.product?.selling_price) || 0;
    const rate = Number(this.product?.tax_rate) || 0;
    return Math.round(((sell * rate) / 100) * 100) / 100;
  }

  get priceInclTax(): number {
    return Math.round(((Number(this.product?.selling_price) || 0) + this.taxAmount) * 100) / 100;
  }

  /**
   * Balance after ONE sale of this portion. Each row is measured from the same
   * starting balance rather than run cumulatively, which is what makes
   * "Full leaves 66, Half leaves 68" a fair comparison of the two portions.
   */
  remainingAfterOne(variant: ProductVariant): number {
    return this.availableQuantity - (Number(variant.stock_consumption) || 0);
  }

  /** How many of this portion the current balance can still cover. */
  servingsPossible(variant: ProductVariant): number {
    const uses = Number(variant.stock_consumption) || 0;
    if (uses <= 0) return 0;
    return Math.max(0, Math.floor(this.availableQuantity / uses));
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/products']);
      return;
    }
    this.load(id);
  }

  private load(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.product = res.success ? res.data : null;
      },
      error: () => {
        this.isLoading = false;
        this.product = null;
        this.notify.error('Could not load product');
      },
    });
  }

  edit(): void {
    if (this.product) this.router.navigate(['/products', this.product.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}

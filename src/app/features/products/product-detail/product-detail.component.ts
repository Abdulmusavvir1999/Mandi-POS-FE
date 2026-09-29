import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService, DishSalesStat, DishSalesSummary } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Product, ProductVariant } from '../../../core/models';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ActionLoadingDirective } from '../../../shared/directives/action-loading.directive';
import { limitingStock, portionsAvailable } from '../../../core/utils/multi-stock.util';

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
  imports: [CommonModule, RouterModule, AppCurrencyPipe, ActionLoadingDirective],
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
        <!-- Multi Stock: no single item, so summarize the portions instead -->
        <div class="detail-metric-grid" *ngIf="isMultiMode">
          <div class="detail-metric" [class.is-warning]="defaultReady <= 0">
            <span class="metric-label">Ready to Sell (Default)</span>
            <span class="metric-value font-mono">
              {{ defaultReady | number:'1.0-0' }}
              <span class="metric-unit">portions</span>
            </span>
            <span class="metric-note metric-note-clip" [title]="defaultVariant?.name || ''">
              of <strong>{{ defaultVariant?.name }}</strong>
              <ng-container *ngIf="otherPortionCount > 0"> · {{ otherPortionCount }} more {{ otherPortionCount === 1 ? 'size' : 'sizes' }} below</ng-container>
            </span>
          </div>

          <div class="detail-metric">
            <span class="metric-label">Stock Items Used</span>
            <span class="metric-value font-mono">
              {{ multiStockCount }}
              <span class="metric-unit">{{ multiStockCount === 1 ? 'item' : 'items' }}</span>
            </span>
            <span class="metric-note metric-note-clip" [title]="stockNames">{{ stockNames || 'None set' }}</span>
          </div>

          <div class="detail-metric" [class.is-warning]="stockRunway.length > 0 && stockRunway[0].portions <= 0">
            <span class="metric-label">Stock Runs Out — soonest first</span>
            <div class="limit-list" *ngIf="stockRunway.length; else noLimit">
              <div class="limit-row limit-head">
                <span>#</span>
                <span>Item</span>
                <span>Limits</span>
                <span class="is-right">Left</span>
                <span class="is-right">Can make</span>
              </div>
              <div
                class="limit-row"
                *ngFor="let r of stockRunway; let ri = index"
                [title]="r.limits.length ? r.name + ' runs out first for portion ' + r.limits.join(', ') : r.name + ' does not limit any portion'"
              >
                <span class="portion-no">{{ ri + 1 }}</span>
                <span class="limit-stock" [class.text-danger]="r.portions <= 0">{{ r.name }}</span>
                <span class="limit-tags">
                  <span class="limit-tag" *ngFor="let n of r.limits">P{{ n }}</span>
                  <span class="limit-none" *ngIf="!r.limits.length">—</span>
                </span>
                <span class="limit-left is-right">{{ r.balance | number:'1.0-3' }} {{ r.unit }}</span>
                <span class="limit-ready is-right" [class.text-danger]="r.portions <= 0">{{ r.portions | number:'1.0-0' }}</span>
              </div>
            </div>
            <span class="metric-note" *ngIf="stockRunway.length">
              <span class="limit-tag">P1</span> = runs out first for portion 1 (see table below)
            </span>
            <ng-template #noLimit><span class="metric-value">—</span></ng-template>
          </div>
        </div>

        <div class="detail-metric-grid" *ngIf="!isMultiMode">
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
              <span class="mode-chip" *ngIf="hasVariants">
                {{ isMultiMode ? 'Multi Stock — several items per portion' : isEachMode ? 'Each portion has its own source' : 'Common source' }}
              </span>
            </h2>
            <span class="detail-section-note" *ngIf="!isMultiMode">
              <ng-container *ngIf="sales?.total?.orders"><strong>{{ sales!.total.orders | number:'1.0-0' }}</strong> {{ sales!.total.orders === 1 ? 'order' : 'orders' }} · </ng-container>
              Portions possible from <strong>{{ availableQuantity | number:'1.0-3' }} {{ unit }}</strong> in stock
            </span>
          </div>

          <!-- Multi Stock: each portion's full list -->
          <div class="table-responsive-wrapper" *ngIf="isMultiMode && hasVariants">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 18%;">Portion</th>
                  <th style="width: 28%;">Stock used per portion</th>
                  <th style="width: 11%;">Stock cost</th>
                  <th style="width: 10%;">Price</th>
                  <th style="width: 11%;">Margin</th>
                  <th style="width: 10%; text-align: right;">Orders</th>
                  <th style="width: 16%; text-align: right;">Portions <span class="th-sub">Total − Used = Left</span></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of product.variants">
                  <td>
                    <span class="variant-name">{{ v.name }}</span>
                    <span class="variant-default" *ngIf="v.is_default">Default</span>
                  </td>
                  <td>
                    <div class="recipe-chips">
                      <span
                        class="recipe-chip"
                        *ngFor="let s of v.stocks"
                        [class.is-short]="s.current_quantity !== undefined && s.current_quantity < s.stock_consumption"
                        [title]="s.stock_name + ': ' + (s.current_quantity ?? 0) + ' ' + (s.unit_type || '') + ' in stock'"
                      >
                        <strong>{{ s.stock_name }}</strong>
                        <span class="font-mono">× {{ s.stock_consumption | number:'1.0-3' }} {{ s.unit_type }}</span>
                      </span>
                      <span class="recipe-chip is-short" *ngIf="!v.stocks?.length">No stock items set</span>
                    </div>
                  </td>
                  <td class="font-mono">{{ portionCost(v) | appCurrency:'1.2-2' }}</td>
                  <td class="font-mono font-bold">{{ v.selling_price | appCurrency:'1.0-2' }}</td>
                  <td>
                    <span class="margin-pill" [class.is-profit]="portionMargin(v) > 0" [class.is-loss]="portionMargin(v) < 0">
                      {{ portionMargin(v) < 0 ? '−' : '' }}{{ absValue(portionMargin(v)) | appCurrency:'1.0-2' }}
                      <span *ngIf="Number(v.selling_price) > 0">· {{ marginPercentOf(v) | number:'1.0-0' }}%</span>
                    </span>
                  </td>
                  <td class="font-mono" style="text-align: right;">
                    <span class="orders-cell" [class.is-none]="!salesOf(v).orders" [title]="salesOf(v).orders ? (salesOf(v).quantity + ' portions sold on ' + salesOf(v).orders + ' bills') : 'Not ordered yet'">
                      <strong>{{ salesOf(v).orders | number:'1.0-0' }}</strong>
                      <span class="cell-unit">{{ salesOf(v).orders === 1 ? 'order' : 'orders' }}</span>
                    </span>
                    <small class="orders-sold" *ngIf="salesOf(v).quantity">{{ salesOf(v).quantity | number:'1.0-0' }} sold</small>
                  </td>
                  <td class="font-mono" style="text-align: right;">
                    <ng-container *ngIf="runwayOf(v) as r">
                      <span
                        class="runway"
                        [title]="r.known ? r.used + ' used by sales of this dish, ' + r.left + ' left in stock - ' + r.total + ' in all' : 'Sales not loaded yet'"
                      >
                        <span class="runway-total">{{ r.total | number:'1.0-1' }}</span>
                        <span class="runway-op">−</span>
                        <span class="runway-used">{{ r.used | number:'1.0-1' }}</span>
                        <span class="runway-op">=</span>
                        <strong class="runway-left" [class.text-danger]="r.left <= 0">{{ r.left | number:'1.0-0' }}</strong>
                        <span class="cell-unit">portions</span>
                      </span>
                    </ng-container>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="section-note" *ngIf="isMultiMode && hasVariants">
            <span class="material-symbols-outlined">info</span>
            <span>
              Selling one portion takes <strong>every</strong> item on its list. <strong>Used</strong> is the stock this dish's own sales have
              taken (all sizes), shown in that portion's size; <strong>Left</strong> is what can be made now, set by the item that runs out
              first; <strong>Total</strong> = Left + Used.
            </span>
          </p>

          <div class="table-responsive-wrapper" *ngIf="!isMultiMode && hasVariants">
            <table class="saas-data-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Dish Variant</th>
                  <th style="width: 22%;">Stock Source</th>
                  <th style="width: 14%; text-align: center;">Stock Usage</th>
                  <th style="width: 13%;">Price</th>
                  <th style="width: 13%; text-align: right;">Orders</th>
                  <th style="width: 18%; text-align: right;">Remaining Stock <span class="th-sub">Total − Used = Left</span></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of product.variants">
                  <td>
                    <span class="variant-name">{{ v.name }}</span>
                    <span class="variant-default" *ngIf="v.is_default">Default</span>
                  </td>
                  <td>
                    <span class="source-name">{{ sourceName(v) }}</span>
                    <span class="source-code" *ngIf="sourceCode(v)">{{ sourceCode(v) }}</span>
                  </td>
                  <td class="font-mono text-center font-bold">
                    <span class="inline-flex items-center justify-center gap-1.5">
                      <span>{{ (v.stock_consumption ?? v.stockConsumption ?? 1) | number:'1.0-3' }}</span>
                      <span class="cell-unit">{{ variantUnit(v) }}</span>
                    </span>
                  </td>
                  <td class="font-mono font-bold">{{ v.selling_price | appCurrency:'1.0-2' }}</td>
                  <td class="font-mono" style="text-align: right;">
                    <span class="orders-cell" [class.is-none]="!salesOf(v).orders" [title]="salesOf(v).orders ? (salesOf(v).quantity + ' portions sold on ' + salesOf(v).orders + ' bills') : 'Not ordered yet'">
                      <strong>{{ salesOf(v).orders | number:'1.0-0' }}</strong>
                      <span class="cell-unit">{{ salesOf(v).orders === 1 ? 'order' : 'orders' }}</span>
                    </span>
                    <small class="orders-sold" *ngIf="salesOf(v).quantity">{{ salesOf(v).quantity | number:'1.0-0' }} sold</small>
                  </td>
                  <td class="font-mono" style="text-align: right;">
                    <ng-container *ngIf="runwayOf(v) as r">
                      <span
                        class="runway"
                        [title]="r.known ? r.used + ' used by sales of this dish, ' + r.left + ' left in stock - ' + r.total + ' in all' : 'Sales not loaded yet'"
                      >
                        <span class="runway-total">{{ r.total | number:'1.0-1' }}</span>
                        <span class="runway-op">−</span>
                        <span class="runway-used">{{ r.used | number:'1.0-1' }}</span>
                        <span class="runway-op">=</span>
                        <strong class="runway-left" [class.text-danger]="r.left <= 0">{{ r.left | number:'1.0-0' }}</strong>
                        <span class="cell-unit">portions</span>
                      </span>
                    </ng-container>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="section-note" *ngIf="!isMultiMode && hasVariants">
            <span class="material-symbols-outlined">info</span>
            <span>
              <strong>Remaining Stock</strong> reads <strong>Total − Used = Left</strong> for this dish only: Used is the stock this dish's sales
              have taken (all its sizes share it), shown in that portion's size; Left is what the current balance of
              {{ availableQuantity | number:'1.0-3' }} {{ unit }} still makes (balance ÷ stock usage); Total = Left + Used.
              Other dishes using the same stock are not counted.
            </span>
          </p>

          <p class="empty-note" *ngIf="!hasVariants">
            No variants assigned. This product sells as a single item.
          </p>
        </div>

        <!-- Multi Stock: every stock item behind this dish, with its balance -->
        <div class="table-container-card" *ngIf="isMultiMode && stockRows.length > 0">
          <div class="detail-section-head">
            <h2 class="detail-section-title">
              <span class="material-symbols-outlined">inventory_2</span>
              <span>Stock Items On Hand</span>
            </h2>
            <span class="detail-section-note stock-legend">
              <span class="legend-swatch"></span> Runs out first for that portion
            </span>
          </div>

          <div class="table-responsive-wrapper">
            <table class="saas-data-table stock-matrix">
              <thead>
                <tr>
                  <th class="sm-item" rowspan="2">Stock item</th>
                  <th class="sm-num" rowspan="2">In stock</th>
                  <th class="sm-num" rowspan="2">Low alert</th>
                  <th class="sm-num" rowspan="2">Avg cost / unit</th>
                  <th class="sm-group" [attr.colspan]="product.variants?.length || 1">Quantity each portion takes</th>
                </tr>
                <tr>
                  <th class="sm-portion" *ngFor="let v of product.variants; let pi = index" [title]="v.name">
                    <span class="portion-no">{{ pi + 1 }}</span>
                    <span class="portion-head-name">{{ v.name }}</span>
                    <span class="variant-default" *ngIf="v.is_default">Default</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of stockRows" [class.row-warning]="row.isLow">
                  <td>
                    <span class="source-name">{{ row.name }}</span>
                    <span class="source-code" *ngIf="row.code">{{ row.code }}</span>
                    <span class="limit-badge is-muted" *ngIf="row.inactive">Inactive</span>
                  </td>
                  <td class="font-mono font-bold">
                    <span [class.text-danger]="row.isLow">{{ row.balance | number:'1.0-3' }}</span>
                    <span class="cell-unit">{{ row.unit }}</span>
                  </td>
                  <td class="font-mono">
                    <span class="status-mini" [class.is-low]="row.isLow">
                      {{ row.isLow ? 'Low' : 'OK' }}
                    </span>
                    <span class="cell-unit">at {{ row.minAlert | number:'1.0-3' }}</span>
                  </td>
                  <td class="font-mono">{{ row.avgCost | appCurrency:'1.2-2' }}</td>
                  <td
                    *ngFor="let v of product.variants"
                    class="sm-cell"
                    [class.is-limiting]="row.limits.has(v.id)"
                    [title]="row.limits.has(v.id) ? row.name + ' runs out first for ' + v.name : ''"
                  >
                    <ng-container *ngIf="row.uses.get(v.id) as qty; else notUsed">
                      <span class="sm-qty">{{ qty | number:'1.0-3' }} <span class="cell-unit">{{ row.unit }}</span></span>
                      <span class="sm-enough">enough for {{ enoughFor(row.balance, qty) | number:'1.0-0' }}</span>
                    </ng-container>
                    <ng-template #notUsed><span class="sm-none">Not used</span></ng-template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
                <dd>{{ isMultiMode ? 'Per stock item' : unit }}</dd>
              </div>
              <div class="detail-row">
                <dt>Stock Ledger Code</dt>
                <dd [class.font-mono]="!isMultiMode">
                  {{ isMultiMode ? 'Multi Stock — set per portion' : (product.linked_stock_code || 'Not linked') }}
                </dd>
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
                <span>Pricing &amp; Tax</span>
              </h2>
            </div>

            <!-- Multi Stock: each portion has its own price, so one row each -->
            <div class="table-responsive-wrapper" *ngIf="isMultiMode && hasVariants">
              <table class="saas-data-table pricing-table">
                <thead>
                  <tr>
                    <th>Portion</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Tax ({{ product.tax_rate }}%)</th>
                    <th style="text-align: right;">Incl. tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let v of product.variants">
                    <td>
                      <span class="variant-name">{{ v.name }}</span>
                      <span class="variant-default" *ngIf="v.is_default">Default</span>
                    </td>
                    <td class="font-mono font-bold" style="text-align: right;">{{ v.selling_price | appCurrency:'1.0-2' }}</td>
                    <td class="font-mono" style="text-align: right;">{{ taxOf(v.selling_price) | appCurrency:'1.0-2' }}</td>
                    <td class="font-mono font-bold" style="text-align: right;">{{ inclTaxOf(v.selling_price) | appCurrency:'1.0-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <dl class="detail-list" *ngIf="!isMultiMode || !hasVariants">
              <div class="detail-row">
                <dt>Selling Price</dt>
                <dd class="font-mono font-bold">{{ product.selling_price | appCurrency:'1.0-2' }}</dd>
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
      :host {
        display: block;
        width: 100%;
      }

      .module-page-wrapper {
        padding-bottom: 3.5rem;
      }

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
        box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.1);
      }

      .detail-metric.is-warning {
        border-color: rgba(var(--danger-rgb, 220, 38, 38), 0.45);
        background: rgba(var(--danger-rgb, 220, 38, 38), 0.1);
      }
      .detail-metric.is-warning .metric-label,
      .detail-metric.is-warning .metric-value,
      .detail-metric.is-warning .metric-note { color: var(--danger, #DC2626); }
      .detail-metric.is-warning .metric-unit { color: var(--danger, #DC2626); opacity: 0.8; }

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
        margin-left: 0.35rem;
        display: inline-block;
      }

      /* Orders per portion */
      .orders-cell { display: inline-flex; align-items: baseline; justify-content: flex-end; }
      .orders-cell strong { font-weight: 800; color: var(--primary, #7E22CE); }
      .orders-cell.is-none strong { color: var(--text-muted, #6B7280); font-weight: 600; }
      .orders-sold { display: block; margin-top: 2px; font-size: 0.6875rem; color: var(--text-muted, #6B7280); }

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

      .source-name { display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-main, #2E1065); }

      .source-code {
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.625rem;
        color: var(--text-muted, #6B7280);
      }

      .mode-chip {
        margin-left: 0.5rem;
        padding: 0.05rem 0.5rem;
        border-radius: 999px;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--text-muted, #6B7280);
        font-size: 0.5625rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: none;
      }

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

      /* Remaining stock: Total − Used = Left */
      .runway { display: inline-flex; align-items: baseline; justify-content: flex-end; gap: 0.3rem; white-space: nowrap; }
      .runway-total { color: var(--text-main, #2E1065); font-weight: 700; }
      .runway-used { color: var(--warning, #D97706); font-weight: 700; }
      .runway-op { color: var(--text-muted, #6B7280); font-weight: 600; }
      .runway-left { color: var(--text-main, #2E1065); font-size: 0.95rem; }
      .th-sub { display: block; margin-top: 2px; font-size: 0.56rem; font-weight: 700; letter-spacing: 0.02em; text-transform: none; color: var(--text-muted, #6B7280); }

      /* Multi Stock: a portion's list as chips, red when that item is short */
      .recipe-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }

      .recipe-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.72rem;
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        white-space: nowrap;
      }

      .recipe-chip strong { color: var(--text-main, #2E1065); font-weight: 700; }

      .recipe-chip.is-short {
        color: var(--danger, #DC2626);
        background: var(--danger-light, rgba(220, 38, 38, 0.1));
        border-color: color-mix(in srgb, var(--danger, #DC2626) 35%, transparent);
      }

      .recipe-chip.is-short strong { color: var(--danger, #DC2626); }

      .metric-note-clip {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metric-note strong { color: var(--text-main, #2E1065); }

      .margin-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.72rem;
        font-weight: 800;
        white-space: nowrap;
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }

      .margin-pill.is-profit {
        color: var(--success, #10B981);
        background: var(--success-light, rgba(16, 185, 129, 0.12));
        border-color: color-mix(in srgb, var(--success, #10B981) 35%, transparent);
      }

      .margin-pill.is-loss {
        color: var(--danger, #DC2626);
        background: var(--danger-light, rgba(220, 38, 38, 0.1));
        border-color: color-mix(in srgb, var(--danger, #DC2626) 35%, transparent);
      }

      .limit-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.15rem;
        margin-left: 0.4rem;
        padding: 0.05rem 0.45rem 0.05rem 0.25rem;
        border-radius: 999px;
        font-size: 0.6rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--warning, #D97706);
        background: var(--warning-light, rgba(217, 119, 6, 0.12));
        border: 1px solid color-mix(in srgb, var(--warning, #D97706) 35%, transparent);
        vertical-align: middle;
      }

      .limit-badge .material-symbols-outlined { font-size: 12px; }

      .limit-badge.is-muted {
        color: var(--text-muted, #6B7280);
        background: var(--bg-app, #FAF5FF);
        border-color: var(--card-border, #E9D5FF);
      }

      .status-mini {
        display: inline-block;
        margin-right: 0.35rem;
        padding: 0.05rem 0.45rem;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--success, #10B981);
        background: var(--success-light, rgba(16, 185, 129, 0.12));
      }

      .status-mini.is-low {
        color: var(--danger, #DC2626);
        background: var(--danger-light, rgba(220, 38, 38, 0.1));
      }

      .row-warning td { background: color-mix(in srgb, var(--danger, #DC2626) 5%, transparent); }

      /* Runs-out-first card: one line per portion */
      .limit-list { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.15rem; }

      /* Fixed columns so every row lines up: # | item | limits | left | can make */
      .limit-row {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr) 64px 84px 64px;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
      }

      .limit-head span {
        font-size: 0.58rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6B7280);
      }

      .limit-row .is-right { text-align: right; }

      .limit-tags { display: flex; flex-wrap: wrap; gap: 0.2rem; }

      .limit-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.05rem 0.35rem;
        border-radius: 6px;
        font-size: 0.6rem;
        font-weight: 800;
        color: var(--warning, #D97706);
        background: var(--warning-light, rgba(217, 119, 6, 0.14));
        border: 1px solid color-mix(in srgb, var(--warning, #D97706) 40%, transparent);
      }

      .limit-none { color: var(--text-muted, #6B7280); opacity: 0.6; }

      .limit-stock { font-weight: 800; color: var(--text-main, #2E1065); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .limit-left { color: var(--text-muted, #6B7280); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.7rem; }
      .limit-ready { font-weight: 800; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--text-main, #2E1065); }

      /* Portion number badge, shared by the card and the matrix header */
      .portion-no {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 0.65rem;
        font-weight: 800;
        color: #FFFFFF;
        background: var(--primary, #7E22CE);
      }

      /* Stock matrix: rows = stock items, columns = portions */
      .stock-legend { display: inline-flex; align-items: center; gap: 0.4rem; }

      .legend-swatch {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        background: var(--warning-light, rgba(217, 119, 6, 0.15));
        border: 1.5px solid var(--warning, #D97706);
      }

      .stock-matrix th.sm-group {
        text-align: center;
        border-bottom: 1px solid var(--card-border, #E9D5FF);
      }

      .stock-matrix th.sm-portion {
        min-width: 150px;
        max-width: 220px;
        vertical-align: top;
        text-transform: none;
        letter-spacing: 0;
      }

      .stock-matrix th.sm-portion > * { vertical-align: middle; }

      .portion-head-name {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0.25rem 0 0.15rem;
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.3;
        color: var(--text-main, #2E1065);
      }

      .stock-matrix th.sm-item { min-width: 150px; }
      .stock-matrix th.sm-num { white-space: nowrap; }

      .stock-matrix td.sm-cell {
        border-left: 1px dashed var(--card-border, #E9D5FF);
        white-space: nowrap;
      }

      .stock-matrix td.sm-cell.is-limiting {
        background: var(--warning-light, rgba(217, 119, 6, 0.12));
        box-shadow: inset 0 0 0 1.5px var(--warning, #D97706);
      }

      .sm-qty { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; color: var(--text-main, #2E1065); }
      .sm-enough { display: block; font-size: 0.68rem; color: var(--text-muted, #6B7280); }
      .is-limiting .sm-enough { color: var(--warning, #D97706); font-weight: 800; }
      .sm-none { font-size: 0.7rem; color: var(--text-muted, #6B7280); opacity: 0.7; font-style: italic; }

      .pricing-table th,
      .pricing-table td { padding-left: 0.85rem; padding-right: 0.85rem; }

      .metric-value-text {
        font-size: 1.05rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .servings-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.25rem;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        background: var(--success-light, #DCFCE7);
        border: 1px solid #86EFAC;
        color: var(--success, #15803D);
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .servings-pill.is-none { background: var(--danger-light, #FEE2E2); border-color: #FCA5A5; color: var(--danger, #B91C1C); }

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

  get isEachMode(): boolean {
    return this.product?.variant_stock_mode === 'EACH';
  }

  get isMultiMode(): boolean {
    return this.product?.variant_stock_mode === 'MULTI';
  }

  /** Template access to Number() for the Multi Stock rows. */
  readonly Number = Number;

  /** Portions other than the default, for the "N more sizes below" hint. */
  get otherPortionCount(): number {
    return Math.max(0, (this.product?.variants?.length || 0) - 1);
  }

  /** Distinct stock item names across every portion, in first-seen order. */
  get stockNames(): string {
    return this.stockRows.map((r) => r.name).join(', ');
  }

  /**
   * One row per stock item behind a Multi Stock dish: its balance and alert,
   * what each portion takes of it, and the portions it runs out first for.
   * Rebuilt only when the product object changes.
   */
  get stockRows() {
    if (this.stockRowsFor === this.product) return this.stockRowsCache;
    const rows = new Map<number, {
      id: number; name: string; code: string; unit: string; balance: number; minAlert: number;
      avgCost: number; inactive: boolean; isLow: boolean;
      /** variant id -> quantity one portion of it takes */
      uses: Map<number, number>;
      /** variant ids this item runs out first for */
      limits: Set<number>;
    }>();
    for (const v of this.product?.variants || []) {
      const limiting = limitingStock(v);
      for (const s of v.stocks || []) {
        let row = rows.get(s.stock_id);
        if (!row) {
          const balance = Number(s.current_quantity) || 0;
          const minAlert = Number(s.min_stock_alert) || 0;
          row = {
            id: s.stock_id,
            name: s.stock_name || `Stock #${s.stock_id}`,
            code: s.stock_code || '',
            unit: s.unit_type || 'units',
            balance,
            minAlert,
            avgCost: Number(s.average_unit_price) || 0,
            inactive: s.stock_status === 'inactive',
            isLow: balance <= minAlert,
            uses: new Map(),
            limits: new Set(),
          };
          rows.set(s.stock_id, row);
        }
        row.uses.set(v.id, Number(s.stock_consumption) || 0);
        if (limiting && limiting.stock_id === s.stock_id) row.limits.add(v.id);
      }
    }
    this.stockRowsFor = this.product;
    this.stockRowsCache = [...rows.values()];
    return this.stockRowsCache;
  }
  private stockRowsFor: Product | null = null;
  private stockRowsCache: any[] = [];

  /**
   * Every stock item the dish uses, soonest to run out first: the fewest
   * portions it can supply across the portions that use it, and the numbers
   * of the portions it is the limiting item for (numbered like the portion
   * columns in the table below).
   */
  get stockRunway() {
    const variants = this.product?.variants || [];
    return this.stockRows
      .map((row) => {
        let portions = Infinity;
        const limits: number[] = [];
        variants.forEach((v, i) => {
          const qty = row.uses.get(v.id);
          if (qty) portions = Math.min(portions, this.enoughFor(row.balance, qty));
          if (row.limits.has(v.id)) limits.push(i + 1);
        });
        return { name: row.name, unit: row.unit, balance: row.balance, portions: Number.isFinite(portions) ? portions : 0, limits };
      })
      .sort((a, b) => a.portions - b.portions);
  }

  /** Portions this balance alone could supply at this quantity each. */
  enoughFor(balance: number, perPortion: number): number {
    return perPortion > 0 ? Math.max(0, Math.floor(balance / perPortion)) : 0;
  }

  portionMargin(variant: ProductVariant): number {
    return (Number(variant.selling_price) || 0) - this.portionCost(variant);
  }

  marginPercentOf(variant: ProductVariant): number {
    const price = Number(variant.selling_price) || 0;
    return price > 0 ? (this.portionMargin(variant) / price) * 100 : 0;
  }

  absValue(n: number): number {
    return Math.abs(n);
  }

  taxOf(price: number | string): number {
    const rate = Number(this.product?.tax_rate) || 0;
    return Math.round((((Number(price) || 0) * rate) / 100) * 100) / 100;
  }

  inclTaxOf(price: number | string): number {
    return Math.round(((Number(price) || 0) + this.taxOf(price)) * 100) / 100;
  }

  /** Multi Stock: distinct stock items across every portion's list. */
  get multiStockCount(): number {
    const ids = new Set<number>();
    for (const v of this.product?.variants || []) {
      for (const s of v.stocks || []) ids.add(s.stock_id);
    }
    return ids.size;
  }

  get defaultVariant(): ProductVariant | undefined {
    const variants = this.product?.variants || [];
    return variants.find((v) => Number(v.is_default) === 1) || variants[0];
  }

  get defaultReady(): number {
    return portionsAvailable(this.defaultVariant);
  }

  /** The item on the default portion's list that runs out first. */
  get defaultLimiting() {
    return limitingStock(this.defaultVariant);
  }

  readyOf(variant: ProductVariant): number {
    return portionsAvailable(variant);
  }

  /** Multi Stock: the portion's list priced at each item's average cost. */
  portionCost(variant: ProductVariant): number {
    return (variant.stocks || []).reduce(
      (sum, s) => sum + (Number(s.stock_consumption) || 0) * (Number(s.average_unit_price) || 0),
      0
    );
  }

  /**
   * A portion draws from its own stock item in EACH mode, otherwise from the
   * dish's common one. Falls back to the dish name so the column is never blank.
   */
  sourceName(variant: ProductVariant): string {
    if (variant.stock_item_name) return variant.stock_item_name;
    return this.product?.linked_stock_code ? this.product.name : 'Dish stock item';
  }

  sourceCode(variant: ProductVariant): string {
    return variant.stock_item_code || this.product?.linked_stock_code || '';
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

  /**
   * What can actually be sold. Nothing reserves stock any more — the legacy
   * `stock` table carried that counter and never incremented it — so this is
   * simply the ledger balance.
   */
  get availableQuantity(): number {
    return this.currentStock;
  }

  get minAlert(): number {
    const linked = Number(this.product?.linked_min_alert);
    if (Number.isFinite(linked)) return linked;
    return Number(this.product?.min_stock_alert) || 0;
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

  variantStock(variant?: ProductVariant): number {
    if (this.isEachMode && variant?.stock_id && variant.stock_item_quantity !== undefined && variant.stock_item_quantity !== null) {
      return Number(variant.stock_item_quantity) || 0;
    }
    return this.availableQuantity;
  }

  variantUnit(variant?: ProductVariant): string {
    if (this.isEachMode && variant?.stock_item_unit) {
      return variant.stock_item_unit;
    }
    return this.unit;
  }

  /**
   * Remaining Stock as Total - Used = Left, per portion, for this dish only:
   * Used is the stock this dish's own sales (every size, voids excluded)
   * have taken, expressed in this portion's size; Left is what the current
   * balance still makes; Total is Left + Used. Other dishes that share the
   * same stock item do not count towards Used. Multi Stock measures it on
   * the item that runs out first, the one that sets Left.
   */
  runwayOf(variant: ProductVariant): { total: number; used: number; left: number; known: boolean } {
    const left = this.isMultiMode ? this.readyOf(variant) : this.servingsPossible(variant);
    const lines = (variant.stocks || []).filter((s) => Number(s.stock_consumption) > 0);
    const line = this.isMultiMode ? limitingStock(variant) : lines[0];
    if (!line) return { total: left, used: 0, left, known: !!this.sales };

    const usedStock = this.sales?.stock_used?.find((u) => u.stock_id === line.stock_id)?.quantity ?? 0;
    const used = Math.round((usedStock / Number(line.stock_consumption)) * 10) / 10;
    return { total: Math.round((left + used) * 10) / 10, used, left, known: !!this.sales };
  }

  /** How many portions the current stock balance can cover (overall stock / stock usage). */
  servingsPossible(variant?: ProductVariant): number {
    const stock = this.variantStock(variant);
    const usage = Number(variant?.stock_consumption ?? variant?.stockConsumption) || 1;
    return usage > 0 ? Math.max(0, Math.floor(stock / usage)) : 0;
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

  // ─── Orders per portion ───
  public sales: DishSalesSummary | null = null;

  /** Sales for a portion, matched by name (portion ids change when the dish is saved). */
  salesOf(v?: ProductVariant): DishSalesStat {
    const name = (v?.name || '').trim().toLowerCase();
    const hit = this.sales?.variants.find((s) => (s.variant_name || '').trim().toLowerCase() === name);
    return hit || { orders: 0, quantity: 0, revenue: 0, last_sold_at: null };
  }

  private loadSales(id: number): void {
    this.productService.getSalesSummary(id).subscribe({
      next: (res) => (this.sales = res.success ? res.data : null),
      // Optional panel: the page works without it.
      error: () => (this.sales = null),
    });
  }

  private load(id: number): void {
    this.isLoading = true;
    this.loadSales(id);
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

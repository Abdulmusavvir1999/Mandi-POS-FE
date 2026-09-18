import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockDesignKey } from '../../../core/services/stock-layout.service';
import { STOCK_LAYOUT_CSS } from '../../styles/stock-layout.styles';

export interface PreviewStockItem {
  id: number;
  stock_code: string;
  name: string;
  unit_type: string;
  current_quantity: number;
  min_stock_alert: number;
  current_value: number;
  average_unit_price: number;
  status: 'healthy' | 'warning' | 'critical';
}

@Component({
  selector: 'app-stock-layout-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="stock-stage"
      [ngClass]="'stock-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-label="Live Stock Ledger Layout Preview"
    >
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 1: WAREHOUSE METRIC GRID                                 -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'warehouse'" class="stock-wh-grid">
        <div *ngFor="let item of sampleItems" class="stock-wh-card">
          <div>
            <div class="stock-wh-header">
              <span class="stock-wh-sku">{{ item.stock_code }}</span>
              <span
                class="stock-wh-status-badge"
                [ngClass]="'is-' + item.status"
              >
                ● {{ item.status === 'healthy' ? 'Optimal' : item.status === 'warning' ? 'Low Stock' : 'Depleted' }}
              </span>
            </div>

            <div class="stock-wh-body">
              <h4 class="stock-wh-title">{{ item.name }}</h4>
              <p class="stock-wh-sub">Threshold: {{ item.min_stock_alert }} {{ item.unit_type }}s</p>
            </div>

            <div class="stock-wh-meter-box">
              <div class="stock-wh-meter-row">
                <span class="stock-wh-qty">
                  {{ item.current_quantity }} <span class="stock-wh-unit">{{ item.unit_type }}</span>
                </span>
                <span class="stock-wh-threshold">Min: {{ item.min_stock_alert }}</span>
              </div>
              <div class="stock-wh-bar-bg">
                <div
                  class="stock-wh-bar-fill"
                  [style.width.%]="calcPercent(item.current_quantity, item.min_stock_alert)"
                  [style.background]="getStatusColor(item.status)"
                ></div>
              </div>
            </div>

            <div class="stock-wh-stats">
              <div class="stock-wh-stat-card">
                <span class="stock-wh-stat-label">Inventory Value</span>
                <span class="stock-wh-stat-value is-valuation">{{ formatCurrency(item.current_value) }}</span>
              </div>
              <div class="stock-wh-stat-card">
                <span class="stock-wh-stat-label">Avg Unit Cost</span>
                <span class="stock-wh-stat-value">{{ formatCurrency(item.average_unit_price) }} / {{ item.unit_type }}</span>
              </div>
            </div>
          </div>

          <div class="stock-wh-footer">
            <button type="button" class="stock-wh-btn btn-entry" title="Purchase Entry">
              <span class="material-symbols-outlined" style="font-size: 14px;">add_shopping_cart</span>
              <span>Entry</span>
            </button>
            <button type="button" class="stock-wh-btn" title="Adjust Stock">
              <span class="material-symbols-outlined" style="font-size: 14px;">tune</span>
              <span>Adjust</span>
            </button>
            <button type="button" class="stock-wh-btn" title="Audit Ledger">
              <span class="material-symbols-outlined" style="font-size: 14px;">history</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 2: AUDITED FINANCIAL LEDGER                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'financial'" class="stock-fin-table-card">
        <table class="stock-fin-table">
          <thead>
            <tr>
              <th style="width: 14%;">Stock Code</th>
              <th style="width: 26%;">Item Description</th>
              <th style="width: 10%;">Unit</th>
              <th style="width: 16%;">Live Balance</th>
              <th style="width: 14%;">Valuation</th>
              <th style="width: 12%;">Avg Cost</th>
              <th style="width: 8%; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sampleItems" class="stock-fin-row">
              <td>
                <span class="stock-fin-sku">{{ item.stock_code }}</span>
              </td>
              <td>
                <div class="stock-fin-name">{{ item.name }}</div>
                <div class="stock-fin-meta">Min Alert: {{ item.min_stock_alert }} {{ item.unit_type }}s</div>
              </td>
              <td>
                <span class="stock-fin-unit-pill">{{ item.unit_type }}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span class="stock-fin-qty">{{ item.current_quantity }}</span>
                  <span class="stock-fin-health-pill" [ngClass]="'is-' + item.status">
                    {{ item.status === 'healthy' ? 'Optimal' : item.status === 'warning' ? 'Low' : 'Empty' }}
                  </span>
                </div>
              </td>
              <td>
                <span class="stock-fin-valuation">{{ formatCurrency(item.current_value) }}</span>
              </td>
              <td>
                <span class="stock-fin-cost">{{ formatCurrency(item.average_unit_price) }}</span>
              </td>
              <td style="text-align: right;">
                <button type="button" class="stock-fin-btn" title="View Ledger">
                  <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 3: COMPACT KANBAN STOCK TILES                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'kanban'" class="stock-kan-grid">
        <div *ngFor="let item of sampleItems" class="stock-kan-tile">
          <div class="stock-kan-header">
            <span class="stock-kan-sku">{{ item.stock_code }}</span>
            <span class="stock-kan-status-dot" [ngClass]="'is-' + item.status"></span>
          </div>

          <div class="stock-kan-name">{{ item.name }}</div>

          <div class="stock-kan-qty-row">
            <span class="stock-kan-qty">
              {{ item.current_quantity }} <span class="stock-kan-unit">{{ item.unit_type }}</span>
            </span>
            <span class="stock-kan-val">{{ formatCurrency(item.current_value) }}</span>
          </div>

          <div class="stock-kan-bar">
            <div
              class="stock-kan-bar-fill"
              [style.width.%]="calcPercent(item.current_quantity, item.min_stock_alert)"
              [style.background]="getStatusColor(item.status)"
            ></div>
          </div>

          <div class="stock-kan-footer">
            <span class="stock-kan-alert">Alert: {{ item.min_stock_alert }}</span>
            <div class="stock-kan-actions">
              <button type="button" class="stock-kan-btn" title="Purchase">
                <span class="material-symbols-outlined" style="font-size: 13px;">add</span>
              </button>
              <button type="button" class="stock-kan-btn" title="Audit">
                <span class="material-symbols-outlined" style="font-size: 13px;">history</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 4: LIST VIEW                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'list'" class="stock-list-container">
        <div *ngFor="let item of sampleItems" class="stock-list-row">
          <div class="stock-list-left">
            <span class="stock-list-sku">{{ item.stock_code }}</span>
            <div>
              <div class="stock-list-title">{{ item.name }}</div>
              <div class="stock-list-sub">Min Alert: {{ item.min_stock_alert }} {{ item.unit_type }}s</div>
            </div>
          </div>

          <div>
            <span class="stock-list-unit-badge">{{ item.unit_type }}</span>
          </div>

          <div class="stock-list-qty-box">
            <span class="stock-list-qty-num">{{ item.current_quantity }} {{ item.unit_type }}</span>
            <div class="stock-list-bar">
              <div
                class="stock-list-bar-fill"
                [style.width.%]="calcPercent(item.current_quantity, item.min_stock_alert)"
                [style.background]="getStatusColor(item.status)"
              ></div>
            </div>
          </div>

          <div>
            <span class="stock-list-val">{{ formatCurrency(item.current_value) }}</span>
          </div>

          <div>
            <span class="stock-list-cost">{{ formatCurrency(item.average_unit_price) }} / {{ item.unit_type }}</span>
          </div>

          <div class="stock-list-actions">
            <button type="button" class="stock-list-btn btn-entry" title="Add Purchase Entry">
              <span class="material-symbols-outlined" style="font-size: 14px;">add_shopping_cart</span>
              <span>Entry</span>
            </button>
            <button type="button" class="stock-list-btn" title="Adjust">
              <span class="material-symbols-outlined" style="font-size: 14px;">tune</span>
              <span>Adjust</span>
            </button>
            <button type="button" class="stock-list-btn" title="Ledger Details">
              <span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 5: CARD VIEW                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'card'" class="stock-card-grid">
        <div *ngFor="let item of sampleItems" class="stock-card-item">
          <div>
            <div class="stock-card-top">
              <span class="stock-card-sku-pill">{{ item.stock_code }}</span>
              <span class="stock-card-unit-pill">{{ item.unit_type }}</span>
            </div>

            <h4 class="stock-card-name">{{ item.name }}</h4>
            <p class="stock-card-sub">Alert Threshold: {{ item.min_stock_alert }} {{ item.unit_type }}s</p>

            <div class="stock-card-progress">
              <div class="stock-card-progress-header">
                <span class="stock-card-big-qty">{{ item.current_quantity }} <span style="font-size: 12px; font-weight: 500;">{{ item.unit_type }}</span></span>
                <span class="stock-card-health-label" [style.color]="getStatusColor(item.status)">
                  {{ item.status === 'healthy' ? 'Optimal Stock' : item.status === 'warning' ? 'Low Stock' : 'Out of Stock' }}
                </span>
              </div>
              <div class="stock-card-bar-bg">
                <div
                  class="stock-card-bar-fill"
                  [style.width.%]="calcPercent(item.current_quantity, item.min_stock_alert)"
                  [style.background]="getStatusColor(item.status)"
                ></div>
              </div>
            </div>

            <div class="stock-card-values">
              <div class="stock-card-vbox">
                <span class="stock-card-vbox-lbl">Valuation</span>
                <span class="stock-card-vbox-val">{{ formatCurrency(item.current_value) }}</span>
              </div>
              <div class="stock-card-vbox">
                <span class="stock-card-vbox-lbl">Unit Cost</span>
                <span class="stock-card-vbox-val" style="color: #0F172A;">{{ formatCurrency(item.average_unit_price) }}</span>
              </div>
            </div>
          </div>

          <div class="stock-card-footer">
            <button type="button" class="stock-card-btn btn-entry" title="Purchase Entry">
              <span class="material-symbols-outlined" style="font-size: 14px;">add_shopping_cart</span>
              <span>Purchase</span>
            </button>
            <button type="button" class="stock-card-btn" title="Adjust">
              <span class="material-symbols-outlined" style="font-size: 14px;">tune</span>
              <span>Adjust</span>
            </button>
            <button type="button" class="stock-card-btn" title="Audit">
              <span class="material-symbols-outlined" style="font-size: 14px;">history</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    STOCK_LAYOUT_CSS,
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class StockLayoutPreviewComponent {
  @Input() layoutKey: StockDesignKey = 'warehouse';
  @Input() cssVars: Record<string, string> = {};

  public sampleItems: PreviewStockItem[] = [
    {
      id: 1,
      stock_code: 'STK-CF-001',
      name: 'Arabica Espresso Beans',
      unit_type: 'kg',
      current_quantity: 45.5,
      min_stock_alert: 10,
      current_value: 682.5,
      average_unit_price: 15.0,
      status: 'healthy',
    },
    {
      id: 2,
      stock_code: 'STK-MK-002',
      name: 'Full Cream Fresh Milk',
      unit_type: 'L',
      current_quantity: 12.0,
      min_stock_alert: 25,
      current_value: 36.0,
      average_unit_price: 3.0,
      status: 'warning',
    },
    {
      id: 3,
      stock_code: 'STK-BN-003',
      name: 'Artisan Brioche Buns',
      unit_type: 'pcs',
      current_quantity: 120.0,
      min_stock_alert: 30,
      current_value: 96.0,
      average_unit_price: 0.8,
      status: 'healthy',
    },
    {
      id: 4,
      stock_code: 'STK-OL-004',
      name: 'Extra Virgin Olive Oil',
      unit_type: 'L',
      current_quantity: 0.0,
      min_stock_alert: 5,
      current_value: 0.0,
      average_unit_price: 18.5,
      status: 'critical',
    },
    {
      id: 5,
      stock_code: 'STK-FL-005',
      name: 'Sourdough Pizza Flour',
      unit_type: 'kg',
      current_quantity: 85.0,
      min_stock_alert: 20,
      current_value: 170.0,
      average_unit_price: 2.0,
      status: 'healthy',
    },
    {
      id: 6,
      stock_code: 'STK-SC-006',
      name: 'Organic Tomato Coulis',
      unit_type: 'kg',
      current_quantity: 8.5,
      min_stock_alert: 15,
      current_value: 42.5,
      average_unit_price: 5.0,
      status: 'warning',
    },
  ];

  calcPercent(current: number, min: number): number {
    if (current <= 0) return 4;
    const target = min > 0 ? min * 2.5 : 100;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  getStatusColor(status: 'healthy' | 'warning' | 'critical'): string {
    if (status === 'healthy') return 'var(--stock-healthy-color, #16A34A)';
    if (status === 'warning') return 'var(--stock-warning-color, #D97706)';
    return 'var(--stock-critical-color, #DC2626)';
  }

  formatCurrency(val: number): string {
    return '$' + val.toFixed(2);
  }
}

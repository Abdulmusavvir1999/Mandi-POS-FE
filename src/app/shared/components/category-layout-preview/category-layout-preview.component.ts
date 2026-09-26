import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryDesignKey } from '../../../core/services/category-layout.service';
import { CATEGORY_LAYOUT_CSS } from '../../styles/category-layout.styles';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

export interface PreviewCategoryItem {
  id: number;
  name: string;
  description: string;
  display_order: number;
  status: 'ACTIVE' | 'INACTIVE';
  product_count: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-category-layout-preview',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <div
      class="category-stage"
      [ngClass]="'category-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-label="Live Category Layout Preview"
    >
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 1: BENTO SHOWCASE                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'showcase'" class="cat-bento-grid">
        <div *ngFor="let item of sampleItems" class="cat-bento-card">
          <div class="cat-bento-header">
            <div class="cat-bento-icon" [style.background]="item.color + '18'" [style.color]="item.color">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </div>
            <div class="cat-bento-badges">
              <span class="cat-bento-dish-pill">
                <span class="material-symbols-outlined" style="font-size: 13px;">restaurant_menu</span>
                {{ item.product_count }} dishes
              </span>
              <span class="cat-bento-status" [class.is-draft]="item.status !== 'ACTIVE'">
                ● {{ item.status === 'ACTIVE' ? 'Active' : 'Draft' }}
              </span>
            </div>
          </div>

          <div class="cat-bento-body">
            <h4 class="cat-bento-title">{{ item.name }}</h4>
            <p class="cat-bento-desc">{{ item.description }}</p>
          </div>

          <div class="cat-bento-footer">
            <span class="cat-bento-order">Seq #{{ item.display_order }}</span>
            <div class="cat-bento-actions">
              <button type="button" class="cat-bento-btn" title="Edit Category">
                <span class="material-symbols-outlined" style="font-size: 15px;">edit</span>
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 2: MINIMALIST CLEAN TABLE                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'clean'" class="cat-clean-table-card">
        <table class="cat-clean-table">
          <thead>
            <tr>
              <th style="width: 50px;">Seq</th>
              <th style="width: 32%;">Category Details</th>
              <th style="width: 30%;">Catalog Summary</th>
              <th style="width: 15%;">Dishes</th>
              <th style="width: 13%;">Status</th>
              <th style="width: 70px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sampleItems" class="cat-clean-row">
              <td>
                <span class="cat-clean-id">#{{ item.display_order }}</span>
              </td>
              <td>
                <div class="cat-clean-name-cell">
                  <div class="cat-clean-thumb" [style.background]="item.color + '20'" [style.color]="item.color">
                    <span class="material-symbols-outlined">{{ item.icon }}</span>
                  </div>
                  <div>
                    <div class="cat-clean-title">{{ item.name }}</div>
                    <div class="cat-clean-id">CAT-00{{ item.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="cat-clean-desc">{{ item.description }}</span>
              </td>
              <td>
                <span class="cat-clean-metric">
                  <span class="material-symbols-outlined" style="font-size: 14px;">restaurant</span>
                  {{ item.product_count }} items
                </span>
              </td>
              <td>
                <span class="cat-clean-badge" [class.is-draft]="item.status !== 'ACTIVE'">
                  {{ item.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td style="text-align: right;">
                <button type="button" class="cat-clean-btn" title="Edit">
                  <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 3: COMPACT BADGE TILES                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'compact'" class="cat-compact-grid">
        <div *ngFor="let item of sampleItems" class="cat-compact-tile">
          <div class="cat-compact-header">
            <div class="cat-compact-icon" [style.background]="item.color + '22'" [style.color]="item.color">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </div>
            <span class="cat-compact-status" [class.is-draft]="item.status !== 'ACTIVE'">
              {{ item.status === 'ACTIVE' ? 'Live' : 'Draft' }}
            </span>
          </div>

          <div class="cat-compact-name">{{ item.name }}</div>

          <div class="cat-compact-footer">
            <span class="cat-compact-count">
              <span class="material-symbols-outlined" style="font-size: 13px;">dinner_dining</span>
              {{ item.product_count }} dishes
            </span>
            <div class="cat-compact-actions">
              <button type="button" class="cat-compact-btn" title="Edit">
                <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 4: LIST VIEW                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'list'" class="cat-list-container">
        <div *ngFor="let item of sampleItems" class="cat-list-row">
          <span class="cat-list-seq">{{ item.display_order }}</span>

          <div class="cat-list-thumb" [style.background]="item.color + '20'" [style.color]="item.color">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
          </div>

          <div class="cat-list-info">
            <div class="cat-list-name">{{ item.name }}</div>
            <div class="cat-list-desc">{{ item.description }}</div>
          </div>

          <div class="cat-list-count">
            <span class="material-symbols-outlined" style="font-size: 15px;">restaurant_menu</span>
            <span><strong>{{ item.product_count }}</strong> items linked</span>
          </div>

          <div>
            <span class="cat-list-status" [class.is-draft]="item.status !== 'ACTIVE'">
              {{ item.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="cat-list-actions">
            <button type="button" class="cat-list-btn" title="Edit Category">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            </button>
            <button type="button" class="cat-list-btn" title="Category Settings">
              <span class="material-symbols-outlined" style="font-size: 16px;">tune</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- DESIGN 5: CARD VIEW                                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div *ngIf="layoutKey === 'card'" class="cat-card-grid">
        <div *ngFor="let item of sampleItems" class="cat-card-item">
          <div class="cat-card-banner">
            <span class="cat-card-badge-top" [class.is-draft]="item.status !== 'ACTIVE'">
              {{ item.status === 'ACTIVE' ? 'Published' : 'Draft' }}
            </span>
            <div class="cat-card-avatar" [style.color]="item.color">
              <span class="material-symbols-outlined" style="font-size: 32px;">{{ item.icon }}</span>
            </div>
          </div>

          <div class="cat-card-content">
            <h4 class="cat-card-title">{{ item.name }}</h4>
            <p class="cat-card-desc">{{ item.description }}</p>

            <div class="cat-card-progress">
              <div class="cat-card-progress-bar">
                <div
                  class="cat-card-progress-fill"
                  [style.width.%]="item.product_count > 0 ? (item.product_count / 40) * 100 : 8"
                  [style.background]="item.color"
                ></div>
              </div>
              <span class="cat-card-progress-text">{{ item.product_count }} Menu Items</span>
            </div>
          </div>

          <div class="cat-card-footer">
            <span class="cat-card-seq-pill">Priority #{{ item.display_order }}</span>
            <div class="cat-card-actions">
              <button type="button" class="cat-card-btn" title="Edit">
                <span class="material-symbols-outlined" style="font-size: 14px;">edit</span>
                <span>Manage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    CATEGORY_LAYOUT_CSS,
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class CategoryLayoutPreviewComponent {
  @Input() layoutKey: CategoryDesignKey = 'showcase';
  @Input() cssVars: Record<string, string> = {};

  public sampleItems: PreviewCategoryItem[] = [
    {
      id: 1,
      name: 'Hot & Cold Beverages',
      description: 'Artisanal coffees, fresh iced teas, detox smoothies and juices.',
      display_order: 1,
      status: 'ACTIVE',
      product_count: 32,
      icon: 'local_cafe',
      color: 'var(--primary, #7E22CE)',
    },
    {
      id: 2,
      name: 'Artisan Pizzas',
      description: 'Stone-baked sourdough pizzas with authentic Italian toppings.',
      display_order: 2,
      status: 'ACTIVE',
      product_count: 18,
      icon: 'local_pizza',
      color: 'var(--warning, #D97706)',
    },
    {
      id: 3,
      name: 'Gourmet Burgers',
      description: 'Handcrafted brioche smash burgers served with seasoned fries.',
      display_order: 3,
      status: 'ACTIVE',
      product_count: 24,
      icon: 'lunch_dining',
      color: 'var(--danger, #DC2626)',
    },
    {
      id: 4,
      name: 'Fresh Farm Salads',
      description: 'Organic greens, Mediterranean bowls, and citrus dressings.',
      display_order: 4,
      status: 'ACTIVE',
      product_count: 12,
      icon: 'nutrition',
      color: 'var(--success, #16A34A)',
    },
    {
      id: 5,
      name: 'Desserts & Gelato',
      description: 'Belgian waffles, handcrafted gelato, and warm chocolate tortes.',
      display_order: 5,
      status: 'ACTIVE',
      product_count: 15,
      icon: 'icecream',
      color: '#EC4899',
    },
    {
      id: 6,
      name: 'Seasonal Artisan Soups',
      description: 'Winter bisque, wild mushroom chowder, and sourdough crumbles.',
      display_order: 6,
      status: 'INACTIVE',
      product_count: 6,
      icon: 'soup_kitchen',
      color: 'var(--text-muted, #4B5563)',
    },
  ];
}

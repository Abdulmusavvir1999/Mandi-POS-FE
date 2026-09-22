import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishLayoutKey } from '../../../core/services/dish-layout.service';
import { DISH_LAYOUT_CSS } from '../../styles/dish-layout.styles';

/** Stand-ins so the preview shows real cards, not empty shells. */
interface PreviewDish {
  name: string;
  glyph: string;
  price: string;
  desc: string;
  category: string;
  stock: string;
  portions: string;
  rating: string;
  sales: string;
}

/**
 * Full-size preview of a dish-page design.
 *
 * Renders the POS dish markup with sample dishes and imports the very same
 * stylesheet the POS grid uses, so what is shown here is what will ship. Only
 * the stage padding is local — the POS sizes its grid to the billing column,
 * which a modal cannot reproduce.
 */
@Component({
  selector: 'app-dish-layout-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="preview-stage"
      [ngClass]="'dish-layout-' + layoutKey"
      [ngStyle]="cssVars"
      aria-hidden="true"
    >
      <!-- Header strip. The stylesheet hides it in every design but the table. -->
      <div class="dish-table-head">
        <span></span>
        <span>Dish</span>
        <span>Category</span>
        <span>Stock</span>
        <span class="th-num">Price</span>
        <span></span>
      </div>

      <div class="dishes-cards-grid">
        <div class="dish-hero-card" *ngFor="let d of visibleDishes">
          <span class="dish-deco dish-deco-a"></span>
          <span class="dish-deco dish-deco-b"></span>
          <span class="dish-flag">New</span>

          <div class="dish-floating-avatar">
            <span class="food-emoji">{{ d.glyph }}</span>
          </div>

          <div class="dish-body">
            <h3 class="dish-title">{{ d.name }}</h3>
            <div class="dish-price-tag font-mono">{{ d.price }}</div>
            <p class="dish-desc">{{ d.desc }}</p>

            <div class="dish-specs">
              <div class="spec-row">
                <span class="spec-label">Category</span>
                <span class="spec-value">{{ d.category }}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">In Stock</span>
                <span class="spec-value">{{ d.stock }}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Portions</span>
                <span class="spec-value">{{ d.portions }}</span>
              </div>
            </div>

            <div class="dish-card-footer">
              <div class="star-rating">
                <span class="star-icon">★</span>
                <span class="rating-value">{{ d.rating }}</span>
              </div>
              <div class="sales-count-badge">{{ d.sales }} Total Sale</div>
            </div>

            <div class="dish-cta"><span>ADD TO CART</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Stage only. Everything inside is the shipped stylesheet's business. */
      .preview-stage {
        padding: 1.25rem;
        border-radius: 16px;
        background: var(--dl-bg-app);
        overflow: hidden;
      }

      .dishes-cards-grid {
        display: grid;
        grid-template-columns: repeat(var(--dl-columns, 4), minmax(0, 1fr));
        gap: 1rem;
      }

      .dish-hero-card { cursor: default; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    `,
    /* Must come last: it resets what the card designs set and then builds each
       layout back up. See the note at the top of dish-layout.styles.ts. */
    DISH_LAYOUT_CSS,
  ],
})
export class DishLayoutPreviewComponent {
  @Input() layoutKey: DishLayoutKey = 'showcase';
  @Input() cssVars: Record<string, string> = {};
  /** Columns, so the preview shows the density that will ship. */
  @Input() columnsPerRow = 4;

  /**
   * One tidy row. The table is a stack, so it shows four lines; the bento
   * spends two columns on its featured tile, so it shows one card fewer than
   * the column count and still fills the row exactly.
   */
  get visibleDishes(): PreviewDish[] {
    const cols = Math.max(2, Math.min(6, Math.round(this.columnsPerRow) || 4));
    let count: number;
    if (this.layoutKey === 'table') count = 4;
    else if (this.layoutKey === 'showcase') count = Math.max(2, cols - 1);
    else count = cols;

    const row: PreviewDish[] = [];
    for (let i = 0; i < count; i++) row.push(this.dishes[i % this.dishes.length]);
    return row;
  }

  public readonly dishes: PreviewDish[] = [
    {
      name: 'Mutton  Full',
      glyph: '🍖',
      price: '450',
      desc: 'Slow-cooked succulent tender lamb over fragrant basmati rice.',
      category: 'Mutton ',
      stock: '24',
      portions: '2',
      rating: '4.8',
      sales: '412',
    },
    {
      name: 'Chicken  Half',
      glyph: '🍗',
      price: '260',
      desc: 'Traditional spiced roast chicken with saffron rice and sauce.',
      category: 'Chicken ',
      stock: '38',
      portions: '2',
      rating: '4.6',
      sales: '287',
    },
    {
      name: 'Kabsa Platter',
      glyph: '🍛',
      price: '380',
      desc: 'Spiced rice platter served with grilled meat and house sauce.',
      category: 'Platters',
      stock: '16',
      portions: '3',
      rating: '4.7',
      sales: '198',
    },
    {
      name: 'Mint Lemonade',
      glyph: '🥤',
      price: '90',
      desc: 'Fresh lime blended with mint leaves, served chilled over ice.',
      category: 'Beverages',
      stock: '64',
      portions: '1',
      rating: '4.5',
      sales: '531',
    },
  ];
}

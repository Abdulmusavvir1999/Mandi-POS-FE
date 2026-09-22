import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosDesignKey, PosDesignTokens } from '../../../core/services/pos-design.service';
import { POS_DESIGN_CSS } from '../../styles/pos-design.styles';

/** Stand-ins so the preview shows a real card, not an empty shell. */
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
 * Full-size preview of a POS dish-card design.
 *
 * Renders the POS card markup with two dummy dishes and imports the very same
 * design stylesheet the POS grid uses, so what is shown here is what will ship.
 * Only the card geometry is defined locally — the POS sizes its cards to its
 * own grid, which a modal cannot reproduce.
 */
@Component({
  selector: 'app-pos-design-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="preview-stage"
      [ngClass]="'pos-design-' + designKey"
      [ngStyle]="cssVars"
      aria-hidden="true"
    >
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
      /* Card geometry for the preview only. The POS derives its own from the
         billing grid, which a modal cannot reproduce faithfully. */
      .preview-stage {
        padding: 1.5rem;
        border-radius: 16px;
        background: var(--pos-bg-app);
      }

      /* One full row at the configured density. A minimum column width keeps
         the cards legible at 7 or 8 per row; the row scrolls inside the modal
         rather than shrinking the cards into illegibility. */
      .preview-stage { overflow-x: auto; }

      .preview-stage .dishes-cards-grid {
        display: grid;
        grid-template-columns: repeat(var(--pos-cards-per-row, 4), minmax(190px, 1fr));
        gap: 1.25rem;
      }

      .dish-hero-card { cursor: default; }

      /* Geometry only — the shared design sheet sizes the media area itself. */
      .dish-floating-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dish-title { font-size: 0.9375rem; font-weight: 800; line-height: 1.3; }
      .dish-price-tag { font-size: 1.125rem; font-weight: 900; line-height: 1.4; }

      .dish-card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 0.6rem;
        font-size: 0.625rem;
        font-weight: 700;
      }

      .star-rating { display: inline-flex; align-items: center; gap: 0.2rem; }
      .star-icon { font-size: 0.8125rem; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    `,
    POS_DESIGN_CSS,
  ],
})
export class PosDesignPreviewComponent {
  @Input() designKey: PosDesignKey = 'neon';
  @Input() cssVars: Record<string, string> = {};
  /** Cards per row, so the preview shows the density that will ship. */
  @Input() cardsPerRow = 4;

  /** Exactly one row, cycling the pool so the accent rotation is visible. */
  get visibleDishes(): PreviewDish[] {
    const count = Math.max(2, Math.min(8, Math.round(this.cardsPerRow) || 4));
    const row: PreviewDish[] = [];
    for (let i = 0; i < count; i++) row.push(this.dishes[i % this.dishes.length]);
    return row;
  }

  /** Two dishes is enough to show the accent rotation without crowding. */
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
      name: 'Madfoon Special',
      glyph: '🍲',
      price: '520',
      desc: 'Clay-oven baked lamb served over spiced rice with raisins.',
      category: 'Madfoon',
      stock: '12',
      portions: '3',
      rating: '4.9',
      sales: '196',
    },
    {
      name: 'Mint Lemonade',
      glyph: '🥤',
      price: '90',
      desc: 'Fresh lime, crushed mint and a touch of rock salt, served cold.',
      category: 'Beverages',
      stock: '64',
      portions: 'Single',
      rating: '4.5',
      sales: '531',
    },
  ];
}

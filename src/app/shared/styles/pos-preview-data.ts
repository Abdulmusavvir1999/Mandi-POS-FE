import { Category, Product } from '../../core/models';

/**
 * Sample menu for the POS preview.
 *
 * The preview renders the real POS component, which needs a menu to lay out.
 * Serving it from here rather than the API keeps the preview from firing extra
 * requests and makes it deterministic — the same dishes every time, so a colour
 * change is the only thing that appears to move.
 */

export const PREVIEW_CATEGORIES: Category[] = [
  { id: 1, name: 'Mutton ', description: 'Slow-cooked lamb', display_order: 1, status: 'ACTIVE' },
  { id: 2, name: 'Chicken ', description: 'Spiced roast chicken', display_order: 2, status: 'ACTIVE' },
  { id: 3, name: 'Madfoon', description: 'Clay-oven baked', display_order: 3, status: 'ACTIVE' },
  { id: 4, name: 'Beverages', description: 'Chilled drinks', display_order: 4, status: 'ACTIVE' },
  { id: 5, name: 'Desserts', description: 'Sweet finishes', display_order: 5, status: 'ACTIVE' },
];

const dish = (
  id: number,
  category_id: number,
  name: string,
  selling_price: number,
  description: string,
  current_stock = 24
): Product => ({
  id,
  category_id,
  category_name: PREVIEW_CATEGORIES.find((c) => c.id === category_id)?.name,
  name,
  sku: `PRV-${String(id).padStart(3, '0')}`,
  description,
  cost_price: Math.round(selling_price * 0.55),
  selling_price,
  tax_rate: 5,
  stock_quantity: current_stock,
  current_stock,
  low_stock_threshold: 5,
  is_available: 1,
  status: 'ACTIVE',
  linked_unit_type: 'plate',
  linked_stock_quantity: current_stock,
});

export const PREVIEW_PRODUCTS: Product[] = [
  dish(1, 1, 'Mutton  Full', 450, 'Slow-cooked succulent tender lamb over fragrant basmati rice.', 24),
  dish(2, 2, 'Chicken  Half', 260, 'Traditional spiced roast chicken with saffron rice and sauce.', 38),
  dish(3, 3, 'Madfoon Special', 520, 'Clay-oven baked lamb served over spiced rice with raisins.', 12),
  dish(4, 4, 'Mint Lemonade', 90, 'Fresh lime, crushed mint and a touch of rock salt, served cold.', 64),
  dish(5, 1, 'Mutton  Half', 260, 'Half portion of the slow-cooked lamb over basmati rice.', 30),
  dish(6, 2, 'Chicken Madhbi', 310, 'Charcoal-grilled chicken with smoky rice and tomato chutney.', 18),
  dish(7, 5, 'Kunafa Cheese', 180, 'Crisp shredded pastry with sweet cheese and sugar syrup.', 22),
  dish(8, 4, 'Karak Chai', 45, 'Strong spiced tea brewed with evaporated milk.', 80),
];

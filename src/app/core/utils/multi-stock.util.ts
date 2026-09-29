import { Product, ProductVariant } from '../models';

/**
 * Multi Stock availability, shared by the POS, the Dishes list and the dish
 * View page so all three agree.
 *
 * A Multi Stock dish has no single linked stock item (products.stock_id is
 * empty) - each portion takes several items at once - so the usual
 * "linked item balance" reads as nothing and would mark the dish sold out.
 */

export function isMultiStock(product: Product | null | undefined): boolean {
  return product?.variant_stock_mode === 'MULTI';
}

/**
 * How many of this portion the current balances can make: the scarcest item
 * on its list decides. A portion with no list can make none.
 */
export function portionsAvailable(variant: ProductVariant | null | undefined): number {
  const lines = (variant?.stocks || []).filter((s) => Number(s.stock_consumption) > 0);
  if (lines.length === 0) return 0;
  return Math.max(0, Math.min(
    ...lines.map((s) => Math.floor((Number(s.current_quantity) || 0) / Number(s.stock_consumption)))
  ));
}

/** The most of any one active portion that can be made - 0 means sold out. */
export function dishPortionsAvailable(product: Product | null | undefined): number {
  const variants = (product?.variants || []).filter((v) => v.status !== 'INACTIVE');
  if (variants.length === 0) return 0;
  return Math.max(...variants.map(portionsAvailable));
}

/** The item on a portion's list that runs out first - what to restock. */
export function limitingStock(variant: ProductVariant | null | undefined) {
  const lines = (variant?.stocks || []).filter((s) => Number(s.stock_consumption) > 0);
  if (lines.length === 0) return null;
  return lines.reduce((low, s) =>
    (Number(s.current_quantity) || 0) / Number(s.stock_consumption) < (Number(low.current_quantity) || 0) / Number(low.stock_consumption) ? s : low
  );
}

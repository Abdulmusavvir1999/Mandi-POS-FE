import { Product, ProductVariant } from '../models';

/**
 * One rule for "how many more of this can be sold", shared by the POS cart
 * (walk-in, takeaway, pickup and dining orders) and the booking dish picker.
 * It is the checkout's own rule, done on the screen so limits update as you
 * type: every line that draws on the same stock item is added up, and a line
 * may take only what the others leave. The server applies the same rule on
 * the live check (POST /checkout/stock-check) and again, with the rows
 * locked, when the order is paid.
 */

/** What one unit of a dish (portion) takes from one stock item. */
export interface StockUse {
  stockId: number;
  perUnit: number;
}

function defaultVariant(product: Product): ProductVariant | null {
  const list = (product.variants || []).filter((v) => v.status !== 'INACTIVE');
  return list.find((v) => Number(v.is_default) === 1) || list[0] || null;
}

/**
 * What one unit of this dish takes from stock. A portion draws on its rows in
 * product_variant_stocks; a dish sold without portions draws its own linked
 * item, 1 per sale. Null when it draws on nothing (no limit).
 */
export function stockUseOf(product: Product | null | undefined, variant?: ProductVariant | null): StockUse[] | null {
  if (!product) return null;
  const v = variant ?? defaultVariant(product);
  const rows = (v?.stocks || []).filter((s) => Number(s.stock_consumption) > 0);
  if (rows.length) return rows.map((s) => ({ stockId: Number(s.stock_id), perUnit: Number(s.stock_consumption) }));
  if (!v && product.stock_id) return [{ stockId: Number(product.stock_id), perUnit: 1 }];
  return null;
}

/** Stock balances as the loaded dishes carry them (a snapshot from when they were loaded). */
export function snapshotBalances(products: Array<Product | null | undefined>): Map<number, number> {
  const map = new Map<number, number>();
  for (const p of products) {
    if (!p) continue;
    for (const v of p.variants || []) {
      for (const s of v.stocks || []) {
        if (s.current_quantity !== undefined && s.current_quantity !== null) map.set(Number(s.stock_id), Number(s.current_quantity) || 0);
      }
    }
    if (p.stock_id && p.linked_stock_quantity !== undefined && p.linked_stock_quantity !== null && !map.has(Number(p.stock_id))) {
      map.set(Number(p.stock_id), Number(p.linked_stock_quantity) || 0);
    }
  }
  return map;
}

/** Stock the given lines take, per stock item. */
export function stockUsed(lines: Array<{ use: StockUse[] | null; quantity: number }>): Map<number, number> {
  const used = new Map<number, number>();
  for (const l of lines) {
    for (const u of l.use || []) used.set(u.stockId, (used.get(u.stockId) ?? 0) + u.perUnit * (Number(l.quantity) || 0));
  }
  return used;
}

/**
 * The most units of `use` that fit once `used` is taken - the scarcest stock
 * item decides. Null means no limit (draws on nothing, or no balance known).
 */
export function maxUnits(use: StockUse[] | null, balances: Map<number, number>, used: Map<number, number>): number | null {
  if (!use || use.length === 0) return null;
  let max = Infinity;
  for (const u of use) {
    const balance = balances.get(u.stockId);
    if (balance === undefined || !(u.perUnit > 0)) continue;
    const free = balance - (used.get(u.stockId) ?? 0);
    max = Math.min(max, Math.floor((free + 1e-9) / u.perUnit));
  }
  return Number.isFinite(max) ? Math.max(0, max) : null;
}

/** The message for a line held back by stock. */
export function stockLimitMessage(label: string, max: number): string {
  return max <= 0 ? `"${label}" is out of stock` : `Only ${max} of "${label}" can be made from current stock`;
}

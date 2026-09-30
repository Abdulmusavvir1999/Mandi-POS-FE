import { Injectable, signal, computed, inject } from '@angular/core';
import {
  CartItem,
  Product,
  ProductVariant,
  Customer,
  DiningTable,
  OrderType,
  ProductAddon,
  normalizeOrderType,
} from '../models';
import { SettingsService } from './settings.service';
import { NotificationService } from './notification.service';
import { maxUnits, snapshotBalances, stockLimitMessage, stockUseOf, stockUsed } from '../utils/stock-limit.util';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private settingsService = inject(SettingsService);
  private notify = inject(NotificationService);

  // ─── Live stock limit ───
  /** Fresh balances from the live stock check; they win over the dishes' loaded snapshot. */
  private freshBalances = new Map<number, number>();
  private stockBlocked = false;

  /** Latest balances from POST /checkout/stock-check. */
  public setStockBalances(stocks: { stock_id: number; available: number }[]): void {
    for (const s of stocks) this.freshBalances.set(Number(s.stock_id), Number(s.available) || 0);
  }

  /**
   * Live stock for the cart: each stock item its dish lines draw on, what is
   * in stock, what every line takes, and what is left - e.g. Chicken 66 -
   * Full x 1 (4) - Half x 1 (2) = 60. Sent tab rounds count too (nothing on
   * a tab has left stock yet). Combo and add-on lines are checked by the
   * server and are not listed.
   */
  public stockBreakdown(): {
    stockId: number; name: string; unit: string; total: number;
    uses: { dish: string; portion: string | null; qty: number; sent: boolean; amount: number }[]; left: number;
  }[] {
    const lines = this.itemsSignal().filter((i) => (i.itemType || 'PRODUCT') === 'PRODUCT');
    const balances = snapshotBalances(lines.map((i) => i.product));
    for (const [id, qty] of this.freshBalances) balances.set(id, qty);
    const rows = new Map<number, {
      stockId: number; name: string; unit: string; total: number;
      uses: { dish: string; portion: string | null; qty: number; sent: boolean; amount: number }[]; left: number;
    }>();
    for (const i of lines) {
      const use = stockUseOf(i.product, i.variant);
      if (!use) continue;
      for (const u of use) {
        let row = rows.get(u.stockId);
        if (!row) {
          const info = (i.variant?.stocks || []).find((s) => Number(s.stock_id) === u.stockId);
          const total = balances.get(u.stockId) ?? 0;
          row = {
            stockId: u.stockId,
            name: info?.stock_name || (i.product.stock_id === u.stockId ? i.product.name : 'Stock #' + u.stockId),
            unit: info?.unit_type || i.product.linked_unit_type || '',
            total,
            uses: [],
            left: total,
          };
          rows.set(u.stockId, row);
        }
        const amount = u.perUnit * i.quantity;
        row.uses.push({
          dish: i.product.name,
          portion: i.variant && (i.product.variants || []).length > 1 ? i.variant.name : null,
          qty: i.quantity,
          sent: !!i.sentToKitchen,
          amount,
        });
        row.left -= amount;
      }
    }
    return [...rows.values()].sort((a, b) => a.left - b.left);
  }

  /** True once after a line was held back by stock (the guard already told the user). */
  public consumeStockBlock(): boolean {
    const was = this.stockBlocked;
    this.stockBlocked = false;
    return was;
  }

  /**
   * Can this dish line reach `targetQty`? Every other line drawing on the
   * same stock items (other portions, dishes; sent tab rounds too - nothing on
   * a tab has left stock yet) takes its share first. Combo and add-on lines are
   * checked by the server. Warns and returns false when it would not fit.
   */
  private fitsStock(product: Product, variant: ProductVariant | null | undefined, targetQty: number, lineId?: string): boolean {
    const use = stockUseOf(product, variant);
    if (!use) return true;
    const others = this.itemsSignal().filter((i) => i.lineId !== lineId && (i.itemType || 'PRODUCT') === 'PRODUCT');
    const used = stockUsed(others.map((i) => ({ use: stockUseOf(i.product, i.variant), quantity: i.quantity })));
    const balances = snapshotBalances([product, ...others.map((i) => i.product)]);
    for (const [id, qty] of this.freshBalances) balances.set(id, qty);
    const max = maxUnits(use, balances, used);
    if (max === null || targetQty <= max) return true;
    this.stockBlocked = true;
    this.notify.warning(stockLimitMessage(variant ? product.name + ' (' + variant.name + ')' : product.name, max));
    return false;
  }
  private itemsSignal = signal<CartItem[]>([]);
  public items = this.itemsSignal.asReadonly();

  public orderType = signal<OrderType>('TAKEAWAY');
  public selectedCustomer = signal<Customer | null>(null);
  public selectedTable = signal<DiningTable | null>(null);

  public discountType = signal<'FIXED' | 'PERCENTAGE'>('FIXED');
  public discountValue = signal<number>(0);
  public serviceChargeRate = signal<number>(0); // e.g. 5, 10 (%)
  public surchargeAmount = signal<number>(0); // Packaging / Late night / Delivery fee
  public couponCode = signal<string>('');
  public couponDiscount = signal<number>(0);

  public orderNotes = signal<string>('');

  /**
   * The selected table's unbilled order, when it has one. Its lines sit in
   * the cart marked sentToKitchen; everything else is still to be sent.
   */
  public openTab = signal<{ orderId: number; orderNumber: string; rounds: number; tableId: number } | null>(null);

  /**
   * Set when the POS was opened from a pickup booking's "Collect & bill":
   * checkout sends its id, and paying marks that pickup as picked up.
   */
  public bookingRef = signal<{ reservationId: number; code: string; customerName: string } | null>(null);

  /**
   * Name and phone from the booking this cart came from. The payment dialog
   * starts with them (phone checked against Customers), so staff can link or
   * save the customer when they actually buy. Nothing is saved from a booking.
   */
  public prefillCustomer = signal<{ name: string; phone: string } | null>(null);

  /** Lines not yet sent to the kitchen - what Send to Kitchen sends. */
  public pendingItems = computed(() => this.itemsSignal().filter((i) => !i.sentToKitchen));
  public sentItems = computed(() => this.itemsSignal().filter((i) => i.sentToKitchen));
  public taxRate = signal<number>(0);
  public isTaxEnabled = signal<boolean>(true);
  /**
   * True when the menu price already contains the tax.
   *
   * Under this rule nothing is added at the till: the guest pays the price on
   * the card, and the tax line reports the part of it that is tax. The server
   * recomputes the bill under the same rule, so the two totals match — they
   * have to, or checkout is rejected for underpayment.
   */
  public isTaxInclusive = signal<boolean>(false);

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: (settings) => {
        const rawRate = settings['TAX_PERCENTAGE'] ?? settings['tax_rate_percentage'];
        const rate = Number(rawRate);
        if (rawRate !== undefined && rawRate !== '' && !Number.isNaN(rate)) {
          this.taxRate.set(rate);
        }
        if (settings['TAX_ENABLED'] !== undefined) {
          this.isTaxEnabled.set(settings['TAX_ENABLED'] === 'true');
        }
        if (settings['TAX_INCLUSIVE'] !== undefined) {
          this.isTaxInclusive.set(settings['TAX_INCLUSIVE'] === 'true');
        }
      },
      error: () => {},
    });
  }

  // Computations
  public itemCount = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0)
  );

  public subtotal = computed(() =>
    this.itemsSignal().reduce((acc, item) => {
      const price = item.isComplimentary ? 0 : item.unitPrice;
      return acc + item.quantity * price;
    }, 0)
  );

  public discountAmount = computed(() => {
    const sub = this.subtotal();
    const val = this.discountValue();
    if (val <= 0 || sub <= 0) return 0;
    if (this.discountType() === 'PERCENTAGE') {
      return Math.round(((sub * Math.min(val, 100)) / 100) * 100) / 100;
    }
    return Math.min(val, sub);
  });

  public taxableAmount = computed(() => {
    const totalDiscounts = this.discountAmount() + this.couponDiscount();
    return Math.max(0, this.subtotal() - totalDiscounts);
  });

  /**
   * The tax on the bill — added on top, or extracted from what is already
   * there.
   *
   * EXCLUSIVE: the taxable amount is net, so the tax is a percentage of it.
   * INCLUSIVE: the taxable amount already contains the tax, so the tax is the
   * part above the net value, i.e. amount - amount / (1 + rate).
   */
  public taxAmount = computed(() => {
    const rate = this.taxRate();
    const amount = this.taxableAmount();
    if (!this.isTaxEnabled() || rate <= 0 || amount <= 0) return 0;
    if (this.isTaxInclusive()) {
      const net = amount / (1 + rate / 100);
      return Math.round((amount - net) * 100) / 100;
    }
    return Math.round(((amount * rate) / 100) * 100) / 100;
  });

  /**
   * The taxable amount with its tax taken out — what the line items are worth
   * before tax. Equal to the taxable amount under EXCLUSIVE, where the price
   * was already net.
   */
  public netAmount = computed(() =>
    Math.round((this.taxableAmount() - (this.isTaxInclusive() ? this.taxAmount() : 0)) * 100) / 100
  );

  public serviceChargeAmount = computed(() => {
    const rate = this.serviceChargeRate();
    if (rate <= 0) return 0;
    return Math.round(((this.taxableAmount() * rate) / 100) * 100) / 100;
  });

  public grandTotal = computed(() => {
    // Under INCLUSIVE the tax is already inside the taxable amount; adding it
    // again would charge the guest the tax twice.
    const taxed = this.taxableAmount() + (this.isTaxInclusive() ? 0 : this.taxAmount());
    const total = taxed + this.serviceChargeAmount() + this.surchargeAmount();
    return Math.round(Math.max(0, total) * 100) / 100;
  });

  public static lineKey(productId: number, variantId?: number | null): string {
    return `${productId}:${variantId ?? 'base'}`;
  }

  public addItem(product: Product, variant?: ProductVariant | null, quantity = 1, notes?: string): boolean {
    if (product.status !== 'ACTIVE') {
      return false;
    }

    const unitPrice = variant ? Number(variant.selling_price) : Number(product.selling_price);
    const lineId = CartService.lineKey(product.id, variant?.id ?? null);

    const currentItems = [...this.itemsSignal()];
    // A sent line is closed: another portion of the same dish is a new line.
    const index = currentItems.findIndex((i) => i.lineId === lineId && !i.sentToKitchen);
    const target = (index >= 0 ? currentItems[index].quantity : 0) + quantity;
    if (!this.fitsStock(product, variant, target, index >= 0 ? currentItems[index].lineId : undefined)) return false;

    if (index >= 0) {
      const existing = currentItems[index];
      const newQty = existing.quantity + quantity;
      currentItems[index] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * (existing.isComplimentary ? 0 : existing.unitPrice),
        notes: notes !== undefined ? notes : existing.notes,
      };
    } else {
      currentItems.push({
        lineId,
        product,
        variant: variant ?? null,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
        notes,
        isComplimentary: false,
      });
    }

    this.itemsSignal.set(currentItems);
    this.playChime();
    return true;
  }

  public addItemWithCustomization(
    product: Product,
    variant?: ProductVariant | null,
    quantity = 1,
    notes?: string,
    selectedAddons?: ProductAddon[],
    itemType: 'PRODUCT' | 'COMBO' | 'ADDON' = 'PRODUCT',
    comboDealId?: number,
    addonId?: number
  ): boolean {
    if (product.status !== 'ACTIVE' && itemType === 'PRODUCT') {
      return false;
    }

    const basePrice = variant ? Number(variant.selling_price) : Number(product.selling_price);
    const addonsCost = (selectedAddons || []).reduce((acc, a) => {
      if (a.is_free === 'Free') return acc;
      const charge = a.amount !== undefined && a.amount !== null ? Number(a.amount) : Number(a.price || 0);
      return acc + charge;
    }, 0);
    const unitPrice = basePrice + addonsCost;

    const addonIds = (selectedAddons || []).map((a) => a.id).sort((a, b) => a - b);
    const lineId = `${itemType}:${product.id}:${variant?.id ?? 'base'}:${addonIds.join('-') || 'none'}${comboDealId ? ':' + comboDealId : ''}${addonId ? ':a' + addonId : ''}`;

    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId && !i.sentToKitchen);
    if (itemType === 'PRODUCT') {
      const target = (index >= 0 ? currentItems[index].quantity : 0) + quantity;
      if (!this.fitsStock(product, variant, target, index >= 0 ? currentItems[index].lineId : undefined)) return false;
    }

    if (index >= 0) {
      const existing = currentItems[index];
      const newQty = existing.quantity + quantity;
      currentItems[index] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * (existing.isComplimentary ? 0 : existing.unitPrice),
        notes: notes !== undefined ? notes : existing.notes,
      };
    } else {
      currentItems.push({
        lineId,
        product,
        variant: variant ?? null,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
        notes,
        isComplimentary: false,
        itemType,
        comboId: itemType === 'COMBO' ? comboDealId : undefined,
        addonId: itemType === 'ADDON' ? addonId : undefined,
        selectedAddons: selectedAddons ? [...selectedAddons] : [],
      });
    }

    this.itemsSignal.set(currentItems);
    this.playChime();
    return true;
  }

  public setComplimentary(lineId: string, isComplimentary: boolean, reason?: string): void {
    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId && !i.sentToKitchen);
    if (index >= 0) {
      const item = currentItems[index];
      currentItems[index] = {
        ...item,
        isComplimentary,
        complimentaryReason: isComplimentary ? (reason || 'Staff Authorized Complimentary') : undefined,
        subtotal: isComplimentary ? 0 : item.quantity * item.unitPrice,
      };
      this.itemsSignal.set(currentItems);
    }
  }

  public setItemNotes(lineId: string, notes: string): void {
    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId && !i.sentToKitchen);
    if (index >= 0) {
      currentItems[index] = {
        ...currentItems[index],
        notes,
      };
      this.itemsSignal.set(currentItems);
    }
  }

  public updateQuantity(lineId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(lineId);
      return;
    }

    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId && !i.sentToKitchen);

    if (index >= 0) {
      const item = currentItems[index];
      if (quantity > item.quantity && (item.itemType || 'PRODUCT') === 'PRODUCT'
        && !this.fitsStock(item.product, item.variant, quantity, item.lineId)) {
        return;
      }
      currentItems[index] = {
        ...item,
        quantity,
        subtotal: quantity * (item.isComplimentary ? 0 : item.unitPrice),
      };
      this.itemsSignal.set(currentItems);
    }
  }

  public increment(lineId: string): void {
    const item = this.itemsSignal().find((i) => i.lineId === lineId);
    if (item) {
      this.updateQuantity(lineId, item.quantity + 1);
    }
  }

  public decrement(lineId: string): void {
    const item = this.itemsSignal().find((i) => i.lineId === lineId);
    if (item) {
      this.updateQuantity(lineId, item.quantity - 1);
    }
  }

  public removeItem(lineId: string): void {
    // Sent lines leave only through the tab (DiningService.removeTabLine).
    this.itemsSignal.update((list) => list.filter((i) => i.lineId !== lineId || i.sentToKitchen));
  }

  /**
   * Puts a table's open tab into the cart: its sent lines replace any sent
   * lines already there, and lines not yet sent are kept. Pass null to drop
   * the tab (another table, takeaway, or the tab was billed/cancelled).
   */
  public loadTab(
    tab: { orderId: number; orderNumber: string; rounds: number; tableId: number } | null,
    lines: CartItem[] = []
  ): void {
    this.openTab.set(tab);
    const pending = this.itemsSignal().filter((i) => !i.sentToKitchen);
    this.itemsSignal.set(tab ? [...lines, ...pending] : pending);
  }

  public applyCoupon(code: string, discount?: number): boolean {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      this.couponCode.set('');
      this.couponDiscount.set(0);
      return false;
    }

    if (discount !== undefined && discount >= 0) {
      this.couponCode.set(trimmed);
      this.couponDiscount.set(discount);
      return true;
    }

    // Default promotion code rules
    let disc = 0;
    const sub = this.subtotal();
    if (trimmed === 'SAVE50') {
      disc = 50;
    } else if (trimmed === 'FLAT100') {
      disc = 100;
    } else if (trimmed === 'WELCOME10') {
      disc = Math.round(sub * 0.1);
    } else if (trimmed === 'FESTIVE20') {
      disc = Math.round(sub * 0.2);
    } else {
      return false;
    }

    this.couponCode.set(trimmed);
    this.couponDiscount.set(disc);
    return true;
  }

  public removeCoupon(): void {
    this.couponCode.set('');
    this.couponDiscount.set(0);
  }

  public setServiceChargeRate(rate: number): void {
    this.serviceChargeRate.set(Math.max(0, rate));
  }

  public setSurcharge(amount: number): void {
    this.surchargeAmount.set(Math.max(0, amount));
  }

  /**
   * The POS menu link was clicked. Arriving from another page, the POS clears
   * the cart itself on load; already on the POS the router ignores a same-URL
   * link, so the click clears it here. Either way a menu click is a new ticket.
   */
  public onPosMenuClick(currentUrl: string): void {
    const path = (currentUrl || '').split('?')[0].split('#')[0];
    if (path === '/pos') this.clearCart();
  }

  public clearCart(): void {
    this.itemsSignal.set([]);
    this.discountValue.set(0);
    this.discountType.set('FIXED');
    this.serviceChargeRate.set(0);
    this.surchargeAmount.set(0);
    this.couponCode.set('');
    this.couponDiscount.set(0);
    this.orderNotes.set('');
    this.selectedCustomer.set(null);
    this.selectedTable.set(null);
    this.openTab.set(null);
    this.bookingRef.set(null);
    this.prefillCustomer.set(null);
    this.orderType.set('TAKEAWAY');
  }

  /**
   * A saved combo or add-on line has no dish behind it. It is rebuilt with the
   * stand-in product the POS uses when adding one (ids offset to 90000 for
   * combos, 70000 for add-ons), so it prices and checks out as it did.
   */
  private static savedLineKind(item: any): { itemType: 'PRODUCT' | 'COMBO' | 'ADDON'; comboId?: number; addonId?: number } {
    const type = String(item.itemType || item.item_type || 'PRODUCT').toUpperCase();
    const comboId = Number(item.comboId || item.combo_id) || undefined;
    const addonId = Number(item.addonId || item.addon_id) || undefined;
    if (type === 'COMBO' && comboId) return { itemType: 'COMBO', comboId };
    if (type === 'ADDON' && addonId) return { itemType: 'ADDON', addonId };
    return { itemType: 'PRODUCT' };
  }

  private static standInFor(kind: { itemType: string; comboId?: number; addonId?: number }, name: string, price: number): Product {
    const id = kind.itemType === 'COMBO' ? 90000 + (kind.comboId as number) : 70000 + (kind.addonId as number);
    return {
      id,
      name,
      selling_price: price,
      cost_price: 0,
      category_id: 0,
      category_name: kind.itemType === 'COMBO' ? 'Combo Meals' : 'Add-ons',
      status: 'ACTIVE',
      sku: kind.itemType === 'COMBO' ? `COMBO-${kind.comboId}` : `ADDON-${kind.addonId}`,
      tax_rate: 0,
      stock_quantity: 999,
      current_stock: 999,
    } as Product;
  }

  public restoreFromDraft(draft: any, allProducts: Product[]): void {
    this.clearCart();
    this.orderType.set(normalizeOrderType(draft.order_type));
    this.discountType.set(draft.discount_type || 'FIXED');
    this.discountValue.set(draft.discount_value || 0);
    this.orderNotes.set(draft.notes || '');

    if (draft.customer_id) {
      this.selectedCustomer.set({
        id: draft.customer_id,
        name: draft.customer_name || '',
        phone: draft.customer_phone || '',
        status: 'ACTIVE',
        total_visits: 0,
        total_spent: 0,
      });
    }

    if (draft.dining_table_id) {
      this.selectedTable.set({
        id: draft.dining_table_id,
        table_number: draft.table_number || '',
        name: draft.table_name || '',
        section: '',
        capacity: 4,
        status: 'OCCUPIED',
        display_order: 0,
      });
    }

    if (draft.items && Array.isArray(draft.items)) {
      const cartItems: CartItem[] = [];
      for (const item of draft.items) {
        const kind = CartService.savedLineKind(item);
        if (kind.itemType !== 'PRODUCT') {
          const price = Number(item.unit_price) || 0;
          cartItems.push({
            lineId: `${kind.itemType}:${kind.comboId ?? kind.addonId}`,
            product: CartService.standInFor(kind, item.product_name, price),
            variant: null,
            quantity: item.quantity,
            unitPrice: price,
            subtotal: item.quantity * price,
            notes: item.notes,
            isComplimentary: false,
            ...kind,
          });
          continue;
        }
        const prod = allProducts.find((p) => p.id === item.product_id) || {
          id: item.product_id,
          name: item.product_name,
          selling_price: item.unit_price,
          category_id: 1,
          sku: item.sku || '',
          cost_price: 0,
          tax_rate: 5,
          stock_quantity: item.current_stock || 10,
          current_stock: item.current_stock || 10,
          is_available: 1,
          status: 'ACTIVE',
        };

        const isComp = Boolean(item.is_complimentary);
        cartItems.push({
          lineId: CartService.lineKey(prod.id, item.variant_id ?? null),
          product: prod,
          variant: item.variant_id
            ? {
                id: item.variant_id,
                name: item.variant_name || '',
                selling_price: item.unit_price,
              }
            : null,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.quantity * (isComp ? 0 : item.unit_price),
          notes: item.notes,
          isComplimentary: isComp,
          complimentaryReason: item.complimentary_reason,
        });
      }
      this.itemsSignal.set(cartItems);
    }
  }

  public loadFromBill(bill: any, allProducts: Product[]): void {
    this.clearCart();
    this.orderType.set(normalizeOrderType(bill.orderType ?? bill.order_type));
    this.discountType.set(bill.discountType || bill.discount_type || 'FIXED');
    this.discountValue.set(bill.discountValue || bill.discount_value || 0);
    this.orderNotes.set(bill.notes || '');

    if (bill.serviceChargeAmount || bill.service_charge_amount) {
      this.setSurcharge(Number(bill.serviceChargeAmount || bill.service_charge_amount));
    }
    if (bill.couponCode || bill.coupon_code) {
      this.applyCoupon(bill.couponCode || bill.coupon_code, Number(bill.couponDiscount || bill.coupon_discount || 0));
    }

    if (bill.customerId || bill.customer_id) {
      this.selectedCustomer.set({
        id: bill.customerId || bill.customer_id,
        name: bill.customerName || bill.customer_name || '',
        phone: bill.customerPhone || bill.customer_phone || '',
        status: 'ACTIVE',
        total_visits: 0,
        total_spent: 0,
      });
    }

    if (bill.diningTableId || bill.dining_table_id) {
      this.selectedTable.set({
        id: bill.diningTableId || bill.dining_table_id,
        table_number: bill.tableNumber || bill.table_number || '',
        name: bill.tableName || bill.table_name || '',
        section: '',
        capacity: 4,
        status: 'OCCUPIED',
        display_order: 0,
      });
    }

    if (bill.items && Array.isArray(bill.items)) {
      const cartItems: CartItem[] = [];
      for (const item of bill.items) {
        const kind = CartService.savedLineKind(item);
        if (kind.itemType !== 'PRODUCT') {
          const price = Number(item.unitPrice || item.unit_price) || 0;
          const comp = Boolean(item.isComplimentary || item.is_complimentary);
          cartItems.push({
            lineId: `${kind.itemType}:${kind.comboId ?? kind.addonId}`,
            product: CartService.standInFor(kind, item.productName || item.product_name, price),
            variant: null,
            quantity: item.quantity,
            unitPrice: price,
            subtotal: item.quantity * (comp ? 0 : price),
            notes: item.notes,
            isComplimentary: comp,
            complimentaryReason: item.complimentaryReason || item.complimentary_reason,
            ...kind,
          });
          continue;
        }
        const prodId = item.productId || item.product_id;
        const prod = allProducts.find((p) => p.id === prodId) || {
          id: prodId,
          name: item.productName || item.product_name,
          selling_price: item.unitPrice || item.unit_price,
          category_id: 1,
          sku: item.sku || '',
          cost_price: 0,
          tax_rate: 5,
          stock_quantity: 10,
          current_stock: 10,
          is_available: 1,
          status: 'ACTIVE',
        };

        const isComp = Boolean(item.isComplimentary || item.is_complimentary);
        const variantId = item.variantId || item.variant_id;
        const unitP = Number(item.unitPrice || item.unit_price);

        cartItems.push({
          lineId: CartService.lineKey(prod.id, variantId ?? null),
          product: prod,
          variant: variantId
            ? {
                id: variantId,
                name: item.variantName || item.variant_name || '',
                selling_price: unitP,
              }
            : null,
          quantity: item.quantity,
          unitPrice: unitP,
          subtotal: item.quantity * (isComp ? 0 : unitP),
          notes: item.notes,
          isComplimentary: isComp,
          complimentaryReason: item.complimentaryReason || item.complimentary_reason,
        });
      }
      this.itemsSignal.set(cartItems);
    }
  }

  private playChime(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }
}

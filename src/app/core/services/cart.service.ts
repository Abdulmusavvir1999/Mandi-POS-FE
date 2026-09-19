import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem, Product, ProductVariant, Customer, DiningTable, OrderType, ProductAddon } from '../models';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private settingsService = inject(SettingsService);
  private itemsSignal = signal<CartItem[]>([]);
  public items = this.itemsSignal.asReadonly();

  public orderType = signal<OrderType>('WALK_IN');
  public selectedCustomer = signal<Customer | null>(null);
  public selectedTable = signal<DiningTable | null>(null);

  public discountType = signal<'FIXED' | 'PERCENTAGE'>('FIXED');
  public discountValue = signal<number>(0);
  public serviceChargeRate = signal<number>(0); // e.g. 5, 10 (%)
  public surchargeAmount = signal<number>(0); // Packaging / Late night / Delivery fee
  public couponCode = signal<string>('');
  public couponDiscount = signal<number>(0);

  public orderNotes = signal<string>('');
  public taxRate = signal<number>(0);
  public isTaxEnabled = signal<boolean>(true);

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

  public taxAmount = computed(() => {
    if (!this.isTaxEnabled()) return 0;
    return Math.round(((this.taxableAmount() * this.taxRate()) / 100) * 100) / 100;
  });

  public serviceChargeAmount = computed(() => {
    const rate = this.serviceChargeRate();
    if (rate <= 0) return 0;
    return Math.round(((this.taxableAmount() * rate) / 100) * 100) / 100;
  });

  public grandTotal = computed(() => {
    const total = this.taxableAmount() + this.taxAmount() + this.serviceChargeAmount() + this.surchargeAmount();
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
    const index = currentItems.findIndex((i) => i.lineId === lineId);

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
    itemType: 'PRODUCT' | 'COMBO' | 'DEAL' = 'PRODUCT',
    comboOrDealId?: number
  ): boolean {
    if (product.status !== 'ACTIVE' && itemType === 'PRODUCT') {
      return false;
    }

    const basePrice = variant ? Number(variant.selling_price) : Number(product.selling_price);
    const addonsCost = (selectedAddons || []).reduce((acc, a) => acc + Number(a.price || 0), 0);
    const unitPrice = basePrice + addonsCost;

    const addonIds = (selectedAddons || []).map((a) => a.id).sort((a, b) => a - b);
    const lineId = `${itemType}:${product.id}:${variant?.id ?? 'base'}:${addonIds.join('-') || 'none'}${comboOrDealId ? ':' + comboOrDealId : ''}`;

    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId);

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
        comboId: itemType === 'COMBO' ? comboOrDealId : undefined,
        dealId: itemType === 'DEAL' ? comboOrDealId : undefined,
        selectedAddons: selectedAddons ? [...selectedAddons] : [],
      });
    }

    this.itemsSignal.set(currentItems);
    this.playChime();
    return true;
  }

  public setComplimentary(lineId: string, isComplimentary: boolean, reason?: string): void {
    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.lineId === lineId);
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
    const index = currentItems.findIndex((i) => i.lineId === lineId);
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
    const index = currentItems.findIndex((i) => i.lineId === lineId);

    if (index >= 0) {
      const item = currentItems[index];
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
    this.itemsSignal.update((list) => list.filter((i) => i.lineId !== lineId));
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
    this.orderType.set('WALK_IN');
  }

  public restoreFromDraft(draft: any, allProducts: Product[]): void {
    this.clearCart();
    this.orderType.set(draft.order_type || 'WALK_IN');
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
          low_stock_threshold: 5,
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
                stock_consumption: Number(item.stock_consumption) || 1,
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
    this.orderType.set(bill.orderType || bill.order_type || 'WALK_IN');
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
          low_stock_threshold: 5,
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
                stock_consumption: 1,
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

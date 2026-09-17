import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem, Product, Customer, DiningTable, OrderType } from '../models';
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
  public orderNotes = signal<string>('');
  public taxRate = signal<number>(0);
  public isTaxEnabled = signal<boolean>(true);

  constructor() {
    // Tax configuration lives in the settings table, not in the client.
    this.settingsService.loadPublicSettings().subscribe((settings) => {
      const rawRate = settings['TAX_PERCENTAGE'] ?? settings['tax_rate_percentage'];
      const rate = Number(rawRate);
      if (rawRate !== undefined && rawRate !== '' && !Number.isNaN(rate)) {
        this.taxRate.set(rate);
      }
      if (settings['TAX_ENABLED'] !== undefined) {
        this.isTaxEnabled.set(settings['TAX_ENABLED'] === 'true');
      }
    });
  }

  // Computations
  public itemCount = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0)
  );

  public subtotal = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
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

  public taxableAmount = computed(() =>
    Math.max(0, this.subtotal() - this.discountAmount())
  );

  public taxAmount = computed(() => {
    if (!this.isTaxEnabled()) return 0;
    return Math.round(((this.taxableAmount() * this.taxRate()) / 100) * 100) / 100;
  });

  public grandTotal = computed(() =>
    Math.round((this.taxableAmount() + this.taxAmount()) * 100) / 100
  );

  public addItem(product: Product, quantity = 1, notes?: string): boolean {
    if (product.status !== 'ACTIVE') {
      return false;
    }

    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.product.id === product.id);

    if (index >= 0) {
      const existing = currentItems[index];
      const newQty = existing.quantity + quantity;
      currentItems[index] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * existing.unitPrice,
        notes: notes !== undefined ? notes : existing.notes,
      };
    } else {
      currentItems.push({
        product,
        quantity,
        unitPrice: product.selling_price,
        subtotal: quantity * product.selling_price,
        notes,
      });
    }

    this.itemsSignal.set(currentItems);
    this.playChime();
    return true;
  }

  public updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = [...this.itemsSignal()];
    const index = currentItems.findIndex((i) => i.product.id === productId);

    if (index >= 0) {
      const item = currentItems[index];
      currentItems[index] = {
        ...item,
        quantity,
        subtotal: quantity * item.unitPrice,
      };
      this.itemsSignal.set(currentItems);
    }
  }

  public increment(productId: number): void {
    const item = this.itemsSignal().find((i) => i.product.id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity + 1);
    }
  }

  public decrement(productId: number): void {
    const item = this.itemsSignal().find((i) => i.product.id === productId);
    if (item) {
      this.updateQuantity(productId, item.quantity - 1);
    }
  }

  public removeItem(productId: number): void {
    this.itemsSignal.update((list) => list.filter((i) => i.product.id !== productId));
  }

  public clearCart(): void {
    this.itemsSignal.set([]);
    this.discountValue.set(0);
    this.discountType.set('FIXED');
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

        cartItems.push({
          product: prod,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.quantity * item.unit_price,
          notes: item.notes,
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not supported or blocked
    }
  }
}

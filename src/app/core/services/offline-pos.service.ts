import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Category, Product, OfflineOrder, ApiResponse } from '../models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class OfflinePosService {
  private http = inject(HttpClient);
  private notify = inject(NotificationService);

  private readonly STORAGE_QUEUE_KEY = '_pos_offline_orders_queue';
  private readonly STORAGE_CATALOG_KEY = '_pos_offline_catalog_cache';

  public isOnline = signal<boolean>(navigator.onLine);
  public pendingOrders = signal<OfflineOrder[]>([]);
  public isSyncing = signal<boolean>(false);

  constructor() {
    this.initNetworkListeners();
    this.loadPendingOrders();
  }

  private initNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.notify.success('Back Online: Connection restored. Ready to sync offline bills.');
      // Automatically attempt to sync pending offline orders
      if (this.pendingOrders().length > 0) {
        this.syncPendingOrders();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.notify.warning('Offline Mode Active: Internet connection lost. Orders will be saved locally.');
    });

    // Heartbeat check every 45s
    setInterval(() => {
      if (navigator.onLine) {
        this.checkServerConnectivity();
      } else {
        this.isOnline.set(false);
      }
    }, 45000);
  }

  public checkServerConnectivity(): void {
    this.http.get<{ status: string }>(`${environment.apiUrl}/health`).subscribe({
      next: (res) => {
        if (!this.isOnline()) {
          this.isOnline.set(true);
          if (this.pendingOrders().length > 0) {
            this.syncPendingOrders();
          }
        }
      },
      error: () => {
        this.isOnline.set(false);
      },
    });
  }

  // --- Catalog Offline Caching ---

  public saveCatalogCache(categories: Category[], products: Product[]): void {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        categories,
        products,
      };
      localStorage.setItem(this.STORAGE_CATALOG_KEY, JSON.stringify(payload));
    } catch {
      // Storage quota exceeded or blocked
    }
  }

  public cacheCatalog(products: Product[], categories: Category[]): void {
    this.saveCatalogCache(categories, products);
  }

  public getCachedCatalog(): { categories: Category[]; products: Product[] } | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_CATALOG_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        categories: parsed.categories || [],
        products: parsed.products || [],
      };
    } catch {
      return null;
    }
  }

  // --- Offline Order Queue ---

  public loadPendingOrders(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_QUEUE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        this.pendingOrders.set(Array.isArray(list) ? list : []);
      }
    } catch {
      this.pendingOrders.set([]);
    }
  }

  public enqueueOfflineOrder(order: OfflineOrder): OfflineOrder {
    const list = [...this.pendingOrders(), order];
    this.pendingOrders.set(list);
    try {
      localStorage.setItem(this.STORAGE_QUEUE_KEY, JSON.stringify(list));
    } catch { }
    this.notify.info(`Order #${order.billNumber} queued locally in offline storage`);
    return order;
  }

  public removePendingOrder(offlineSyncId: string): void {
    const list = this.pendingOrders().filter((o) => o.offlineSyncId !== offlineSyncId);
    this.pendingOrders.set(list);
    try {
      localStorage.setItem(this.STORAGE_QUEUE_KEY, JSON.stringify(list));
    } catch { }
  }

  public clearPendingOrders(): void {
    this.pendingOrders.set([]);
    try {
      localStorage.removeItem(this.STORAGE_QUEUE_KEY);
    } catch { }
  }

  // --- Sync Engine ---

  public syncPendingOrders(): void {
    const queue = this.pendingOrders();
    if (queue.length === 0 || this.isSyncing()) return;

    this.isSyncing.set(true);
    const syncPayload = queue.map((o) => ({
      offlineSyncId: o.offlineSyncId,
      customerId: o.customerId,
      diningTableId: o.diningTableId,
      orderType: o.orderType,
      discountType: 'FIXED' as const,
      discountValue: o.discountAmount,
      serviceChargeAmount: o.serviceChargeAmount,
      surchargeAmount: o.surchargeAmount,
      couponCode: o.couponCode,
      couponDiscount: o.couponDiscount,
      paymentMethod: o.paymentMethod,
      paymentAmount: o.grandTotal,
      cashTendered: o.cashTendered,
      changeReturned: o.changeReturned,
      notes: o.notes ? `[OFFLINE] ${o.notes}` : '[OFFLINE SYNC]',
      items: o.items.map((i) => ({
        productId: i.product.id,
        variantId: i.variant?.id ?? null,
        quantity: i.quantity,
        notes: i.notes,
        isComplimentary: i.isComplimentary,
        complimentaryReason: i.complimentaryReason,
      })),
    }));

    this.http.post<ApiResponse<{ syncedCount: number; results: any[] }>>(
      `${environment.apiUrl}/checkout/sync-offline`,
      { orders: syncPayload }
    ).subscribe({
      next: (res) => {
        this.isSyncing.set(false);
        if (res.success && res.data) {
          const synced = res.data.syncedCount || 0;
          this.notify.success(`Sync Complete: ${synced} offline bill(s) committed to the server database.`);
          this.clearPendingOrders();
        } else {
          this.notify.warning('Some offline orders could not be synced.');
        }
      },
      error: (err) => {
        this.isSyncing.set(false);
        this.notify.error(err?.error?.message || 'Offline sync failed. Will retry when connection stabilizes.');
      },
    });
  }
}

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { Order, OrderStatus, OrderType, OrderItem } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import {
  CustomDropdownComponent,
  DropdownOption,
} from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe, CustomDropdownComponent, PageLoaderComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  public isLoading = false;
  public loadError: string | null = null;
  public lastUpdated = new Date();
  public isFullscreen = false;
  public soundEnabled = true;

  public orderService = inject(OrderService);
  public notify = inject(NotificationService);
  public settingsService = inject(SettingsService);

  public orders: Order[] = [];
  public selectedStatusTab: 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'ALL';
  public selectedOrderType: 'ALL' | OrderType = 'ALL';
  public selectedTable: string = 'ALL';
  public searchQuery: string = '';
  public sortBy: 'time_asc' | 'time_desc' | 'items_desc' | 'urgent' = 'urgent';


  public orderTypeOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Order Types', icon: 'filter_list' },
    { value: 'DINING', label: 'Dine In Only', icon: 'restaurant' },
    { value: 'TAKEAWAY', label: 'Takeaway Only', icon: 'takeout_dining' },
    { value: 'WALK_IN', label: 'Walk-In Only', icon: 'directions_walk' },
  ];

  public sortOptions: DropdownOption[] = [
    { value: 'urgent', label: 'Urgent / Oldest First', icon: 'bolt' },
    { value: 'time_desc', label: 'Newest First', icon: 'schedule' },
    { value: 'items_desc', label: 'Most Items First', icon: 'inventory_2' },
  ];

  /** Rebuilt from whichever tables currently have orders on the board. */
  public get tableOptions(): DropdownOption[] {
    return [
      { value: 'ALL', label: 'All Tables', icon: 'table_restaurant' },
      ...this.availableTables.map((t) => ({
        value: t,
        label: `Table ${t}`,
        icon: 'table_bar',
      })),
    ];
  }

  public selectedOrderDetails: Order | null = null;
  public isDrawerOpen = false;

  // Local item-level check state for kitchen preparation tracking
  public checkedItems = new Set<string>();

  // Live timer tick updated every second
  public currentTime = signal<number>(Date.now());
  private clockTimer: any = null;
  private autoRefreshTimer: any = null;
  private previousPendingCount = 0;

  ngOnInit(): void {
    this.loadOrders();
    this.startClock();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
  }

  private startClock(): void {
    this.clockTimer = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);
  }

  private startAutoRefresh(): void {
    // Refresh background orders every 20 seconds
    this.autoRefreshTimer = setInterval(() => {
      this.loadOrders(false);
    }, 20000);
  }

  public loadOrders(showSpinner = true): void {
    if (showSpinner) {
      this.isLoading = true;
    }
    this.loadError = null;

    this.orderService.getOrders(1, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const newOrders = res.data;
          // Check if new pending orders arrived and trigger chime
          const currentPendingCount = newOrders.filter((o) => o.status === 'PENDING').length;
          if (this.previousPendingCount > 0 && currentPendingCount > this.previousPendingCount && this.soundEnabled) {
            this.playOrderChime();
          }
          this.previousPendingCount = currentPendingCount;
          this.orders = newOrders;
          this.lastUpdated = new Date();

          // If drawer is open, keep selectedOrderDetails synchronized
          if (this.selectedOrderDetails) {
            const updated = this.orders.find((o) => o.id === this.selectedOrderDetails?.id);
            if (updated) {
              this.selectedOrderDetails = { ...this.selectedOrderDetails, ...updated };
            }
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        // A failed 20-second background refresh must not replace a board the
        // kitchen is already reading; only a foreground load shows the error
        // state. The interceptor still raises a toast either way.
        if (showSpinner) {
          this.loadError = err?.error?.message || 'Unable to load kitchen orders from server.';
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERED LISTS & METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  public get pendingOrders(): Order[] {
    return this.applySecondaryFilters(this.orders.filter((o) => o.status === 'PENDING'));
  }

  public get inProgressOrders(): Order[] {
    return this.applySecondaryFilters(this.orders.filter((o) => o.status === 'IN_PROGRESS'));
  }

  public get completedOrders(): Order[] {
    return this.applySecondaryFilters(this.orders.filter((o) => o.status === 'COMPLETED'));
  }

  public get cancelledOrders(): Order[] {
    return this.applySecondaryFilters(this.orders.filter((o) => o.status === 'CANCELLED'));
  }

  public get pendingCount(): number {
    return this.orders.filter((o) => o.status === 'PENDING').length;
  }

  public get inProgressCount(): number {
    return this.orders.filter((o) => o.status === 'IN_PROGRESS').length;
  }

  public get completedCount(): number {
    return this.orders.filter((o) => o.status === 'COMPLETED').length;
  }

  public get cancelledCount(): number {
    return this.orders.filter((o) => o.status === 'CANCELLED').length;
  }

  public get totalActiveCount(): number {
    return this.pendingCount + this.inProgressCount;
  }

  public get availableTables(): string[] {
    const tableSet = new Set<string>();
    this.orders.forEach((o) => {
      if (o.table_number) tableSet.add(o.table_number);
    });
    return Array.from(tableSet).sort();
  }

  private applySecondaryFilters(list: Order[]): Order[] {
    let result = [...list];

    // Order Type Filter
    if (this.selectedOrderType !== 'ALL') {
      result = result.filter((o) => o.order_type === this.selectedOrderType);
    }

    // Table Filter
    if (this.selectedTable !== 'ALL') {
      result = result.filter((o) => o.table_number === this.selectedTable);
    }

    // Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const orderNum = (o.order_number || '').toLowerCase();
        const table = (o.table_number || '').toLowerCase();
        const customer = (o.customer_name || '').toLowerCase();
        const items = (o.items || []).some((item) => (item.product_name || '').toLowerCase().includes(q));
        return orderNum.includes(q) || table.includes(q) || customer.includes(q) || items;
      });
    }

    // Sort
    if (this.sortBy === 'urgent') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (this.sortBy === 'time_desc') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (this.sortBy === 'items_desc') {
      result.sort((a, b) => (b.item_count || b.items?.length || 0) - (a.item_count || a.items?.length || 0));
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMERS & URGENCY CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  public getElapsedMinutes(createdAt: string): number {
    if (!createdAt) return 0;
    const start = new Date(createdAt).getTime();
    const now = this.currentTime();
    return Math.max(0, Math.floor((now - start) / 60000));
  }

  public getElapsedFormatted(createdAt: string): string {
    if (!createdAt) return '00:00';
    const start = new Date(createdAt).getTime();
    const now = this.currentTime();
    const diffSec = Math.max(0, Math.floor((now - start) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  public getUrgencyClass(createdAt: string, status: OrderStatus): string {
    if (status === 'COMPLETED' || status === 'CANCELLED') return 'timer-normal';
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 20) return 'timer-overdue';
    if (mins >= 10) return 'timer-warning';
    return 'timer-normal';
  }

  public getUrgencyLabel(createdAt: string, status: OrderStatus): string {
    if (status === 'COMPLETED') return 'Fulfilled';
    if (status === 'CANCELLED') return 'Cancelled';
    const mins = this.getElapsedMinutes(createdAt);
    const timeStr = this.getElapsedFormatted(createdAt);
    if (mins >= 20) return `🔥 DELAYED ${timeStr}`;
    if (status === 'PENDING') return `Waiting ${timeStr}`;
    if (status === 'IN_PROGRESS') return `Cooking ${timeStr}`;
    return timeStr;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM-LEVEL CHECKLIST FOR KITCHEN
  // ═══════════════════════════════════════════════════════════════════════════

  public getItemKey(orderId: number, itemId: number): string {
    return `${orderId}_${itemId}`;
  }

  public isItemChecked(orderId: number, itemId: number): boolean {
    return this.checkedItems.has(this.getItemKey(orderId, itemId));
  }

  public toggleItemChecked(orderId: number, itemId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const key = this.getItemKey(orderId, itemId);
    if (this.checkedItems.has(key)) {
      this.checkedItems.delete(key);
    } else {
      this.checkedItems.add(key);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER ACTIONS & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  public startCooking(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    this.orderService.startOrder(order.id).subscribe({
      next: () => {
        this.notify.success(`Order #${order.order_number} moved to Cooking`);
        this.loadOrders(false);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to start order');
      },
    });
  }

  public markReady(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    this.orderService.completeOrder(order.id).subscribe({
      next: () => {
        this.notify.success(`Order #${order.order_number} marked Ready & Fulfilled`);
        this.loadOrders(false);
        if (this.selectedOrderDetails?.id === order.id) {
          this.closeDrawer();
        }
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Failed to complete order');
      },
    });
  }

  public cancelOrder(order: Order, event?: Event): void {
    if (event) event.stopPropagation();
    this.notify.confirm({
      title: `Cancel Order #${order.order_number}`,
      message: `Are you sure you want to cancel order #${order.order_number}? Any occupied table will be released.`,
      confirmText: 'Cancel Order',
      isDestructive: true,
      onConfirm: () => {
        this.orderService.cancelOrder(order.id, 'Cancelled by kitchen staff').subscribe({
          next: () => {
            this.notify.info(`Order #${order.order_number} cancelled`);
            this.loadOrders(false);
            if (this.selectedOrderDetails?.id === order.id) {
              this.closeDrawer();
            }
          },
          error: (err) => {
            this.notify.error(err?.error?.message || 'Failed to cancel order');
          },
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER DETAILS DRAWER
  // ═══════════════════════════════════════════════════════════════════════════

  public openOrderDrawer(order: Order): void {
    this.selectedOrderDetails = order;
    this.isDrawerOpen = true;

    // Fetch complete details with history
    this.orderService.getOrderById(order.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedOrderDetails = res.data;
        }
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => {},
    });
  }

  public closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedOrderDetails = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINT KITCHEN ORDER TICKET (KOT)
  // ═══════════════════════════════════════════════════════════════════════════

  public printKOT(order: Order, event?: Event): void {
    if (event) event.stopPropagation();

    const businessName = this.settingsService.businessName() || 'Mandi Restaurant';
    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px dashed #ccc;">
          <td style="padding: 6px 0; font-weight: bold; font-size: 15px;">${item.quantity}x</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: left; padding-left: 8px;">
            ${item.product_name}
            ${item.notes ? `<div style="font-size: 11px; color: #555; font-style: italic;">Note: ${item.notes}</div>` : ''}
          </td>
        </tr>`
      )
      .join('');

    const ticketWindow = window.open('', '_blank', 'width=380,height=600');
    if (!ticketWindow) {
      this.notify.error('Please allow popups to print Kitchen Tickets');
      return;
    }

    ticketWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT #${order.order_number}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            color: #000;
            background: #fff;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
          .sub { font-size: 12px; font-weight: bold; margin-top: 2px; }
          .meta { font-size: 12px; margin-bottom: 8px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 6px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          .notes-box { margin-top: 8px; padding: 6px; border: 1px dashed #000; font-size: 12px; font-weight: bold; }
          .footer { text-align: center; margin-top: 14px; font-size: 11px; border-top: 1px solid #000; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${businessName.toUpperCase()}</div>
          <div class="sub">*** KITCHEN ORDER TICKET (KOT) ***</div>
        </div>
        <div class="meta">
          <div><strong>ORDER #:</strong> ${order.order_number}</div>
          <div><strong>DATE/TIME:</strong> ${new Date(order.created_at).toLocaleString()}</div>
          <div><strong>TYPE:</strong> ${order.order_type} ${order.table_number ? `| TABLE: ${order.table_number}` : ''}</div>
          ${order.customer_name ? `<div><strong>CUSTOMER:</strong> ${order.customer_name}</div>` : ''}
          ${order.created_by_name ? `<div><strong>WAITER:</strong> ${order.created_by_name}</div>` : ''}
        </div>
        <table class="table">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; width: 35px;">QTY</th>
              <th style="text-align: left; padding-left: 8px;">ITEM DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="2">No item details</td></tr>'}
          </tbody>
        </table>
        ${order.notes ? `<div class="notes-box">SPECIAL INSTRUCTIONS:<br/>${order.notes}</div>` : ''}
        <div class="footer">
          <div>Printed at: ${new Date().toLocaleTimeString()}</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    ticketWindow.document.close();
    this.notify.info(`KOT Ticket sent to printer for Order #${order.order_number}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULLSCREEN & SOUND CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      this.isFullscreen = false;
    }
  }

  public toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.notify.info(this.soundEnabled ? 'Kitchen order audio alerts ENABLED' : 'Kitchen order audio alerts MUTED');
  }

  private playOrderChime(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (_) {}
  }
}

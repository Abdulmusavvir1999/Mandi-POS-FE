import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BackOfficeService,
  BackOfficeOrder,
  BackOfficeOrderLine,
  BulkResult,
} from '../../core/services/back-office.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { DiningService } from '../../core/services/dining.service';
import { Order, OrderType, PaymentMethod, Product } from '../../core/models';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import {
  CustomDropdownComponent,
  DropdownOption,
} from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { BackOfficeResultComponent } from './back-office-result.component';

/** A line being assembled in the Create Order form. */
interface DraftLine {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Order management for the Back-Office.
 *
 * Orders can be searched, filtered, opened, created, deleted one at a time or
 * in bulk, and given a fixed discount in bulk. Every bulk action reports its
 * per-record outcome rather than assuming everything went through.
 */
@Component({
  selector: 'app-back-office-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppCurrencyPipe,
    CustomDropdownComponent,
    DatePickerComponent,
    BackOfficeResultComponent,
  ],
  template: `
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- FILTER & SEARCH TOOLBAR                                          -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="filter-toolbar-card">
      <div class="filter-controls-group">
        <div class="search-input-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            title="Search orders"
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChanged()"
            placeholder="Search order #, invoice #, customer..."
            class="toolbar-search-input"
          />
          <button
            *ngIf="searchQuery"
            (click)="searchQuery = ''; onFilterChange()"
            class="search-clear-btn"
            title="Clear search"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <app-custom-dropdown
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          (valueChange)="onFilterChange()"
          placeholder="All Statuses"
          minWidth="170px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          [options]="orderTypeOptions"
          [(ngModel)]="selectedOrderType"
          (valueChange)="onFilterChange()"
          placeholder="All Order Types"
          minWidth="175px"
        ></app-custom-dropdown>

        <app-custom-dropdown
          [options]="invoiceOptions"
          [(ngModel)]="selectedHasInvoice"
          (valueChange)="onFilterChange()"
          placeholder="Invoice Status"
          minWidth="170px"
        ></app-custom-dropdown>

        <app-date-picker
          [(ngModel)]="selectedDate"
          (valueChange)="onFilterChange()"
          label="Filter by date"
          placeholder="All Dates"
          minWidth="165px"
        ></app-date-picker>

        <span class="toolbar-meta-count hidden lg:inline-block">
          {{ pagination?.total || orders.length }} orders
        </span>
      </div>

      <div class="toolbar-actions-group">
        <button type="button" (click)="loadOrders(currentPage)" class="action-btn btn-outline-purple" title="Refresh">
          <span class="material-symbols-outlined">refresh</span>
          <span>Refresh</span>
        </button>
        <button type="button" (click)="openCreateForm()" class="action-btn btn-gradient-purple" title="Create a new order">
          <span class="material-symbols-outlined">add_circle</span>
          <span>Create Order</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- SELECTION TOOLBAR — only rendered while something is selected    -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="bo-selection-bar" *ngIf="selectedIds.size > 0">
      <div class="bo-selection-count">
        <span class="material-symbols-outlined">check_circle</span>
        <strong>{{ selectedIds.size }}</strong>
        <span>Selected</span>
      </div>

      <div class="bo-selection-actions">
        <button type="button" class="action-btn bo-btn-danger" (click)="confirmBulkDelete()" [disabled]="isBusy">
          <span class="material-symbols-outlined">delete_sweep</span>
          <span>Delete Selected</span>
        </button>

        <button type="button" class="action-btn btn-gradient-purple" (click)="openDiscountDialog()" [disabled]="isBusy">
          <span class="material-symbols-outlined">sell</span>
          <span>Apply Discount</span>
        </button>

        <button type="button" class="action-btn btn-outline-purple" (click)="clearSelection()">
          <span class="material-symbols-outlined">close</span>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- ORDERS TABLE                                                     -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="table-container-card">
      <div class="table-responsive-wrapper">
        <table class="saas-data-table">
          <thead>
            <tr>
              <th style="width: 46px; text-align: center;">
                <input
                  type="checkbox"
                  class="bo-checkbox"
                  title="Select all visible orders"
                  [checked]="allVisibleSelected"
                  [indeterminate]="someVisibleSelected"
                  (change)="toggleSelectAll($any($event.target).checked)"
                />
              </th>
              <th style="width: 19%;">Order # &amp; Date</th>
              <th style="width: 17%;">Customer</th>
              <th style="width: 12%;">Type</th>
              <th style="width: 11%;">Status</th>
              <th style="width: 15%;">Invoice</th>
              <th style="width: 10%;">Discount</th>
              <th style="width: 11%;">Total</th>
              <th style="width: 96px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders" [class.bo-row-selected]="selectedIds.has(order.id)">
              <td style="text-align: center;">
                <input
                  type="checkbox"
                  class="bo-checkbox"
                  [title]="'Select order ' + order.order_number"
                  [checked]="selectedIds.has(order.id)"
                  (change)="toggleOne(order.id, $any($event.target).checked)"
                />
              </td>

              <td>
                <div class="flex items-center gap-2.5">
                  <div class="bo-row-icon">
                    <span class="material-symbols-outlined" style="font-size: 19px;">receipt</span>
                  </div>
                  <div class="min-w-0">
                    <div class="font-mono font-bold text-xs text-[#7E22CE]">{{ order.order_number }}</div>
                    <div class="text-[10px] text-[#6B7280] font-mono">
                      {{ order.created_at | date: 'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <div class="font-bold text-xs bo-text-main truncate">{{ order.customer_name || 'Walk-In Guest' }}</div>
                <div class="text-[10px] text-[#6B7280] font-mono">
                  {{ order.customer_phone || (order.item_count || 0) + ' item(s)' }}
                </div>
              </td>

              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-info': order.order_type === 'WALK_IN',
                    'badge-warning': order.order_type === 'TAKEAWAY',
                    'badge-primary': order.order_type === 'DINING'
                  }"
                >
                  {{ order.order_type }}
                </span>
              </td>

              <td>
                <span class="bo-status-pill" [ngClass]="statusClass(order.status)">{{ order.status }}</span>
              </td>

              <td>
                <span *ngIf="order.bill_number" class="bo-invoice-link">
                  <span class="material-symbols-outlined" style="font-size: 14px;">description</span>
                  {{ order.bill_number }}
                </span>
                <span *ngIf="!order.bill_number" class="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                  Not invoiced
                </span>
              </td>

              <td>
                <span class="font-mono text-xs" [class.bo-discount-on]="(order.discount_amount || 0) > 0">
                  {{ (order.discount_amount || 0) > 0 ? '-' : '' }}{{ order.discount_amount || 0 | appCurrency: '1.0-2' }}
                </span>
              </td>

              <td>
                <span class="font-mono font-black text-xs text-[#16A34A]">
                  {{ order.total_amount | appCurrency: '1.2-2' }}
                </span>
              </td>

              <td style="text-align: center;">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="btn-action-icon"
                    title="Open order details"
                    (click)="openDetails(order.id)"
                  >
                    <span class="material-symbols-outlined" style="font-size: 17px;">visibility</span>
                  </button>
                  <button
                    type="button"
                    class="btn-action-icon is-danger"
                    title="Delete this order"
                    [disabled]="isBusy"
                    (click)="confirmSingleDelete(order)"
                  >
                    <span class="material-symbols-outlined" style="font-size: 17px;">delete</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr *ngIf="orders.length === 0">
              <td colspan="9" class="empty-state-cell">
                <div class="empty-state-box">
                  <span class="material-symbols-outlined empty-icon">
                    {{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'receipt_long' }}
                  </span>
                  <div class="empty-title">
                    {{ isLoading ? 'Loading…' : loadError ? 'Could not load orders' : 'No Orders Found' }}
                  </div>
                  <p class="empty-desc">
                    {{
                      isLoading
                        ? 'Fetching the order register…'
                        : loadError
                        ? loadError
                        : 'No orders match the current search or filters.'
                    }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-footer-bar" *ngIf="pagination && pagination.total > 0">
        <div class="pagination-info">
          Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of
          <strong>{{ pagination.total }}</strong> orders
        </div>
        <div class="pagination-controls">
          <button
            type="button"
            class="page-nav-btn"
            title="Previous page"
            [disabled]="currentPage <= 1"
            (click)="loadOrders(currentPage - 1)"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            class="page-num-btn"
            *ngFor="let page of pageNumbers"
            [class.is-active]="currentPage === page"
            (click)="loadOrders(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="page-nav-btn"
            title="Next page"
            [disabled]="currentPage >= pagination.totalPages"
            (click)="loadOrders(currentPage + 1)"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- APPLY DISCOUNT DIALOG                                            -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showDiscountDialog">
      <div class="modal-content p-6 md:p-7 w-full max-w-md shadow-2xl bo-card">
        <div class="flex items-start gap-3.5 mb-5">
          <span class="modal-icon-badge is-warning">
            <span class="material-symbols-outlined text-2xl">sell</span>
          </span>
          <div>
            <h3 class="text-lg font-black bo-text-main">Apply Discount</h3>
            <p class="text-xs mt-0.5 font-medium bo-text-muted">
              Applied in full to each of the {{ selectedIds.size }} selected orders — the amount is not divided
              between them.
            </p>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">Discount Type</label>
          <app-custom-dropdown
            [options]="discountTypeOptions"
            [(ngModel)]="discountType"
            placeholder="Fixed Amount"
            minWidth="100%"
          ></app-custom-dropdown>
        </div>

        <div class="mb-2">
          <label class="form-label" for="bo-discount-value">
            {{ discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount' }}
          </label>
          <input
            id="bo-discount-value"
            type="number"
            min="0"
            [max]="discountType === 'PERCENTAGE' ? 100 : null"
            step="0.01"
            class="form-control"
            [(ngModel)]="discountValue"
            placeholder="100"
          />
        </div>

        <p class="text-[11px] bo-text-muted leading-relaxed mt-3">
          Each order is recalculated and its linked invoice is recalculated with it. Voided or refunded invoices are
          skipped and listed afterwards.
        </p>

        <div class="flex items-center justify-end gap-3 mt-6 pt-4 bo-divider">
          <button type="button" class="btn btn-secondary" (click)="showDiscountDialog = false">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isBusy || !isDiscountValid" (click)="applyDiscount()">
            {{ isBusy ? 'Applying…' : 'Apply Discount' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- CREATE ORDER FORM                                                -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="showCreateForm">
      <div class="modal-content p-6 md:p-7 w-full max-w-3xl shadow-2xl bo-card">
        <div class="flex items-start gap-3.5 mb-5">
          <span class="modal-icon-badge is-warning">
            <span class="material-symbols-outlined text-2xl">add_shopping_cart</span>
          </span>
          <div>
            <h3 class="text-lg font-black bo-text-main">Create Order</h3>
            <p class="text-xs mt-0.5 font-medium bo-text-muted">
              Saving this order raises its invoice automatically — no separate invoicing step.
            </p>
          </div>
        </div>

        <div class="bo-form-grid">
          <div>
            <label class="form-label">Order Type</label>
            <app-custom-dropdown
              [options]="createOrderTypeOptions"
              [(ngModel)]="draftOrderType"
              (valueChange)="onDraftOrderTypeChange()"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>

          <div>
            <label class="form-label">Payment Method</label>
            <app-custom-dropdown
              [options]="paymentOptions"
              [(ngModel)]="draftPaymentMethod"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>

          <div>
            <label class="form-label">Customer (optional)</label>
            <app-custom-dropdown
              [options]="customerOptions"
              [(ngModel)]="draftCustomerId"
              [searchable]="true"
              placeholder="Walk-In Guest"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>

          <div *ngIf="draftOrderType === 'DINING'">
            <label class="form-label">Dining Table</label>
            <app-custom-dropdown
              [options]="tableOptions"
              [(ngModel)]="draftTableId"
              [searchable]="true"
              placeholder="Select a table"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>
        </div>

        <!-- Line item builder -->
        <div class="bo-line-builder">
          <div class="flex-1 min-w-0">
            <label class="form-label">Product</label>
            <app-custom-dropdown
              [options]="productOptions"
              [(ngModel)]="pickerProductId"
              [searchable]="true"
              placeholder="Search a product"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>
          <div class="bo-qty-field">
            <label class="form-label">Qty</label>
            <input type="number" min="1" step="1" class="form-control" [(ngModel)]="pickerQuantity" title="Quantity" />
          </div>
          <button type="button" class="action-btn btn-outline-purple bo-add-line" (click)="addLine()">
            <span class="material-symbols-outlined">add</span>
            <span>Add</span>
          </button>
        </div>

        <div class="bo-line-list">
          <div class="bo-line-empty" *ngIf="draftLines.length === 0">
            No items added yet. Pick a product and press Add.
          </div>
          <div class="bo-line-row" *ngFor="let line of draftLines; let i = index">
            <span class="bo-line-name">{{ line.productName }}</span>
            <span class="bo-line-qty">× {{ line.quantity }}</span>
            <span class="bo-line-amount">{{ line.unitPrice * line.quantity | appCurrency: '1.2-2' }}</span>
            <button type="button" class="btn-action-icon is-danger" title="Remove line" (click)="removeLine(i)">
              <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            </button>
          </div>
        </div>

        <div class="bo-form-grid mt-4">
          <div>
            <label class="form-label">Discount Type</label>
            <app-custom-dropdown
              [options]="discountTypeOptions"
              [(ngModel)]="draftDiscountType"
              minWidth="100%"
            ></app-custom-dropdown>
          </div>
          <div>
            <label class="form-label">Discount Value</label>
            <input type="number" min="0" step="0.01" class="form-control" [(ngModel)]="draftDiscountValue" title="Discount value" />
          </div>
        </div>

        <div class="mt-4">
          <label class="form-label">Notes (optional)</label>
          <input type="text" class="form-control" [(ngModel)]="draftNotes" placeholder="Anything to record against this order" />
        </div>

        <div class="bo-total-strip">
          <span>Items subtotal</span>
          <strong>{{ draftSubtotal | appCurrency: '1.2-2' }}</strong>
        </div>
        <p class="text-[11px] bo-text-muted mt-1.5">
          Tax and the final payable amount are calculated by the server from the configured tax settings when the order
          is saved.
        </p>

        <div class="flex items-center justify-end gap-3 mt-6 pt-4 bo-divider">
          <button type="button" class="btn btn-secondary" (click)="showCreateForm = false">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="isBusy || draftLines.length === 0"
            (click)="submitCreateForm()"
          >
            {{ isBusy ? 'Creating…' : 'Create Order & Invoice' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- ORDER DETAILS DRAWER                                             -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="modal-backdrop" *ngIf="detailsOrder">
      <div class="modal-content p-6 md:p-7 w-full max-w-2xl shadow-2xl bo-card">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div class="flex items-start gap-3.5">
            <span class="modal-icon-badge is-warning">
              <span class="material-symbols-outlined text-2xl">receipt_long</span>
            </span>
            <div>
              <h3 class="text-lg font-black bo-text-main">{{ detailsOrder.order_number }}</h3>
              <p class="text-xs mt-0.5 font-medium bo-text-muted">
                {{ detailsOrder.created_at | date: 'dd MMM yyyy, HH:mm' }} ·
                {{ detailsOrder.customer_name || 'Walk-In Guest' }}
              </p>
            </div>
          </div>
          <span class="bo-status-pill" [ngClass]="statusClass(detailsOrder.status)">{{ detailsOrder.status }}</span>
        </div>

        <div class="bo-detail-grid">
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Order Type</span>
            <span class="bo-detail-value">{{ detailsOrder.order_type }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Table</span>
            <span class="bo-detail-value">{{ detailsOrder.table_number || '—' }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Invoice</span>
            <span class="bo-detail-value">{{ detailsOrder.bill_number || 'Not invoiced' }}</span>
          </div>
          <div class="bo-detail-cell">
            <span class="bo-detail-label">Raised By</span>
            <span class="bo-detail-value">{{ detailsOrder.created_by_name || '—' }}</span>
          </div>
        </div>

        <div class="bo-result-scroll mt-4">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 70px; text-align: center;">Qty</th>
                <th style="width: 110px; text-align: right;">Rate</th>
                <th style="width: 120px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of detailsOrder.items">
                <td class="text-xs font-semibold bo-text-main">{{ item.product_name }}</td>
                <td class="text-xs font-mono" style="text-align: center;">{{ item.quantity }}</td>
                <td class="text-xs font-mono" style="text-align: right;">{{ item.unit_price | appCurrency: '1.2-2' }}</td>
                <td class="text-xs font-mono font-bold" style="text-align: right;">
                  {{ item.total_amount | appCurrency: '1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="!detailsOrder.items?.length">
                <td colspan="4" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">inventory_2</span>
                    <div class="empty-title">No line items</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bo-summary">
          <div class="bo-summary-row">
            <span>Subtotal</span><strong>{{ detailsOrder.subtotal | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row">
            <span>Discount</span
            ><strong class="text-[#DC2626]">- {{ detailsOrder.discount_amount | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row">
            <span>Tax</span><strong>{{ detailsOrder.tax_amount | appCurrency: '1.2-2' }}</strong>
          </div>
          <div class="bo-summary-row is-total">
            <span>Total</span><strong>{{ detailsOrder.total_amount | appCurrency: '1.2-2' }}</strong>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6 pt-4 bo-divider">
          <button type="button" class="btn btn-secondary" (click)="detailsOrder = null">Close</button>
        </div>
      </div>
    </div>

    <app-back-office-result
      [result]="bulkResult"
      [title]="bulkResultTitle"
      (close)="bulkResult = null"
    ></app-back-office-result>
  `,
  styles: [
    `
      .bo-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        color: var(--text-main, #2e1065);
      }
      .bo-text-main {
        color: var(--text-main, #2e1065);
      }
      .bo-text-muted {
        color: var(--text-muted, #6b7280);
      }
      .bo-divider {
        border-top: 1px solid var(--card-border, #e9d5ff);
      }

      /* Selection toolbar — present only while records are selected */
      .bo-selection-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.7rem 1rem;
        border-radius: 0.9rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
        box-shadow: 0 8px 22px -6px rgba(var(--primary-rgb, 126, 34, 206), 0.5);
      }
      .bo-selection-count {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: #ffffff;
        font-size: 0.82rem;
        font-weight: 700;
      }
      .bo-selection-count strong {
        font-size: 1rem;
        font-weight: 900;
      }
      .bo-selection-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .bo-selection-bar .action-btn {
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.35);
        color: #ffffff;
      }
      .bo-selection-bar .action-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.24);
        color: #ffffff;
      }
      .bo-selection-bar .bo-btn-danger {
        background: var(--danger, #DC2626);
        border-color: var(--danger, #B91C1C);
      }
      .bo-selection-bar .bo-btn-danger:hover:not(:disabled) {
        background: var(--danger, #B91C1C);
      }

      .bo-checkbox {
        width: 16px;
        height: 16px;
        accent-color: var(--primary, #7E22CE);
        cursor: pointer;
      }
      .bo-row-selected {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.06) !important;
      }
      .bo-row-icon {
        width: 34px;
        height: 34px;
        border-radius: 0.7rem;
        background: var(--primary-light, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .bo-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid transparent;
      }
      .bo-status-pill.is-pending {
        background: var(--warning-light, #FEF3C7);
        color: #92400e;
        border-color: var(--warning-light, #FDE68A);
      }
      .bo-status-pill.is-progress {
        background: #dbeafe;
        color: #1e40af;
        border-color: #bfdbfe;
      }
      .bo-status-pill.is-done {
        background: var(--success-light, #DCFCE7);
        color: #166534;
        border-color: var(--success-light, #BBF7D0);
      }
      .bo-status-pill.is-cancelled {
        background: var(--danger-light, #FEE2E2);
        color: #991b1b;
        border-color: var(--danger-light, #FECACA);
      }

      .bo-discount-on {
        color: var(--danger, #DC2626);
        font-weight: 700;
      }

      .bo-invoice-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 0.4rem;
        padding: 0.12rem 0.4rem;
      }

      /* Create-order form */
      .bo-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 0.9rem;
      }
      .bo-line-builder {
        display: flex;
        align-items: flex-end;
        gap: 0.7rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--card-border, #e9d5ff);
      }
      .bo-qty-field {
        width: 92px;
        flex-shrink: 0;
      }
      .bo-add-line {
        height: 42px;
        flex-shrink: 0;
      }
      .bo-line-list {
        margin-top: 0.75rem;
        max-height: 170px;
        overflow-y: auto;
        border: 1px dashed var(--card-border, #e9d5ff);
        border-radius: 0.7rem;
        padding: 0.5rem;
      }
      .bo-line-empty {
        font-size: 0.72rem;
        color: var(--text-muted, #6b7280);
        text-align: center;
        padding: 0.8rem 0;
      }
      .bo-line-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.35rem 0.5rem;
        border-radius: 0.5rem;
      }
      .bo-line-row:hover {
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.06);
      }
      .bo-line-name {
        flex: 1;
        min-width: 0;
        font-size: 0.76rem;
        font-weight: 700;
        color: var(--text-main, #2e1065);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bo-line-qty {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.72rem;
        color: var(--text-muted, #6b7280);
      }
      .bo-line-amount {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.74rem;
        font-weight: 800;
        color: var(--success, #16A34A);
        min-width: 86px;
        text-align: right;
      }
      .bo-total-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        padding: 0.6rem 0.9rem;
        border-radius: 0.7rem;
        background: var(--bg-app, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--primary-variant, #6B21A8);
      }

      /* Detail drawer */
      .bo-detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.6rem;
      }
      .bo-detail-cell {
        padding: 0.5rem 0.7rem;
        border-radius: 0.6rem;
        background: rgba(var(--primary-rgb, 126, 34, 206), 0.05);
        border: 1px solid var(--card-border, #e9d5ff);
      }
      .bo-detail-label {
        display: block;
        font-size: 0.6rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted, #6b7280);
      }
      .bo-detail-value {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-main, #2e1065);
        margin-top: 0.1rem;
      }
      .bo-result-scroll {
        max-height: 34vh;
        overflow-y: auto;
      }
      .bo-summary {
        margin-top: 1rem;
        border-top: 1px solid var(--card-border, #e9d5ff);
        padding-top: 0.7rem;
      }
      .bo-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        color: var(--text-muted, #6b7280);
        padding: 0.18rem 0;
      }
      .bo-summary-row strong {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--text-main, #2e1065);
      }
      .bo-summary-row.is-total {
        font-weight: 800;
        color: var(--text-main, #2e1065);
        border-top: 1px dashed var(--card-border, #e9d5ff);
        margin-top: 0.3rem;
        padding-top: 0.5rem;
      }
      .bo-summary-row.is-total strong {
        color: var(--success, #16A34A);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class BackOfficeOrdersComponent implements OnInit {
  private backOffice = inject(BackOfficeService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private diningService = inject(DiningService);
  public notify = inject(NotificationService);

  public orders: BackOfficeOrder[] = [];
  public pagination: any = null;
  public isLoading = false;
  public isBusy = false;
  public loadError: string | null = null;

  public pageSize = 20;
  public currentPage = 1;

  /** Debounce for the search box, so typing is not one request per key. */
  private searchTimer: any = null;
  /** Identifies the newest request, so a slow earlier one cannot overwrite it. */
  private loadToken = 0;

  public searchQuery = '';
  public selectedStatus: any = '';
  public selectedOrderType: any = '';
  public selectedHasInvoice: any = '';
  public selectedDate = '';

  /** Ids survive paging and filtering so a selection can span pages. */
  public selectedIds = new Set<number>();

  public showDiscountDialog = false;
  public discountType: 'FIXED' | 'PERCENTAGE' = 'FIXED';
  public discountValue: number | null = null;

  public showCreateForm = false;
  public draftOrderType: OrderType = 'WALK_IN';
  public draftPaymentMethod: PaymentMethod = 'CASH';
  public draftCustomerId: number | null = null;
  public draftTableId: number | null = null;
  public draftDiscountType: 'FIXED' | 'PERCENTAGE' = 'FIXED';
  public draftDiscountValue: number | null = null;
  public draftNotes = '';
  public draftLines: DraftLine[] = [];
  public pickerProductId: number | null = null;
  public pickerQuantity = 1;

  public detailsOrder: Order | null = null;

  public bulkResult: BulkResult | null = null;
  public bulkResultTitle = 'Operation complete';

  /** Raised whenever an action here also changed invoices, so the sibling tab reloads. */
  @Output() invoicesNeedRefresh = new EventEmitter<void>();

  private products: Product[] = [];
  public productOptions: DropdownOption[] = [];
  public customerOptions: DropdownOption[] = [{ value: null, label: 'Walk-In Guest', icon: 'person' }];
  public tableOptions: DropdownOption[] = [];

  public statusOptions: DropdownOption[] = [
    { value: '', label: 'All Statuses', icon: 'filter_list' },
    { value: 'PENDING', label: 'Pending', icon: 'schedule' },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: 'sync' },
    { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'cancel' },
  ];

  public orderTypeOptions: DropdownOption[] = [
    { value: '', label: 'All Order Types', icon: 'filter_list' },
    { value: 'WALK_IN', label: 'Walk-In', icon: 'directions_walk' },
    { value: 'TAKEAWAY', label: 'Takeaway', icon: 'takeout_dining' },
    { value: 'DINING', label: 'Dine-In', icon: 'restaurant' },
  ];

  public invoiceOptions: DropdownOption[] = [
    { value: '', label: 'Invoice: Any', icon: 'description' },
    { value: 'YES', label: 'Invoiced Only', icon: 'task_alt' },
    { value: 'NO', label: 'Not Invoiced', icon: 'block' },
  ];

  public createOrderTypeOptions: DropdownOption[] = [
    { value: 'WALK_IN', label: 'Walk-In', icon: 'directions_walk' },
    { value: 'TAKEAWAY', label: 'Takeaway', icon: 'takeout_dining' },
    { value: 'DINING', label: 'Dine-In', icon: 'restaurant' },
  ];

  public paymentOptions: DropdownOption[] = [
    { value: 'CASH', label: 'Cash', icon: 'payments' },
    { value: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
    { value: 'CARD', label: 'Card', icon: 'credit_card' },
    { value: 'OTHER', label: 'Other', icon: 'wallet' },
  ];

  public discountTypeOptions: DropdownOption[] = [
    { value: 'FIXED', label: 'Fixed Amount', icon: 'money_off' },
    { value: 'PERCENTAGE', label: 'Percentage', icon: 'percent' },
  ];

  ngOnInit(): void {
    this.loadOrders(1);
  }

  // ── Listing ───────────────────────────────────────────────────────────

  public loadOrders(page = 1): void {
    // A filter or page change supersedes a pending debounce, which would
    // otherwise fire a second, redundant request straight after this one.
    clearTimeout(this.searchTimer);
    this.isLoading = true;
    this.loadError = null;
    this.currentPage = page;
    const token = ++this.loadToken;

    this.backOffice
      .getOrders({
        page,
        limit: this.pageSize,
        status: this.selectedStatus || '',
        orderType: this.selectedOrderType || '',
        search: this.searchQuery || undefined,
        hasInvoice: this.selectedHasInvoice || '',
        dateFrom: this.selectedDate || undefined,
        dateTo: this.selectedDate || undefined,
      })
      .subscribe({
        next: (res) => {
          if (token !== this.loadToken) return;
          this.isLoading = false;
          if (res.success) {
            this.orders = res.data || [];
            this.pagination = res.pagination;
            this.pruneSelection();
          }
        },
        error: (err) => {
          if (token !== this.loadToken) return;
          this.isLoading = false;
          this.loadError = err?.error?.message || 'Unable to load orders from the server.';
        },
      });
  }

  public onFilterChange(): void {
    this.loadOrders(1);
  }

  /** Waits for a pause in typing before querying the server. */
  public onSearchChanged(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadOrders(1), 300);
  }

  /**
   * Drops selected ids that the server no longer returns anywhere. Ids on
   * other pages of the same result set are kept, so paging through a large
   * selection does not silently lose it.
   */
  private pruneSelection(): void {
    if (this.selectedIds.size === 0) return;
    const stillListed = new Set(this.orders.map((o) => o.id));
    const total = this.pagination?.total ?? this.orders.length;
    const singlePage = total <= this.orders.length;
    if (!singlePage) return;

    for (const id of Array.from(this.selectedIds)) {
      if (!stillListed.has(id)) this.selectedIds.delete(id);
    }
  }

  public get pageNumbers(): number[] {
    if (!this.pagination) return [1];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }

  public get paginationStart(): number {
    if (!this.pagination || this.pagination.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  public get paginationEnd(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total);
  }

  public statusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'is-pending';
      case 'IN_PROGRESS':
        return 'is-progress';
      case 'COMPLETED':
        return 'is-done';
      default:
        return 'is-cancelled';
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────

  public get allVisibleSelected(): boolean {
    return this.orders.length > 0 && this.orders.every((o) => this.selectedIds.has(o.id));
  }

  public get someVisibleSelected(): boolean {
    return !this.allVisibleSelected && this.orders.some((o) => this.selectedIds.has(o.id));
  }

  public toggleOne(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  public toggleSelectAll(checked: boolean): void {
    for (const order of this.orders) {
      if (checked) this.selectedIds.add(order.id);
      else this.selectedIds.delete(order.id);
    }
  }

  public clearSelection(): void {
    this.selectedIds.clear();
  }

  // ── Details ───────────────────────────────────────────────────────────

  public openDetails(id: number): void {
    this.backOffice.getOrderById(id).subscribe({
      next: (res) => {
        if (res.success) this.detailsOrder = res.data;
      },
      // The global error interceptor raises the toast; nothing to add here.
      error: () => {},
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────

  public confirmSingleDelete(order: BackOfficeOrder): void {
    this.notify.confirm({
      title: 'Delete 1 Order?',
      message: order.bill_number
        ? `Order ${order.order_number} and its invoice ${order.bill_number} will be permanently removed.`
        : `Order ${order.order_number} will be permanently removed.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => this.runDelete([order.id]),
    });
  }

  public confirmBulkDelete(): void {
    const count = this.selectedIds.size;
    if (count === 0) return;

    this.notify.confirm({
      title: `Delete ${count} ${count === 1 ? 'Order' : 'Orders'}?`,
      message: 'Are you sure you want to delete the selected orders and their associated invoices?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => this.runDelete(Array.from(this.selectedIds)),
    });
  }

  private runDelete(ids: number[]): void {
    this.isBusy = true;
    this.backOffice.deleteOrders(ids).subscribe({
      next: (res) => {
        this.isBusy = false;
        const result = res.data;
        for (const row of result.succeeded) this.selectedIds.delete(row.id);
        this.loadOrders(this.currentPage);
        this.reportOutcome(result, 'Orders deleted', res.message);
        // Invoices were removed alongside the orders; the sibling tab must not
        // keep showing them.
        this.invoicesNeedRefresh.emit();
      },
      error: () => {
        this.isBusy = false;
      },
    });
  }

  // ── Bulk discount ─────────────────────────────────────────────────────

  public openDiscountDialog(): void {
    this.discountType = 'FIXED';
    this.discountValue = null;
    this.showDiscountDialog = true;
  }

  public get isDiscountValid(): boolean {
    const value = Number(this.discountValue);
    if (!Number.isFinite(value) || value < 0) return false;
    return this.discountType !== 'PERCENTAGE' || value <= 100;
  }

  public applyDiscount(): void {
    if (!this.isDiscountValid || this.selectedIds.size === 0) return;

    this.isBusy = true;
    this.backOffice
      .applyDiscount(Array.from(this.selectedIds), this.discountType, Number(this.discountValue))
      .subscribe({
        next: (res) => {
          this.isBusy = false;
          this.showDiscountDialog = false;
          this.loadOrders(this.currentPage);
          this.reportOutcome(res.data, 'Discount applied', res.message);
          this.invoicesNeedRefresh.emit();
        },
        error: () => {
          this.isBusy = false;
        },
      });
  }

  // ── Create order ──────────────────────────────────────────────────────

  public openCreateForm(): void {
    this.draftOrderType = 'WALK_IN';
    this.draftPaymentMethod = 'CASH';
    this.draftCustomerId = null;
    this.draftTableId = null;
    this.draftDiscountType = 'FIXED';
    this.draftDiscountValue = null;
    this.draftNotes = '';
    this.draftLines = [];
    this.pickerProductId = null;
    this.pickerQuantity = 1;
    this.showCreateForm = true;

    this.loadFormReferenceData();
  }

  private loadFormReferenceData(): void {
    if (this.products.length === 0) {
      this.productService.getProducts(1, 500, undefined, undefined, 'ACTIVE').subscribe({
        next: (res) => {
          if (!res.success) return;
          this.products = res.data || [];
          this.productOptions = this.products.map((p) => ({
            value: p.id,
            label: p.name,
            icon: 'lunch_dining',
            description: p.sku,
            badge: String(p.selling_price),
          }));
        },
        error: () => {},
      });
    }

    if (this.customerOptions.length <= 1) {
      this.customerService.getCustomers(1, 500).subscribe({
        next: (res) => {
          if (!res.success) return;
          this.customerOptions = [
            { value: null, label: 'Walk-In Guest', icon: 'person' },
            ...(res.data || []).map((c) => ({
              value: c.id,
              label: c.name,
              icon: 'account_circle',
              description: c.phone,
            })),
          ];
        },
        error: () => {},
      });
    }
  }

  public onDraftOrderTypeChange(): void {
    if (this.draftOrderType !== 'DINING') {
      this.draftTableId = null;
      return;
    }

    this.diningService.getTables().subscribe({
      next: (res) => {
        if (!res.success) return;
        this.tableOptions = (res.data || [])
          .filter((t) => t.status === 'AVAILABLE')
          .map((t) => ({
            value: t.id,
            label: `Table ${t.table_number}`,
            icon: 'table_bar',
            description: t.name || t.section,
          }));
      },
      error: () => {},
    });
  }

  public addLine(): void {
    const productId = Number(this.pickerProductId);
    const quantity = Math.max(1, Math.floor(Number(this.pickerQuantity) || 0));
    const product = this.products.find((p) => p.id === productId);

    if (!product) {
      this.notify.warning('Pick a product before adding a line.');
      return;
    }

    const existing = this.draftLines.find((l) => l.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.draftLines.push({
        productId,
        productName: product.name,
        unitPrice: Number(product.selling_price) || 0,
        quantity,
      });
    }

    this.pickerProductId = null;
    this.pickerQuantity = 1;
  }

  public removeLine(index: number): void {
    this.draftLines.splice(index, 1);
  }

  public get draftSubtotal(): number {
    return this.draftLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  }

  public submitCreateForm(): void {
    if (this.draftLines.length === 0) return;

    if (this.draftOrderType === 'DINING' && !this.draftTableId) {
      this.notify.warning('A dine-in order needs a table.');
      return;
    }

    const items: BackOfficeOrderLine[] = this.draftLines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    this.isBusy = true;
    this.backOffice
      .createOrder({
        customerId: this.draftCustomerId,
        diningTableId: this.draftOrderType === 'DINING' ? this.draftTableId : null,
        orderType: this.draftOrderType,
        discountType: this.draftDiscountType,
        discountValue: Number(this.draftDiscountValue) || 0,
        paymentMethod: this.draftPaymentMethod,
        notes: this.draftNotes || undefined,
        items,
      })
      .subscribe({
        next: (res) => {
          this.isBusy = false;
          if (!res.success) return;
          this.showCreateForm = false;
          const invoiceNumber = res.data?.invoice?.bill_number;
          this.notify.success(
            invoiceNumber
              ? `Order ${res.data?.order?.order_number} created and invoice ${invoiceNumber} raised.`
              : `Order ${res.data?.order?.order_number} created.`
          );
          this.loadOrders(1);
          this.invoicesNeedRefresh.emit();
        },
        error: () => {
          this.isBusy = false;
        },
      });
  }

  // ── Outcome reporting ─────────────────────────────────────────────────

  /**
   * A run where everything went through is a toast; a run with any rejection
   * opens the report instead, so partial failures cannot slip past as success.
   */
  private reportOutcome(result: BulkResult | undefined, title: string, message?: string): void {
    if (!result) return;

    if (result.failed.length > 0) {
      this.bulkResultTitle = title;
      this.bulkResult = result;
      return;
    }

    this.notify.success(message || title);
  }
}

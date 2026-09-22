import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models';
import { BackOfficeService, BulkResult } from '../../core/services/back-office.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { BackOfficeResultComponent } from './back-office-result.component';

type Bin = 'ORDERS' | 'INVOICES';

/**
 * Withdrawn orders and invoices, and the way back.
 *
 * Deleting here has always been a withdrawal rather than a purge — the row and
 * all its items, payments and history survive — but until now nothing showed
 * them, so a withdrawal could not actually be undone from the panel.
 *
 * A withdrawn document holds no number: withdrawing releases it so the day can
 * renumber without a gap. Every row therefore reads its `released_number`, the
 * number it gave up, recorded in `delete_json` at the moment it was taken away.
 * That is what lets an operator find "the invoice that used to be INV-…-0002"
 * after the register has moved on and reissued that number to someone else.
 */
@Component({
  selector: 'app-back-office-deleted',
  standalone: true,
  imports: [CommonModule, FormsModule, AppCurrencyPipe, BackOfficeResultComponent],
  template: `
    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- TOOLBAR                                                          -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="filter-toolbar-card">
      <div class="filter-controls-group">
        <div class="bo-bin-switch">
          <button
            type="button"
            class="bo-bin-btn"
            [class.is-active]="bin === 'ORDERS'"
            (click)="switchBin('ORDERS')"
          >
            <span class="material-symbols-outlined">receipt_long</span>
            <span>Deleted Orders</span>
          </button>
          <button
            type="button"
            class="bo-bin-btn"
            [class.is-active]="bin === 'INVOICES'"
            (click)="switchBin('INVOICES')"
          >
            <span class="material-symbols-outlined">description</span>
            <span>Deleted Invoices</span>
          </button>
        </div>

        <div class="search-input-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
            placeholder="Search released number or customer…"
            class="toolbar-search-input"
          />
        </div>

        <span class="toolbar-meta-count">
          {{ pagination?.total || rows.length }} withdrawn
        </span>
      </div>

      <div class="toolbar-actions-group">
        <button type="button" (click)="load(currentPage)" class="action-btn btn-outline-purple" title="Refresh">
          <span class="material-symbols-outlined">refresh</span>
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- SELECTION TOOLBAR                                                -->
    <!-- ════════════════════════════════════════════════════════════════ -->
    <div class="bo-selection-bar" *ngIf="selectedIds.size > 0">
      <div class="bo-selection-count">
        <span class="material-symbols-outlined">check_circle</span>
        <strong>{{ selectedIds.size }}</strong>
        <span>Selected</span>
      </div>

      <div class="bo-selection-actions">
        <button type="button" class="action-btn btn-gradient-purple" (click)="confirmBulkRestore()" [disabled]="isBusy">
          <span class="material-symbols-outlined">restore_from_trash</span>
          <span>Restore Selected</span>
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════ -->
    <!-- TABLE                                                            -->
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
                  title="Select all visible records"
                  [checked]="allVisibleSelected"
                  [indeterminate]="someVisibleSelected"
                  (change)="toggleSelectAll($any($event.target).checked)"
                />
              </th>
              <th style="width: 20%;">Released # &amp; Date</th>
              <th style="width: 16%;">Customer</th>
              <th style="width: 17%;">{{ bin === 'ORDERS' ? 'Invoice' : 'Order' }}</th>
              <th style="width: 11%;">Total</th>
              <th style="width: 22%;">Withdrawn</th>
              <th style="width: 96px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows" [class.bo-row-selected]="selectedIds.has(row.id)">
              <td style="text-align: center;">
                <input
                  type="checkbox"
                  class="bo-checkbox"
                  [title]="'Select ' + (row.released_number || ('#' + row.id))"
                  [checked]="selectedIds.has(row.id)"
                  (change)="toggleOne(row.id, $any($event.target).checked)"
                />
              </td>

              <td>
                <div class="bo-cell-flex">
                  <div class="bo-row-icon is-withdrawn">
                    <span class="material-symbols-outlined" style="font-size: 19px;">delete</span>
                  </div>
                  <div class="min-w-0">
                    <!--
                      The number this record gave up. Not order_number /
                      bill_number — those are NULL on a withdrawn row, and the
                      number itself may already belong to a different record.
                    -->
                    <div class="font-mono font-bold text-xs bo-released-num">
                      {{ row.released_number || '—' }}
                      <span class="bo-released-tag" *ngIf="row.released_number">released</span>
                    </div>
                    <div class="bo-cell-sub font-mono">
                      {{ row.created_at | date: 'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <div class="font-bold text-xs bo-text-main truncate">{{ row.customer_name || 'Walk-In Guest' }}</div>
                <div class="bo-cell-sub font-mono">
                  {{ row.customer_phone || (row.item_count || 0) + ' item(s)' }}
                </div>
              </td>

              <td>
                <span class="bo-invoice-link" *ngIf="counterpartOf(row) as counterpart">
                  <span class="material-symbols-outlined" style="font-size: 14px;">link</span>
                  {{ counterpart }}
                </span>
                <span
                  *ngIf="!counterpartOf(row)"
                  class="bo-cell-none"
                >
                  {{ bin === 'ORDERS' ? 'Not invoiced' : 'No order' }}
                </span>
              </td>

              <td>
                <span class="font-mono font-black text-xs bo-cell-muted">
                  {{ row.total_amount | appCurrency: '1.2-2' }}
                </span>
              </td>

              <td>
                <div class="bo-cell-strong bo-text-main truncate">
                  {{ row.deleted_by_name || 'Unknown' }}
                </div>
                <div class="bo-cell-sub font-mono">
                  {{ row.deleted_at | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="bo-cell-faint truncate" [title]="row.delete_reason || ''">
                  {{ row.delete_reason || '—' }}
                </div>
              </td>

              <td style="text-align: center;">
                <button
                  type="button"
                  class="btn-action-icon is-restore"
                  title="Restore this record"
                  [disabled]="isBusy"
                  (click)="confirmRestore(row)"
                >
                  <span class="material-symbols-outlined" style="font-size: 17px;">restore_from_trash</span>
                </button>
              </td>
            </tr>

            <tr *ngIf="rows.length === 0">
              <td colspan="7" class="empty-state-cell">
                <div class="empty-state-box">
                  <span class="material-symbols-outlined empty-icon">
                    {{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'delete_forever' }}
                  </span>
                  <div class="empty-title">
                    {{
                      isLoading
                        ? 'Loading…'
                        : loadError
                        ? 'Could not load withdrawn records'
                        : 'Nothing Withdrawn'
                    }}
                  </div>
                  <p class="empty-desc">
                    {{
                      isLoading
                        ? 'Fetching withdrawn records…'
                        : loadError
                        ? loadError
                        : 'No ' +
                          (bin === 'ORDERS' ? 'orders' : 'invoices') +
                          ' have been withdrawn, or none match this search.'
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
          <strong>{{ pagination.total }}</strong> withdrawn
        </div>
        <div class="pagination-controls">
          <button
            type="button"
            class="page-nav-btn"
            title="Previous page"
            [disabled]="currentPage <= 1"
            (click)="load(currentPage - 1)"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            type="button"
            class="page-num-btn"
            *ngFor="let page of pageNumbers"
            [class.is-active]="currentPage === page"
            (click)="load(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="page-nav-btn"
            title="Next page"
            [disabled]="currentPage >= pagination.totalPages"
            (click)="load(currentPage + 1)"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
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
      .bo-bin-switch {
        display: inline-flex;
        gap: 0.25rem;
        padding: 0.2rem;
        border-radius: 0.6rem;
        background: var(--card-border, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
      }
      .bo-bin-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.75rem;
        border: none;
        border-radius: 0.45rem;
        background: transparent;
        color: var(--primary-variant, #6B21A8);
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .bo-bin-btn .material-symbols-outlined {
        font-size: 1rem;
      }
      .bo-bin-btn.is-active {
        background: var(--card-bg, #FFFFFF);
        color: var(--primary, #7E22CE);
        box-shadow: var(--shadow-sm, 0 1px 4px rgba(var(--text-main-rgb, 46, 16, 101), 0.14));
      }
      .bo-row-icon.is-withdrawn {
        background: var(--danger-light, #FEE2E2);
        color: var(--danger, #B91C1C);
      }
      .bo-released-num {
        color: var(--danger, #B91C1C);
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .bo-released-tag {
        font-family: inherit;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 1px 5px;
        border-radius: 9999px;
        background: var(--danger-light, #FEE2E2);
        color: var(--danger, #B91C1C);
        border: 1px solid var(--danger-light, #FECACA);
      }
      /* Green counterpart to the existing .btn-action-icon.is-danger. */
      .btn-action-icon.is-restore {
        color: var(--success, #15803D);
        border-color: var(--success-light, #BBF7D0);
        background: var(--success-light, #F0FDF4);
      }
      .btn-action-icon.is-restore:hover:not(:disabled) {
        background: var(--success-light, #DCFCE7);
      }

      /* ───────────────────────────────────────────────────────────────
         Table and toolbar primitives carried from the Orders and Invoices
         panels. They are declared inside those components' own styles
         blocks, so they are scoped there and do not reach this one.
         ─────────────────────────────────────────────────────────────── */
      .bo-checkbox {
        width: 16px;
        height: 16px;
        accent-color: var(--primary, #7E22CE);
        cursor: pointer;
      }
      .bo-invoice-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary, #7E22CE);
        background: var(--primary-subtle, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 0.4rem;
        padding: 0.12rem 0.4rem;
      }
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
        box-shadow: 0 8px 22px -6px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.5));
      }
      .bo-selection-count {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--card-bg, #FFFFFF);
        font-size: 0.82rem;
        font-weight: 700;
      }
      .bo-selection-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .bo-text-main {
        color: var(--text-main, #2e1065);
      }

      /* styles.css carries a hand-rolled utility layer with no arbitrary-value
         support, so Tailwind-shaped classes like text-[10px] match nothing.
         These are the real rules the cells need. */
      .bo-cell-flex {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }
      .bo-cell-sub {
        font-size: 10px;
        color: var(--text-muted, #6B7280);
      }
      .bo-cell-strong {
        font-size: 11px;
        font-weight: 600;
      }
      .bo-cell-muted {
        color: var(--text-muted, #6B7280);
      }
      .bo-cell-faint {
        font-size: 10px;
        color: var(--text-dim, #9CA3AF);
      }
      .bo-cell-none {
        font-size: 10px;
        font-weight: 600;
        color: var(--text-dim, #9CA3AF);
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
      .bo-row-icon {
        width: 34px;
        height: 34px;
        border-radius: 0.7rem;
        background: var(--card-border, #F3E8FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7E22CE);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .bo-row-selected {
        background: var(--primary-subtle, rgba(var(--primary-rgb, 126, 34, 206), 0.06)) !important;
      }
    `,
  ],
})
export class BackOfficeDeletedComponent implements OnInit {
  /** Raised after a restore so the active Orders and Invoices grids reload. */
  @Output() restored = new EventEmitter<void>();

  private backOffice = inject(BackOfficeService);
  private notify = inject(NotificationService);

  public bin: Bin = 'ORDERS';
  public rows: any[] = [];
  public pagination: any = null;
  public currentPage = 1;
  public pageSize = 20;
  public search = '';
  public isLoading = false;
  public isBusy = false;
  public loadError: string | null = null;

  public selectedIds = new Set<number>();
  public bulkResult: BulkResult | null = null;
  public bulkResultTitle = '';

  private searchTimer: any = null;

  ngOnInit(): void {
    this.load(1);
  }

  public switchBin(bin: Bin): void {
    if (this.bin === bin) return;
    this.bin = bin;
    // Ids are only unique within a table, so a selection carried across would
    // restore whichever record happened to share the number.
    this.selectedIds.clear();
    this.load(1);
  }

  public onSearchChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(1), 300);
  }

  public load(page = 1): void {
    this.isLoading = true;
    this.loadError = null;
    this.currentPage = page;

    const filters = { page, limit: this.pageSize, search: this.search.trim() || undefined };
    // Widened deliberately: the two calls differ only in row type, and the
    // grid reads the same fields from either, but TypeScript will not pick a
    // `.subscribe` overload off a union of two Observable generics.
    const request$: Observable<ApiResponse<any[]>> =
      this.bin === 'ORDERS'
        ? (this.backOffice.getDeletedOrders(filters) as Observable<ApiResponse<any[]>>)
        : (this.backOffice.getDeletedInvoices(filters) as Observable<ApiResponse<any[]>>);

    request$.subscribe({
      next: (res) => {
        this.isLoading = false;
        this.rows = (res.data as any[]) || [];
        this.pagination = res.pagination || null;
        this.selectedIds.clear();
      },
      error: (err) => {
        this.isLoading = false;
        this.rows = [];
        this.pagination = null;
        this.loadError = err?.error?.message || 'Unable to load withdrawn records.';
      },
    });
  }

  /**
   * The number of the document on the other side of this one.
   *
   * Either side may itself be withdrawn, so the live number is tried first and
   * the released one second — an order withdrawn together with its invoice has
   * only the released number to show.
   */
  public counterpartOf(row: any): string | null {
    if (this.bin === 'ORDERS') {
      return row.bill_number || row.bill_released_number || null;
    }
    return row.order_number || row.order_released_number || null;
  }

  // ── Selection ─────────────────────────────────────────────────────────

  public get allVisibleSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((row) => this.selectedIds.has(row.id));
  }

  public get someVisibleSelected(): boolean {
    const picked = this.rows.filter((row) => this.selectedIds.has(row.id)).length;
    return picked > 0 && picked < this.rows.length;
  }

  public toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.rows.forEach((row) => this.selectedIds.add(row.id));
    } else {
      this.rows.forEach((row) => this.selectedIds.delete(row.id));
    }
  }

  public toggleOne(id: number, checked: boolean): void {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  // ── Pagination ────────────────────────────────────────────────────────

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

  // ── Restore ───────────────────────────────────────────────────────────

  public confirmRestore(row: any): void {
    const label = row.released_number || `#${row.id}`;
    const noun = this.bin === 'ORDERS' ? 'Order' : 'Invoice';

    this.notify.confirm({
      title: `Restore ${noun}?`,
      // The number is not given back: it rejoins its day in creation order and
      // the day renumbers, so it may well come back reading differently.
      message:
        `${noun} ${label} will be put back into the register. It rejoins its day in creation ` +
        `order, so it and the records after it will be renumbered — it may return under a ` +
        `different number than the one it was withdrawn with.`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: () => this.restoreOne(row.id),
    });
  }

  private restoreOne(id: number): void {
    this.isBusy = true;
    const request$ =
      this.bin === 'ORDERS' ? this.backOffice.restoreOrder(id) : this.backOffice.restoreInvoice(id);

    request$.subscribe({
      next: (res) => {
        this.isBusy = false;
        this.notify.success(res.message || 'Record restored.');
        this.load(this.currentPage);
        this.restored.emit();
      },
      error: (err) => {
        this.isBusy = false;
        this.notify.error(err?.error?.message || 'Failed to restore the record.');
      },
    });
  }

  public confirmBulkRestore(): void {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const noun = this.bin === 'ORDERS' ? 'order(s)' : 'invoice(s)';
    this.notify.confirm({
      title: 'Restore Selected?',
      message:
        `${ids.length} withdrawn ${noun} will be put back into the register. Each rejoins its ` +
        `day in creation order, so the affected days will be renumbered.`,
      confirmText: 'Restore All',
      cancelText: 'Cancel',
      isDestructive: false,
      onConfirm: () => this.restoreMany(ids),
    });
  }

  private restoreMany(ids: number[]): void {
    this.isBusy = true;
    const request$ =
      this.bin === 'ORDERS' ? this.backOffice.restoreOrders(ids) : this.backOffice.restoreInvoices(ids);

    request$.subscribe({
      next: (res) => {
        this.isBusy = false;
        // A run that rejected some records must not read as a clean success.
        if (res.data && res.data.failed && res.data.failed.length > 0) {
          this.bulkResultTitle = this.bin === 'ORDERS' ? 'Orders restored' : 'Invoices restored';
          this.bulkResult = res.data;
        } else {
          this.notify.success(res.message || 'Records restored.');
        }
        this.load(this.currentPage);
        this.restored.emit();
      },
      error: (err) => {
        this.isBusy = false;
        this.notify.error(err?.error?.message || 'Failed to restore the selected records.');
      },
    });
  }
}

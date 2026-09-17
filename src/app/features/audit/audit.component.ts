import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../core/services/audit.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent],
  template: `
    <div class="audit-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Security & Compliance</span>
        <span class="breadcrumb-separator">›</span>
        <span>System Audit</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Activity Stream</span>
      </div>

      <div class="audit-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">security</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Security & Operational Audit Logs</h1>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">receipt_long</span>
                <span>Records: <strong>{{ pagination?.total || logs.length }}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadLogs(1)"
            [disabled]="isLoading"
            class="audit-btn btn-outline-purple"
            title="Refresh logs from server"
          >
            <span class="material-symbols-outlined" [class.spin-icon]="isLoading">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="audit-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION MODULE TABS                                   -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="setModule('')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === ''"
        >
          <span class="material-symbols-outlined">dataset</span>
          <span>All Modules</span>
          <span class="tab-count-badge">{{ pagination?.total || logs.length }}</span>
        </button>

        <button
          type="button"
          (click)="setModule('AUTH')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === 'AUTH'"
        >
          <span class="material-symbols-outlined">lock_open</span>
          <span>Auth & Logins</span>
        </button>

        <button
          type="button"
          (click)="setModule('CHECKOUT')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === 'CHECKOUT'"
        >
          <span class="material-symbols-outlined">point_of_sale</span>
          <span>Checkout & Sales</span>
        </button>

        <button
          type="button"
          (click)="setModule('PRODUCTS')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === 'PRODUCTS'"
        >
          <span class="material-symbols-outlined">inventory_2</span>
          <span>Price & Products</span>
        </button>

        <button
          type="button"
          (click)="setModule('STOCK')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === 'STOCK'"
        >
          <span class="material-symbols-outlined">warehouse</span>
          <span>Stock Adjustments</span>
        </button>

        <button
          type="button"
          (click)="setModule('SETTINGS')"
          class="module-tab-btn"
          [class.is-active]="selectedModule === 'SETTINGS'"
        >
          <span class="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. KPI METRIC MINI CARDS STRIP                                  -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- 1. Total Records -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Records</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ pagination?.total || logs.length }}</span>
            <span class="kpi-pill pill-live">● Live</span>
          </div>
        </div>

        <!-- 3. Price & Product Edits -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Price Edits</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">sell</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countAction('PRICE') }}</span>
            <span class="kpi-pill pill-purple">Audited</span>
          </div>
        </div>

        <!-- 4. Stock Edits -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Stock Edits</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">inventory</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countAction('STOCK') }}</span>
            <span class="kpi-pill pill-amber">Tracked</span>
          </div>
        </div>

        <!-- 5. Login Events -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Login Events</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">badge</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countAction('LOGIN') }}</span>
            <span class="kpi-pill pill-success">Tracked</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. FILTER & SEARCH ACTION TOOLBAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <!-- Search Box -->
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search audit log"
              type="text"
              [(ngModel)]="searchAction"
              (ngModelChange)="onSearchChanged()"
              placeholder="Search by action, user, module or payload diff..."
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchAction"
              (click)="clearSearch()"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Module Selector -->
          <app-custom-dropdown
            [options]="moduleOptions"
            [(ngModel)]="selectedModule"
            (valueChange)="onModuleDropdownChange($event)"
            placeholder="All Event Modules"
            minWidth="230px"
          ></app-custom-dropdown>

          <span class="results-counter-pill">
            Showing {{ pagination?.total || logs.length }} logs
          </span>
        </div>

        <div class="filter-actions-group">
          <button
            type="button"
            (click)="loadLogs(1)"
            class="audit-btn btn-sm btn-outline-purple"
            title="Refresh stream"
          >
            <span class="material-symbols-outlined text-[17px]" [class.spin-icon]="isLoading">refresh</span>
            <span>Reload</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="audit-btn btn-sm btn-outline-purple"
            title="Download CSV report"
          >
            <span class="material-symbols-outlined text-[17px]">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. AUDIT LOGS DATA TABLE                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="audit-data-table">
            <thead>
              <tr>
                <th style="width: 17%;">Timestamp</th>
                <th style="width: 20%;">Operator / User</th>
                <th style="width: 18%;">Action Performed</th>
                <th style="width: 12%;">Module</th>
                <th style="width: 8%;">Record #</th>
                <th style="width: 25%;">Payload Diff & Changes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs" class="audit-row">
                <!-- Timestamp -->
                <td>
                  <div class="timestamp-box">
                    <span class="material-symbols-outlined time-icon">schedule</span>
                    <span class="time-text">{{ log.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                  </div>
                </td>

                <!-- Operator -->
                <td>
                  <div class="operator-cell">
                    <div class="operator-avatar">
                      <span class="material-symbols-outlined">person</span>
                    </div>
                    <div class="operator-details">
                      <div class="operator-name">{{ log.user_name || 'System Auto' }}</div>
                      <div class="operator-username">&#64;{{ log.username || 'system' }}</div>
                    </div>
                  </div>
                </td>

                <!-- Action Name Badge -->
                <td>
                  <span
                    class="action-badge"
                    [ngClass]="getActionBadgeClass(log.action)"
                  >
                    {{ log.action }}
                  </span>
                </td>

                <!-- Module -->
                <td>
                  <span class="module-badge">
                    {{ log.module }}
                  </span>
                </td>

                <!-- Record # -->
                <td>
                  <span class="record-id-badge">{{ log.record_id || '—' }}</span>
                </td>

                <!-- Diff Values -->
                <td>
                  <div class="payload-diff-container">
                    <div *ngIf="log.new_values" class="diff-line text-addition">
                      <span class="diff-sign">+</span>
                      <span class="diff-code">{{ stringify(log.new_values) }}</span>
                    </div>
                    <div *ngIf="log.old_values" class="diff-line text-deletion">
                      <span class="diff-sign">-</span>
                      <span class="diff-code">{{ stringify(log.old_values) }}</span>
                    </div>
                    <div *ngIf="!log.new_values && !log.old_values" class="no-diff-text">
                      No payload diff recorded
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="logs.length === 0 && !isLoading">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">folder_open</span>
                    <div class="empty-title">No Audit Logs Found</div>
                    <p class="empty-desc">No compliance events match your selected filters or search query.</p>
                    <button type="button" (click)="resetFilters()" class="audit-btn btn-sm btn-outline-purple mt-2">
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="pagination-footer-bar" *ngIf="pagination && pagination.total > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ pagination.total }}</strong> log entries
          </div>

          <div class="pagination-controls">
            <button
              type="button"
              [disabled]="currentPage <= 1"
              (click)="changePage(currentPage - 1)"
              class="page-nav-btn"
              title="Previous page"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              *ngFor="let page of pageNumbers"
              (click)="changePage(page)"
              class="page-num-btn"
              [class.is-active]="currentPage === page"
            >
              {{ page }}
            </button>

            <button
              type="button"
              [disabled]="currentPage >= pagination.totalPages"
              (click)="changePage(currentPage + 1)"
              class="page-nav-btn"
              title="Next page"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
})
export class AuditComponent implements OnInit {
  public settingsService = inject(SettingsService);
  private auditService = inject(AuditLogService);
  private notify = inject(NotificationService);

  public logs: any[] = [];
  public pagination: any = null;
  public selectedModule = '';
  public searchAction = '';
  public pageSize = 10;
  public currentPage = 1;
  public isLoading = false;

  public moduleOptions: DropdownOption[] = [
    { value: '', label: 'All Event Modules', icon: 'dataset' },
    { value: 'AUTH', label: 'Auth & Login Events', icon: 'lock_open', description: 'Logins, logouts & permissions' },
    { value: 'CHECKOUT', label: 'Checkout & Billing', icon: 'point_of_sale', description: 'Invoices, payments & sales' },
    { value: 'PRODUCTS', label: 'Products & Pricing', icon: 'inventory_2', description: 'Item creation & price edits' },
    { value: 'CATEGORIES', label: 'Categories', icon: 'category', description: 'Menu sections & categories' },
    { value: 'STOCK', label: 'Inventory & Stock', icon: 'warehouse', description: 'Inward, stockouts & adjustments' },
    { value: 'DINING', label: 'Dining & Tables', icon: 'table_restaurant', description: 'Table allocations & layout' },
    { value: 'ORDERS', label: 'Orders & KOT', icon: 'receipt_long', description: 'Kitchen orders & ticket state' },
    { value: 'SETTINGS', label: 'System Settings', icon: 'settings', description: 'Brand, receipt & system config' },
    { value: 'USERS', label: 'Users & Staff', icon: 'group', description: 'Staff accounts & role changes' },
  ];

  ngOnInit(): void {
    this.loadLogs(1);
  }

  loadLogs(page = 1): void {
    this.currentPage = page;
    this.isLoading = true;
    this.auditService
      .getLogs(page, this.pageSize, this.selectedModule || undefined, this.searchAction || undefined)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.logs = res.data;
            this.pagination = res.pagination;
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setModule(mod: string): void {
    this.selectedModule = mod;
    this.currentPage = 1;
    this.loadLogs(1);
  }

  onModuleDropdownChange(mod: string): void {
    this.selectedModule = mod;
    this.currentPage = 1;
    this.loadLogs(1);
  }

  onSearchChanged(): void {
    this.currentPage = 1;
    this.loadLogs(1);
  }

  clearSearch(): void {
    this.searchAction = '';
    this.currentPage = 1;
    this.loadLogs(1);
  }

  resetFilters(): void {
    this.selectedModule = '';
    this.searchAction = '';
    this.currentPage = 1;
    this.loadLogs(1);
  }

  countAction(pattern: string): number {
    return this.logs.filter((l) => (l.action && l.action.includes(pattern)) || (l.module && l.module.includes(pattern))).length;
  }

  getActionBadgeClass(action: string): string {
    if (!action) return 'action-badge-purple';
    const a = action.toUpperCase();
    if (a.includes('CREATE') || a.includes('LOGIN') || a.includes('INSERT') || a.includes('ADD')) {
      return 'action-badge-success';
    }
    if (a.includes('DELETE') || a.includes('CANCEL') || a.includes('REMOVE') || a.includes('FAIL')) {
      return 'action-badge-danger';
    }
    if (a.includes('WARN') || a.includes('STOCK')) {
      return 'action-badge-warning';
    }
    return 'action-badge-purple';
  }

  get pageNumbers(): number[] {
    if (!this.pagination || !this.pagination.totalPages) return [1];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    if (!this.pagination || this.pagination.total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    if (!this.pagination) return 0;
    return Math.min(this.currentPage * this.pageSize, this.pagination.total);
  }

  changePage(p: number): void {
    this.loadLogs(p);
  }

  exportCSV(): void {
    if (!this.logs || this.logs.length === 0) {
      this.notify.warning('No audit logs to export.');
      return;
    }
    const items = this.logs;
    const headers = ['Timestamp', 'User', 'Username', 'Action', 'Module', 'Record ID', 'New Values', 'Old Values'];
    const rows = items.map((l) => [
      l.created_at,
      `"${l.user_name || 'System'}"`,
      l.username || '',
      l.action,
      l.module,
      l.record_id || '',
      `"${this.stringify(l.new_values).replace(/"/g, '""')}"`,
      `"${this.stringify(l.old_values).replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Audit log CSV exported successfully!');
  }

  stringify(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  }
}

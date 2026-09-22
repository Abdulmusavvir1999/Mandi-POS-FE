import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueueService } from '../../core/services/queue.service';
import { NotificationService } from '../../core/services/notification.service';
import { QueueToken } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';

import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule],
  template: `
    <div class="module-page-wrapper">
      <app-page-loader
        [loading]="isLoading"
        [error]="loadError"
        message="Loading token queue…"
        subMessage="Fetching live queue tokens from the server."
        icon="confirmation_number"
        (retry)="loadTokens()"
      ></app-page-loader>
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Kitchen & Counter</span>
        <span class="breadcrumb-separator">›</span>
        <span>Takeaway Dispatch</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Live Token Board</span>
      </div>

      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">soup_kitchen</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Takeaway Queue & Token Board</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ readyTokens.length + preparingTokens.length }} Live In Queue</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">check_circle</span>
                <span>Ready for Pickup: <strong>{{ readyTokens.length }} Orders</strong></span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">skillet</span>
                <span>In Kitchen: <strong>{{ preparingTokens.length }} Orders</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadTokens()"
            class="action-btn btn-outline-purple"
            title="Refresh Token Board"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="showIssueModal = true"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">confirmation_number</span>
            <span>Issue Token</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- KPI 1 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Tokens</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">confirmation_number</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ allTokens.length }}</span>
            <span class="kpi-pill pill-purple">Today</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Ready for Pickup</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">check_circle</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ readyTokens.length }}</span>
            <span class="kpi-pill pill-live">● Call Counter</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Cooking in Kitchen</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">soup_kitchen</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-amber-700">{{ preparingTokens.length }}</span>
            <span class="kpi-pill pill-amber">Preparing</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Pending Prep</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">schedule</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countPending() }}</span>
            <span class="kpi-pill pill-blue">In Queue</span>
          </div>
        </div>

        <!-- KPI 5 -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Avg Est. Prep</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">timer</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-purple-700">{{ avgEstimatedMinutes | number:'1.0-0' }} mins</span>
            <span class="kpi-pill pill-purple">Estimate</span>
          </div>
        </div>

        <!-- KPI 6 -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Fulfillment</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">verified</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ completionPercent | number:'1.0-1' }}%</span>
            <span class="kpi-pill pill-success">✓ Completed</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. LIVE PICKUP & PREPARATION CALLOUT DISPLAY                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Ready for Pickup (Completed) -->
        <div class="kpi-card card-accent-green !p-5">
          <div class="flex items-center justify-between border-b border-[#E9D5FF] pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center border border-[#86EFAC]">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <h3 class="text-sm font-black text-[#16A34A] uppercase tracking-wider">Ready for Pickup</h3>
                <p class="text-xs text-[#6B7280]">Call guest to collection counter</p>
              </div>
            </div>
            <span class="status-dot-pill is-active">
              <span class="status-dot"></span>
              {{ readyTokens.length }} Ready
            </span>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <div
              *ngFor="let token of readyTokens"
              class="px-4 py-3 rounded-xl bg-[#DCFCE7] border-2 border-[#16A34A] text-[#16A34A] font-mono font-black text-xl shadow-xs flex flex-col items-center justify-center min-w-[100px]"
            >
              <span>{{ token.queue_number }}</span>
              <span class="text-[10px] text-emerald-800 font-sans font-bold mt-0.5">{{ token.customer_name || 'Guest' }}</span>
            </div>
            <div *ngIf="readyTokens.length === 0" class="text-xs text-[#6B7280] italic py-3">
              No orders waiting for pickup right now.
            </div>
          </div>
        </div>

        <!-- Preparing in Kitchen (In Progress) -->
        <div class="kpi-card card-accent-amber !p-5">
          <div class="flex items-center justify-between border-b border-[#E9D5FF] pb-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center border border-[#FED7AA]">
                <span class="material-symbols-outlined">soup_kitchen</span>
              </div>
              <div>
                <h3 class="text-sm font-black text-[#EA580C] uppercase tracking-wider">Preparing in Kitchen</h3>
                <p class="text-xs text-[#6B7280]">Chefs packing  & sides</p>
              </div>
            </div>
            <span class="status-dot-pill is-warning">
              <span class="status-dot"></span>
              {{ preparingTokens.length }} Cooking
            </span>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <div
              *ngFor="let token of preparingTokens"
              class="px-4 py-3 rounded-xl bg-[#FFEDD5] border border-[#EA580C] text-[#EA580C] font-mono font-black text-xl flex flex-col items-center justify-center min-w-[100px]"
            >
              <span>{{ token.queue_number }}</span>
              <span class="text-[10px] text-orange-800 font-sans font-bold mt-0.5">{{ token.customer_name || 'Guest' }}</span>
            </div>
            <div *ngIf="preparingTokens.length === 0" class="text-xs text-[#6B7280] italic py-3">
              No orders actively preparing in kitchen.
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. TOKEN LEDGER DATA TABLE                                      -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 14%;">Token #</th>
                <th style="width: 24%;">Guest / Customer</th>
                <th style="width: 14%;">Order Ref</th>
                <th style="width: 14%;">Time Issued</th>
                <th style="width: 12%;">Est. Prep</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 10%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of allTokens">
                <td>
                  <span class="font-mono font-black text-sm text-[#7E22CE] bg-[#FAF5FF] px-2.5 py-1 rounded-lg border border-[#E9D5FF]">
                    {{ t.queue_number }}
                  </span>
                </td>
                <td>
                  <div class="font-bold text-[#2E1065] text-xs">{{ t.customer_name || 'Walk-In Guest' }}</div>
                  <div class="text-[10px] text-[#6B7280] font-mono">{{ t.customer_phone || 'Counter Order' }}</div>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#6B7280]">{{ t.order_number || '—' }}</span>
                </td>
                <td>
                  <span class="font-mono text-xs text-[#6B7280]">{{ t.created_at | date:'HH:mm:ss' }}</span>
                </td>
                <td>
                  <span class="font-mono font-semibold text-xs text-[#2E1065]">{{ t.estimated_minutes }} mins</span>
                </td>
                <td>
                  <span
                    class="badge"
                    [ngClass]="{
                      'badge-success': t.status === 'COMPLETED',
                      'badge-warning': t.status === 'IN_PROGRESS',
                      'badge-info': t.status === 'PENDING',
                      'badge-danger': t.status === 'CANCELLED'
                    }"
                  >
                    {{ t.status }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      *ngIf="t.status === 'PENDING'"
                      type="button"
                      (click)="startToken(t.id)"
                      class="action-btn btn-gradient-purple !py-1 !px-2.5 !text-xs"
                    >
                      <span class="material-symbols-outlined" style="font-size: 15px;">soup_kitchen</span>
                      <span>Start</span>
                    </button>
                    <button
                      *ngIf="t.status === 'IN_PROGRESS'"
                      type="button"
                      (click)="completeToken(t.id)"
                      class="action-btn btn-outline-purple !py-1 !px-2.5 !text-xs !text-[#16A34A] !border-[#86EFAC] hover:!bg-[#DCFCE7]"
                    >
                      <span class="material-symbols-outlined" style="font-size: 15px;">check</span>
                      <span>Ready</span>
                    </button>
                    <button
                      *ngIf="t.status !== 'COMPLETED' && t.status !== 'CANCELLED'"
                      type="button"
                      (click)="cancelToken(t.id)"
                      class="action-btn btn-outline-purple !p-1.5 !text-[#DC2626] hover:!bg-[#FEE2E2]"
                      title="Cancel Token"
                    >
                      <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="allTokens.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'soup_kitchen' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'Queue is Clear' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No takeaway orders or active tokens in the queue system.' }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. ISSUE TOKEN MODAL                                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showIssueModal">
        <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">confirmation_number</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">Issue Takeaway Token</h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Generate queue token for live kitchen display & SMS</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showIssueModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="issueToken()" class="space-y-3.5">
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Customer Name
              </label>
              <input
                title="Customer Name"
                type="text"
                [(ngModel)]="tokenForm.customerName"
                name="customerName"
                class="form-control text-sm w-full"
                placeholder="e.g. Sultan Al-Rashid"
                required
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Customer Phone (Optional)
              </label>
              <input
                title="Customer Phone (Optional)"
                type="tel"
                [(ngModel)]="tokenForm.customerPhone"
                name="customerPhone"
                class="form-control font-mono text-sm w-full"
                placeholder="Mobile number for SMS notification"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Estimated Prep Minutes
              </label>
              <input
                title="Estimated Prep Minutes"
                type="number"
                min="5"
                max="60"
                [(ngModel)]="tokenForm.estimatedMinutes"
                name="estimatedMinutes"
                class="form-control font-mono font-bold text-[#7E22CE] text-sm w-full"
                placeholder="15"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showIssueModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                Issue Token ✓
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class QueueComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private queueService = inject(QueueService);
  private notify = inject(NotificationService);

  public allTokens: QueueToken[] = [];
  public readyTokens: QueueToken[] = [];
  public preparingTokens: QueueToken[] = [];

  public showIssueModal = false;
  public tokenForm: any = {
    customerName: '',
    customerPhone: '',
    estimatedMinutes: 15,
  };

  ngOnInit(): void {
    this.loadTokens();
  }

  loadTokens(): void {
    this.isLoading = true;
    this.loadError = null;
    this.queueService.getQueue().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.allTokens = res.data;
          this.readyTokens = this.allTokens.filter((t) => t.status === 'COMPLETED');
          this.preparingTokens = this.allTokens.filter((t) => t.status === 'IN_PROGRESS');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load data from the server.';
      },
    });
  }

  /** Mean of the estimates entered when tokens were issued. */
  get avgEstimatedMinutes(): number {
    const open = this.allTokens.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    if (open.length === 0) return 0;
    return open.reduce((sum, t) => sum + (Number(t.estimated_minutes) || 0), 0) / open.length;
  }

  /** Share of issued tokens that reached COMPLETED. */
  get completionPercent(): number {
    if (this.allTokens.length === 0) return 0;
    const completed = this.allTokens.filter((t) => t.status === 'COMPLETED').length;
    return (completed / this.allTokens.length) * 100;
  }

  countPending(): number {
    return this.allTokens.filter((t) => t.status === 'PENDING').length;
  }

  issueToken(): void {
    if (!this.tokenForm.customerName) {
      this.notify.error('Please enter customer name');
      return;
    }

    this.queueService.createToken(this.tokenForm).subscribe({
      next: (res) => {
        this.notify.success(`Token ${res.data.queue_number} issued!`);
        this.showIssueModal = false;
        this.tokenForm = { customerName: '', customerPhone: '', estimatedMinutes: 15 };
        this.loadTokens();
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => { },
    });
  }

  startToken(id: number): void {
    this.queueService.startToken(id).subscribe({
      next: () => {
        this.notify.info('Token marked as preparing');
        this.loadTokens();
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => { },
    });
  }

  completeToken(id: number): void {
    this.queueService.completeToken(id).subscribe({
      next: () => {
        this.notify.success('Token is ready for pickup!');
        this.loadTokens();
      },
      // Reported by the global error interceptor; present so a failure
      // cannot escape as an unhandled rejection.
      error: () => { },
    });
  }

  cancelToken(id: number): void {
    this.notify.confirm({
      title: 'Cancel Queue Token',
      message: 'Are you sure you want to cancel this token? The customer will be removed from the queue.',
      confirmText: 'Cancel Token',
      cancelText: 'Keep',
      isDestructive: true,
      onConfirm: () => {
        this.queueService.cancelToken(id).subscribe({
          next: () => {
            this.notify.info('Token cancelled');
            this.loadTokens();
          },
          // Reported by the global error interceptor; present so a failure
          // cannot escape as an unhandled rejection.
          error: () => { },
        });
      },
    });
  }
}

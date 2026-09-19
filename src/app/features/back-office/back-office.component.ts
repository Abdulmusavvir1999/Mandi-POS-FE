import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BackOfficeOrdersComponent } from './back-office-orders.component';
import { BackOfficeInvoicesComponent } from './back-office-invoices.component';

/**
 * Standalone Back-Office, reachable only at `/admin/back-office`.
 *
 * It sits outside the main shell on purpose: there is no sidebar entry, no
 * header entry and no panel navigation pointing at it, so the route is the only
 * way in. Because it renders outside MainLayoutComponent it hosts its own toast
 * and confirmation-dialog outlets — those normally come from the shell.
 *
 * Scope is deliberately just Orders and Invoices; nothing else is exposed here.
 */
@Component({
  selector: 'app-back-office',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    ConfirmationDialogComponent,
    BackOfficeOrdersComponent,
    BackOfficeInvoicesComponent,
  ],
  template: `
    <div class="bo-shell">
      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- HEADER                                                         -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div class="module-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Back-Office</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>Administrator</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">storefront</span>
                <span>{{ settingsService.businessName() }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">badge</span>
                <span>{{ auth.currentUser()?.name || 'Administrator' }}</span>
              </span>
              <span class="meta-dot">•</span>
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">link</span>
                <span class="font-mono">/admin/back-office</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button type="button" class="action-btn btn-outline-purple" (click)="goToPanel()" title="Return to the main panel">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Main Panel</span>
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════ -->
      <!-- TABS — Orders and Invoices, nothing else                       -->
      <!-- ══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'ORDERS'"
          (click)="activeTab = 'ORDERS'"
        >
          <span class="material-symbols-outlined">receipt_long</span>
          <span>Orders</span>
        </button>

        <button
          type="button"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'INVOICES'"
          (click)="activeTab = 'INVOICES'"
        >
          <span class="material-symbols-outlined">description</span>
          <span>Invoices</span>
        </button>
      </div>

      <!--
        Both panels stay instantiated and are hidden with [hidden] rather than
        *ngIf, so switching tabs keeps each one's filters, page and selection
        instead of silently resetting them.
      -->
      <div [hidden]="activeTab !== 'ORDERS'">
        <app-back-office-orders
          #ordersPanel
          (invoicesNeedRefresh)="invoicesPanel?.loadInvoices(1)"
        ></app-back-office-orders>
      </div>

      <div [hidden]="activeTab !== 'INVOICES'">
        <app-back-office-invoices
          #invoicesPanel
          (ordersNeedRefresh)="ordersPanel?.loadOrders(1)"
        ></app-back-office-invoices>
      </div>

      <!-- Overlays normally provided by the main shell. -->
      <app-toast></app-toast>
      <app-confirmation-dialog></app-confirmation-dialog>
    </div>
  `,
  styles: [
    `
      .bo-shell {
        min-height: 100vh;
        width: 100%;
        padding: 1rem;
        background-color: var(--bg-app, #faf5ff);
        color: var(--text-main, #2e1065);
        overflow-y: auto;
      }
      @media (min-width: 768px) {
        .bo-shell {
          padding: 1.5rem;
        }
      }
      .header-title-flex {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class BackOfficeComponent {
  @ViewChild('ordersPanel') ordersPanel?: BackOfficeOrdersComponent;
  @ViewChild('invoicesPanel') invoicesPanel?: BackOfficeInvoicesComponent;

  public auth = inject(AuthService);
  public settingsService = inject(SettingsService);
  private router = inject(Router);

  public activeTab: 'ORDERS' | 'INVOICES' = 'ORDERS';

  public goToPanel(): void {
    this.router.navigate(['/dashboard']);
  }
}

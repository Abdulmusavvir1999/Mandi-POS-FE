import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BackOfficeOrdersComponent } from './back-office-orders.component';
import { BackOfficeInvoicesComponent } from './back-office-invoices.component';
import { BackOfficeUnlockComponent } from './back-office-unlock.component';
import { BackOfficeDeletedComponent } from './back-office-deleted.component';
import { BackOfficeAccessService } from '../../core/services/back-office-access.service';
import { ActionLoadingDirective } from '../../shared/directives/action-loading.directive';

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
    BackOfficeUnlockComponent,
    BackOfficeDeletedComponent,ActionLoadingDirective],
  template: `
    <!--
      The password screen stands in for the whole Back-Office until it is
      passed. *ngIf, not [hidden]: the panels must not be instantiated behind
      the lock, or they would fetch orders and invoices before anyone has
      proved they may see them.
    -->
    <app-back-office-unlock
      *ngIf="!access.isUnlocked()"
      (unlocked)="onUnlocked()"
    ></app-back-office-unlock>

    <div class="bo-shell" *ngIf="access.isUnlocked()">
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
                <span>Super Administrator</span>
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
          <button type="button" class="action-btn btn-outline-purple" (click)="lock()" title="Lock the Back-Office and ask for the password again">
            <span class="material-symbols-outlined">lock</span>
            <span>Lock</span>
          </button>
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

        <button
          type="button"
          class="module-tab-btn"
          [class.is-active]="activeTab === 'DELETED'"
          (click)="activeTab = 'DELETED'"
        >
          <span class="material-symbols-outlined">delete</span>
          <span>Deleted</span>
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
          (invoicesNeedRefresh)="invoicesPanel?.loadInvoices(1); deletedPanel?.load(1)"
        ></app-back-office-orders>
      </div>

      <div [hidden]="activeTab !== 'INVOICES'">
        <app-back-office-invoices
          #invoicesPanel
          (ordersNeedRefresh)="ordersPanel?.loadOrders(1); deletedPanel?.load(1)"
        ></app-back-office-invoices>
      </div>

      <!--
        Restoring puts a record back into its day and renumbers everything
        after it, so both active grids are stale the moment it happens.
      -->
      <div [hidden]="activeTab !== 'DELETED'">
        <app-back-office-deleted
          #deletedPanel
          (restored)="onRestored()"
        ></app-back-office-deleted>
      </div>

      <!-- Overlays normally provided by the main shell. -->
      <app-toast></app-toast>
      <app-confirmation-dialog></app-confirmation-dialog>
    </div>
  `,
  styles: [
    `
      /*
        The Back-Office renders outside MainLayoutComponent, so it does not
        inherit the shell's scrolling region — and styles.css pins
        html, body { height: 100%; overflow: hidden }. A min-height here would
        let the page grow past the viewport with no way to reach the bottom of
        it: the table's last rows and the pagination bar under it were being
        clipped, not missing. A fixed height with its own overflow makes this
        the scrolling element instead.
      */
      .bo-shell {
        height: 100vh;
        width: 100%;
        padding: 1rem;
        background-color: var(--bg-app, #faf5ff);
        color: var(--text-main, var(--text-main, #2E1065));
        overflow-y: auto;
        overflow-x: hidden;
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
  @ViewChild('deletedPanel') deletedPanel?: BackOfficeDeletedComponent;

  public auth = inject(AuthService);
  public settingsService = inject(SettingsService);
  public access = inject(BackOfficeAccessService);
  private router = inject(Router);

  public activeTab: 'ORDERS' | 'INVOICES' | 'DELETED' = 'ORDERS';

  /**
   * The panels are created by the *ngIf the moment this flips, and each loads
   * its own first page — so there is nothing to trigger here.
   */
  public onUnlocked(): void {
    this.activeTab = 'ORDERS';
  }

  /**
   * A restored record rejoins its day and renumbers everything after it, so
   * both active grids are showing stale numbers until they reload.
   */
  public onRestored(): void {
    this.ordersPanel?.loadOrders(1);
    this.invoicesPanel?.loadInvoices(1);
  }

  /** Closes the Back-Office again without signing out of the panel. */
  public lock(): void {
    this.access.lock();
  }

  public goToPanel(): void {
    this.router.navigate(['/dashboard']);
  }
}

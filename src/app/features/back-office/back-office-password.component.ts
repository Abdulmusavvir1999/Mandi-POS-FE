import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { BackOfficeAccessService } from '../../core/services/back-office-access.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';

/**
 * The Back-Office password, at `/admin/back-office-password`.
 *
 * It lives on its own route rather than as a tab in My Profile because it is
 * not a profile setting: it does not belong to the person signed in the way a
 * name or a login password does, it belongs to the Back-Office. Keeping it
 * beside `/admin/back-office` puts the lock next to the door it opens.
 *
 * Deliberately NOT behind the Back-Office unlock, only behind the role check.
 * This is where the password is set in the first place, so requiring it here
 * would leave a fresh install with no way in at all.
 *
 * Renders outside MainLayoutComponent, like the Back-Office itself, so it
 * hosts its own toast outlet — that normally comes from the shell.
 */
@Component({
  selector: 'app-back-office-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <div class="bop-shell">
      <div class="bop-inner">
        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- HEADER                                                      -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="module-header-card">
          <div class="header-left">
            <div class="header-icon-box">
              <span class="material-symbols-outlined">key</span>
            </div>
            <div>
              <div class="header-title-flex">
                <h1 class="page-title">Back-Office Password</h1>
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
                  <span>{{ auth.currentUser()?.name || 'Super Administrator' }}</span>
                </span>
                <span class="meta-dot">•</span>
                <span class="meta-item">
                  <span class="material-symbols-outlined meta-icon">link</span>
                  <span class="font-mono">/admin/back-office-password</span>
                </span>
              </div>
            </div>
          </div>

          <div class="header-action-buttons">
            <button
              type="button"
              class="action-btn btn-outline-purple"
              (click)="goToBackOffice()"
              title="Open the Back-Office"
            >
              <span class="material-symbols-outlined">admin_panel_settings</span>
              <span>Back-Office</span>
            </button>
            <button
              type="button"
              class="action-btn btn-outline-purple"
              (click)="goToPanel()"
              title="Return to the main panel"
            >
              <span class="material-symbols-outlined">arrow_back</span>
              <span>Main Panel</span>
            </button>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- FORM                                                        -->
        <!-- ═══════════════════════════════════════════════════════════ -->
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-icon-wrap">
              <span class="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <h2 class="panel-card-title">Back-Office Password</h2>
              <p class="panel-card-subtitle">
                The password that unlocks <span class="font-mono">/admin/back-office</span>. Separate
                from your login password.
              </p>
            </div>
          </div>

          <div class="security-callout-box">
            <span class="material-symbols-outlined callout-icon">gpp_maybe</span>
            <div class="callout-text">
              <strong>This is not your login password</strong>
              <p>
                The Back-Office deletes orders and invoices outright and re-prices settled bills.
                It asks for this password every time, so a terminal left signed in is not also a
                way in. Changing this password has no effect on how you sign in, and signing-in
                changes have no effect on this one.
              </p>
            </div>
          </div>

          <div class="bo-status-row" *ngIf="!isLoadingStatus">
            <span class="bo-status-pill" [class.is-set]="isConfigured">
              <span class="material-symbols-outlined">
                {{ isConfigured ? 'lock' : 'lock_open' }}
              </span>
              <span>{{ isConfigured ? 'Password is set' : 'No password set yet' }}</span>
            </span>
            <span class="bo-status-note" *ngIf="!isConfigured">
              The Back-Office stays closed until you set one.
            </span>
          </div>

          <form (ngSubmit)="onSave()" class="profile-form">
            <div class="form-grid max-w-2xl">
              <div class="form-field col-span-full">
                <label class="field-label" for="bo-new">
                  <span>{{ isConfigured ? 'New Back-Office Password' : 'Back-Office Password' }}</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">key</span>
                  <input
                    id="bo-new"
                    name="newPassword"
                    [type]="showNew ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    autocomplete="new-password"
                    placeholder="At least 6 characters"
                    class="form-input pr-10 font-mono"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showNew = !showNew"
                    [title]="showNew ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">
                      {{ showNew ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>

                <div class="password-strength-wrap" *ngIf="newPassword">
                  <div class="checklist-grid">
                    <div class="check-item" [class.is-met]="newPassword.length >= 6">
                      <span class="material-symbols-outlined check-icon">
                        {{ newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span>At least 6 characters</span>
                    </div>
                    <div class="check-item" [class.is-met]="newPassword === confirmPassword && !!confirmPassword">
                      <span class="material-symbols-outlined check-icon">
                        {{ newPassword === confirmPassword && !!confirmPassword ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-field col-span-full">
                <label class="field-label" for="bo-confirm">
                  <span>Confirm Back-Office Password</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">verified_user</span>
                  <input
                    id="bo-confirm"
                    name="confirmPassword"
                    [type]="showConfirm ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    autocomplete="new-password"
                    placeholder="Re-enter the Back-Office password"
                    class="form-input pr-10 font-mono"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showConfirm = !showConfirm"
                    [title]="showConfirm ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">
                      {{ showConfirm ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <p class="field-error" *ngIf="confirmPassword && newPassword !== confirmPassword">
                  Passwords do not match.
                </p>
              </div>
            </div>

            <div class="form-actions-bar">
              <button
                type="button"
                (click)="resetForm()"
                [disabled]="isSaving"
                class="action-btn btn-outline-purple"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Clear</span>
              </button>

              <button
                type="submit"
                [disabled]="isSaving || !isFormValid()"
                class="action-btn btn-gradient-purple"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSaving">
                  {{ isSaving ? 'progress_activity' : 'admin_panel_settings' }}
                </span>
                <span>
                  {{
                    isSaving
                      ? 'Saving...'
                      : isConfigured
                      ? 'Change Back-Office Password'
                      : 'Set Back-Office Password'
                  }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Outlet normally provided by the main shell. -->
      <app-toast></app-toast>
    </div>
  `,
  styles: [
    `
      /* Own scrolling region: this renders outside MainLayoutComponent and
         styles.css pins html, body { height: 100%; overflow: hidden }. */
      .bop-shell {
        height: 100vh;
        width: 100%;
        padding: 1rem;
        background-color: var(--bg-app, #faf5ff);
        color: var(--text-main, var(--text-main, #2E1065));
        overflow-y: auto;
        overflow-x: hidden;
      }
      @media (min-width: 768px) {
        .bop-shell {
          padding: 1.5rem;
        }
      }
      .bop-inner {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .header-title-flex {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .bo-status-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
      }
      .bo-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.3rem 0.75rem;
        border-radius: 9999px;
        background: var(--warning-light, #FEF3C7);
        color: var(--warning, #92400E);
        border: 1px solid var(--warning-light, #FDE68A);
      }
      .bo-status-pill.is-set {
        background: var(--success-light, #DCFCE7);
        color: var(--success, #15803D);
        border-color: var(--success-light, #BBF7D0);
      }
      .bo-status-pill .material-symbols-outlined {
        font-size: 1rem;
      }
      .bo-status-note {
        font-size: 0.75rem;
        color: var(--text-muted, #6b7280);
        font-weight: 500;
      }

      /* ───────────────────────────────────────────────────────────────
         Panel and form primitives.

         Carried here rather than reused: .panel-card, .form-input and the
         rest are declared inside ProfileComponent's own styles block, not in
         styles.css, so they are scoped to that component and do not reach
         this one. Without them this page rendered as unstyled HTML while the
         header — which uses genuinely global classes — looked correct.
         ─────────────────────────────────────────────────────────────── */
      .panel-card {
        background: var(--card-bg, #ffffff);
        border: 1px solid var(--card-border, #e9d5ff);
        border-radius: 1.25rem;
        padding: 1.75rem;
        box-shadow: var(--shadow-md, 0 4px 20px -4px rgba(var(--text-main-rgb, 46, 16, 101), 0.08));
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .panel-card-header {
        display: flex;
        align-items: center;
        gap: 0.875rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--card-border, #F3E8FF);
      }
      .panel-icon-wrap {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.75rem;
        background: var(--primary-subtle, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        color: var(--primary, #7e22ce);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        flex-shrink: 0;
      }
      .panel-card-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-main, #2e1065);
        margin: 0;
      }
      .panel-card-subtitle {
        font-size: 0.8rem;
        color: var(--text-muted, #6b7280);
        margin: 0.15rem 0 0 0;
      }

      .security-callout-box {
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        background: var(--primary-subtle, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        padding: 1rem 1.15rem;
        border-radius: 0.875rem;
      }
      .callout-icon {
        color: var(--primary, #7e22ce);
        font-size: 1.4rem;
        margin-top: 0.1rem;
        flex-shrink: 0;
      }
      .callout-text strong {
        font-size: 0.825rem;
        color: var(--text-main, #2e1065);
        display: block;
        margin-bottom: 0.15rem;
      }
      .callout-text p {
        font-size: 0.75rem;
        color: var(--text-muted, #6b7280);
        margin: 0;
        line-height: 1.4;
      }

      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
      .max-w-2xl {
        max-width: 42rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .col-span-full {
        grid-column: 1 / -1;
      }
      .field-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-main, #374151);
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .required-star {
        color: var(--danger, #DC2626);
        font-weight: 900;
      }

      .input-icon-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .input-leading-icon {
        position: absolute;
        left: 0.85rem;
        font-size: 1.15rem;
        color: var(--text-dim, #9CA3AF);
        pointer-events: none;
      }
      .form-input {
        width: 100%;
        height: 2.75rem;
        padding: 0 0.85rem 0 2.5rem;
        border-radius: 0.75rem;
        border: 1px solid var(--card-border, #D8B4FE);
        background: var(--card-bg, #FFFFFF);
        font-size: 0.875rem;
        color: var(--text-main, #1F2937);
        transition: all 0.2s ease;
        outline: none;
      }
      .form-input:focus {
        border-color: var(--primary, #7e22ce);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
      }
      .form-input.pr-10 {
        padding-right: 2.75rem;
      }
      .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .password-toggle-btn {
        position: absolute;
        right: 0.5rem;
        background: transparent;
        border: none;
        color: var(--text-muted, #6B7280);
        cursor: pointer;
        padding: 0.35rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.4rem;
      }
      .password-toggle-btn:hover {
        color: var(--primary, #7e22ce);
        background: var(--primary-subtle, #FAF5FF);
      }
      .field-error {
        font-size: 0.72rem;
        color: var(--danger, #DC2626);
        font-weight: 600;
        margin: 0.1rem 0 0 0;
      }

      .password-strength-wrap {
        margin-top: 0.5rem;
        padding: 0.75rem;
        background: var(--primary-subtle, #FAF5FF);
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .checklist-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.35rem 0.75rem;
      }
      @media (max-width: 480px) {
        .checklist-grid {
          grid-template-columns: 1fr;
        }
      }
      .check-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.72rem;
        color: var(--text-dim, #9CA3AF);
        font-weight: 500;
        transition: color 0.15s ease;
      }
      .check-item.is-met {
        color: var(--success, #15803D);
        font-weight: 600;
      }
      .check-icon {
        font-size: 0.95rem;
      }

      .form-actions-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid var(--card-border, #F3E8FF);
        flex-wrap: wrap;
      }

      .spin-icon {
        animation: bop-spin 1s linear infinite;
      }
      @keyframes bop-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class BackOfficePasswordComponent implements OnInit {
  public auth = inject(AuthService);
  public settingsService = inject(SettingsService);
  private access = inject(BackOfficeAccessService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  public isLoadingStatus = false;
  public isConfigured = false;
  public newPassword = '';
  public confirmPassword = '';
  public showNew = false;
  public showConfirm = false;
  public isSaving = false;

  ngOnInit(): void {
    this.loadStatus();
  }

  /**
   * Whether a password already exists, read from the server.
   *
   * It decides whether the button reads "Set" or "Change", so it is asked
   * rather than assumed — nothing in the stored user object carries it.
   */
  public loadStatus(): void {
    this.isLoadingStatus = true;
    this.access.getStatus().subscribe({
      next: (res) => {
        this.isLoadingStatus = false;
        if (res.success && res.data) {
          this.isConfigured = res.data.configured;
        }
      },
      error: () => {
        // The error interceptor has already said what went wrong.
        this.isLoadingStatus = false;
      },
    });
  }

  public isFormValid(): boolean {
    return (
      !!this.newPassword &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  public resetForm(): void {
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNew = false;
    this.showConfirm = false;
  }

  public onSave(): void {
    if (!this.isFormValid()) {
      if (this.newPassword !== this.confirmPassword) {
        this.notify.error('Back-Office password and confirmation do not match');
      } else {
        this.notify.error('Back-Office password must be at least 6 characters');
      }
      return;
    }

    this.isSaving = true;
    this.access
      .setPassword({ newPassword: this.newPassword, confirmPassword: this.confirmPassword })
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          this.isConfigured = true;
          this.resetForm();
          this.notify.success(res.message || 'Back-Office password saved');
        },
        error: (err) => {
          this.isSaving = false;
          this.notify.error(err?.error?.message || 'Failed to save the Back-Office password');
        },
      });
  }

  public goToBackOffice(): void {
    this.router.navigate(['/admin/back-office']);
  }

  public goToPanel(): void {
    this.router.navigate(['/dashboard']);
  }
}

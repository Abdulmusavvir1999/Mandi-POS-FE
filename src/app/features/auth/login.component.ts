import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-canvas">
      <!-- LEFT: Hero Branding & Visual Panel -->
      <div class="hero-panel">
        <div class="hero-bg-pattern"></div>
        <img
          [src]="settingsService.loginImageUrl() || 'assets/mandi-hero.jpg'"
          [alt]="settingsService.businessName() || 'Restaurant'"
          class="hero-img"
        />
        <div class="hero-light-overlay"></div>

        <!-- Floating Brand Badge -->
        <div class="hero-brand-card">
          <div class="brand-logo-crest">
            <img
              *ngIf="settingsService.brandLogoUrl() as logo; else crestGlyph"
              [src]="logo"
              alt=""
              class="brand-logo-img"
            />
            <ng-template #crestGlyph>
              <span class="material-symbols-outlined text-[24px] text-[#C084FC]">point_of_sale</span>
            </ng-template>
          </div>
          <div class="hero-brand-col">
            <span class="hero-brand-title">{{ settingsService.businessName() }}</span>
            <span class="hero-brand-sub">Point of Sale & Management</span>
          </div>
        </div>

      </div>

      <!-- RIGHT: Clean Light Form Panel -->
      <div class="form-panel">
        <!-- Ambient Purple Glows in Background -->
        <div class="ambient-glow glow-top"></div>
        <div class="ambient-glow glow-bottom"></div>
        <div class="bg-subtle-grid"></div>

        <!-- Clean Form Card -->
        <div class="form-card-container">
          <div class="form-card">
            <form class="login-form" (ngSubmit)="onSubmit()">
              <!-- Header -->
              <div class="card-header">
                <div class="header-logo-box">
                  <span class="material-symbols-outlined text-[28px] text-[#C084FC]">point_of_sale</span>
                </div>
                <h1 class="card-title">Welcome Back</h1>
                <p class="card-subtitle">Sign in to access your POS terminal</p>
              </div>

              <!-- Username / Email Field -->
              <div class="form-field">
                <label class="field-label" for="usernameInput">Email or Username</label>
                <div class="input-wrapper" [class.is-focused]="usernameFocused">
                  <span class="material-symbols-outlined field-icon">person</span>
                  <input
                    title="Email or Username"
                    type="text"
                    [(ngModel)]="emailOrUsername"
                    name="emailOrUsername"
                    id="usernameInput"
                    class="text-input"
                    placeholder="admin@projectx.com"
                    autocomplete="username"
                    required
                    (focus)="usernameFocused = true"
                    (blur)="usernameFocused = false"
                  />
                </div>
              </div>

              <!-- Password Field -->
              <div class="form-field">
                <div class="field-label-row">
                  <label class="field-label" for="passwordInput">Password</label>
                </div>
                <div class="input-wrapper" [class.is-focused]="passwordFocused">
                  <span class="material-symbols-outlined field-icon">lock</span>
                  <input
                    title="Password"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    id="passwordInput"
                    class="text-input"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                    (focus)="passwordFocused = true"
                    (blur)="passwordFocused = false"
                  />
                  <button
                    type="button"
                    (click)="showPassword = !showPassword"
                    class="password-toggle-btn"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="submit-button" [disabled]="isLoading" id="loginSubmitBtn">
                <span *ngIf="!isLoading" class="btn-text-content">
                  <span>Sign In to Terminal</span>
                  <span class="material-symbols-outlined text-[20px] btn-arrow-icon">arrow_forward</span>
                </span>
                <span *ngIf="isLoading" class="btn-loading-state">
                  <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>Authenticating...</span>
                </span>
              </button>
            </form>

            <!-- Bottom Brand Tag -->
            <div class="system-brand-tag" *ngIf="settingsService.businessName() as businessName">
              {{ businessName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ─── HOST ─── */
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
      }

      /* ─── CANVAS: Full Split Layout ─── */
      .login-canvas {
        display: flex;
        width: 100%;
        height: 100%;
        background-color: #FAF5FF;
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      /* ════════════════════════════════════════
         LEFT: Hero Image / Brand Panel (Light Theme)
         ════════════════════════════════════════ */
      .hero-panel {
        position: relative;
        width: 50%;
        height: 100%;
        background-color: var(--sidebar-bg, #2E1065);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 3rem;
        box-sizing: border-box;
      }

      .hero-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        opacity: 0.85;
      }

      .hero-light-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(15, 23, 42, 0.4) 0%,
          rgba(15, 23, 42, 0.1) 35%,
          rgba(15, 23, 42, 0.2) 65%,
          rgba(15, 23, 42, 0.6) 100%
        );
        pointer-events: none;
      }

      .hero-bg-pattern {
        display: none;
      }

      /* Floating Brand Badge */
      .hero-brand-card {
        position: relative;
        z-index: 10;
        display: inline-flex;
        align-items: center;
        gap: 0.9rem;
        background: var(--card-bg, rgba(255, 255, 255, 0.95));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border, rgba(233, 213, 255, 0.9));
        border-radius: 16px;
        padding: 0.75rem 1.25rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        align-self: flex-start;
      }

      .brand-logo-crest {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--sidebar-bg, #2E1065);
        color: var(--sidebar-active-accent, #C084FC);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .brand-logo-crest .brand-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }

      .hero-brand-col {
        display: flex;
        flex-direction: column;
      }

      .hero-brand-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        letter-spacing: 0.03em;
        line-height: 1.2;
      }

      .hero-brand-sub {
        font-size: 0.72rem;
        font-weight: 500;
        color: var(--primary, #7E22CE);
        letter-spacing: 0.01em;
      }

      /* Bottom Quote Card */
      .hero-bottom-card {
        position: relative;
        z-index: 10;
        background: var(--card-bg, rgba(255, 255, 255, 0.95));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--card-border, rgba(233, 213, 255, 0.9));
        border-radius: 18px;
        padding: 1.5rem 1.75rem;
        box-shadow: 0 12px 30px -6px rgba(0, 0, 0, 0.2);
        max-width: 480px;
      }

      .hero-quote-text {
        margin: 0 0 1rem 0;
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
        font-style: italic;
        line-height: 1.45;
      }

      .hero-quote-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .quote-purple-bar {
        display: block;
        width: 36px;
        height: 3px;
        border-radius: 2px;
        background-color: var(--primary, #7E22CE);
      }

      .quote-caption {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--primary, #7E22CE);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      /* ════════════════════════════════════════
         RIGHT: Light Form Panel
         ════════════════════════════════════════ */
      .form-panel {
        position: relative;
        width: 50%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-app, #FAF5FF);
        overflow-y: auto;
        padding: 2.5rem;
        box-sizing: border-box;
      }

      /* Ambient Subtle Glows */
      .ambient-glow {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(70px);
      }

      .glow-top {
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, var(--primary-light, rgba(216, 180, 254, 0.6)) 0%, transparent 70%);
        top: -10%;
        right: -5%;
      }

      .glow-bottom {
        width: 360px;
        height: 360px;
        background: radial-gradient(circle, var(--primary-glow, rgba(192, 132, 252, 0.4)) 0%, transparent 70%);
        bottom: -10%;
        left: -5%;
      }

      .bg-subtle-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(to right, var(--card-border, rgba(233, 213, 255, 0.6)) 1px, transparent 1px),
          linear-gradient(to bottom, var(--card-border, rgba(233, 213, 255, 0.6)) 1px, transparent 1px);
        background-size: 32px 32px;
        pointer-events: none;
        opacity: 0.4;
      }

      /* ─── FORM CARD ─── */
      .form-card-container {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 440px;
      }

      .form-card {
        background: var(--card-bg, #FFFFFF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        border-radius: 20px;
        padding: 2.5rem 2.25rem 2rem;
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--primary-light, rgba(126, 34, 206, 0.03));
        box-sizing: border-box;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.35rem;
      }

      /* Card Header */
      .card-header {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .header-logo-box {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: var(--sidebar-bg, #2E1065);
        color: var(--sidebar-active-accent, #C084FC);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        box-shadow: 0 8px 16px -4px var(--primary-glow, rgba(46, 16, 101, 0.35));
      }

      .card-title {
        margin: 0;
        font-size: 1.65rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        letter-spacing: -0.02em;
      }

      .card-subtitle {
        margin: 0.35rem 0 0 0;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-muted, #6B21A8);
        opacity: 0.8;
      }

      /* ─── Input Fields ─── */
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .field-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
      }

      .field-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        border-radius: 12px;
        background: var(--card-bg, #FAF5FF);
        border: 1.5px solid var(--card-border, #E9D5FF);
        padding: 0.75rem 0.9rem;
        gap: 0.75rem;
        transition: all 0.18s ease;
      }

      .input-wrapper.is-focused {
        background: var(--card-bg, #FFFFFF);
        border-color: var(--primary, #7E22CE);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(126, 34, 206, 0.12));
      }

      .field-icon {
        font-size: 20px;
        color: var(--text-muted, #A855F7);
        flex-shrink: 0;
        transition: color 0.18s ease;
      }

      .input-wrapper.is-focused .field-icon {
        color: var(--primary, #7E22CE);
      }

      .text-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        font-size: 0.92rem;
        color: var(--text-main, #2E1065);
        font-family: inherit;
        font-weight: 600;
      }

      .text-input::placeholder {
        color: var(--text-dim, #C084FC);
        font-weight: 400;
      }

      .password-toggle-btn {
        background: none;
        border: none;
        padding: 2px;
        color: var(--text-muted, #A855F7);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: color 0.15s ease;
      }

      .password-toggle-btn:hover {
        color: var(--primary, #7E22CE);
      }

      /* ─── Submit Button ─── */
      .submit-button {
        width: 100%;
        border-radius: 12px;
        padding: 0.85rem 1.25rem;
        background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-hover, #6B21A8) 100%);
        border: 1px solid var(--primary, #7E22CE);
        color: #FFFFFF;
        font-size: 0.92rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.18s ease;
        box-shadow: 0 4px 14px var(--primary-glow, rgba(126, 34, 206, 0.35));
        margin-top: 0.35rem;
      }

      .submit-button:hover:not(:disabled) {
        background: linear-gradient(135deg, var(--primary-hover, #6B21A8) 0%, var(--primary, #581C87) 100%);
        box-shadow: 0 6px 18px var(--primary-glow, rgba(126, 34, 206, 0.45));
      }

      .submit-button:focus-visible {
        outline: 2px solid var(--primary, #7E22CE);
        outline-offset: 2px;
      }

      .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .btn-text-content {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .btn-arrow-icon {
        transition: transform 0.18s ease;
      }

      .submit-button:hover:not(:disabled) .btn-arrow-icon {
        transform: translateX(3px);
      }

      .btn-loading-state {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .system-brand-tag {
        margin-top: 1.5rem;
        text-align: center;
        font-size: 0.74rem;
        font-weight: 700;
        color: #9333EA;
        opacity: 0.7;
        letter-spacing: 0.02em;
      }

      /* ════════════════════════════════════════
         RESPONSIVE STYLES
         ════════════════════════════════════════ */
      @media (max-width: 900px) {
        .hero-panel {
          display: none;
        }

        .form-panel {
          width: 100%;
          padding: 1.5rem;
        }
      }

      @media (max-width: 480px) {
        .form-card {
          padding: 1.75rem 1.25rem 1.5rem;
          border-radius: 16px;
        }

        .card-title {
          font-size: 1.4rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  public settingsService = inject(SettingsService);
  public emailOrUsername = 'admin@projectx.com';
  public password = 'Super@123';
  public showPassword = false;
  public isLoading = false;
  public usernameFocused = false;
  public passwordFocused = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  public notify = inject(NotificationService);

  onSubmit() {
    if (!this.emailOrUsername || !this.password) {
      this.notify.error('Please enter username/email and password');
      return;
    }

    this.isLoading = true;
    this.authService
      .login({
        username: this.emailOrUsername,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.notify.success(`Welcome back, ${res.data.user.name}!`);
          const perms = res.data.user.permissions || [];
          if (perms.includes('dashboard.view') || res.data.user.role?.toUpperCase() === 'ADMIN') {
            this.router.navigate(['/dashboard']);
          } else if (perms.includes('pos.billing')) {
            this.router.navigate(['/pos']);
          } else if (perms.includes('order.manage')) {
            this.router.navigate(['/orders']);
          } else if (perms.includes('dining.manage')) {
            this.router.navigate(['/dining']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 0) {
            this.notify.error('Cannot connect to backend server. Please verify the API is running on port 8000.');
            return;
          }
          this.notify.error(err?.error?.message || 'Authentication failed. Please check your credentials.');
        },
      });
  }
}

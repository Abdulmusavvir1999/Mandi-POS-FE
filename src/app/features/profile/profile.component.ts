import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { User } from '../../core/models';

type ProfileTab = 'personal' | 'security' | 'permissions';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Account</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">My Profile</span>
      </div>

      <div class="profile-header-card" *ngIf="user">
        <div class="header-left">
          <div class="header-avatar-box">
            <div class="avatar-circle">
              {{ getInitials(user.name) }}
            </div>
            <span class="avatar-online-dot" title="Active Account"></span>
          </div>

          <div class="header-user-meta">
            <div class="header-name-row">
              <h1 class="user-display-name">{{ user.name }}</h1>
              <span class="role-pill">{{ user.role }}</span>
              <span class="status-pill is-active">
                <span class="status-dot"></span>
                <span>{{ user.status || 'Active' }}</span>
              </span>
            </div>
            <div class="header-submeta-row">
              <span class="submeta-item">
                <span class="material-symbols-outlined submeta-icon">alternate_email</span>
                <span>{{ user.username }}</span>
              </span>
              <span class="submeta-item" *ngIf="user.email">
                <span class="material-symbols-outlined submeta-icon">mail</span>
                <span>{{ user.email }}</span>
              </span>
              <span class="submeta-item" *ngIf="user.lastLoginAt || user.last_login_at">
                <span class="material-symbols-outlined submeta-icon">schedule</span>
                <span>Last login: {{ (user.lastLoginAt || user.last_login_at) | date:'medium' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            (click)="reloadUserProfile()"
            class="action-btn btn-outline-purple"
            title="Refresh profile details"
          >
            <span class="material-symbols-outlined" [class.spin-icon]="isRefreshing">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. NAVIGATION TABS                                              -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tab-nav-bar">
        <button
          type="button"
          (click)="activeTab = 'personal'"
          class="tab-btn"
          [class.is-active]="activeTab === 'personal'"
        >
          <span class="material-symbols-outlined">person</span>
          <span>Profile Information</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'security'"
          class="tab-btn"
          [class.is-active]="activeTab === 'security'"
        >
          <span class="material-symbols-outlined">lock_reset</span>
          <span>Change Password</span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'permissions'"
          class="tab-btn"
          [class.is-active]="activeTab === 'permissions'"
        >
          <span class="material-symbols-outlined">shield_person</span>
          <span>Access & Permissions</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. TAB 1: UPDATE PROFILE INFORMATION                            -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tab-pane-container" *ngIf="activeTab === 'personal'">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-icon-wrap">
              <span class="material-symbols-outlined">badge</span>
            </div>
            <div>
              <h2 class="panel-card-title">Personal Details</h2>
              <p class="panel-card-subtitle">
                Update your display name, email address, and contact number.
              </p>
            </div>
          </div>

          <form (ngSubmit)="onSaveProfile()" class="profile-form" #profileForm="ngForm">
            <div class="form-grid">
              <!-- Full Name -->
              <div class="form-field">
                <label class="field-label" for="profile-name">
                  <span>Full Name</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">person</span>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    [(ngModel)]="profileName"
                    required
                    minlength="2"
                    placeholder="Enter your full name"
                    class="form-input"
                    #nameCtrl="ngModel"
                  />
                </div>
                <p class="field-error" *ngIf="nameCtrl.invalid && (nameCtrl.dirty || nameCtrl.touched)">
                  Name is required (minimum 2 characters).
                </p>
              </div>

              <!-- Username (Read-Only) -->
              <div class="form-field">
                <label class="field-label" for="profile-username">
                  <span>Username</span>
                  <span class="field-hint-badge">Fixed ID</span>
                </label>
                <div class="input-icon-wrap is-readonly">
                  <span class="material-symbols-outlined input-leading-icon">alternate_email</span>
                  <input
                    id="profile-username"
                    name="username"
                    type="text"
                    [value]="user?.username || ''"
                    readonly
                    class="form-input is-readonly-input"
                    title="Username is permanent and cannot be modified"
                  />
                  <span class="material-symbols-outlined input-trailing-icon text-slate-400">lock</span>
                </div>
                <p class="field-helper-text">
                  Your unique account identifier used for logging into the POS system.
                </p>
              </div>

              <!-- Email Address -->
              <div class="form-field">
                <label class="field-label" for="profile-email">
                  <span>Email Address</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">mail</span>
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    [(ngModel)]="profileEmail"
                    required
                    email
                    placeholder="e.g. user@restaurant.com"
                    class="form-input"
                    #emailCtrl="ngModel"
                  />
                </div>
                <p class="field-error" *ngIf="emailCtrl.invalid && (emailCtrl.dirty || emailCtrl.touched)">
                  Please enter a valid email address.
                </p>
              </div>

              <!-- Phone Number -->
              <div class="form-field">
                <label class="field-label" for="profile-phone">
                  <span>Phone Number</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">call</span>
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    [(ngModel)]="profilePhone"
                    placeholder="e.g. +91 9876543210"
                    class="form-input"
                  />
                </div>
                <p class="field-helper-text">
                  Optional contact number for system notifications and order logs.
                </p>
              </div>

              <!-- Role (Read-Only) -->
              <div class="form-field">
                <label class="field-label">
                  <span>Assigned System Role</span>
                </label>
                <div class="input-icon-wrap is-readonly">
                  <span class="material-symbols-outlined input-leading-icon">shield</span>
                  <input
                    type="text"
                    [value]="user?.role || 'Staff'"
                    readonly
                    class="form-input is-readonly-input font-bold uppercase"
                  />
                  <span class="material-symbols-outlined input-trailing-icon text-slate-400">verified</span>
                </div>
              </div>

              <!-- Account Status (Read-Only) -->
              <div class="form-field">
                <label class="field-label">
                  <span>Account Status</span>
                </label>
                <div class="input-icon-wrap is-readonly">
                  <span class="material-symbols-outlined input-leading-icon text-green-600">check_circle</span>
                  <input
                    type="text"
                    [value]="(user?.status || 'ACTIVE') + ' - Authorized Access'"
                    readonly
                    class="form-input is-readonly-input font-bold"
                  />
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions-bar">
              <button
                type="button"
                (click)="resetProfileForm()"
                [disabled]="isSavingProfile"
                class="action-btn btn-outline-purple"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Reset</span>
              </button>

              <button
                type="submit"
                [disabled]="isSavingProfile || profileForm.invalid || !hasProfileChanges()"
                class="action-btn btn-gradient-purple"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isSavingProfile">
                  {{ isSavingProfile ? 'progress_activity' : 'save' }}
                </span>
                <span>{{ isSavingProfile ? 'Saving Changes...' : 'Update Profile' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. TAB 2: CHANGE PASSWORD                                       -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tab-pane-container" *ngIf="activeTab === 'security'">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-icon-wrap">
              <span class="material-symbols-outlined">lock_reset</span>
            </div>
            <div>
              <h2 class="panel-card-title">Change Account Password</h2>
              <p class="panel-card-subtitle">
                Keep your account secure by using a strong, unique password.
              </p>
            </div>
          </div>

          <!-- Security Tip Callout -->
          <div class="security-callout-box">
            <span class="material-symbols-outlined callout-icon">security</span>
            <div class="callout-text">
              <strong>Password Security Requirement</strong>
              <p>
                Your new password must be at least 6 characters long. For optimal security, combine uppercase letters, numbers, and special characters.
              </p>
            </div>
          </div>

          <form (ngSubmit)="onChangePassword()" class="profile-form" #passwordForm="ngForm">
            <div class="form-grid max-w-2xl">
              <!-- New Password -->
              <div class="form-field col-span-full">
                <label class="field-label" for="new-password">
                  <span>New Password</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">lock</span>
                  <input
                    id="new-password"
                    name="newPassword"
                    [type]="showNewPassword ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    required
                    minlength="6"
                    placeholder="Enter new password (min. 6 characters)"
                    class="form-input pr-10 font-mono"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showNewPassword = !showNewPassword"
                    [title]="showNewPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">
                      {{ showNewPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>

                <!-- Password Strength Checklist -->
                <div class="password-strength-wrap" *ngIf="newPassword">
                  <div class="strength-meter-bar">
                    <div
                      class="strength-fill"
                      [style.width.%]="passwordStrengthScore * 25"
                      [ngClass]="{
                        'bg-rose-500': passwordStrengthScore <= 1,
                        'bg-amber-500': passwordStrengthScore === 2,
                        'bg-blue-500': passwordStrengthScore === 3,
                        'bg-emerald-500': passwordStrengthScore === 4
                      }"
                    ></div>
                  </div>
                  <div class="strength-label">
                    <span>Strength: </span>
                    <strong>{{ passwordStrengthLabel }}</strong>
                  </div>

                  <div class="checklist-grid">
                    <div class="check-item" [class.is-met]="newPassword.length >= 6">
                      <span class="material-symbols-outlined check-icon">
                        {{ newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span>At least 6 characters</span>
                    </div>
                    <div class="check-item" [class.is-met]="hasUppercase(newPassword)">
                      <span class="material-symbols-outlined check-icon">
                        {{ hasUppercase(newPassword) ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span>Uppercase letter</span>
                    </div>
                    <div class="check-item" [class.is-met]="hasNumber(newPassword)">
                      <span class="material-symbols-outlined check-icon">
                        {{ hasNumber(newPassword) ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span>Number or symbol</span>
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

              <!-- Confirm New Password -->
              <div class="form-field col-span-full">
                <label class="field-label" for="confirm-password">
                  <span>Confirm New Password</span>
                  <span class="required-star">*</span>
                </label>
                <div class="input-icon-wrap">
                  <span class="material-symbols-outlined input-leading-icon">verified_user</span>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    required
                    placeholder="Re-enter your new password"
                    class="form-input pr-10 font-mono"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showConfirmPassword = !showConfirmPassword"
                    [title]="showConfirmPassword ? 'Hide password' : 'Show password'"
                  >
                    <span class="material-symbols-outlined">
                      {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <p class="field-error" *ngIf="confirmPassword && newPassword !== confirmPassword">
                  Passwords do not match.
                </p>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions-bar">
              <button
                type="button"
                (click)="resetPasswordForm()"
                [disabled]="isChangingPassword"
                class="action-btn btn-outline-purple"
              >
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Clear</span>
              </button>

              <button
                type="submit"
                [disabled]="isChangingPassword || !isPasswordFormValid()"
                class="action-btn btn-gradient-purple"
              >
                <span class="material-symbols-outlined" [class.spin-icon]="isChangingPassword">
                  {{ isChangingPassword ? 'progress_activity' : 'lock_reset' }}
                </span>
                <span>{{ isChangingPassword ? 'Updating Password...' : 'Change Password' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. TAB 3: ACCESS & PERMISSIONS VIEW                             -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="tab-pane-container" *ngIf="activeTab === 'permissions'">
        <div class="panel-card">
          <div class="panel-card-header">
            <div class="panel-icon-wrap">
              <span class="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <h2 class="panel-card-title">Assigned Privileges & Capabilities</h2>
              <p class="panel-card-subtitle">
                System permissions granted to your role <strong>({{ user?.role }})</strong>.
              </p>
            </div>
          </div>

          <div class="permissions-overview-grid">
            <div class="info-pill-card">
              <span class="material-symbols-outlined card-icon text-purple-600">shield</span>
              <div class="card-meta">
                <span class="card-label">User Role</span>
                <span class="card-value">{{ user?.role }}</span>
              </div>
            </div>

            <div class="info-pill-card">
              <span class="material-symbols-outlined card-icon text-emerald-600">check_circle</span>
              <div class="card-meta">
                <span class="card-label">Account Status</span>
                <span class="card-value text-emerald-700">{{ user?.status || 'Active' }}</span>
              </div>
            </div>

            <div class="info-pill-card">
              <span class="material-symbols-outlined card-icon text-blue-600">key</span>
              <div class="card-meta">
                <span class="card-label">Active Permissions</span>
                <span class="card-value">
                  {{ hasFullAccess ? 'Full Unrestricted Access (All)' : (user?.permissions?.length || 0) + ' Granted' }}
                </span>
              </div>
            </div>
          </div>

          <div class="permissions-list-section">
            <h3 class="permissions-section-title">
              <span class="material-symbols-outlined text-sm">lock_open</span>
              <span>Granted Permissions</span>
            </h3>

            <div *ngIf="hasFullAccess" class="admin-all-access-badge">
              <span class="material-symbols-outlined">verified</span>
              <div>
                <strong>Super Administrator Role</strong>
                <p>You have full unrestricted access to all POS modules, financial bills, inventory adjustments, and system settings.</p>
              </div>
            </div>

            <div class="permissions-tags-wrap" *ngIf="!hasFullAccess">
              <span
                *ngFor="let perm of user?.permissions"
                class="perm-chip"
              >
                <span class="material-symbols-outlined perm-check">check</span>
                <span>{{ perm }}</span>
              </span>
              <div *ngIf="!user?.permissions || user.permissions.length === 0" class="no-perms-text">
                No specific granular permissions assigned. Default role access applies.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .profile-page-wrapper {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    @media (max-width: 768px) {
      .profile-page-wrapper {
        padding: 1rem;
        gap: 1rem;
      }
    }

    /* ─── Header Card ─── */
    .profile-header-card {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 1.25rem;
      padding: 1.5rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: 0 4px 20px -4px rgba(var(--text-main-rgb, 46, 16, 101), 0.08);
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .header-avatar-box {
      position: relative;
    }

    .avatar-circle {
      width: 4.5rem;
      height: 4.5rem;
      border-radius: 1.15rem;
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      font-size: 1.85rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px -4px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
      border: 2px solid rgba(255, 255, 255, 0.85);
    }

    .avatar-online-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 1rem;
      height: 1rem;
      border-radius: 9999px;
      background: var(--success, #16A34A);
      border: 2.5px solid var(--card-bg, #FFFFFF);
      box-shadow: 0 2px 6px rgba(var(--success-rgb, 22, 163, 74), 0.4);
    }

    .header-user-meta {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .header-name-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .user-display-name {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--text-main, #2E1065);
      margin: 0;
      line-height: 1.2;
    }

    .role-pill {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      box-shadow: 0 2px 8px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.3));
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: var(--success-light, #DCFCE7);
      color: var(--success, #15803D);
      border: 1px solid var(--success-light, #BBF7D0);
    }

    .status-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 9999px;
      background: var(--success, #16A34A);
    }

    .header-submeta-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      font-size: 0.8rem;
      color: var(--text-muted, #6B7280);
      font-weight: 500;
    }

    .submeta-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .submeta-icon {
      font-size: 1rem;
      color: var(--primary, #7E22CE);
    }


    /* ─── Tab Navigation ─── */
    .tab-nav-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 1rem;
      padding: 0.375rem;
      box-shadow: 0 2px 10px -2px rgba(var(--text-main-rgb, 46, 16, 101), 0.05);
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.15rem;
      border-radius: 0.75rem;
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--text-muted, #6B7280);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--primary, #7E22CE);
      background: var(--bg-app, #FAF5FF);
    }

    .tab-btn.is-active {
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 14px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
    }

    /* ─── Panel Card ─── */
    .panel-card {
      background: var(--card-bg, #FFFFFF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 1.25rem;
      padding: 1.75rem;
      box-shadow: 0 4px 20px -4px rgba(var(--text-main-rgb, 46, 16, 101), 0.08);
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
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }

    .panel-card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
      margin: 0;
    }

    .panel-card-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted, #6B7280);
      margin: 0.15rem 0 0 0;
    }

    /* ─── Form Fields ─── */
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
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .required-star {
      color: var(--danger, #DC2626);
      font-weight: 900;
    }

    .field-hint-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      background: #F3F4F6;
      color: var(--text-muted, #6B7280);
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

    .input-trailing-icon {
      position: absolute;
      right: 0.85rem;
      font-size: 1.15rem;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      height: 2.75rem;
      padding: 0 0.85rem 0 2.5rem;
      border-radius: 0.75rem;
      border: 1px solid #D8B4FE;
      background: #FFFFFF;
      font-size: 0.875rem;
      color: var(--text-main, #1F2937);
      transition: all 0.2s ease;
      outline: none;
    }

    .form-input:focus {
      border-color: var(--primary, #7E22CE);
      box-shadow: 0 0 0 3px var(--primary-light, rgba(var(--primary-rgb, 126, 34, 206), 0.15));
    }

    .form-input.is-readonly-input {
      background: #F9FAFB;
      border-color: #E5E7EB;
      color: var(--text-muted, #4B5563);
      cursor: not-allowed;
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
      transition: color 0.15s ease;
    }

    .password-toggle-btn:hover {
      color: var(--primary, #7E22CE);
    }

    .field-error {
      font-size: 0.72rem;
      color: var(--danger, #DC2626);
      font-weight: 600;
      margin: 0.1rem 0 0 0;
    }

    .field-helper-text {
      font-size: 0.72rem;
      color: var(--text-muted, #6B7280);
      margin: 0.1rem 0 0 0;
    }

    /* ─── Security Callout Box ─── */
    .security-callout-box {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      padding: 1rem 1.15rem;
      border-radius: 0.875rem;
    }

    .callout-icon {
      color: var(--primary, #7E22CE);
      font-size: 1.4rem;
      margin-top: 0.1rem;
    }

    .callout-text strong {
      font-size: 0.825rem;
      color: var(--text-main, #2E1065);
      display: block;
      margin-bottom: 0.15rem;
    }

    .callout-text p {
      font-size: 0.75rem;
      color: var(--text-muted, #6B7280);
      margin: 0;
      line-height: 1.4;
    }

    /* ─── Password Strength Meter ─── */
    .password-strength-wrap {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .strength-meter-bar {
      width: 100%;
      height: 5px;
      background: #E5E7EB;
      border-radius: 9999px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .strength-label {
      font-size: 0.72rem;
      color: var(--text-muted, #4B5563);
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

    /* ─── Form Actions ─── */
    .form-actions-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--card-border, #F3E8FF);
    }

    /* ─── Buttons ─── */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-outline-purple {
      background: #FFFFFF;
      border: 1px solid var(--card-border, #E9D5FF);
      color: var(--primary, #7E22CE);
    }
    .btn-outline-purple:hover:not(:disabled) {
      background: var(--bg-app, #FAF5FF);
      border-color: var(--primary, #7E22CE);
    }

    .btn-gradient-purple {
      background: linear-gradient(135deg, var(--primary, #7E22CE) 0%, var(--primary-variant, #6B21A8) 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 14px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.35));
    }
    .btn-gradient-purple:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px var(--primary-glow, rgba(var(--primary-rgb, 126, 34, 206), 0.45));
    }

    .action-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .spin-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ─── Tab 3: Permissions ─── */
    .permissions-overview-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .permissions-overview-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-pill-card {
      background: var(--bg-app, #FAF5FF);
      border: 1px solid var(--card-border, #E9D5FF);
      border-radius: 0.875rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      font-size: 1.75rem;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
    }

    .card-label {
      font-size: 0.7rem;
      color: var(--text-muted, #6B7280);
      font-weight: 600;
      text-transform: uppercase;
    }

    .card-value {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
    }

    .permissions-list-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .permissions-section-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--text-main, #2E1065);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
    }

    .admin-all-access-badge {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      background: linear-gradient(135deg, rgba(var(--primary-rgb, 126, 34, 206), 0.08) 0%, rgba(var(--primary-variant-rgb, 107, 33, 168), 0.04) 100%);
      border: 1px solid #D8B4FE;
      padding: 1.15rem;
      border-radius: 0.875rem;
      color: var(--primary, #7E22CE);
    }

    .admin-all-access-badge strong {
      display: block;
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--primary, #7E22CE);
    }

    .admin-all-access-badge p {
      font-size: 0.775rem;
      color: var(--text-muted, #6B7280);
      margin: 0.2rem 0 0 0;
    }

    .permissions-tags-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .perm-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      background: var(--primary-light, #F3E8FF);
      color: var(--primary-variant, #6B21A8);
      border: 1px solid var(--card-border, #E9D5FF);
      font-family: 'JetBrains Mono', monospace;
    }

    .perm-check {
      font-size: 0.9rem;
      color: var(--success, #16A34A);
      font-weight: 900;
    }

    .no-perms-text {
      font-size: 0.8rem;
      color: var(--text-dim, #9CA3AF);
      font-style: italic;
    }
  `]
})
export class ProfileComponent implements OnInit {
  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);
  private notify = inject(NotificationService);

  public activeTab: ProfileTab = 'personal';
  public user: User | null = null;
  public isRefreshing = false;

  /**
   * The super administrator, which holds no role at all.
   *
   * Read here only by `hasFullAccess`. The Back-Office password itself is not
   * a profile setting and lives at `/admin/back-office-password`.
   */
  public get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  /**
   * Whether this account bypasses the per-screen permission checks.
   *
   * ADMIN does, through its role. The super administrator holds no role at
   * all, so it carries no permission codes — listing them would show an empty
   * set and read as an account with no access, which is the opposite of the
   * truth.
   */
  public get hasFullAccess(): boolean {
    return this.user?.role === 'ADMIN' || this.isSuperAdmin;
  }

  // Profile Form State
  public profileName = '';
  public profileEmail = '';
  public profilePhone = '';
  public isSavingProfile = false;

  // Password Form State
  public newPassword = '';
  public confirmPassword = '';
  public showNewPassword = false;
  public showConfirmPassword = false;
  public isChangingPassword = false;

  ngOnInit(): void {
    this.loadUserData();
  }

  public loadUserData(): void {
    const current = this.authService.currentUser();
    if (current) {
      this.user = current;
      this.resetProfileForm();
    }
  }

  public reloadUserProfile(): void {
    this.isRefreshing = true;
    this.authService.refreshUserData();
    setTimeout(() => {
      this.loadUserData();
      this.isRefreshing = false;
      this.notify.info('Profile data refreshed');
    }, 600);
  }

  public getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  public resetProfileForm(): void {
    if (this.user) {
      this.profileName = this.user.name || '';
      this.profileEmail = this.user.email || '';
      this.profilePhone = this.user.phone || '';
    }
  }

  public hasProfileChanges(): boolean {
    if (!this.user) return false;
    return (
      this.profileName.trim() !== (this.user.name || '').trim() ||
      this.profileEmail.trim() !== (this.user.email || '').trim() ||
      this.profilePhone.trim() !== (this.user.phone || '').trim()
    );
  }

  public onSaveProfile(): void {
    if (!this.profileName || this.profileName.trim().length < 2) {
      this.notify.error('Please enter a valid name (at least 2 characters)');
      return;
    }
    if (!this.profileEmail || !this.profileEmail.includes('@')) {
      this.notify.error('Please enter a valid email address');
      return;
    }

    this.isSavingProfile = true;
    this.authService
      .updateProfile({
        name: this.profileName.trim(),
        email: this.profileEmail.trim(),
        phone: this.profilePhone.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isSavingProfile = false;
          if (res.success && res.data) {
            this.user = res.data;
            this.notify.success('Profile details updated successfully');
          } else {
            this.notify.info(res.message || 'Profile updated');
          }
        },
        error: (err) => {
          this.isSavingProfile = false;
          this.notify.error(err?.error?.message || 'Failed to update profile');
        },
      });
  }

  // Password Helpers
  public hasUppercase(pwd: string): boolean {
    return /[A-Z]/.test(pwd);
  }

  public hasNumber(pwd: string): boolean {
    return /[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd);
  }

  public get passwordStrengthScore(): number {
    const pwd = this.newPassword;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (this.hasUppercase(pwd)) score++;
    if (this.hasNumber(pwd)) score++;
    return score;
  }

  public get passwordStrengthLabel(): string {
    const score = this.passwordStrengthScore;
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  }

  public isPasswordFormValid(): boolean {
    return (
      !!this.newPassword &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  public resetPasswordForm(): void {
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  public onChangePassword(): void {
    if (!this.isPasswordFormValid()) {
      if (this.newPassword !== this.confirmPassword) {
        this.notify.error('New password and confirm password do not match');
      } else if (this.newPassword.length < 6) {
        this.notify.error('New password must be at least 6 characters');
      } else {
        this.notify.error('Please enter and confirm your new password');
      }
      return;
    }

    this.isChangingPassword = true;
    this.authService
      .changePassword({
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (res) => {
          this.isChangingPassword = false;
          this.resetPasswordForm();
          this.notify.success(res.message || 'Password changed successfully!');
        },
        error: (err) => {
          this.isChangingPassword = false;
          this.notify.error(err?.error?.message || 'Failed to update password');
        },
      });
  }
}

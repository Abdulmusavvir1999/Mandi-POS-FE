import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { BackOfficeAccessService } from '../../core/services/back-office-access.service';

/**
 * The password screen in front of `/admin/back-office`.
 *
 * Reaching this at all already means the super administrator is signed in —
 * the route guard and the API both refuse everybody else. This is the second
 * lock: a terminal left signed in at the counter is a normal state of affairs,
 * and record deletion should not be one click away from it.
 *
 * Nothing of the Back-Office renders behind this. The panels are not created
 * until the unlock succeeds, so no order or invoice data is fetched, and the
 * grant the unlock returns is what every Back-Office request is then answered
 * against.
 *
 * When no password has been set yet the screen says so and points at
 * `/admin/back-office-password` rather than offering to set one here — there
 * is one place that owns this credential, and two would be one too many.
 */
@Component({
  selector: 'app-back-office-unlock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bo-lock-screen">
      <div class="bo-lock-card">
        <div class="bo-lock-icon">
          <span class="material-symbols-outlined">lock</span>
        </div>

        <h1 class="bo-lock-title">Back-Office Locked</h1>
        <p class="bo-lock-subtitle">
          {{ settingsService.businessName() }} · signed in as
          <strong>{{ auth.currentUser()?.name || 'Super Administrator' }}</strong>
        </p>

        <!-- Checking whether a password exists yet. -->
        <div class="bo-lock-checking" *ngIf="isCheckingStatus">
          <span class="material-symbols-outlined spin-icon">progress_activity</span>
          <span>Checking Back-Office access…</span>
        </div>

        <ng-container *ngIf="!isCheckingStatus">
          <!-- ── No password configured yet ───────────────────────────── -->
          <div class="bo-lock-notice" *ngIf="!isConfigured">
            <span class="material-symbols-outlined">key_off</span>
            <div>
              <strong>No Back-Office password set</strong>
              <p>
                The Back-Office stays closed until one is set. Set one at
                /admin/back-office-password, then come back here.
              </p>
            </div>
          </div>

          <!-- ── Password prompt ──────────────────────────────────────── -->
          <form *ngIf="isConfigured" (ngSubmit)="onUnlock()" class="bo-lock-form" #unlockForm="ngForm">
            <label class="bo-lock-label" for="bo-password">Back-Office Password</label>
            <div class="bo-lock-input-wrap">
              <span class="material-symbols-outlined bo-lock-input-icon">password</span>
              <input
                id="bo-password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                [disabled]="isUnlocking"
                autocomplete="off"
                autofocus
                placeholder="Enter the Back-Office password"
                class="bo-lock-input"
              />
              <button
                type="button"
                class="bo-lock-eye"
                (click)="showPassword = !showPassword"
                [title]="showPassword ? 'Hide password' : 'Show password'"
              >
                <span class="material-symbols-outlined">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>

            <p class="bo-lock-error" *ngIf="errorMessage">
              <span class="material-symbols-outlined">error</span>
              <span>{{ errorMessage }}</span>
            </p>

            <p class="bo-lock-hint">
              This is not your login password. It unlocks the Back-Office only, and the
              unlock lasts {{ unlockTtlMinutes }} minutes.
            </p>

            <button type="submit" class="bo-lock-submit" [disabled]="isUnlocking || !password">
              <span class="material-symbols-outlined" [class.spin-icon]="isUnlocking">
                {{ isUnlocking ? 'progress_activity' : 'lock_open' }}
              </span>
              <span>{{ isUnlocking ? 'Verifying…' : 'Unlock Back-Office' }}</span>
            </button>
          </form>
        </ng-container>

        <div class="bo-lock-footer">
          <button type="button" class="bo-lock-link" (click)="goToPasswordPage()">
            <span class="material-symbols-outlined">manage_accounts</span>
            <span>{{ isConfigured ? 'Change Back-Office password' : 'Set Back-Office password' }}</span>
          </button>
          <button type="button" class="bo-lock-link" (click)="goToPanel()">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Back to main panel</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Own scrolling region for the same reason as .bo-shell: this renders
         outside the main layout, and html/body are pinned to overflow: hidden.
         On a short viewport the card would otherwise be cut off. */
      .bo-lock-screen {
        height: 100vh;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background-color: var(--bg-app, #faf5ff);
        overflow-y: auto;
      }
      .bo-lock-card {
        width: 100%;
        max-width: 26rem;
        background: var(--card-bg, #FFFFFF);
        border: 1px solid var(--card-border, rgba(var(--primary-rgb, 126, 34, 206), 0.14));
        border-radius: 1rem;
        padding: 2rem 1.75rem 1.5rem;
        box-shadow: var(--shadow-lg, 0 18px 45px -18px rgba(var(--text-main-rgb, 46, 16, 101), 0.35));
        text-align: center;
      }
      .bo-lock-icon {
        width: 3.5rem;
        height: 3.5rem;
        margin: 0 auto 1rem;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #A855F7));
        color: var(--card-bg, #FFFFFF);
      }
      .bo-lock-icon .material-symbols-outlined {
        font-size: 1.85rem;
      }
      .bo-lock-title {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--text-main, #2E1065);
        margin: 0;
      }
      .bo-lock-subtitle {
        font-size: 0.78rem;
        color: var(--text-muted, #6B7280);
        margin: 0.35rem 0 1.4rem;
      }
      .bo-lock-checking {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.82rem;
        color: var(--text-muted, #6B7280);
        padding: 1.25rem 0;
      }
      .bo-lock-notice {
        display: flex;
        gap: 0.65rem;
        text-align: left;
        padding: 0.85rem;
        border-radius: 0.65rem;
        background: var(--warning-light, #FFFBEB);
        border: 1px solid var(--warning-light, #FDE68A);
        color: var(--warning, #92400E);
      }
      .bo-lock-notice strong {
        display: block;
        font-size: 0.82rem;
        margin-bottom: 0.15rem;
      }
      .bo-lock-notice p {
        font-size: 0.75rem;
        margin: 0;
        line-height: 1.45;
      }
      .bo-lock-form {
        text-align: left;
      }
      .bo-lock-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-main, #2E1065);
        margin-bottom: 0.4rem;
      }
      .bo-lock-input-wrap {
        position: relative;
      }
      .bo-lock-input {
        width: 100%;
        padding: 0.7rem 2.5rem 0.7rem 2.4rem;
        border: 1px solid var(--card-border, #E9D5FF);
        border-radius: 0.6rem;
        font-size: 0.85rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--text-main, #2E1065);
        background: var(--card-bg, #FFFFFF);
        outline: none;
      }
      .bo-lock-input:focus {
        border-color: var(--primary-hover, #A855F7);
        box-shadow: 0 0 0 3px var(--primary-light, rgba(168, 85, 247, 0.16));
      }
      .bo-lock-input-icon,
      .bo-lock-eye {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: var(--primary-hover, #9333EA);
        display: flex;
        align-items: center;
      }
      .bo-lock-input-icon {
        left: 0.7rem;
        font-size: 1.1rem;
        pointer-events: none;
      }
      .bo-lock-eye {
        right: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
      }
      .bo-lock-eye .material-symbols-outlined {
        font-size: 1.15rem;
      }
      .bo-lock-error {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--danger, #E11D48);
        margin: 0.6rem 0 0;
      }
      .bo-lock-error .material-symbols-outlined {
        font-size: 1rem;
      }
      .bo-lock-hint {
        font-size: 0.72rem;
        color: var(--text-muted, #6B7280);
        line-height: 1.45;
        margin: 0.7rem 0 1rem;
      }
      .bo-lock-submit {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        padding: 0.72rem;
        border: none;
        border-radius: 0.6rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--card-bg, #FFFFFF);
        background: linear-gradient(135deg, var(--primary, #7E22CE), var(--primary-hover, #A855F7));
        cursor: pointer;
      }
      .bo-lock-submit:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .bo-lock-footer {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-top: 1.35rem;
        padding-top: 1rem;
        border-top: 1px solid var(--card-border, #F3E8FF);
      }
      .bo-lock-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        background: none;
        border: none;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--primary, #7E22CE);
        cursor: pointer;
        padding: 0.3rem;
      }
      .bo-lock-link:hover {
        text-decoration: underline;
      }
      .bo-lock-link .material-symbols-outlined {
        font-size: 1rem;
      }
      .spin-icon {
        animation: bo-spin 1s linear infinite;
      }
      @keyframes bo-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class BackOfficeUnlockComponent implements OnInit {
  /** Raised once the password has been accepted and the grant stored. */
  @Output() unlocked = new EventEmitter<void>();

  public auth = inject(AuthService);
  public settingsService = inject(SettingsService);
  private access = inject(BackOfficeAccessService);
  private router = inject(Router);

  public isCheckingStatus = true;
  public isConfigured = false;
  public unlockTtlMinutes = 30;

  public password = '';
  public showPassword = false;
  public isUnlocking = false;
  public errorMessage = '';

  ngOnInit(): void {
    this.access.getStatus().subscribe({
      next: (res) => {
        this.isCheckingStatus = false;
        if (res.success && res.data) {
          this.isConfigured = res.data.configured;
          this.unlockTtlMinutes = res.data.unlockTtlMinutes;
        }
      },
      error: () => {
        // The error interceptor has already shown the reason. Fall back to the
        // prompt rather than the "not set up" notice: a failed status check is
        // not evidence that no password exists, and claiming otherwise would
        // send the operator off to set one they may already have.
        this.isCheckingStatus = false;
        this.isConfigured = true;
      },
    });
  }

  public onUnlock(): void {
    if (!this.password || this.isUnlocking) return;

    this.isUnlocking = true;
    this.errorMessage = '';

    this.access.unlock(this.password).subscribe({
      next: () => {
        this.isUnlocking = false;
        this.password = '';
        this.unlocked.emit();
      },
      error: (err) => {
        this.isUnlocking = false;
        this.password = '';
        this.errorMessage = err?.error?.message || 'Incorrect Back-Office password';
      },
    });
  }

  public goToPasswordPage(): void {
    this.router.navigate(['/admin/back-office-password']);
  }

  public goToPanel(): void {
    this.router.navigate(['/dashboard']);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="notificationService.confirmModal() as modal">
      <div
        class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl"
        [style.background]="'var(--card-bg, #ffffff)'"
        [style.border]="'1.5px solid var(--card-border, #E9D5FF)'"
        [style.color]="'var(--text-main, #2E1065)'"
      >
        <div class="flex items-center gap-3.5 mb-4">
          <span
            class="modal-icon-badge"
            [ngClass]="modal.isDestructive ? 'is-danger' : 'is-warning'"
          >
            <span class="material-symbols-outlined text-2xl">{{ modal.isDestructive ? 'warning' : 'priority_high' }}</span>
          </span>
          <div>
            <h3 class="text-lg font-black" [style.color]="'var(--text-main, #2E1065)'">{{ modal.title }}</h3>
            <p class="text-xs mt-0.5 font-medium" [style.color]="'var(--text-muted, #6B7280)'">{{ modal.message }}</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t" [style.border-color]="'var(--card-border, #E9D5FF)'">
          <button (click)="cancel(modal)" class="btn btn-secondary">
            {{ modal.cancelText || 'Cancel' }}
          </button>
          <button
            (click)="confirm(modal)"
            class="btn"
            [ngClass]="modal.isDestructive ? 'btn-danger' : 'btn-primary'"
          >
            {{ modal.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-danger {
      background: linear-gradient(135deg, var(--danger, #EF4444) 0%, var(--danger, #DC2626) 100%) !important;
      color: #FFFFFF !important;
      border: 1px solid var(--danger, #DC2626) !important;
      box-shadow: 0 4px 14px rgba(var(--danger-rgb, 220, 38, 38), 0.38) !important;
    }
    .btn-danger:hover {
      background: linear-gradient(135deg, var(--danger, #DC2626) 0%, var(--danger, #B91C1C) 100%) !important;
      color: #FFFFFF !important;
      border-color: var(--danger, #B91C1C) !important;
      box-shadow: 0 8px 22px -2px rgba(var(--danger-rgb, 220, 38, 38), 0.58) !important;
      transform: translateY(-1px);
    }
    .btn-danger:active {
      background: #991B1B !important;
      transform: translateY(0) scale(0.97);
    }
    .btn-danger::before {
      background: linear-gradient(135deg, var(--danger, #EF4444), var(--danger, #DC2626)) !important;
    }
    .btn-secondary {
      background: var(--card-bg, #ffffff) !important;
      color: var(--text-main, #334155) !important;
      border: 1.5px solid var(--card-border, #CBD5E1) !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }
    .btn-secondary:hover {
      background: var(--bg-app, #F8FAFC) !important;
      color: #0F172A !important;
      border-color: var(--text-dim, #94A3B8) !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
      transform: translateY(-1px);
    }
    .btn-secondary::before {
      display: none !important;
    }
  `]
})
export class ConfirmationDialogComponent {
  public notificationService = inject(NotificationService);

  confirm(modal: any) {
    modal.onConfirm();
    this.notificationService.closeConfirm();
  }

  cancel(modal: any) {
    if (modal.onCancel) modal.onCancel();
    this.notificationService.closeConfirm();
  }
}

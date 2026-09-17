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
        class="modal-content p-6 max-w-md shadow-2xl"
        [style.background]="'var(--card-bg, #ffffff)'"
        [style.border]="'1.5px solid var(--card-border, #E9D5FF)'"
        [style.color]="'var(--text-main, #2E1065)'"
      >
        <div class="flex items-center gap-3.5 mb-4">
          <div
            class="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm"
            [ngClass]="modal.isDestructive ? 'bg-red-50 text-[#DC2626] border border-red-200' : 'bg-orange-50 text-[#EA580C] border border-orange-200'"
          >
            <span class="material-symbols-outlined text-[24px]">{{ modal.isDestructive ? 'warning' : 'priority_high' }}</span>
          </div>
          <div>
            <h3 class="text-base font-black" [style.color]="'var(--text-main, #2E1065)'">{{ modal.title }}</h3>
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

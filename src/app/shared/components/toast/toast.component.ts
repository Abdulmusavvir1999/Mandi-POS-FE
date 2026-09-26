import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastPosition, ToastType, ToastMessage } from '../../../core/services/notification.service';
import { ActionLoadingDirective } from '../../directives/action-loading.directive';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ActionLoadingDirective],
  template: `
    <div
      class="toast-master-container"
      [ngClass]="positionClass"
      *ngIf="notificationService.toasts().length > 0"
    >
      @for (t of notificationService.toasts(); track t.id) {
        <div
          class="toast-card"
          [ngClass]="[
            'toast-' + t.type,
            'toast-anim-' + notificationService.config().animation,
            t.paused ? 'toast-paused' : ''
          ]"
          (mouseenter)="notificationService.pause(t.id)"
          (mouseleave)="notificationService.resume(t.id)"
        >
          <div class="toast-body">
            <!-- Icon Badge -->
            <div class="toast-icon-wrapper" [ngClass]="'icon-' + t.type">
              <span
                class="material-symbols-outlined toast-icon"
                [class.spin-icon]="t.type === 'loading'"
              >
                {{ getIconName(t.type) }}
              </span>
            </div>

            <!-- Text Content -->
            <div class="toast-content">
              <div class="toast-header-row">
                <span class="toast-title">{{ t.title }}</span>
                <span *ngIf="t.paused" class="toast-paused-badge">PAUSED</span>
              </div>
              <p class="toast-message">{{ t.message }}</p>
            </div>

            <!-- Close Button -->
            <button
              *ngIf="notificationService.config().showCloseButton"
              type="button"
              (click)="notificationService.remove(t.id)"
              class="toast-close-btn"
              title="Dismiss notification"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Hardware-accelerated Smooth CSS Progress Bar -->
          <div *ngIf="t.duration > 0" class="toast-progress-track">
            <div
              class="toast-progress-bar"
              [ngClass]="'bar-' + t.type"
              [style.animation-duration.ms]="t.duration"
            ></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* Master Container: Placed in 6 distinct screen locations with zero pointer collision */
      .toast-master-container {
        position: fixed;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        padding: 16px;
        max-width: 440px;
        width: 100%;
        box-sizing: border-box;
      }

      /* 6 Positions */
      .pos-top-right {
        top: 0;
        right: 0;
        align-items: flex-end;
      }
      .pos-top-center {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }
      .pos-top-left {
        top: 0;
        left: 0;
        align-items: flex-start;
      }
      .pos-bottom-right {
        bottom: 0;
        right: 0;
        align-items: flex-end;
      }
      .pos-bottom-center {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }
      .pos-bottom-left {
        bottom: 0;
        left: 0;
        align-items: flex-start;
      }

      /* Toast Card: Sleek, high-contrast, modern SaaS look */
      .toast-card {
        pointer-events: auto;
        position: relative;
        width: 100%;
        min-width: 300px;
        max-width: 400px;
        background: var(--card-bg, #ffffff);
        border-radius: 14px;
        overflow: hidden;
        border: 1.5px solid var(--card-border, rgba(0, 0, 0, 0.08));
        box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.25),
          0 4px 12px -2px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.2s ease;
      }

      .toast-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.32),
          0 6px 16px -3px rgba(0, 0, 0, 0.16);
      }

      .toast-paused {
        border-color: var(--primary, rgba(var(--primary-rgb, 126, 34, 206), 0.4));
      }

      /* Inner Body Layout */
      .toast-body {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
      }

      /* Icon Wrapper */
      .toast-icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .toast-icon {
        font-size: 20px;
      }

      .spin-icon {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Content */
      .toast-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .toast-header-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .toast-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-main, #0f172a);
        letter-spacing: -0.01em;
        line-height: 1.3;
      }

      .toast-paused-badge {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.05em;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--primary-light, #f3e8ff);
        color: var(--primary, #7e22ce);
      }

      .toast-message {
        font-size: 12px;
        font-weight: 500;
        color: var(--text-muted, #475569);
        line-height: 1.4;
        word-break: break-word;
        margin: 0;
      }

      /* Close Button */
      .toast-close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted, #94a3b8);
        cursor: pointer;
        padding: 4px;
        margin: -4px -4px 0 0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }

      .toast-close-btn:hover {
        background: var(--primary-light, rgba(255, 255, 255, 0.1));
        color: var(--text-main, #0f172a);
      }

      .toast-close-btn .material-symbols-outlined {
        font-size: 16px;
      }

      /* Progress Bar (Smooth 60fps CSS animation) */
      .toast-progress-track {
        width: 100%;
        height: 3.5px;
        background: rgba(0, 0, 0, 0.04);
        position: relative;
        overflow: hidden;
      }

      .toast-progress-bar {
        height: 100%;
        width: 100%;
        transform-origin: left;
        animation: toastLinearCountdown linear forwards;
      }

      .toast-paused .toast-progress-bar {
        animation-play-state: paused;
      }

      @keyframes toastLinearCountdown {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }

      /* ═══════════════════════════════════════════════ */
      /* TOAST TYPE THEMES (Border, Icon, Progress Bar)  */
      /* ═══════════════════════════════════════════════ */

      /* 1. Success */
      .toast-success {
        border-left: 4px solid var(--success, #16a34a);
      }
      .icon-success {
        background: rgba(var(--success-rgb, 22, 163, 74), 0.15);
        color: var(--success, #16a34a);
      }
      .bar-success {
        background: var(--success, #16a34a);
      }

      /* 2. Error */
      .toast-error {
        border-left: 4px solid var(--danger, #dc2626);
      }
      .icon-error {
        background: rgba(var(--danger-rgb, 220, 38, 38), 0.15);
        color: var(--danger, #dc2626);
      }
      .bar-error {
        background: var(--danger, #dc2626);
      }

      /* 3. Warning */
      .toast-warning {
        border-left: 4px solid var(--warning, #ea580c);
      }
      .icon-warning {
        background: rgba(var(--warning-rgb, 234, 88, 12), 0.15);
        color: var(--warning, #ea580c);
      }
      .bar-warning {
        background: var(--warning, #ea580c);
      }

      /* 4. Info */
      .toast-info {
        border-left: 4px solid var(--primary, #7e22ce);
      }
      .icon-info {
        background: var(--primary-light, #f3e8ff);
        color: var(--primary, #7e22ce);
      }
      .bar-info {
        background: var(--primary, #7e22ce);
      }

      /* 5. Loading */
      .toast-loading {
        border-left: 4px solid var(--primary, #2563eb);
      }
      .icon-loading {
        background: var(--primary-light, #dbeafe);
        color: var(--primary, #2563eb);
      }
      .bar-loading {
        background: var(--primary, #2563eb);
      }

      /* ═══════════════════════════════════════════════ */
      /* ANIMATIONS (Slide, Fade, Bounce)                */
      /* ═══════════════════════════════════════════════ */
      .toast-anim-slide {
        animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .toast-anim-fade {
        animation: toastFadeIn 0.25s ease-out forwards;
      }
      .toast-anim-bounce {
        animation: toastBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateY(-12px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes toastFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes toastBounceIn {
        0% {
          opacity: 0;
          transform: scale(0.85);
        }
        60% {
          opacity: 1;
          transform: scale(1.03);
        }
        100% {
          transform: scale(1);
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .toast-master-container {
          max-width: 100%;
          padding: 10px;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
          align-items: center !important;
        }
        .toast-card {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class ToastComponent {
  public notificationService = inject(NotificationService);

  get positionClass(): string {
    const pos = this.notificationService.config().position || 'top-right';
    return `pos-${pos}`;
  }

  getIconName(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'cancel';
      case 'warning':
        return 'warning';
      case 'loading':
        return 'progress_activity';
      default:
        return 'info';
    }
  }
}

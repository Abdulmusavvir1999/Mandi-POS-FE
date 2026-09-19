import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkResult } from '../../core/services/back-office.service';

/**
 * Outcome report for a bulk operation.
 *
 * A run that rejected some records must not be dismissed with a green toast —
 * this panel names every record that was refused and why, so a partial failure
 * can never read as a clean success.
 */
@Component({
  selector: 'app-back-office-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="result">
      <div class="modal-content p-6 md:p-7 w-full max-w-xl shadow-2xl bo-result-card">
        <div class="flex items-start gap-3.5 mb-4">
          <span class="modal-icon-badge" [ngClass]="hasFailures ? 'is-danger' : 'is-warning'">
            <span class="material-symbols-outlined text-2xl">
              {{ hasFailures ? (result.succeeded.length ? 'rule' : 'error') : 'task_alt' }}
            </span>
          </span>
          <div class="min-w-0">
            <h3 class="text-lg font-black bo-text-main">{{ title }}</h3>
            <p class="text-xs mt-0.5 font-medium bo-text-muted">
              {{ result.succeeded.length }} of {{ result.requested }} processed ·
              {{ result.failed.length }} rejected
            </p>
          </div>
        </div>

        <div class="bo-result-scroll">
          <div *ngIf="result.succeeded.length" class="mb-3">
            <div class="bo-result-heading is-ok">
              <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span>
              Completed
            </div>
            <div class="bo-result-row" *ngFor="let row of result.succeeded">
              <span class="bo-result-ref">{{ row.reference }}</span>
              <span class="bo-result-reason">{{ row.reason }}</span>
            </div>
          </div>

          <div *ngIf="hasFailures">
            <div class="bo-result-heading is-bad">
              <span class="material-symbols-outlined" style="font-size: 16px;">cancel</span>
              Not processed
            </div>
            <div class="bo-result-row is-bad" *ngFor="let row of result.failed">
              <span class="bo-result-ref">{{ row.reference }}</span>
              <span class="bo-result-reason">{{ row.reason }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-5 pt-4 bo-divider">
          <button type="button" class="btn btn-primary" (click)="close.emit()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bo-result-card {
        background: var(--card-bg, #ffffff);
        border: 1.5px solid var(--card-border, #e9d5ff);
        color: var(--text-main, #2e1065);
      }
      .bo-text-main {
        color: var(--text-main, #2e1065);
      }
      .bo-text-muted {
        color: var(--text-muted, #6b7280);
      }
      .bo-divider {
        border-top: 1px solid var(--card-border, #e9d5ff);
      }
      .bo-result-scroll {
        max-height: 46vh;
        overflow-y: auto;
        padding-right: 0.25rem;
      }
      .bo-result-heading {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.4rem;
      }
      .bo-result-heading.is-ok {
        color: #16a34a;
      }
      .bo-result-heading.is-bad {
        color: #dc2626;
      }
      .bo-result-row {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        padding: 0.45rem 0.6rem;
        border-radius: 0.55rem;
        background: rgba(22, 163, 74, 0.07);
        margin-bottom: 0.3rem;
      }
      .bo-result-row.is-bad {
        background: rgba(220, 38, 38, 0.08);
      }
      .bo-result-ref {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.72rem;
        font-weight: 800;
        white-space: nowrap;
        color: var(--text-main, #2e1065);
      }
      .bo-result-reason {
        font-size: 0.72rem;
        color: var(--text-muted, #6b7280);
        line-height: 1.35;
      }
    `,
  ],
})
export class BackOfficeResultComponent {
  @Input() result: BulkResult | null = null;
  @Input() title = 'Operation complete';
  @Output() close = new EventEmitter<void>();

  get hasFailures(): boolean {
    return !!this.result && this.result.failed.length > 0;
  }
}

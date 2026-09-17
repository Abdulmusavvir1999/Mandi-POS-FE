import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule, AppCurrencyPipe],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen">
      <div class="modal-content max-w-md p-0 overflow-hidden bg-[var(--card-bg)] text-[var(--text-main)] shadow-2xl border border-[var(--card-border)]">
        <!-- Header Controls -->
        <div class="flex items-center justify-between p-4 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-b border-[var(--sidebar-border)]">
          <div class="flex items-center gap-2">
            <span class="modal-icon-badge is-on-dark">
            <span class="material-symbols-outlined">print</span>
          </span>
            <span class="font-bold text-sm tracking-wide">Receipt Preview — {{ printData?.bill?.bill_number }}</span>
          </div>
          <button (click)="close.emit()" class="modal-close-btn is-on-dark" title="Close" aria-label="Close">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Scrollable Receipt Container -->
        <div class="p-6 overflow-y-auto max-h-[70vh] bg-[var(--bg-app)] flex justify-center">
          <div id="thermal-receipt" class="w-full bg-white p-4 text-xs font-mono border border-dashed border-gray-300 shadow-sm leading-tight text-gray-900">
            <!-- Shop Header -->
            <div class="text-center pb-3 border-b border-dashed border-gray-300">
              <div class="text-base font-extrabold uppercase tracking-wider text-gray-900">{{ printData?.receiptSettings?.businessName || settingsService.businessName() }}</div>
              <div class="text-[11px] text-gray-700 mt-1 whitespace-pre-line font-sans">{{ printData?.receiptSettings?.header }}</div>
              <div class="text-[10px] text-gray-600 mt-1 font-sans">{{ printData?.receiptSettings?.address }}</div>
              <div class="text-[10px] text-gray-600 font-sans">Tel: {{ printData?.receiptSettings?.phone }}</div>
              <div *ngIf="printData?.receiptSettings?.gstin" class="text-[10px] font-bold mt-0.5">GSTIN: {{ printData?.receiptSettings?.gstin }}</div>
            </div>

            <!-- Bill Meta -->
            <div class="py-2 border-b border-dashed border-gray-300 text-[11px]">
              <div class="flex justify-between">
                <span>Bill No: <strong>{{ printData?.bill?.bill_number }}</strong></span>
                <span>Type: <strong>{{ printData?.bill?.order_type }}</strong></span>
              </div>
              <div class="flex justify-between mt-0.5">
                <span>Date: {{ printData?.bill?.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>Cashier: {{ printData?.bill?.cashier_name || 'Staff' }}</span>
              </div>
              <div *ngIf="printData?.bill?.dining_table_id" class="flex justify-between mt-0.5 font-bold">
                <span>Table: {{ printData?.bill?.table_number }}</span>
                <span>Section: {{ printData?.bill?.table_name }}</span>
              </div>
              <div *ngIf="printData?.bill?.customer_name" class="mt-0.5">
                <span>Customer: {{ printData?.bill?.customer_name }} ({{ printData?.bill?.customer_phone }})</span>
              </div>
            </div>

            <!-- Items Table -->
            <div class="py-2 border-b border-dashed border-gray-300">
              <div class="flex justify-between font-bold border-b border-gray-200 pb-1 mb-1">
                <span class="w-1/2">Item</span>
                <span class="w-1/6 text-center">Qty</span>
                <span class="w-1/6 text-right">Rate</span>
                <span class="w-1/6 text-right">Amount</span>
              </div>
              <div *ngFor="let item of printData?.bill?.items" class="flex justify-between py-0.5">
                <span class="w-1/2 font-semibold truncate">{{ item.product_name }}</span>
                <span class="w-1/6 text-center">{{ item.quantity }}</span>
                <span class="w-1/6 text-right">{{ item.unit_price | appCurrency:'1.0-0' }}</span>
                <span class="w-1/6 text-right font-bold">{{ item.total_amount | appCurrency:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Financials Summary -->
            <div class="py-2 border-b border-dashed border-gray-300 text-[11px] space-y-1">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>{{ printData?.bill?.subtotal | appCurrency:'1.2-2' }}</span>
              </div>
              <div *ngIf="printData?.bill?.discount_amount > 0" class="flex justify-between text-[var(--danger)] font-bold">
                <span>Discount:</span>
                <span>- {{ printData?.bill?.discount_amount | appCurrency:'1.2-2' }}</span>
              </div>
              <div *ngIf="printData?.receiptSettings?.showTax && printData?.bill?.tax_amount > 0" class="flex justify-between">
                <span>GST / Tax:</span>
                <span>{{ printData?.bill?.tax_amount | appCurrency:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-sm font-extrabold pt-1 border-t border-gray-300 text-gray-900">
                <span>GRAND TOTAL:</span>
                <span>{{ printData?.bill?.total_amount | appCurrency:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-[10px] text-gray-600 pt-0.5 font-medium">
                <span>Paid via {{ printData?.bill?.payment_method }}:</span>
                <span class="font-bold">{{ printData?.bill?.total_amount | appCurrency:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Footer Message -->
            <div class="text-center pt-3 text-[10px] text-gray-600 whitespace-pre-line font-sans">
              <div>{{ printData?.receiptSettings?.footer }}</div>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] flex items-center justify-between gap-3">
          <button (click)="close.emit()" class="btn btn-secondary flex-1">
            Close
          </button>
          <button (click)="triggerPrint()" class="btn btn-primary flex-1 flex items-center justify-center gap-1.5 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">print</span>
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReceiptModalComponent {
  public settingsService = inject(SettingsService);

  @Input() isOpen = false;
  @Input() printData: any = null;
  @Output() close = new EventEmitter<void>();

  triggerPrint(): void {
    window.print();
  }
}

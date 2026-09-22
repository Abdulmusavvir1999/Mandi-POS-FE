import { Injectable, signal } from '@angular/core';
import { PrinterConfig } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  /**
   * Whether this bill's tax was already inside the price, rather than added.
   *
   * The answer is taken from the bill's own figures, not from today's setting:
   * a receipt reprinted after the rule was switched has to describe the bill
   * that was actually taken. Under EXCLUSIVE the total is the discounted
   * subtotal plus the tax and the charges; under INCLUSIVE the tax is already
   * counted in the subtotal, so leaving it out is what reconciles.
   */
  public static taxIsInsideTotal(bill: any): boolean {
    const num = (...keys: string[]): number => {
      for (const k of keys) {
        const v = Number(bill?.[k]);
        if (Number.isFinite(v) && v !== 0) return v;
      }
      return 0;
    };

    const tax = num('tax_amount', 'taxAmount');
    if (tax <= 0) return false;

    const base =
      num('subtotal') -
      num('discount_amount', 'discountAmount') -
      num('coupon_discount', 'couponDiscount') +
      num('service_charge_amount', 'serviceChargeAmount') +
      num('surcharge_amount', 'surchargeAmount');
    const total = num('total_amount', 'totalAmount', 'grandTotal');
    if (total <= 0) return false;

    return Math.abs(total - base) < Math.abs(total - (base + tax));
  }

  private readonly STORAGE_PRINTER_KEY = '_pos_printer_config';

  public config = signal<PrinterConfig>(this.loadConfig());

  public loadConfig(): PrinterConfig {
    try {
      const raw = localStorage.getItem(this.STORAGE_PRINTER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch { }

    return {
      receiptPrinter: {
        enabled: true,
        name: 'Cashier Thermal Receipt Printer',
        paperWidth: '80mm',
        autoPrintOnCheckout: true,
      },
      kitchenPrinter: {
        enabled: true,
        name: 'Kitchen Order Ticket (KOT) Printer',
        paperWidth: '80mm',
        autoPrintKot: true,
      },
      barPrinter: {
        enabled: false,
        name: 'Bar Beverage Printer',
        paperWidth: '80mm',
        autoPrintKot: false,
      },
    };
  }

  public saveConfig(cfg: PrinterConfig): void {
    this.config.set(cfg);
    try {
      localStorage.setItem(this.STORAGE_PRINTER_KEY, JSON.stringify(cfg));
    } catch { }
  }

  /**
   * Generates and triggers a browser print window with formatted thermal CSS.
   */
  private triggerPrintWindow(title: string, innerHtml: string, width: string): void {
    const printWin = window.open('', '_blank', 'width=450,height=650');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin: 0; size: ${width === '58mm' ? '58mm auto' : '80mm auto'}; }
            body {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 12px;
              line-height: 1.35;
              color: #000;
              margin: 0;
              padding: 10px;
              width: ${width === '58mm' ? '48mm' : '72mm'};
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .border-t { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
            .flex { display: flex; justify-content: space-between; }
            .badge { display: inline-block; padding: 1px 4px; border: 1px solid #000; font-size: 10px; }
          </style>
        </head>
        <body>
          ${innerHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  /**
   * Print Thermal Customer Receipt
   */
  public printThermalReceipt(bill: any, settings: any = { businessName: ' RESTAURANT', contactPhone: '+91 98765 43210' }): void {
    const width = this.config().receiptPrinter.paperWidth || '80mm';
    const itemsHtml = (bill.items || []).map((it: any) => `
      <div class="flex" style="margin-bottom: 3px;">
        <span style="flex: 1;">
          ${it.product_name || it.productName}${it.variant_name || it.variantName ? ' (' + (it.variant_name || it.variantName) + ')' : ''}
          ${it.is_complimentary || it.isComplimentary ? ' <span class="badge">[FREE]</span>' : ''}
          <br><small style="color: #444;">${it.quantity} x ${(it.is_complimentary || it.isComplimentary ? 0 : it.unit_price || it.unitPrice).toFixed(0)}</small>
        </span>
        <span class="text-right font-bold" style="width: 60px;">
          ₹${(it.is_complimentary || it.isComplimentary ? 0 : (it.subtotal || (it.quantity * it.unitPrice))).toFixed(0)}
        </span>
      </div>
    `).join('');

    const html = `
      <div class="text-center border-b">
        <h2 style="margin: 0; font-size: 16px;">${settings?.businessName || ' RESTAURANT'}</h2>
        <div style="font-size: 11px;">${settings?.address || ''}</div>
        <div style="font-size: 11px;">Tel: ${settings?.phone || ''}</div>
        ${settings?.gstin ? `<div style="font-size: 11px; font-weight: bold;">GSTIN: ${settings.gstin}</div>` : ''}
      </div>

      <div class="border-b" style="font-size: 11px;">
        <div class="flex"><span>Bill: <strong>#${bill.bill_number || bill.billNumber}</strong></span><span>Type: <strong>${bill.order_type || bill.orderType}</strong></span></div>
        <div class="flex"><span>Date: ${new Date(bill.created_at || bill.timestamp || Date.now()).toLocaleString()}</span><span>Cashier: ${bill.cashier_name || 'Staff'}</span></div>
        ${bill.table_number || bill.tableNumber ? `<div>Table: <strong>${bill.table_number || bill.tableNumber}</strong></div>` : ''}
        ${bill.customer_name || bill.customerName ? `<div>Guest: <strong>${bill.customer_name || bill.customerName}</strong> (${bill.customer_phone || bill.customerPhone || ''})</div>` : ''}
      </div>

      <div class="border-b">
        <div class="flex font-bold" style="margin-bottom: 4px;"><span>Item</span><span class="text-right" style="width: 60px;">Total</span></div>
        ${itemsHtml}
      </div>

      <div class="border-b" style="font-size: 11px;">
        <div class="flex"><span>Subtotal:</span><span>₹${Number(bill.subtotal || 0).toFixed(0)}</span></div>
        ${Number(bill.discount_amount || bill.discountAmount || 0) > 0 ? `<div class="flex"><span>Discount:</span><span>-₹${Number(bill.discount_amount || bill.discountAmount).toFixed(0)}</span></div>` : ''}
        ${Number(bill.coupon_discount || bill.couponDiscount || 0) > 0 ? `<div class="flex"><span>Coupon (${bill.coupon_code || bill.couponCode}):</span><span>-₹${Number(bill.coupon_discount || bill.couponDiscount).toFixed(0)}</span></div>` : ''}
        ${Number(bill.tax_amount || bill.taxAmount || 0) > 0
        ? `<div class="flex"><span>Tax / GST${PrinterService.taxIsInsideTotal(bill) ? ' (incl.)' : ''}:</span><span>${PrinterService.taxIsInsideTotal(bill) ? '' : '+'}₹${Number(bill.tax_amount || bill.taxAmount).toFixed(0)}</span></div>`
        : ''}
        ${Number(bill.service_charge_amount || bill.serviceChargeAmount || 0) > 0 ? `<div class="flex"><span>Service Charge:</span><span>+₹${Number(bill.service_charge_amount || bill.serviceChargeAmount).toFixed(0)}</span></div>` : ''}
        ${Number(bill.surcharge_amount || bill.surchargeAmount || 0) > 0 ? `<div class="flex"><span>Packaging/Surcharge:</span><span>+₹${Number(bill.surcharge_amount || bill.surchargeAmount).toFixed(0)}</span></div>` : ''}
      </div>

      <div class="flex font-bold" style="font-size: 15px; margin: 6px 0;">
        <span>GRAND TOTAL:</span>
        <span>₹${Number(bill.total_amount || bill.grandTotal || 0).toFixed(0)}</span>
      </div>

      <div class="border-t" style="font-size: 11px;">
        <div class="flex"><span>Paid Via:</span><span><strong>${bill.payment_method || bill.paymentMethod}</strong></span></div>
        ${bill.cash_tendered || bill.cashTendered ? `<div class="flex"><span>Cash Tendered:</span><span>₹${Number(bill.cash_tendered || bill.cashTendered).toFixed(0)}</span></div>` : ''}
        ${bill.change_returned || bill.changeReturned ? `<div class="flex"><span>Change Returned:</span><span>₹${Number(bill.change_returned || bill.changeReturned).toFixed(0)}</span></div>` : ''}
      </div>

      <div class="text-center border-t" style="margin-top: 10px; font-size: 10px;">
        <div>${settings?.footer || 'Thank you for dining with us! Please visit again.'}</div>
        <div style="margin-top: 4px; color: #666;">Powered by  POS</div>
      </div>
    `;

    this.triggerPrintWindow(`Receipt #${bill.bill_number || bill.billNumber}`, html, width);
  }

  /**
   * Print Kitchen Order Ticket (KOT)
   */
  public printKot(kotData: any): void {
    const width = this.config().kitchenPrinter.paperWidth || '80mm';
    const itemsHtml = (kotData.items || []).map((it: any) => `
      <div class="flex font-bold" style="font-size: 13px; margin-bottom: 4px;">
        <span style="flex: 1;">
          ${it.productName}${it.variantName ? ' (' + it.variantName + ')' : ''}
          ${it.isComplimentary ? ' [FREE]' : ''}
          ${it.notes ? `<br><small style="font-weight: normal; color: #444;">Note: ${it.notes}</small>` : ''}
        </span>
        <span class="text-right font-bold" style="width: 40px; font-size: 15px;">
          x${it.quantity}
        </span>
      </div>
    `).join('');

    const html = `
      <div class="text-center border-b">
        <h2 style="margin: 0; font-size: 16px;">*** KITCHEN ORDER TICKET ***</h2>
        <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">${kotData.kotNumber || 'KOT'}</div>
      </div>

      <div class="border-b" style="font-size: 12px;">
        <div class="flex"><span>Type: <strong>${kotData.orderType}</strong></span><span>Table: <strong>${kotData.tableNumber}</strong></span></div>
        <div class="flex"><span>Time: ${new Date(kotData.orderTime || Date.now()).toLocaleTimeString()}</span><span>Server: ${kotData.cashierName || 'Staff'}</span></div>
        ${kotData.notes ? `<div style="margin-top: 3px; font-weight: bold; color: #b00;">Order Note: ${kotData.notes}</div>` : ''}
      </div>

      <div class="border-b" style="padding: 6px 0;">
        ${itemsHtml}
      </div>

      <div class="text-center" style="font-size: 10px; margin-top: 6px;">
        *** Send to Chef Station ***
      </div>
    `;

    this.triggerPrintWindow(`KOT - ${kotData.tableNumber || 'Order'}`, html, width);
  }

  /**
   * Print End-of-Day Closing (Z-Report)
   */
  public printDayClosingZReport(closing: any, settings: any = { businessName: ' RESTAURANT' }): void {
    const width = '80mm';
    const html = `
      <div class="text-center border-b">
        <h2 style="margin: 0; font-size: 16px;">*** Z-REPORT (DAY CLOSING) ***</h2>
        <div style="font-size: 12px; font-weight: bold;">${settings?.businessName || ' RESTAURANT'}</div>
        <div style="font-size: 11px;">Ref: <strong>#${closing.closing_number}</strong></div>
      </div>

      <div class="border-b" style="font-size: 11px;">
        <div class="flex"><span>Cashier:</span><span><strong>${closing.cashier_name || 'Staff'}</strong></span></div>
        <div class="flex"><span>Period Start:</span><span>${new Date(closing.opening_time).toLocaleString()}</span></div>
        <div class="flex"><span>Closing Time:</span><span>${new Date(closing.closing_time || closing.created_at).toLocaleString()}</span></div>
        <div class="flex"><span>Total Bills:</span><span><strong>${closing.total_bills_count} bills</strong></span></div>
      </div>

      <div class="border-b" style="font-size: 11px;">
        <div class="flex font-bold"><span style="text-decoration: underline;">PAYMENT SUMMARY</span><span>AMOUNT</span></div>
        <div class="flex"><span>Cash Sales:</span><span>₹${Number(closing.total_cash_sales).toFixed(0)}</span></div>
        <div class="flex"><span>Card Sales:</span><span>₹${Number(closing.total_card_sales).toFixed(0)}</span></div>
        <div class="flex"><span>UPI Sales:</span><span>₹${Number(closing.total_upi_sales).toFixed(0)}</span></div>
        <div class="flex"><span>Online Sales:</span><span>₹${Number(closing.total_online_sales).toFixed(0)}</span></div>
      </div>

      <div class="border-b" style="font-size: 11px;">
        <div class="flex font-bold"><span>Gross Sales:</span><span>₹${Number(closing.gross_sales).toFixed(0)}</span></div>
        <div class="flex"><span>Discounts Given:</span><span>-₹${Number(closing.total_discounts).toFixed(0)}</span></div>
        <div class="flex"><span>Tax Collected:</span><span>₹${Number(closing.total_tax).toFixed(0)}</span></div>
        <div class="flex"><span>Service Charges:</span><span>₹${Number(closing.total_service_charges).toFixed(0)}</span></div>
        <div class="flex"><span>Voided Bills (${closing.void_bills_count}):</span><span style="color: #b00;">-₹${Number(closing.void_bills_amount).toFixed(0)}</span></div>
      </div>

      <div class="border-b" style="font-size: 12px; font-weight: bold;">
        <div class="flex"><span>Opening Cash:</span><span>₹${Number(closing.opening_cash).toFixed(0)}</span></div>
        <div class="flex"><span>Expected Cash in Till:</span><span>₹${Number(closing.expected_cash).toFixed(0)}</span></div>
        <div class="flex"><span>Actual Counted Cash:</span><span>₹${Number(closing.actual_cash).toFixed(0)}</span></div>
        <div class="flex" style="color: ${closing.cash_variance >= 0 ? '#080' : '#b00'};">
          <span>Variance (${closing.cash_variance >= 0 ? 'Surplus' : 'Shortage'}):</span>
          <span>₹${Number(closing.cash_variance).toFixed(0)}</span>
        </div>
      </div>

      ${closing.notes ? `<div class="border-b" style="font-size: 11px;"><strong>Notes:</strong> ${closing.notes}</div>` : ''}

      <div class="text-center" style="font-size: 10px; margin-top: 10px;">
        <div>Manager Signature: __________________</div>
        <div style="margin-top: 6px;">*** END OF DAY REPORT ***</div>
      </div>
    `;

    this.triggerPrintWindow(`Z-Report - ${closing.closing_number}`, html, width);
  }
}

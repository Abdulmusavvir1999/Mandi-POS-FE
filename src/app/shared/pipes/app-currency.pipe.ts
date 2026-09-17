import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatNumber } from '@angular/common';
import { SettingsService } from '../../core/services/settings.service';

/**
 * Formats a monetary amount using the currency symbol stored in the database
 * (settings key CURRENCY_SYMBOL). Nothing about the currency is hardcoded in
 * the client: if the setting has not loaded or is not configured, the amount is
 * rendered on its own rather than falling back to an invented symbol.
 *
 * Declared impure so the rendered symbol updates once the settings request
 * resolves and whenever an admin saves a new one.
 */
@Pipe({
  name: 'appCurrency',
  standalone: true,
  pure: false,
})
export class AppCurrencyPipe implements PipeTransform {
  private settingsService = inject(SettingsService);

  transform(value: number | string | null | undefined, digits = '1.2-2'): string {
    if (value === null || value === undefined || value === '') return '';

    const amount = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(amount)) return '';

    const formatted = formatNumber(amount, 'en-US', digits);
    const symbol = this.settingsService.currencySymbol();

    if (!symbol) return formatted;
    // Word-like codes (SAR, USD) read better spaced; glyphs (₹, $) sit tight.
    return /^[A-Za-z]{2,}$/.test(symbol) ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
  }
}

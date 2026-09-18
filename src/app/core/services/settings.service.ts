import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly API_URL = `${environment.apiUrl}/settings`;
  private http = inject(HttpClient);

  /** Publicly readable settings (GENERAL / POS / THEME), shared by every component. */
  private readonly publicSettings = signal<Record<string, string>>({});
  private publicSettings$: Observable<Record<string, string>> | null = null;

  public readonly settingsMap = this.publicSettings.asReadonly();

  /** Currency symbol from the database; empty until settings load (never a hardcoded default). */
  public readonly currencySymbol = computed(
    () => this.publicSettings()['CURRENCY_SYMBOL'] || this.publicSettings()['currency_symbol'] || ''
  );

  /** Registered trade name, sourced from the database instead of being hardcoded per page. */
  public readonly businessName = computed(
    () => this.publicSettings()['BUSINESS_NAME'] || this.publicSettings()['restaurant_name'] || ''
  );


  /**
   * Uploaded branding is stored as a server path (`/uploads/branding/...`), which
   * has to be resolved against the API host - the app is served from a different
   * port. Anything already absolute, or a bundled asset path, is left alone.
   */
  public assetUrl(value: string): string {
    if (!value) return '';
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (!value.startsWith('/uploads/')) return value;
    // Strip the /api segment off the API base, not off API_URL - that one
    // already has "/settings" appended, so the anchored /api$ never matched and
    // every stored upload resolved to .../api/settings/uploads/... and 404'd.
    return environment.apiUrl.replace(/\/api\/?$/, '') + value;
  }

  /** Brand logo chosen in Settings -> Store; empty falls back to the storefront glyph. */
  public readonly brandLogoUrl = computed(() =>
    this.assetUrl(this.publicSettings()['BRANDING_LOGO'] || '')
  );

  /** Login hero image chosen in Settings -> Store; empty falls back to the bundled asset. */
  public readonly loginImageUrl = computed(() =>
    this.assetUrl(this.publicSettings()['BRANDING_LOGIN_IMAGE'] || '')
  );

  /** Favicon chosen in Settings -> Store; empty keeps the one in index.html. */
  public readonly faviconUrl = computed(() =>
    this.assetUrl(this.publicSettings()['BRANDING_FAVICON'] || '')
  );

  /** Browser/window title chosen in Settings -> Store, falling back to the trade name. */
  public readonly appTitle = computed(
    () => this.publicSettings()['BRANDING_APP_TITLE'] || ''
  );

  constructor() {
    // Bootstrap read of branding/theme. A failure must not escape the injector
    // — the app falls back to its built-in defaults instead of failing to boot.
    this.loadPublicSettings().subscribe({ error: () => {} });
  }

  /**
   * Normalises every settings payload the API returns into one flat key/value map:
   *   - `/settings/public` -> already flat
   *   - `/settings`, `/settings/save` -> grouped by category, e.g. { GENERAL: {...}, THEME: {...} }
   *   - legacy `{ list, map }` -> the `map` member
   */
  private flatten(data: any): Record<string, string> {
    if (!data || typeof data !== 'object') return {};
    if (data.map && typeof data.map === 'object') return this.flatten(data.map);

    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !['system_theme', 'system_toast', 'system_business', 'system_hardware', 'system_branding', 'system_pos_design', 'system_dish_layout', 'system_dining_layout', 'system_category_layout', 'system_stock_layout', 'system_customer_layout', 'system_staff_layout'].includes(key)) {
        Object.assign(flat, this.flatten(value));
      } else {
        flat[key] = typeof value === 'object' ? JSON.stringify(value) : (value as string);
      }
    }

    // Unpack system_business JSON
    const rawBusiness = flat['system_business'] || flat['SYSTEM_BUSINESS'];
    if (rawBusiness) {
      try {
        const b = typeof rawBusiness === 'string' ? JSON.parse(rawBusiness) : rawBusiness;
        if (b && typeof b === 'object') {
          const name = b.restaurant_name || b.businessName || '';
          const phone = b.receipt_phone || b.businessPhone || '';
          const email = b.businessEmail || '';
          const address = b.receipt_address || b.businessAddress || '';
          const gstin = b.tax_identification_number || b.businessGstin || '';
          const currency = b.currency_symbol || b.currencySymbol || '₹';
          const taxRate = b.tax_rate_percentage !== undefined ? b.tax_rate_percentage : (b.taxPercentage !== undefined ? b.taxPercentage : 5);
          const header = b.receipt_header_title || b.receiptHeader || name;
          const tagline = b.receipt_tagline || b.receiptTagline || '';
          const footer = b.receipt_footer_note || b.receiptFooter || 'Thank you for dining with us! Come again.';

          if (name) {
            flat['BUSINESS_NAME'] = name;
            flat['restaurant_name'] = name;
          }
          if (phone) {
            flat['BUSINESS_PHONE'] = phone;
            flat['receipt_phone'] = phone;
          }
          if (email) flat['BUSINESS_EMAIL'] = email;
          if (address) {
            flat['BUSINESS_ADDRESS'] = address;
            flat['receipt_address'] = address;
          }
          if (gstin) {
            flat['BUSINESS_GSTIN'] = gstin;
            flat['tax_identification_number'] = gstin;
          }
          if (currency) {
            flat['CURRENCY_SYMBOL'] = currency;
            flat['currency_symbol'] = currency;
          }
          if (taxRate !== undefined) {
            flat['TAX_PERCENTAGE'] = String(taxRate);
            flat['tax_rate_percentage'] = String(taxRate);
          }
          if (header) {
            flat['RECEIPT_HEADER'] = header;
            flat['receipt_header_title'] = header;
          }
          if (tagline) {
            flat['RECEIPT_TAGLINE'] = tagline;
            flat['receipt_tagline'] = tagline;
          }
          if (footer) {
            flat['RECEIPT_FOOTER'] = footer;
            flat['receipt_footer_note'] = footer;
          }
          if (b.taxEnabled !== undefined) flat['TAX_ENABLED'] = String(b.taxEnabled);
          if (b.taxName) flat['TAX_NAME'] = b.taxName;
          if (b.allowNegativeStock !== undefined) flat['POS_ALLOW_NEGATIVE_STOCK'] = String(b.allowNegativeStock);
          if (b.defaultOrderType) flat['POS_DEFAULT_ORDER_TYPE'] = b.defaultOrderType;
        }
      } catch (_) {}
    }


    // Unpack system_branding JSON (brand logo, login image, favicon, window title)
    const rawBranding = flat['system_branding'] || flat['SYSTEM_BRANDING'];
    if (rawBranding) {
      try {
        const b = typeof rawBranding === 'string' ? JSON.parse(rawBranding) : rawBranding;
        if (b && typeof b === 'object') {
          if (b.logo) flat['BRANDING_LOGO'] = b.logo;
          if (b.loginImage) flat['BRANDING_LOGIN_IMAGE'] = b.loginImage;
          if (b.favicon) flat['BRANDING_FAVICON'] = b.favicon;
          if (b.appTitle) flat['BRANDING_APP_TITLE'] = b.appTitle;
        }
      } catch (_) {}
    }
    // Unpack system_hardware JSON
    const rawHardware = flat['system_hardware'] || flat['SYSTEM_HARDWARE'];
    if (rawHardware) {
      try {
        const h = typeof rawHardware === 'string' ? JSON.parse(rawHardware) : rawHardware;
        if (h && typeof h === 'object') {
          if (h.receiptHeader || h.receipt_header_title) {
            flat['RECEIPT_HEADER'] = h.receiptHeader || h.receipt_header_title;
            flat['receipt_header_title'] = flat['RECEIPT_HEADER'];
          }
          if (h.receiptTagline || h.receipt_tagline) {
            flat['RECEIPT_TAGLINE'] = h.receiptTagline || h.receipt_tagline;
            flat['receipt_tagline'] = flat['RECEIPT_TAGLINE'];
          }
          if (h.receiptFooter || h.receipt_footer_note) {
            flat['RECEIPT_FOOTER'] = h.receiptFooter || h.receipt_footer_note;
            flat['receipt_footer_note'] = flat['RECEIPT_FOOTER'];
          }
          if (h.receiptPaperWidth || h.thermal_printer_paper_width) {
            flat['RECEIPT_PAPER_WIDTH'] = h.receiptPaperWidth || h.thermal_printer_paper_width;
            flat['thermal_printer_paper_width'] = flat['RECEIPT_PAPER_WIDTH'];
          }
          if (h.receiptShowCustomer !== undefined) flat['RECEIPT_SHOW_CUSTOMER'] = String(h.receiptShowCustomer);
          if (h.posSoundEffects !== undefined) flat['POS_SOUND_EFFECTS'] = String(h.posSoundEffects);
        }
      } catch (_) {}
    }

    // Unpack system_toast JSON
    const rawToast = flat['system_toast'] || flat['SYSTEM_TOAST'];
    if (rawToast) {
      try {
        const t = typeof rawToast === 'string' ? JSON.parse(rawToast) : rawToast;
        if (t && typeof t === 'object') {
          if (t.position) flat['TOAST_POSITION'] = t.position;
          if (t.duration) flat['TOAST_DURATION'] = String(t.duration);
          if (t.maxVisible) flat['TOAST_MAX_VISIBLE'] = String(t.maxVisible);
          if (t.showClose !== undefined) flat['TOAST_SHOW_CLOSE'] = String(t.showClose);
          if (t.pauseOnHover !== undefined) flat['TOAST_PAUSE_HOVER'] = String(t.pauseOnHover);
          if (t.animation) flat['TOAST_ANIMATION'] = t.animation;
        }
      } catch (_) {}
    }

    return flat;
  }

  /** Fetches `/settings/public` once and replays it to every later caller. */
  public loadPublicSettings(): Observable<Record<string, string>> {
    if (!this.publicSettings$) {
      this.publicSettings$ = this.http
        .get<ApiResponse<Record<string, string>>>(`${this.API_URL}/public`)
        .pipe(
          map((res) => this.flatten(res?.data)),
          tap((settings) => this.publicSettings.set(settings)),
          catchError(() => {
            // Allow a retry on the next caller if the API was still starting up.
            this.publicSettings$ = null;
            return of({} as Record<string, string>);
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.publicSettings$;
  }

  public getSettings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(this.API_URL);
  }

  public getPublicSettings(): Observable<ApiResponse<Record<string, string>>> {
    return this.http.get<ApiResponse<Record<string, string>>>(`${this.API_URL}/public`);
  }

  public updateSettings(settings: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(this.API_URL, settings).pipe(
      tap((res) => {
        // Keep the shared store in step with what was just saved.
        if (res?.data) {
          this.publicSettings.set(this.flatten(res.data));
          this.publicSettings$ = null;
        }
      })
    );
  }


  /**
   * Sends a branding image as a base64 data URL and returns the stored path.
   * The value still has to be saved with the Store tab to take effect.
   */
  public uploadBrandingImage(slot: 'logo' | 'login' | 'favicon', dataUrl: string): Observable<ApiResponse<{ url: string; fileName: string; bytes: number }>> {
    return this.http.post<ApiResponse<{ url: string; fileName: string; bytes: number }>>(
      `${this.API_URL}/branding/upload`,
      { slot, dataUrl }
    );
  }
  public saveTabSettings(tab: string, settings: Record<string, any>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/save`, { tab, settings }).pipe(
      tap((res) => {
        if (res?.data) {
          this.publicSettings.set(this.flatten(res.data));
          this.publicSettings$ = null;
        }
      })
    );
  }
}

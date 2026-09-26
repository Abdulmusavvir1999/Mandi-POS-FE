import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { CustomizationService } from './customization.service';
import { ThemeService } from './theme.service';

export type StockDesignKey = 'warehouse' | 'financial' | 'kanban' | 'list' | 'card';

export interface StockTokens {
  /** Page / Canvas background behind stock elements */
  canvasBg: string;
  /** Tile / row / card surface */
  cardBg: string;
  cardBorder: string;
  /** Text colors */
  textColor: string;
  textMuted: string;
  /** Accents & status */
  accentColor: string;
  statusHealthyColor: string;
  statusWarningColor: string;
  statusCriticalColor: string;
  valuationColor: string;
  /** Sizing and spacing metrics */
  cardScale: number; // percentage (80 - 130)
  cardRadius: number; // px (0 - 32)
  padding: number; // px (6 - 32)
  gridGap: number; // px (8 - 40)
  fontSize: number; // px (11 - 20)
  /** Button styling */
  buttonBg: string;
  buttonColor: string;
}

export type StockTokenKey = keyof StockTokens;

export type StockTokenGroup =
  | 'Surface & Background'
  | 'Typography & Colors'
  | 'Stock Health & Valuation'
  | 'Sizing & Spacing'
  | 'Buttons & Actions';

export interface StockTokenMeta {
  key: StockTokenKey;
  label: string;
  group: StockTokenGroup;
  type: 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const STOCK_TOKEN_META: StockTokenMeta[] = [
  // Surface
  { key: 'canvasBg', label: 'Ledger Background', group: 'Surface & Background', type: 'color' },
  { key: 'cardBg', label: 'Card / Row Surface', group: 'Surface & Background', type: 'color' },
  { key: 'cardBorder', label: 'Card / Row Border', group: 'Surface & Background', type: 'color' },

  // Typography
  { key: 'textColor', label: 'Item Name & SKU Text', group: 'Typography & Colors', type: 'color' },
  { key: 'textMuted', label: 'Meta & Subtext Color', group: 'Typography & Colors', type: 'color' },
  { key: 'accentColor', label: 'SKU & Header Accent', group: 'Typography & Colors', type: 'color' },

  // Health & Valuation
  { key: 'statusHealthyColor', label: 'Optimal Stock (Good)', group: 'Stock Health & Valuation', type: 'color' },
  { key: 'statusWarningColor', label: 'Low Stock Alert (Warning)', group: 'Stock Health & Valuation', type: 'color' },
  { key: 'statusCriticalColor', label: 'Depleted / Out of Stock', group: 'Stock Health & Valuation', type: 'color' },
  { key: 'valuationColor', label: 'Inventory Valuation Badge', group: 'Stock Health & Valuation', type: 'color' },

  // Sizing & Spacing
  { key: 'cardScale', label: 'Scale Factor', group: 'Sizing & Spacing', type: 'range', min: 80, max: 130, step: 1, unit: '%' },
  { key: 'cardRadius', label: 'Corner Radius', group: 'Sizing & Spacing', type: 'range', min: 0, max: 28, step: 1, unit: 'px' },
  { key: 'padding', label: 'Internal Padding', group: 'Sizing & Spacing', type: 'range', min: 8, max: 32, step: 1, unit: 'px' },
  { key: 'gridGap', label: 'Grid / Row Spacing', group: 'Sizing & Spacing', type: 'range', min: 6, max: 32, step: 1, unit: 'px' },
  { key: 'fontSize', label: 'Base Text Size', group: 'Sizing & Spacing', type: 'range', min: 11, max: 20, step: 1, unit: 'px' },

  // Buttons
  { key: 'buttonBg', label: 'Action Button Background', group: 'Buttons & Actions', type: 'color' },
  { key: 'buttonColor', label: 'Action Button Text', group: 'Buttons & Actions', type: 'color' },
];

export interface StockDesignOption {
  key: StockDesignKey;
  label: string;
  subtitle: string;
  badge?: string;
  description: string;
}

export const STOCK_DESIGN_OPTIONS: StockDesignOption[] = [
  {
    key: 'warehouse',
    label: 'Warehouse Metric Grid',
    subtitle: 'Industrial Inventory Management',
    badge: 'Standard',
    description:
      'High-impact metric cards with SKU badges, inventory health meters, live valuation chips, and quick action bars.',
  },
  {
    key: 'financial',
    label: 'Audited Financial Ledger',
    subtitle: 'Corporate Balance & Cost Grid',
    description:
      'Data-dense tabular ledger with column-level accounting, weighted unit costs, audit flags, and valuation summaries.',
  },
  {
    key: 'kanban',
    label: 'Compact Kanban Stock Tiles',
    subtitle: 'High-Density Operational Grid',
    description:
      'Streamlined compact tiles grouping quantity meters, threshold indicators, and fast adjustment controls.',
  },
  {
    key: 'list',
    label: 'List View',
    subtitle: 'Classic Comprehensive Tabular Row',
    description:
      'Full-width structured ledger rows with SKU chips, unit types, live balances, health indicators, and direct actions.',
  },
  {
    key: 'card',
    label: 'Card View',
    subtitle: 'Executive Inventory Showcase Cards',
    description:
      'Multi-column cards featuring prominent health meters, dual valuation/cost widgets, and instant purchase triggers.',
  },
];

export const STOCK_DEFAULT_TOKENS: Record<StockDesignKey, StockTokens> = {
  warehouse: {
    canvasBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBorder: '#CBD5E1',
    textColor: '#0F172A',
    textMuted: '#64748B',
    accentColor: '#2563EB',
    statusHealthyColor: '#16A34A',
    statusWarningColor: '#D97706',
    statusCriticalColor: '#DC2626',
    valuationColor: '#7E22CE',
    cardScale: 100,
    cardRadius: 14,
    padding: 18,
    gridGap: 18,
    fontSize: 14,
    buttonBg: '#F1F5F9',
    buttonColor: '#1E293B',
  },
  financial: {
    canvasBg: '#F1F5F9',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    textColor: '#1E293B',
    textMuted: '#64748B',
    accentColor: '#0F766E',
    statusHealthyColor: '#059669',
    statusWarningColor: '#D97706',
    statusCriticalColor: '#E11D48',
    valuationColor: '#0369A1',
    cardScale: 100,
    cardRadius: 10,
    padding: 14,
    gridGap: 14,
    fontSize: 13,
    buttonBg: '#F8FAFC',
    buttonColor: '#0F766E',
  },
  kanban: {
    canvasBg: '#F5F3FF',
    cardBg: '#FFFFFF',
    cardBorder: '#E9D5FF',
    textColor: '#2E1065',
    textMuted: '#7C3AED',
    accentColor: '#7E22CE',
    statusHealthyColor: '#10B981',
    statusWarningColor: '#F59E0B',
    statusCriticalColor: '#EF4444',
    valuationColor: '#6D28D9',
    cardScale: 100,
    cardRadius: 12,
    padding: 12,
    gridGap: 12,
    fontSize: 12,
    buttonBg: '#EDE9FE',
    buttonColor: '#581C87',
  },
  list: {
    canvasBg: '#FAFAFA',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    textColor: '#111827',
    textMuted: '#6B7280',
    accentColor: '#4F46E5',
    statusHealthyColor: '#16A34A',
    statusWarningColor: '#D97706',
    statusCriticalColor: '#DC2626',
    valuationColor: '#7C3AED',
    cardScale: 100,
    cardRadius: 8,
    padding: 14,
    gridGap: 10,
    fontSize: 13,
    buttonBg: '#F3F4F6',
    buttonColor: '#374151',
  },
  card: {
    canvasBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    textColor: '#0F172A',
    textMuted: '#64748B',
    accentColor: '#6366F1',
    statusHealthyColor: '#16A34A',
    statusWarningColor: '#EA580C',
    statusCriticalColor: '#E11D48',
    valuationColor: '#4F46E5',
    cardScale: 100,
    cardRadius: 16,
    padding: 18,
    gridGap: 20,
    fontSize: 14,
    buttonBg: '#EEF2FF',
    buttonColor: '#4338CA',
  },
};

/**
 * The design the ledger falls back to while its customization switch is off:
 * Card View, the page's own built-in card listing. It renders with its own
 * stock palette, never the saved overrides, so "off" always looks the same
 * however the page was customized.
 */
export const BASELINE_STOCK_DESIGN: StockDesignKey = 'card';

export interface StockPersistedConfig {
  activeKey: StockDesignKey;
  overrides?: Partial<Record<StockDesignKey, Partial<StockTokens>>>;
}

@Injectable({
  providedIn: 'root',
})
export class StockLayoutService {
  private settingsService = inject(SettingsService);
  private customization = inject(CustomizationService);
  private theme = inject(ThemeService);

  private _activeKey = signal<StockDesignKey>('warehouse');
  private _overrides = signal<Partial<Record<StockDesignKey, Partial<StockTokens>>>>({});

  public readonly activeKey = computed(() => this._activeKey());

  /**
   * Whether the page applies its saved design at all. The switch lives in
   * Settings -> POS Customization, which is the single place it is stored; the
   * design and its palette stay saved either way.
   */
  public readonly enabled = this.customization.stockLedgerCustomize;

  /** The design the page renders: the saved one, or the baseline while off. */
  public readonly effectiveKey = computed<StockDesignKey>(() =>
    this.enabled() ? this._activeKey() : BASELINE_STOCK_DESIGN
  );

  public readonly rootClass = computed<string>(() => 'stock-layout-' + this.effectiveKey());

  public readonly tokens = computed<StockTokens>(() => {
    const key = this._activeKey();
    const defaults = STOCK_DEFAULT_TOKENS[key];
    const designOverrides = this._overrides()[key] || {};
    return { ...defaults, ...designOverrides };
  });

  public readonly cssVars = computed<Record<string, string>>(() => this.varsFrom(this.tokens()));

  /** Variables the page renders with; evaluates with theme tokens */
  public readonly pageCssVars = computed<Record<string, string>>(() =>
    this.enabled() ? this.varsFrom(this.tokens()) : this.varsFrom(STOCK_DEFAULT_TOKENS[BASELINE_STOCK_DESIGN])
  );

  private varsFrom(t: StockTokens): Record<string, string> {
    const isDark = this.theme.isDarkMode() || this.theme.mode() === 'dark';
    const activeP = this.theme.currentPalette();

    let canvasBg = t.canvasBg;
    let cardBg = t.cardBg;
    let cardBorder = t.cardBorder;
    let textColor = t.textColor;
    let textMuted = t.textMuted;
    let accentColor = t.accentColor;
    let buttonBg = t.buttonBg;
    let buttonColor = t.buttonColor;

    if (isDark) {
      if (!this.theme.isDarkColor(canvasBg)) {
        canvasBg = 'transparent';
      }
      if (!this.theme.isDarkColor(cardBg)) {
        cardBg = activeP.cardBg;
      }
      if (this.theme.isDarkColor(textColor)) {
        textColor = activeP.textMain || '#F9FAFB';
      }
      if (!this.theme.isDarkColor(cardBorder)) {
        cardBorder = activeP.cardBorder;
      }
      if (textMuted === '#64748B' || textMuted === '#6B7280' || textMuted === '#7C3AED') {
        textMuted = 'rgba(226, 232, 240, 0.75)';
      }
      if (accentColor === '#2563EB' || accentColor === '#7E22CE' || accentColor === '#0F766E' || accentColor === '#6366F1' || accentColor === '#4F46E5') {
        accentColor = activeP.primary;
      }
      if (!this.theme.isDarkColor(buttonBg)) {
        buttonBg = 'rgba(255, 255, 255, 0.08)';
        buttonColor = activeP.textMain || '#F9FAFB';
      }
    } else {
      if (cardBg === '#FFFFFF') {
        cardBg = activeP.cardBg || '#FFFFFF';
      }
      if (cardBorder === '#CBD5E1' || cardBorder === '#E2E8F0' || cardBorder === '#E9D5FF' || cardBorder === '#E5E7EB') {
        cardBorder = activeP.cardBorder || '#E2E8F0';
      }
      if (textColor === '#0F172A' || textColor === '#1E293B' || textColor === '#2E1065' || textColor === '#111827') {
        textColor = activeP.textMain || '#1E293B';
      }
    }

    return {
      '--stock-canvas-bg': canvasBg,
      '--stock-card-bg': cardBg,
      '--stock-card-border': cardBorder,
      '--stock-text-color': textColor,
      '--stock-text-muted': textMuted,
      '--stock-accent-color': accentColor,
      '--stock-healthy-color': t.statusHealthyColor,
      '--stock-warning-color': t.statusWarningColor,
      '--stock-critical-color': t.statusCriticalColor,
      '--stock-valuation-color': t.valuationColor,
      '--stock-card-scale': `${t.cardScale / 100}`,
      '--stock-card-radius': `${t.cardRadius}px`,
      '--stock-padding': `${t.padding}px`,
      '--stock-grid-gap': `${t.gridGap}px`,
      '--stock-font-size': `${t.fontSize}px`,
      '--stock-btn-bg': buttonBg,
      '--stock-btn-color': buttonColor,
    };
  }

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrateFromSettings(),
      error: () => {},
    });
  }

  public hydrateFromSettings(): void {
    const parsed = this.readPersistedConfig();
    if (!parsed) return;

    if (
      parsed.activeKey &&
      ['warehouse', 'financial', 'kanban', 'list', 'card'].includes(parsed.activeKey)
    ) {
      this._activeKey.set(parsed.activeKey);
    }
    if (parsed.overrides && typeof parsed.overrides === 'object') {
      this._overrides.set(parsed.overrides);
    }
  }

  private readPersistedConfig(): StockPersistedConfig | null {
    const map = this.settingsService.settingsMap();
    const raw = map['system_stock_layout'] || map['SYSTEM_STOCK_LAYOUT'];
    if (!raw) return null;

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed && typeof parsed === 'object' ? (parsed as StockPersistedConfig) : null;
    } catch (e) {
      console.warn('Could not parse system_stock_layout setting:', e);
      return null;
    }
  }

  public setActiveDesign(key: StockDesignKey): void {
    this._activeKey.set(key);
  }

  public setToken<K extends StockTokenKey>(token: K, value: StockTokens[K]): void {
    const currentKey = this._activeKey();
    const currentOverrides = { ...this._overrides() };
    const currentDesignOverrides = { ...(currentOverrides[currentKey] || {}) };
    currentDesignOverrides[token] = value;
    currentOverrides[currentKey] = currentDesignOverrides;
    this._overrides.set(currentOverrides);
  }

  public resetActiveDesignToDefaults(): void {
    const currentKey = this._activeKey();
    const currentOverrides = { ...this._overrides() };
    delete currentOverrides[currentKey];
    this._overrides.set(currentOverrides);
  }

  public toPayload(): Record<string, string> {
    const config: StockPersistedConfig = {
      activeKey: this._activeKey(),
      overrides: this._overrides(),
    };
    return {
      system_stock_layout: JSON.stringify(config),
    };
  }

}

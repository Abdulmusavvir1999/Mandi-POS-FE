import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { CustomizationService } from './customization.service';
import { ThemeService, applyThemeBrand } from './theme.service';

export type DiningDesignKey = 'checkered' | 'neumorphic' | 'illustrated' | 'list' | 'cardlist';

export interface DiningTokens {
  /** Canvas / Floor surface behind tables */
  canvasBg: string;
  /** Individual table surface */
  tableBg: string;
  tableBorder: string;
  /** Text colors */
  textColor: string;
  textMuted: string;
  /** Status indicator colors */
  colorFree: string;
  colorOccupied: string;
  colorBlocked: string;
  /** Accent / Runner / Badge color */
  accentColor: string;
  /** Chair colors */
  chairColor: string;
  chairOccupiedColor: string;
  /** Sizing and spacing metrics */
  tableScale: number; // percentage (80 - 130)
  tableRadius: number; // px (0 - 36)
  chairSize: number; // px (14 - 36)
  gridGap: number; // px (10 - 48)
  padding: number; // px (6 - 32)
  fontSize: number; // px (11 - 20)
  /** Button colors */
  buttonBg: string;
  buttonColor: string;
}

export type DiningTokenKey = keyof DiningTokens;

export type DiningTokenGroup =
  | 'Surface'
  | 'Status Indicators'
  | 'Colors & Accent'
  | 'Sizing & Spacing'
  | 'Buttons & Typography';

export interface DiningTokenMeta {
  key: DiningTokenKey;
  label: string;
  group: DiningTokenGroup;
  type: 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const DINING_TOKEN_META: DiningTokenMeta[] = [
  // Surface
  { key: 'canvasBg', label: 'Floor Canvas Background', group: 'Surface', type: 'color' },
  { key: 'tableBg', label: 'Table Surface Background', group: 'Surface', type: 'color' },
  { key: 'tableBorder', label: 'Table Border Color', group: 'Surface', type: 'color' },

  // Status Indicators
  { key: 'colorFree', label: 'Free / Available Color', group: 'Status Indicators', type: 'color' },
  { key: 'colorOccupied', label: 'Occupied / Dining Color', group: 'Status Indicators', type: 'color' },
  { key: 'colorBlocked', label: 'Out of Service / Blocked Color', group: 'Status Indicators', type: 'color' },

  // Colors & Accent
  { key: 'textColor', label: 'Primary Text Color', group: 'Colors & Accent', type: 'color' },
  { key: 'textMuted', label: 'Secondary / Subtitle Text', group: 'Colors & Accent', type: 'color' },
  { key: 'accentColor', label: 'Runner & Badge Accent', group: 'Colors & Accent', type: 'color' },
  { key: 'chairColor', label: 'Chair Base / Outline Color', group: 'Colors & Accent', type: 'color' },
  { key: 'chairOccupiedColor', label: 'Occupied Chair Fill', group: 'Colors & Accent', type: 'color' },

  // Sizing & Spacing
  { key: 'tableScale', label: 'Table Scale Factor', group: 'Sizing & Spacing', type: 'range', min: 80, max: 130, step: 2, unit: '%' },
  { key: 'tableRadius', label: 'Table Corner Radius', group: 'Sizing & Spacing', type: 'range', min: 0, max: 32, step: 2, unit: 'px' },
  { key: 'chairSize', label: 'Chair / Seat Size', group: 'Sizing & Spacing', type: 'range', min: 14, max: 36, step: 2, unit: 'px' },
  { key: 'gridGap', label: 'Aisle Spacing / Gap', group: 'Sizing & Spacing', type: 'range', min: 10, max: 48, step: 2, unit: 'px' },
  { key: 'padding', label: 'Table Internal Padding', group: 'Sizing & Spacing', type: 'range', min: 6, max: 32, step: 2, unit: 'px' },

  // Buttons & Typography
  { key: 'fontSize', label: 'Base Font Size', group: 'Buttons & Typography', type: 'range', min: 11, max: 20, step: 1, unit: 'px' },
  { key: 'buttonBg', label: 'Action Button Background', group: 'Buttons & Typography', type: 'color' },
  { key: 'buttonColor', label: 'Action Button Text', group: 'Buttons & Typography', type: 'color' },
];

export const DINING_TOKEN_GROUPS: DiningTokenGroup[] = [
  'Surface',
  'Status Indicators',
  'Colors & Accent',
  'Sizing & Spacing',
  'Buttons & Typography',
];

export interface DiningDesignOption {
  key: DiningDesignKey;
  name: string;
  blurb: string;
  badge: string;
  icon: string;
  defaults: DiningTokens;
}

export const DINING_DESIGNS: DiningDesignOption[] = [
  {
    key: 'checkered',
    name: 'Checkered Floor Plan',
    blurb: 'Top-down architectural restaurant floor plan with checkered table runners, curved booth seats, and wooden chairs.',
    badge: 'Design 1 · Reference',
    icon: 'grid_view',
    defaults: {
      canvasBg: '#F9F9FB',
      tableBg: '#FCE9DF',
      tableBorder: '#ECCDC0',
      textColor: '#1E293B',
      textMuted: '#64748B',
      colorFree: '#10B981',
      colorOccupied: '#F97316',
      colorBlocked: '#EF4444',
      accentColor: '#E23B3B',
      chairColor: '#C49B7A',
      chairOccupiedColor: '#8C5835',
      tableScale: 100,
      tableRadius: 16,
      chairSize: 22,
      gridGap: 28,
      padding: 14,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'neumorphic',
    name: 'Table View (Minimalist)',
    blurb: 'Soft elevated rounded tables with surrounding pill seats and central colored code badges.',
    badge: 'Design 2 · Reference',
    icon: 'space_dashboard',
    defaults: {
      canvasBg: '#F4F6F9',
      tableBg: '#FFFFFF',
      tableBorder: 'rgba(0, 0, 0, 0.05)',
      textColor: '#0F172A',
      textMuted: '#64748B',
      colorFree: '#10B981',
      colorOccupied: '#F43F5E',
      colorBlocked: '#64748B',
      accentColor: '#3B82F6',
      chairColor: '#E2E8F0',
      chairOccupiedColor: '#CBD5E1',
      tableScale: 100,
      tableRadius: 22,
      chairSize: 20,
      gridGap: 24,
      padding: 16,
      fontSize: 14,
      buttonBg: '#0F172A',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'illustrated',
    name: 'Illustrated Capacity Floor',
    blurb: 'Color-coded pastel blocks (mint, soft blush, lavender) with illustrated perimeter chairs and guest capacity counts.',
    badge: 'Design 3 · Reference',
    icon: 'domain',
    defaults: {
      canvasBg: '#FFFFFF',
      tableBg: '#B2E8DC',
      tableBorder: 'transparent',
      textColor: '#0F594D',
      textMuted: '#2A7366',
      colorFree: '#0F594D',
      colorOccupied: '#D84C1C',
      colorBlocked: '#94A3B8',
      accentColor: '#D84C1C',
      chairColor: '#A0AAB0',
      chairOccupiedColor: '#0F594D',
      tableScale: 100,
      tableRadius: 16,
      chairSize: 22,
      gridGap: 30,
      padding: 14,
      fontSize: 14,
      buttonBg: '#0F594D',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'list',
    name: 'List View',
    blurb: 'High-density executive tabular floor view with live status pills, dwell timers, bill amounts, and quick actions.',
    badge: 'Design 4 · Tabular',
    icon: 'table_rows',
    defaults: {
      canvasBg: '#F8FAFC',
      tableBg: '#FFFFFF',
      tableBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      colorFree: '#10B981',
      colorOccupied: '#F59E0B',
      colorBlocked: '#EF4444',
      accentColor: '#7E22CE',
      chairColor: '#94A3B8',
      chairOccupiedColor: '#7E22CE',
      tableScale: 100,
      tableRadius: 12,
      chairSize: 18,
      gridGap: 12,
      padding: 12,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'cardlist',
    name: 'Card List View',
    blurb: 'Executive card list with section badges, 6-tick dwell rails, guest notes, and action bars.',
    badge: 'Design 5 · Cards',
    icon: 'view_agenda',
    defaults: {
      canvasBg: '#F8F9FB',
      tableBg: '#FFFFFF',
      tableBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      colorFree: '#10B981',
      colorOccupied: '#F59E0B',
      colorBlocked: '#EF4444',
      accentColor: '#7E22CE',
      chairColor: '#E2E8F0',
      chairOccupiedColor: '#7E22CE',
      tableScale: 100,
      tableRadius: 16,
      chairSize: 20,
      gridGap: 16,
      padding: 18,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
];

export const DEFAULT_DINING_DESIGN: DiningDesignKey = 'checkered';

/**
 * Tokens that carry the app's brand color, so they follow the theme.
 *
 * `accentColor` is in the list but only moves on the designs that shipped it
 * as the brand purple — Card List View, the baseline, and List View. The
 * checkered floor's red runner and the illustrated floor's terracotta are
 * those designs' own hues and stay put.
 */
const DINING_BRAND_SLOTS: readonly DiningTokenKey[] = ['accentColor', 'buttonBg'];

/**
 * The design the floor falls back to while its customization switch is off:
 * Card List View, this page's own built-in card listing — it has no plain
 * "Card View" of its own. It renders with its own stock palette, never the
 * saved overrides, so "off" always looks the same however it was customized.
 */
export const BASELINE_DINING_DESIGN: DiningDesignKey = 'cardlist';

interface StoredDiningLayout {
  layoutKey: DiningDesignKey;
  overrides: Partial<Record<DiningDesignKey, Partial<DiningTokens>>>;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiningLayoutService {
  private settingsService = inject(SettingsService);
  private customization = inject(CustomizationService);
  private theme = inject(ThemeService);

  private readonly layoutKeySignal = signal<DiningDesignKey>(DEFAULT_DINING_DESIGN);
  private readonly overridesSignal = signal<StoredDiningLayout['overrides']>({});

  public readonly activeKey = this.layoutKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  /**
   * Whether the page applies its saved design at all. The switch lives in
   * Settings -> POS Customization, which is the single place it is stored; the
   * design and its palette stay saved either way.
   */
  public readonly enabled = this.customization.diningCustomize;

  public readonly designs = DINING_DESIGNS;
  public readonly tokenMeta = DINING_TOKEN_META;
  public readonly tokenGroups = DINING_TOKEN_GROUPS;

  public readonly activeDesign = computed<DiningDesignOption>(
    () => DINING_DESIGNS.find((d) => d.key === this.layoutKeySignal()) || DINING_DESIGNS[0]
  );

  public readonly activeTokens = computed<DiningTokens>(() =>
    this.tokensFor(this.layoutKeySignal())
  );

  /** The design the page renders: the saved one, or the baseline while off. */
  public readonly effectiveKey = computed<DiningDesignKey>(() =>
    this.enabled() ? this.layoutKeySignal() : BASELINE_DINING_DESIGN
  );

  public readonly rootClass = computed<string>(() =>
    'dining-layout-' + this.effectiveKey()
  );

  /** The design definition the page renders, for its own header line. */
  public readonly effectiveDesign = computed<DiningDesignOption>(
    () => this.designFor(this.effectiveKey())
  );

  /** Variables the page renders with — stock defaults while off. */
  public readonly pageCssVars = computed<Record<string, string>>(() =>
    this.enabled()
      ? this.varsFrom(this.activeTokens())
      : this.varsFrom(this.defaultsFor(BASELINE_DINING_DESIGN))
  );

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  public designFor(key: DiningDesignKey): DiningDesignOption {
    return DINING_DESIGNS.find((d) => d.key === key) || DINING_DESIGNS[0];
  }

  public tokensFor(key: DiningDesignKey): DiningTokens {
    const saved = this.overridesSignal()[key] || {};
    return this.withThemeBrand(key, { ...this.designFor(key).defaults, ...saved }, saved);
  }

  public defaultsFor(key: DiningDesignKey): DiningTokens {
    return this.withThemeBrand(key, { ...this.designFor(key).defaults }, {});
  }

  /**
   * The floor's brand color follows the system theme.
   *
   * The filled row action — "Seat Guests" on a free table — takes its fill
   * from `--dining-accent-color`, which Card List View ships as the brand
   * purple, so it stayed purple under an Ocean Blue theme.
   */
  private withThemeBrand(
    key: DiningDesignKey,
    tokens: DiningTokens,
    saved: Partial<DiningTokens>
  ): DiningTokens {
    return applyThemeBrand(
      tokens,
      this.designFor(key).defaults,
      saved,
      DINING_BRAND_SLOTS,
      this.theme.currentPalette().primary
    );
  }

  public cssVars(key?: DiningDesignKey): Record<string, string> {
    return this.varsFrom(key ? this.tokensFor(key) : this.activeTokens());
  }

  private varsFrom(tokens: DiningTokens): Record<string, string> {
    const isDark = this.theme.isDarkMode() || this.theme.mode() === 'dark';
    const activeP = this.theme.currentPalette();

    let canvasBg = tokens.canvasBg;
    let tableBg = tokens.tableBg;
    let tableBorder = tokens.tableBorder;
    let textColor = tokens.textColor;
    let textMuted = tokens.textMuted;
    let accentColor = tokens.accentColor;
    let buttonBg = tokens.buttonBg;
    let buttonColor = tokens.buttonColor;

    if (isDark) {
      if (!this.theme.isDarkColor(canvasBg)) {
        canvasBg = 'transparent';
      }
      if (!this.theme.isDarkColor(tableBg)) {
        tableBg = activeP.cardBg;
      }
      if (this.theme.isDarkColor(textColor)) {
        textColor = activeP.textMain || '#F9FAFB';
      }
      if (!this.theme.isDarkColor(tableBorder)) {
        tableBorder = activeP.cardBorder;
      }
      if (textMuted === '#64748B' || textMuted === '#6B7280') {
        textMuted = 'rgba(226, 232, 240, 0.75)';
      }
      if (accentColor === '#7E22CE' || accentColor === '#2563EB') {
        accentColor = activeP.primary;
      }
      if (!this.theme.isDarkColor(buttonBg)) {
        buttonBg = 'rgba(255, 255, 255, 0.08)';
        buttonColor = activeP.textMain || '#F9FAFB';
      }
    }

    const vars: Record<string, string> = {};

    vars['--dining-canvas-bg'] = canvasBg;
    vars['--dining-table-bg'] = tableBg;
    vars['--dining-table-border'] = tableBorder;
    vars['--dining-text-color'] = textColor;
    vars['--dining-text-muted'] = textMuted;
    vars['--dining-color-free'] = tokens.colorFree;
    vars['--dining-color-occupied'] = tokens.colorOccupied;
    vars['--dining-color-blocked'] = tokens.colorBlocked;
    vars['--dining-accent-color'] = accentColor;
    vars['--dining-chair-color'] = tokens.chairColor;
    vars['--dining-chair-occupied'] = tokens.chairOccupiedColor;
    vars['--dining-table-scale'] = String(tokens.tableScale / 100);
    vars['--dining-table-radius'] = tokens.tableRadius + 'px';
    vars['--dining-chair-size'] = tokens.chairSize + 'px';
    vars['--dining-grid-gap'] = tokens.gridGap + 'px';
    vars['--dining-padding'] = tokens.padding + 'px';
    vars['--dining-font-size'] = tokens.fontSize + 'px';
    vars['--dining-button-bg'] = buttonBg;
    vars['--dining-button-color'] = buttonColor;

    return vars;
  }

  public selectDesign(key: DiningDesignKey): void {
    // Only the design is chosen here. Whether it is applied is the master
    // switch's business, so picking one never turns a page's customization on
    // behind the admin's back.
    this.layoutKeySignal.set(key);
  }

  public setToken(key: DiningDesignKey, token: DiningTokenKey, value: string | number): void {
    this.overridesSignal.update((all) => ({
      ...all,
      [key]: { ...(all[key] || {}), [token]: value },
    }));
  }

  public resetDesign(key: DiningDesignKey): void {
    this.overridesSignal.update((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
  }

  public toPayload(): Record<string, string> {
    const stored: StoredDiningLayout = {
      layoutKey: this.layoutKeySignal(),
      overrides: this.overridesSignal(),
      // Mirrored for builds that predate the customization switches; the
      // value read back is the one in `system_customization`.
      enabled: this.enabled(),
    };
    return { system_dining_layout: JSON.stringify(stored) };
  }

  public hydrate(): void {
    const raw =
      this.settingsService.settingsMap()['system_dining_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_DINING_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: Partial<StoredDiningLayout> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as any);

      if (parsed?.layoutKey && DINING_DESIGNS.some((d) => d.key === parsed.layoutKey)) {
        this.layoutKeySignal.set(parsed.layoutKey);
      }
      if (parsed?.overrides && typeof parsed.overrides === 'object') {
        this.overridesSignal.set(parsed.overrides);
      }
      // `enabled` is deliberately not read here: CustomizationService owns it
      // and migrates this blob's old value on first load.
    } catch (_) {
      // Keep defaults on parse failure
    }
  }
}

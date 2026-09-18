import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

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

interface StoredDiningLayout {
  layoutKey: DiningDesignKey;
  overrides: Partial<Record<DiningDesignKey, Partial<DiningTokens>>>;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiningLayoutService {
  private settingsService = inject(SettingsService);

  private readonly layoutKeySignal = signal<DiningDesignKey>(DEFAULT_DINING_DESIGN);
  private readonly overridesSignal = signal<StoredDiningLayout['overrides']>({});
  private readonly enabledSignal = signal<boolean>(true);

  public readonly activeKey = this.layoutKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  public readonly enabled = this.enabledSignal.asReadonly();

  public readonly designs = DINING_DESIGNS;
  public readonly tokenMeta = DINING_TOKEN_META;
  public readonly tokenGroups = DINING_TOKEN_GROUPS;

  public readonly activeDesign = computed<DiningDesignOption>(
    () => DINING_DESIGNS.find((d) => d.key === this.layoutKeySignal()) || DINING_DESIGNS[0]
  );

  public readonly activeTokens = computed<DiningTokens>(() =>
    this.tokensFor(this.layoutKeySignal())
  );

  public readonly rootClass = computed<string>(() =>
    'dining-layout-' + this.layoutKeySignal()
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
    return { ...this.designFor(key).defaults, ...(this.overridesSignal()[key] || {}) };
  }

  public defaultsFor(key: DiningDesignKey): DiningTokens {
    return { ...this.designFor(key).defaults };
  }

  public cssVars(key?: DiningDesignKey): Record<string, string> {
    const tokens = key ? this.tokensFor(key) : this.activeTokens();
    const vars: Record<string, string> = {};

    vars['--dining-canvas-bg'] = tokens.canvasBg;
    vars['--dining-table-bg'] = tokens.tableBg;
    vars['--dining-table-border'] = tokens.tableBorder;
    vars['--dining-text-color'] = tokens.textColor;
    vars['--dining-text-muted'] = tokens.textMuted;
    vars['--dining-color-free'] = tokens.colorFree;
    vars['--dining-color-occupied'] = tokens.colorOccupied;
    vars['--dining-color-blocked'] = tokens.colorBlocked;
    vars['--dining-accent-color'] = tokens.accentColor;
    vars['--dining-chair-color'] = tokens.chairColor;
    vars['--dining-chair-occupied'] = tokens.chairOccupiedColor;
    vars['--dining-table-scale'] = String(tokens.tableScale / 100);
    vars['--dining-table-radius'] = tokens.tableRadius + 'px';
    vars['--dining-chair-size'] = tokens.chairSize + 'px';
    vars['--dining-grid-gap'] = tokens.gridGap + 'px';
    vars['--dining-padding'] = tokens.padding + 'px';
    vars['--dining-font-size'] = tokens.fontSize + 'px';
    vars['--dining-button-bg'] = tokens.buttonBg;
    vars['--dining-button-color'] = tokens.buttonColor;

    return vars;
  }

  public selectDesign(key: DiningDesignKey): void {
    this.layoutKeySignal.set(key);
    this.enabledSignal.set(true);
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
      enabled: this.enabledSignal(),
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
      if (parsed?.enabled !== undefined) {
        this.enabledSignal.set(parsed.enabled === true || String(parsed.enabled) === 'true');
      }
    } catch (_) {
      // Keep defaults on parse failure
    }
  }
}

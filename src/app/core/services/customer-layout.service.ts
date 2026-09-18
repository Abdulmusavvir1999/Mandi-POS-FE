import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

export type CustomerDesignKey = 'vipcard' | 'clean' | 'compact' | 'list' | 'card';

export interface CustomerTokens {
  /** Page / Canvas background behind customer elements */
  canvasBg: string;
  /** Tile / row / card surface */
  cardBg: string;
  cardBorder: string;
  /** Text colors */
  textColor: string;
  textMuted: string;
  /** Accents & loyalty */
  accentColor: string;
  vipBadgeBg: string;
  vipBadgeColor: string;
  spendColor: string;
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

export type CustomerTokenKey = keyof CustomerTokens;

export type CustomerTokenGroup =
  | 'Surface & Background'
  | 'Typography & Colors'
  | 'Loyalty & Badges'
  | 'Sizing & Spacing'
  | 'Buttons & Actions';

export interface CustomerTokenMeta {
  key: CustomerTokenKey;
  label: string;
  group: CustomerTokenGroup;
  type: 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const CUSTOMER_TOKEN_META: CustomerTokenMeta[] = [
  // Surface
  { key: 'canvasBg', label: 'Directory Background', group: 'Surface & Background', type: 'color' },
  { key: 'cardBg', label: 'Card / Row Surface', group: 'Surface & Background', type: 'color' },
  { key: 'cardBorder', label: 'Card / Row Border', group: 'Surface & Background', type: 'color' },

  // Typography
  { key: 'textColor', label: 'Guest Name Text', group: 'Typography & Colors', type: 'color' },
  { key: 'textMuted', label: 'Phone & Meta Text', group: 'Typography & Colors', type: 'color' },
  { key: 'accentColor', label: 'Accent & Icon Highlight', group: 'Typography & Colors', type: 'color' },

  // Loyalty & Badges
  { key: 'vipBadgeBg', label: 'VIP Badge Background', group: 'Loyalty & Badges', type: 'color' },
  { key: 'vipBadgeColor', label: 'VIP Badge Text Color', group: 'Loyalty & Badges', type: 'color' },
  { key: 'spendColor', label: 'Total Spent Highlight', group: 'Loyalty & Badges', type: 'color' },

  // Sizing
  { key: 'cardScale', label: 'Card Scale Factor', group: 'Sizing & Spacing', type: 'range', min: 80, max: 130, step: 2, unit: '%' },
  { key: 'cardRadius', label: 'Card Corner Radius', group: 'Sizing & Spacing', type: 'range', min: 0, max: 32, step: 2, unit: 'px' },
  { key: 'padding', label: 'Internal Padding', group: 'Sizing & Spacing', type: 'range', min: 6, max: 32, step: 2, unit: 'px' },
  { key: 'gridGap', label: 'Grid / Row Spacing', group: 'Sizing & Spacing', type: 'range', min: 8, max: 40, step: 2, unit: 'px' },

  // Buttons & Font
  { key: 'fontSize', label: 'Base Font Size', group: 'Buttons & Actions', type: 'range', min: 11, max: 20, step: 1, unit: 'px' },
  { key: 'buttonBg', label: 'Button Background', group: 'Buttons & Actions', type: 'color' },
  { key: 'buttonColor', label: 'Button Icon / Text', group: 'Buttons & Actions', type: 'color' },
];

export const CUSTOMER_TOKEN_GROUPS: CustomerTokenGroup[] = [
  'Surface & Background',
  'Typography & Colors',
  'Loyalty & Badges',
  'Sizing & Spacing',
  'Buttons & Actions',
];

export interface CustomerDesignOption {
  key: CustomerDesignKey;
  name: string;
  label?: string;
  blurb: string;
  description?: string;
  subtitle?: string;
  badge: string;
  icon: string;
  defaults: CustomerTokens;
}

export const CUSTOMER_DESIGNS: CustomerDesignOption[] = [
  {
    key: 'vipcard',
    name: 'Executive VIP Cards',
    label: 'Executive VIP Cards',
    blurb: 'Luxury guest cards with VIP membership badge, glowing avatar ring, contact buttons, visit frequency, and gross spend progress pill.',
    description: 'Luxury guest cards with VIP membership badge, glowing avatar ring, contact buttons, visit frequency, and gross spend progress pill.',
    subtitle: 'Luxury CRM Executive VIP Cards',
    badge: 'Design 1 · Luxury VIP',
    icon: 'diamond',
    defaults: {
      canvasBg: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#E9D5FF',
      textColor: '#2E1065',
      textMuted: '#6B7280',
      accentColor: '#7E22CE',
      vipBadgeBg: '#FEF3C7',
      vipBadgeColor: '#B45309',
      spendColor: '#16A34A',
      cardScale: 100,
      cardRadius: 20,
      padding: 20,
      gridGap: 20,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'clean',
    name: 'Minimalist Clean Table',
    label: 'Minimalist Clean Table',
    blurb: 'Sleek, high-density corporate data ledger with clean borders, phone badges, visit counters, and rapid inline actions.',
    description: 'Sleek, high-density corporate data ledger with clean borders, phone badges, visit counters, and rapid inline actions.',
    subtitle: 'High-Density Minimal Line Ledger',
    badge: 'Design 2 · Minimal',
    icon: 'border_all',
    defaults: {
      canvasBg: '#FAFAFA',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#2563EB',
      vipBadgeBg: '#EFF6FF',
      vipBadgeColor: '#1D4ED8',
      spendColor: '#059669',
      cardScale: 100,
      cardRadius: 10,
      padding: 12,
      gridGap: 14,
      fontSize: 14,
      buttonBg: '#0F172A',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'compact',
    name: 'Compact CRM Tiles',
    label: 'Compact CRM Tiles',
    blurb: 'Space-optimized grid of touch-friendly customer contact tiles with quick dial, visit count, and one-tap invoice inspection.',
    description: 'Space-optimized grid of touch-friendly customer contact tiles with quick dial, visit count, and one-tap invoice inspection.',
    subtitle: 'Touch-Screen Rapid CRM Tiles',
    badge: 'Design 3 · Compact',
    icon: 'grid_view',
    defaults: {
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#CBD5E1',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#0D9488',
      vipBadgeBg: '#CCFBF1',
      vipBadgeColor: '#0F766E',
      spendColor: '#0D9488',
      cardScale: 100,
      cardRadius: 14,
      padding: 12,
      gridGap: 12,
      fontSize: 13,
      buttonBg: '#0D9488',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'list',
    name: 'List View',
    label: 'List View',
    blurb: 'Full-featured enterprise tabular layout with selection checkboxes, avatar + locality, phone pill, status badge, and complete action menu.',
    description: 'Full-featured enterprise tabular layout with selection checkboxes, avatar + locality, phone pill, status badge, and complete action menu.',
    subtitle: 'Enterprise Tabular Data Grid',
    badge: 'Design 4 · List View',
    icon: 'table_rows',
    defaults: {
      canvasBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#1E293B',
      textMuted: '#64748B',
      accentColor: '#7E22CE',
      vipBadgeBg: '#FEF3C7',
      vipBadgeColor: '#B45309',
      spendColor: '#16A34A',
      cardScale: 100,
      cardRadius: 12,
      padding: 14,
      gridGap: 12,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'card',
    name: 'Card View',
    label: 'Card View',
    blurb: 'Modern customer cards with gradient cover banner, initials avatar, tier badge, spending stats, locality, and card footer actions.',
    description: 'Modern customer cards with gradient cover banner, initials avatar, tier badge, spending stats, locality, and card footer actions.',
    subtitle: 'Guest Profile Cards Showcase',
    badge: 'Design 5 · Card View',
    icon: 'badge',
    defaults: {
      canvasBg: '#F9F9FB',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#7E22CE',
      vipBadgeBg: '#FEF3C7',
      vipBadgeColor: '#B45309',
      spendColor: '#16A34A',
      cardScale: 100,
      cardRadius: 18,
      padding: 16,
      gridGap: 18,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
];

export const CUSTOMER_DESIGN_OPTIONS = CUSTOMER_DESIGNS;

export const DEFAULT_CUSTOMER_DESIGN: CustomerDesignKey = 'vipcard';

interface StoredCustomerLayout {
  layoutKey: CustomerDesignKey;
  overrides: Partial<Record<CustomerDesignKey, Partial<CustomerTokens>>>;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerLayoutService {
  private settingsService = inject(SettingsService);

  private readonly layoutKeySignal = signal<CustomerDesignKey>(DEFAULT_CUSTOMER_DESIGN);
  private readonly overridesSignal = signal<StoredCustomerLayout['overrides']>({});
  private readonly enabledSignal = signal<boolean>(true);

  public readonly activeKey = this.layoutKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  public readonly enabled = this.enabledSignal.asReadonly();

  public readonly designs = CUSTOMER_DESIGNS;
  public readonly tokenMeta = CUSTOMER_TOKEN_META;
  public readonly tokenGroups = CUSTOMER_TOKEN_GROUPS;

  public readonly activeDesign = computed<CustomerDesignOption>(
    () => CUSTOMER_DESIGNS.find((d) => d.key === this.layoutKeySignal()) || CUSTOMER_DESIGNS[0]
  );

  public readonly activeTokens = computed<CustomerTokens>(() =>
    this.tokensFor(this.layoutKeySignal())
  );

  public readonly rootClass = computed<string>(() =>
    'customer-layout-' + this.layoutKeySignal()
  );

  public readonly tokens = this.activeTokens;

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  public designFor(key: CustomerDesignKey): CustomerDesignOption {
    return CUSTOMER_DESIGNS.find((d) => d.key === key) || CUSTOMER_DESIGNS[0];
  }

  public tokensFor(key: CustomerDesignKey): CustomerTokens {
    return { ...this.designFor(key).defaults, ...(this.overridesSignal()[key] || {}) };
  }

  public defaultsFor(key: CustomerDesignKey): CustomerTokens {
    return { ...this.designFor(key).defaults };
  }

  public cssVars(key?: CustomerDesignKey): Record<string, string> {
    const tokens = key ? this.tokensFor(key) : this.activeTokens();
    const vars: Record<string, string> = {};

    vars['--cust-canvas-bg'] = tokens.canvasBg;
    vars['--cust-card-bg'] = tokens.cardBg;
    vars['--cust-card-border'] = tokens.cardBorder;
    vars['--cust-text-color'] = tokens.textColor;
    vars['--cust-text-muted'] = tokens.textMuted;
    vars['--cust-accent-color'] = tokens.accentColor;
    vars['--cust-vip-badge-bg'] = tokens.vipBadgeBg;
    vars['--cust-vip-badge-color'] = tokens.vipBadgeColor;
    vars['--cust-spend-color'] = tokens.spendColor;
    vars['--cust-card-scale'] = String(tokens.cardScale / 100);
    vars['--cust-card-radius'] = tokens.cardRadius + 'px';
    vars['--cust-padding'] = tokens.padding + 'px';
    vars['--cust-grid-gap'] = tokens.gridGap + 'px';
    vars['--cust-font-size'] = tokens.fontSize + 'px';
    vars['--cust-button-bg'] = tokens.buttonBg;
    vars['--cust-button-color'] = tokens.buttonColor;

    return vars;
  }

  public selectDesign(key: CustomerDesignKey): void {
    this.layoutKeySignal.set(key);
    this.enabledSignal.set(true);
  }

  public setActiveDesign(key: CustomerDesignKey): void {
    this.selectDesign(key);
  }

  public setToken(
    keyOrToken: CustomerDesignKey | CustomerTokenKey,
    tokenOrValue: CustomerTokenKey | string | number,
    maybeValue?: string | number
  ): void {
    let key: CustomerDesignKey;
    let token: CustomerTokenKey;
    let value: string | number;

    if (maybeValue !== undefined) {
      key = keyOrToken as CustomerDesignKey;
      token = tokenOrValue as CustomerTokenKey;
      value = maybeValue;
    } else {
      key = this.layoutKeySignal();
      token = keyOrToken as CustomerTokenKey;
      value = tokenOrValue as string | number;
    }

    this.overridesSignal.update((all) => ({
      ...all,
      [key]: { ...(all[key] || {}), [token]: value },
    }));
  }

  public resetDesign(key: CustomerDesignKey): void {
    this.overridesSignal.update((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
  }

  public resetActiveDesignToDefaults(): void {
    this.resetDesign(this.layoutKeySignal());
  }

  public toPayload(): Record<string, string> {
    const stored: StoredCustomerLayout = {
      layoutKey: this.layoutKeySignal(),
      overrides: this.overridesSignal(),
      enabled: this.enabledSignal(),
    };
    return { system_customer_layout: JSON.stringify(stored) };
  }

  public hydrate(): void {
    const raw =
      this.settingsService.settingsMap()['system_customer_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_CUSTOMER_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: Partial<StoredCustomerLayout> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as any);

      if (parsed?.layoutKey && CUSTOMER_DESIGNS.some((d) => d.key === parsed.layoutKey)) {
        this.layoutKeySignal.set(parsed.layoutKey);
      }
      if (parsed?.overrides && typeof parsed.overrides === 'object') {
        this.overridesSignal.set(parsed.overrides);
      }
      if (parsed?.enabled !== undefined) {
        this.enabledSignal.set(parsed.enabled === true || String(parsed.enabled) === 'true');
      }
    } catch (_) {
      // Retain defaults on error
    }
  }
}

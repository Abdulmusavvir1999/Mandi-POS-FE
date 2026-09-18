import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { CustomizationService } from './customization.service';

export type CategoryDesignKey = 'showcase' | 'clean' | 'compact' | 'list' | 'card';

export interface CategoryTokens {
  /** Page / Canvas background behind category elements */
  canvasBg: string;
  /** Tile / row / card surface */
  cardBg: string;
  cardBorder: string;
  /** Text colors */
  textColor: string;
  textMuted: string;
  /** Accents & status */
  accentColor: string;
  statusActiveColor: string;
  statusDraftColor: string;
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

export type CategoryTokenKey = keyof CategoryTokens;

export type CategoryTokenGroup =
  | 'Surface & Background'
  | 'Typography & Colors'
  | 'Status & Badges'
  | 'Sizing & Spacing'
  | 'Buttons & Actions';

export interface CategoryTokenMeta {
  key: CategoryTokenKey;
  label: string;
  group: CategoryTokenGroup;
  type: 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const CATEGORY_TOKEN_META: CategoryTokenMeta[] = [
  // Surface
  { key: 'canvasBg', label: 'Catalog Background', group: 'Surface & Background', type: 'color' },
  { key: 'cardBg', label: 'Card / Row Surface', group: 'Surface & Background', type: 'color' },
  { key: 'cardBorder', label: 'Card / Row Border', group: 'Surface & Background', type: 'color' },

  // Typography
  { key: 'textColor', label: 'Category Name Text', group: 'Typography & Colors', type: 'color' },
  { key: 'textMuted', label: 'Description & Meta Text', group: 'Typography & Colors', type: 'color' },
  { key: 'accentColor', label: 'Accent & Icon Highlight', group: 'Typography & Colors', type: 'color' },

  // Status
  { key: 'statusActiveColor', label: 'Active Status Color', group: 'Status & Badges', type: 'color' },
  { key: 'statusDraftColor', label: 'Draft / Inactive Color', group: 'Status & Badges', type: 'color' },

  // Sizing
  { key: 'cardScale', label: 'Card Scale Factor', group: 'Sizing & Spacing', type: 'range', min: 80, max: 130, step: 2, unit: '%' },
  { key: 'cardRadius', label: 'Card Corner Radius', group: 'Sizing & Spacing', type: 'range', min: 0, max: 32, step: 2, unit: 'px' },
  { key: 'padding', label: 'Internal Padding', group: 'Sizing & Spacing', type: 'range', min: 6, max: 32, step: 2, unit: 'px' },
  { key: 'gridGap', label: 'Grid / Row Spacing', group: 'Sizing & Spacing', type: 'range', min: 8, max: 40, step: 2, unit: 'px' },

  // Buttons & Typography
  { key: 'fontSize', label: 'Base Font Size', group: 'Buttons & Actions', type: 'range', min: 11, max: 20, step: 1, unit: 'px' },
  { key: 'buttonBg', label: 'Button Background', group: 'Buttons & Actions', type: 'color' },
  { key: 'buttonColor', label: 'Button Text Color', group: 'Buttons & Actions', type: 'color' },
];

export const CATEGORY_TOKEN_GROUPS: CategoryTokenGroup[] = [
  'Surface & Background',
  'Typography & Colors',
  'Status & Badges',
  'Sizing & Spacing',
  'Buttons & Actions',
];

export interface CategoryDesignOption {
  key: CategoryDesignKey;
  name: string;
  label?: string;
  blurb: string;
  description?: string;
  subtitle?: string;
  badge: string;
  icon: string;
  defaults: CategoryTokens;
}

export const CATEGORY_DESIGNS: CategoryDesignOption[] = [
  {
    key: 'showcase',
    name: 'Bento Showcase',
    label: 'Bento Showcase',
    blurb: 'Modern bento showcase with category hero cards, image avatars, dish counters, priority chips, and action bars.',
    description: 'Modern bento showcase with category hero cards, image avatars, dish counters, priority chips, and action bars.',
    subtitle: 'Hero Visual Bento Showcase',
    badge: 'Design 1 · Bento',
    icon: 'dashboard_customize',
    defaults: {
      canvasBg: '#F9F9FB',
      cardBg: '#FFFFFF',
      cardBorder: '#E9D5FF',
      textColor: '#1E1B4B',
      textMuted: '#6B7280',
      accentColor: '#7E22CE',
      statusActiveColor: '#16A34A',
      statusDraftColor: '#EA580C',
      cardScale: 100,
      cardRadius: 18,
      padding: 18,
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
    blurb: 'Sleek modern data grid with clean borders, status tags, inline dish statistics, and executive layout.',
    description: 'Sleek modern data grid with clean borders, status tags, inline dish statistics, and executive layout.',
    subtitle: 'Corporate Minimal Data Grid',
    badge: 'Design 2 · Minimal',
    icon: 'border_all',
    defaults: {
      canvasBg: '#FAFAFA',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#2563EB',
      statusActiveColor: '#10B981',
      statusDraftColor: '#F59E0B',
      cardScale: 100,
      cardRadius: 12,
      padding: 14,
      gridGap: 16,
      fontSize: 14,
      buttonBg: '#0F172A',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'compact',
    name: 'Compact Badge Tiles',
    label: 'Compact Badge Tiles',
    blurb: 'High-density masonry tile grid with category icon badges, status chips, and quick management tags.',
    description: 'High-density masonry tile grid with category icon badges, status chips, and quick management tags.',
    subtitle: 'High-Density Masonry Grid',
    badge: 'Design 3 · Compact',
    icon: 'grid_view',
    defaults: {
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#CBD5E1',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#0D9488',
      statusActiveColor: '#0D9488',
      statusDraftColor: '#D97706',
      cardScale: 100,
      cardRadius: 14,
      padding: 12,
      gridGap: 14,
      fontSize: 13,
      buttonBg: '#0D9488',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'list',
    name: 'List View',
    label: 'List View',
    blurb: 'Classic comprehensive tabular row layout with priority sequencing, linked dishes count, status switch, and action buttons.',
    description: 'Classic comprehensive tabular row layout with priority sequencing, linked dishes count, status switch, and action buttons.',
    subtitle: 'Classic Comprehensive Tabular Row',
    badge: 'Design 4 · List View',
    icon: 'table_rows',
    defaults: {
      canvasBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#1E293B',
      textMuted: '#64748B',
      accentColor: '#7E22CE',
      statusActiveColor: '#16A34A',
      statusDraftColor: '#EA580C',
      cardScale: 100,
      cardRadius: 10,
      padding: 12,
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
    blurb: 'Multi-column executive cards with image banners, descriptions, linked dish progress meters, and action footers.',
    description: 'Multi-column executive cards with image banners, descriptions, linked dish progress meters, and action footers.',
    subtitle: 'Executive Inventory Showcase Cards',
    badge: 'Design 5 · Card View',
    icon: 'view_agenda',
    defaults: {
      canvasBg: '#F9F9FB',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#7E22CE',
      statusActiveColor: '#16A34A',
      statusDraftColor: '#EA580C',
      cardScale: 100,
      cardRadius: 16,
      padding: 16,
      gridGap: 20,
      fontSize: 14,
      buttonBg: '#7E22CE',
      buttonColor: '#FFFFFF',
    },
  },
];

export const CATEGORY_DESIGN_OPTIONS = CATEGORY_DESIGNS;

export const DEFAULT_CATEGORY_DESIGN: CategoryDesignKey = 'showcase';

/**
 * The design the page falls back to while its customization switch is off:
 * Card View, the page's own built-in card listing. It renders with its own
 * stock palette, never the saved overrides, so "off" always looks the same
 * however the page was customized.
 */
export const BASELINE_CATEGORY_DESIGN: CategoryDesignKey = 'card';

interface StoredCategoryLayout {
  layoutKey: CategoryDesignKey;
  overrides: Partial<Record<CategoryDesignKey, Partial<CategoryTokens>>>;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryLayoutService {
  private settingsService = inject(SettingsService);
  private customization = inject(CustomizationService);

  private readonly layoutKeySignal = signal<CategoryDesignKey>(DEFAULT_CATEGORY_DESIGN);
  private readonly overridesSignal = signal<StoredCategoryLayout['overrides']>({});

  public readonly activeKey = this.layoutKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  /**
   * Whether the page applies its saved design at all. The switch lives in
   * Settings -> POS Customization, which is the single place it is stored; the
   * design and its palette stay saved either way.
   */
  public readonly enabled = this.customization.categoryCustomize;

  public readonly designs = CATEGORY_DESIGNS;
  public readonly tokenMeta = CATEGORY_TOKEN_META;
  public readonly tokenGroups = CATEGORY_TOKEN_GROUPS;

  public readonly activeDesign = computed<CategoryDesignOption>(
    () => CATEGORY_DESIGNS.find((d) => d.key === this.layoutKeySignal()) || CATEGORY_DESIGNS[0]
  );

  public readonly activeTokens = computed<CategoryTokens>(() =>
    this.tokensFor(this.layoutKeySignal())
  );

  /** The design the page renders: the saved one, or the baseline while off. */
  public readonly effectiveKey = computed<CategoryDesignKey>(() =>
    this.enabled() ? this.layoutKeySignal() : BASELINE_CATEGORY_DESIGN
  );

  public readonly rootClass = computed<string>(() =>
    'category-layout-' + this.effectiveKey()
  );

  /** Variables the page renders with — stock defaults while off. */
  public readonly pageCssVars = computed<Record<string, string>>(() =>
    this.enabled()
      ? this.varsFrom(this.activeTokens())
      : this.varsFrom(this.defaultsFor(BASELINE_CATEGORY_DESIGN))
  );

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  public designFor(key: CategoryDesignKey): CategoryDesignOption {
    return CATEGORY_DESIGNS.find((d) => d.key === key) || CATEGORY_DESIGNS[0];
  }

  public tokensFor(key: CategoryDesignKey): CategoryTokens {
    return { ...this.designFor(key).defaults, ...(this.overridesSignal()[key] || {}) };
  }

  public defaultsFor(key: CategoryDesignKey): CategoryTokens {
    return { ...this.designFor(key).defaults };
  }

  public cssVars(key?: CategoryDesignKey): Record<string, string> {
    return this.varsFrom(key ? this.tokensFor(key) : this.activeTokens());
  }

  private varsFrom(tokens: CategoryTokens): Record<string, string> {
    const vars: Record<string, string> = {};

    vars['--cat-canvas-bg'] = tokens.canvasBg;
    vars['--cat-card-bg'] = tokens.cardBg;
    vars['--cat-card-border'] = tokens.cardBorder;
    vars['--cat-text-color'] = tokens.textColor;
    vars['--cat-text-muted'] = tokens.textMuted;
    vars['--cat-accent-color'] = tokens.accentColor;
    vars['--cat-status-active'] = tokens.statusActiveColor;
    vars['--cat-status-draft'] = tokens.statusDraftColor;
    vars['--cat-card-scale'] = String(tokens.cardScale / 100);
    vars['--cat-card-radius'] = tokens.cardRadius + 'px';
    vars['--cat-padding'] = tokens.padding + 'px';
    vars['--cat-grid-gap'] = tokens.gridGap + 'px';
    vars['--cat-font-size'] = tokens.fontSize + 'px';
    vars['--cat-button-bg'] = tokens.buttonBg;
    vars['--cat-button-color'] = tokens.buttonColor;

    return vars;
  }

  public readonly tokens = this.activeTokens;

  public selectDesign(key: CategoryDesignKey): void {
    // Only the design is chosen here. Whether it is applied is the master
    // switch's business, so picking one never turns a page's customization on
    // behind the admin's back.
    this.layoutKeySignal.set(key);
  }

  public setActiveDesign(key: CategoryDesignKey): void {
    this.selectDesign(key);
  }

  public setToken(
    keyOrToken: CategoryDesignKey | CategoryTokenKey,
    tokenOrValue: CategoryTokenKey | string | number,
    maybeValue?: string | number
  ): void {
    let key: CategoryDesignKey;
    let token: CategoryTokenKey;
    let value: string | number;

    if (maybeValue !== undefined) {
      key = keyOrToken as CategoryDesignKey;
      token = tokenOrValue as CategoryTokenKey;
      value = maybeValue;
    } else {
      key = this.layoutKeySignal();
      token = keyOrToken as CategoryTokenKey;
      value = tokenOrValue as string | number;
    }

    this.overridesSignal.update((all) => ({
      ...all,
      [key]: { ...(all[key] || {}), [token]: value },
    }));
  }

  public resetDesign(key: CategoryDesignKey): void {
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
    const stored: StoredCategoryLayout = {
      layoutKey: this.layoutKeySignal(),
      overrides: this.overridesSignal(),
      // Mirrored for builds that predate the customization switches; the
      // value read back is the one in `system_customization`.
      enabled: this.enabled(),
    };
    return { system_category_layout: JSON.stringify(stored) };
  }

  public hydrate(): void {
    const raw =
      this.settingsService.settingsMap()['system_category_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_CATEGORY_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: Partial<StoredCategoryLayout> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as any);

      if (parsed?.layoutKey && CATEGORY_DESIGNS.some((d) => d.key === parsed.layoutKey)) {
        this.layoutKeySignal.set(parsed.layoutKey);
      }
      if (parsed?.overrides && typeof parsed.overrides === 'object') {
        this.overridesSignal.set(parsed.overrides);
      }
      // `enabled` is deliberately not read here: CustomizationService owns it
      // and migrates this blob's old value on first load.
    } catch (_) {
      // Retain defaults on error
    }
  }
}

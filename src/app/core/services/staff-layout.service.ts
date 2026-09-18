import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { CustomizationService } from './customization.service';

export type StaffDesignKey = 'idcard' | 'darkneon' | 'roster' | 'list' | 'bento' | 'glassmorphism' | 'retrobrutalist' | 'metro' | 'timeline' | 'compactpill' | 'radialhud';

export interface StaffTokens {
  /** Page / Canvas background behind staff elements */
  canvasBg: string;
  /** Tile / row / card surface */
  cardBg: string;
  cardBorder: string;
  /** Text colors */
  textColor: string;
  textMuted: string;
  /** Accent colors */
  accentColor: string;
  /** Role & access status */
  roleBadgeBg: string;
  roleBadgeColor: string;
  statusActiveColor: string;
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

export type StaffTokenKey = keyof StaffTokens;

export type StaffTokenGroup =
  | 'Surface & Background'
  | 'Typography & Colors'
  | 'Role & Access'
  | 'Sizing & Spacing'
  | 'Buttons & Actions';

export interface StaffTokenMeta {
  key: StaffTokenKey;
  label: string;
  group: StaffTokenGroup;
  type: 'color' | 'range';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const STAFF_TOKEN_META: StaffTokenMeta[] = [
  // Surface
  { key: 'canvasBg', label: 'Directory Background', group: 'Surface & Background', type: 'color' },
  { key: 'cardBg', label: 'Card / Row Surface', group: 'Surface & Background', type: 'color' },
  { key: 'cardBorder', label: 'Card / Row Border', group: 'Surface & Background', type: 'color' },

  // Typography
  { key: 'textColor', label: 'Staff Name / Title', group: 'Typography & Colors', type: 'color' },
  { key: 'textMuted', label: 'Username & Meta Text', group: 'Typography & Colors', type: 'color' },
  { key: 'accentColor', label: 'Accent & Icon Highlight', group: 'Typography & Colors', type: 'color' },

  // Role & Access
  { key: 'roleBadgeBg', label: 'Role Badge Background', group: 'Role & Access', type: 'color' },
  { key: 'roleBadgeColor', label: 'Role Badge Text Color', group: 'Role & Access', type: 'color' },
  { key: 'statusActiveColor', label: 'Active Status Dot Color', group: 'Role & Access', type: 'color' },

  // Sizing
  { key: 'cardScale', label: 'Card Scale Factor', group: 'Sizing & Spacing', type: 'range', min: 80, max: 130, step: 2, unit: '%' },
  { key: 'cardRadius', label: 'Corner Radius', group: 'Sizing & Spacing', type: 'range', min: 0, max: 32, step: 2, unit: 'px' },
  { key: 'padding', label: 'Internal Padding', group: 'Sizing & Spacing', type: 'range', min: 6, max: 32, step: 2, unit: 'px' },
  { key: 'gridGap', label: 'Grid / Row Spacing', group: 'Sizing & Spacing', type: 'range', min: 8, max: 40, step: 2, unit: 'px' },

  // Buttons & Font
  { key: 'fontSize', label: 'Base Font Size', group: 'Buttons & Actions', type: 'range', min: 11, max: 20, step: 1, unit: 'px' },
  { key: 'buttonBg', label: 'Action Button Background', group: 'Buttons & Actions', type: 'color' },
  { key: 'buttonColor', label: 'Action Button Icon / Text', group: 'Buttons & Actions', type: 'color' },
];

export const STAFF_TOKEN_GROUPS: StaffTokenGroup[] = [
  'Surface & Background',
  'Typography & Colors',
  'Role & Access',
  'Sizing & Spacing',
  'Buttons & Actions',
];

export interface StaffDesignOption {
  key: StaffDesignKey;
  name: string;
  label?: string;
  blurb: string;
  description?: string;
  subtitle?: string;
  badge: string;
  icon: string;
  defaults: StaffTokens;
}

export const STAFF_DESIGNS: StaffDesignOption[] = [
  {
    key: 'idcard',
    name: 'Executive Security ID Badge',
    label: 'Executive Security ID Badge',
    blurb: 'Physical vertical corporate access badge with top lanyard strap slot, metallic punch hole, holographic clearance badge, employee photo ring, and barcode EMP-ID chip.',
    description: 'Physical vertical corporate access badge with top lanyard strap slot, metallic punch hole, holographic clearance badge, employee photo ring, and barcode EMP-ID chip.',
    subtitle: 'Physical Access Lanyard Card',
    badge: 'Design 1 · Security Pass',
    icon: 'badge',
    defaults: {
      canvasBg: '#F1F5F9',
      cardBg: '#FFFFFF',
      cardBorder: '#CBD5E1',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#4F46E5',
      roleBadgeBg: '#EEF2FF',
      roleBadgeColor: '#4338CA',
      statusActiveColor: '#10B981',
      cardScale: 100,
      cardRadius: 20,
      padding: 20,
      gridGap: 22,
      fontSize: 15,
      buttonBg: '#4F46E5',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'darkneon',
    name: 'Obsidian Dark Matrix',
    label: 'Obsidian Dark Matrix',
    blurb: 'Futuristic dark glassmorphic command center with deep obsidian canvas, glowing neon cyan borders, live radar pulse indicator, terminal HUD tags, and illuminated actions.',
    description: 'Futuristic dark glassmorphic command center with deep obsidian canvas, glowing neon cyan borders, live radar pulse indicator, terminal HUD tags, and illuminated actions.',
    subtitle: 'Cyberpunk Glass Terminal',
    badge: 'Design 2 · Dark Mode',
    icon: 'terminal',
    defaults: {
      canvasBg: '#0B0F19',
      cardBg: '#111827',
      cardBorder: '#374151',
      textColor: '#F9FAFB',
      textMuted: '#9CA3AF',
      accentColor: '#06B6D4',
      roleBadgeBg: 'rgba(6, 182, 212, 0.15)',
      roleBadgeColor: '#22D3EE',
      statusActiveColor: '#10B981',
      cardScale: 100,
      cardRadius: 14,
      padding: 18,
      gridGap: 18,
      fontSize: 14,
      buttonBg: '#06B6D4',
      buttonColor: '#000000',
    },
  },
  {
    key: 'roster',
    name: 'Horizontal Roster Stream',
    label: 'Horizontal Roster Stream',
    blurb: 'Full-width horizontal banner strips with left-to-right flow, avatar bubble, permissions coverage progress gauge, last login activity badge, and contact action pills.',
    description: 'Full-width horizontal banner strips with left-to-right flow, avatar bubble, permissions coverage progress gauge, last login activity badge, and contact action pills.',
    subtitle: 'Wide Banner Shift Stream',
    badge: 'Design 3 · Stream',
    icon: 'view_agenda',
    defaults: {
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#0D9488',
      roleBadgeBg: '#CCFBF1',
      roleBadgeColor: '#0F766E',
      statusActiveColor: '#14B8A6',
      cardScale: 100,
      cardRadius: 16,
      padding: 16,
      gridGap: 14,
      fontSize: 14,
      buttonBg: '#0D9488',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'list',
    name: 'Enterprise SaaS Power Table',
    label: 'Enterprise SaaS Power Table',
    blurb: 'High-density corporate spreadsheet with alternating zebra stripes, sticky header row, selection checkboxes, inline user identity, monospace contacts, and rapid actions.',
    description: 'High-density corporate spreadsheet with alternating zebra stripes, sticky header row, selection checkboxes, inline user identity, monospace contacts, and rapid actions.',
    subtitle: 'Dense Corporate Spreadsheet',
    badge: 'Design 4 · Power Table',
    icon: 'table_chart',
    defaults: {
      canvasBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      textColor: '#111827',
      textMuted: '#6B7280',
      accentColor: '#2563EB',
      roleBadgeBg: '#EFF6FF',
      roleBadgeColor: '#1D4ED8',
      statusActiveColor: '#16A34A',
      cardScale: 100,
      cardRadius: 8,
      padding: 12,
      gridGap: 12,
      fontSize: 13,
      buttonBg: '#2563EB',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'bento',
    name: 'Modern Bento Metric Profile',
    label: 'Modern Bento Metric Profile',
    blurb: 'Trendy Bento-box profile cards with colorful gradient hero banner, overlapping circular avatar, two inner metric stat boxes (Access Tier & Permissions), and curvy pill buttons.',
    description: 'Trendy Bento-box profile cards with colorful gradient hero banner, overlapping circular avatar, two inner metric stat boxes (Access Tier & Permissions), and curvy pill buttons.',
    subtitle: 'Apple / Vercel Bento Cards',
    badge: 'Design 5 · Bento Grid',
    icon: 'dashboard',
    defaults: {
      canvasBg: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#F3E8FF',
      textColor: '#1E1B4B',
      textMuted: '#6B7280',
      accentColor: '#8B5CF6',
      roleBadgeBg: '#EDE9FE',
      roleBadgeColor: '#6D28D9',
      statusActiveColor: '#10B981',
      cardScale: 100,
      cardRadius: 24,
      padding: 20,
      gridGap: 20,
      fontSize: 15,
      buttonBg: '#8B5CF6',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'glassmorphism',
    name: 'Frosted Glass Aurora',
    label: 'Frosted Glass Aurora',
    blurb: 'Liquid glassmorphic aesthetic with translucent frosted panels on a colorful aurora mesh gradient, iridescent borders, ambient floating orbs, and frosted pill tags.',
    description: 'Liquid glassmorphic aesthetic with translucent frosted panels on a colorful aurora mesh gradient, iridescent borders, ambient floating orbs, and frosted pill tags.',
    subtitle: 'Glassmorphism Cards',
    badge: 'Design 6 · Glass',
    icon: 'blur_on',
    defaults: {
      canvasBg: '#0F0C29',
      cardBg: 'rgba(255, 255, 255, 0.12)',
      cardBorder: 'rgba(255, 255, 255, 0.22)',
      textColor: '#F8FAFC',
      textMuted: '#CBD5E1',
      accentColor: '#A78BFA',
      roleBadgeBg: 'rgba(167, 139, 250, 0.2)',
      roleBadgeColor: '#C4B5FD',
      statusActiveColor: '#34D399',
      cardScale: 100,
      cardRadius: 24,
      padding: 22,
      gridGap: 22,
      fontSize: 15,
      buttonBg: 'rgba(167, 139, 250, 0.3)',
      buttonColor: '#F8FAFC',
    },
  },
  {
    key: 'retrobrutalist',
    name: 'Neo-Brutalism Pop',
    label: 'Neo-Brutalism Pop',
    blurb: 'High-contrast graphic design with thick 3px black borders, hard offset drop shadows, electric pop sticker colors (acid yellow, vivid cyan, punchy pink), and tactile click animation.',
    description: 'High-contrast graphic design with thick 3px black borders, hard offset drop shadows, electric pop sticker colors (acid yellow, vivid cyan, punchy pink), and tactile click animation.',
    subtitle: 'Bold Graphic Brutalism',
    badge: 'Design 7 · Brutalist',
    icon: 'format_bold',
    defaults: {
      canvasBg: '#FEF9C3',
      cardBg: '#FFFFFF',
      cardBorder: '#000000',
      textColor: '#000000',
      textMuted: '#374151',
      accentColor: '#F43F5E',
      roleBadgeBg: '#A5F3FC',
      roleBadgeColor: '#000000',
      statusActiveColor: '#22C55E',
      cardScale: 100,
      cardRadius: 0,
      padding: 18,
      gridGap: 20,
      fontSize: 15,
      buttonBg: '#FACC15',
      buttonColor: '#000000',
    },
  },
  {
    key: 'metro',
    name: 'Flat Metro Grid',
    label: 'Flat Metro Grid',
    blurb: 'Modern geometric flat tiles inspired by Swiss/Metro UI: zero border-radius, rich solid color-blocked surfaces (cobalt, crimson, amber, emerald), oversized role watermarks, and clean geometric typography.',
    description: 'Modern geometric flat tiles inspired by Swiss/Metro UI: zero border-radius, rich solid color-blocked surfaces (cobalt, crimson, amber, emerald), oversized role watermarks, and clean geometric typography.',
    subtitle: 'Swiss Flat Color Tiles',
    badge: 'Design 8 · Metro',
    icon: 'grid_view',
    defaults: {
      canvasBg: '#1E293B',
      cardBg: '#2563EB',
      cardBorder: 'transparent',
      textColor: '#FFFFFF',
      textMuted: 'rgba(255,255,255,0.7)',
      accentColor: '#FACC15',
      roleBadgeBg: 'rgba(0, 0, 0, 0.25)',
      roleBadgeColor: '#FFFFFF',
      statusActiveColor: '#34D399',
      cardScale: 100,
      cardRadius: 0,
      padding: 20,
      gridGap: 4,
      fontSize: 15,
      buttonBg: 'rgba(0, 0, 0, 0.3)',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'timeline',
    name: 'Vertical Activity Timeline',
    label: 'Vertical Activity Timeline',
    blurb: 'Continuous vertical shift activity feed: central connecting timeline track with animated glowing node pulses, speech-bubble staff cards branching off, and last check-in telemetry.',
    description: 'Continuous vertical shift activity feed: central connecting timeline track with animated glowing node pulses, speech-bubble staff cards branching off, and last check-in telemetry.',
    subtitle: 'Chrono Feed Timeline',
    badge: 'Design 9 · Timeline',
    icon: 'timeline',
    defaults: {
      canvasBg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#7C3AED',
      roleBadgeBg: '#EDE9FE',
      roleBadgeColor: '#6D28D9',
      statusActiveColor: '#10B981',
      cardScale: 100,
      cardRadius: 16,
      padding: 18,
      gridGap: 0,
      fontSize: 14,
      buttonBg: '#7C3AED',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'compactpill',
    name: 'Floating Capsule Chips',
    label: 'Floating Capsule Chips',
    blurb: 'Ultra-sleek lightweight horizontal capsule pills with 9999px radius for fast scanning, ambient status halo glow, compact micro-avatar, inline role tag, and expandable hover drawer.',
    description: 'Ultra-sleek lightweight horizontal capsule pills with 9999px radius for fast scanning, ambient status halo glow, compact micro-avatar, inline role tag, and expandable hover drawer.',
    subtitle: 'Capsule Island Pills',
    badge: 'Design 10 · Capsule',
    icon: 'more_horiz',
    defaults: {
      canvasBg: '#F1F5F9',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textColor: '#0F172A',
      textMuted: '#64748B',
      accentColor: '#F97316',
      roleBadgeBg: '#FFF7ED',
      roleBadgeColor: '#C2410C',
      statusActiveColor: '#10B981',
      cardScale: 100,
      cardRadius: 999,
      padding: 12,
      gridGap: 12,
      fontSize: 14,
      buttonBg: '#F97316',
      buttonColor: '#FFFFFF',
    },
  },
  {
    key: 'radialhud',
    name: 'Sci-Fi Radial HUD',
    label: 'Sci-Fi Radial HUD',
    blurb: 'Futuristic aerospace HUD with circular card container, animated radial conic-gradient permission ring around the avatar, rotating orbital ring border, holographic coordinates, and targeting reticles.',
    description: 'Futuristic aerospace HUD with circular card container, animated radial conic-gradient permission ring around the avatar, rotating orbital ring border, holographic coordinates, and targeting reticles.',
    subtitle: 'Holographic Orb HUD',
    badge: 'Design 11 · Radial',
    icon: 'radar',
    defaults: {
      canvasBg: '#020617',
      cardBg: 'rgba(15, 23, 42, 0.85)',
      cardBorder: 'rgba(52, 211, 153, 0.35)',
      textColor: '#E2E8F0',
      textMuted: '#94A3B8',
      accentColor: '#34D399',
      roleBadgeBg: 'rgba(52, 211, 153, 0.15)',
      roleBadgeColor: '#6EE7B7',
      statusActiveColor: '#34D399',
      cardScale: 100,
      cardRadius: 20,
      padding: 20,
      gridGap: 24,
      fontSize: 14,
      buttonBg: 'rgba(52, 211, 153, 0.25)',
      buttonColor: '#34D399',
    },
  },
];

export const STAFF_DESIGN_OPTIONS = STAFF_DESIGNS;

export const DEFAULT_STAFF_DESIGN: StaffDesignKey = 'idcard';

/**
 * The design the directory falls back to while its customization switch is
 * off: List View. The other pages fall back to their Card View, but this one
 * ships no card design, so its built-in table stands in. It renders with its
 * own stock palette, never the saved overrides, so "off" always looks the same
 * however it was customized.
 */
export const BASELINE_STAFF_DESIGN: StaffDesignKey = 'list';

interface StoredStaffLayout {
  layoutKey: StaffDesignKey;
  overrides: Partial<Record<StaffDesignKey, Partial<StaffTokens>>>;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class StaffLayoutService {
  private readonly settingsService = inject(SettingsService);
  private readonly customization = inject(CustomizationService);

  private readonly layoutKeySignal = signal<StaffDesignKey>(DEFAULT_STAFF_DESIGN);
  private readonly overridesSignal = signal<Partial<Record<StaffDesignKey, Partial<StaffTokens>>>>({});

  public readonly activeKey = this.layoutKeySignal.asReadonly();

  /**
   * Whether the page applies its saved design at all. The switch lives in
   * Settings -> POS Customization, which is the single place it is stored; the
   * design and its palette stay saved either way.
   */
  public readonly enabled = this.customization.staffRolesCustomize;

  /** The design the page renders: the saved one, or the baseline while off. */
  public readonly effectiveKey = computed<StaffDesignKey>(() =>
    this.enabled() ? this.layoutKeySignal() : BASELINE_STAFF_DESIGN
  );

  public readonly rootClass = computed<string>(() => 'staff-layout-' + this.effectiveKey());
  public readonly allOverrides = this.overridesSignal.asReadonly();

  public readonly activeDesign = computed<StaffDesignOption>(() => {
    const key = this.layoutKeySignal();
    return STAFF_DESIGNS.find((d) => d.key === key) ?? STAFF_DESIGNS[0];
  });

  public readonly activeTokens = computed<StaffTokens>(() => {
    const key = this.layoutKeySignal();
    const defaults = this.activeDesign().defaults;
    const ov = this.overridesSignal()[key] ?? {};
    return { ...defaults, ...ov };
  });

  public readonly activeCssVars = computed<Record<string, string>>(() => {
    return this.tokensToCssVars(this.activeTokens());
  });

  /** Variables the page renders with — stock defaults while off. */
  public readonly pageCssVars = computed<Record<string, string>>(() =>
    this.enabled()
      ? this.tokensToCssVars(this.activeTokens())
      : this.tokensToCssVars(this.defaultsFor(BASELINE_STAFF_DESIGN))
  );

  constructor() {
    this.loadFromSettings();
  }

  public designFor(key: StaffDesignKey): StaffDesignOption {
    return STAFF_DESIGNS.find((d) => d.key === key) ?? STAFF_DESIGNS[0];
  }

  public tokensFor(key: StaffDesignKey): StaffTokens {
    const design = this.designFor(key);
    const ov = this.overridesSignal()[key] ?? {};
    return { ...design.defaults, ...ov };
  }

  public defaultsFor(key: StaffDesignKey): StaffTokens {
    return { ...this.designFor(key).defaults };
  }

  public cssVars(key?: StaffDesignKey): Record<string, string> {
    if (!key || key === this.layoutKeySignal()) {
      return this.activeCssVars();
    }
    return this.tokensToCssVars(this.tokensFor(key));
  }

  public tokensToCssVars(tokens: StaffTokens): Record<string, string> {
    return {
      '--staff-canvas-bg': tokens.canvasBg,
      '--staff-card-bg': tokens.cardBg,
      '--staff-card-border': tokens.cardBorder,
      '--staff-text-color': tokens.textColor,
      '--staff-text-muted': tokens.textMuted,
      '--staff-accent-color': tokens.accentColor,
      '--staff-role-badge-bg': tokens.roleBadgeBg,
      '--staff-role-badge-color': tokens.roleBadgeColor,
      '--staff-status-active-color': tokens.statusActiveColor,
      '--staff-card-scale': `${tokens.cardScale / 100}`,
      '--staff-card-radius': `${tokens.cardRadius}px`,
      '--staff-padding': `${tokens.padding}px`,
      '--staff-grid-gap': `${tokens.gridGap}px`,
      '--staff-font-size': `${tokens.fontSize}px`,
      '--staff-btn-bg': tokens.buttonBg,
      '--staff-btn-color': tokens.buttonColor,
    };
  }

  public readonly tokens = this.activeTokens;

  public selectDesign(key: StaffDesignKey): void {
    this.layoutKeySignal.set(key);
    this.applyLayout();
  }

  public setActiveDesign(key: StaffDesignKey): void {
    this.selectDesign(key);
  }

  public setToken(
    keyOrToken: StaffDesignKey | StaffTokenKey,
    tokenOrValue: StaffTokenKey | string | number,
    maybeValue?: string | number
  ): void {
    let key: StaffDesignKey;
    let token: StaffTokenKey;
    let value: string | number;

    if (maybeValue !== undefined) {
      key = keyOrToken as StaffDesignKey;
      token = tokenOrValue as StaffTokenKey;
      value = maybeValue;
    } else {
      key = this.layoutKeySignal();
      token = keyOrToken as StaffTokenKey;
      value = tokenOrValue as string | number;
    }

    this.overridesSignal.update((curr) => {
      const designOv = { ...(curr[key] ?? {}) };
      (designOv as any)[token] = value;
      return { ...curr, [key]: designOv };
    });
    this.applyLayout();
  }

  public resetDesign(key: StaffDesignKey): void {
    this.overridesSignal.update((curr) => {
      const copy = { ...curr };
      delete copy[key];
      return copy;
    });
    this.applyLayout();
  }

  public resetActiveDesignToDefaults(): void {
    this.resetDesign(this.layoutKeySignal());
  }

  public resetAll(): void {
    this.overridesSignal.set({});
    this.layoutKeySignal.set(DEFAULT_STAFF_DESIGN);
    this.applyLayout();
  }

  public exportSettingsPayload(): Record<string, string> {
    const stored: StoredStaffLayout = {
      layoutKey: this.layoutKeySignal(),
      overrides: this.overridesSignal(),
      // Mirrored for builds that predate the customization switches; the
      // value read back is the one in `system_customization`.
      enabled: this.enabled(),
    };
    return { system_staff_layout: JSON.stringify(stored) };
  }

  public toPayload(): Record<string, string> {
    return this.exportSettingsPayload();
  }

  public loadFromSettings(): void {
    const raw =
      this.settingsService.settingsMap()['system_staff_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_STAFF_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: StoredStaffLayout = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object') {
        let key: any = parsed.layoutKey;
        if (key === 'clean') key = 'darkneon';
        if (key === 'compact') key = 'roster';
        if (key === 'card') key = 'bento';
        if (key && STAFF_DESIGNS.some((d) => d.key === key)) {
          this.layoutKeySignal.set(key);
        }
        if (parsed.overrides && typeof parsed.overrides === 'object') {
          this.overridesSignal.set(parsed.overrides);
        }
      }
    } catch (err) {
      console.warn('[StaffLayoutService] Failed to parse system_staff_layout:', err);
    }
  }

  public applyLayout(): void {
    const vars = this.activeCssVars();
    if (typeof document !== 'undefined' && document.documentElement) {
      for (const [prop, val] of Object.entries(vars)) {
        document.documentElement.style.setProperty(prop, val);
      }
    }
  }
}

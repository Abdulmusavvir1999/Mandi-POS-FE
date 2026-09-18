import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

export type SidebarTemplateKey =
  | 'default'
  | 'classic'
  | 'minimal'
  | 'compact'
  | 'floating'
  | 'iconfocus'
  | 'elegant'
  | 'dashboardpro'
  | 'glass'
  | 'smart'
  | 'collapsiblepro';

export const SIDEBAR_TEMPLATE_KEYS: SidebarTemplateKey[] = [
  'default',
  'classic',
  'minimal',
  'compact',
  'floating',
  'iconfocus',
  'elegant',
  'dashboardpro',
  'glass',
  'smart',
  'collapsiblepro',
];

/**
 * Structural / motion tokens only.
 *
 * Sidebar COLORS intentionally stay owned by ThemeService (--sidebar-bg,
 * --sidebar-text, --sidebar-active-accent, --sidebar-surface, --sidebar-border).
 * Every template inherits the active theme palette so switching template never
 * breaks branding; only geometry, elevation and interaction change here.
 */
export interface SidebarTokens {
  /** Expanded rail width (px) */
  width: number;
  /** Icon-only rail width (px) */
  collapsedWidth: number;
  /** Menu row height (px) */
  itemHeight: number;
  /** Menu row corner radius (px) */
  itemRadius: number;
  /** Vertical space between menu rows (px) */
  itemGap: number;
  /** Vertical space between nav groups (px) */
  sectionGap: number;
  /** Scroll area horizontal padding (px) */
  navPadding: number;
  /** Menu label size (px) */
  fontSize: number;
  /** Menu glyph size (px) */
  iconSize: number;
  /** Elevation intensity, 0 = flat, 100 = dramatic */
  shadowStrength: number;
  /** Horizontal travel of a row on hover (px) */
  hoverShift: number;
  /** Master transition duration (ms) */
  animSpeed: number;
  /** Outer panel corner radius — floating / glass rails (px) */
  panelRadius: number;
  /** Gap between the panel and the app edges (px) */
  panelInset: number;
}

export type SidebarTokenKey = keyof SidebarTokens;

export type SidebarTokenGroup =
  | 'Rail Geometry'
  | 'Menu Rows'
  | 'Typography & Icons'
  | 'Motion & Elevation';

export interface SidebarTokenMeta {
  key: SidebarTokenKey;
  label: string;
  group: SidebarTokenGroup;
  type: 'range';
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const SIDEBAR_TOKEN_META: SidebarTokenMeta[] = [
  // Rail Geometry
  { key: 'width', label: 'Expanded Width', group: 'Rail Geometry', type: 'range', min: 190, max: 340, step: 2, unit: 'px' },
  { key: 'collapsedWidth', label: 'Collapsed Rail Width', group: 'Rail Geometry', type: 'range', min: 56, max: 110, step: 2, unit: 'px' },
  { key: 'panelRadius', label: 'Panel Corner Radius', group: 'Rail Geometry', type: 'range', min: 0, max: 32, step: 1, unit: 'px' },
  { key: 'panelInset', label: 'Panel Edge Inset', group: 'Rail Geometry', type: 'range', min: 0, max: 24, step: 1, unit: 'px' },
  { key: 'navPadding', label: 'Nav Side Padding', group: 'Rail Geometry', type: 'range', min: 2, max: 24, step: 1, unit: 'px' },

  // Menu Rows
  { key: 'itemHeight', label: 'Menu Row Height', group: 'Menu Rows', type: 'range', min: 32, max: 60, step: 1, unit: 'px' },
  { key: 'itemRadius', label: 'Menu Row Radius', group: 'Menu Rows', type: 'range', min: 0, max: 26, step: 1, unit: 'px' },
  { key: 'itemGap', label: 'Row Spacing', group: 'Menu Rows', type: 'range', min: 0, max: 14, step: 1, unit: 'px' },
  { key: 'sectionGap', label: 'Group Spacing', group: 'Menu Rows', type: 'range', min: 4, max: 36, step: 1, unit: 'px' },

  // Typography & Icons
  { key: 'fontSize', label: 'Menu Label Size', group: 'Typography & Icons', type: 'range', min: 11, max: 17, step: 1, unit: 'px' },
  { key: 'iconSize', label: 'Menu Icon Size', group: 'Typography & Icons', type: 'range', min: 16, max: 30, step: 1, unit: 'px' },

  // Motion & Elevation
  { key: 'animSpeed', label: 'Transition Speed', group: 'Motion & Elevation', type: 'range', min: 60, max: 420, step: 10, unit: 'ms' },
  { key: 'hoverShift', label: 'Hover Travel', group: 'Motion & Elevation', type: 'range', min: 0, max: 12, step: 1, unit: 'px' },
  { key: 'shadowStrength', label: 'Shadow Intensity', group: 'Motion & Elevation', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
];

/** Behaviour a template opts into. Menu items, routes and permissions never change. */
export interface SidebarTemplateCaps {
  /** Renders the filter/search field above the nav groups */
  hasSearch: boolean;
  /** Group headings become expand/collapse triggers */
  collapsibleSections: boolean;
  /** Notification + help shortcut strip under the brand header */
  quickActions: boolean;
  /** Rail opens in icon-only mode the first time this template is selected */
  prefersCollapsed: boolean;
}

export interface SidebarTemplateOption {
  key: SidebarTemplateKey;
  label: string;
  subtitle: string;
  badge?: string;
  description: string;
  /** Highlighted motion / interaction traits, shown on the chooser card */
  highlights: string[];
  caps: SidebarTemplateCaps;
}

const CAPS_BASE: SidebarTemplateCaps = {
  hasSearch: false,
  collapsibleSections: false,
  quickActions: false,
  prefersCollapsed: false,
};

export const SIDEBAR_TEMPLATE_OPTIONS: SidebarTemplateOption[] = [
  {
    key: 'default',
    label: 'Default',
    subtitle: 'The Shipped POS Rail',
    badge: 'Stock',
    description:
      'The rail this build ships with — 240px dock, grouped sections, left accent indicator and a profile footer, now with refined icon-pop hover and a growing active bar.',
    highlights: ['Accent bar grows from center', 'Icon pop on hover', 'Flat, zero-distraction surface'],
    caps: { ...CAPS_BASE },
  },
  {
    key: 'classic',
    label: 'Classic Sidebar',
    subtitle: 'Traditional ERP / Admin Dock',
    description:
      'Dense full-width rail with squared rows, hairline group separators, a full-bleed active band and a bold 4px rail marker. Built for operators who live in the menu all day.',
    highlights: ['Label slides on hover', 'Full-bleed active band', 'Inset pressed-row shadow'],
    caps: { ...CAPS_BASE, collapsibleSections: true },
  },
  {
    key: 'minimal',
    label: 'Modern Minimal',
    subtitle: 'Clean SaaS Dashboard Rail',
    description:
      'Airy, border-free navigation with generous breathing room. Hover is a whisper-light tint, the active row is a soft pill with an accent dot — almost no shadow anywhere.',
    highlights: ['Whisper tint hover', 'Pill active + trailing dot', 'Near-flat elevation'],
    caps: { ...CAPS_BASE },
  },
  {
    key: 'compact',
    label: 'Compact Sidebar',
    subtitle: 'High-Density Module Rail',
    description:
      'Narrow 200px rail with 34px rows so large module trees fit on one screen. Icons lead, labels stay small, tooltips appear the moment the rail collapses.',
    highlights: ['Icon scales 1.15 on hover', 'Tight 34px rows', 'Tooltips in collapsed mode'],
    caps: { ...CAPS_BASE, prefersCollapsed: true },
  },
  {
    key: 'floating',
    label: 'Floating Sidebar',
    subtitle: 'Detached Elevated Panel',
    description:
      'The rail lifts off the page as a rounded 20px panel with visible margins and a deep ambient shadow. Rows are chips; the active chip rides on its own elevation.',
    highlights: ['Row lifts on hover', 'Deep ambient panel shadow', 'Gradient active chip'],
    caps: { ...CAPS_BASE },
  },
  {
    key: 'iconfocus',
    label: 'Icon Focus',
    subtitle: 'Glyph-Led Module Navigation',
    description:
      'Every row leads with a large rounded icon tile. Active tiles fill with the accent and glow; labels shrink to a supporting caption for fast visual module jumps.',
    highlights: ['Tile tilts + scales on hover', 'Accent-filled glowing tile', 'Caption-weight labels'],
    caps: { ...CAPS_BASE, collapsibleSections: true },
  },
  {
    key: 'elegant',
    label: 'Elegant Navigation',
    subtitle: 'Premium Structured Groups',
    description:
      'Refined typography with letter-spaced group headings, hairline rules and a gradient sweep that washes across the row on hover. Polished rather than loud.',
    highlights: ['Gradient sweep hover', 'Hairline rule headings', 'Letter-spaced active label'],
    caps: { ...CAPS_BASE },
  },
  {
    key: 'dashboardpro',
    label: 'Dashboard Pro',
    subtitle: 'Full ERP Command Rail',
    badge: 'Most Features',
    description:
      'The complete admin rail: menu search, notification and help shortcuts, collapsible module groups, strong hierarchy and a solid accent-filled active row.',
    highlights: ['Menu search filter', 'Notification / help strip', 'Solid accent active row'],
    caps: { hasSearch: true, collapsibleSections: true, quickActions: true, prefersCollapsed: false },
  },
  {
    key: 'glass',
    label: 'Glass Sidebar',
    subtitle: 'Translucent Blurred Surface',
    description:
      'Semi-transparent rail with a real backdrop blur, frosted hairline borders and rounded rows. The active row becomes tinted glass with an inner accent glow.',
    highlights: ['Backdrop blur surface', 'Border-glow hover', 'Inner-glow active glass'],
    caps: { ...CAPS_BASE },
  },
  {
    key: 'smart',
    label: 'Smart Navigation',
    subtitle: 'Adaptive Productivity Rail',
    description:
      'Adapts to how you work: collapsible groups, remembered expand/collapse state, tooltips when narrow, and an indicator that animates its height into place.',
    highlights: ['Indicator animates height', 'Remembers rail state', 'Icon micro-bounce'],
    caps: { hasSearch: true, collapsibleSections: true, quickActions: false, prefersCollapsed: false },
  },
  {
    key: 'collapsiblepro',
    label: 'Collapsible Pro',
    subtitle: 'Advanced Collapse Choreography',
    description:
      'Built around the collapse gesture — labels fade and slide out on a spring curve, collapsed rows become glowing centred tiles, and the toggle rotates as it flips.',
    highlights: ['Spring width choreography', 'Labels fade + slide', 'Rotating toggle, glowing tiles'],
    caps: { ...CAPS_BASE, collapsibleSections: true },
  },
];

export const SIDEBAR_DEFAULT_TOKENS: Record<SidebarTemplateKey, SidebarTokens> = {
  default: {
    width: 240,
    collapsedWidth: 68,
    itemHeight: 40,
    itemRadius: 8,
    itemGap: 2,
    sectionGap: 16,
    navPadding: 8,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 18,
    hoverShift: 0,
    animSpeed: 160,
    panelRadius: 0,
    panelInset: 0,
  },
  classic: {
    width: 252,
    collapsedWidth: 66,
    itemHeight: 38,
    itemRadius: 4,
    itemGap: 0,
    sectionGap: 14,
    navPadding: 0,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 26,
    hoverShift: 4,
    animSpeed: 150,
    panelRadius: 0,
    panelInset: 0,
  },
  minimal: {
    width: 248,
    collapsedWidth: 72,
    itemHeight: 42,
    itemRadius: 10,
    itemGap: 6,
    sectionGap: 26,
    navPadding: 12,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 6,
    hoverShift: 2,
    animSpeed: 200,
    panelRadius: 0,
    panelInset: 0,
  },
  compact: {
    width: 200,
    collapsedWidth: 60,
    itemHeight: 34,
    itemRadius: 6,
    itemGap: 1,
    sectionGap: 12,
    navPadding: 6,
    fontSize: 12,
    iconSize: 19,
    shadowStrength: 20,
    hoverShift: 2,
    animSpeed: 140,
    panelRadius: 0,
    panelInset: 0,
  },
  floating: {
    width: 244,
    collapsedWidth: 74,
    itemHeight: 42,
    itemRadius: 12,
    itemGap: 4,
    sectionGap: 20,
    navPadding: 10,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 62,
    hoverShift: 0,
    animSpeed: 220,
    panelRadius: 20,
    panelInset: 12,
  },
  iconfocus: {
    width: 246,
    collapsedWidth: 78,
    itemHeight: 50,
    itemRadius: 12,
    itemGap: 4,
    sectionGap: 18,
    navPadding: 10,
    fontSize: 12,
    iconSize: 22,
    shadowStrength: 34,
    hoverShift: 0,
    animSpeed: 200,
    panelRadius: 0,
    panelInset: 0,
  },
  elegant: {
    width: 258,
    collapsedWidth: 70,
    itemHeight: 40,
    itemRadius: 10,
    itemGap: 3,
    sectionGap: 22,
    navPadding: 12,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 22,
    hoverShift: 3,
    animSpeed: 240,
    panelRadius: 0,
    panelInset: 0,
  },
  dashboardpro: {
    width: 268,
    collapsedWidth: 72,
    itemHeight: 40,
    itemRadius: 9,
    itemGap: 2,
    sectionGap: 16,
    navPadding: 10,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 40,
    hoverShift: 3,
    animSpeed: 170,
    panelRadius: 0,
    panelInset: 0,
  },
  glass: {
    width: 250,
    collapsedWidth: 74,
    itemHeight: 42,
    itemRadius: 14,
    itemGap: 4,
    sectionGap: 20,
    navPadding: 10,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 48,
    hoverShift: 2,
    animSpeed: 230,
    panelRadius: 18,
    panelInset: 8,
  },
  smart: {
    width: 252,
    collapsedWidth: 70,
    itemHeight: 40,
    itemRadius: 10,
    itemGap: 3,
    sectionGap: 18,
    navPadding: 9,
    fontSize: 13,
    iconSize: 20,
    shadowStrength: 30,
    hoverShift: 3,
    animSpeed: 190,
    panelRadius: 0,
    panelInset: 0,
  },
  collapsiblepro: {
    width: 256,
    collapsedWidth: 76,
    itemHeight: 42,
    itemRadius: 11,
    itemGap: 3,
    sectionGap: 18,
    navPadding: 10,
    fontSize: 13,
    iconSize: 21,
    shadowStrength: 38,
    hoverShift: 4,
    animSpeed: 280,
    panelRadius: 0,
    panelInset: 0,
  },
};

export interface SidebarPersistedConfig {
  activeKey: SidebarTemplateKey;
  overrides?: Partial<Record<SidebarTemplateKey, Partial<SidebarTokens>>>;
}

const COLLAPSE_STORAGE_KEY = 'pos.sidebar.collapsed';
const COLLAPSE_TEMPLATE_KEY = 'pos.sidebar.collapsed.template';

@Injectable({
  providedIn: 'root',
})
export class SidebarLayoutService {
  private settingsService = inject(SettingsService);

  private _activeKey = signal<SidebarTemplateKey>('default');
  private _overrides = signal<Partial<Record<SidebarTemplateKey, Partial<SidebarTokens>>>>({});

  public readonly activeKey = computed(() => this._activeKey());

  public readonly activeTemplate = computed<SidebarTemplateOption>(() => {
    const key = this._activeKey();
    return (
      SIDEBAR_TEMPLATE_OPTIONS.find((o) => o.key === key) || SIDEBAR_TEMPLATE_OPTIONS[0]
    );
  });

  public readonly caps = computed<SidebarTemplateCaps>(() => this.activeTemplate().caps);

  public readonly tokens = computed<SidebarTokens>(() => {
    const key = this._activeKey();
    const defaults = SIDEBAR_DEFAULT_TOKENS[key];
    const templateOverrides = this._overrides()[key] || {};
    return { ...defaults, ...templateOverrides };
  });

  public readonly cssVars = computed<Record<string, string>>(() => {
    const t = this.tokens();
    return {
      '--sb-width': `${t.width}px`,
      '--sb-collapsed-width': `${t.collapsedWidth}px`,
      '--sb-item-h': `${t.itemHeight}px`,
      '--sb-item-radius': `${t.itemRadius}px`,
      '--sb-item-gap': `${t.itemGap}px`,
      '--sb-section-gap': `${t.sectionGap}px`,
      '--sb-nav-pad': `${t.navPadding}px`,
      '--sb-font': `${t.fontSize}px`,
      '--sb-icon': `${t.iconSize}px`,
      '--sb-shadow-a': `${(t.shadowStrength / 100).toFixed(3)}`,
      '--sb-hover-shift': `${t.hoverShift}px`,
      '--sb-anim': `${t.animSpeed}ms`,
      '--sb-panel-radius': `${t.panelRadius}px`,
      '--sb-panel-inset': `${t.panelInset}px`,
    };
  });

  constructor() {
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrateFromSettings(),
      error: () => {},
    });
  }

  public hydrateFromSettings(): void {
    const raw =
      this.settingsService.settingsMap()['system_sidebar_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_SIDEBAR_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: SidebarPersistedConfig =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as SidebarPersistedConfig);
      if (parsed && typeof parsed === 'object') {
        if (parsed.activeKey && SIDEBAR_TEMPLATE_KEYS.includes(parsed.activeKey)) {
          this._activeKey.set(parsed.activeKey);
        }
        if (parsed.overrides && typeof parsed.overrides === 'object') {
          this._overrides.set(parsed.overrides);
        }
      }
    } catch (e) {
      console.warn('Could not parse system_sidebar_layout setting:', e);
    }
  }

  public setActiveTemplate(key: SidebarTemplateKey): void {
    this._activeKey.set(key);
  }

  public setToken<K extends SidebarTokenKey>(token: K, value: SidebarTokens[K]): void {
    const currentKey = this._activeKey();
    const currentOverrides = { ...this._overrides() };
    const currentTemplateOverrides = { ...(currentOverrides[currentKey] || {}) };
    currentTemplateOverrides[token] = value;
    currentOverrides[currentKey] = currentTemplateOverrides;
    this._overrides.set(currentOverrides);
  }

  public resetActiveTemplateToDefaults(): void {
    const currentKey = this._activeKey();
    const currentOverrides = { ...this._overrides() };
    delete currentOverrides[currentKey];
    this._overrides.set(currentOverrides);
  }

  public toPayload(): Record<string, string> {
    const config: SidebarPersistedConfig = {
      activeKey: this._activeKey(),
      overrides: this._overrides(),
    };
    return {
      system_sidebar_layout: JSON.stringify(config),
    };
  }

  // ── Collapse state persistence ────────────────────────────────────────
  // "Smart Navigation" and "Collapsible Pro" advertise remembered state; the
  // rail persists it for every template so the behaviour never regresses when
  // an operator switches design.

  /**
   * Resolves the collapse state the rail should open with for `key`:
   * a value the operator chose for that template, otherwise the template's
   * own `prefersCollapsed` preference.
   */
  public resolveInitialCollapsed(key: SidebarTemplateKey): boolean {
    const option = SIDEBAR_TEMPLATE_OPTIONS.find((o) => o.key === key);
    const preferred = option ? option.caps.prefersCollapsed : false;
    if (typeof window === 'undefined' || !window.localStorage) return preferred;

    try {
      const storedTemplate = window.localStorage.getItem(COLLAPSE_TEMPLATE_KEY);
      const storedValue = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (storedTemplate === key && storedValue !== null) {
        return storedValue === 'true';
      }
    } catch {
      /* storage unavailable (private mode / blocked) — fall back to preference */
    }
    return preferred;
  }

  public persistCollapsed(key: SidebarTemplateKey, collapsed: boolean): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(COLLAPSE_TEMPLATE_KEY, key);
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      /* storage unavailable — remembered state is a convenience, never required */
    }
  }
}

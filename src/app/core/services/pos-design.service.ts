import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { CustomizationService } from './customization.service';

/**
 * POS dish-card design templates.
 *
 * Four layouts, each with its own default palette taken from the reference
 * artwork, and each fully re-colourable. A design decides *where* a token is
 * used; the tokens themselves are the only thing the user edits, which is why
 * every design declares which of them it actually reads — a design never shows
 * a colour picker that changes nothing.
 */

export type PosDesignKey = 'neon' | 'diagonal' | 'arch' | 'split';

export interface PosDesignTokens {
  /** POS page background behind the cards. */
  bgApp: string;
  /** Card surface. */
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  bodyColor: string;
  priceColor: string;
  priceBg: string;
  buttonBg: string;
  buttonColor: string;
  /** Ring/glow on hover and on the selected category. */
  highlight: string;
  /** Category rail and section chrome. */
  navBg: string;
  navColor: string;
  /** Rotated across the grid, three-up, the way the reference art does. */
  accent1: string;
  accent2: string;
  accent3: string;

  /* ── Sizing. Per design, not global: the arch needs a taller photo band
     than the diagonal split, and a shared number would compromise both. ── */
  /** Height of the dish photo band. */
  mediaHeight: string;
  /** Padding inside the lower panel. */
  bodyPadding: string;
  /** Card corner radius. */
  cardRadius: string;
  /** Gap between cards in the grid. */
  cardGap: string;
  /** Vertical padding on the action button. */
  ctaHeight: string;
}

export type PosTokenKey = keyof PosDesignTokens;

export interface PosTokenMeta {
  key: PosTokenKey;
  label: string;
  group: 'Surface' | 'Text' | 'Price' | 'Button' | 'Accents' | 'Navigation' | 'Sizing';
  /** Colours get a swatch; sizes get a slider and a number box. */
  kind?: 'color' | 'size';
  /** Slider bounds, in rem, for size tokens. */
  min?: number;
  max?: number;
  step?: number;
}

/** Every token, in the order the editor shows them. */
export const POS_TOKEN_META: PosTokenMeta[] = [
  { key: 'bgApp', label: 'Page Background', group: 'Surface' },
  { key: 'cardBg', label: 'Card Background', group: 'Surface' },
  { key: 'cardBorder', label: 'Card Border', group: 'Surface' },
  { key: 'titleColor', label: 'Dish Name', group: 'Text' },
  { key: 'bodyColor', label: 'Secondary Text', group: 'Text' },
  { key: 'priceColor', label: 'Price Text', group: 'Price' },
  { key: 'priceBg', label: 'Price Background', group: 'Price' },
  { key: 'buttonBg', label: 'Button Background', group: 'Button' },
  { key: 'buttonColor', label: 'Button Text', group: 'Button' },
  { key: 'highlight', label: 'Hover / Selected Highlight', group: 'Accents' },
  { key: 'accent1', label: 'Accent 1', group: 'Accents' },
  { key: 'accent2', label: 'Accent 2', group: 'Accents' },
  { key: 'accent3', label: 'Accent 3', group: 'Accents' },
  { key: 'navBg', label: 'Category Rail Background', group: 'Navigation' },
  { key: 'navColor', label: 'Category Rail Text', group: 'Navigation' },
  { key: 'mediaHeight', label: 'Photo Height', group: 'Sizing', kind: 'size', min: 5, max: 18, step: 0.5 },
  { key: 'bodyPadding', label: 'Panel Padding', group: 'Sizing', kind: 'size', min: 0.2, max: 2.5, step: 0.1 },
  { key: 'cardRadius', label: 'Corner Radius', group: 'Sizing', kind: 'size', min: 0, max: 2.5, step: 0.1 },
  { key: 'cardGap', label: 'Gap Between Cards', group: 'Sizing', kind: 'size', min: 0.25, max: 3, step: 0.25 },
  { key: 'ctaHeight', label: 'Button Height', group: 'Sizing', kind: 'size', min: 0.2, max: 1.4, step: 0.05 },
];

export interface PosDesign {
  key: PosDesignKey;
  name: string;
  blurb: string;
  /** Tokens this design reads. Anything omitted is hidden from the editor. */
  uses: PosTokenKey[];
  defaults: PosDesignTokens;
}

/** Tokens shared by every design, so a definition only states its own palette. */
const ALL: PosTokenKey[] = POS_TOKEN_META.map((t) => t.key);

export const POS_DESIGNS: PosDesign[] = [
  {
    key: 'neon',
    name: 'Neon Spotlight',
    blurb: 'Dark cards with a glow behind the dish, an accent rule and a pill action button.',
    uses: ALL,
    defaults: {
      bgApp: '#2F2F35',
      cardBg: '#17171B',
      cardBorder: '#2E2E36',
      titleColor: '#FFFFFF',
      bodyColor: '#9CA3AF',
      priceColor: '#FFFFFF',
      priceBg: '#2563EB',
      buttonBg: '#2563EB',
      buttonColor: '#FFFFFF',
      highlight: '#3B82F6',
      navBg: '#101014',
      navColor: '#E5E7EB',
      accent1: '#3B82F6',
      accent2: '#D946EF',
      accent3: '#F97316',
      mediaHeight: '9.5rem',
      bodyPadding: '0.85rem',
      cardRadius: '1rem',
      cardGap: '1.25rem',
      ctaHeight: '0.5rem',
    },
  },
  {
    key: 'diagonal',
    name: 'Diagonal Split',
    blurb: 'A bold angled colour block behind a dotted grid, with the price set large on top.',
    uses: ALL,
    defaults: {
      bgApp: '#E8EAEC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E5E9',
      titleColor: '#0F172A',
      bodyColor: '#6B7280',
      priceColor: '#FFFFFF',
      priceBg: 'transparent',
      buttonBg: '#111827',
      buttonColor: '#FFFFFF',
      highlight: '#7C3AED',
      navBg: '#FFFFFF',
      navColor: '#0F172A',
      accent1: '#2DD4A7',
      accent2: '#7C3AED',
      accent3: '#F97316',
      mediaHeight: '10.5rem',
      bodyPadding: '1rem',
      cardRadius: '1.25rem',
      cardGap: '1.25rem',
      ctaHeight: '0.5rem',
    },
  },
  {
    key: 'arch',
    name: 'Colour Arch',
    blurb: 'A rounded colour arch behind the dish, a NEW flag and the price in a soft pill.',
    uses: ALL,
    defaults: {
      bgApp: '#EDE9FE',
      cardBg: '#FFFFFF',
      cardBorder: '#E9D5FF',
      titleColor: '#1F2937',
      bodyColor: '#6B7280',
      priceColor: '#FFFFFF',
      priceBg: '#7C3AED',
      buttonBg: '#7C3AED',
      buttonColor: '#FFFFFF',
      highlight: '#A855F7',
      navBg: '#FFFFFF',
      navColor: '#3B0764',
      accent1: '#6D28D9',
      accent2: '#EC4899',
      accent3: '#F5B301',
      mediaHeight: '11.5rem',
      bodyPadding: '1.1rem',
      cardRadius: '1.125rem',
      cardGap: '1.25rem',
      ctaHeight: '0.5rem',
    },
  },
  {
    key: 'split',
    name: 'Half Colour',
    blurb: 'A pale top with a circle backdrop over a solid colour base and an outline button.',
    uses: ALL,
    defaults: {
      bgApp: '#EFE9FB',
      cardBg: '#FFFFFF',
      cardBorder: '#E7E3F5',
      titleColor: '#111827',
      bodyColor: '#FFFFFF',
      priceColor: '#FFFFFF',
      priceBg: 'transparent',
      buttonBg: '#FFFFFF',
      buttonColor: '#1F2937',
      highlight: '#7C3AED',
      navBg: '#FFFFFF',
      navColor: '#1F2937',
      accent1: '#6D28D9',
      accent2: '#EC4899',
      accent3: '#F5B301',
      mediaHeight: '11rem',
      bodyPadding: '1.1rem',
      cardRadius: '0.75rem',
      cardGap: '1.25rem',
      ctaHeight: '0.42rem',
    },
  },
];

export const DEFAULT_POS_DESIGN: PosDesignKey = 'neon';

/** Shape persisted under the `system_pos_design` setting. */
interface StoredPosDesign {
  designKey: PosDesignKey;
  /** Only the tokens the user actually changed, per design. */
  overrides: Partial<Record<PosDesignKey, Partial<PosDesignTokens>>>;
  /** Dish cards per row on a desktop till. */
  cardsPerRow: number;
}

/** Density is a layout preference, not part of any design's palette, so it is
 *  one global value rather than a per-design override — switching design keeps
 *  whatever the till was set to. */
export const CARDS_PER_ROW_MIN = 2;
export const CARDS_PER_ROW_MAX = 8;
export const CARDS_PER_ROW_DEFAULT = 4;

@Injectable({ providedIn: 'root' })
export class PosDesignService {
  private settingsService = inject(SettingsService);
  private customization = inject(CustomizationService);

  /** Whether Settings -> POS Customization has this page switched on. */
  public readonly customizationEnabled = this.customization.posCustomize;

  private readonly designKeySignal = signal<PosDesignKey>(DEFAULT_POS_DESIGN);
  private readonly overridesSignal = signal<StoredPosDesign['overrides']>({});
  private readonly cardsPerRowSignal = signal<number>(CARDS_PER_ROW_DEFAULT);

  public readonly activeKey = this.designKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  public readonly cardsPerRow = this.cardsPerRowSignal.asReadonly();

  public readonly designs = POS_DESIGNS;
  public readonly tokenMeta = POS_TOKEN_META;

  /** The active design's definition. */
  public readonly activeDesign = computed<PosDesign>(
    () => POS_DESIGNS.find((d) => d.key === this.designKeySignal()) || POS_DESIGNS[0]
  );

  /** Defaults with the user's overrides applied — the design being edited. */
  public readonly activeTokens = computed<PosDesignTokens>(() =>
    this.tokensFor(this.designKeySignal())
  );

  /**
   * The class the till carries, or '' while customization is off. With no
   * design class the POS falls back to its own base styles — the existing
   * default interface — and nothing about the saved design is consulted.
   */
  public readonly rootClass = computed<string>(() =>
    this.customizationEnabled() ? 'pos-design-' + this.designKeySignal() : ''
  );

  /** Variables for the till root; none while customization is off. */
  public readonly pageCssVars = computed<Record<string, string>>(() =>
    this.customizationEnabled() ? this.cssVars() : {}
  );

  constructor() {
    // A failure must not escape the injector; the built-in defaults stand in.
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  /** Resolved tokens for any design, not just the active one (used by previews). */
  public tokensFor(key: PosDesignKey): PosDesignTokens {
    const design = POS_DESIGNS.find((d) => d.key === key) || POS_DESIGNS[0];
    return { ...design.defaults, ...(this.overridesSignal()[key] || {}) };
  }

  public defaultsFor(key: PosDesignKey): PosDesignTokens {
    const design = POS_DESIGNS.find((d) => d.key === key) || POS_DESIGNS[0];
    return { ...design.defaults };
  }

  /** Tokens as CSS custom properties, for binding to [style] on the POS root. */
  public cssVars(key?: PosDesignKey): Record<string, string> {
    const tokens = key ? this.tokensFor(key) : this.activeTokens();
    const vars: Record<string, string> = {};
    for (const [name, value] of Object.entries(tokens)) {
      // bgApp -> --pos-bg-app
      vars[`--pos-${name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`] = value;
    }
    vars['--pos-cards-per-row'] = String(this.cardsPerRowSignal());
    return vars;
  }

  /** Numeric part of a size token, for the slider and the number box. */
  public sizeValue(key: PosDesignKey, token: PosTokenKey): number {
    return parseFloat(String(this.tokensFor(key)[token])) || 0;
  }

  /** Writes a size token back with its unit, clamped to the meta bounds. */
  public setSize(key: PosDesignKey, token: PosTokenKey, value: number | string): void {
    const meta = POS_TOKEN_META.find((m) => m.key === token);
    let n = Number(value);
    if (!Number.isFinite(n)) return;
    if (meta?.min !== undefined) n = Math.max(meta.min, n);
    if (meta?.max !== undefined) n = Math.min(meta.max, n);
    this.setToken(key, token, `${n}rem`);
  }

  public selectDesign(key: PosDesignKey): void {
    this.designKeySignal.set(key);
  }

  /** Clamped, because the number input accepts anything typed into it. */
  public setCardsPerRow(value: number | string): void {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    this.cardsPerRowSignal.set(Math.min(CARDS_PER_ROW_MAX, Math.max(CARDS_PER_ROW_MIN, n)));
  }

  public setToken(key: PosDesignKey, token: PosTokenKey, value: string): void {
    this.overridesSignal.update((all) => ({
      ...all,
      [key]: { ...(all[key] || {}), [token]: value },
    }));
  }

  /** Drops every override for one design, returning it to the reference palette. */
  public resetDesign(key: PosDesignKey): void {
    this.overridesSignal.update((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
  }

  /** Payload for the settings save, matching how the other tabs store theirs. */
  public toPayload(): Record<string, string> {
    const stored: StoredPosDesign = {
      designKey: this.designKeySignal(),
      overrides: this.overridesSignal(),
      cardsPerRow: this.cardsPerRowSignal(),
    };
    return { system_pos_design: JSON.stringify(stored) };
  }

  /** Reads the saved design back out of the settings map. */
  public hydrate(): void {
    const raw =
      this.settingsService.settingsMap()['system_pos_design'] ||
      this.settingsService.settingsMap()['SYSTEM_POS_DESIGN'];
    if (!raw) return;

    try {
      const parsed: Partial<StoredPosDesign> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as any);

      if (parsed?.designKey && POS_DESIGNS.some((d) => d.key === parsed.designKey)) {
        this.designKeySignal.set(parsed.designKey);
      }
      if (parsed?.overrides && typeof parsed.overrides === 'object') {
        this.overridesSignal.set(parsed.overrides);
      }
      if (parsed?.cardsPerRow !== undefined) {
        this.setCardsPerRow(parsed.cardsPerRow);
      }
    } catch (_) {
      // A malformed blob is ignored rather than allowed to break the POS.
    }
  }
}

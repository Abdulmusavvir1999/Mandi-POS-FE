import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Designs for the Products & Menu Catalog page.
 *
 * This is a separate setting from PosDesignService, which skins the POS
 * billing cards: the two drive different pages and share no state.
 *
 * Five designs ship: the bento showcase from the reference artwork, the menu
 * table, and three current-trend treatments (frosted glass, neo-brutalist and
 * editorial minimal). Each carries its own palette and each declares which
 * tokens it reads, so the editor never offers a colour that changes nothing.
 *
 * Menu Table is the one that keeps the catalog's existing data table and only
 * recolours it — a card grid cannot carry selection, SKU, status and the stock
 * bar at once, so replacing the table would lose all four.
 */

export type DishLayoutKey = 'showcase' | 'table' | 'glass' | 'brutal' | 'editorial';

export interface DishLayoutTokens {
  /** Page background behind the dishes. */
  bgApp: string;
  /** Tile / row / card surface. */
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  bodyColor: string;
  priceColor: string;
  priceBg: string;
  buttonBg: string;
  buttonColor: string;
  /** Ring/glow on hover and on the row under the pointer. */
  highlight: string;
  /** Rotated across the grid, four-up, the way the reference art does. */
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  /** Table chrome only. */
  headBg: string;
  headColor: string;
  rowAltBg: string;
}

export type DishTokenKey = keyof DishLayoutTokens;

export type DishTokenGroup = 'Surface' | 'Text' | 'Price' | 'Button' | 'Accents' | 'Table';

export interface DishTokenMeta {
  key: DishTokenKey;
  label: string;
  group: DishTokenGroup;
}

/** Every token, in the order the editor shows them. */
export const DISH_TOKEN_META: DishTokenMeta[] = [
  { key: 'bgApp', label: 'Page Background', group: 'Surface' },
  { key: 'cardBg', label: 'Tile / Row Background', group: 'Surface' },
  { key: 'cardBorder', label: 'Tile / Row Border', group: 'Surface' },
  { key: 'titleColor', label: 'Dish Name', group: 'Text' },
  { key: 'bodyColor', label: 'Secondary Text', group: 'Text' },
  { key: 'priceColor', label: 'Price Text', group: 'Price' },
  { key: 'priceBg', label: 'Price Background', group: 'Price' },
  { key: 'buttonBg', label: 'Button Background', group: 'Button' },
  { key: 'buttonColor', label: 'Button Text', group: 'Button' },
  { key: 'highlight', label: 'Hover Highlight', group: 'Accents' },
  { key: 'accent1', label: 'Accent 1', group: 'Accents' },
  { key: 'accent2', label: 'Accent 2', group: 'Accents' },
  { key: 'accent3', label: 'Accent 3', group: 'Accents' },
  { key: 'accent4', label: 'Accent 4', group: 'Accents' },
  { key: 'headBg', label: 'Header Row Background', group: 'Table' },
  { key: 'headColor', label: 'Header Row Text', group: 'Table' },
  { key: 'rowAltBg', label: 'Striped Row Background', group: 'Table' },
];

export const DISH_TOKEN_GROUPS: DishTokenGroup[] = [
  'Surface',
  'Text',
  'Price',
  'Button',
  'Accents',
  'Table',
];

export interface DishLayout {
  key: DishLayoutKey;
  name: string;
  blurb: string;
  /** Material icon shown on the chooser card. */
  icon: string;
  /** Tokens this design reads. Anything omitted is hidden from the editor. */
  uses: DishTokenKey[];
  /** False for designs whose density is fixed, e.g. the single-column table. */
  usesColumns: boolean;
  defaults: DishLayoutTokens;
}

const ALL_TOKENS: DishTokenKey[] = DISH_TOKEN_META.map((t) => t.key);

/** Everything except the table-only chrome, which the other designs never draw. */
const CARD_TOKENS: DishTokenKey[] = ALL_TOKENS.filter(
  (k) => k !== 'headBg' && k !== 'headColor' && k !== 'rowAltBg'
);

const without = (base: DishTokenKey[], ...drop: DishTokenKey[]): DishTokenKey[] =>
  base.filter((k) => !drop.includes(k));

export const DISH_LAYOUTS: DishLayout[] = [
  {
    key: 'showcase',
    name: 'Bento Showcase',
    blurb:
      'Colour-filled bento tiles with the first dish featured double-wide, the photo floating and a white pill action.',
    icon: 'dashboard',
    uses: without(CARD_TOKENS, 'cardBg', 'cardBorder'),
    usesColumns: true,
    defaults: {
      bgApp: '#22232B',
      cardBg: '#2A2B33',
      cardBorder: '#33343D',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      priceColor: '#FFFFFF',
      priceBg: '#191A20',
      buttonBg: '#FFFFFF',
      buttonColor: '#1F2430',
      highlight: '#F26B1D',
      accent1: '#F26B1D',
      accent2: '#EC4B8B',
      accent3: '#4FB3A4',
      accent4: '#6BA3DE',
      headBg: '#101014',
      headColor: '#E5E7EB',
      rowAltBg: '#26272F',
    },
  },
  {
    key: 'table',
    name: 'Menu Table',
    blurb:
      'Keeps the catalog data table — selection, SKU, status, stock bar and row actions — and recolours it to your palette.',
    icon: 'table_rows',
    uses: ALL_TOKENS,
    usesColumns: false,
    defaults: {
      bgApp: '#F6F7F9',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E8EC',
      titleColor: '#0F172A',
      bodyColor: '#6B7280',
      priceColor: '#0F172A',
      priceBg: 'transparent',
      buttonBg: '#111827',
      buttonColor: '#FFFFFF',
      highlight: '#2563EB',
      accent1: '#2563EB',
      accent2: '#0D9488',
      accent3: '#F59E0B',
      accent4: '#7C3AED',
      headBg: '#0F172A',
      headColor: '#E5E7EB',
      rowAltBg: '#FAFBFC',
    },
  },
  {
    key: 'glass',
    name: 'Liquid Glass',
    blurb:
      'Frosted translucent cards with a specular sheen over a colour-washed backdrop, in the current glass idiom.',
    icon: 'blur_on',
    uses: CARD_TOKENS,
    usesColumns: true,
    defaults: {
      bgApp: '#0B1020',
      cardBg: '#1B2340',
      cardBorder: '#8FA0D0',
      titleColor: '#F8FAFC',
      bodyColor: '#AEB9D4',
      priceColor: '#FFFFFF',
      priceBg: '#6366F1',
      buttonBg: '#FFFFFF',
      buttonColor: '#0B1020',
      highlight: '#818CF8',
      accent1: '#6366F1',
      accent2: '#22D3EE',
      accent3: '#F472B6',
      accent4: '#A78BFA',
      headBg: '#101733',
      headColor: '#E2E8F7',
      rowAltBg: '#161E38',
    },
  },
  {
    key: 'brutal',
    name: 'Neo Brutalist',
    blurb:
      'Hard black outlines, offset block shadows and flat colour panels. The card presses into its shadow on hover.',
    icon: 'crop_square',
    uses: CARD_TOKENS,
    usesColumns: true,
    defaults: {
      bgApp: '#FFF3D6',
      cardBg: '#FFFFFF',
      cardBorder: '#111111',
      titleColor: '#111111',
      bodyColor: '#44403C',
      priceColor: '#FFFFFF',
      priceBg: '#111111',
      buttonBg: '#111111',
      buttonColor: '#FFFFFF',
      highlight: '#111111',
      accent1: '#FFD43B',
      accent2: '#4DABF7',
      accent3: '#FF8787',
      accent4: '#69DB7C',
      headBg: '#111111',
      headColor: '#FFFFFF',
      rowAltBg: '#FFFBEF',
    },
  },
  {
    key: 'editorial',
    name: 'Editorial Minimal',
    blurb:
      'Paper background, hairline rules, oversized numerals and a quiet brass accent. No boxes, all whitespace.',
    icon: 'article',
    uses: without(CARD_TOKENS, 'priceBg', 'buttonBg'),
    usesColumns: true,
    defaults: {
      bgApp: '#FAF9F6',
      cardBg: '#FFFFFF',
      cardBorder: '#E7E4DD',
      titleColor: '#17150F',
      bodyColor: '#6E6A60',
      priceColor: '#17150F',
      priceBg: 'transparent',
      buttonBg: '#17150F',
      // The action is an underlined word on paper, not a filled button, so the
      // button *text* has to be the ink colour rather than the paper one.
      buttonColor: '#17150F',
      highlight: '#B08B57',
      accent1: '#B08B57',
      accent2: '#7A6A55',
      accent3: '#4A5D4E',
      accent4: '#8C5A4A',
      headBg: '#17150F',
      headColor: '#FAF9F6',
      rowAltBg: '#F5F3EE',
    },
  },
];

export const DEFAULT_DISH_LAYOUT: DishLayoutKey = 'showcase';

export const DISH_COLUMNS_MIN = 2;
export const DISH_COLUMNS_MAX = 6;
export const DISH_COLUMNS_DEFAULT = 4;

/** Shape persisted under the `system_dish_layout` setting. */
interface StoredDishLayout {
  layoutKey: DishLayoutKey;
  /** Only the tokens the user actually changed, per design. */
  overrides: Partial<Record<DishLayoutKey, Partial<DishLayoutTokens>>>;
  /** Tiles per row on a desktop screen. */
  columnsPerRow: number;
  /** Whether this setting drives the catalog listing at all. */
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class DishLayoutService {
  private settingsService = inject(SettingsService);

  private readonly layoutKeySignal = signal<DishLayoutKey>(DEFAULT_DISH_LAYOUT);
  private readonly overridesSignal = signal<StoredDishLayout['overrides']>({});
  private readonly columnsSignal = signal<number>(DISH_COLUMNS_DEFAULT);
  private readonly enabledSignal = signal<boolean>(false);

  public readonly activeKey = this.layoutKeySignal.asReadonly();
  public readonly overrides = this.overridesSignal.asReadonly();
  public readonly columnsPerRow = this.columnsSignal.asReadonly();
  /** Off until a design is picked, so an upgraded install keeps its table. */
  public readonly enabled = this.enabledSignal.asReadonly();

  public readonly layouts = DISH_LAYOUTS;
  public readonly tokenMeta = DISH_TOKEN_META;
  public readonly tokenGroups = DISH_TOKEN_GROUPS;

  public readonly activeLayout = computed<DishLayout>(
    () => DISH_LAYOUTS.find((l) => l.key === this.layoutKeySignal()) || DISH_LAYOUTS[0]
  );

  /** Defaults with the user overrides applied — what the POS actually renders. */
  public readonly activeTokens = computed<DishLayoutTokens>(() =>
    this.tokensFor(this.layoutKeySignal())
  );

  /** The class the POS root carries, or '' while this setting is off. */
  public readonly rootClass = computed<string>(() =>
    this.enabledSignal() ? 'dish-layout-' + this.layoutKeySignal() : ''
  );

  constructor() {
    // A failure must not escape the injector; the built-in defaults stand in.
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  public layoutFor(key: DishLayoutKey): DishLayout {
    return DISH_LAYOUTS.find((l) => l.key === key) || DISH_LAYOUTS[0];
  }

  /** Resolved tokens for any design, not just the active one (used by previews). */
  public tokensFor(key: DishLayoutKey): DishLayoutTokens {
    return { ...this.layoutFor(key).defaults, ...(this.overridesSignal()[key] || {}) };
  }

  public defaultsFor(key: DishLayoutKey): DishLayoutTokens {
    return { ...this.layoutFor(key).defaults };
  }

  /**
   * Tokens as CSS custom properties, for binding to [style] on the POS root.
   * The `--dl-` prefix keeps them clear of the card design `--pos-` set, so
   * both settings can put their variables on the same element.
   */
  public cssVars(key?: DishLayoutKey): Record<string, string> {
    const tokens = key ? this.tokensFor(key) : this.activeTokens();
    const vars: Record<string, string> = {};
    for (const [name, value] of Object.entries(tokens)) {
      // bgApp -> --dl-bg-app
      vars['--dl-' + name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())] = value;
    }
    vars['--dl-columns'] = String(this.columnsSignal());
    return vars;
  }

  public selectLayout(key: DishLayoutKey): void {
    this.layoutKeySignal.set(key);
    // Picking a design is how the setting is switched on — a chooser that
    // silently changed nothing would be a trap.
    this.enabledSignal.set(true);
  }

  public setEnabled(value: boolean): void {
    this.enabledSignal.set(value);
  }

  /** Clamped, because the number input accepts anything typed into it. */
  public setColumnsPerRow(value: number | string): void {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    this.columnsSignal.set(Math.min(DISH_COLUMNS_MAX, Math.max(DISH_COLUMNS_MIN, n)));
  }

  public setToken(key: DishLayoutKey, token: DishTokenKey, value: string): void {
    this.overridesSignal.update((all) => ({
      ...all,
      [key]: { ...(all[key] || {}), [token]: value },
    }));
  }

  /** Drops every override for one design, returning it to its reference palette. */
  public resetLayout(key: DishLayoutKey): void {
    this.overridesSignal.update((all) => {
      const next = { ...all };
      delete next[key];
      return next;
    });
  }

  /** Payload for the settings save, matching how the other tabs store theirs. */
  public toPayload(): Record<string, string> {
    const stored: StoredDishLayout = {
      layoutKey: this.layoutKeySignal(),
      overrides: this.overridesSignal(),
      columnsPerRow: this.columnsSignal(),
      enabled: this.enabledSignal(),
    };
    return { system_dish_layout: JSON.stringify(stored) };
  }

  /** Reads the saved design back out of the settings map. */
  public hydrate(): void {
    const raw =
      this.settingsService.settingsMap()['system_dish_layout'] ||
      this.settingsService.settingsMap()['SYSTEM_DISH_LAYOUT'];
    if (!raw) return;

    try {
      const parsed: Partial<StoredDishLayout> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as any);

      if (parsed?.layoutKey && DISH_LAYOUTS.some((l) => l.key === parsed.layoutKey)) {
        this.layoutKeySignal.set(parsed.layoutKey);
      }
      if (parsed?.overrides && typeof parsed.overrides === 'object') {
        this.overridesSignal.set(parsed.overrides);
      }
      if (parsed?.columnsPerRow !== undefined) {
        this.setColumnsPerRow(parsed.columnsPerRow);
      }
      if (parsed?.enabled !== undefined) {
        this.enabledSignal.set(parsed.enabled === true || String(parsed.enabled) === 'true');
      }
    } catch (_) {
      // A malformed blob is ignored rather than allowed to break the POS.
    }
  }
}

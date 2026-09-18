import { Injectable, computed, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Master on/off switches for the eight page customizations.
 *
 * Each design service (PosDesignService, DishLayoutService, …) owns *what* its
 * page looks like when customization is on. This service owns only *whether*
 * that saved design is applied at all, and nothing else — it never reads or
 * writes a design, a palette or an override, so switching a page off leaves its
 * saved customization untouched and switching it back on restores it verbatim.
 *
 * Every flag is independent: they live in one settings row because they are
 * saved together from one screen, not because they affect one another.
 */

export type CustomizationModuleKey =
  | 'posCustomize'
  | 'catalogCustomize'
  | 'diningCustomize'
  | 'categoryCustomize'
  | 'stockLedgerCustomize'
  | 'customerCustomize'
  | 'staffRolesCustomize'
  | 'sidebarTemplateCustomize';

export type CustomizationFlags = Record<CustomizationModuleKey, boolean>;

export interface CustomizationModule {
  key: CustomizationModuleKey;
  /** Page name, matching the tab that configures it. */
  name: string;
  description: string;
  /** Material symbol shown on the row, matching the configure tab's icon. */
  icon: string;
  /** Settings tab this row's Configure button opens. */
  tab: string;
  /** What the page renders while the toggle is off. */
  defaultBlurb: string;
}

/** The rows of the customization settings list, in the order they are shown. */
export const CUSTOMIZATION_MODULES: CustomizationModule[] = [
  {
    key: 'posCustomize',
    name: 'POS Customize',
    description: 'Customize the main POS billing interface and dish cards.',
    icon: 'dashboard_customize',
    tab: 'posdesign',
    defaultBlurb: 'Off — the POS till keeps the original system interface.',
  },
  {
    key: 'catalogCustomize',
    name: 'Catalog Page Design',
    description: 'Customize the POS catalog page layout and appearance.',
    icon: 'view_quilt',
    tab: 'dishpage',
    defaultBlurb: 'Off — the catalog keeps the original products table.',
  },
  {
    key: 'diningCustomize',
    name: 'Dining Customize',
    description: 'Customize the dining floor plan and table cards.',
    icon: 'table_restaurant',
    tab: 'dining',
    defaultBlurb: 'Off — dining shows its built-in Card List View.',
  },
  {
    key: 'categoryCustomize',
    name: 'Category Customize',
    description: 'Customize the menu category listing.',
    icon: 'category',
    tab: 'categorydesign',
    defaultBlurb: 'Off — categories show their built-in Card View.',
  },
  {
    key: 'stockLedgerCustomize',
    name: 'Stock Ledger Customize',
    description: 'Customize the stock ledger and inventory display.',
    icon: 'warehouse',
    tab: 'stockdesign',
    defaultBlurb: 'Off — the stock ledger shows its built-in Card View.',
  },
  {
    key: 'customerCustomize',
    name: 'Customer Customize',
    description: 'Customize the customer directory display.',
    icon: 'badge',
    tab: 'customerdesign',
    defaultBlurb: 'Off — the directory shows its built-in Card View.',
  },
  {
    key: 'staffRolesCustomize',
    name: 'Staff & Roles Customize',
    description: 'Customize the staff accounts and roles display.',
    icon: 'admin_panel_settings',
    tab: 'staffdesign',
    defaultBlurb: 'Off — staff accounts show their built-in List View (no card design ships for this page).',
  },
  {
    key: 'sidebarTemplateCustomize',
    name: 'Sidebar Template',
    description: 'Customize the application sidebar rail. Appearance only — menus and permissions never change.',
    icon: 'left_panel_open',
    tab: 'sidebardesign',
    defaultBlurb: 'Off — the app keeps the original system sidebar.',
  },
];

export const CUSTOMIZATION_SETTING_KEY = 'system_customization';

/**
 * What each flag means for an install that has never seen this screen: exactly
 * what that page already did, so upgrading changes nothing on its own.
 *
 * Every page but the catalog always applied its design, hence `true`; the
 * catalog shipped its switch off by default, so it stays off.
 */
const FALLBACK_FLAGS: CustomizationFlags = {
  posCustomize: true,
  catalogCustomize: false,
  diningCustomize: true,
  categoryCustomize: true,
  stockLedgerCustomize: true,
  customerCustomize: true,
  staffRolesCustomize: true,
  sidebarTemplateCustomize: true,
};

/**
 * Design blobs that carried their own `enabled` flag before this screen existed.
 * They are read once, as the migration source, and never written back to.
 */
const LEGACY_ENABLED_SOURCES: Partial<Record<CustomizationModuleKey, string>> = {
  catalogCustomize: 'system_dish_layout',
  diningCustomize: 'system_dining_layout',
  categoryCustomize: 'system_category_layout',
  customerCustomize: 'system_customer_layout',
};

@Injectable({ providedIn: 'root' })
export class CustomizationService {
  private settingsService = inject(SettingsService);

  private readonly flagsSignal = signal<CustomizationFlags>({ ...FALLBACK_FLAGS });

  public readonly flags = this.flagsSignal.asReadonly();
  public readonly modules = CUSTOMIZATION_MODULES;

  /** One computed per module, so a page depends on its own flag and no other. */
  public readonly posCustomize = computed(() => this.flagsSignal().posCustomize);
  public readonly catalogCustomize = computed(() => this.flagsSignal().catalogCustomize);
  public readonly diningCustomize = computed(() => this.flagsSignal().diningCustomize);
  public readonly categoryCustomize = computed(() => this.flagsSignal().categoryCustomize);
  public readonly stockLedgerCustomize = computed(() => this.flagsSignal().stockLedgerCustomize);
  public readonly customerCustomize = computed(() => this.flagsSignal().customerCustomize);
  public readonly staffRolesCustomize = computed(() => this.flagsSignal().staffRolesCustomize);
  public readonly sidebarTemplateCustomize = computed(
    () => this.flagsSignal().sidebarTemplateCustomize
  );

  constructor() {
    // A failure must not escape the injector: the fallback flags stand in, and
    // every page renders exactly as it did before this screen existed.
    this.settingsService.loadPublicSettings().subscribe({
      next: () => this.hydrate(),
      error: () => {},
    });
  }

  public isEnabled(key: CustomizationModuleKey): boolean {
    return this.flagsSignal()[key] === true;
  }

  /** Flips one flag. The other seven are copied through untouched. */
  public setEnabled(key: CustomizationModuleKey, value: boolean): void {
    this.flagsSignal.update((flags) => ({ ...flags, [key]: value === true }));
  }

  /**
   * Sets all eight at once, for the master switch on the settings screen.
   *
   * This is a convenience over the same eight independent flags, not a global
   * setting of its own: nothing reads a combined value, and each page can be
   * changed on its own again straight afterwards.
   */
  public setAll(value: boolean): void {
    const next = {} as CustomizationFlags;
    for (const module of CUSTOMIZATION_MODULES) next[module.key] = value === true;
    this.flagsSignal.set(next);
  }

  /** A copy for the caller to hold while a save is in flight. */
  public snapshot(): CustomizationFlags {
    return { ...this.flagsSignal() };
  }

  /** Puts a snapshot back, for when a save is rejected. */
  public restore(flags: CustomizationFlags): void {
    this.flagsSignal.set({ ...flags });
  }

  /** Payload for the settings save, matching how the other tabs store theirs. */
  public toPayload(): Record<string, string> {
    return { [CUSTOMIZATION_SETTING_KEY]: JSON.stringify(this.flagsSignal()) };
  }

  /**
   * Reads the flags back out of the settings map.
   *
   * A key the stored blob does not carry falls back to the `enabled` flag in
   * that module's own design blob, and then to the module's historical
   * behaviour — so an install that predates this screen keeps its appearance
   * and an install saved by an older build keeps the switches it had.
   */
  public hydrate(): void {
    const map = this.settingsService.settingsMap();
    const stored = this.parse(map[CUSTOMIZATION_SETTING_KEY] || map['SYSTEM_CUSTOMIZATION']);

    const next: CustomizationFlags = { ...FALLBACK_FLAGS };
    for (const module of CUSTOMIZATION_MODULES) {
      const saved = stored?.[module.key];
      if (saved !== undefined) {
        next[module.key] = saved === true || String(saved) === 'true';
        continue;
      }

      const legacy = this.readLegacyEnabled(map, module.key);
      if (legacy !== null) next[module.key] = legacy;
    }

    this.flagsSignal.set(next);
  }

  /** The `enabled` member of a design blob, or null when there is not one. */
  private readLegacyEnabled(
    map: Record<string, string>,
    key: CustomizationModuleKey
  ): boolean | null {
    const settingKey = LEGACY_ENABLED_SOURCES[key];
    if (!settingKey) return null;

    const parsed = this.parse(map[settingKey] || map[settingKey.toUpperCase()]);
    if (!parsed || parsed['enabled'] === undefined) return null;
    return parsed['enabled'] === true || String(parsed['enabled']) === 'true';
  }

  /** A malformed blob is ignored rather than allowed to break the app. */
  private parse(raw: unknown): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch (_) {
      return null;
    }
  }
}

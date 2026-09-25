import { Injectable, signal, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  primary: string;
  primaryHover: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveAccent: string;
  bgApp: string;
  cardBg: string;
  cardBorder: string;
  textMain: string;
  success: string;
  danger: string;
  warning: string;
}

export const DEFAULT_LIGHT_PALETTES: Record<string, { name: string; icon: string; palette: ThemePalette }> = {
  purple: {
    name: 'Royal Purple (Brand)',
    icon: '🟪',
    palette: {
      primary: '#7E22CE',
      primaryHover: '#9333EA',
      sidebarBg: '#2E1065',
      sidebarText: '#FAF5FF',
      sidebarActiveAccent: '#C084FC',
      bgApp: '#FAF5FF',
      cardBg: '#FFFFFF',
      cardBorder: '#E9D5FF',
      textMain: '#2E1065',
      success: '#16A34A',
      danger: '#DC2626',
      warning: '#EA580C',
    },
  },
  gold: {
    name: 'Champagne & Imperial Gold',
    icon: '👑',
    palette: {
      primary: '#B4833E',
      primaryHover: '#D4A359',
      sidebarBg: '#1C160C',
      sidebarText: '#FDFCF7',
      sidebarActiveAccent: '#F5C869',
      bgApp: '#FAF8F2',
      cardBg: '#FFFFFF',
      cardBorder: '#EFE7D5',
      textMain: '#2A1F10',
      success: '#15803D',
      danger: '#DC2626',
      warning: '#D97706',
    },
  },
  amber: {
    name: 'Warm Amber & Stone',
    icon: '🟧',
    palette: {
      primary: '#B45309',
      primaryHover: '#D97706',
      sidebarBg: '#1C1917',
      sidebarText: '#F5F5F4',
      sidebarActiveAccent: '#F59E0B',
      bgApp: '#F8F7F4',
      cardBg: '#FFFFFF',
      cardBorder: '#E7E5E4',
      textMain: '#1C1917',
      success: '#15803D',
      danger: '#DC2626',
      warning: '#D97706',
    },
  },
  emerald: {
    name: 'Emerald & Forest Green',
    icon: '🟩',
    palette: {
      primary: '#059669',
      primaryHover: '#10B981',
      sidebarBg: '#064E3B',
      sidebarText: '#ECFDF5',
      sidebarActiveAccent: '#34D399',
      bgApp: '#F0FDF4',
      cardBg: '#FFFFFF',
      cardBorder: '#A7F3D0',
      textMain: '#064E3B',
      success: '#16A34A',
      danger: '#DC2626',
      warning: '#EA580C',
    },
  },
  ocean: {
    name: 'Ocean Sapphire & Slate',
    icon: '🟦',
    palette: {
      primary: '#2563EB',
      primaryHover: '#3B82F6',
      sidebarBg: '#0F172A',
      sidebarText: '#F8FAFC',
      sidebarActiveAccent: '#60A5FA',
      bgApp: '#F0F9FF',
      cardBg: '#FFFFFF',
      cardBorder: '#BAE6FD',
      textMain: '#0F172A',
      success: '#16A34A',
      danger: '#DC2626',
      warning: '#EA580C',
    },
  },
  rose: {
    name: 'Rose & Crimson Luxury',
    icon: '🌹',
    palette: {
      primary: '#E11D48',
      primaryHover: '#F43F5E',
      sidebarBg: '#4C0519',
      sidebarText: '#FFF1F2',
      sidebarActiveAccent: '#FB7185',
      bgApp: '#FFF1F2',
      cardBg: '#FFFFFF',
      cardBorder: '#FECDD3',
      textMain: '#4C0519',
      success: '#16A34A',
      danger: '#DC2626',
      warning: '#EA580C',
    },
  },
};

export const DEFAULT_DARK_PALETTES: Record<string, { name: string; icon: string; palette: ThemePalette }> = {
  midnight: {
    name: 'Midnight Dark Mode',
    icon: '🌑',
    palette: {
      primary: '#8B5CF6',
      primaryHover: '#A78BFA',
      sidebarBg: '#111827',
      sidebarText: '#F9FAFB',
      sidebarActiveAccent: '#A78BFA',
      bgApp: '#0B0F19',
      cardBg: '#1F2937',
      cardBorder: '#374151',
      textMain: '#F9FAFB',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  obsidian: {
    name: 'Obsidian Amber',
    icon: '🔥',
    palette: {
      primary: '#F59E0B',
      primaryHover: '#FBBF24',
      sidebarBg: '#18181B',
      sidebarText: '#FAFAFA',
      sidebarActiveAccent: '#FBBF24',
      bgApp: '#09090B',
      cardBg: '#27272A',
      cardBorder: '#3F3F46',
      textMain: '#FAFAFA',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  emeraldDark: {
    name: 'Emerald Cyber',
    icon: '🌲',
    palette: {
      primary: '#10B981',
      primaryHover: '#34D399',
      sidebarBg: '#06281E',
      sidebarText: '#ECFDF5',
      sidebarActiveAccent: '#34D399',
      bgApp: '#02140F',
      cardBg: '#0C3B2E',
      cardBorder: '#14532D',
      textMain: '#ECFDF5',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  deepOcean: {
    name: 'Abyssal Ocean',
    icon: '🌊',
    palette: {
      primary: '#3B82F6',
      primaryHover: '#60A5FA',
      sidebarBg: '#0F172A',
      sidebarText: '#F8FAFC',
      sidebarActiveAccent: '#60A5FA',
      bgApp: '#020617',
      cardBg: '#1E293B',
      cardBorder: '#334155',
      textMain: '#F8FAFC',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  carbon: {
    name: 'Carbon Monochrome',
    icon: '⚡',
    palette: {
      primary: '#94A3B8',
      primaryHover: '#CBD5E1',
      sidebarBg: '#18181B',
      sidebarText: '#F4F4F5',
      sidebarActiveAccent: '#E4E4E7',
      bgApp: '#09090B',
      cardBg: '#27272A',
      cardBorder: '#3F3F46',
      textMain: '#F4F4F5',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
  rubyDark: {
    name: 'Crimson Ruby',
    icon: '🌹',
    palette: {
      primary: '#E11D48',
      primaryHover: '#FB7185',
      sidebarBg: '#24060E',
      sidebarText: '#FFF1F2',
      sidebarActiveAccent: '#FB7185',
      bgApp: '#120207',
      cardBg: '#2A0A13',
      cardBorder: '#5E1228',
      textMain: '#FFF1F2',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
};

export const DEFAULT_THEME_PALETTES: Record<string, { name: string; icon: string; palette: ThemePalette }> = {
  ...DEFAULT_LIGHT_PALETTES,
  midnight: DEFAULT_DARK_PALETTES['midnight'],
};

/**
 * The brand purple, as every page design shipped its brand slots.
 */
export const BRAND_ACCENT_HEX = '#7E22CE';

/**
 * Point a design's brand-colored slots at the active theme.
 */
export function applyThemeBrand<T extends Record<string, any>>(
  tokens: T,
  stock: T,
  saved: Partial<T>,
  slots: readonly (keyof T)[],
  primary: string
): T {
  if (!primary) return tokens;

  const resolved: T = { ...tokens };
  for (const slot of slots) {
    if (saved[slot] !== undefined) continue;
    const shipped = stock[slot];
    if (typeof shipped === 'string' && shipped.trim().toUpperCase() === BRAND_ACCENT_HEX) {
      resolved[slot] = primary as T[keyof T];
    }
  }
  return resolved;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private settingsService = inject(SettingsService);

  /** Active mode: 'light' | 'dark' */
  public mode = signal<ThemeMode>('light');

  /** Light mode configuration */
  public lightPalette = signal<ThemePalette>(DEFAULT_LIGHT_PALETTES['purple'].palette);
  public lightPresetKey = signal<string>('purple');

  /** Dark mode configuration */
  public darkPalette = signal<ThemePalette>(DEFAULT_DARK_PALETTES['midnight'].palette);
  public darkPresetKey = signal<string>('midnight');

  /** Visibility of the Header Dark Mode Toggle button */
  public darkModeToggleEnabled = signal<boolean>(true);

  /** Active palette based on current mode */
  public currentPalette = computed<ThemePalette>(() =>
    this.mode() === 'dark' ? this.darkPalette() : this.lightPalette()
  );

  /** Active preset key based on current mode */
  public activePresetKey = computed<string>(() =>
    this.mode() === 'dark' ? this.darkPresetKey() : this.lightPresetKey()
  );

  /** Convenience boolean for dark mode */
  public isDarkMode = computed<boolean>(() => this.mode() === 'dark');

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('_pos_ui_theme_palette');
        const storedMode = localStorage.getItem('_pos_active_theme_mode');
        if (storedMode === 'light' || storedMode === 'dark') {
          this.mode.set(storedMode);
        }
      } catch (_) { }
    }
    this.loadInitialTheme();
  }

  public loadInitialTheme(): void {
    // 1. Set baseline default
    this.injectCssVariables(this.currentPalette());

    // 2. Read the palette from the database via the shared public-settings store
    this.settingsService.loadPublicSettings().subscribe({
      next: (settings) => {
        if (settings && Object.keys(settings).length) {
          this.syncFromSettingsMap(settings);
        }
      },
      error: () => { },
    });
  }

  public toggleMode(): void {
    const nextMode: ThemeMode = this.mode() === 'light' ? 'dark' : 'light';
    this.setMode(nextMode);
  }

  public setMode(newMode: ThemeMode): void {
    this.mode.set(newMode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('_pos_active_theme_mode', newMode);
      } catch (_) { }
    }
    this.injectCssVariables(this.currentPalette());
  }

  public setDarkModeToggleEnabled(enabled: boolean): void {
    this.darkModeToggleEnabled.set(enabled);
  }

  public applyPreset(presetKey: string, targetMode?: ThemeMode): void {
    const m = targetMode || this.mode();
    const presets = m === 'dark' ? DEFAULT_DARK_PALETTES : DEFAULT_LIGHT_PALETTES;
    const preset = presets[presetKey] || DEFAULT_THEME_PALETTES[presetKey];
    if (preset) {
      if (m === 'dark') {
        this.darkPresetKey.set(presetKey);
        this.darkPalette.set({
          ...DEFAULT_DARK_PALETTES['midnight'].palette,
          ...preset.palette,
        });
      } else {
        this.lightPresetKey.set(presetKey);
        this.lightPalette.set({
          ...DEFAULT_LIGHT_PALETTES['purple'].palette,
          ...preset.palette,
        });
      }
      this.setMode(m);
    }
  }

  public applyPalette(palette: ThemePalette, targetMode?: ThemeMode): void {
    const m = targetMode || this.mode();
    if (m === 'dark') {
      const safePalette: ThemePalette = {
        ...DEFAULT_DARK_PALETTES['midnight'].palette,
        ...palette,
      };
      this.darkPalette.set(safePalette);
    } else {
      const safePalette: ThemePalette = {
        ...DEFAULT_LIGHT_PALETTES['purple'].palette,
        ...palette,
      };
      this.lightPalette.set(safePalette);
    }

    this.setMode(m);
  }

  public updateSettingColor(key: keyof ThemePalette, colorHex: string, targetMode?: ThemeMode): void {
    const m = targetMode || this.mode();
    if (m === 'dark') {
      this.darkPresetKey.set('custom');
      const updated = {
        ...this.darkPalette(),
        [key]: colorHex,
      };
      this.applyPalette(updated, 'dark');
    } else {
      this.lightPresetKey.set('custom');
      const updated = {
        ...this.lightPalette(),
        [key]: colorHex,
      };
      this.applyPalette(updated, 'light');
    }
  }

  public syncFromSettingsMap(settingsMap: Record<string, string>): void {
    if (!settingsMap) return;

    // Header Dark Mode Toggle setting visibility
    if (settingsMap['DARK_MODE_TOGGLE_ENABLED'] !== undefined) {
      this.darkModeToggleEnabled.set(
        settingsMap['DARK_MODE_TOGGLE_ENABLED'] === 'true' || settingsMap['DARK_MODE_TOGGLE_ENABLED'] === '1'
      );
    } else if (settingsMap['THEME_DARK_MODE_TOGGLE'] !== undefined) {
      this.darkModeToggleEnabled.set(
        settingsMap['THEME_DARK_MODE_TOGGLE'] === 'true' || settingsMap['THEME_DARK_MODE_TOGGLE'] === '1'
      );
    }

    // Saved user mode preference from localStorage takes precedence for display
    let savedUserMode: ThemeMode | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('_pos_active_theme_mode');
        if (stored === 'light' || stored === 'dark') {
          savedUserMode = stored;
        }
      } catch (_) { }
    }

    const rawSystemTheme = settingsMap['system_theme'] || settingsMap['SYSTEM_THEME'];
    if (rawSystemTheme) {
      try {
        const parsed = typeof rawSystemTheme === 'string'
          ? JSON.parse(rawSystemTheme)
          : rawSystemTheme;
        if (parsed && typeof parsed === 'object') {
          if (parsed.darkModeToggleEnabled !== undefined) {
            this.darkModeToggleEnabled.set(Boolean(parsed.darkModeToggleEnabled));
          }

          // Unpack explicit lightTheme
          if (parsed.lightTheme && typeof parsed.lightTheme === 'object') {
            const lKey = parsed.lightTheme.activePresetKey || parsed.lightTheme.theme || 'purple';
            const baseLight = DEFAULT_LIGHT_PALETTES[lKey]?.palette || DEFAULT_LIGHT_PALETTES['purple'].palette;
            this.lightPresetKey.set(lKey);
            this.lightPalette.set({
              ...baseLight,
              ...parsed.lightTheme,
            });
          }

          // Unpack explicit darkTheme
          if (parsed.darkTheme && typeof parsed.darkTheme === 'object') {
            const dKey = parsed.darkTheme.activePresetKey || parsed.darkTheme.theme || 'midnight';
            const baseDark = DEFAULT_DARK_PALETTES[dKey]?.palette || DEFAULT_DARK_PALETTES['midnight'].palette;
            this.darkPresetKey.set(dKey);
            this.darkPalette.set({
              ...baseDark,
              ...parsed.darkTheme,
            });
          }

          // Single palette legacy fallback
          if (!parsed.lightTheme && !parsed.darkTheme) {
            const isDark = this.isDarkColor(parsed.bgApp || parsed.background || '') ||
              this.isDarkColor(parsed.cardBg || parsed.surface || '');
            if (isDark) {
              this.darkPresetKey.set(parsed.activePresetKey || 'custom');
              this.darkPalette.set({
                ...DEFAULT_DARK_PALETTES['midnight'].palette,
                ...parsed,
              });
            } else {
              this.lightPresetKey.set(parsed.activePresetKey || 'custom');
              this.lightPalette.set({
                ...DEFAULT_LIGHT_PALETTES['purple'].palette,
                ...parsed,
              });
            }
          }

          if (savedUserMode) {
            this.mode.set(savedUserMode);
          } else if (parsed.mode === 'light' || parsed.mode === 'dark') {
            this.mode.set(parsed.mode);
          }

          this.injectCssVariables(this.currentPalette());
          this.exportToSettingsMap(settingsMap);
          return;
        }
      } catch (e) {
        console.error('Failed to parse system_theme JSON from database', e);
      }
    }

    // Flat compatibility fallback
    if (settingsMap['THEME_PRIMARY_COLOR'] || settingsMap['primaryColor']) {
      const p: Partial<ThemePalette> = {
        primary: settingsMap['primaryColor'] || settingsMap['THEME_PRIMARY_COLOR'] || this.currentPalette().primary,
        primaryHover: settingsMap['primaryHover'] || settingsMap['THEME_PRIMARY_HOVER'] || this.currentPalette().primaryHover,
        sidebarBg: settingsMap['sidebarBg'] || settingsMap['THEME_SIDEBAR_BG'] || this.currentPalette().sidebarBg,
        sidebarText: settingsMap['secondaryText'] || settingsMap['sidebarText'] || settingsMap['THEME_SIDEBAR_TEXT'] || this.currentPalette().sidebarText,
        sidebarActiveAccent: settingsMap['icon'] || settingsMap['sidebarActiveAccent'] || settingsMap['THEME_SIDEBAR_ACCENT'] || this.currentPalette().sidebarActiveAccent,
        bgApp: settingsMap['background'] || settingsMap['bgApp'] || settingsMap['THEME_APP_BG'] || this.currentPalette().bgApp,
        cardBg: settingsMap['surface'] || settingsMap['cardBg'] || settingsMap['THEME_CARD_BG'] || this.currentPalette().cardBg,
        cardBorder: settingsMap['border'] || settingsMap['cardBorder'] || settingsMap['THEME_CARD_BORDER'] || this.currentPalette().cardBorder,
        textMain: settingsMap['text'] || settingsMap['textMain'] || settingsMap['THEME_TEXT_MAIN'] || this.currentPalette().textMain,
        success: settingsMap['success'] || settingsMap['THEME_SUCCESS_COLOR'] || this.currentPalette().success,
        danger: settingsMap['danger'] || settingsMap['THEME_DANGER_COLOR'] || this.currentPalette().danger,
        warning: settingsMap['warning'] || settingsMap['THEME_WARNING_COLOR'] || this.currentPalette().warning,
      };

      const isDark = this.isDarkColor(p.bgApp || '') || this.isDarkColor(p.cardBg || '');
      if (isDark) {
        this.darkPalette.set({ ...this.darkPalette(), ...(p as ThemePalette) });
        if (settingsMap['theme']) this.darkPresetKey.set(settingsMap['theme']);
      } else {
        this.lightPalette.set({ ...this.lightPalette(), ...(p as ThemePalette) });
        if (settingsMap['theme']) this.lightPresetKey.set(settingsMap['theme']);
      }
    }

    if (savedUserMode) {
      this.mode.set(savedUserMode);
    }
    this.injectCssVariables(this.currentPalette());
    this.exportToSettingsMap(settingsMap);
  }

  public exportToSettingsMap(settingsMap: Record<string, string>): void {
    const lp = this.lightPalette();
    const dp = this.darkPalette();
    const activeP = this.currentPalette();
    const activeKey = this.activePresetKey();

    const systemThemePayload = {
      activePresetKey: activeKey,
      theme: activeKey,
      mode: this.mode(),
      darkModeToggleEnabled: this.darkModeToggleEnabled(),
      lightTheme: {
        activePresetKey: this.lightPresetKey(),
        theme: this.lightPresetKey(),
        ...lp,
      },
      darkTheme: {
        activePresetKey: this.darkPresetKey(),
        theme: this.darkPresetKey(),
        ...dp,
      },
      // Top-level aliases for backwards compatibility with active theme
      primaryColor: activeP.primary,
      primaryHover: activeP.primaryHover,
      background: activeP.bgApp,
      surface: activeP.cardBg,
      text: activeP.textMain,
      secondaryText: activeP.sidebarText,
      border: activeP.cardBorder,
      icon: activeP.sidebarActiveAccent,
      ...activeP,
    };

    settingsMap['system_theme'] = JSON.stringify(systemThemePayload);
    settingsMap['DARK_MODE_TOGGLE_ENABLED'] = String(this.darkModeToggleEnabled());
    settingsMap['THEME_DARK_MODE_TOGGLE'] = String(this.darkModeToggleEnabled());

    // Active theme flat compatibility keys
    settingsMap['theme'] = activeKey;
    settingsMap['primaryColor'] = activeP.primary;
    settingsMap['primaryHover'] = activeP.primaryHover;
    settingsMap['background'] = activeP.bgApp;
    settingsMap['surface'] = activeP.cardBg;
    settingsMap['text'] = activeP.textMain;
    settingsMap['secondaryText'] = activeP.sidebarText;
    settingsMap['border'] = activeP.cardBorder;
    settingsMap['icon'] = activeP.sidebarActiveAccent;

    settingsMap['THEME_PRIMARY_COLOR'] = activeP.primary;
    settingsMap['THEME_PRIMARY_HOVER'] = activeP.primaryHover;
    settingsMap['THEME_SIDEBAR_BG'] = activeP.sidebarBg;
    settingsMap['THEME_SIDEBAR_TEXT'] = activeP.sidebarText;
    settingsMap['THEME_SIDEBAR_ACCENT'] = activeP.sidebarActiveAccent;
    settingsMap['THEME_APP_BG'] = activeP.bgApp;
    settingsMap['THEME_CARD_BG'] = activeP.cardBg;
    settingsMap['THEME_CARD_BORDER'] = activeP.cardBorder;
    settingsMap['THEME_TEXT_MAIN'] = activeP.textMain;
    settingsMap['THEME_SUCCESS_COLOR'] = activeP.success;
    settingsMap['THEME_DANGER_COLOR'] = activeP.danger;
    settingsMap['THEME_WARNING_COLOR'] = activeP.warning;
  }

  public isDarkColor(hex: string): boolean {
    if (!hex || !hex.startsWith('#')) return false;
    const cleanHex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
  }

  private injectCssVariables(p: ThemePalette): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isDark = this.isDarkColor(p.bgApp) || this.isDarkColor(p.cardBg) || this.mode() === 'dark';

    if (isDark) {
      root.classList.add('dark-theme');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Primary Brand
    root.style.setProperty('--primary', p.primary);
    root.style.setProperty('--primary-hover', p.primaryHover || p.primary);
    root.style.setProperty('--primary-variant', p.primary);
    root.style.setProperty('--primary-light', isDark ? this.adjustColorOpacity(p.primary, 0.25) : this.adjustColorOpacity(p.primary, 0.12));
    root.style.setProperty('--primary-glow', this.adjustColorOpacity(p.primary, 0.35));
    root.style.setProperty('--primary-subtle', isDark ? this.adjustColorOpacity(p.primary, 0.15) : this.adjustColorOpacity(p.primary, 0.05));

    // Secondary / Accent
    root.style.setProperty('--secondary', p.primaryHover || p.primary);
    root.style.setProperty('--secondary-hover', p.primary);
    root.style.setProperty('--accent', p.sidebarActiveAccent || p.primary);
    root.style.setProperty('--accent-light', this.adjustColorOpacity(p.sidebarActiveAccent || p.primary, 0.18));

    // Sidebar & Navigation
    root.style.setProperty('--sidebar-bg', p.sidebarBg);
    root.style.setProperty('--dark-nav', p.sidebarBg);
    root.style.setProperty('--sidebar-text', p.sidebarText);
    root.style.setProperty('--sidebar-active-accent', p.sidebarActiveAccent);

    // Derived sidebar borders and surfaces
    root.style.setProperty('--sidebar-surface', this.adjustColorBrightness(p.sidebarBg, 15));
    root.style.setProperty('--sidebar-border', this.adjustColorBrightness(p.sidebarBg, 25));
    root.style.setProperty('--sidebar-text-muted', this.adjustColorOpacity(p.sidebarText, 0.75));

    // App Surfaces
    root.style.setProperty('--bg-app', p.bgApp);
    root.style.setProperty('--card-bg', p.cardBg);
    root.style.setProperty('--card-border', p.cardBorder);
    root.style.setProperty('--card-hover', isDark ? this.adjustColorBrightness(p.cardBg, 8) : this.adjustColorBrightness(p.cardBg, -3));

    // Typography
    const mainTextColor = isDark ? (p.textMain && this.isDarkColor(p.textMain) ? '#F8FAFC' : (p.textMain || '#F8FAFC')) : p.textMain;
    root.style.setProperty('--text-main', mainTextColor);
    root.style.setProperty('--text-muted', isDark ? 'rgba(226, 232, 240, 0.78)' : '#64748B');
    root.style.setProperty('--text-dim', isDark ? 'rgba(148, 163, 184, 0.65)' : '#94A3B8');

    // Semantic Status Colors
    root.style.setProperty('--success', p.success);
    root.style.setProperty('--danger', p.danger);
    root.style.setProperty('--error', p.danger);
    root.style.setProperty('--warning', p.warning);

    const tint = isDark ? 0.24 : 0.12;
    root.style.setProperty('--success-light', this.adjustColorOpacity(p.success, tint));
    root.style.setProperty('--danger-light', this.adjustColorOpacity(p.danger, tint));
    root.style.setProperty('--error-light', this.adjustColorOpacity(p.danger, tint));
    root.style.setProperty('--warning-light', this.adjustColorOpacity(p.warning, tint));

    root.style.setProperty('--primary-rgb', this.hexToChannels(p.primary));
    root.style.setProperty('--primary-variant-rgb', this.hexToChannels(p.primary));
    root.style.setProperty('--text-main-rgb', this.hexToChannels(mainTextColor));
    root.style.setProperty('--success-rgb', this.hexToChannels(p.success));
    root.style.setProperty('--danger-rgb', this.hexToChannels(p.danger));
    root.style.setProperty('--warning-rgb', this.hexToChannels(p.warning));
  }

  /** `#7E22CE` -> `126, 34, 206`, for use inside rgba(). */
  private hexToChannels(hex: string): string {
    if (!hex || !hex.startsWith('#')) return '126, 34, 206';
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    if (full.length !== 6) return '126, 34, 206';
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    if (!hex || !hex.startsWith('#')) return hex;
    let num = parseInt(hex.replace('#', ''), 16);
    if (hex.length === 4) {
      const r = parseInt(hex[1] + hex[1], 16);
      const g = parseInt(hex[2] + hex[2], 16);
      const b = parseInt(hex[3] + hex[3], 16);
      num = (r << 16) + (g << 8) + b;
    }
    let r = (num >> 16) + Math.round((255 * percent) / 100);
    let g = ((num >> 8) & 0x00ff) + Math.round((255 * percent) / 100);
    let b = (num & 0x0000ff) + Math.round((255 * percent) / 100);

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private adjustColorOpacity(hex: string, opacity: number): string {
    if (!hex || !hex.startsWith('#')) return hex;
    const cleanHex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (cleanHex.length === 3) {
      const rHex = cleanHex[0] + cleanHex[0];
      const gHex = cleanHex[1] + cleanHex[1];
      const bHex = cleanHex[2] + cleanHex[2];
      r = parseInt(rHex, 16);
      g = parseInt(gHex, 16);
      b = parseInt(bHex, 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

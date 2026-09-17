import { Injectable, signal, inject } from '@angular/core';
import { SettingsService } from './settings.service';

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

export const DEFAULT_THEME_PALETTES: Record<string, { name: string; icon: string; palette: ThemePalette }> = {
  purple: {
    name: 'Royal Purple (Mandi Brand)',
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
    name: 'Ocean Blue & Slate',
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
  midnight: {
    name: 'Midnight Dark Mode',
    icon: '🌑',
    palette: {
      primary: '#9333EA',
      primaryHover: '#A855F7',
      sidebarBg: '#0B0F19',
      sidebarText: '#F8FAFC',
      sidebarActiveAccent: '#C084FC',
      bgApp: '#0F172A',
      cardBg: '#1E293B',
      cardBorder: '#334155',
      textMain: '#F8FAFC',
      success: '#22C55E',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private settingsService = inject(SettingsService);
  public currentPalette = signal<ThemePalette>(DEFAULT_THEME_PALETTES['purple'].palette);
  public activePresetKey = signal<string>('purple');

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mandi_pos_ui_theme_palette');
      } catch (_) {}
    }
    this.loadInitialTheme();
  }

  public loadInitialTheme(): void {
    // 1. Set baseline default
    this.applyPalette(DEFAULT_THEME_PALETTES['purple'].palette);

    // 2. Read the palette from the database via the shared public-settings store
    this.settingsService.loadPublicSettings().subscribe({
      next: (settings) => {
        if (settings && Object.keys(settings).length) {
          this.syncFromSettingsMap(settings);
        }
        // Otherwise keep the baseline default (e.g. API still starting up)
      },
      // Same reason: keep the baseline palette rather than letting a failed
      // bootstrap request escape unhandled.
      error: () => {},
    });
  }

  public applyPreset(presetKey: string): void {
    this.activePresetKey.set(presetKey);
    const preset = DEFAULT_THEME_PALETTES[presetKey];
    if (preset) {
      this.applyPalette(preset.palette);
    }
  }

  public applyPalette(palette: ThemePalette): void {
    const safePalette: ThemePalette = {
      ...DEFAULT_THEME_PALETTES['purple'].palette,
      ...palette,
    };

    this.currentPalette.set(safePalette);
    this.injectCssVariables(safePalette);
  }

  public updateSettingColor(key: keyof ThemePalette, colorHex: string): void {
    this.activePresetKey.set('custom');
    const updated = {
      ...this.currentPalette(),
      [key]: colorHex,
    };
    this.applyPalette(updated);
  }

  public syncFromSettingsMap(settingsMap: Record<string, string>): void {
    if (!settingsMap) return;

    // Check if system_theme or SYSTEM_THEME JSON key is present
    const rawSystemTheme = settingsMap['system_theme'] || settingsMap['SYSTEM_THEME'];
    if (rawSystemTheme) {
      try {
        const parsed = typeof rawSystemTheme === 'string'
          ? JSON.parse(rawSystemTheme)
          : rawSystemTheme;
        if (parsed && typeof parsed === 'object') {
          if (parsed.activePresetKey) {
            this.activePresetKey.set(parsed.activePresetKey);
          } else {
            // auto-detect preset key
            const matchedKey = Object.keys(DEFAULT_THEME_PALETTES).find(
              (k) => DEFAULT_THEME_PALETTES[k].palette.primary.toLowerCase() === parsed.primary?.toLowerCase()
            );
            this.activePresetKey.set(matchedKey || 'custom');
          }
          this.applyPalette(parsed);
          this.exportToSettingsMap(settingsMap);
          return;
        }
      } catch (e) {
        console.error('Failed to parse system_theme JSON from database', e);
      }
    }

    // Also support camelCase / individual settings keys
    const palette: ThemePalette = {
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

    if (settingsMap['theme']) {
      this.activePresetKey.set(settingsMap['theme']);
    }

    this.applyPalette(palette);
    this.exportToSettingsMap(settingsMap);
  }

  public exportToSettingsMap(settingsMap: Record<string, string>): void {
    const p = this.currentPalette();
    const systemThemePayload = {
      activePresetKey: this.activePresetKey(),
      theme: this.activePresetKey(),
      primaryColor: p.primary,
      primaryHover: p.primaryHover,
      background: p.bgApp,
      surface: p.cardBg,
      text: p.textMain,
      secondaryText: p.sidebarText,
      border: p.cardBorder,
      icon: p.sidebarActiveAccent,
      ...p,
    };
    settingsMap['system_theme'] = JSON.stringify(systemThemePayload);
    // Populate both alias styles for full compatibility
    settingsMap['theme'] = this.activePresetKey();
    settingsMap['primaryColor'] = p.primary;
    settingsMap['primaryHover'] = p.primaryHover;
    settingsMap['background'] = p.bgApp;
    settingsMap['surface'] = p.cardBg;
    settingsMap['text'] = p.textMain;
    settingsMap['secondaryText'] = p.sidebarText;
    settingsMap['border'] = p.cardBorder;
    settingsMap['icon'] = p.sidebarActiveAccent;

    settingsMap['THEME_PRIMARY_COLOR'] = p.primary;
    settingsMap['THEME_PRIMARY_HOVER'] = p.primaryHover;
    settingsMap['THEME_SIDEBAR_BG'] = p.sidebarBg;
    settingsMap['THEME_SIDEBAR_TEXT'] = p.sidebarText;
    settingsMap['THEME_SIDEBAR_ACCENT'] = p.sidebarActiveAccent;
    settingsMap['THEME_APP_BG'] = p.bgApp;
    settingsMap['THEME_CARD_BG'] = p.cardBg;
    settingsMap['THEME_CARD_BORDER'] = p.cardBorder;
    settingsMap['THEME_TEXT_MAIN'] = p.textMain;
    settingsMap['THEME_SUCCESS_COLOR'] = p.success;
    settingsMap['THEME_DANGER_COLOR'] = p.danger;
    settingsMap['THEME_WARNING_COLOR'] = p.warning;
  }

  private isDarkColor(hex: string): boolean {
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
    const isDark = this.isDarkColor(p.bgApp) || this.isDarkColor(p.cardBg);

    if (isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
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
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

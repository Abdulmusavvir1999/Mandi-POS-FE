import { Injectable, signal } from '@angular/core';

export type ToastPosition =
  | 'top-right'
  | 'top-center'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastConfig {
  position: ToastPosition;
  duration: number;
  maxVisible: number;
  showCloseButton: boolean;
  pauseOnHover: boolean;
  animation: 'slide' | 'fade' | 'bounce';
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  createdAt: number;
  duration: number;
  paused: boolean;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const TOAST_CONFIG_STORAGE_KEY = 'mandi_pos_toast_config';

export const DEFAULT_TOAST_CONFIG: ToastConfig = {
  position: 'top-right',
  duration: 4000,
  maxVisible: 4,
  showCloseButton: true,
  pauseOnHover: true,
  animation: 'slide',
};

interface ActiveTimer {
  timeoutId: any;
  startTime: number;
  remainingMs: number;
  totalDuration: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private configSignal = signal<ToastConfig>(DEFAULT_TOAST_CONFIG);
  public config = this.configSignal.asReadonly();

  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = this.toastsSignal.asReadonly();

  private confirmModalSignal = signal<ConfirmDialogOptions | null>(null);
  public confirmModal = this.confirmModalSignal.asReadonly();

  private timerMap = new Map<string, ActiveTimer>();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TOAST_CONFIG_STORAGE_KEY);
      } catch (_) {}
    }
  }

  public updateConfig(newConfig: Partial<ToastConfig>): void {
    const updated = { ...this.configSignal(), ...newConfig };
    this.configSignal.set(updated);
  }

  public syncFromSettingsMap(settingsMap: Record<string, string>): void {
    if (!settingsMap) return;

    // Check if system_toast or SYSTEM_TOAST JSON key is present
    const rawToast = settingsMap['system_toast'] || settingsMap['SYSTEM_TOAST'];
    if (rawToast) {
      try {
        const parsed = typeof rawToast === 'string' ? JSON.parse(rawToast) : rawToast;
        if (parsed && typeof parsed === 'object') {
          const cfg: Partial<ToastConfig> = {};
          if (parsed.position) cfg.position = parsed.position;
          if (parsed.duration) cfg.duration = parseInt(parsed.duration, 10) || 4000;
          if (parsed.maxVisible) cfg.maxVisible = parseInt(parsed.maxVisible, 10) || 4;
          if (parsed.showClose !== undefined) cfg.showCloseButton = parsed.showClose === true || parsed.showClose === 'true';
          if (parsed.pauseOnHover !== undefined) cfg.pauseOnHover = parsed.pauseOnHover === true || parsed.pauseOnHover === 'true';
          if (parsed.animation) cfg.animation = parsed.animation;
          this.updateConfig(cfg);
          this.exportToSettingsMap(settingsMap);
          return;
        }
      } catch (e) {
        console.error('Failed to parse system_toast JSON from database', e);
      }
    }

    const cfg: Partial<ToastConfig> = {};
    if (settingsMap['TOAST_POSITION']) cfg.position = settingsMap['TOAST_POSITION'] as ToastPosition;
    if (settingsMap['TOAST_DURATION']) cfg.duration = parseInt(settingsMap['TOAST_DURATION'], 10) || 4000;
    if (settingsMap['TOAST_MAX_VISIBLE']) cfg.maxVisible = parseInt(settingsMap['TOAST_MAX_VISIBLE'], 10) || 4;
    if (settingsMap['TOAST_SHOW_CLOSE']) cfg.showCloseButton = settingsMap['TOAST_SHOW_CLOSE'] === 'true';
    if (settingsMap['TOAST_PAUSE_HOVER']) cfg.pauseOnHover = settingsMap['TOAST_PAUSE_HOVER'] === 'true';
    if (settingsMap['TOAST_ANIMATION']) cfg.animation = settingsMap['TOAST_ANIMATION'] as any;

    this.updateConfig(cfg);
    this.exportToSettingsMap(settingsMap);
  }

  public exportToSettingsMap(settingsMap: Record<string, string>): void {
    const cfg = this.configSignal();
    const toastPayload = {
      position: cfg.position,
      duration: cfg.duration,
      maxVisible: cfg.maxVisible,
      showClose: cfg.showCloseButton,
      pauseOnHover: cfg.pauseOnHover,
      animation: cfg.animation,
    };
    settingsMap['system_toast'] = JSON.stringify(toastPayload);
    // Populate individual keys for UI binding in settings tab
    settingsMap['TOAST_POSITION'] = cfg.position;
    settingsMap['TOAST_DURATION'] = cfg.duration.toString();
    settingsMap['TOAST_MAX_VISIBLE'] = cfg.maxVisible.toString();
    settingsMap['TOAST_SHOW_CLOSE'] = cfg.showCloseButton ? 'true' : 'false';
    settingsMap['TOAST_PAUSE_HOVER'] = cfg.pauseOnHover ? 'true' : 'false';
    settingsMap['TOAST_ANIMATION'] = cfg.animation;
  }

  public show(
    message: string,
    type: ToastType = 'info',
    title?: string,
    customDuration?: number
  ): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const duration = type === 'loading' ? 0 : (customDuration || (type === 'error' ? 5000 : this.configSignal().duration));
    const defaultTitle = this.getDefaultTitle(type);

    const newToast: ToastMessage = {
      id,
      type,
      title: title || defaultTitle,
      message,
      createdAt: Date.now(),
      duration,
      paused: false,
    };

    const max = this.configSignal().maxVisible;
    this.toastsSignal.update((list) => {
      const isTop = this.configSignal().position.startsWith('top');
      let updated = isTop ? [newToast, ...list] : [...list, newToast];
      if (updated.length > max) {
        // Clean timers for dropped toasts
        const removed = isTop ? updated.slice(max) : updated.slice(0, updated.length - max);
        removed.forEach(r => this.clearTimer(r.id));
        updated = isTop ? updated.slice(0, max) : updated.slice(-max);
      }
      return updated;
    });

    if (duration > 0) {
      this.scheduleTimer(id, duration);
    }

    return id;
  }

  public success(message: string, title = 'Success'): string {
    return this.show(message, 'success', title);
  }

  public error(message: string, title = 'Error'): string {
    return this.show(message, 'error', title);
  }

  public warning(message: string, title = 'Warning'): string {
    return this.show(message, 'warning', title);
  }

  public info(message: string, title = 'Information'): string {
    return this.show(message, 'info', title);
  }

  public loading(message: string, title = 'Processing...'): string {
    return this.show(message, 'loading', title);
  }

  public pause(id: string): void {
    if (!this.configSignal().pauseOnHover) return;
    const timer = this.timerMap.get(id);
    if (timer && timer.timeoutId) {
      clearTimeout(timer.timeoutId);
      timer.timeoutId = null;
      const elapsed = Date.now() - timer.startTime;
      timer.remainingMs = Math.max(0, timer.remainingMs - elapsed);
    }
    this.toastsSignal.update((list) =>
      list.map((t) => (t.id === id ? { ...t, paused: true } : t))
    );
  }

  public resume(id: string): void {
    if (!this.configSignal().pauseOnHover) return;
    const timer = this.timerMap.get(id);
    if (timer && timer.remainingMs > 0 && !timer.timeoutId) {
      timer.startTime = Date.now();
      timer.timeoutId = setTimeout(() => {
        this.remove(id);
      }, timer.remainingMs);
    }
    this.toastsSignal.update((list) =>
      list.map((t) => (t.id === id ? { ...t, paused: false } : t))
    );
  }

  public remove(id: string): void {
    this.clearTimer(id);
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }

  public clearAll(): void {
    this.timerMap.forEach((_, id) => this.clearTimer(id));
    this.timerMap.clear();
    this.toastsSignal.set([]);
  }

  public confirm(options: ConfirmDialogOptions): void {
    this.confirmModalSignal.set(options);
  }

  public closeConfirm(): void {
    this.confirmModalSignal.set(null);
  }

  private scheduleTimer(id: string, durationMs: number): void {
    this.clearTimer(id);
    const timeoutId = setTimeout(() => {
      this.remove(id);
    }, durationMs);

    this.timerMap.set(id, {
      timeoutId,
      startTime: Date.now(),
      remainingMs: durationMs,
      totalDuration: durationMs,
    });
  }

  private clearTimer(id: string): void {
    const timer = this.timerMap.get(id);
    if (timer) {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
      }
      this.timerMap.delete(id);
    }
  }

  private getDefaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'loading':
        return 'Processing';
      default:
        return 'Information';
    }
  }
}

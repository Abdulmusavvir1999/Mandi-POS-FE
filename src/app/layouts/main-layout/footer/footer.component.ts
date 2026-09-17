import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="h-8 bg-[var(--sidebar-bg,#2E1065)] border-t border-[var(--sidebar-border,#581C87)] px-4 flex items-center justify-between text-[11px] text-[var(--sidebar-text-muted,#D8B4FE)] select-none z-30">
      <!-- Left: Signed-in operator -->
      <div class="flex items-center gap-4">
        <div class="hidden md:flex items-center gap-1.5 text-[var(--sidebar-text-muted,#D8B4FE)]" *ngIf="authService.currentUser() as user">
          <span class="material-symbols-outlined text-[13px]">badge</span>
          <span class="text-[var(--sidebar-text,#FAF5FF)] font-mono">{{ user.name }}</span>
          <span class="text-[var(--sidebar-active-accent,#C084FC)]">|</span>
          <span>{{ user.role }}</span>
        </div>
      </div>

      <!-- Center: Global Keyboard Shortcut Hints -->
      <div class="hidden lg:flex items-center gap-3">
        <div class="flex items-center gap-1">
          <kbd class="hotkey-badge">F2</kbd>
          <span class="text-[var(--sidebar-text-muted,#D8B4FE)]">Search</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd class="hotkey-badge">F4</kbd>
          <span class="text-[var(--sidebar-text-muted,#D8B4FE)]">Hold Bill</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd class="hotkey-badge">F8</kbd>
          <span class="text-[var(--sidebar-text-muted,#D8B4FE)]">Checkout</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd class="hotkey-badge">ESC</kbd>
          <span class="text-[var(--sidebar-text-muted,#D8B4FE)]">Close</span>
        </div>
      </div>

      <!-- Right: Business identity from settings -->
      <div class="flex items-center gap-3 font-mono text-[10px]">
        <div
          class="flex items-center gap-1 text-[var(--sidebar-active-accent,#C084FC)] font-semibold"
          *ngIf="settingsService.businessName() as businessName"
        >
          <span>{{ businessName }}</span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { BrandingService } from './core/services/branding.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  // Injected for its side effect: keeps the window title and favicon in step
  // with the Store settings tab for as long as the app is open.
  private brandingService = inject(BrandingService);

  ngOnInit(): void {
    this.authService.refreshUserData();
    this.themeService.loadInitialTheme();
  }
}


import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { apiLoggingInterceptor } from './core/auth/interceptors/api-logging.interceptor';
import { errorInterceptor } from './core/auth/interceptors/error.interceptor';
import { backOfficeInterceptor } from './core/auth/interceptors/back-office.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Every feature route is lazy, so before this the first click on a sidebar
    // item had to download and parse that feature's chunk before anything could
    // render — the settings chunk alone is 576 KB. Preloading pulls them in the
    // background once the first page is up, so a click only costs rendering.
    // Appropriate here because the POS runs on a local network against a known
    // set of screens, not over a metered connection.
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([authInterceptor, backOfficeInterceptor, apiLoggingInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
  ],
};

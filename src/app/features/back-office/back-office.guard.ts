import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

/**
 * Gate for `/admin/back-office`.
 *
 * The super administrator and nobody else. ADMIN is turned away here as firmly
 * as a cashier is: the Back-Office deletes orders and invoices outright and
 * re-prices settled bills, and that sits one step above the administrator who
 * runs the shop day to day.
 *
 * It lives here rather than in the shared guards file because nothing else
 * routes through it — and it is only a convenience. The API enforces the same
 * rule, so typing the URL without the role gets nothing back either, and the
 * Back-Office password is a second lock on top of this one.
 *
 * An unauthenticated visitor is sent to the login screen carrying the return
 * URL, so signing in lands them on the Back-Office rather than the dashboard.
 * Anyone signed in without the role is sent to the dashboard instead, which is
 * the same thing the route would do for any other screen they cannot open.
 */
export const backOfficeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.isSuperAdmin()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';

/**
 * Gate for `/admin/back-office`.
 *
 * The Back-Office deletes orders and invoices outright and re-prices settled
 * bills, so it is limited to administrators. It lives here rather than in the
 * shared guards file because nothing else routes through it — and it is only a
 * convenience: the API enforces the same rule, so typing the URL without the
 * role gets nothing back either.
 *
 * An unauthenticated visitor is sent to the login screen carrying the return
 * URL, so signing in lands them on the Back-Office rather than the dashboard.
 */
export const backOfficeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.hasRole('ADMIN')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

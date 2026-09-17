import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = error?.error?.message || 'An unexpected error occurred';

      if (error.status === 401) {
        if (!req.url.includes('/auth/login')) {
          errorMessage = error?.error?.message || 'Session expired. Please log in again.';
          authService.logout();
        } else {
          errorMessage = error?.error?.message || 'Invalid username or password.';
        }
      } else if (error.status === 403) {
        errorMessage = error?.error?.message || 'Access denied: You do not have permission for this action.';
      } else if (error.status === 404) {
        errorMessage = error?.error?.message || 'The requested resource was not found.';
      } else if (error.status === 500) {
        errorMessage = error?.error?.message || 'Internal server error. Please try again or contact support.';
      }

      notify.error(errorMessage);
      return throwError(() => error);
    })
  );
};

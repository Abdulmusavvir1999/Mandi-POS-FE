import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { BackOfficeAccessService, UNLOCK_HEADER } from '../../services/back-office-access.service';

/**
 * Attaches the Back-Office unlock grant to Back-Office requests.
 *
 * Only to those: the header is meaningless anywhere else, and the rest of the
 * panel carries exactly what it carried before. The access endpoints are
 * excluded too — they are how the grant is obtained, so they sit in front of
 * the lock rather than behind it.
 *
 * It also watches for the server refusing the grant — expired, or issued
 * against a password that has since been changed — and drops the stored copy
 * so the screen falls back to the password prompt instead of sitting there
 * showing errors against a token that will never be accepted again.
 */
export const backOfficeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/back-office/') || req.url.includes('/back-office/access/')) {
    return next(req);
  }

  const access = inject(BackOfficeAccessService);
  const token = access.readToken();

  const request = token ? req.clone({ setHeaders: { [UNLOCK_HEADER]: token } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 && error.error?.error?.code === 'BACK_OFFICE_LOCKED') {
        access.lock();
      }
      return throwError(() => error);
    })
  );
};

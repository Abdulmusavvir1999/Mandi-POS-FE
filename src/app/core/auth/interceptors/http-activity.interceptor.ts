import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpActivityService } from '../../services/http-activity.service';

/**
 * Registers every request with HttpActivityService for the lifetime of the
 * call. `finalize` runs on completion, on error and on unsubscribe, so a
 * request can never be left on the in-flight list — which is what guarantees
 * the button loader is released whatever the outcome.
 */
export const httpActivityInterceptor: HttpInterceptorFn = (req, next) => {
  const activity = inject(HttpActivityService);
  const id = activity.begin();
  return next(req).pipe(finalize(() => activity.end(id)));
};

import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs';

export const apiLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  // Prominently log outgoing API trigger and payload
  console.log(
    `%c[API TRIGGER] %c${timestamp} %c${req.method} %c${req.url}`,
    'background: #7E22CE; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
    'color: #6B7280; font-weight: 500;',
    'color: #7E22CE; font-weight: bold;',
    'color: #2E1065; font-weight: bold;'
  );
  
  if (req.body) {
    console.log('%c  └─ 📤 Request Payload:', 'color: #2563EB; font-weight: bold;', req.body);
  }
  
  if (req.params && req.params.keys().length > 0) {
    const paramsObj: Record<string, string> = {};
    for (const key of req.params.keys()) {
      paramsObj[key] = req.params.get(key) || '';
    }
    console.log('%c  └─ 🔍 Query Params:', 'color: #059669; font-weight: bold;', paramsObj);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          console.log(
            `%c[API RESPONSE] %c${event.status} OK %c${req.method} %c${req.url} %c(${duration}ms)`,
            'background: #16A34A; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            'color: #16A34A; font-weight: bold;',
            'color: #7E22CE; font-weight: bold;',
            'color: #2E1065; font-weight: 600;',
            'color: #6B7280; font-size: 11px;'
          );
          console.log('%c  └─ 📥 Response Data:', 'color: #16A34A; font-weight: bold;', event.body);
        }
      },
      error: (err: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        console.error(
          `%c[API ERROR] %c${err.status} %c${req.method} %c${req.url} %c(${duration}ms)`,
          'background: #DC2626; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
          'color: #DC2626; font-weight: bold;',
          'color: #7E22CE; font-weight: bold;',
          'color: #2E1065; font-weight: 600;',
          'color: #6B7280; font-size: 11px;'
        );
        console.error('%c  └─ ❌ Error Payload:', 'color: #DC2626; font-weight: bold;', err.error || err.message);
      },
    })
  );
};

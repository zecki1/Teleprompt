import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ObservabilityService } from '../services/observability.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const observability = inject(ObservabilityService);
  const startTime = Date.now();

  return next(req).pipe(
    catchError((error) => {
      const duration = Date.now() - startTime;

      observability.trackApiCall(
        req.url,
        req.method,
        duration,
        error.status || 0
      );

      if (error.status >= 500) {
        observability.trackError(error, {
          context: 'http',
          url: req.url,
          method: req.method
        });
      }

      return throwError(() => error);
    })
  );
};

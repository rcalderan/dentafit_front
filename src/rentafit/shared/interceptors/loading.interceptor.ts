import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Functional HTTP interceptor that tracks active requests via LoadingService.
 * Registered alongside the auth interceptor in rentafit.config.ts.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.increment();

  return next(req).pipe(
    finalize(() => loadingService.decrement()),
  );
};

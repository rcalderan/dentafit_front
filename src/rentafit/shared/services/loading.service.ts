import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Tracks the number of active HTTP requests to drive a global loading indicator.
 * Incremented/decremented by the loading interceptor.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests$ = new BehaviorSubject<number>(0);

  /** True when at least one HTTP request is in flight. */
  readonly isLoading$ = this.activeRequests$.pipe(map(count => count > 0));

  increment(): void {
    this.activeRequests$.next(this.activeRequests$.value + 1);
  }

  decrement(): void {
    this.activeRequests$.next(Math.max(0, this.activeRequests$.value - 1));
  }
}

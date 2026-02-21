import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './rentafit.routes';
import { authInterceptor } from './domains/auth/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { APP_CONFIG } from './shared/data/app-config.token';
import { SilentLocationStrategy } from './shared/strategies/silent-location.strategy';

export const rentafitConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    { provide: APP_CONFIG, useValue: environment },
    { provide: LocationStrategy, useClass: SilentLocationStrategy },
  ]
};

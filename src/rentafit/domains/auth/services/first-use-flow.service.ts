import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../data/user.model';
import { IssuerSetupService } from './issuer-setup.service';
import { resolveHomeRoute } from '../utils/role-route.util';

@Injectable({
  providedIn: 'root'
})
export class FirstUseFlowService {
  private readonly issuerSetupService = inject(IssuerSetupService);

  resolvePostLoginRoute(user: User): Observable<string> {
    if (!user.pinConfigured) {
      return of('/auth/setup-credentials');
    }
    if (user.passwordExpired) {
      return of('/auth/change-password');
    }
    return this.resolveAfterCredentials(user);
  }

  resolveAfterCredentials(user: User): Observable<string> {
    if (user.role === UserRole.ADMIN) {
      return this.resolveAdminRoute();
    }
    return this.resolveNonAdminRoute(user);
  }

  private resolveAdminRoute(): Observable<string> {
    return this.issuerSetupService.getCurrentIssuer().pipe(
      map(issuer => issuer ? resolveHomeRoute(UserRole.ADMIN) : '/auth/issuer-setup')
    );
  }

  private resolveNonAdminRoute(user: User): Observable<string> {
    if (user.issuerCnpj) {
      return of(resolveHomeRoute(user.role));
    }
    return of('/auth/issuer-confirm');
  }
}

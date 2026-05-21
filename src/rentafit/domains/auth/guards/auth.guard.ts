import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger rotas que requerem autenticação.
 * Also blocks access when credential setup or password change is pending.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  if (authService.needsCredentialSetup()) {
    router.navigate(['/auth/setup-credentials']);
    return false;
  }

  if (authService.isPasswordExpired()) {
    router.navigate(['/auth/change-password']);
    return false;
  }

  return true;
};

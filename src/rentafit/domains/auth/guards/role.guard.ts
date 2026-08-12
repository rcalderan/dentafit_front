import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../data/user.model';

/** Returns the home route for each role so the guard never creates a redirect loop. */
function resolveFallbackRoute(role: UserRole | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.MANAGER:
      return '/finance/dashboard';
    case UserRole.EMPLOYEE:
      return '/rental/management';
    case UserRole.CUSTOMER:
      return '/account/profile';
    default:
      return '/auth/login';
  }
}

/**
 * Guard funcional para controle de acesso baseado em roles.
 * Utiliza a propriedade 'roles' na configuração da rota.
 * 
 * Exemplo de uso nas rotas:
 * { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard], data: { roles: [UserRole.MANAGER, UserRole.ADMIN] } }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return false;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // Redireciona para a rota padrão da role atual (evita loop entre rotas restritas)
  const user = authService.getCurrentUser();
  const fallback = resolveFallbackRoute(user?.role);
  router.navigate([fallback]);
  return false;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../data/user.model';

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
    return true;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // Redireciona para página de acesso negado ou dashboard
  router.navigate(['/finance/dashboard']);
  return false;
};

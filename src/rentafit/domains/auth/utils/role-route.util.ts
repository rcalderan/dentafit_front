import { UserRole } from '../data/user.model';

export function resolveHomeRoute(role: UserRole | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.MANAGER: return '/finance/dashboard';
    case UserRole.EMPLOYEE: return '/rental/management';
    case UserRole.CUSTOMER: return '/account/profile';
    default: return '/auth/login';
  }
}

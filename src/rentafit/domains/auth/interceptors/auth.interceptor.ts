import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Interceptor funcional para injeção automática do token JWT
 * e renovação automática em caso de expiração (401)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Ignora rotas públicas
  if (req.url.includes('/auth/login') || 
      req.url.includes('/auth/public-key') || 
      req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Injeta o token se disponível
  const token = authService.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se receber 401 e não for a rota de refresh, tenta renovar o token
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Reexecuta a requisição original com o novo token
            const newToken = authService.getAccessToken();
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(clonedReq);
          }),
          catchError(refreshError => {
            // Se o refresh também falhar, faz logout
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

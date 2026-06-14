import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CryptoService } from './crypto.service';
import { User, UserRole, LoginRequest, LoginResponse, RefreshTokenRequest, SignUpRequest } from '../data/user.model';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly config = inject(APP_CONFIG);
  private readonly apiUrl = `${this.config.apiBaseUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cryptoService: CryptoService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('AuthService error:', error);
    const errorMessage = HTTP_ERROR_MAP[error.status] || error.error?.message || ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Realiza o login do usuário
   */

  login(username: string, password: string): Observable<User> {
    const loginRequest: LoginRequest = {
      username,
      password: password
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap(response => this.storeTokens(response)),
      switchMap(() => this.fetchUserProfile()), 
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Busca o perfil do usuário após o login
   */
  private fetchUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      catchError(this.handleError.bind(this)),
      map(response => {
        const role = this.mapRole(response.roles[0]);
        const user: User = {
          id: response.id,
          username: response.username,
          email: response.email,
          name: response.name,
          legacyId: response.legacyId,
          pinConfigured: response.pinConfigured,
          role: role,
          active: response.active,
          passwordExpired: response.passwordExpired ?? false,
          createdAt: response.createdAt
        };
        
        // Persiste o usuário no localStorage    
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));    
        
        return user;
      })
    );
  }

  /**
   * Mapeia a role do backend para o formato do frontend
   */
  private mapRole(backendRole: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      'ADMIN': UserRole.ADMIN,
      'MANAGER': UserRole.MANAGER,
      'EMPLOYEE': UserRole.EMPLOYEE,
      'CUSTOMER': UserRole.CUSTOMER
    };
    
    return roleMap[backendRole] || UserRole.CUSTOMER;
  }

  /**
   * Renova o access token usando o refresh token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token não encontrado'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, request).pipe(
      tap(response => this.storeTokens(response)),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Verifica se o usuário está autenticado e se o token é válido
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadBase64));
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();

      // Se o token já expirou
      if (expirationDate <= now) {
        return false;
      }

      // Se o token expira em menos de 5 minutos, tenta renovar (refresh)
      const fiveMinutesInMs = 5 * 60 * 1000;
      if (expirationDate.getTime() - now.getTime() < fiveMinutesInMs) {
        this.refreshToken().subscribe({
          next: () => console.log('Token renovado proativamente'),
          error: (err) => console.error('Erro na renovação proativa do token', err)
        });
      }

      return true;
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      return false;
    }
  }

  /**
   * Verifica se o usuário possui uma role específica
   */
  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role || false;
  }

  /**
   * Verifica se o usuário possui qualquer uma das roles especificadas
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Obtém o access token armazenado
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Obtém o refresh token armazenado
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Armazena os tokens no localStorage
   */
  private storeTokens(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  }

  /**
   * Carrega o usuário do localStorage ao iniciar a aplicação
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Redireciona o usuário baseado em sua role
   */
  private redirectUserByRole(user: User): void {
    switch (user.role) {
      case UserRole.MANAGER:
      case UserRole.MANAGER:
        this.router.navigate(['/finance/dashboard']);
        break;
      case UserRole.EMPLOYEE:
        this.router.navigate(['/rental/management']);
        break;
      case UserRole.CUSTOMER:
        this.router.navigate(['/customer/search']);
        break;
      default:
        this.router.navigate(['/finance/dashboard']);
    }
  }

  /**
   * Checks if the user needs to complete first-access setup (PIN is null).
   */
  needsCredentialSetup(): boolean {
    const user = this.currentUserSubject.value;
    return user != null && !user.pinConfigured;
  }

  /**
   * Checks if the user's password has expired.
   */
  isPasswordExpired(): boolean {
    const user = this.currentUserSubject.value;
    return user?.passwordExpired === true;
  }

  /**
   * Public self-registration: creates Customer + UserAccount (CUSTOMER role) and returns tokens.
   * The backend returns tokens for auto-login; the frontend routes to /auth/setup-credentials.
   * Usage: `authService.signUp(payload)`
   */
  signUp(payload: SignUpRequest): Observable<User> {
    return this.http.post<LoginResponse>(`${this.config.apiBaseUrl}/api/v1/customers/signup`, payload).pipe(
      tap(response => this.storeTokens(response)),
      switchMap(() => this.fetchUserProfile()),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * First-access: sets password + PIN.
   * Usage: `authService.setupCredentials('MyP@ss1', '1234')`
   */
  setupCredentials(newPassword: string, pin: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/setup-credentials`, { newPassword, pin }).pipe(
      tap(() => {
        const user = this.currentUserSubject.value;
        if (user) {
          user.pinConfigured = true;
          user.passwordExpired = false;
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Changes an expired password.
   * Usage: `authService.changePassword('NewP@ss1')`
   */
  changePassword(newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { newPassword }).pipe(
      tap(() => {
        const user = this.currentUserSubject.value;
        if (user) {
          user.passwordExpired = false;
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }
}

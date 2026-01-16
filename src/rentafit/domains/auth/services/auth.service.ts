import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CryptoService } from './crypto.service';
import { User, UserRole, LoginRequest, LoginResponse, RefreshTokenRequest } from '../data/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cryptoService: CryptoService,
    private router: Router
  ) {
    this.loadUserFromStorage();
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
      catchError(error => {
        console.error('Erro no login:', error);
        return throwError(() => new Error('Falha na autenticação'));
      })
    );
  }

  /**
   * Busca o perfil do usuário após o login
   */
  private fetchUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      catchError(error => {
        console.error('Erro ao buscar perfil do usuário:', error);
        return throwError(() => new Error('Não foi possível obter o perfil do usuário'));
      }),
      map(response => {
        const role = this.mapRole(response.roles[0]);
        const user: User = {
          id: response.id,
          username: response.username,
          email: response.email,
          name: response.name,
          legacyId: response.legacyId,
          role: role,
          active: response.active,
          createdAt: response.createdAt
        };
        
        // Persiste o usuário no localStorage
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
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
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
}

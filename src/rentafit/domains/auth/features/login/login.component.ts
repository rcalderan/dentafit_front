import { Component, signal, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../data/user.model';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';

function resolveHomeRoute(role: UserRole | undefined): string {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.MANAGER:  return '/finance/dashboard';
    case UserRole.EMPLOYEE: return '/rental/management';
    case UserRole.CUSTOMER: return '/account/profile';
    default:                return '/auth/login';
  }
}

@Component({
  selector: 'rentafit-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class Login implements OnInit {
  
  private readonly config = inject(APP_CONFIG);
  title = signal(this.config.appName);
  
  username = '';
  password = '';
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      this.router.navigate([returnUrl || resolveHomeRoute(user?.role)]);
    }
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.username, this.password).subscribe({
      next: (user) => {
        const destination = this.resolvePostLoginRoute(user);

        this.router.navigate([destination]).then(
          (success) => {
            if (!success) {
              console.warn('Acesso negado, redirecionando...');
              this.router.navigate([resolveHomeRoute(user.role)]);
            }
            this.isLoading.set(false);
          },
          (error) => {
            this.isLoading.set(false);
            console.error('Erro ao redirecionar após login:', error);
          }
        );
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erro ao realizar login');
        console.error('Erro no login:', error);
      }
    });
  }

  private resolvePostLoginRoute(user: User): string {
    if (!user.pinConfigured) {
      return '/auth/setup-credentials';
    }
    if (user.passwordExpired) {
      return '/auth/change-password';
    }
    return this.route.snapshot.queryParams['returnUrl'] || resolveHomeRoute(user.role);
  }
}

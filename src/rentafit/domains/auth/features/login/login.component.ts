import { Component, signal, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../data/user.model';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';

@Component({
  selector: 'rentafit-login',
  imports: [FormsModule, CommonModule],
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
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home/dashboard';
      this.router.navigate([returnUrl]);
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
              this.router.navigate(['/customer/search']);
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
    if (user.pin == null) {
      return '/auth/setup-credentials';
    }
    if (user.passwordExpired) {
      return '/auth/change-password';
    }
    return this.route.snapshot.queryParams['returnUrl'] || '/home/dashboard';
  }
}

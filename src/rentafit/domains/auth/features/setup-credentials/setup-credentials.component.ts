import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FirstUseFlowService } from '../../services/first-use-flow.service';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';

@Component({
  selector: 'rentafit-setup-credentials',
  imports: [FormsModule, CommonModule],
  templateUrl: './setup-credentials.component.html',
  styleUrl: './setup-credentials.component.css'
})
export class SetupCredentialsComponent {

  private readonly config = inject(APP_CONFIG);
  title = signal(this.config.appName);

  newPassword = '';
  confirmPassword = '';
  pin = '';
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  private static readonly PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+]).{8,}$/;
  private static readonly PIN_REGEX = /^\d{4}$/;

  constructor(
    private readonly authService: AuthService,
    private readonly firstUseFlowService: FirstUseFlowService,
    private readonly router: Router
  ) {}

  get passwordErrors(): string[] {
    const errors: string[] = [];
    if (!this.newPassword) return errors;
    if (this.newPassword.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(this.newPassword)) errors.push('Pelo menos 1 letra maiúscula');
    if (!/\d/.test(this.newPassword)) errors.push('Pelo menos 1 número');
    if (!/[@$!%*?&#+]/.test(this.newPassword)) errors.push('Pelo menos 1 caractere especial (@$!%*?&#+)');
    return errors;
  }

  get pinError(): string | null {
    if (!this.pin) return null;
    return SetupCredentialsComponent.PIN_REGEX.test(this.pin) ? null : 'PIN deve ter exatamente 4 dígitos numéricos';
  }

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  get isFormValid(): boolean {
    return SetupCredentialsComponent.PASSWORD_REGEX.test(this.newPassword)
      && this.newPassword === this.confirmPassword
      && SetupCredentialsComponent.PIN_REGEX.test(this.pin);
  }

  submit(): void {
    if (!this.isFormValid) {
      this.errorMessage.set('Corrija os erros antes de continuar.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.setupCredentials(this.newPassword, this.pin).subscribe({
      next: () => {
        this.isLoading.set(false);
        const user = this.authService.getCurrentUser();
        if (!user) {
          this.router.navigate(['/auth/login']);
          return;
        }
        this.firstUseFlowService.resolveAfterCredentials(user).subscribe({
          next: (route) => this.router.navigate([route]),
          error: (err: Error) => this.errorMessage.set(err.message || 'Erro ao resolver próxima etapa.')
        });
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Erro ao configurar credenciais.');
      }
    });
  }
}

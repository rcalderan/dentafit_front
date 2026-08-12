import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IssuerSetupService } from '../../services/issuer-setup.service';
import { IssuerInfo } from '../../data/issuer.model';
import { resolveHomeRoute } from '../../utils/role-route.util';

@Component({
  selector: 'rentafit-issuer-confirm',
  imports: [FormsModule, CommonModule],
  templateUrl: './issuer-confirm.component.html',
  styleUrl: './issuer-confirm.component.css'
})
export class IssuerConfirmComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly issuerSetupService = inject(IssuerSetupService);
  private readonly router = inject(Router);

  cnpj = '';
  issuerInfo = signal<IssuerInfo | null>(null);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.prefillFromUser();
    this.loadIssuerInfo();
  }

  submit(): void {
    const cleaned = this.cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      this.errorMessage.set('CNPJ deve conter 14 dígitos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.setupIssuerCnpj(cleaned).subscribe({
      next: () => this.navigateHome(),
      error: (err: Error) => this.handleError(err)
    });
  }

  private prefillFromUser(): void {
    const user = this.authService.getCurrentUser();
    this.cnpj = user?.issuerCnpj ?? '';
  }

  private loadIssuerInfo(): void {
    this.issuerSetupService.getCurrentIssuer().subscribe({
      next: (issuer) => {
        this.issuerInfo.set(issuer);
        if (!this.cnpj && issuer) {
          this.cnpj = issuer.cnpj;
        }
      },
      error: (err: Error) => this.errorMessage.set(err.message || 'Erro ao carregar emitente ativo.')
    });
  }

  private navigateHome(): void {
    this.isLoading.set(false);
    const user = this.authService.getCurrentUser();
    this.router.navigate([resolveHomeRoute(user?.role)]);
  }

  private handleError(err: Error): void {
    this.isLoading.set(false);
    this.errorMessage.set(err.message || 'Erro ao vincular CNPJ.');
  }
}

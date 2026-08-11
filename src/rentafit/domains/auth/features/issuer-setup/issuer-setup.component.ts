import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IssuerSetupService } from '../../services/issuer-setup.service';
import { IssuerSetupRequest } from '../../data/issuer.model';
import { resolveHomeRoute } from '../../utils/role-route.util';

@Component({
  selector: 'rentafit-issuer-setup',
  imports: [FormsModule, CommonModule],
  templateUrl: './issuer-setup.component.html',
  styleUrl: './issuer-setup.component.css'
})
export class IssuerSetupComponent {
  private readonly authService = inject(AuthService);
  private readonly issuerSetupService = inject(IssuerSetupService);
  private readonly router = inject(Router);

  cnpj = '';
  razaoSocial = '';
  nomeFantasia = '';
  ie = '';
  im = '';
  crt = '1';
  fone = '';
  logradouro = '';
  numero = '';
  bairro = '';
  municipioCodigo = '';
  municipioNome = '';
  uf = '';
  cep = '';
  paisCodigo = '1058';
  paisNome = 'BRASIL';

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  submit(): void {
    const validationError = this.validate();
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = this.buildRequest();
    this.issuerSetupService.configureIssuer(request).subscribe({
      next: () => this.linkIssuerToUser(request.cnpj),
      error: (err: Error) => this.handleError(err)
    });
  }

  private buildRequest(): IssuerSetupRequest {
    return {
      cnpj: this.cnpj.replace(/\D/g, ''),
      razaoSocial: this.razaoSocial.trim(),
      nomeFantasia: this.nomeFantasia.trim() || undefined,
      ie: this.ie.trim() || undefined,
      im: this.im.trim() || undefined,
      crt: this.crt,
      fone: this.fone.trim() || undefined,
      logradouro: this.logradouro.trim(),
      numero: this.numero.trim(),
      bairro: this.bairro.trim(),
      municipioCodigo: this.municipioCodigo.trim(),
      municipioNome: this.municipioNome.trim(),
      uf: this.uf.trim().toUpperCase(),
      cep: this.cep.replace(/\D/g, ''),
      paisCodigo: this.paisCodigo.trim(),
      paisNome: this.paisNome.trim()
    };
  }

  private linkIssuerToUser(cnpj: string): void {
    this.authService.setupIssuerCnpj(cnpj).subscribe({
      next: () => this.navigateHome(),
      error: (err: Error) => this.handleError(err)
    });
  }

  private navigateHome(): void {
    this.isLoading.set(false);
    const user = this.authService.getCurrentUser();
    this.router.navigate([resolveHomeRoute(user?.role)]);
  }

  private handleError(err: Error): void {
    this.isLoading.set(false);
    this.errorMessage.set(err.message || 'Erro ao configurar emitente.');
  }

  private validate(): string | null {
    const cnpj = this.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return 'CNPJ deve conter 14 dígitos.';
    if (!this.razaoSocial.trim()) return 'Razão Social é obrigatória.';
    if (!this.crt) return 'CRT é obrigatório.';
    if (!this.uf.trim() || this.uf.trim().length !== 2) return 'UF deve conter 2 letras.';
    if (!this.logradouro.trim()) return 'Logradouro é obrigatório.';
    if (!this.numero.trim()) return 'Número é obrigatório.';
    if (!this.bairro.trim()) return 'Bairro é obrigatório.';
    if (!this.municipioCodigo.trim()) return 'Código do município é obrigatório.';
    if (!this.municipioNome.trim()) return 'Nome do município é obrigatório.';
    const cep = this.cep.replace(/\D/g, '');
    if (cep.length !== 8) return 'CEP deve conter 8 dígitos.';
    return null;
  }
}

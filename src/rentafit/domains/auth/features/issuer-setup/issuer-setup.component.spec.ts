import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IssuerSetupComponent } from './issuer-setup.component';
import { AuthService } from '../../services/auth.service';
import { IssuerSetupService } from '../../services/issuer-setup.service';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { UserRole } from '../../data/user.model';

describe('IssuerSetupComponent', () => {
  let component: IssuerSetupComponent;
  let authService: {
    setupIssuerCnpj: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let issuerSetupService: {
    configureIssuer: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      setupIssuerCnpj: vi.fn(),
      getCurrentUser: vi.fn().mockReturnValue({ role: UserRole.ADMIN }),
    };
    issuerSetupService = { configureIssuer: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [IssuerSetupComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: IssuerSetupService, useValue: issuerSetupService },
        { provide: Router, useValue: router },
        { provide: APP_CONFIG, useValue: { appName: 'Rentafit Test' } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(IssuerSetupComponent).componentInstance;
  });

  it('cria o componente', () => {
    expect(component).toBeTruthy();
  });

  it('exibe erro de validação quando CNPJ está incompleto', () => {
    component.cnpj = '123';
    component.submit();
    expect(component.errorMessage()).toBe('CNPJ deve conter 14 dígitos.');
  });

  it('configura emitente e vincula ao usuário', () => {
    fillValidForm(component);
    issuerSetupService.configureIssuer.mockReturnValue(of({
      cnpj: '08299621000120',
      razaoSocial: 'Emitente',
      certificateConfigured: false,
      crt: '1',
      logradouro: 'Rua',
      numero: '0',
      bairro: 'Centro',
      municipioCodigo: '3548906',
      municipioNome: 'Sao Carlos',
      uf: 'SP',
      cep: '13560000',
      paisCodigo: '1058',
      paisNome: 'BRASIL',
    }));
    authService.setupIssuerCnpj.mockReturnValue(of({ issuerCnpj: '08299621000120' }));

    component.submit();

    expect(issuerSetupService.configureIssuer).toHaveBeenCalled();
    expect(authService.setupIssuerCnpj).toHaveBeenCalledWith('08299621000120');
    expect(router.navigate).toHaveBeenCalledWith(['/finance/dashboard']);
  });

  it('exibe erro quando configuração do emitente falha', () => {
    fillValidForm(component);
    issuerSetupService.configureIssuer.mockReturnValue(throwError(() => new Error('Erro no servidor')));

    component.submit();

    expect(component.errorMessage()).toBe('Erro no servidor');
    expect(component.isLoading()).toBe(false);
  });
});

function fillValidForm(component: IssuerSetupComponent): void {
  component.cnpj = '08.299.621/0001-20';
  component.razaoSocial = 'NOIVA MODAS E ACESSORIOS LTDA';
  component.crt = '1';
  component.uf = 'SP';
  component.logradouro = 'Rua Teste';
  component.numero = '0';
  component.bairro = 'Centro';
  component.municipioCodigo = '3548906';
  component.municipioNome = 'Sao Carlos';
  component.cep = '13560-000';
  component.paisCodigo = '1058';
  component.paisNome = 'BRASIL';
}

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IssuerConfirmComponent } from './issuer-confirm.component';
import { AuthService } from '../../services/auth.service';
import { IssuerSetupService } from '../../services/issuer-setup.service';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { UserRole } from '../../data/user.model';

describe('IssuerConfirmComponent', () => {
  let component: IssuerConfirmComponent;
  let authService: {
    setupIssuerCnpj: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let issuerSetupService: {
    getCurrentIssuer: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      setupIssuerCnpj: vi.fn(),
      getCurrentUser: vi.fn().mockReturnValue({ role: UserRole.EMPLOYEE, issuerCnpj: '' }),
    };
    issuerSetupService = { getCurrentIssuer: vi.fn().mockReturnValue(of(null)) };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [IssuerConfirmComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: IssuerSetupService, useValue: issuerSetupService },
        { provide: Router, useValue: router },
        { provide: APP_CONFIG, useValue: { appName: 'Rentafit Test' } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(IssuerConfirmComponent).componentInstance;
  });

  it('cria o componente', () => {
    expect(component).toBeTruthy();
  });

  it('carrega CNPJ do usuário quando existente', () => {
    authService.getCurrentUser.mockReturnValue({ role: UserRole.EMPLOYEE, issuerCnpj: '08299621000120' });
    component.ngOnInit();
    expect(component.cnpj).toBe('08299621000120');
  });

  it('carrega CNPJ do emitente ativo quando usuário não tem', () => {
    issuerSetupService.getCurrentIssuer.mockReturnValue(of({
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
    component.ngOnInit();
    expect(component.cnpj).toBe('08299621000120');
  });

  it('vincula CNPJ e navega para home', () => {
    component.cnpj = '08299621000120';
    authService.setupIssuerCnpj.mockReturnValue(of({ issuerCnpj: '08299621000120' }));

    component.submit();

    expect(authService.setupIssuerCnpj).toHaveBeenCalledWith('08299621000120');
    expect(router.navigate).toHaveBeenCalledWith(['/rental/management']);
  });

  it('exibe erro para CNPJ inválido', () => {
    component.cnpj = '123';
    component.submit();
    expect(component.errorMessage()).toBe('CNPJ deve conter 14 dígitos.');
  });

  it('exibe erro quando vinculação falha', () => {
    component.cnpj = '08299621000120';
    authService.setupIssuerCnpj.mockReturnValue(throwError(() => new Error('Erro no servidor')));

    component.submit();

    expect(component.errorMessage()).toBe('Erro no servidor');
  });
});

import { TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { FirstUseFlowService } from './first-use-flow.service';
import { IssuerSetupService } from './issuer-setup.service';
import { User, UserRole } from '../data/user.model';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  username: 'user',
  role: UserRole.ADMIN,
  active: true,
  pinConfigured: true,
  passwordExpired: false,
  ...overrides,
});

describe('FirstUseFlowService', () => {
  let service: FirstUseFlowService;
  let issuerSetupService: { getCurrentIssuer: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    issuerSetupService = { getCurrentIssuer: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        FirstUseFlowService,
        { provide: IssuerSetupService, useValue: issuerSetupService },
      ],
    });

    service = TestBed.inject(FirstUseFlowService);
  });

  it('redireciona admin para setup do emitente quando não configurado', async () => {
    issuerSetupService.getCurrentIssuer.mockReturnValue(of(null));
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.ADMIN })));
    expect(route).toBe('/auth/issuer-setup');
  });

  it('redireciona admin para dashboard quando emitente já configurado', async () => {
    issuerSetupService.getCurrentIssuer.mockReturnValue(of({
      cnpj: '08299621000120',
      razaoSocial: 'Emitente',
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
      certificateConfigured: false,
    }));
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.ADMIN })));
    expect(route).toBe('/finance/dashboard');
  });

  it('redireciona usuário não-admin para confirmação de CNPJ quando não vinculado', async () => {
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.EMPLOYEE })));
    expect(route).toBe('/auth/issuer-confirm');
  });

  it('redireciona usuário não-admin para home quando CNPJ já vinculado', async () => {
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.MANAGER, issuerCnpj: '08299621000120' })));
    expect(route).toBe('/finance/dashboard');
  });

  it('redireciona CUSTOMER para home sem pedir confirmação de CNPJ', async () => {
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.CUSTOMER })));
    expect(route).toBe('/account/profile');
  });

  it('prioriza troca de senha sobre setup do emitente', async () => {
    issuerSetupService.getCurrentIssuer.mockReturnValue(of(null));
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ role: UserRole.ADMIN, passwordExpired: true })));
    expect(route).toBe('/auth/change-password');
  });

  it('prioriza configuração inicial de credenciais', async () => {
    const route = await lastValueFrom(service.resolvePostLoginRoute(buildUser({ pinConfigured: false })));
    expect(route).toBe('/auth/setup-credentials');
  });
});

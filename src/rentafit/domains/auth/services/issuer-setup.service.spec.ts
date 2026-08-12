import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IssuerSetupService } from './issuer-setup.service';
import { IssuerInfo, IssuerSetupRequest } from '../data/issuer.model';
import { AppConfig, APP_CONFIG } from '../../../shared/data/app-config.token';

describe('IssuerSetupService', () => {
  let service: IssuerSetupService;
  let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClient = { get: vi.fn(), post: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        IssuerSetupService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } as AppConfig },
        { provide: HttpClient, useValue: httpClient },
      ],
    });

    service = TestBed.inject(IssuerSetupService);
  });

  it('retorna o emitente ativo', async () => {
    const issuer: IssuerInfo = {
      cnpj: '08299621000120',
      razaoSocial: 'Emitente Teste',
      crt: '1',
      logradouro: 'Rua Teste',
      numero: '0',
      bairro: 'Centro',
      municipioCodigo: '3548906',
      municipioNome: 'Sao Carlos',
      uf: 'SP',
      cep: '13560000',
      paisCodigo: '1058',
      paisNome: 'BRASIL',
      certificateConfigured: false,
    };
    httpClient.get.mockReturnValue(of(issuer));

    const result = await lastValueFrom(service.getCurrentIssuer());

    expect(result).toEqual(issuer);
    expect(httpClient.get).toHaveBeenCalledWith('/api/nfe-api/issuer');
  });

  it('retorna null quando o emitente não está configurado (404)', async () => {
    httpClient.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const result = await lastValueFrom(service.getCurrentIssuer());

    expect(result).toBeNull();
  });

  it('propaga erros inesperados ao consultar emitente', async () => {
    httpClient.get.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 500,
      error: { message: 'server error' },
    })));

    await expect(lastValueFrom(service.getCurrentIssuer())).rejects.toThrow('server error');
  });

  it('envia requisição de configuração do emitente', async () => {
    const request: IssuerSetupRequest = {
      cnpj: '08299621000120',
      razaoSocial: 'Emitente Teste',
      crt: '1',
      logradouro: 'Rua Teste',
      numero: '0',
      bairro: 'Centro',
      municipioCodigo: '3548906',
      municipioNome: 'Sao Carlos',
      uf: 'SP',
      cep: '13560000',
      paisCodigo: '1058',
      paisNome: 'BRASIL',
    };
    const response: IssuerInfo = { ...request, certificateConfigured: false };
    httpClient.post.mockReturnValue(of(response));

    const result = await lastValueFrom(service.configureIssuer(request));

    expect(result).toEqual(response);
    expect(httpClient.post).toHaveBeenCalledWith('/api/nfe-api/issuer/setup', request);
  });
});

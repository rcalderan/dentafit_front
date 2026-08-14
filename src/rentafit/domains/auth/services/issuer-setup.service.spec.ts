import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { IssuerSetupService } from './issuer-setup.service';
import { IssuerBranchSetupRequest, IssuerInfo, IssuerSetupRequest } from '../data/issuer.model';
import { AppConfig, APP_CONFIG } from '../../../shared/data/app-config.token';

const baseIssuer: IssuerInfo = {
  cnpj: '08299621000120',
  rootCnpj: '08299621',
  branchOrder: '0001',
  digitoControle: '20',
  matriz: true,
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
    httpClient.get.mockReturnValue(of(baseIssuer));

    const result = await lastValueFrom(service.getCurrentIssuer());

    expect(result).toEqual(baseIssuer);
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
    const response: IssuerInfo = { ...baseIssuer };
    httpClient.post.mockReturnValue(of(response));

    const result = await lastValueFrom(service.configureIssuer(request));

    expect(result).toEqual(response);
    expect(httpClient.post).toHaveBeenCalledWith('/api/nfe-api/issuer/setup', request);
  });

  it('lista filiais do emitente', async () => {
    const branches: IssuerInfo[] = [baseIssuer];
    httpClient.get.mockReturnValue(of(branches));

    const result = await lastValueFrom(service.listBranches());

    expect(result).toEqual(branches);
    expect(httpClient.get).toHaveBeenCalledWith('/api/nfe-api/issuer/branches');
  });

  it('retorna lista vazia quando não há filiais (404)', async () => {
    httpClient.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const result = await lastValueFrom(service.listBranches());

    expect(result).toEqual([]);
  });

  it('envia requisição de cadastro de filial', async () => {
    const request: IssuerBranchSetupRequest = {
      cnpj: '08299621000200',
      logradouro: 'Rua Filial',
      numero: '1',
      bairro: 'Centro',
      municipioCodigo: '3548906',
      municipioNome: 'Sao Carlos',
      uf: 'SP',
      cep: '13560000',
    };
    const response: IssuerInfo = { ...baseIssuer, cnpj: request.cnpj, branchOrder: '0002', matriz: false };
    httpClient.post.mockReturnValue(of(response));

    const result = await lastValueFrom(service.configureBranch(request));

    expect(result).toEqual(response);
    expect(httpClient.post).toHaveBeenCalledWith('/api/nfe-api/issuer/branch', request);
  });

  it('propaga erro ao cadastrar filial', async () => {
    const request: IssuerBranchSetupRequest = {
      cnpj: '08299621000200',
      logradouro: 'Rua Filial',
      numero: '1',
      bairro: 'Centro',
      municipioCodigo: '3548906',
      municipioNome: 'Sao Carlos',
      uf: 'SP',
      cep: '13560000',
    };
    httpClient.post.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { message: 'Matriz não cadastrada' },
    })));

    await expect(lastValueFrom(service.configureBranch(request))).rejects.toThrow('Matriz não cadastrada');
  });
});

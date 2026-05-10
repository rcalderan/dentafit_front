import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { AddressService } from './address.service';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import { ErrorMessages } from '../../../shared/data/error-messages';

describe('AddressService', () => {
  let service: AddressService;
  let httpMock: HttpTestingController;

  const BASE = '/api/v1/addresses';

  const mockAddressResponse = {
    zipCode: '01310-100',
    street: 'Avenida Paulista',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AddressService,
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '', s3BucketUrl: '' } }
      ]
    });
    service = TestBed.inject(AddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── searchByZipCode — happy path ────────────────────────────────────────────

  it('faz GET no endpoint correto com CEP sanitizado', () => {
    service.searchByZipCode('01310-100').subscribe();

    const req = httpMock.expectOne(`${BASE}/find/01310100`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAddressResponse);
  });

  it('mapeia a resposta da API para IAddress corretamente', async () => {
    const promise = lastValueFrom(service.searchByZipCode('01310100'));

    httpMock.expectOne(`${BASE}/find/01310100`).flush(mockAddressResponse);

    const result = await promise;
    expect(result.zipCode).toBe('01310-100');
    expect(result.street).toBe('Avenida Paulista');
    expect(result.neighborhood).toBe('Bela Vista');
    expect(result.city).toBe('São Paulo');
    expect(result.state).toBe('SP');
  });

  it('remove máscara e traços do CEP antes de enviar', () => {
    service.searchByZipCode('01.310-100').subscribe();

    const req = httpMock.expectOne(`${BASE}/find/01310100`);
    req.flush(mockAddressResponse);
  });

  it('trim e uppercase no estado da resposta', async () => {
    const response = { ...mockAddressResponse, state: '  sp  ' };
    const promise = lastValueFrom(service.searchByZipCode('01310100'));

    httpMock.expectOne(`${BASE}/find/01310100`).flush(response);

    const result = await promise;
    expect(result.state).toBe('SP');
  });

  it('retorna strings vazias para campos ausentes na resposta', async () => {
    const response = { zipCode: null, street: null, neighborhood: null, city: null, state: null };
    const promise = lastValueFrom(service.searchByZipCode('01310100'));

    httpMock.expectOne(`${BASE}/find/01310100`).flush(response);

    const result = await promise;
    expect(result.zipCode).toBe('');
    expect(result.street).toBe('');
    expect(result.state).toBe('');
  });

  // ── searchByZipCode — validação de entrada ──────────────────────────────────

  it('rejeita imediatamente quando CEP é string vazia', async () => {
    const promise = lastValueFrom(service.searchByZipCode(''));

    httpMock.expectNone(`${BASE}/find/`);

    await expect(promise).rejects.toThrow('CEP não pode estar vazio');
  });

  it('rejeita imediatamente quando CEP é somente espaços', async () => {
    const promise = lastValueFrom(service.searchByZipCode('   '));

    await expect(promise).rejects.toThrow('CEP não pode estar vazio');
  });

  // ── handleError — HTTP errors ───────────────────────────────────────────────

  it('mapeia HTTP 400 para mensagem de CEP inválido', async () => {
    const promise = lastValueFrom(service.searchByZipCode('00000000'));

    httpMock
      .expectOne(`${BASE}/find/00000000`)
      .flush({}, { status: 400, statusText: 'Bad Request' });

    await expect(promise).rejects.toThrow(ErrorMessages.ZIP_CODE_INVALID);
  });

  it('mapeia HTTP 404 para mensagem de CEP não encontrado', async () => {
    const promise = lastValueFrom(service.searchByZipCode('99999999'));

    httpMock
      .expectOne(`${BASE}/find/99999999`)
      .flush({}, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toThrow(ErrorMessages.ZIP_CODE_NOT_FOUND);
  });

  it('mapeia HTTP 500 para mensagem de erro de servidor', async () => {
    const promise = lastValueFrom(service.searchByZipCode('01310100'));

    httpMock
      .expectOne(`${BASE}/find/01310100`)
      .flush({}, { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toThrow(ErrorMessages.SERVER_ERROR);
  });

  it('mapeia HTTP 0 (sem conexão) para mensagem de erro de conexão', async () => {
    const promise = lastValueFrom(service.searchByZipCode('01310100'));

    httpMock
      .expectOne(`${BASE}/find/01310100`)
      .flush({}, { status: 0, statusText: 'Unknown Error' });

    await expect(promise).rejects.toThrow(ErrorMessages.CONNECTION_ERROR);
  });
});

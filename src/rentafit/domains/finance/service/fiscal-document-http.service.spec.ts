import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { FiscalDocumentHttpService } from './fiscal-document-http.service';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import { IEmitInvoiceRequest } from '../data/fiscal-document.types';

const appConfig = {
  appName: 'RentAFit Test',
  apiBaseUrl: '',
  s3BucketUrl: '',
  fiscalDefaults: {
    nfse: {
      nbsCode: '1.0101',
      cityCode: '3550308',
      serviceDescription: 'Locação de trajes e vestuário',
      ibsRate: 0.025,
      cbsRate: 0.015,
      isqnRate: 0.0,
    },
    nfe: {
      ncm: '99999999',
      cfop: '5102',
      unit: 'UN',
    },
  },
};

describe('FiscalDocumentHttpService', () => {
  let service: FiscalDocumentHttpService;
  let httpMock: HttpTestingController;

  const nfeRequest: IEmitInvoiceRequest = {
    fiscalDocumentType: 'NFE',
    origin: 'SALES',
    originId: 'order-1',
    customerId: 'cust-1',
    value: 1234.56,
    natureOperation: 'Venda de mercadoria',
    purpose: 'NORMAL',
  };

  const nfseRequest: IEmitInvoiceRequest = {
    fiscalDocumentType: 'NFSE',
    origin: 'RENTAL',
    originId: 'contract-1',
    customerId: 'cust-1',
    value: 800.0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FiscalDocumentHttpService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });
    service = TestBed.inject(FiscalDocumentHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('emite NF-e para /api/nfe/emit mapeando AUTHORIZED para EMITTED', async () => {
    const promise = lastValueFrom(service.emit(nfeRequest));
    const req = httpMock.expectOne('/api/nfe/emit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      customerId: 'cust-1',
      natureOperation: 'Venda de mercadoria',
      origin: 'SALES',
      originId: 'order-1',
      items: [
        {
          productCode: 'order-1',
          description: 'Venda de mercadoria',
          ncm: '99999999',
          cfop: '5102',
          unit: 'UN',
          quantity: 1,
          unitValue: 1234.56,
        },
      ],
    });
    req.flush({
      accessKey: '12345678901234567890123456789012345678901234',
      protocol: '123456789012345',
      status: 'AUTHORIZED',
      authorizedXml: '<nfe></nfe>',
    });

    const doc = await promise;
    expect(doc.type).toBe('NFE');
    expect(doc.status).toBe('EMITTED');
    expect(doc.accessKey).toHaveLength(44);
  });

  it('emite NFS-e para /api/billing/invoices/emit com defaults fiscais', async () => {
    const promise = lastValueFrom(service.emit(nfseRequest));
    const req = httpMock.expectOne('/api/billing/invoices/emit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      customerId: 'cust-1',
      serviceValue: 800.0,
      nbsCode: '1.0101',
      cityCode: '3550308',
      serviceDescription: 'Locação de trajes e vestuário',
      ibsRate: 0.025,
      cbsRate: 0.015,
      isqnRate: 0.0,
      origin: 'RENTAL',
      originId: 'contract-1',
    });
    req.flush({
      id: 'nfse-uuid',
      accessKey: '12345678901234567890123456789012345678901234567890',
      invoiceNumber: 123456,
      protocol: 'PR123456789',
      status: 'AUTHORIZED',
      issueDate: '2026-06-21T12:00:00-03:00',
      serviceValue: 800.0,
    });

    const doc = await promise;
    expect(doc.type).toBe('NFSE');
    expect(doc.status).toBe('EMITTED');
    expect(doc.id).toBe('nfse-uuid');
    expect(doc.number).toBe('123456');
  });

  it('consulta status de NFS-e via /api/billing/invoices/{id}', async () => {
    const current = { id: 'nfse-uuid', type: 'NFSE' as const, status: 'PENDING_EMISSION' as const, value: 800 };
    const promise = lastValueFrom(service.checkStatus(current));
    const req = httpMock.expectOne('/api/billing/invoices/nfse-uuid');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'nfse-uuid',
      type: 'NFSE',
      status: 'AUTHORIZED',
      accessKey: '12345678901234567890123456789012345678901234567890',
      number: 123456,
      protocol: 'PR123456789',
      issueDate: '2026-06-21T12:00:00-03:00',
      totalValue: 800,
    });

    const doc = await promise;
    expect(doc.status).toBe('EMITTED');
    expect(doc.number).toBe('123456');
  });

  it('rejeitado no backend mapeia para DENIED', async () => {
    const promise = lastValueFrom(service.emit(nfeRequest));
    httpMock
      .expectOne('/api/nfe/emit')
      .flush({ accessKey: '12345678901234567890123456789012345678901234', status: 'REJECTED' });

    const doc = await promise;
    expect(doc.status).toBe('DENIED');
  });

  it('downloadXml busca blob em /api/billing/invoices/chave/{accessKey}/xml', async () => {
    const promise = lastValueFrom(service.downloadXml('CHAVE-50'));
    const req = httpMock.expectOne('/api/billing/invoices/chave/CHAVE-50/xml');
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['<xml/>'], { type: 'application/xml' }));

    const blob = await promise;
    expect(blob.type).toBe('application/xml');
  });

  it('downloadDanfe busca blob em /api/billing/invoices/chave/{accessKey}/pdf', async () => {
    const promise = lastValueFrom(service.downloadDanfe('CHAVE-50'));
    const req = httpMock.expectOne('/api/billing/invoices/chave/CHAVE-50/pdf');
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['PDF'], { type: 'application/pdf' }));

    const blob = await promise;
    expect(blob.type).toBe('application/pdf');
  });

  it('cancel retorna erro pois endpoint não existe no backend', async () => {
    await expect(
      lastValueFrom(service.cancel({ id: 'x', type: 'NFE', status: 'EMITTED' }, { reason: 'Erro' })),
    ).rejects.toThrow('Cancelamento');
  });

  it('list retorna erro pois endpoint de listagem ainda não existe no backend', async () => {
    await expect(lastValueFrom(service.list({ type: 'NFE' }))).rejects.toThrow('Listagem');
  });

  it('findById retorna erro pois endpoint ainda não existe no backend', async () => {
    await expect(lastValueFrom(service.findById('x'))).rejects.toThrow('Consulta de nota fiscal');
  });
});

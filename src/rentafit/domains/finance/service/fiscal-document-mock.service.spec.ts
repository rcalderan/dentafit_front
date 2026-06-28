import { lastValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalDocumentMockService } from './fiscal-document-mock.service';
import { IEmitInvoiceRequest, IFiscalDocument } from '../data/fiscal-document.types';

/** Avança os timers fake até resolver o Observable com `delay`. */
async function resolve<T>(source: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(2000);
  return source;
}

describe('FiscalDocumentMockService', () => {
  let service: FiscalDocumentMockService;

  const nfeRequest: IEmitInvoiceRequest = {
    fiscalDocumentType: 'NFE',
    origin: 'SALES',
    value: 1234.56,
    natureOperation: 'Venda de mercadoria',
    purpose: 'NORMAL',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    service = new FiscalDocumentMockService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emite em PENDING_EMISSION com protocolo de envio', async () => {
    const doc = await resolve(lastValueFrom(service.emit(nfeRequest)));
    expect(doc.status).toBe('PENDING_EMISSION');
    expect(doc.type).toBe('NFE');
    expect(doc.value).toBe(1234.56);
    expect(doc.sendProtocol).toMatch(/^\d{34}$/);
  });

  it('autoriza para EMITTED com chave de 44 dígitos (NF-e)', async () => {
    const pending = await resolve(lastValueFrom(service.emit(nfeRequest)));
    const emitted = await resolve(lastValueFrom(service.checkStatus(pending)));
    expect(emitted.status).toBe('EMITTED');
    expect(emitted.accessKey).toHaveLength(44);
    expect(emitted.number).toMatch(/^\d{3}\.\d{3}\.\d{3}$/);
    expect(emitted.protocol).toMatch(/^\d{15}$/);
  });

  it('gera chave de 50 dígitos para NFS-e', async () => {
    const pending = await resolve(
      lastValueFrom(service.emit({ ...nfeRequest, fiscalDocumentType: 'NFSE', origin: 'RENTAL' })),
    );
    const emitted = await resolve(lastValueFrom(service.checkStatus(pending)));
    expect(emitted.accessKey).toHaveLength(50);
  });

  it('cancela uma nota emitida preservando a chave e gerando protocolo de cancelamento', async () => {
    const pending = await resolve(lastValueFrom(service.emit(nfeRequest)));
    const emitted = await resolve(lastValueFrom(service.checkStatus(pending)));
    const cancelled = await resolve(
      lastValueFrom(service.cancel(emitted, { reason: 'Mercadoria devolvida pelo cliente' })),
    );
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.accessKey).toBe(emitted.accessKey);
    expect(cancelled.cancelReason).toBe('Mercadoria devolvida pelo cliente');
    expect(cancelled.cancelProtocol).toMatch(/^\d{15}$/);
  });

  it('reemite uma nota cancelada retornando ao fluxo PENDING_EMISSION', async () => {
    const cancelled: IFiscalDocument = {
      id: 'NFE-x',
      type: 'NFE',
      status: 'CANCELLED',
      value: 500,
    };
    const reissued = await resolve(lastValueFrom(service.reemit(cancelled)));
    expect(reissued.status).toBe('PENDING_EMISSION');
    expect(reissued.value).toBe(500);
  });

  it('envia e-mail retornando sucesso', async () => {
    const ok = await resolve(
      lastValueFrom(service.sendEmail('NFE-x', { includeDanfe: true, includeXml: true })),
    );
    expect(ok).toBe(true);
  });

  it('downloadXml retorna um Blob XML', async () => {
    const blob = await resolve(lastValueFrom(service.downloadXml('1234567890')));
    expect(blob.type).toBe('application/xml');
  });

  it('downloadDanfe retorna um Blob PDF', async () => {
    const blob = await resolve(lastValueFrom(service.downloadDanfe('1234567890')));
    expect(blob.type).toBe('application/pdf');
  });
});

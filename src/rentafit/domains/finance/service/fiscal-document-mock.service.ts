import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  FiscalDocumentType,
  FiscalOrigin,
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IEmitInvoiceRequest,
  IFiscalDocument,
  IFiscalListParams,
  IPage,
} from '../data/fiscal-document.types';
import { FiscalDocumentService } from './fiscal-document.service';

/**
 * Serviço MOCKADO de emissão de documentos fiscais (NF-e modelo 55 e NFS-e).
 *
 * Fase atual: simula o ciclo de vida sem backend. As assinaturas espelham os
 * DTOs de `br.com.rentafit.billing` (InvoiceEmissionRequestDTO / NfeEmissionRequest)
 * para que a troca pela implementação HTTP real seja transparente.
 *
 * Endpoints reais previstos:
 *  - POST /api/billing/invoices/emit
 *  - GET  /api/billing/invoices/{id}
 *  - GET  /api/billing/invoices/chave/{chave}/xml | /pdf
 */
@Injectable({ providedIn: 'root' })
export class FiscalDocumentMockService extends FiscalDocumentService {
  /** Latência simulada de rede/autorizador, em milissegundos. */
  private readonly latencyMs = 900;

  /** Store em memória usado apenas pela listagem mockada (`list`/`findById`). */
  private readonly store: IFiscalDocument[] = this.seedDocuments();

  /** Persiste o documento fiscal retornado pela emissão. */
  save(doc: IFiscalDocument): Observable<IFiscalDocument> {
    this.upsert(doc);
    return of(doc).pipe(delay(this.latencyMs));
  }

  /**
   * Inicia a emissão. Retorna o documento em `PENDING_EMISSION` com protocolo
   * de envio — a autorização final é obtida via `checkStatus`.
   */
  emit(request: IEmitInvoiceRequest): Observable<IFiscalDocument> {
    const now = new Date().toISOString();
    const doc: IFiscalDocument = {
      id: this.randomId(request.fiscalDocumentType),
      type: request.fiscalDocumentType,
      status: 'PENDING_EMISSION',
      value: request.value,
      natureOperation: request.natureOperation,
      purpose: request.purpose,
      customerEmail: request.customerEmail,
      origin: request.origin,
      originId: request.originId,
      sendProtocol: this.randomDigits(34),
      sentAt: now,
    };
    this.upsert(doc);
    return of(doc).pipe(delay(this.latencyMs));
  }

  /** Consulta o resultado da emissão; resolve para `EMITTED` (autorizada). */
  checkStatus(current: IFiscalDocument): Observable<IFiscalDocument> {
    return of(current).pipe(
      delay(this.latencyMs),
      map(doc => this.authorize(doc)),
      map(doc => this.upsert(doc)),
    );
  }

  /** Cancela uma nota autorizada dentro do prazo legal. */
  cancel(current: IFiscalDocument, request: ICancelInvoiceRequest): Observable<IFiscalDocument> {
    const cancelled: IFiscalDocument = {
      ...current,
      status: 'CANCELLED',
      cancelReason: request.reason,
      cancelledAt: new Date().toISOString(),
      cancelProtocol: this.randomDigits(15),
      cancelXmlUrl: `mock://fiscal/${current.id}/cancel.xml`,
    };
    this.upsert(cancelled);
    return of(cancelled).pipe(delay(this.latencyMs));
  }

  /** Reinicia o fluxo de emissão para uma nota previamente cancelada. */
  reemit(current: IFiscalDocument): Observable<IFiscalDocument> {
    return this.emit({
      fiscalDocumentType: current.type,
      origin: 'MANUAL',
      value: current.value ?? 0,
      natureOperation: current.natureOperation,
      purpose: current.purpose,
      customerEmail: current.customerEmail,
    });
  }

  /** Simula o envio do XML/DANFE por e-mail. */
  sendEmail(_id: string, _request: IEmailInvoiceRequest): Observable<boolean> {
    return of(true).pipe(delay(this.latencyMs));
  }

  /** Simula download do XML autorizado. */
  downloadXml(_accessKey: string): Observable<Blob> {
    return of(new Blob(['<nfe></nfe>'], { type: 'application/xml' })).pipe(delay(this.latencyMs));
  }

  /** Simula download do DANFE/PDF. */
  downloadDanfe(_accessKey: string): Observable<Blob> {
    return of(new Blob(['PDF'], { type: 'application/pdf' })).pipe(delay(this.latencyMs));
  }

  /** Lista documentos fiscais mockados, filtrando e paginando em memória. */
  list(params: IFiscalListParams): Observable<IPage<IFiscalDocument>> {
    const filtered = this.store.filter(doc => this.matchesFilter(doc, params));
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    const result: IPage<IFiscalDocument> = {
      content,
      number: page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
    };
    return of(result).pipe(delay(this.latencyMs));
  }

  /** Busca um documento fiscal mockado pelo id. */
  findById(id: string): Observable<IFiscalDocument> {
    const found = this.store.find(doc => doc.id === id);
    if (!found) {
      return throwError(() => new Error(`Nota fiscal ${id} não encontrada.`));
    }
    return of(found).pipe(delay(this.latencyMs));
  }

  private matchesFilter(doc: IFiscalDocument, params: IFiscalListParams): boolean {
    if (params.type && doc.type !== params.type) return false;
    if (params.origin && doc.origin !== params.origin) return false;
    if (params.status && doc.status !== params.status) return false;
    return true;
  }

  /** Insere ou atualiza um documento no store mockado, mantendo-o listável. */
  private upsert(doc: IFiscalDocument): IFiscalDocument {
    const index = this.store.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      this.store[index] = doc;
    } else {
      this.store.unshift(doc);
    }
    return doc;
  }

  /** Gera notas fiscais fictícias para popular a listagem mockada. */
  private seedDocuments(): IFiscalDocument[] {
    const seeds: Array<Partial<IFiscalDocument> & { type: FiscalDocumentType; origin: FiscalOrigin }> = [
      { type: 'NFE', origin: 'SALES', status: 'EMITTED', customerName: 'Maria Souza', value: 350 },
      { type: 'NFE', origin: 'SALES', status: 'CANCELLED', customerName: 'João Pereira', value: 120 },
      { type: 'NFE', origin: 'SALES', status: 'PENDING_EMISSION', customerName: 'Ana Lima', value: 890 },
      { type: 'NFSE', origin: 'RENTAL', status: 'EMITTED', customerName: 'Carlos Silva', value: 450 },
      { type: 'NFSE', origin: 'RENTAL', status: 'DENIED', customerName: 'Beatriz Santos', value: 210 },
      { type: 'NFSE', origin: 'RENTAL', status: 'EMITTED', customerName: 'Fernanda Costa', value: 680 },
    ];
    return seeds.map(seed => this.toSeededDocument(seed));
  }

  private toSeededDocument(
    seed: Partial<IFiscalDocument> & { type: FiscalDocumentType; origin: FiscalOrigin },
  ): IFiscalDocument {
    const base: IFiscalDocument = {
      id: this.randomId(seed.type),
      type: seed.type,
      origin: seed.origin,
      status: seed.status ?? 'EMITTED',
      customerName: seed.customerName,
      value: seed.value,
      emissionDate: new Date().toISOString(),
    };
    return base.status === 'EMITTED' ? this.authorize(base) : base;
  }

  /** Gera os dados de autorização (número, chave, protocolo, links). */
  private authorize(doc: IFiscalDocument): IFiscalDocument {
    const keyLength = doc.type === 'NFE' ? 44 : 50;
    return {
      ...doc,
      status: 'EMITTED',
      number: this.formatInvoiceNumber(),
      series: '1',
      accessKey: this.randomDigits(keyLength),
      emissionDate: new Date().toISOString(),
      protocol: this.randomDigits(15),
      xmlUrl: `mock://fiscal/${doc.id}/nota.xml`,
      danfeUrl: `mock://fiscal/${doc.id}/danfe.pdf`,
    };
  }

  private formatInvoiceNumber(): string {
    const n = Math.floor(Math.random() * 999_999_999)
      .toString()
      .padStart(9, '0');
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}`;
  }

  private randomDigits(length: number): string {
    let out = '';
    while (out.length < length) {
      out += Math.floor(Math.random() * 10).toString();
    }
    return out.slice(0, length);
  }

  private randomId(type: FiscalDocumentType): string {
    return `${type}-${this.randomDigits(12)}-${Date.now()}`;
  }
}

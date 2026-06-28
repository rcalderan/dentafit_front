import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  FiscalDocumentType,
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IEmitInvoiceRequest,
  IFiscalDocument,
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
      sendProtocol: this.randomDigits(34),
      sentAt: now,
    };
    return of(doc).pipe(delay(this.latencyMs));
  }

  /** Consulta o resultado da emissão; resolve para `EMITTED` (autorizada). */
  checkStatus(current: IFiscalDocument): Observable<IFiscalDocument> {
    return of(current).pipe(
      delay(this.latencyMs),
      map(doc => this.authorize(doc)),
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

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import {
  FiscalDocumentType,
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IEmitInvoiceRequest,
  IFiscalDocument,
  IFiscalListParams,
  InvoiceStatusApi,
  IPage,
} from '../data/fiscal-document.types';
import { FiscalDocumentService } from './fiscal-document.service';

/** Resposta do backend para emissão de NFS-e (InvoiceEmissionResponseDTO). */
interface INfseEmitResponse {
  id: string;
  accessKey: string;
  invoiceNumber?: number;
  protocol?: string;
  status: string;
  issueDate?: string;
  processingDate?: string;
  serviceValue?: number;
}

/** Resposta do backend para emissão de NF-e (NfeResponse). */
interface INfeEmitResponse {
  accessKey: string;
  protocol?: string;
  cStat?: string;
  xMotivo?: string;
  status: string;
  authorizedXml?: string;
}

/** Documento fiscal persistido no backend (entidade FiscalDocument). */
interface IBackendFiscalDocument {
  id: string;
  type: string;
  status: string;
  accessKey?: string;
  protocol?: string;
  number?: number;
  series?: string;
  authorizationDate?: string;
  issueDate?: string;
  totalValue?: number;
  rejectionReason?: string;
  signedXml?: string;
  authorizedXml?: string;
}

/**
 * Serviço HTTP real de emissão de documentos fiscais. Consome os endpoints do
 * backend Rentafit: `/api/nfe/emit` (NF-e) e `/api/billing/invoices/*` (NFS-e).
 *
 * O ambiente é controlado por `APP_CONFIG.apiBaseUrl` (vazio em dev => proxy).
 * A aplicação deve ser configurada para apontar para homologação, nunca
 * produção, quando emitir notas reais.
 */
@Injectable({ providedIn: 'root' })
export class FiscalDocumentHttpService extends FiscalDocumentService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  emit(request: IEmitInvoiceRequest): Observable<IFiscalDocument> {
    return request.fiscalDocumentType === 'NFE'
      ? this.emitNfe(request)
      : this.emitNfse(request);
  }

  /** NF-e é síncrona: AUTHORIZED = EMITTED, REJECTED = DENIED. */
  private emitNfe(request: IEmitInvoiceRequest): Observable<IFiscalDocument> {
    const defaults = this.config.fiscalDefaults?.nfe;
    if (!defaults) {
      return throwError(() => new Error('Configuração fiscal de NF-e ausente em APP_CONFIG.'));
    }
    const body = {
      customerId: request.customerId,
      natureOperation: request.natureOperation ?? 'Venda de mercadoria',
      origin: request.origin,
      originId: request.originId,
      items: [
        {
          productCode: request.originId ?? 'ITEM-1',
          description: request.natureOperation ?? 'Venda de mercadoria',
          ncm: defaults.ncm,
          cfop: request.cfop ?? defaults.cfop,
          unit: defaults.unit,
          quantity: 1,
          unitValue: request.value,
        },
      ],
    };
    return this.http
      .post<INfeEmitResponse>(this.url('/api/nfe/emit'), body)
      .pipe(map((res) => this.toFiscalDocument('NFE', res, request)));
  }

  /** NFS-e: endpoint do Portal Nacional. Pode ser 201 (síncrona) ou 202 (assíncrona). */
  private emitNfse(request: IEmitInvoiceRequest): Observable<IFiscalDocument> {
    const defaults = this.config.fiscalDefaults?.nfse;
    if (!defaults) {
      return throwError(() => new Error('Configuração fiscal de NFS-e ausente em APP_CONFIG.'));
    }
    const body = {
      customerId: request.customerId,
      serviceValue: request.value,
      nbsCode: request.nbsCode ?? defaults.nbsCode,
      serviceDescription: request.serviceDescription ?? defaults.serviceDescription,
      cityCode: request.cityCode ?? defaults.cityCode,
      ibsRate: defaults.ibsRate,
      cbsRate: defaults.cbsRate,
      isqnRate: defaults.isqnRate,
      origin: request.origin,
      originId: request.originId,
    };
    return this.http
      .post<INfseEmitResponse>(this.url('/api/billing/invoices/emit'), body)
      .pipe(map((res) => this.toFiscalDocument('NFSE', res, request)));
  }

  /**
   * Consulta status no backend. Para NFS-e, usa `/api/billing/invoices/{id}`.
   * Para NF-e, não existe endpoint de consulta ainda — mantém o documento atual.
   */
  checkStatus(current: IFiscalDocument): Observable<IFiscalDocument> {
    if (current.type === 'NFE') {
      return throwError(() => new Error('Consulta de status de NF-e ainda não disponível no backend.'));
    }
    return this.http
      .get<IBackendFiscalDocument>(this.url(`/api/billing/invoices/${current.id}`))
      .pipe(map((doc) => this.mergeBackendDocument(current, doc)));
  }

  cancel(
    _current: IFiscalDocument,
    _request: ICancelInvoiceRequest,
  ): Observable<IFiscalDocument> {
    return throwError(() => new Error('Cancelamento de nota fiscal ainda não disponível no backend.'));
  }

  reemit(_current: IFiscalDocument): Observable<IFiscalDocument> {
    return throwError(() => new Error('Reemissão de nota fiscal ainda não disponível no backend.'));
  }

  sendEmail(_id: string, _request: IEmailInvoiceRequest): Observable<boolean> {
    return throwError(() => new Error('Envio de e-mail de nota fiscal ainda não disponível no backend.'));
  }

  downloadXml(accessKey: string): Observable<Blob> {
    return this.http.get(this.url(`/api/billing/invoices/chave/${accessKey}/xml`), {
      responseType: 'blob',
    });
  }

  downloadDanfe(accessKey: string): Observable<Blob> {
    return this.http.get(this.url(`/api/billing/invoices/chave/${accessKey}/pdf`), {
      responseType: 'blob',
    });
  }

  /**
   * Listagem de notas fiscais ainda não disponível no backend (endpoint em
   * definição conjunta com o time de backend). Fase 1 usa `FiscalDocumentMockService`.
   */
  list(_params: IFiscalListParams): Observable<IPage<IFiscalDocument>> {
    return throwError(() => new Error('Listagem de notas fiscais ainda não disponível no backend.'));
  }

  /** Consulta de nota fiscal por id ainda não disponível no backend. */
  findById(_id: string): Observable<IFiscalDocument> {
    return throwError(() => new Error('Consulta de nota fiscal por id ainda não disponível no backend.'));
  }

  private url(path: string): string {
    const base = this.config.apiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  private toFiscalDocument(
    type: FiscalDocumentType,
    response: INfeEmitResponse | INfseEmitResponse,
    request: IEmitInvoiceRequest,
  ): IFiscalDocument {
    if (type === 'NFE') {
      const nfe = response as INfeEmitResponse;
      return {
        id: `NFE-${nfe.accessKey.slice(0, 12)}`,
        type: 'NFE',
        status: this.mapStatus(nfe.status),
        accessKey: nfe.accessKey,
        protocol: nfe.protocol,
        value: request.value,
        natureOperation: request.natureOperation,
        purpose: request.purpose,
        emissionDate: new Date().toISOString(),
        xmlUrl: nfe.authorizedXml,
      };
    }

    const nfse = response as INfseEmitResponse;
    return {
      id: nfse.id,
      type: 'NFSE',
      status: this.mapStatus(nfse.status),
      accessKey: nfse.accessKey,
      number: nfse.invoiceNumber?.toString(),
      protocol: nfse.protocol,
      value: request.value,
      serviceDescription: request.serviceDescription,
      emissionDate: nfse.issueDate ?? nfse.processingDate ?? new Date().toISOString(),
    };
  }

  private mergeBackendDocument(
    current: IFiscalDocument,
    doc: IBackendFiscalDocument,
  ): IFiscalDocument {
    return {
      ...current,
      status: this.mapStatus(doc.status),
      accessKey: doc.accessKey ?? current.accessKey,
      protocol: doc.protocol ?? current.protocol,
      number: doc.number?.toString() ?? current.number,
      series: doc.series ?? current.series,
      emissionDate: doc.authorizationDate ?? doc.issueDate ?? current.emissionDate,
      xmlUrl: doc.authorizedXml ?? doc.signedXml ?? current.xmlUrl,
    };
  }

  private mapStatus(backendStatus: string): InvoiceStatusApi {
    switch (backendStatus?.toUpperCase()) {
      case 'AUTHORIZED':
      case 'EMITTED':
      case 'AUTORIZADA':
        return 'EMITTED';
      case 'PENDING':
      case 'SIGNED':
      case 'TRANSMITTED':
      case 'PENDING_EMISSION':
      case 'PROCESSING':
      case 'EM PROCESSAMENTO':
        return 'PENDING_EMISSION';
      case 'REJECTED':
      case 'DENIED':
      case 'REJEITADA':
      case 'NEGADA':
        return 'DENIED';
      case 'CANCELLED':
      case 'CANCELADA':
        return 'CANCELLED';
      default:
        return 'PENDING_EMISSION';
    }
  }
}

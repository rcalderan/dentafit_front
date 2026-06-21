/**
 * Tipos fiscais compartilhados para emissão de documentos (NF-e modelo 55 e
 * NFS-e). Fonte canônica de `InvoiceStatusApi` — reexportada pelos domínios
 * sales/rental para evitar divergência de definição.
 */

export type FiscalDocumentType = 'NFE' | 'NFSE';

export type FiscalOrigin = 'SALES' | 'RENTAL' | 'MANUAL';

export type InvoiceStatusApi =
  | 'NONE' // Nenhuma nota emitida
  | 'PENDING_EMISSION' // Em processamento (aguardando autorizador)
  | 'EMITTED' // Autorizada com sucesso
  | 'CANCELLED' // Cancelada
  | 'DENIED'; // Negada/Rejeitada

export type InvoicePurposeApi = 'NORMAL' | 'COMPLEMENTARY' | 'ADJUSTMENT' | 'RETURN';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusApi, string> = {
  NONE: 'Nenhuma nota emitida',
  PENDING_EMISSION: 'Em processamento',
  EMITTED: 'Emitida com sucesso',
  CANCELLED: 'Cancelada',
  DENIED: 'Negada',
};

export const INVOICE_PURPOSE_LABELS: Record<InvoicePurposeApi, string> = {
  NORMAL: 'Normal',
  COMPLEMENTARY: 'Complementar',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolução',
};

/** Documento fiscal retornado pelo serviço (mockado nesta fase). */
export interface IFiscalDocument {
  id: string;
  type: FiscalDocumentType;
  status: InvoiceStatusApi;
  number?: string; // Número formatado (ex.: 000.123.456)
  series?: string;
  accessKey?: string; // 44 dígitos (NF-e) / 50 (NFS-e)
  emissionDate?: string;
  sendProtocol?: string; // Protocolo de envio (enquanto PENDING_EMISSION)
  sentAt?: string;
  protocol?: string; // Protocolo de autorização
  value?: number;
  natureOperation?: string;
  purpose?: InvoicePurposeApi;
  cancelReason?: string;
  cancelledAt?: string;
  cancelProtocol?: string;
  xmlUrl?: string;
  danfeUrl?: string;
  cancelXmlUrl?: string;
  customerEmail?: string;
}

/** Contexto da origem (pedido de venda ou contrato de locação). */
export interface IFiscalContext {
  origin: FiscalOrigin;
  originId?: string;
  isPaid: boolean; // Habilita emissão somente quando pago
  totalValue: number;
  customerId?: string;
  customerName?: string;
  customerDocument?: string;
  customerEmail?: string;
}

/** Requisição de emissão — espelha InvoiceEmissionRequestDTO/NfeEmissionRequest. */
export interface IEmitInvoiceRequest {
  fiscalDocumentType: FiscalDocumentType;
  origin: FiscalOrigin;
  originId?: string;
  customerId?: string;
  customerEmail?: string;
  value: number;
  // NF-e (modelo 55)
  natureOperation?: string;
  purpose?: InvoicePurposeApi;
  cfop?: string;
  // NFS-e (serviço)
  nbsCode?: string;
  serviceDescription?: string;
  cityCode?: string;
}

export interface ICancelInvoiceRequest {
  reason: string;
}

export interface IEmailInvoiceRequest {
  email?: string;
  includeDanfe: boolean;
  includeXml: boolean;
}

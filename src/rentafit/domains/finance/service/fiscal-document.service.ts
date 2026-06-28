import { Observable } from 'rxjs';
import {
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IEmitInvoiceRequest,
  IFiscalDocument,
} from '../data/fiscal-document.types';

/**
 * Contrato abstrato para serviços de emissão de documentos fiscais
 * (NF-e modelo 55 e NFS-e). Permite trocar entre mock e HTTP real sem
 * alterar os componentes.
 */
export abstract class FiscalDocumentService {
  abstract emit(request: IEmitInvoiceRequest): Observable<IFiscalDocument>;
  abstract checkStatus(current: IFiscalDocument): Observable<IFiscalDocument>;
  abstract cancel(
    current: IFiscalDocument,
    request: ICancelInvoiceRequest,
  ): Observable<IFiscalDocument>;
  abstract reemit(current: IFiscalDocument): Observable<IFiscalDocument>;
  abstract sendEmail(id: string, request: IEmailInvoiceRequest): Observable<boolean>;
  abstract downloadXml(accessKey: string): Observable<Blob>;
  abstract downloadDanfe(accessKey: string): Observable<Blob>;
}

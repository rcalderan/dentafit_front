import { Directive, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import {
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IFiscalDocument,
  INVOICE_STATUS_LABELS,
  InvoiceStatusApi,
} from '../../data/fiscal-document.types';
import { formatFiscalCurrency, formatFiscalDateTime } from './fiscal-format.util';

/**
 * Base compartilhada pelos componentes de detalhe de nota fiscal
 * (`nfe-view-detail` e `nfse-view-detail`). Busca o documento pelo `id` da
 * rota e disponibiliza as ações de download, e-mail e cancelamento.
 */
@Directive()
export abstract class FiscalDetailBase implements OnInit {
  protected readonly fiscalService = inject(FiscalDocumentService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  /** Rota de retorno para a listagem (ex.: `/sales/nfe-view`). */
  abstract readonly listRoute: string;

  protected readonly document = signal<IFiscalDocument | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);
  protected readonly showCancelModal = signal(false);
  protected readonly showEmailModal = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMsg.set('Nota fiscal não informada.');
      return;
    }
    this.loadDocument(id);
  }

  protected loadDocument(id: string): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.fiscalService
      .findById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: doc => this.document.set(doc),
        error: (err: Error) => this.errorMsg.set(err.message),
      });
  }

  protected backToList(): void {
    this.router.navigate([this.listRoute]);
  }

  protected downloadXml(): void {
    if (!this.document()?.xmlUrl) return;
    this.flashSuccess('Download do XML iniciado (mock).');
  }

  protected downloadDanfe(): void {
    if (!this.document()?.danfeUrl) return;
    this.flashSuccess('Download do documento iniciado (mock).');
  }

  protected confirmEmail(request: IEmailInvoiceRequest): void {
    const current = this.document();
    if (!current) return;
    this.showEmailModal.set(false);
    this.isProcessing.set(true);
    this.errorMsg.set(null);
    this.fiscalService
      .sendEmail(current.id, request)
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: () => this.flashSuccess('E-mail enviado.'),
        error: (err: Error) => this.errorMsg.set(err.message),
      });
  }

  protected confirmCancel(reason: string): void {
    const current = this.document();
    if (!current) return;
    const request: ICancelInvoiceRequest = { reason };
    this.showCancelModal.set(false);
    this.isProcessing.set(true);
    this.errorMsg.set(null);
    this.fiscalService
      .cancel(current, request)
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: doc => {
          this.document.set(doc);
          this.flashSuccess('Nota cancelada.');
        },
        error: (err: Error) => this.errorMsg.set(err.message),
      });
  }

  protected formatCurrency(value: number | undefined): string {
    return formatFiscalCurrency(value);
  }

  protected formatDateTime(iso: string | undefined): string {
    return formatFiscalDateTime(iso);
  }

  protected statusLabel(status: InvoiceStatusApi): string {
    return INVOICE_STATUS_LABELS[status];
  }

  private flashSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

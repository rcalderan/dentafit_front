import { Directive, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import {
  FiscalDocumentType,
  ICancelInvoiceRequest,
  IEmailInvoiceRequest,
  IEmitInvoiceRequest,
  IFiscalContext,
  IFiscalDocument,
  INVOICE_STATUS_LABELS,
  InvoiceStatusApi,
} from '../../data/fiscal-document.types';

/**
 * Base compartilhada pelos componentes de emissão fiscal (`nfe-emission` e
 * `nfse-emission`). Concentra estado e fluxo comuns; cada componente concreto
 * define o `fiscalType` e monta a requisição específica via `buildEmitRequest`.
 *
 * Decorada com `@Directive()` para que os inputs/outputs por função sejam
 * herdados corretamente pelos `@Component` filhos (padrão Angular de herança).
 */
@Directive()
export abstract class FiscalEmissionBase implements OnInit {
  protected readonly fiscalService = inject(FiscalDocumentService);

  /** Tipo do documento — definido pelo componente concreto. */
  abstract readonly fiscalType: FiscalDocumentType;

  /** Monta a requisição de emissão com os campos específicos do tipo. */
  protected abstract buildEmitRequest(): IEmitInvoiceRequest;

  readonly context = input.required<IFiscalContext>();
  /** Documento já existente (ex.: vindo do pedido/contrato persistido). */
  readonly initialDocument = input<IFiscalDocument | null>(null);

  /** Emitido sempre que o documento muda, para o pai persistir o estado. */
  readonly changed = output<IFiscalDocument>();

  protected readonly document = signal<IFiscalDocument | null>(null);
  protected readonly isProcessing = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);
  protected readonly showCancelModal = signal(false);
  protected readonly showEmailModal = signal(false);

  protected readonly statusLabels = INVOICE_STATUS_LABELS;

  protected readonly status = computed<InvoiceStatusApi>(
    () => this.document()?.status ?? 'NONE',
  );

  /** Cliente possui documento (CPF/CNPJ) válido para emissão. */
  protected readonly hasCustomerDocument = computed(
    () => (this.context().customerDocument ?? '').trim().length > 0,
  );

  /** Emissão liberada: pedido pago e sem nota ativa. */
  protected readonly canEmit = computed(
    () => this.context().isPaid && this.status() === 'NONE',
  );

  ngOnInit(): void {
    this.document.set(this.initialDocument());
  }

  protected emit(): void {
    if (!this.context().isPaid) {
      this.errorMsg.set('O pedido precisa estar pago para emitir a nota fiscal.');
      return;
    }
    this.run(this.fiscalService.emit(this.buildEmitRequest()), 'Emissão iniciada — aguardando autorizador.');
  }

  protected checkStatus(): void {
    const current = this.document();
    if (!current) return;
    this.run(this.fiscalService.checkStatus(current), 'Nota autorizada com sucesso.');
  }

  protected confirmCancel(reason: string): void {
    const current = this.document();
    if (!current) return;
    const request: ICancelInvoiceRequest = { reason };
    this.showCancelModal.set(false);
    this.run(this.fiscalService.cancel(current, request), 'Nota cancelada.');
  }

  protected reemit(): void {
    const current = this.document();
    if (!current) return;
    this.run(this.fiscalService.reemit(current), 'Reemissão iniciada — aguardando autorizador.');
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

  protected downloadXml(): void {
    if (!this.document()?.xmlUrl) return;
    this.flashSuccess('Download do XML iniciado (mock).');
  }

  protected downloadDanfe(): void {
    if (!this.document()?.danfeUrl) return;
    this.flashSuccess('Download do DANFE iniciado (mock).');
  }

  protected formatCurrency(value: number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
  }

  protected formatDateTime(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR');
  }

  /** Executa uma operação fiscal padrão (loading + atualização + change). */
  private run(source: ReturnType<FiscalDocumentService['emit']>, okMsg: string): void {
    this.isProcessing.set(true);
    this.errorMsg.set(null);
    source.pipe(finalize(() => this.isProcessing.set(false))).subscribe({
      next: (doc: IFiscalDocument) => {
        this.document.set(doc);
        this.changed.emit(doc);
        this.flashSuccess(okMsg);
      },
      error: (err: Error) => this.errorMsg.set(err.message),
    });
  }

  private flashSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

import { Directive, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import {
  FiscalDocumentType,
  FiscalOrigin,
  IFiscalDocument,
  INVOICE_STATUS_LABELS,
  InvoiceStatusApi,
} from '../../data/fiscal-document.types';
import { formatFiscalCurrency, formatFiscalDateTime } from './fiscal-format.util';

/**
 * Base compartilhada pelos componentes de listagem/visualização de notas
 * fiscais (`nfe-view` e `nfse-view`). Cada componente concreto define o
 * `fiscalType`, a `origin` de negócio e a rota de detalhe.
 */
@Directive()
export abstract class FiscalListBase implements OnInit {
  protected readonly fiscalService = inject(FiscalDocumentService);
  protected readonly router = inject(Router);

  abstract readonly fiscalType: FiscalDocumentType;
  abstract readonly origin: FiscalOrigin;
  /** Prefixo de rota para navegação ao detalhe (ex.: `/sales/nfe-view`). */
  abstract readonly detailRoute: string;

  protected readonly documents = signal<IFiscalDocument[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly filterStatus = signal<InvoiceStatusApi | null>(null);

  ngOnInit(): void {
    this.loadDocuments();
  }

  protected loadDocuments(page = 0): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.fiscalService
      .list({
        page,
        size: 20,
        sort: 'issueDate,desc',
        type: this.fiscalType,
        origin: this.origin,
        status: this.filterStatus() ?? undefined,
      })
      .subscribe({
        next: response => this.applyPage(response),
        error: (err: Error) => {
          this.errorMsg.set(err.message);
          this.isLoading.set(false);
        },
      });
  }

  private applyPage(response: {
    content: IFiscalDocument[];
    number: number;
    totalPages: number;
    totalElements: number;
  }): void {
    this.documents.set(response.content);
    this.currentPage.set(response.number);
    this.totalPages.set(response.totalPages);
    this.totalElements.set(response.totalElements);
    this.isLoading.set(false);
  }

  protected onFilterChange(status: InvoiceStatusApi | null): void {
    this.filterStatus.set(status);
    this.loadDocuments(0);
  }

  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadDocuments(page);
    }
  }

  protected openDocument(id: string): void {
    this.router.navigate([this.detailRoute, id]);
  }

  protected formatCurrency(value: number | undefined): string {
    return formatFiscalCurrency(value);
  }

  protected formatDateTime(iso: string | undefined): string {
    return formatFiscalDateTime(iso);
  }

  protected getStatusClass(status: InvoiceStatusApi): string {
    return `status-${status.toLowerCase()}`;
  }

  protected statusLabel(status: InvoiceStatusApi): string {
    return INVOICE_STATUS_LABELS[status];
  }
}

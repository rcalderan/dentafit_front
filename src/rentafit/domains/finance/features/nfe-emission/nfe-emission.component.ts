import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FiscalEmissionBase } from '../fiscal-shared/fiscal-emission.base';
import { InvoiceCancelModalComponent } from '../fiscal-shared/invoice-cancel-modal.component';
import { InvoiceEmailModalComponent } from '../fiscal-shared/invoice-email-modal.component';
import { FiscalDocumentType, IEmitInvoiceRequest, InvoicePurposeApi } from '../../data/fiscal-document.types';

/**
 * Emissão de NF-e (modelo 55) para pedidos de venda. Estende a base fiscal
 * compartilhada, fornecendo natureza da operação e finalidade da operação.
 */
@Component({
  selector: 'rentafit-nfe-emission',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceCancelModalComponent, InvoiceEmailModalComponent],
  templateUrl: './nfe-emission.component.html',
  styleUrl: './nfe-emission.component.css',
})
export class NfeEmissionComponent extends FiscalEmissionBase {
  readonly fiscalType: FiscalDocumentType = 'NFE';

  protected readonly natureOperation = signal('Venda de mercadoria');
  protected readonly purpose = signal<InvoicePurposeApi>('NORMAL');

  /** Opções de finalidade da operação (valor + rótulo) exibidas no formulário. */
  protected readonly purposeOptions: ReadonlyArray<{ value: InvoicePurposeApi; label: string }> = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'COMPLEMENTARY', label: 'Complementar' },
    { value: 'ADJUSTMENT', label: 'Ajuste' },
    { value: 'RETURN', label: 'Devolução' },
  ];

  protected buildEmitRequest(): IEmitInvoiceRequest {
    const ctx = this.context();
    return {
      fiscalDocumentType: 'NFE',
      origin: 'SALES',
      originId: ctx.originId,
      customerId: ctx.customerId,
      customerEmail: ctx.customerEmail,
      value: ctx.totalValue,
      natureOperation: this.natureOperation(),
      purpose: this.purpose(),
    };
  }
}

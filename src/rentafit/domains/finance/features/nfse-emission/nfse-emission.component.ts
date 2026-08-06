import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FiscalEmissionBase } from '../fiscal-shared/fiscal-emission.base';
import { InvoiceCancelModalComponent } from '../fiscal-shared/invoice-cancel-modal.component';
import { InvoiceEmailModalComponent } from '../fiscal-shared/invoice-email-modal.component';
import { FiscalDocumentType, IEmitInvoiceRequest } from '../../data/fiscal-document.types';

/**
 * Emissão de NFS-e (serviço) para contratos de locação. Estende a base fiscal
 * compartilhada, fornecendo código NBS, descrição e município de prestação.
 */
@Component({
  selector: 'rentafit-nfse-emission',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceCancelModalComponent, InvoiceEmailModalComponent],
  templateUrl: './nfse-emission.component.html',
  styleUrl: './nfse-emission.component.css',
})
export class NfseEmissionComponent extends FiscalEmissionBase {
  readonly fiscalType: FiscalDocumentType = 'NFSE';

  protected readonly nbsCode = signal('');
  protected readonly serviceDescription = signal('Locação de trajes e vestuário');
  protected readonly cityCode = signal('');

  protected buildEmitRequest(): IEmitInvoiceRequest {
    const ctx = this.context();
    return {
      fiscalDocumentType: 'NFSE',
      origin: 'RENTAL',
      originId: ctx.originId,
      customerId: ctx.customerId,
      customerEmail: ctx.customerEmail,
      customerName: ctx.customerName,
      customerDocument: ctx.customerDocument,
      value: ctx.totalValue,
      nbsCode: this.nbsCode(),
      serviceDescription: this.serviceDescription(),
      cityCode: this.cityCode(),
    };
  }
}

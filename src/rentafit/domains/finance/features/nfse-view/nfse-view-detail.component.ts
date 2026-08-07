import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FiscalDetailBase } from '../fiscal-shared/fiscal-detail.base';
import { InvoiceCancelModalComponent } from '../fiscal-shared/invoice-cancel-modal.component';
import { InvoiceEmailModalComponent } from '../fiscal-shared/invoice-email-modal.component';

/**
 * Detalhe de uma NFS-e específica, acessado a partir da listagem `nfse-view`.
 */
@Component({
  selector: 'rentafit-nfse-view-detail',
  standalone: true,
  imports: [CommonModule, InvoiceCancelModalComponent, InvoiceEmailModalComponent],
  templateUrl: './nfse-view-detail.component.html',
  styleUrls: ['../fiscal-shared/fiscal-detail.css'],
})
export class NfseViewDetailComponent extends FiscalDetailBase {
  readonly listRoute = '/rental/nfse-view';
}

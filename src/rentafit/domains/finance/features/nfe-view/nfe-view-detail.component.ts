import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FiscalDetailBase } from '../fiscal-shared/fiscal-detail.base';
import { InvoiceCancelModalComponent } from '../fiscal-shared/invoice-cancel-modal.component';
import { InvoiceEmailModalComponent } from '../fiscal-shared/invoice-email-modal.component';

/**
 * Detalhe de uma NF-e específica, acessado a partir da listagem `nfe-view`.
 */
@Component({
  selector: 'rentafit-nfe-view-detail',
  standalone: true,
  imports: [CommonModule, InvoiceCancelModalComponent, InvoiceEmailModalComponent],
  templateUrl: './nfe-view-detail.component.html',
  styleUrls: ['../fiscal-shared/fiscal-detail.css'],
})
export class NfeViewDetailComponent extends FiscalDetailBase {
  readonly listRoute = '/sales/nfe-view';
}

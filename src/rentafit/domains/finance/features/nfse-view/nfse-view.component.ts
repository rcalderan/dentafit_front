import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FiscalListBase } from '../fiscal-shared/fiscal-list.base';
import { FiscalDocumentType, FiscalOrigin } from '../../data/fiscal-document.types';

/**
 * Listagem de NFS-e emitidas para contratos de locação. Estende a base fiscal
 * de listagem compartilhada, fornecendo tipo e origem do documento.
 */
@Component({
  selector: 'rentafit-nfse-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nfse-view.component.html',
  styleUrls: ['../fiscal-shared/fiscal-list.css'],
})
export class NfseViewComponent extends FiscalListBase {
  readonly fiscalType: FiscalDocumentType = 'NFSE';
  readonly origin: FiscalOrigin = 'RENTAL';
  readonly detailRoute = '/rental/nfse-view';
}

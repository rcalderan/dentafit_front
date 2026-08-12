import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FiscalListBase } from '../fiscal-shared/fiscal-list.base';
import { FiscalDocumentType, FiscalOrigin } from '../../data/fiscal-document.types';

/**
 * Listagem de NF-e (modelo 55) emitidas para pedidos de venda. Estende a base
 * fiscal de listagem compartilhada, fornecendo tipo e origem do documento.
 */
@Component({
  selector: 'rentafit-nfe-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nfe-view.component.html',
  styleUrls: ['../fiscal-shared/fiscal-list.css'],
})
export class NfeViewComponent extends FiscalListBase {
  readonly fiscalType: FiscalDocumentType = 'NFE';
  readonly origin: FiscalOrigin = 'SALES';
  readonly detailRoute = '/sales/nfe-view';
}

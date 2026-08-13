import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { FiscalEmissionBase } from '../fiscal-shared/fiscal-emission.base';
import { InvoiceCancelModalComponent } from '../fiscal-shared/invoice-cancel-modal.component';
import { InvoiceEmailModalComponent } from '../fiscal-shared/invoice-email-modal.component';
import {
  FiscalDocumentType,
  IEmitInvoiceRequest,
  INfeCustomerInfo,
  INfeItem,
  InvoicePurposeApi,
} from '../../data/fiscal-document.types';
import { CustomerService } from '../../../customer/service/customer.service';
import { ICustomer } from '../../../customer/data/Customer.interface';
import { IssuerSetupService } from '../../../auth/services/issuer-setup.service';
import { IssuerInfo } from '../../../auth/data/issuer.model';

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
export class NfeEmissionComponent extends FiscalEmissionBase implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly issuerService = inject(IssuerSetupService);

  readonly fiscalType: FiscalDocumentType = 'NFE';

  protected readonly natureOperation = signal('Venda de mercadoria');
  protected readonly purpose = signal<InvoicePurposeApi>('NORMAL');
  protected readonly customer = signal<ICustomer | null>(null);
  protected readonly isLoadingCustomer = signal(false);

  /** Emitentes disponíveis (matriz + filiais) para seleção na emissão. */
  protected readonly issuers = signal<IssuerInfo[]>([]);
  protected readonly selectedIssuerCnpj = signal<string | null>(null);
  protected readonly hasMultipleIssuers = computed(() => this.issuers().length > 1);

  /** Opções de finalidade da operação (valor + rótulo) exibidas no formulário. */
  protected readonly purposeOptions: ReadonlyArray<{ value: InvoicePurposeApi; label: string }> = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'COMPLEMENTARY', label: 'Complementar' },
    { value: 'ADJUSTMENT', label: 'Ajuste' },
    { value: 'RETURN', label: 'Devolução' },
  ];

  /** Cor do pill de XML: amarelo em falha, verde claro quando autorizado. */
  protected readonly xmlPillClass = computed(() =>
    this.errorXml() ? 'pill-warning' : this.document()?.xmlUrl ? 'pill-success' : '',
  );

  /** XML disponível para download (erro assinado ou XML autorizado). */
  protected readonly hasXml = computed(() => !!this.errorXml() || !!this.document()?.xmlUrl);

  constructor() {
    super();
    effect(() => {
      const customerId = this.context().customerId;
      if (!customerId) {
        this.customer.set(null);
        return;
      }
      this.loadCustomer(customerId);
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadIssuers();
  }

  private loadIssuers(): void {
    this.issuerService.listBranches().subscribe({
      next: (issuers) => {
        this.issuers.set(issuers);
        const matriz = issuers.find((i) => i.matriz);
        this.selectedIssuerCnpj.set(matriz?.cnpj ?? issuers[0]?.cnpj ?? null);
      },
      error: () => this.issuers.set([]),
    });
  }

  private loadCustomer(customerId: string): void {
    this.isLoadingCustomer.set(true);
    this.customerService
      .getCustomerById(customerId)
      .pipe(finalize(() => this.isLoadingCustomer.set(false)))
      .subscribe({
        next: (customer) => this.customer.set(customer),
        error: () => this.customer.set(null),
      });
  }

  protected buildEmitRequest(): IEmitInvoiceRequest {
    const ctx = this.context();
    return {
      fiscalDocumentType: 'NFE',
      origin: 'SALES',
      originId: ctx.originId,
      customerId: ctx.customerId,
      customerEmail: ctx.customerEmail,
      customerName: ctx.customerName,
      customerDocument: ctx.customerDocument,
      value: ctx.totalValue,
      natureOperation: this.natureOperation(),
      purpose: this.purpose(),
      customer: this.buildCustomerInfo(this.customer()),
      items: this.buildItems(ctx.items, ctx.totalValue),
      issuerCnpj: this.selectedIssuerCnpj() ?? undefined,
    };
  }

  private buildCustomerInfo(customer: ICustomer | null): INfeCustomerInfo {
    if (!customer) {
      throw new Error('Cliente não encontrado. É necessário um cliente cadastrado para emitir NF-e.');
    }
    const address = customer.address;
    if (!address) {
      throw new Error('Endereço do cliente não disponível para emissão de NF-e.');
    }
    return {
      name: customer.name,
      document: customer.document.replace(/\D/g, ''),
      street: address.street,
      number: customer.number || 'S/N',
      complement: customer.complement,
      neighborhood: address.neighborhood,
      cityName: address.city,
      state: address.state,
      zipCode: address.zipCode.replace(/\D/g, ''),
      phone: customer.phones?.[0],
    };
  }

  private buildItems(items: INfeItem[] | undefined, totalValue: number): INfeItem[] {
    const defaults = this.config.fiscalDefaults?.nfe;
    if (!defaults) {
      throw new Error('Configuração fiscal de NF-e ausente em APP_CONFIG.');
    }
    if (items && items.length > 0) {
      return items.map((item) => ({
        ...item,
        ncm: item.ncm || defaults.ncm,
        cfop: item.cfop || defaults.cfop,
        unit: item.unit || defaults.unit,
      }));
    }
    return [
      {
        productCode: 'ITEM-1',
        description: this.natureOperation(),
        ncm: defaults.ncm,
        cfop: defaults.cfop,
        unit: defaults.unit,
        quantity: 1,
        unitValue: totalValue,
      },
    ];
  }
}

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RentalContractService } from '../../rental/service/rental-contract.service';
import { IRentalContractResponse, IRentalContractSummaryResponse } from '../../rental/data/rental-contract-response.interface';
import { ContractStatusApi } from '../../rental/data/rental-api.types';
import { CustomerService, ICustomerPageResponse } from '../../customer/service/customer.service';
import { ICustomer } from '../../customer/data/Customer.interface';
import { ProductService } from '../../product/service/product.service';
import { IRentalItem } from '../../product/data/Product.interface';
import { PendingReturnsService, PendingReturnItem } from '../../rental/features/return/service/pending-returns.service';

export type SearchType = 'contract' | 'customer' | 'product';

type SearchResult =
  | { type: 'contract'; data: IRentalContractResponse }
  | { type: 'product';  data: IRentalItem };

interface IOverduePickupMock {
  legacyId: string;
  customerName: string;
  scheduledPickupDate: string;
}

interface ILateReturnMock {
  legacyId: string;
  customerName: string;
  returnDate: string;
  daysLate: number;
}

@Component({
  selector: 'rentafit-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class HomeDashboard implements OnInit {
  private readonly rentalContractService = inject(RentalContractService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly pendingReturnsService = inject(PendingReturnsService);
  private readonly router = inject(Router);

  // ── Recent contracts ──────────────────────────────────────────────────────
  readonly recentContracts = signal<IRentalContractSummaryResponse[]>([]);
  readonly isLoadingRecent = signal(false);
  readonly errorRecent = signal<string | null>(null);

  // ── Pending Returns (Devoluções Pendentes) ────────────────────────────────
  readonly pendingReturns = signal<PendingReturnItem[]>([]);
  readonly isLoadingPendingReturns = signal(false);
  readonly errorPendingReturns = signal<string | null>(null);
  readonly totalPendingReturns = computed(() => this.pendingReturns().length);

  // ── Search ────────────────────────────────────────────────────────────────
  readonly searchType = signal<SearchType>('contract');
  readonly searchQuery = signal('');
  readonly isSearching = signal(false);
  readonly searchResult = signal<SearchResult | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly customerSearchResults = signal<ICustomer[]>([]);
  readonly customerSearchPage = signal(0);
  readonly customerSearchTotalPages = signal(0);
  readonly customerSearchTotalElements = signal(0);
  readonly customerSearchAppliedName = signal('');

  private readonly customerSearchPageSize = 10;

  readonly searchPlaceholder = computed(() => {
    switch (this.searchType()) {
      case 'contract': return 'Nº do contrato (legacyId)';
      case 'customer': return 'Nome, CPF ou CNPJ';
      case 'product':  return 'Código legado da roupa';
    }
  });

  setSearchType(type: SearchType): void {
    this.searchType.set(type);
    this.searchQuery.set('');
    this.searchResult.set(null);
    this.clearCustomerSearchResults();
    this.searchError.set(null);
  }

  search(): void {
    const q = this.searchQuery().trim();
    if (!q && this.searchType() !== 'customer') return;

    this.isSearching.set(true);
    this.searchResult.set(null);
    this.searchError.set(null);
    this.clearCustomerSearchResults();

    switch (this.searchType()) {
      case 'contract':
        this.rentalContractService.getByLegacyId(q).subscribe({
          next: (data) => {
            this.handleSingleSearchResult({ type: 'contract', data });
            this.isSearching.set(false);
          },
          error: (err: unknown) => { this.searchError.set(this.resolveHttpError(err, 404, 'Contrato não encontrado.')); this.isSearching.set(false); },
        });
        break;

      case 'customer':
        this.customerSearchAppliedName.set(q);
        if (this.isCpfOrCnpj(q)) {
          this.searchCustomerByDocument(this.normalizeDocument(q));
        } else {
          this.searchCustomerPage(0);
        }
        break;

      case 'product':
        this.productService.getRentalItemByLegacyId(q).subscribe({
          next: (data) => {
            this.handleSingleSearchResult({ type: 'product', data });
            this.isSearching.set(false);
          },
          error: (err: unknown) => { this.searchError.set(this.resolveHttpError(err, 404, 'Roupa não encontrada.')); this.isSearching.set(false); },
        });
        break;
    }
  }

  searchCustomerNextPage(): void {
    const nextPage = this.customerSearchPage() + 1;
    if (nextPage >= this.customerSearchTotalPages()) return;
    this.searchCustomerPage(nextPage);
  }

  searchCustomerPreviousPage(): void {
    const previousPage = this.customerSearchPage() - 1;
    if (previousPage < 0) return;
    this.searchCustomerPage(previousPage);
  }

  openCustomerSearchResult(customer: ICustomer): void {
    this.router.navigate(['/customer/registration'], {
      queryParams: {
        legacyId: customer.legacyId,
        id: customer.id,
      },
    });
  }

  private searchCustomerPage(page: number): void {
    this.isSearching.set(true);
    this.searchError.set(null);

    this.customerService
      .listCustomers({
        name: this.customerSearchAppliedName(),
        page,
        size: this.customerSearchPageSize,
        sort: 'name,asc',
      })
      .subscribe({
        next: (response: ICustomerPageResponse) => {
          this.customerSearchResults.set(response.content);
          this.customerSearchPage.set(response.number);
          this.customerSearchTotalPages.set(response.totalPages);
          this.customerSearchTotalElements.set(response.totalElements);
          this.isSearching.set(false);

          if (response.totalElements === 1 && response.content.length === 1) {
            this.openCustomerSearchResult(response.content[0]);
          }
        },
        error: (err: unknown) => {
          this.searchError.set(this.resolveHttpError(err, 404, 'Nenhum cliente encontrado.', 'Erro ao buscar clientes.'));
          this.clearCustomerSearchResults();
          this.isSearching.set(false);
        },
      });
  }

  private searchCustomerByDocument(document: string): void {
    this.customerService.getCustomerByDocument(document).subscribe({
      next: (customer: ICustomer) => {
        this.customerSearchResults.set([customer]);
        this.customerSearchPage.set(0);
        this.customerSearchTotalPages.set(1);
        this.customerSearchTotalElements.set(1);
        this.isSearching.set(false);

        this.openCustomerSearchResult(customer);
      },
      error: (err: unknown) => {
        this.searchError.set(this.resolveHttpError(err, 404, 'Cliente não encontrado para o CPF/CNPJ informado.'));
        this.clearCustomerSearchResults();
        this.isSearching.set(false);
      },
    });
  }

  private normalizeDocument(value: string): string {
    return value.replace(/\D/g, '');
  }

  private isCpfOrCnpj(value: string): boolean {
    const digits = this.normalizeDocument(value);
    return digits.length === 11 || digits.length === 14;
  }

  private clearCustomerSearchResults(): void {
    this.customerSearchResults.set([]);
    this.customerSearchPage.set(0);
    this.customerSearchTotalPages.set(0);
    this.customerSearchTotalElements.set(0);
  }

  onSearchResultCardClick(): void {
    const result = this.searchResult();
    if (!result) return;
    this.openSearchResult(result);
  }

  private handleSingleSearchResult(result: SearchResult): void {
    this.searchResult.set(result);
    this.openSearchResult(result);
  }

  private openSearchResult(result: SearchResult): void {
    switch (result.type) {
      case 'contract':
        this.router.navigate(['/rental/new'], { queryParams: { id: result.data.id } });
        break;
      case 'product':
        this.router.navigate(['/product/registration'], {
          queryParams: {
            id: result.data.id,
            legacyId: result.data.legacyId,
          },
        });
        break;
    }
  }

  asContract(r: SearchResult): IRentalContractResponse { return (r as { type: 'contract'; data: IRentalContractResponse }).data; }
  asProduct(r: SearchResult):  IRentalItem             { return (r as { type: 'product';  data: IRentalItem }).data; }

  // ── Mock data: pickup overdue (awaiting customer to collect) ──────────────
  readonly overduePickupMock: IOverduePickupMock[] = [
    { legacyId: '2024-112', customerName: 'ANA PAULA FERREIRA', scheduledPickupDate: '2026-04-25' },
    { legacyId: '2024-118', customerName: 'MARCOS VINÍCIUS COSTA', scheduledPickupDate: '2026-04-26' },
    { legacyId: '2024-121', customerName: 'BEATRIZ SOUSA LIMA', scheduledPickupDate: '2026-04-27' },
  ];

  // ── Mock data: late returns (items not yet returned) ──────────────────────
  readonly lateReturnsMock: ILateReturnMock[] = [
    { legacyId: '2024-089', customerName: 'CARLOS EDUARDO MELO', returnDate: '2026-04-22', daysLate: 7 },
    { legacyId: '2024-095', customerName: 'PATRICIA ALMEIDA ROCHA', returnDate: '2026-04-23', daysLate: 6 },
    { legacyId: '2024-101', customerName: 'RAFAEL SANTOS BRAGA', returnDate: '2026-04-24', daysLate: 5 },
    { legacyId: '2024-107', customerName: 'FERNANDA OLIVEIRA DIAS', returnDate: '2026-04-25', daysLate: 4 },
  ];

  readonly totalOverduePickup = computed(() => this.overduePickupMock.length);
  readonly totalLateReturns = computed(() => this.lateReturnsMock.length);

  ngOnInit(): void {
    this.isLoadingRecent.set(true);
    this.rentalContractService
      .list({ page: 0, size: 5, sort: 'createdAt,desc' })
      .subscribe({
        next: (page) => {
          this.recentContracts.set(page.content);
          this.isLoadingRecent.set(false);
        },
        error: (err: unknown) => {
          this.errorRecent.set(this.resolveHttpError(err, null, 'Erro ao carregar contratos.'));
          this.isLoadingRecent.set(false);
        },
      });

    this.isLoadingPendingReturns.set(true);
    this.pendingReturnsService.getPendingReturns().subscribe({
      next: (items) => {
        this.pendingReturns.set(items);
        this.isLoadingPendingReturns.set(false);
      },
      error: (err: unknown) => {
        this.errorPendingReturns.set(this.resolveHttpError(err, null, 'Erro ao carregar devoluções pendentes.'));
        this.isLoadingPendingReturns.set(false);
      },
    });
  }

  navigateToReturn(contractId: string): void {
    this.router.navigate(['/rental/return', contractId]);
  }

  daysUntilReturnLabel(days: number): string {
    if (days < 0) return `${Math.abs(days)}d atrasado`;
    if (days === 0) return 'Hoje';
    return `${days}d restante${days > 1 ? 's' : ''}`;
  }

  daysUntilReturnClass(days: number): string {
    if (days < 0) return 'days-overdue';
    if (days === 0) return 'days-today';
    return 'days-remaining';
  }

  statusLabel(status: string | ContractStatusApi): string {
    const labels: Record<string, string> = {
      DRAFT: 'Proposta',
      SIGNED: 'Assinado',
      FINALIZED: 'Finalizado',
      REVISION: 'Revisão',
      SUPERSEDED: 'Substituído',
      CLOSED: 'Concluído',
    };
    return labels[String(status)] ?? String(status);
  }

  statusClass(status: string | ContractStatusApi): string {
    const classes: Record<string, string> = {
      DRAFT: 'status-draft',
      SIGNED: 'status-signed',
      FINALIZED: 'status-finalized',
      REVISION: 'status-revision',
      SUPERSEDED: 'status-superseded',
      CLOSED: 'status-closed',
    };
    return `status-badge ${classes[String(status)] ?? ''}`;
  }

  /**
   * Traduz um erro HTTP desconhecido para mensagem amigável.
   * Quando o status bate com notFoundStatus, retorna notFoundMsg.
   * Caso contrário retorna fallbackMsg (ou mensagem genérica).
   * Nunca expõe URL ou status HTTP ao usuário.
   */
  resolveHttpError(
    err: unknown,
    notFoundStatus: number | null,
    notFoundMsg: string,
    fallbackMsg = 'Ocorreu um erro. Tente novamente.'
  ): string {
    if (err instanceof HttpErrorResponse) {
      if (notFoundStatus !== null && err.status === notFoundStatus) return notFoundMsg;
      return fallbackMsg;
    }
    return fallbackMsg;
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
}

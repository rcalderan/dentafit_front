import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SalesOrderService, SalesListParams } from '../../service/sales-order.service';
import { ISalesOrderSummary } from '../../data/sales-order.interface';
import { SalesOrderStatus, SALES_ORDER_STATUS_LABELS } from '../../data/sales-order-status.enum';
import { SalesOrderStatusApi } from '../../data/sales-api.types';

@Component({
  selector: 'rentafit-sales-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-management.component.html',
  styleUrl: './sales-management.component.css',
})
export class SalesManagement implements OnInit {
  private readonly salesService = inject(SalesOrderService);
  private readonly router = inject(Router);

  protected readonly orders = signal<ISalesOrderSummary[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly filterStatus = signal<SalesOrderStatusApi | null>(null);
  protected readonly statusLabels = SALES_ORDER_STATUS_LABELS;
  protected readonly SalesOrderStatus = SalesOrderStatus;

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = 0): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const params: SalesListParams = {
      page,
      size: 20,
      sort: 'createdAt,desc',
    };

    const status = this.filterStatus();
    if (status) {
      params.status = status;
    }

    this.salesService.list(params).subscribe({
      next: (response) => {
        this.orders.set(response.content);
        this.currentPage.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  protected onFilterChange(status: SalesOrderStatusApi | null): void {
    this.filterStatus.set(status);
    this.loadOrders(0);
  }

  protected openOrder(id: string): void {
    this.router.navigate(['/sales/new'], { queryParams: { id } });
  }

  protected newSale(): void {
    this.router.navigate(['/sales/new']);
  }

  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadOrders(page);
    }
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}

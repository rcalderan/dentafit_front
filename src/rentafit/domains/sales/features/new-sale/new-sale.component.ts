import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SalesOrderService } from '../../service/sales-order.service';
import { CustomerService, ICustomerPageResponse } from '../../../customer/service/customer.service';
import { ProductService } from '../../../product/service/product.service';
import { ISalesOrder, ISalesOrderItem, ISalesPayment } from '../../data/sales-order.interface';
import {
  ISalesOrderCreateRequest,
  ISalesOrderUpdateRequest,
  ISalesOrderItemRequest,
  ISalesPaymentRequest,
  ICancelSalesOrderRequest,
} from '../../data/sales-order-request.interface';
import { SalesOrderStatus, SALES_ORDER_STATUS_LABELS } from '../../data/sales-order-status.enum';
import { SalesItemStatus, SALES_ITEM_STATUS_LABELS } from '../../data/sales-item-status.enum';
import { PaymentMethodApi, PaymentStatusApi, SalesOrderStatusApi } from '../../data/sales-api.types';
import { IRetailItem } from '../../../product/data/Product.interface';

/** Métodos de pagamento e seus labels (reutilizados do rental) */
const PAYMENT_METHOD_LABELS: Record<PaymentMethodApi, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_TRANSFER: 'Transferência',
};

@Component({
  selector: 'rentafit-new-sale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-sale.component.html',
  styleUrl: './new-sale.component.css',
})
export class NewSale implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly salesService = inject(SalesOrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);

  // ─── State ──────────────────────────────────────────────────────────────────

  protected readonly order = signal<ISalesOrder | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);

  // Customer search
  protected customerSearch = '';
  protected readonly customerResults = signal<Array<{ id: string; name: string; document: string }>>([]);
  protected readonly selectedCustomer = signal<{ id: string; name: string; document: string } | null>(null);

  // Items
  protected readonly showItemModal = signal(false);
  protected readonly retailProducts = signal<IRetailItem[]>([]);
  protected productSearch = '';
  protected readonly filteredProducts = signal<IRetailItem[]>([]);
  protected selectedProduct: IRetailItem | null = null;
  protected itemQuantity = 1;
  protected itemDiscount = 0;
  protected itemNeedsTailoring = false;
  protected itemTailoringNotes = '';

  // Payments
  protected readonly showPaymentModal = signal(false);
  protected paymentInstallment = 1;
  protected paymentDate = '';
  protected paymentMethod: PaymentMethodApi = 'PIX';
  protected paymentValue = 0;
  protected paymentInstallments = 1;
  protected paymentStatus: PaymentStatusApi = 'PENDING';

  // Notes & discount
  protected orderNotes = '';
  protected orderDiscount = 0;

  // Cancel
  protected readonly showCancelModal = signal(false);
  protected cancelReason = '';

  // ─── Computed ───────────────────────────────────────────────────────────────

  protected readonly isDraft = computed(() => {
    const o = this.order();
    return !o || o.status === 'DRAFT';
  });

  protected readonly canConfirm = computed(() => {
    const o = this.order();
    return !!o?.id && o.status === 'DRAFT' && (o.items?.length ?? 0) > 0;
  });

  protected readonly canCancel = computed(() => {
    const o = this.order();
    return !!o?.id && (o.status === 'DRAFT' || o.status === 'CONFIRMED');
  });

  protected readonly subtotal = computed(() => {
    const o = this.order();
    if (!o?.items) return 0;
    return o.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity) - item.discountValue, 0);
  });

  protected readonly totalValue = computed(() => {
    return Math.max(0, this.subtotal() - (this.order()?.discountValue ?? 0));
  });

  protected readonly paidValue = computed(() => {
    const o = this.order();
    if (!o?.payments) return 0;
    return o.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.value, 0);
  });

  protected readonly remainingValue = computed(() => {
    return Math.max(0, this.totalValue() - this.paidValue());
  });

  // ─── Enums for template ─────────────────────────────────────────────────────

  protected readonly statusLabels = SALES_ORDER_STATUS_LABELS;
  protected readonly itemStatusLabels = SALES_ITEM_STATUS_LABELS;
  protected readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected readonly paymentMethods = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethodApi[];

  // ─── Init ───────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const orderId = this.route.snapshot.queryParamMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
    this.loadRetailProducts();
  }

  private loadOrder(id: string): void {
    this.isLoading.set(true);
    this.salesService.getById(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (order) => {
        this.order.set(order);
        this.orderNotes = order.notes ?? '';
        this.orderDiscount = order.discountValue ?? 0;
        if (order.customerId) {
          this.selectedCustomer.set({
            id: order.customerId,
            name: order.customerName ?? '',
            document: order.customerDocument ?? '',
          });
        }
      },
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  private loadRetailProducts(): void {
    this.productService.listRetailItems({ page: 0, size: 200 }).subscribe({
      next: (page: { content: IRetailItem[] }) => {
        this.retailProducts.set(page.content);
        this.filteredProducts.set(page.content);
      },
      error: (err: Error) => console.error('Failed to load retail products:', err),
    });
  }

  // ─── Customer ───────────────────────────────────────────────────────────────

  protected searchCustomer(): void {
    if (this.customerSearch.length < 2) {
      this.customerResults.set([]);
      return;
    }
    this.customerService.listCustomers({ name: this.customerSearch, size: 10 }).subscribe({
      next: (page: ICustomerPageResponse) => {
        this.customerResults.set(
          page.content.map(c => ({ id: c.id!, name: c.name, document: c.document ?? '' }))
        );
      },
      error: () => this.customerResults.set([]),
    });
  }

  protected selectCustomer(customer: { id: string; name: string; document: string }): void {
    this.selectedCustomer.set(customer);
    this.customerResults.set([]);
    this.customerSearch = '';
  }

  protected clearCustomer(): void {
    this.selectedCustomer.set(null);
  }

  // ─── Item Modal ─────────────────────────────────────────────────────────────

  protected openItemModal(): void {
    this.selectedProduct = null;
    this.itemQuantity = 1;
    this.itemDiscount = 0;
    this.itemNeedsTailoring = false;
    this.itemTailoringNotes = '';
    this.productSearch = '';
    this.filteredProducts.set(this.retailProducts());
    this.showItemModal.set(true);
  }

  protected filterProducts(): void {
    const query = this.productSearch.toLowerCase();
    this.filteredProducts.set(
      this.retailProducts().filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.sku ?? '').toLowerCase().includes(query)
      )
    );
  }

  protected selectProduct(product: IRetailItem): void {
    this.selectedProduct = product;
  }

  protected confirmAddItem(): void {
    if (!this.selectedProduct) return;
    const current = this.order();
    const newItem: ISalesOrderItem = {
      retailProductId: this.selectedProduct.id!,
      sku: this.selectedProduct.sku ?? '',
      description: `${this.selectedProduct.name} — ${this.selectedProduct.size} ${this.selectedProduct.color}`,
      unitPrice: this.selectedProduct.value,
      quantity: this.itemQuantity,
      discountValue: this.itemDiscount,
      itemStatus: 'PENDING',
      needsTailoring: this.itemNeedsTailoring,
      tailoringNotes: this.itemTailoringNotes || undefined,
    };

    if (current) {
      this.order.set({ ...current, items: [...current.items, newItem] });
    } else {
      this.order.set({
        status: 'DRAFT',
        discountValue: this.orderDiscount,
        invoiceStatus: 'NONE',
        items: [newItem],
        payments: [],
      });
    }
    this.showItemModal.set(false);
  }

  protected removeItem(index: number): void {
    const current = this.order();
    if (!current || !this.isDraft()) return;
    const items = [...current.items];
    items.splice(index, 1);
    this.order.set({ ...current, items });
  }

  // ─── Payment Modal ──────────────────────────────────────────────────────────

  protected openPaymentModal(): void {
    const o = this.order();
    this.paymentInstallment = (o?.payments?.length ?? 0) + 1;
    this.paymentDate = new Date().toISOString().slice(0, 10);
    this.paymentMethod = 'PIX';
    this.paymentValue = this.remainingValue();
    this.paymentInstallments = 1;
    this.paymentStatus = 'PENDING';
    this.showPaymentModal.set(true);
  }

  protected confirmAddPayment(): void {
    if (this.paymentValue <= 0) return;
    const current = this.order();
    if (!current) return;

    const newPayment: ISalesPayment = {
      installmentNumber: this.paymentInstallment,
      paymentDate: this.paymentDate,
      paymentMethod: this.paymentMethod,
      value: this.paymentValue,
      installments: this.paymentInstallments,
      status: this.paymentStatus,
    };

    this.order.set({ ...current, payments: [...current.payments, newPayment] });
    this.showPaymentModal.set(false);
  }

  protected removePayment(index: number): void {
    const current = this.order();
    if (!current) return;
    const payments = [...current.payments];
    payments.splice(index, 1);
    this.order.set({ ...current, payments });
  }

  // ─── Save (Create/Update) ──────────────────────────────────────────────────

  protected save(): void {
    const o = this.order();
    if (!o) return;

    const items: ISalesOrderItemRequest[] = o.items.map(i => ({
      retailProductId: i.retailProductId,
      quantity: i.quantity,
      discountValue: i.discountValue,
      needsTailoring: i.needsTailoring,
      tailoringNotes: i.tailoringNotes,
    }));

    const payments: ISalesPaymentRequest[] = o.payments.map(p => ({
      installmentNumber: p.installmentNumber,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod as PaymentMethodApi,
      value: p.value,
      installments: p.installments,
      status: p.status as PaymentStatusApi,
    }));

    this.isSaving.set(true);
    this.errorMsg.set(null);

    if (o.id) {
      const request: ISalesOrderUpdateRequest = {
        customerId: this.selectedCustomer()?.id,
        notes: this.orderNotes,
        discountValue: this.orderDiscount,
        items,
        payments,
      };
      this.salesService.update(o.id, request).pipe(
        finalize(() => this.isSaving.set(false))
      ).subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.showSuccess('Pedido atualizado');
        },
        error: (err) => this.errorMsg.set(err.message),
      });
    } else {
      const request: ISalesOrderCreateRequest = {
        customerId: this.selectedCustomer()?.id,
        notes: this.orderNotes,
        discountValue: this.orderDiscount,
        items,
        payments,
      };
      this.salesService.create(request).pipe(
        finalize(() => this.isSaving.set(false))
      ).subscribe({
        next: (created) => {
          this.order.set(created);
          this.router.navigate(['/sales/new'], {
            queryParams: { id: created.id },
          });
          this.showSuccess('Pedido criado: ' + created.legacyId);
        },
        error: (err) => this.errorMsg.set(err.message),
      });
    }
  }

  // ─── Workflow Actions ───────────────────────────────────────────────────────

  protected confirm(): void {
    const o = this.order();
    if (!o?.id) return;
    this.isSaving.set(true);
    this.salesService.confirm(o.id).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.showSuccess('Pedido confirmado');
      },
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  protected openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  protected confirmCancel(): void {
    const o = this.order();
    if (!o?.id || !this.cancelReason) return;
    this.isSaving.set(true);
    const request: ICancelSalesOrderRequest = { reason: this.cancelReason };
    this.salesService.cancel(o.id, request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.showCancelModal.set(false);
        this.showSuccess('Pedido cancelado');
      },
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  protected markItemReady(itemId: string): void {
    const o = this.order();
    if (!o?.id) return;
    this.salesService.markItemReady(o.id, itemId).subscribe({
      next: (updated) => this.order.set(updated),
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  protected deliverItem(itemId: string): void {
    const o = this.order();
    if (!o?.id) return;
    this.salesService.deliverItem(o.id, itemId).subscribe({
      next: (updated) => this.order.set(updated),
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  protected emitInvoice(): void {
    const o = this.order();
    if (!o?.id) return;
    this.salesService.emitInvoice(o.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.showSuccess('NFS-e emitida');
      },
      error: (err) => this.errorMsg.set(err.message),
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  protected paymentMethodLabel(method: string): string {
    return (PAYMENT_METHOD_LABELS as Record<string, string>)[method] ?? method;
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected goBack(): void {
    this.router.navigate(['/sales/management']);
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

import { InvoiceStatusApi, SalesItemStatusApi, SalesOrderStatusApi } from './sales-api.types';

type UUID = string;

/** Item de pedido de venda — resposta da API (SalesOrderItemDetailsDTO) */
export interface ISalesOrderItem {
  id?: UUID;
  retailProductId: UUID;
  sku: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discountValue: number;
  totalValue?: number;
  itemStatus: SalesItemStatusApi;
  itemStatusDescription?: string;
  attendantEmployeeId?: UUID;
  needsTailoring: boolean;
  tailoringNotes?: string;
  deliveredAt?: string;
  deliveredByEmployeeId?: UUID;
  warrantyDays?: number;
}

/** Pagamento de venda — resposta da API (SalesPaymentDetailsDTO) */
export interface ISalesPayment {
  id?: UUID;
  installmentNumber: number;
  paymentDate: string;
  paymentMethod: string;
  paymentMethodLabel?: string;
  value: number;
  installments: number;
  processedByEmployeeId?: UUID;
  status: string;
  statusDescription?: string;
}

/** Pedido de venda detalhado — resposta da API (SalesOrderDetailsDTO) */
export interface ISalesOrder {
  id?: UUID;
  legacyId?: string;
  status: SalesOrderStatusApi;
  statusDescription?: string;
  customerId?: UUID;
  customerName?: string;
  customerDocument?: string;
  createdByEmployeeId?: UUID;
  notes?: string;
  discountValue: number;
  invoiceStatus: InvoiceStatusApi;
  invoiceStatusDescription?: string;
  invoiceId?: string;
  subtotal?: number;
  totalValue?: number;
  paidValue?: number;
  remainingValue?: number;
  createdAt?: string;
  updatedAt?: string;
  items: ISalesOrderItem[];
  payments: ISalesPayment[];
  warnings?: string[];
}

/** Resumo do pedido para listagem (SalesOrderSummaryDTO) */
export interface ISalesOrderSummary {
  id: UUID;
  legacyId: string;
  status: SalesOrderStatusApi;
  statusDescription: string;
  customerId?: UUID;
  customerName?: string;
  invoiceStatus: InvoiceStatusApi;
  totalValue: number;
  paidValue: number;
  itemCount: number;
  createdAt: string;
}

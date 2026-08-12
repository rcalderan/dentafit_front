import { PaymentMethodApi, PaymentStatusApi } from './sales-api.types';

type UUID = string;

export interface ISalesOrderItemRequest {
  retailProductId: UUID;
  quantity: number;
  discountValue?: number;
  attendantEmployeeId?: UUID;
  needsTailoring?: boolean;
  tailoringNotes?: string;
}

export interface ISalesPaymentRequest {
  installmentNumber: number;
  paymentDate: string;
  paymentMethod: PaymentMethodApi;
  value: number;
  installments: number;
  processedByEmployeeId?: UUID;
  status: PaymentStatusApi;
}

export interface ISalesOrderCreateRequest {
  customerId?: UUID;
  createdByEmployeeId?: UUID;
  notes?: string;
  discountValue?: number;
  items: ISalesOrderItemRequest[];
  payments?: ISalesPaymentRequest[];
}

export interface ISalesOrderUpdateRequest {
  customerId?: UUID;
  notes?: string;
  discountValue?: number;
  items: ISalesOrderItemRequest[];
  payments?: ISalesPaymentRequest[];
}

export interface ICancelSalesOrderRequest {
  reason: string;
}

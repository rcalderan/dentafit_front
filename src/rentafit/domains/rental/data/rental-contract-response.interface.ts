import { ContractStatusApi, ItemMetaTypeApi, PaymentMethodApi, PaymentStatusApi } from './rental-api.types';

export interface IPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface IItemMetaResponse {
  id: string;
  type: ItemMetaTypeApi;
  description: string;
  accessoryId?: string;
}

export interface IRentalContractItemResponse {
  id: string;
  rentalItemId?: string;
  legacyProductCode: string;
  description: string;
  value: number;
  isDelivered: boolean;
  attendantEmployeeId?: string;
  metadata: IItemMetaResponse[];
}

export interface IRentalPaymentResponse {
  id: string;
  installmentNumber: number;
  paymentDate: string;
  paymentMethod: PaymentMethodApi;
  value: number;
  installments: number;
  processedByEmployeeId?: string;
  status: PaymentStatusApi;
}

export interface IRentalContractResponse {
  id: string;
  legacyId?: number;
  status: ContractStatusApi;
  statusDescription: string;
  isReturned: boolean;
  contractType: number;
  customerId: string;
  customerName: string;
  customerDocument: string;
  createdByEmployeeId?: string;
  returnedByEmployeeId?: string;
  pickupDate: string;
  eventDate: string;
  returnDate: string;
  actualReturnDate?: string;
  notes?: string;
  totalValue: number;
  paidValue: number;
  remainingValue: number;
  items: IRentalContractItemResponse[];
  payments?: IRentalPaymentResponse[];
  warnings?: string[];
  createdAt: string;
}

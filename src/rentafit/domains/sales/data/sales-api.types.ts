export type SalesOrderStatusApi = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type SalesItemStatusApi = 'PENDING' | 'RESERVED' | 'READY' | 'DELIVERED';
// Status fiscal definido em finance/data (fonte canônica, inclui CANCELLED/DENIED)
export type { InvoiceStatusApi } from '../../finance/data/fiscal-document.types';
export type PaymentStatusApi = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethodApi = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER';

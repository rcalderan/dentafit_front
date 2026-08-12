export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  [SalesOrderStatus.DRAFT]: 'Rascunho',
  [SalesOrderStatus.CONFIRMED]: 'Confirmado',
  [SalesOrderStatus.PAID]: 'Pago',
  [SalesOrderStatus.COMPLETED]: 'Concluído',
  [SalesOrderStatus.CANCELLED]: 'Cancelado',
};

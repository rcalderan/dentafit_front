export enum SalesItemStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
}

export const SALES_ITEM_STATUS_LABELS: Record<SalesItemStatus, string> = {
  [SalesItemStatus.PENDING]: 'Pendente',
  [SalesItemStatus.RESERVED]: 'Reservado',
  [SalesItemStatus.READY]: 'Pronto',
  [SalesItemStatus.DELIVERED]: 'Entregue',
};

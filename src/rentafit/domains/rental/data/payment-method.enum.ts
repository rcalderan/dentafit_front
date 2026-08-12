export enum PaymentMethod {
  CASH = 0,
  PIX = 1,
  CREDIT_CARD = 2,
  DEBIT_CARD = 3,
  BANK_TRANSFER = 4,
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência',
};

import { PaymentMethod } from './payment-method.enum';
import { PaymentStatus } from './payment-status.enum';

export interface IRentalPayment {
  /** Backend UUID — populated after the payment is saved via addPayment(). */
  id?: string;
  parcela: number;
  data: string;
  forma: PaymentMethod;
  valor: number;
  vezes: number;
  status: PaymentStatus;
  processedByEmployeeId?: string;
}

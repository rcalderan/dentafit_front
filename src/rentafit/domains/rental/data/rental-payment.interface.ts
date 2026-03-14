import { PaymentMethod } from './payment-method.enum';
import { PaymentStatus } from './payment-status.enum';

export interface IRentalPayment {
  parcela: number;
  data: string;
  forma: PaymentMethod;
  valor: number;
  vezes: number;
  funcionario: number;
  status: PaymentStatus;
}

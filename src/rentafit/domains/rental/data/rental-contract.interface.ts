import { ContractStatus } from './contract-status.enum';
import { IRentalContractItem } from './rental-contract-item.interface';
import { IRentalPayment } from './rental-payment.interface';

export interface INewRentalContract {
  _id?: number;
  tipo: number;
  cliente: string;
  clienteNome?: string;
  clienteCpf?: string;
  retirada: string;
  usa: string;
  devolucao: string;
  devolveu?: string;
  hoje: string;
  criado_por: string;
  baixa_por?: string;
  baixa: boolean;
  situacao: ContractStatus;
  comunicado: string;
  itens: IRentalContractItem[];
  pagamentos: IRentalPayment[];
}

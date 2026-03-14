import { IItemMeta } from './item-meta.interface';

export interface IRentalContractItem {
  codigo: string;
  descricao: string;
  valor: number;
  entregue: boolean;
  atendente: number;
  sub: IItemMeta[];
}

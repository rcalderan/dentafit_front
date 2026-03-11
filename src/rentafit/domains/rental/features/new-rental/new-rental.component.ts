import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ==================== Enums ====================

export enum ContractStatus {
  DRAFT = 0,      // Proposta
  SIGNED = 1,     // Assinado
  FINALIZED = 2,  // Contrato fechado
}

export enum PaymentStatus {
  PENDING = 0,
  PAID = 1,
  CANCELLED = 2,
}

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

// ==================== Interfaces ====================

export interface IRentalContractItem {
  codigo: string;
  descricao: string;
  valor: number;
  entregue: boolean;
  atendente: number;
  sub: IItemMeta[];
}

export interface IItemMeta {
  tipo: 'acessorio' | 'observacao';
  descricao: string;
}

export interface IRentalPayment {
  parcela: number;
  data: string;
  forma: PaymentMethod;
  valor: number;
  vezes: number;
  funcionario: number;
  status: PaymentStatus;
}

export interface INewRentalContract {
  _id?: number;
  tipo: number;
  cliente: number;
  clienteNome?: string;
  clienteCpf?: string;
  retirada: string;
  usa: string;
  devolucao: string;
  devolveu?: string;
  hoje: string;
  criado_por: number;
  baixa_por?: number;
  baixa: boolean;
  situacao: ContractStatus;
  comunicado: string;
  itens: IRentalContractItem[];
  pagamentos: IRentalPayment[];
}

export interface IProductCatalog {
  _id: number;
  nome: string;
  locado: boolean;
  obs: string;
  valor: number;
  tamanho: string;
  nloc: number;
  no_estoque: boolean;
  cor: string;
  base: number;
  ajuste: number;
  data: string;
  preco_id: number;
  status: number;
  tipo: number;
}

// ==================== Component ====================

@Component({
  selector: 'rentafit-new-rental',
  imports: [FormsModule],
  templateUrl: './new-rental.component.html',
  styleUrls: ['./new-rental.component.css'],
})
export class NewRental implements OnInit {

  // Expose enums to template
  ContractStatus = ContractStatus;
  PaymentStatus = PaymentStatus;
  PaymentMethod = PaymentMethod;
  paymentMethodLabels = PAYMENT_METHOD_LABELS;
  paymentMethodKeys = Object.values(PaymentMethod).filter(v => typeof v === 'number') as PaymentMethod[];
  paymentStatusLabels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pendente',
    [PaymentStatus.PAID]: 'Pago',
    [PaymentStatus.CANCELLED]: 'Cancelado',
  };
  paymentStatusKeys = Object.values(PaymentStatus).filter(v => typeof v === 'number') as PaymentStatus[];

  // ── Customer ──
  customerFound = false;
  customerSearchQuery = '';

  // ── Contract ──
  contract: INewRentalContract = {
    tipo: 1,
    cliente: 0,
    retirada: '',
    usa: '',
    devolucao: '',
    hoje: this.toDateString(new Date()),
    criado_por: 0,
    baixa: false,
    situacao: ContractStatus.DRAFT,
    comunicado: '',
    itens: [],
    pagamentos: [],
  };

  // ── Totals ──
  subtotal = 0;
  discount = 0;
  total = 0;
  totalPaid = 0;

  // ── Item modal ──
  showItemModal = false;
  itemModalCode = '';
  itemModalName = '';
  itemModalMeta = '';   // e.g. "TAM: 42 | COR: PRETO"
  itemModalValor = 0;
  itemModalExtras: IItemMeta[] = [];
  itemModalNewExtraType: 'acessorio' | 'observacao' = 'observacao';
  itemModalNewExtraDesc = '';
  itemModalFoundProduct: IProductCatalog | null = null;
  itemModalError = '';

  // ── Payment modal ──
  showPaymentModal = false;
  paymentModalForma: PaymentMethod = PaymentMethod.PIX;
  paymentModalValor = 0;
  paymentModalData = '';
  paymentModalStatus: PaymentStatus = PaymentStatus.PENDING;
  paymentModalError = '';

  editingItemIndex: number | null = null;
  editingPaymentIndex: number | null = null;

  // ── Brazilian national holidays (static 2025-2027) ──
  private readonly HOLIDAYS = new Set<string>([
    // 2025
    '2025-01-01','2025-04-18','2025-04-21','2025-05-01',
    '2025-06-19','2025-09-07','2025-10-12','2025-11-02',
    '2025-11-15','2025-11-20','2025-12-25',
    // 2026
    '2026-01-01','2026-04-03','2026-04-21','2026-05-01',
    '2026-06-04','2026-09-07','2026-10-12','2026-11-02',
    '2026-11-15','2026-11-20','2026-12-25',
    // 2027
    '2027-01-01','2027-03-26','2027-04-21','2027-05-01',
    '2027-05-27','2027-09-07','2027-10-12','2027-11-02',
    '2027-11-15','2027-11-20','2027-12-25',
  ]);

  ngOnInit(): void {
    this.autoFillDates();
  }

  // ==================== Helpers ====================

  toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  isHoliday(d: Date): boolean {
    return this.HOLIDAYS.has(this.toDateString(d));
  }

  isWeekend(d: Date): boolean {
    return d.getDay() === 0 || d.getDay() === 6;
  }

  isBusinessDay(d: Date): boolean {
    return !this.isWeekend(d) && !this.isHoliday(d);
  }

  /** Advance date forward until it's a business day */
  nextBusinessDayFrom(d: Date): Date {
    const r = new Date(d);
    while (!this.isBusinessDay(r)) {
      r.setDate(r.getDate() + 1);
    }
    return r;
  }

  /** Go back N business days from d (exclusive) */
  prevBusinessDays(from: Date, n: number): Date {
    const r = new Date(from);
    let count = 0;
    while (count < n) {
      r.setDate(r.getDate() - 1);
      if (this.isBusinessDay(r)) count++;
    }
    return r;
  }

  /** Next Saturday from today (or today if Saturday) */
  getNextSaturday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun,6=Sat
    const daysUntilSat = day === 6 ? 7 : (6 - day);
    d.setDate(d.getDate() + daysUntilSat);
    return d;
  }

  // ==================== Date auto-fill ====================

  autoFillDates(): void {
    const uso = this.getNextSaturday();

    // Devolução: next business day (Monday or later, skip holidays)
    const rawDevolucao = new Date(uso);
    rawDevolucao.setDate(rawDevolucao.getDate() + 2); // Monday
    const devolucao = this.nextBusinessDayFrom(rawDevolucao);

    // Retirada: 2 business days before uso (Thursday or earlier, skip holidays)
    const retirada = this.prevBusinessDays(uso, 2);

    this.contract.usa = this.toDateString(uso);
    this.contract.devolucao = this.toDateString(devolucao);
    this.contract.retirada = this.toDateString(retirada);
  }

  onUsoDateChange(): void {
    if (!this.contract.usa) return;
    const uso = this.parseDate(this.contract.usa);

    const rawDevolucao = new Date(uso);
    rawDevolucao.setDate(rawDevolucao.getDate() + 2);
    const devolucao = this.nextBusinessDayFrom(rawDevolucao);

    const retirada = this.prevBusinessDays(uso, 2);

    this.contract.devolucao = this.toDateString(devolucao);
    this.contract.retirada = this.toDateString(retirada);
  }

  onRetiradaChange(): void {
    if (!this.contract.retirada) return;
    const d = this.parseDate(this.contract.retirada);
    const adjusted = this.nextBusinessDayFrom(d);
    this.contract.retirada = this.toDateString(adjusted);
  }

  onDevolucaoChange(): void {
    if (!this.contract.devolucao) return;
    const d = this.parseDate(this.contract.devolucao);
    const adjusted = this.nextBusinessDayFrom(d);
    this.contract.devolucao = this.toDateString(adjusted);
  }

  // ==================== Customer ====================

  searchCustomer(): void {
    const query = this.customerSearchQuery.trim();
    if (!query) return;
    // TODO: integrate with CustomerService
    this.contract.clienteNome = 'RICHARD CALDERAN';
    this.contract.clienteCpf = '000.000.000-00';
    this.contract.cliente = 1;
    this.customerFound = true;
  }

  clearCustomer(): void {
    this.customerFound = false;
    this.customerSearchQuery = '';
    this.contract.clienteNome = '';
    this.contract.clienteCpf = '';
    this.contract.cliente = 0;
  }

  // ==================== Item modal ====================

  openItemModal(): void {
    if (!this.isEditable()) return;
    this.editingItemIndex = null;
    this.itemModalCode = '';
    this.itemModalName = '';
    this.itemModalMeta = '';
    this.itemModalValor = 0;
    this.itemModalExtras = [];
    this.itemModalNewExtraDesc = '';
    this.itemModalFoundProduct = null;
    this.itemModalError = '';
    this.showItemModal = true;
  }

  openEditItemModal(index: number): void {
    const item = this.contract.itens[index];
    if (!item) return;
    this.editingItemIndex = index;
    this.itemModalCode = item.codigo;
    this.itemModalName = item.descricao;
    this.itemModalValor = item.valor;
    this.itemModalMeta = '';
    this.itemModalExtras = [...item.sub];
    this.itemModalFoundProduct = { nome: item.descricao } as any;
    this.itemModalNewExtraDesc = '';
    this.itemModalNewExtraType = 'observacao';
    this.itemModalError = '';
    this.showItemModal = true;
  }

  closeItemModal(): void {
    this.showItemModal = false;
  }

  searchItemByCode(): void {
    if (!this.itemModalCode.trim()) return;
    this.itemModalError = '';
    // TODO: integrate with ProductService.findByLegacyId()
    if (this.itemModalCode.trim() !== '') {
      this.itemModalFoundProduct = {
        _id: 1, nome: 'SMOKING PRETO CLASSIC', locado: false,
        obs: '', valor: 250, tamanho: '42', nloc: 0,
        no_estoque: true, cor: 'PRETO', base: 250, ajuste: 0,
        data: '', preco_id: 1, status: 1, tipo: 1,
      };
      this.itemModalName = this.itemModalFoundProduct.nome;
      this.itemModalMeta = `TAM: ${this.itemModalFoundProduct.tamanho} | COR: ${this.itemModalFoundProduct.cor}`;
      this.itemModalValor = this.itemModalFoundProduct.valor;
    } else {
      this.itemModalError = 'Produto não encontrado.';
    }
  }

  addItemModalExtra(): void {
    if (!this.itemModalNewExtraDesc.trim()) return;
    this.itemModalExtras.push({
      tipo: this.itemModalNewExtraType,
      descricao: this.itemModalNewExtraDesc.trim(),
    });
    this.itemModalNewExtraDesc = '';
  }

  removeItemModalExtra(i: number): void {
    this.itemModalExtras.splice(i, 1);
  }

  confirmAddItem(): void {
    if (this.editingItemIndex === null && !this.itemModalFoundProduct) return;
    if (!this.isEditable()) return;
    const item: IRentalContractItem = {
      codigo: this.itemModalCode,
      descricao: this.itemModalName,
      valor: this.itemModalValor,
      entregue: false,
      atendente: 0,
      sub: [
        ...(this.itemModalMeta ? [{ tipo: 'observacao' as const, descricao: this.itemModalMeta }] : []),
        ...this.itemModalExtras,
      ],
    };
    if (this.editingItemIndex !== null) {
      this.contract.itens[this.editingItemIndex] = item;
    } else {
      this.contract.itens.push(item);
    }
    this.recalculate();
    this.closeItemModal();
  }

  removeItem(index: number): void {
    if (!this.isEditable()) return;
    this.contract.itens.splice(index, 1);
    this.recalculate();
  }

  // ==================== Payment modal ====================

  get canAddPayment(): boolean {
    return this.contract.itens.length > 0;
  }

  get nextParcela(): number {
    return this.contract.pagamentos.length + 1;
  }

  get remainingAmount(): number {
    return Math.max(0, this.total - this.totalPaid);
  }

  /** Total of all planned parcelas (regardless of payment status) */
  get totalPlanned(): number {
    return this.contract.pagamentos.reduce((s, p) => s + p.valor, 0);
  }

  /** Amount not yet covered by any parcela */
  get unplannedAmount(): number {
    return Math.max(0, this.total - this.totalPlanned);
  }

  openPaymentModal(): void {
    if (!this.canAddPayment) return;
    this.editingPaymentIndex = null;
    const prev = this.contract.pagamentos.at(-1);
    this.paymentModalForma = prev ? prev.forma : PaymentMethod.PIX;
    this.paymentModalValor = this.unplannedAmount;
    if (prev) {
      const d = new Date(prev.data + 'T12:00:00');
      d.setMonth(d.getMonth() + 1);
      const nextMonthStr = this.toDateString(d);
      const retiradaDate = this.contract.retirada;
      this.paymentModalData = retiradaDate && nextMonthStr > retiradaDate
        ? retiradaDate
        : nextMonthStr;
    } else {
      this.paymentModalData = this.toDateString(new Date());
    }
    this.paymentModalError = '';
    this.showPaymentModal = true;
  }

  openEditPaymentModal(index: number): void {
    const p = this.contract.pagamentos[index];
    if (!p) return;
    this.editingPaymentIndex = index;
    this.paymentModalForma = p.forma;
    this.paymentModalValor = p.valor;
    this.paymentModalData = p.data;
    this.paymentModalStatus = p.status;
    this.paymentModalError = '';
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  submitPaymentModal(): void {
    if (this.editingPaymentIndex !== null) {
      this.confirmAddPayment();
    } else {
      this.dividePayment();
    }
  }

  confirmAddPayment(): void {
    // Only used in edit mode now
    this.paymentModalError = '';
    const isEditing = this.editingPaymentIndex !== null;
    if (!isEditing) return;
    const currentVal = this.contract.pagamentos[this.editingPaymentIndex!].valor;
    const maxAllowed = this.unplannedAmount + currentVal;

    if (this.paymentModalValor <= 0) {
      this.paymentModalError = 'Valor deve ser maior que zero.';
      return;
    }
    if (this.paymentModalValor > maxAllowed + 0.001) {
      this.paymentModalError = `Valor supera o saldo de R$ ${maxAllowed.toFixed(2).replace('.', ',')}.`;
      return;
    }
    if (this.contract.usa && this.paymentModalData > this.contract.usa) {
      this.paymentModalError = 'Data não pode ser posterior à data de uso.';
      return;
    }

    const payment: IRentalPayment = {
      parcela: this.contract.pagamentos[this.editingPaymentIndex!].parcela,
      data: this.paymentModalData,
      forma: this.paymentModalForma,
      valor: this.paymentModalValor,
      vezes: 1,
      funcionario: 0,
      status: this.paymentModalStatus,
    };
    this.contract.pagamentos[this.editingPaymentIndex!] = payment;
    this.recalculate();
    this.closePaymentModal();
  }

  dividePayment(): void {
    this.paymentModalError = '';

    if (this.paymentModalValor <= 0) {
      this.paymentModalError = 'Valor deve ser maior que zero.';
      return;
    }

    let remaining = this.unplannedAmount;
    if (remaining <= 0.001) {
      this.paymentModalError = 'Não há saldo a planejar.';
      return;
    }
    if (this.paymentModalValor > remaining + 0.001) {
      this.paymentModalError = `Valor supera o saldo restante de R$ ${remaining.toFixed(2).replace('.', ',')}.`;
      return;
    }

    const retiradaDate = this.contract.retirada;
    let currentDate = this.paymentModalData; // usa a data pré-calculada do modal

    while (remaining > 0.001) {
      if (this.contract.pagamentos.length >= 24) {
        this.paymentModalError = 'Limite de 24 parcelas atingido.';
        break;
      }
      const valor = parseFloat(Math.min(this.paymentModalValor, remaining).toFixed(2));
      this.contract.pagamentos.push({
        parcela: this.contract.pagamentos.length + 1,
        data: currentDate,
        forma: this.paymentModalForma,
        valor,
        vezes: 1,
        funcionario: 0,
        status: PaymentStatus.PENDING,
      });
      remaining = parseFloat((remaining - this.paymentModalValor).toFixed(2));

      // Avança um mês; se ultrapassar a retirada, usa a data de retirada
      const d = new Date(currentDate + 'T12:00:00');
      d.setMonth(d.getMonth() + 1);
      const nextMonthStr = this.toDateString(d);
      currentDate = retiradaDate && nextMonthStr > retiradaDate
        ? retiradaDate
        : nextMonthStr;
    }

    this.recalculate();
    this.closePaymentModal();
  }

  removePayment(index: number): void {
    if (this.contract.situacao === ContractStatus.FINALIZED) return;
    this.contract.pagamentos.splice(index, 1);
    this.contract.pagamentos.forEach((p, i) => p.parcela = i + 1);
    this.recalculate();
  }

  togglePaymentStatus(index: number): void {
    const p = this.contract.pagamentos[index];
    if (!p) return;
    p.status = p.status === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID;
    this.recalculate();
  }

  // ==================== Totals ====================

  recalculate(): void {
    this.subtotal = this.contract.itens.reduce((s, i) => s + i.valor, 0);
    this.total = Math.max(0, this.subtotal - this.discount);
    this.totalPaid = this.contract.pagamentos
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((s, p) => s + p.valor, 0);
  }

  // ==================== Contract flow ====================

  isEditable(): boolean {
    return this.contract.situacao !== ContractStatus.FINALIZED;
  }

  get stepperStep(): number {
    return this.contract.situacao + 1; // 1=Draft, 2=Signed, 3=Finalized
  }

  salvarProposta(): void {
    if (this.contract.situacao === ContractStatus.FINALIZED) return;
    // TODO: integrate with ContractService.save()
    console.log('Salvando proposta:', this.contract);
  }

  assinarContrato(): void {
    if (this.contract.situacao !== ContractStatus.DRAFT) return;
    if (!this.contract.cliente) { alert('Selecione um cliente antes de assinar.'); return; }
    if (this.contract.itens.length === 0) { alert('Adicione pelo menos um item.'); return; }
    this.contract.situacao = ContractStatus.SIGNED;
    // TODO: open signature flow
    console.log('Contrato assinado:', this.contract);
  }

  finalizarLocacao(): void {
    if (this.contract.situacao === ContractStatus.FINALIZED) return;
    if (!this.contract.cliente) { alert('Selecione um cliente.'); return; }
    if (this.contract.itens.length === 0) { alert('Adicione pelo menos um item.'); return; }
    this.contract.situacao = ContractStatus.FINALIZED;
    console.log('Locação finalizada:', this.contract);
  }

  duplicateContract(): INewRentalContract {
    const clone: INewRentalContract = {
      ...this.contract,
      _id: undefined,
      situacao: ContractStatus.DRAFT,
      baixa: false,
      pagamentos: [],
      hoje: this.toDateString(new Date()),
    };
    console.log('Nova proposta gerada a partir do contrato:', clone);
    return clone;
  }

  formatCurrency(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
}

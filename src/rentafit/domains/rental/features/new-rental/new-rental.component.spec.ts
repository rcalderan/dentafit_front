import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
const emptyQueryParams = of({});
import { EmployeeService } from '../../../admin/service/employee.service';
import { CustomerService } from '../../../customer/service/customer.service';
import { ProductService } from '../../../product/service/product.service';
import { HolidayService } from '../../../../shared/services/holiday.service';
import { AutosaveService } from '../../service/autosave.service';
import { RentalContractService } from '../../service/rental-contract.service';
import { ContractStatus } from '../../data/contract-status.enum';
import { PaymentMethod } from '../../data/payment-method.enum';
import { PaymentStatus } from '../../data/payment-status.enum';
import { IProductCatalog } from '../../data/product-catalog.interface';
import { NewRental } from './new-rental.component';
import { SessionFormStorageService } from '../../../../shared/services/session-form-storage.service';
import { TabService } from '../../../../shared/services/tab.service';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';

const product: IProductCatalog = {
  _id: 10,
  nome: 'Terno',
  locado: false,
  obs: '',
  valor: 150,
  tamanho: 'M',
  nloc: 0,
  no_estoque: true,
  cor: 'Preto',
  base: 150,
  ajuste: 0,
  data: '',
  preco_id: 0,
  status: 1,
  tipo: 1,
};

describe('NewRental item attendant', () => {
  let employeeService: { listActiveAttendants: ReturnType<typeof vi.fn> };
  let tabServiceMock: { closeActiveIf: ReturnType<typeof vi.fn>; getTabId: ReturnType<typeof vi.fn>; updateTitle: ReturnType<typeof vi.fn> };
  let component: NewRental;

  beforeEach(() => {
    employeeService = {
      listActiveAttendants: vi.fn().mockReturnValue(
        of([
          { id: 'employee-1', name: 'Ana', role: 'EMPLOYEE' },
          { id: 'manager-1', name: 'Bruno', role: 'MANAGER' },
          { id: 'admin-1', name: 'Carla', role: 'ADMIN' },
        ]),
      ),
    };
    tabServiceMock = { closeActiveIf: vi.fn(), getTabId: vi.fn((path, draftId) => `${path}::${draftId}`), updateTitle: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParams: emptyQueryParams } },
        { provide: EmployeeService, useValue: employeeService },
        { provide: CustomerService, useValue: {} },
        { provide: ProductService, useValue: {} },
        { provide: HolidayService, useValue: { getHolidays: vi.fn().mockReturnValue(of(new Set<string>())) } },
        { provide: RentalContractService, useValue: {} },
        { provide: AutosaveService, useValue: { status$: of('idle'), lastError: null } },
        { provide: SessionFormStorageService, useValue: { saveDraft: vi.fn(), loadDraft: vi.fn().mockReturnValue(null), clearDraft: vi.fn() } },
        { provide: TabService, useValue: tabServiceMock },
        { provide: APP_CONFIG, useValue: { appName: 'RentAFit Test', apiBaseUrl: '', s3BucketUrl: '' } },
      ],
    });

    component = TestBed.runInInjectionContext(() => new NewRental());
  });

  it('carrega atendentes uma vez na inicialização e abre Adicionar Item desmarcado', () => {
    component.ngOnInit();
    component.openItemModal();
    component.openItemModal();

    expect(component.showItemModal).toBe(true);
    expect(component.showEmployeeVerify).toBe(false);
    expect(component.itemModalEmployee).toBe('');
    expect(employeeService.listActiveAttendants).toHaveBeenCalledOnce();
    expect(component.activeAttendants).toHaveLength(3);
  });

  it('não adiciona novo item sem atendente', () => {
    component.openItemModal();
    component.itemModalFoundProduct = product;
    component.itemModalCode = '10';
    component.itemModalName = product.nome;
    component.itemModalValor = product.valor;

    component.confirmAddItem();

    expect(component.contract.itens).toHaveLength(0);
    expect(component.showItemModal).toBe(true);
  });

  it('associa o atendente selecionado ao novo item', () => {
    component.openItemModal();
    component.itemModalFoundProduct = product;
    component.itemModalCode = '10';
    component.itemModalName = product.nome;
    component.itemModalValor = product.valor;
    component.itemModalEmployee = 'manager-1';

    component.confirmAddItem();

    expect(component.contract.itens[0].attendantEmployeeId).toBe('manager-1');
    expect(component.showItemModal).toBe(false);
  });

  it('preserva o atendente ao editar item existente', () => {
    component.ngOnInit();
    component.contract.situacao = ContractStatus.DRAFT;
    component.contract.itens = [
      {
        codigo: '10',
        descricao: 'Terno',
        valor: 150,
        entregue: false,
        attendantEmployeeId: 'employee-1',
        sub: [],
      },
    ];

    component.openEditItemModal(0);
    component.itemModalValor = 175;
    component.confirmAddItem();

    expect(component.contract.itens[0].valor).toBe(175);
    expect(component.contract.itens[0].attendantEmployeeId).toBe('employee-1');
    expect(employeeService.listActiveAttendants).toHaveBeenCalledOnce();
  });

  it('não disponibiliza multa no seletor de status', () => {
    expect(component.paymentStatusKeys).not.toContain(PaymentStatus.MULTA);
    expect(component.paymentStatusKeys).not.toContain(PaymentStatus.CANCELLED);
  });

  it('usa dinheiro como forma padrão da primeira parcela', () => {
    component.contract.itens = [{
      codigo: '10',
      descricao: 'Terno',
      valor: 150,
      entregue: false,
      attendantEmployeeId: 'employee-1',
      sub: [],
    }];

    component.openPaymentModal();

    expect(component.paymentModalForma).toBe(PaymentMethod.CASH);
  });

  it('exibe erro e limpa opções quando a lista falha', () => {
    employeeService.listActiveAttendants.mockReturnValue(
      throwError(() => new Error('API indisponível')),
    );

    component.ngOnInit();
    component.openItemModal();

    expect(component.activeAttendants).toEqual([]);
    expect(component.attendantsError).toBe('API indisponível');
    expect(component.attendantsLoading).toBe(false);
  });

  it('atualiza título da aba com legacyId do contrato', () => {
    component.contract.legacyId = '2024-001';
    (component as any).updateTabTitle();

    expect(tabServiceMock.updateTitle).toHaveBeenCalledWith(
      expect.stringContaining('/rental/new'),
      'Contrato 2024-001'
    );
  });

  it('mantém título genérico quando contrato não tem legacyId', () => {
    component.contract.legacyId = undefined;
    (component as any).updateTabTitle();

    expect(tabServiceMock.updateTitle).toHaveBeenCalledWith(
      expect.stringContaining('/rental/new'),
      'Nova Locação'
    );
  });
});

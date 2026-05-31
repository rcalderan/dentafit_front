import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AccountProfileComponent } from './account-profile.component';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ICustomerAccountHistory, IPagedRentals, IRentalSummary, ISalesOrderSummary } from '../../data/account.model';
import { User, UserRole } from '../../../auth/data/user.model';

// ─── Helpers ────────────────────────────────────────────────────────────────

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'u-1',
  username: 'joao@example.com',
  name: 'João Silva',
  role: UserRole.CUSTOMER,
  active: true,
  pin: '1234',
  passwordExpired: false,
  ...overrides,
});

const buildRental = (overrides: Partial<IRentalSummary> = {}): IRentalSummary => ({
  id: 'r-1',
  legacyId: 'L-001',
  status: 'SIGNED',
  statusDescription: 'Assinado',
  eventDate: '2026-06-01',
  pickupDate: '2026-05-31',
  returnDate: '2026-06-03',
  returned: false,
  totalValue: 300,
  paidValue: 150,
  createdAt: '2026-05-01T10:00:00Z',
  ...overrides,
});

const buildOrder = (overrides: Partial<ISalesOrderSummary> = {}): ISalesOrderSummary => ({
  id: 'o-1',
  legacyId: 'V-20260501-1',
  status: 'CONFIRMED',
  statusDescription: 'Confirmado',
  invoiceStatus: 'NONE',
  totalValue: 200,
  paidValue: 200,
  itemCount: 2,
  createdAt: '2026-05-01T11:00:00Z',
  ...overrides,
});

const buildPagedRentals = (items: IRentalSummary[] = [], totalPages = 1): IPagedRentals => ({
  content: items,
  totalElements: items.length,
  totalPages,
  number: 0,
  size: 10,
});

const buildHistory = (
  rentals: IPagedRentals = buildPagedRentals(),
  orders: ISalesOrderSummary[] = []
): ICustomerAccountHistory => ({ rentals, orders });

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('AccountProfileComponent', () => {
  let accountService: { getRentals: ReturnType<typeof vi.fn>; getHistory: ReturnType<typeof vi.fn> };
  let authService: { getCurrentUser: ReturnType<typeof vi.fn> };

  const defaultHistory = buildHistory(
    buildPagedRentals([buildRental()]),
    [buildOrder()]
  );

  beforeEach(async () => {
    accountService = {
      getRentals: vi.fn(),
      getHistory: vi.fn().mockReturnValue(of(defaultHistory)),
    };
    authService = {
      getCurrentUser: vi.fn().mockReturnValue(buildUser()),
    };

    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  // ── criação ──────────────────────────────────────────────────────────────

  it('cria o componente', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expõe o usuário autenticado via authService.getCurrentUser()', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    expect(fixture.componentInstance.user?.username).toBe('joao@example.com');
  });

  // ── ngOnInit / loadHistory ────────────────────────────────────────────────

  it('chama getHistory na inicialização com page 0', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    expect(accountService.getHistory).toHaveBeenCalledWith(0, 10);
  });

  it('popula rentals e orders após carregamento bem-sucedido', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.rentals()?.content).toHaveLength(1);
    expect(comp.orders()).toHaveLength(1);
    expect(comp.isLoading()).toBe(false);
    expect(comp.errorMessage()).toBeNull();
  });

  it('define isLoading=false e errorMessage após erro no getHistory', () => {
    accountService.getHistory.mockReturnValue(
      throwError(() => new Error('Serviço indisponível'))
    );

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.isLoading()).toBe(false);
    expect(comp.errorMessage()).toBe('Serviço indisponível');
    expect(comp.rentals()).toBeNull();
  });

  it('define currentPage=0 na inicialização', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.currentPage()).toBe(0);
  });

  // ── selectTab ─────────────────────────────────────────────────────────────

  it('inicia com aba "rentals" ativa', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    expect(fixture.componentInstance.activeTab()).toBe('rentals');
  });

  it('muda para aba "orders" ao chamar selectTab("orders")', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.componentInstance.selectTab('orders');
    expect(fixture.componentInstance.activeTab()).toBe('orders');
  });

  it('volta para aba "rentals" ao chamar selectTab("rentals")', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.componentInstance.selectTab('orders');
    fixture.componentInstance.selectTab('rentals');
    expect(fixture.componentInstance.activeTab()).toBe('rentals');
  });

  // ── paginação ─────────────────────────────────────────────────────────────

  it('nextPage carrega página seguinte quando há mais páginas', () => {
    const multiPage = buildHistory(
      buildPagedRentals([buildRental()], 3),
      []
    );
    accountService.getHistory.mockReturnValue(of(multiPage));

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges(); // page 0

    accountService.getHistory.mockReturnValue(of(multiPage));
    fixture.componentInstance.nextPage();

    expect(accountService.getHistory).toHaveBeenCalledWith(1, 10);
    expect(fixture.componentInstance.currentPage()).toBe(1);
  });

  it('nextPage não avança quando já está na última página', () => {
    const singlePage = buildHistory(buildPagedRentals([buildRental()], 1), []);
    accountService.getHistory.mockReturnValue(of(singlePage));

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.nextPage();
    // Apenas a chamada inicial — não deve ter uma segunda
    expect(accountService.getHistory).toHaveBeenCalledTimes(1);
  });

  it('prevPage carrega página anterior quando page > 0', () => {
    // Iniciar em page 1 via loadHistory direto
    const multiPage = buildHistory(buildPagedRentals([buildRental()], 3), []);
    accountService.getHistory.mockReturnValue(of(multiPage));

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges(); // page 0

    accountService.getHistory.mockReturnValue(of(multiPage));
    fixture.componentInstance.nextPage(); // page 1

    accountService.getHistory.mockReturnValue(of(multiPage));
    fixture.componentInstance.prevPage(); // volta para 0

    expect(accountService.getHistory).toHaveBeenLastCalledWith(0, 10);
    expect(fixture.componentInstance.currentPage()).toBe(0);
  });

  it('prevPage não recua quando já está na página 0', () => {
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.prevPage();
    expect(accountService.getHistory).toHaveBeenCalledTimes(1);
  });

  it('loadHistory reseta errorMessage antes de nova chamada', () => {
    accountService.getHistory.mockReturnValue(
      throwError(() => new Error('Falha'))
    );
    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe('Falha');

    accountService.getHistory.mockReturnValue(of(defaultHistory));
    fixture.componentInstance.loadHistory();

    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  // ── rentalStatusClass ─────────────────────────────────────────────────────

  describe('rentalStatusClass', () => {
    const cases: [string, string][] = [
      ['DRAFT',     'status-draft'],
      ['SIGNED',    'status-signed'],
      ['FINALIZED', 'status-finalized'],
      ['RETURNED',  'status-returned'],
      ['CANCELLED', 'status-cancelled'],
      ['UNKNOWN',   'status-default'],
      ['',          'status-default'],
    ];

    it.each(cases)('status "%s" → classe "%s"', (status, expected) => {
      const fixture = TestBed.createComponent(AccountProfileComponent);
      expect(fixture.componentInstance.rentalStatusClass(status)).toBe(expected);
    });
  });

  // ── orderStatusClass ──────────────────────────────────────────────────────

  describe('orderStatusClass', () => {
    const cases: [string, string][] = [
      ['DRAFT',     'status-draft'],
      ['CONFIRMED', 'status-signed'],
      ['PAID',      'status-finalized'],
      ['COMPLETED', 'status-returned'],
      ['CANCELLED', 'status-cancelled'],
      ['UNKNOWN',   'status-default'],
      ['',          'status-default'],
    ];

    it.each(cases)('status "%s" → classe "%s"', (status, expected) => {
      const fixture = TestBed.createComponent(AccountProfileComponent);
      expect(fixture.componentInstance.orderStatusClass(status)).toBe(expected);
    });
  });

  // ── histórico vazio ───────────────────────────────────────────────────────

  it('lida com histórico completamente vazio sem erros', () => {
    accountService.getHistory.mockReturnValue(of(buildHistory()));

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.rentals()?.content).toHaveLength(0);
    expect(comp.orders()).toHaveLength(0);
    expect(comp.isLoading()).toBe(false);
    expect(comp.errorMessage()).toBeNull();
  });

  it('nextPage usa totalPages=1 como fallback quando rentals é null', () => {
    accountService.getHistory.mockReturnValue(
      throwError(() => new Error('erro'))
    );

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    // rentals() é null — nextPage não deve chamar getHistory novamente
    fixture.componentInstance.nextPage();
    expect(accountService.getHistory).toHaveBeenCalledTimes(1);
  });
});

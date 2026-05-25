import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReturnComponent } from './return.component';
import { ReturnFacadeService } from '../../service/return-facade.service';
import { ReturnApiPort } from './data/return-api.port';
import { Router, ActivatedRoute } from '@angular/router';
import { ReturnSummaryModel } from './data/return.model';

const buildReturnSummary = (overrides: Partial<ReturnSummaryModel> = {}): ReturnSummaryModel => ({
  contractId: 'contract-123',
  legacyId: '2024-001',
  customerName: 'João Silva',
  returnDate: '2026-06-01',
  pendingCount: 2,
  isFullyReturned: false,
  delayDays: 0,
  suggestedFine: 0,
  items: [],
  paymentsPreview: [],
  ...overrides,
});

describe('ReturnComponent', () => {
  let facade: {
    summary: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    saving: ReturnType<typeof vi.fn>;
    closing: ReturnType<typeof vi.fn>;
    form: ReturnType<typeof vi.fn>;
    canDirectClose: ReturnType<typeof vi.fn>;
    hasChanges: ReturnType<typeof vi.fn>;
    delayWarning: ReturnType<typeof vi.fn>;
    unpaidPaymentsCount: ReturnType<typeof vi.fn>;
    showConfirmButton: ReturnType<typeof vi.fn>;
    loadContract: ReturnType<typeof vi.fn>;
    setReturnerName: ReturnType<typeof vi.fn>;
    toggleItem: ReturnType<typeof vi.fn>;
    toggleAccessory: ReturnType<typeof vi.fn>;
    setApplyFine: ReturnType<typeof vi.fn>;
    setFineAmount: ReturnType<typeof vi.fn>;
    saveMarkings: ReturnType<typeof vi.fn>;
    closeContract: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };

  const makeComponent = () => TestBed.createComponent(ReturnComponent).componentInstance;

  beforeEach(async () => {
    facade = {
      summary: vi.fn().mockReturnValue(null),
      loading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      saving: vi.fn().mockReturnValue(false),
      closing: vi.fn().mockReturnValue(false),
      form: vi.fn().mockReturnValue({
        returnerName: '',
        selectedItems: new Set<string>(),
        selectedAccessories: new Map<string, Set<string>>(),
        applyFine: false,
        fineAmount: null,
      }),
      canDirectClose: vi.fn().mockReturnValue(false),
      hasChanges: vi.fn().mockReturnValue(false),
      delayWarning: vi.fn().mockReturnValue(null),
      unpaidPaymentsCount: vi.fn().mockReturnValue(0),
      showConfirmButton: vi.fn().mockReturnValue(false),
      loadContract: vi.fn(),
      setReturnerName: vi.fn(),
      toggleItem: vi.fn(),
      toggleAccessory: vi.fn(),
      setApplyFine: vi.fn(),
      setFineAmount: vi.fn(),
      saveMarkings: vi.fn().mockReturnValue(of(true)),
      closeContract: vi.fn().mockReturnValue(of(true)),
      clearError: vi.fn(),
    };

    router = { navigate: vi.fn() };
    route = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('contract-123'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ReturnComponent],
      providers: [
        { provide: ReturnFacadeService, useValue: facade },
        { provide: ReturnApiPort, useValue: {} },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();
  });

  describe('onContractIdClick', () => {
    it('navega para /rental/new com queryParam id quando summary tem contractId', () => {
      const summary = buildReturnSummary({ contractId: 'contract-456', legacyId: '2024-002' });
      facade.summary.mockReturnValue(summary);

      const component = makeComponent();
      component.onContractIdClick();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/rental/new'],
        { queryParams: { id: 'contract-456' } }
      );
    });

    it('não navega quando summary é null', () => {
      facade.summary.mockReturnValue(null);

      const component = makeComponent();
      component.onContractIdClick();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('usa o contractId correto do summary (não o legacyId)', () => {
      const summary = buildReturnSummary({ contractId: 'uuid-abc-123', legacyId: '2024-999' });
      facade.summary.mockReturnValue(summary);

      const component = makeComponent();
      component.onContractIdClick();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/rental/new'],
        { queryParams: { id: 'uuid-abc-123' } }
      );
      expect(router.navigate).not.toHaveBeenCalledWith(
        ['/rental/new'],
        { queryParams: { id: '2024-999' } }
      );
    });
  });

  describe('onCancel', () => {
    it('navega para /rental/management', () => {
      const component = makeComponent();
      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/rental/management']);
    });
  });

  describe('ngOnInit', () => {
    it('carrega contrato quando contractId está na rota', () => {
      route.snapshot.paramMap.get.mockReturnValue('contract-789');

      const component = makeComponent();
      component.ngOnInit();

      expect(facade.loadContract).toHaveBeenCalledWith('contract-789');
    });

    it('navega para / quando contractId não está na rota', () => {
      route.snapshot.paramMap.get.mockReturnValue(null);

      const component = makeComponent();
      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(facade.loadContract).not.toHaveBeenCalled();
    });
  });
});

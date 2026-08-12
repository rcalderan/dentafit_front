import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { AccountService } from './account.service';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import { ICustomerAccountHistory, IPagedRentals, IRentalSummary, ISalesOrderSummary } from '../data/account.model';

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

const buildPagedRentals = (items: IRentalSummary[] = []): IPagedRentals => ({
  content: items,
  totalElements: items.length,
  totalPages: 1,
  number: 0,
  size: 10,
});

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '', s3BucketUrl: '' } },
      ],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── getRentals ────────────────────────────────────────────────────────────

  describe('getRentals', () => {
    it('faz GET /api/v1/account/rentals com params padrão', () => {
      const page = buildPagedRentals([buildRental()]);

      service.getRentals().subscribe(result => expect(result).toEqual(page));

      const req = httpMock.expectOne(r =>
        r.url === '/api/v1/account/rentals' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '10' &&
        r.params.get('sort') === 'createdAt,desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(page);
    });

    it('passa page e size personalizados', () => {
      const page = buildPagedRentals();

      service.getRentals(2, 5).subscribe();

      const req = httpMock.expectOne(r =>
        r.params.get('page') === '2' && r.params.get('size') === '5'
      );
      req.flush(page);
    });

    it('emite erro amigável em 404', async () => {
      const result = lastValueFrom(service.getRentals());
      httpMock.expectOne(r => r.url === '/api/v1/account/rentals')
        .flush({}, { status: 404, statusText: 'Not Found' });
      await expect(result).rejects.toThrow('Serviço temporariamente indisponível. Tente novamente em instantes.');
    });

    it('emite erro amigável em status 0 (sem conexão)', async () => {
      const result = lastValueFrom(service.getRentals());
      httpMock.expectOne(r => r.url === '/api/v1/account/rentals')
        .flush({}, { status: 0, statusText: 'Unknown Error' });
      await expect(result).rejects.toThrow('Serviço temporariamente indisponível. Tente novamente em instantes.');
    });

    it('emite mensagem de permissão em 403', async () => {
      const result = lastValueFrom(service.getRentals());
      httpMock.expectOne(r => r.url === '/api/v1/account/rentals')
        .flush({}, { status: 403, statusText: 'Forbidden' });
      await expect(result).rejects.toThrow('Você não tem permissão para acessar este recurso.');
    });

    it('usa message do body para erros não mapeados', async () => {
      const result = lastValueFrom(service.getRentals());
      httpMock.expectOne(r => r.url === '/api/v1/account/rentals')
        .flush({ message: 'Erro interno customizado' }, { status: 500, statusText: 'Server Error' });
      await expect(result).rejects.toThrow('Erro interno customizado');
    });

    it('usa fallback genérico quando body não tem message', async () => {
      const result = lastValueFrom(service.getRentals());
      httpMock.expectOne(r => r.url === '/api/v1/account/rentals')
        .flush({}, { status: 500, statusText: 'Server Error' });
      await expect(result).rejects.toThrow('Não foi possível carregar seus dados. Tente novamente.');
    });
  });

  // ─── getHistory ────────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('faz GET /api/v1/account/history com params padrão', () => {
      const history: ICustomerAccountHistory = {
        rentals: buildPagedRentals([buildRental()]),
        orders: [buildOrder()],
      };

      service.getHistory().subscribe(result => expect(result).toEqual(history));

      const req = httpMock.expectOne(r =>
        r.url === '/api/v1/account/history' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '10' &&
        r.params.get('sort') === 'createdAt,desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush(history);
    });

    it('passa page e size personalizados', () => {
      const history: ICustomerAccountHistory = { rentals: buildPagedRentals(), orders: [] };

      service.getHistory(1, 20).subscribe();

      const req = httpMock.expectOne(r =>
        r.params.get('page') === '1' && r.params.get('size') === '20'
      );
      req.flush(history);
    });

    it('retorna histórico vazio sem erro quando listas são vazias', () => {
      const empty: ICustomerAccountHistory = { rentals: buildPagedRentals([]), orders: [] };

      service.getHistory().subscribe(result => {
        expect(result.rentals.content).toHaveLength(0);
        expect(result.orders).toHaveLength(0);
      });

      httpMock.expectOne(r => r.url === '/api/v1/account/history').flush(empty);
    });

    it('emite erro amigável em 404', async () => {
      const result = lastValueFrom(service.getHistory());
      httpMock.expectOne(r => r.url === '/api/v1/account/history')
        .flush({}, { status: 404, statusText: 'Not Found' });
      await expect(result).rejects.toThrow('Serviço temporariamente indisponível. Tente novamente em instantes.');
    });

    it('emite erro amigável em 403', async () => {
      const result = lastValueFrom(service.getHistory());
      httpMock.expectOne(r => r.url === '/api/v1/account/history')
        .flush({}, { status: 403, statusText: 'Forbidden' });
      await expect(result).rejects.toThrow('Você não tem permissão para acessar este recurso.');
    });

    it('usa message do body para erros não mapeados', async () => {
      const result = lastValueFrom(service.getHistory());
      httpMock.expectOne(r => r.url === '/api/v1/account/history')
        .flush({ message: 'Falha no servidor' }, { status: 500, statusText: 'Server Error' });
      await expect(result).rejects.toThrow('Falha no servidor');
    });
  });
});

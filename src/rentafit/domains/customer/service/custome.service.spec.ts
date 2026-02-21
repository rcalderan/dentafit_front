import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerService } from './customer.service';
import { ICustomer } from '../data/Customer.interface';
import { ErrorMessages } from '../../../shared/data/error-messages';
import { lastValueFrom } from 'rxjs';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  const buildCustomer = (overrides: Partial<ICustomer> = {}): ICustomer => ({
    id: 'c-1',
    legacyId: 10,
    name: 'Ana Silva',
    document: '12345678900',
    isAuthenticated: true,
    email: 'ana@example.com',
    notes: 'note',
    complement: 'apt',
    number: '100',
    phones: ['11999990000'],
    address: {
      zipCode: '01000-000',
      street: 'Rua A',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP'
    },
    ...overrides
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '', s3BucketUrl: '' } }
      ]
    });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets customer by id', () => {
    const customer = buildCustomer({ id: 'c-2' });

    service.getCustomerById('c-2').subscribe(result => {
      expect(result).toEqual(customer);
    });

    const req = httpMock.expectOne('/api/v1/customers/byId/c-2');
    expect(req.request.method).toBe('GET');
    req.flush(customer);
  });

  it('gets customer by document', () => {
    const customer = buildCustomer({ document: '99988877766' });

    service.getCustomerByDocument('99988877766').subscribe(result => {
      expect(result).toEqual(customer);
    });

    const req = httpMock.expectOne('/api/v1/customers/byDocument/99988877766');
    expect(req.request.method).toBe('GET');
    req.flush(customer);
  });

  it('gets customer by legacy id', () => {
    const customer = buildCustomer({ legacyId: 55 });

    service.getCustomerByLegacyId(55).subscribe(result => {
      expect(result).toEqual(customer);
    });

    const req = httpMock.expectOne('/api/v1/customers/byLegacyId/55');
    expect(req.request.method).toBe('GET');
    req.flush(customer);
  });

  it('creates a new customer when no id exists', () => {
    const customer = buildCustomer({ id: undefined });

    service.saveCustomer(customer).subscribe(result => {
      expect(result).toEqual(customer);
    });

    const req = httpMock.expectOne('/api/v1/customers');
    expect(req.request.method).toBe('POST');
    req.flush(customer);
  });

  it('updates a customer when id exists', () => {
    const customer = buildCustomer({ id: 'c-10' });

    service.saveCustomer(customer).subscribe(result => {
      expect(result).toEqual(customer);
    });

    const getReq = httpMock.expectOne('/api/v1/customers/byId/c-10');
    expect(getReq.request.method).toBe('GET');
    getReq.flush(customer);

    const putReq = httpMock.expectOne('/api/v1/customers');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(customer);
    putReq.flush(customer);
  });

  it('maps known status codes to friendly messages', async () => {
    const resultPromise = lastValueFrom(service.getCustomerById('missing'));

    const req = httpMock.expectOne('/api/v1/customers/byId/missing');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    await expect(resultPromise).rejects.toThrow(ErrorMessages.NOT_FOUND);
  });

  it('uses API error message when status is unmapped', async () => {
    const resultPromise = lastValueFrom(service.getCustomerById('oops'));

    const req = httpMock.expectOne('/api/v1/customers/byId/oops');
    req.flush({ message: 'Custom error' }, { status: 418, statusText: 'Teapot' });

    await expect(resultPromise).rejects.toThrow('Custom error');
  });
});

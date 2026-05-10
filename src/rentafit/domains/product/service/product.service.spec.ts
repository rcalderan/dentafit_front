import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom, of } from 'rxjs';
import { vi } from 'vitest';
import { ProductService } from './product.service';
import { IRentalItem, IRetailItem } from '../data/Product.interface';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const buildRentalItem = (overrides: Partial<IRentalItem> = {}): IRentalItem => ({
    id: 'r-1',
    legacyId: 'L-1',
    name: 'Vestido',
    status: 'AVAILABLE',
    value: 120,
    categoryId: 'cat-1',
    categoryName: 'Vestidos',
    size: 'M',
    color: 'Azul',
    brand: 'Marca',
    description: 'Desc',
    notes: 'Notas',
    condition: 'NEW',
    ...overrides
  });

  const buildRetailItem = (overrides: Partial<IRetailItem> = {}): IRetailItem => ({
    id: 't-1',
    sku: 'SKU-1',
    name: 'Produto',
    value: 50,
    categoryId: 'cat-2',
    categoryName: 'Roupas',
    size: 'G',
    color: 'Preto',
    brand: 'Marca',
    description: 'Descricao',
    ...overrides
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '', s3BucketUrl: '' } }
      ]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a rental item when no id exists', () => {
    const item = buildRentalItem({ id: undefined });

    service.saveRentalItem(item).subscribe(result => {
      expect(result).toEqual(item);
    });

    const req = httpMock.expectOne('/api/v1/products/rental');
    expect(req.request.method).toBe('POST');
    req.flush(item);
  });

  it('updates a rental item when id exists', () => {
    const item = buildRentalItem({ id: 'r-10' });

    service.saveRentalItem(item).subscribe(result => {
      expect(result).toEqual(item);
    });

    const req = httpMock.expectOne('/api/v1/products/rental/r-10');
    expect(req.request.method).toBe('PUT');
    req.flush(item);
  });

  it('gets rental items by id and legacy id', () => {
    const item = buildRentalItem({ id: 'r-2', legacyId: 'L-22' });

    service.getRentalItemById('r-2').subscribe(result => {
      expect(result).toEqual(item);
    });

    const byIdReq = httpMock.expectOne('/api/v1/products/rental/r-2');
    expect(byIdReq.request.method).toBe('GET');
    byIdReq.flush(item);

    service.getRentalItemByLegacyId('L-22').subscribe(result => {
      expect(result).toEqual(item);
    });

    const legacyReq = httpMock.expectOne('/api/v1/products/rental/byLegacy/L-22');
    expect(legacyReq.request.method).toBe('GET');
    legacyReq.flush(item);
  });

  it('deletes a rental item', () => {
    service.deleteRentalItem('r-3').subscribe(result => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne('/api/v1/products/rental/r-3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('creates a retail item when no id exists', () => {
    const item = buildRetailItem({ id: undefined });

    service.saveRetailItem(item).subscribe(result => {
      expect(result).toEqual(item);
    });

    const req = httpMock.expectOne('/api/v1/products/retail');
    expect(req.request.method).toBe('POST');
    req.flush(item);
  });

  it('updates a retail item when id exists', () => {
    const item = buildRetailItem({ id: 't-10' });

    service.saveRetailItem(item).subscribe(result => {
      expect(result).toEqual(item);
    });

    const req = httpMock.expectOne('/api/v1/products/retail/t-10');
    expect(req.request.method).toBe('PUT');
    req.flush(item);
  });

  it('gets retail items by id and sku', () => {
    const item = buildRetailItem({ id: 't-2', sku: 'SKU-22' });

    service.getRetailItemById('t-2').subscribe(result => {
      expect(result).toEqual(item);
    });

    const byIdReq = httpMock.expectOne('/api/v1/products/retail/t-2');
    expect(byIdReq.request.method).toBe('GET');
    byIdReq.flush(item);

    service.getRetailItemBySku('SKU-22').subscribe(result => {
      expect(result).toEqual(item);
    });

    const skuReq = httpMock.expectOne('/api/v1/products/retail/bysku/SKU-22');
    expect(skuReq.request.method).toBe('GET');
    skuReq.flush(item);
  });

  it('deletes a retail item', () => {
    service.deleteRetailItem('t-3').subscribe(result => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne('/api/v1/products/retail/t-3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('delegates saveProduct to saveRentalItem', () => {
    const item = buildRentalItem({ id: 'r-11' });
    const spy = vi.spyOn(service, 'saveRentalItem').mockReturnValue(of(item));

    service.saveProduct(item).subscribe(result => {
      expect(result).toEqual(item);
    });

    expect(spy).toHaveBeenCalledWith(item);
  });

  it('relança HttpErrorResponse original para que os componentes tratem o status HTTP', async () => {
    const resultPromise = lastValueFrom(service.getRetailItemById('bad'));

    const req = httpMock.expectOne('/api/v1/products/retail/bad');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    await expect(resultPromise).rejects.toMatchObject({ status: 500, name: 'HttpErrorResponse' });
  });
});

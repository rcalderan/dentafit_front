import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IProduct, IRentalItem, IRetailItem } from '../data/Product.interface';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

export interface RetailListParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface IRetailPageResponse {
  content: IRetailItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly config = inject(APP_CONFIG);
  private readonly rentalApiUrl = `${this.config.apiBaseUrl}/api/v1/products/rental`;
  private readonly retailApiUrl = `${this.config.apiBaseUrl}/api/v1/products/retail`;

  constructor(private readonly httpClient: HttpClient) { }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProductService error:', error);
    return throwError(() => error);
  }

  // ─── Rental (Aluguel) ───────────────────────────────────

  saveRentalItem(item: IRentalItem): Observable<IRentalItem> {
    if (item.id) {
      return this.httpClient.put<IRentalItem>(`${this.rentalApiUrl}/${item.id}`, item).pipe(
        catchError(this.handleError.bind(this))
      );
    }
    return this.httpClient.post<IRentalItem>(this.rentalApiUrl, item).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getRentalItemById(id: string): Observable<IRentalItem> {
    return this.httpClient.get<IRentalItem>(`${this.rentalApiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getRentalItemByLegacyId(legacyId: string): Observable<IRentalItem> {
    return this.httpClient.get<IRentalItem>(`${this.rentalApiUrl}/byLegacy/${legacyId}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteRentalItem(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.rentalApiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // ─── Retail (Varejo) ────────────────────────────────────

  saveRetailItem(item: IRetailItem): Observable<IRetailItem> {
    if (item.id) {
      return this.httpClient.put<IRetailItem>(`${this.retailApiUrl}/${item.id}`, item).pipe(
        catchError(this.handleError.bind(this))
      );
    }
    return this.httpClient.post<IRetailItem>(this.retailApiUrl, item).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  listRetailItems(params?: RetailListParams): Observable<IRetailPageResponse> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.size != null) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.httpClient.get<IRetailPageResponse>(this.retailApiUrl, { params: httpParams }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getRetailItemById(id: string): Observable<IRetailItem> {
    return this.httpClient.get<IRetailItem>(`${this.retailApiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getRetailItemBySku(sku: string): Observable<IRetailItem> {
    return this.httpClient.get<IRetailItem>(`${this.retailApiUrl}/bysku/${sku}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteRetailItem(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.retailApiUrl}/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // ─── Compatibilidade (legado) ───────────────────────────

  /**
   * @deprecated Use saveRentalItem ou saveRetailItem
   */
  saveProduct(product: IProduct): Observable<IProduct> {
    return this.saveRentalItem(product);
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';
import { IProduct, IRentalItem, IRetailItem } from '../data/Product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly rentalApiUrl = '/api/v1/products/rental';
  private readonly retailApiUrl = '/api/v1/products/retail';

  constructor(private readonly httpClient: HttpClient) { }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProductService error:', error);
    const errorMessage = HTTP_ERROR_MAP[error.status] || error.error?.message || ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(errorMessage));
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

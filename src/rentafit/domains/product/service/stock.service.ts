import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IStockDTO, IStockMovementDTO } from '../data/Product.interface';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly config = inject(APP_CONFIG);
  private readonly baseUrl = `${this.config.apiBaseUrl}/api/v1/stock`;

  constructor(private readonly http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('StockService error:', error);
    return throwError(() => error);
  }

  /** GET /api/v1/stock/{productId} */
  getStock(productId: string): Observable<IStockDTO> {
    return this.http.get<IStockDTO>(`${this.baseUrl}/${productId}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** GET /api/v1/stock/low */
  getLowStock(): Observable<IStockDTO[]> {
    return this.http.get<IStockDTO[]>(`${this.baseUrl}/low`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** GET /api/v1/stock/{productId}/movements */
  getMovements(productId: string): Observable<IStockMovementDTO[]> {
    return this.http.get<IStockMovementDTO[]>(`${this.baseUrl}/${productId}/movements`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** POST /api/v1/stock/add */
  addStock(productId: string, quantity: number, userId: string, notes?: string): Observable<void> {
    let params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity)
      .set('userId', userId);
    if (notes) params = params.set('notes', notes);
    return this.http.post<void>(`${this.baseUrl}/add`, null, { params }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** POST /api/v1/stock/remove */
  removeStock(productId: string, quantity: number, userId: string, notes?: string): Observable<void> {
    let params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity)
      .set('userId', userId);
    if (notes) params = params.set('notes', notes);
    return this.http.post<void>(`${this.baseUrl}/remove`, null, { params }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** POST /api/v1/stock/reserve */
  reserveStock(productId: string, quantity: number, userId: string): Observable<void> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity)
      .set('userId', userId);
    return this.http.post<void>(`${this.baseUrl}/reserve`, null, { params }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /** POST /api/v1/stock/release */
  releaseStock(productId: string, quantity: number, userId: string): Observable<void> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity)
      .set('userId', userId);
    return this.http.post<void>(`${this.baseUrl}/release`, null, { params }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}

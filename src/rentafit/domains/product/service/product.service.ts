import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';
import { IProduct } from '../data/Product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = '/api/v1/products';

  constructor(private httpClient: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ProductService error:', error);
    const errorMessage = HTTP_ERROR_MAP[error.status] || error.error?.message || ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(errorMessage));
  }

  saveProduct(product: IProduct): Observable<IProduct> {
    if (product.id) {
      return this.httpClient.put<IProduct>(`${this.apiUrl}/${product.id}`, product).pipe(
        catchError(this.handleError.bind(this))
      );
    }
    return this.httpClient.post<IProduct>(this.apiUrl, product).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}

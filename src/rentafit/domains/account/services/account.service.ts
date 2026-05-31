import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import { ICustomerAccountHistory, IPagedRentals } from '../data/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${this.config.apiBaseUrl}/api/v1/account`;

  getRentals(page = 0, size = 10): Observable<IPagedRentals> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<IPagedRentals>(`${this.baseUrl}/rentals`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getHistory(page = 0, size = 10): Observable<ICustomerAccountHistory> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<ICustomerAccountHistory>(`${this.baseUrl}/history`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const msg = error.error?.message || `Erro ${error.status}: não foi possível carregar os dados.`;
    return throwError(() => new Error(msg));
  }
}

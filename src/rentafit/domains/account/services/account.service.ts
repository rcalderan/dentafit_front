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
    if (error.status === 404 || error.status === 0) {
      return throwError(() => new Error('Serviço temporariamente indisponível. Tente novamente em instantes.'));
    }
    if (error.status === 403) {
      return throwError(() => new Error('Você não tem permissão para acessar este recurso.'));
    }
    const msg = error.error?.message || 'Não foi possível carregar seus dados. Tente novamente.';
    return throwError(() => new Error(msg));
  }
}

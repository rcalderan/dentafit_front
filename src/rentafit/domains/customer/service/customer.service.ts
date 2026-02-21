import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICustomer } from '../data/Customer.interface';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';
import { APP_CONFIG } from '../../../shared/data/app-config.token';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly apiBaseUrl = inject(APP_CONFIG).apiBaseUrl;

  constructor(
    private readonly httpClient: HttpClient
  ) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('CustomerService error:', error);
    const errorMessage = HTTP_ERROR_MAP[error.status] || error.error?.message || ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(errorMessage));
  }

  public getCustomerById(customerId: string): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`${this.apiBaseUrl}/api/v1/customers/byId/${customerId}`).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  public getCustomerByDocument(document: string): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`${this.apiBaseUrl}/api/v1/customers/byDocument/${document}`).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  public getCustomerByLegacyId(id: number): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`${this.apiBaseUrl}/api/v1/customers/byLegacyId/${id}`).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  public saveCustomer(customer: ICustomer): Observable<ICustomer> {
    if (customer.id) {
      return this.getCustomerById(customer.id).pipe(
        switchMap(() => this.updateCustomer(customer))
      )
    } else {
      return this.createCustomer(customer);
    }
  }

  private createCustomer(customer: ICustomer): Observable<ICustomer> {
    return this.httpClient.post<ICustomer>(`${this.apiBaseUrl}/api/v1/customers`, customer).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  private updateCustomer(customer: ICustomer): Observable<ICustomer> {
    return this.httpClient.put<ICustomer>(`${this.apiBaseUrl}/api/v1/customers`, customer).pipe(
      catchError(this.handleError.bind(this)),
    );
  }
  
}

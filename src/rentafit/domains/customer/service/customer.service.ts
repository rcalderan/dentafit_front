import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICustomer } from '../data/Customer.interface';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {

  constructor(
    private readonly httpClient: HttpClient
  ) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('CustomerService error:', error);
    const errorMessage = HTTP_ERROR_MAP[error.status] || error.error?.message || ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(errorMessage));
  }

  public getCustomerById(customerId: string): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`/api/v1/customers/byId/${customerId}`).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  public getCustomerByDocument(document: string): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`/api/v1/customers/byDocument/${document}`).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  public getCustomerByLegacyId(id: number): Observable<ICustomer> {
    return this.httpClient.get<ICustomer>(`/api/v1/customers/byLegacyId/${id}`).pipe(
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
    return this.httpClient.post<ICustomer>(`/api/v1/customers`, customer).pipe(
      catchError(this.handleError.bind(this)),
    );
  }

  private updateCustomer(customer: ICustomer): Observable<ICustomer> {
    return this.httpClient.put<ICustomer>(`/api/v1/customers`, customer).pipe(
      catchError(this.handleError.bind(this)),
    );
  }
  
}

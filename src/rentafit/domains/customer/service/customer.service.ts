import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICustomer } from '../data/Customer.interface';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {

  constructor(
    private readonly httpClient: HttpClient
  ) {}

  public getCustomerById(customerId: string): any {
    return this.httpClient.get(`/api/v1/customers/byId/${customerId}`).pipe(
      catchError((error) => {
        console.error('Erro ao buscar cliente:', error);
        throw error;
      }),
    );
  }

  public getCustomerByDocument(document: string): any {
    return this.httpClient.get(`/api'/v1/customers/byDocument/${document}`).pipe(
      catchError((error) => {
        console.error('Erro ao buscar cliente:', error);
        throw error;
      }),
    );
  }

  public getCustomerByLegacyId(id: number): Observable<ICustomer> {
    return this.httpClient.get(`/api/v1/customers/byLegacyId/${id}`).pipe(
      catchError((error) => {
        console.error('Erro ao buscar cliente:', error);
        throw error;
      }),
      map((response: any) => response as ICustomer),
    );
  }

  public saveCustomer(customer: ICustomer): Observable<ICustomer> {
    if (customer.id) {
      return this.getCustomerById(customer.id).pipe(
        catchError((error) => {
          throw error;
        }),
        switchMap(() => this.updateCustomer(customer))
      )
    } else {
      return this.createCustomer(customer);
    }
  }

  private createCustomer(customer: ICustomer): Observable<ICustomer> {
    return this.httpClient.post<ICustomer>(`/api/v1/customers`, customer).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  private updateCustomer(customer: ICustomer): Observable<ICustomer> {
    return this.httpClient.put<ICustomer>(`/api/v1/customers`, customer).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }
  
}

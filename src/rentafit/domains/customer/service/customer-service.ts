import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICustomer } from '../data/Customer.interface';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {

  constructor(
    private readonly httpClient: HttpClient
  ) {}

  public getCustomerById(customerId: string): any {
    return this.httpClient.get(`/api/v1/customers/byDocument/${customerId}`).pipe(
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
    /**{
    "id": "d8d98e8b-2788-4917-95a9-53ef056951be",
    "name": "Ma5465767887ira",
    "document": "10987654321",
    "email": "maria.oliveira@example.com",
    "isAuthenticated": true,
    "notes": "Cliente novo",
    "address": {
        "zipCode": "23456-789",
        "street": "Avenida Brasil",
        "neighborhood": "Jardim América",
        "city": "Rio de Janeiro",
        "state": "RJ"
    },
    "number": "456",
    "complement": "Casa 12",
    "phones": [
        "21987654321",
        "2133334444"
    ]
} */
  }

  public createCustomer(customer: ICustomer): any {
    return this.httpClient.post(`/api/v1/customers`, customer).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }
  
}

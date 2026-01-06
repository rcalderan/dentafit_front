import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Customer } from '../data/customer';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {

  constructor(
    private readonly httpClient: HttpClient
  ) {}

  public getCustomerById(customerId: string): any {
    return this.httpClient.get(`/api/customers/${customerId}`);
  }
  
}

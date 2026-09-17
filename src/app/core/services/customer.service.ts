import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly API_URL = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  public getCustomers(page = 1, limit = 50, search?: string): Observable<ApiResponse<Customer[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Customer[]>>(this.API_URL, { params });
  }

  public getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.API_URL}/${id}`);
  }

  public createCustomer(data: any): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.API_URL, data);
  }

  public updateCustomer(id: number, data: any): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.API_URL}/${id}`, data);
  }

  public deleteCustomer(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  public getPurchaseHistory(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/${id}/purchase-history`);
  }
}

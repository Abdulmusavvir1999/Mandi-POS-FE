import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CustomerNote, CustomerAnalytics, CustomerSummaryKpis, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly API_URL = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  public getCustomers(page = 1, limit = 50, search?: string, segment?: string): Observable<ApiResponse<Customer[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (segment && segment !== 'ALL') params = params.set('segment', segment);
    return this.http.get<ApiResponse<Customer[]>>(this.API_URL, { params });
  }

  public getCrmSummary(): Observable<ApiResponse<CustomerSummaryKpis>> {
    return this.http.get<ApiResponse<CustomerSummaryKpis>>(`${this.API_URL}/summary`);
  }

  public getCustomerById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.API_URL}/${id}`);
  }

  /** Uploads a customer photo as a data URL and returns its stored path. */
  public uploadCustomerImage(dataUrl: string): Observable<ApiResponse<{ url: string; fileName: string; bytes: number }>> {
    return this.http.post<ApiResponse<{ url: string; fileName: string; bytes: number }>>(`${this.API_URL}/image`, { dataUrl });
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

  public getCustomerAnalytics(id: number): Observable<ApiResponse<CustomerAnalytics>> {
    return this.http.get<ApiResponse<CustomerAnalytics>>(`${this.API_URL}/${id}/analytics`);
  }

  public getCustomerNotes(customerId: number): Observable<ApiResponse<CustomerNote[]>> {
    return this.http.get<ApiResponse<CustomerNote[]>>(`${this.API_URL}/${customerId}/notes`);
  }

  public createCustomerNote(customerId: number, data: { note_type: string; note_text: string; author_name?: string }): Observable<ApiResponse<CustomerNote>> {
    return this.http.post<ApiResponse<CustomerNote>>(`${this.API_URL}/${customerId}/notes`, data);
  }

  public deleteCustomerNote(customerId: number, noteId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${customerId}/notes/${noteId}`);
  }
}

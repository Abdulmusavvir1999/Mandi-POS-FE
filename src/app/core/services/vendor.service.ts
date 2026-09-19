import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Vendor, VendorPurchase, VendorPayment, VendorStats } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private readonly API_URL = `${environment.apiUrl}/vendors`;

  constructor(private http: HttpClient) {}

  public getVendors(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Observable<ApiResponse<Vendor[]>> {
    let params = new HttpParams()
      .set('page', (options.page || 1).toString())
      .set('limit', (options.limit || 50).toString());

    if (options.search) params = params.set('search', options.search);
    if (options.category && options.category !== 'ALL') params = params.set('category', options.category);
    if (options.status && options.status !== 'ALL') params = params.set('status', options.status);
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);

    return this.http.get<ApiResponse<Vendor[]>>(this.API_URL, { params });
  }

  public getStats(): Observable<ApiResponse<VendorStats>> {
    return this.http.get<ApiResponse<VendorStats>>(`${this.API_URL}/stats`);
  }

  public getVendorById(id: number): Observable<ApiResponse<Vendor>> {
    return this.http.get<ApiResponse<Vendor>>(`${this.API_URL}/${id}`);
  }

  public createVendor(data: Partial<Vendor>): Observable<ApiResponse<Vendor>> {
    return this.http.post<ApiResponse<Vendor>>(this.API_URL, data);
  }

  public updateVendor(id: number, data: Partial<Vendor>): Observable<ApiResponse<Vendor>> {
    return this.http.put<ApiResponse<Vendor>>(`${this.API_URL}/${id}`, data);
  }

  public deleteVendor(id: number): Observable<ApiResponse<{ success: boolean; message: string }>> {
    return this.http.delete<ApiResponse<{ success: boolean; message: string }>>(`${this.API_URL}/${id}`);
  }

  public getPurchases(vendorId: number, page = 1, limit = 50): Observable<ApiResponse<VendorPurchase[]>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<ApiResponse<VendorPurchase[]>>(`${this.API_URL}/${vendorId}/purchases`, { params });
  }

  public recordPurchase(vendorId: number, data: {
    invoice_number: string;
    order_date: string;
    due_date?: string;
    total_amount: number;
    paid_amount?: number;
    items_summary?: string;
    notes?: string;
  }): Observable<ApiResponse<Vendor>> {
    return this.http.post<ApiResponse<Vendor>>(`${this.API_URL}/${vendorId}/purchases`, data);
  }

  public getPayments(vendorId: number, page = 1, limit = 50): Observable<ApiResponse<VendorPayment[]>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<ApiResponse<VendorPayment[]>>(`${this.API_URL}/${vendorId}/payments`, { params });
  }

  public recordPayment(vendorId: number, data: {
    purchase_id?: number;
    payment_number?: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }): Observable<ApiResponse<Vendor>> {
    return this.http.post<ApiResponse<Vendor>>(`${this.API_URL}/${vendorId}/payments`, data);
  }

  public updateRating(vendorId: number, data: {
    rating?: number;
    delivery_speed_rating?: number;
    quality_rating?: number;
    pricing_rating?: number;
    on_time_delivery_rate?: number;
    quality_score?: number;
    fulfillment_rate?: number;
    performance_notes?: string;
  }): Observable<ApiResponse<Vendor>> {
    return this.http.patch<ApiResponse<Vendor>>(`${this.API_URL}/${vendorId}/rating`, data);
  }
}

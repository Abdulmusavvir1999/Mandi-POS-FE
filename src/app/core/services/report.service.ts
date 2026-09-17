import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly API_URL = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  public getSalesReport(dateFrom?: string, dateTo?: string, paymentMethod?: string, orderType?: string, cashierId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
    if (orderType) params = params.set('orderType', orderType);
    if (cashierId) params = params.set('cashierId', cashierId);

    return this.http.get<ApiResponse<any>>(`${this.API_URL}/sales`, { params });
  }

  public getProductSalesReport(dateFrom?: string, dateTo?: string, categoryId?: number): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (categoryId) params = params.set('categoryId', categoryId);

    return this.http.get<ApiResponse<any>>(`${this.API_URL}/products`, { params });
  }

  public getCategorySalesReport(dateFrom?: string, dateTo?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<ApiResponse<any>>(`${this.API_URL}/categories`, { params });
  }

  public getStockReport(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/stock`);
  }
}

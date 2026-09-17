import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockItem, StockTransaction, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly API_URL = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  public getStock(page = 1, limit = 50, search?: string, categoryId?: number, lowStockOnly = false): Observable<ApiResponse<StockItem[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (lowStockOnly) params = params.set('lowStockOnly', true);

    return this.http.get<ApiResponse<StockItem[]>>(this.API_URL, { params });
  }

  public getLowStockAlerts(): Observable<ApiResponse<StockItem[]>> {
    return this.http.get<ApiResponse<StockItem[]>>(`${this.API_URL}/low-stock`);
  }

  public stockIn(data: { productId: number; quantity: number; supplier?: string; invoiceNumber?: string; notes?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/in`, data);
  }

  public adjustStock(data: { productId: number; adjustmentType: 'INCREASE' | 'DECREASE'; quantity: number; reason: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/adjust`, data);
  }

  public getTransactions(page = 1, limit = 50, productId?: number, type?: string): Observable<ApiResponse<StockTransaction[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (productId) params = params.set('productId', productId);
    if (type) params = params.set('type', type);

    return this.http.get<ApiResponse<StockTransaction[]>>(`${this.API_URL}/transactions`, { params });
  }
}

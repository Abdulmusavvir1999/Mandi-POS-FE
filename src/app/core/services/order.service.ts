import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, ApiResponse, OrderStatus, OrderType } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly API_URL = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  public getOrders(
    page = 1,
    limit = 50,
    status?: OrderStatus,
    orderType?: OrderType,
    search?: string,
    diningTableId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    if (orderType) params = params.set('orderType', orderType);
    if (search) params = params.set('search', search);
    if (diningTableId) params = params.set('diningTableId', diningTableId);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<ApiResponse<Order[]>>(this.API_URL, { params });
  }

  public getOrderById(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.API_URL}/${id}`);
  }

  public createOrder(data: any): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.API_URL, data);
  }

  public startOrder(id: number, notes?: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.API_URL}/${id}/start`, { notes });
  }

  public completeOrder(id: number, notes?: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.API_URL}/${id}/complete`, { notes });
  }

  public cancelOrder(id: number, reason?: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.API_URL}/${id}/cancel`, { reason });
  }
}

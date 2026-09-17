import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, ApiResponse, PaymentMethod, OrderType } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  private readonly API_URL = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) {}

  public getBills(
    page = 1,
    limit = 50,
    search?: string,
    paymentMethod?: PaymentMethod,
    orderType?: OrderType,
    dateFrom?: string,
    dateTo?: string,
    cashierId?: number
  ): Observable<ApiResponse<Bill[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
    if (orderType) params = params.set('orderType', orderType);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (cashierId) params = params.set('cashierId', cashierId);

    return this.http.get<ApiResponse<Bill[]>>(this.API_URL, { params });
  }

  public getBillById(id: number): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.API_URL}/${id}`);
  }

  public getPrintData(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${id}/print`);
  }
}

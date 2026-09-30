import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

export interface StockCheckResult {
  ok: boolean;
  lines: { index: number; quantity: number; max: number | null; ok: boolean }[];
  stocks: { stock_id: number; name: string; unit_type: string; available: number; required: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly API_URL = `${environment.apiUrl}/checkout`;

  constructor(private http: HttpClient) {}

  public checkout(payload: any): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(this.API_URL, payload);
  }

  /**
   * Live stock check - the checkout's rule, nothing sold. Returns each line's
   * most allowed quantity (null = no limit) and the current balances.
   */
  public stockCheck(items: any[], existingOrderId?: number | null): Observable<ApiResponse<StockCheckResult>> {
    return this.http.post<ApiResponse<StockCheckResult>>(`${this.API_URL}/stock-check`, { items, existingOrderId: existingOrderId ?? null });
  }

  public syncOffline(orders: any[]): Observable<ApiResponse<{ syncedCount: number; results: any[] }>> {
    return this.http.post<ApiResponse<{ syncedCount: number; results: any[] }>>(`${this.API_URL}/sync-offline`, { orders });
  }
}

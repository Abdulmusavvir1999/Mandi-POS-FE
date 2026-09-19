import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PosDayClosing } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PosClosingService {
  private readonly API_URL = `${environment.apiUrl}/pos/closing`;

  constructor(private http: HttpClient) {}

  public getCurrentShift(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/current-shift`);
  }

  public createDayClosing(payload: { openingCash: number; actualCash: number; notes?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.API_URL, payload);
  }

  public getHistory(page = 1, limit = 20): Observable<ApiResponse<PosDayClosing[]>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PosDayClosing[]>>(`${this.API_URL}/history`, { params });
  }

  public getById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }
}

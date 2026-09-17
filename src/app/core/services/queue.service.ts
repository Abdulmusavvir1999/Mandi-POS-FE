import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueueToken, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  private readonly API_URL = `${environment.apiUrl}/queue`;

  constructor(private http: HttpClient) {}

  public getQueue(status?: string, date?: string): Observable<ApiResponse<QueueToken[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<QueueToken[]>>(this.API_URL, { params });
  }

  public getPendingQueue(): Observable<ApiResponse<QueueToken[]>> {
    return this.http.get<ApiResponse<QueueToken[]>>(`${this.API_URL}/pending`);
  }

  public createToken(data: any): Observable<ApiResponse<QueueToken>> {
    return this.http.post<ApiResponse<QueueToken>>(this.API_URL, data);
  }

  public startToken(id: number): Observable<ApiResponse<QueueToken>> {
    return this.http.post<ApiResponse<QueueToken>>(`${this.API_URL}/${id}/start`, {});
  }

  public completeToken(id: number): Observable<ApiResponse<QueueToken>> {
    return this.http.post<ApiResponse<QueueToken>>(`${this.API_URL}/${id}/complete`, {});
  }

  public cancelToken(id: number): Observable<ApiResponse<QueueToken>> {
    return this.http.post<ApiResponse<QueueToken>>(`${this.API_URL}/${id}/cancel`, {});
  }
}

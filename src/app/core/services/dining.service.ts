import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiningTable, ApiResponse, TableStatus } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DiningService {
  private readonly API_URL = `${environment.apiUrl}/dining-tables`;

  constructor(private http: HttpClient) {}

  public getTables(section?: string, status?: string): Observable<ApiResponse<DiningTable[]>> {
    let params = new HttpParams();
    if (section) params = params.set('section', section);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<DiningTable[]>>(this.API_URL, { params });
  }

  public getSections(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.API_URL}/sections`);
  }

  public getTableById(id: number): Observable<ApiResponse<DiningTable>> {
    return this.http.get<ApiResponse<DiningTable>>(`${this.API_URL}/${id}`);
  }

  public createTable(data: any): Observable<ApiResponse<DiningTable>> {
    return this.http.post<ApiResponse<DiningTable>>(this.API_URL, data);
  }

  public updateTable(id: number, data: any): Observable<ApiResponse<DiningTable>> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.API_URL}/${id}`, data);
  }

  public setStatus(id: number, status: TableStatus, orderId?: number | null): Observable<ApiResponse<DiningTable>> {
    return this.http.patch<ApiResponse<DiningTable>>(`${this.API_URL}/${id}/status`, { status, orderId });
  }

  public deleteTable(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiningTable, ApiResponse, TableStatus, TableReservation, TableHistoryItem } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DiningService {
  private readonly API_URL = `${environment.apiUrl}/dining-tables`;

  constructor(private http: HttpClient) {}

  public getTables(section?: string, status?: string): Observable<ApiResponse<DiningTable[]>> {
    let params = new HttpParams();
    if (section && section !== 'ALL') params = params.set('section', section);
    if (status && status !== 'ALL') params = params.set('status', status);
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

  public setStatus(id: number, status: TableStatus, orderId?: number | null, guestCount?: number): Observable<ApiResponse<DiningTable>> {
    return this.http.patch<ApiResponse<DiningTable>>(`${this.API_URL}/${id}/status`, { status, orderId, guestCount });
  }

  public seatGuests(id: number, guestCount: number, orderId?: number | null): Observable<ApiResponse<DiningTable>> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.API_URL}/${id}/seat`, { guestCount, orderId });
  }

  public cleanTable(id: number): Observable<ApiResponse<DiningTable>> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.API_URL}/${id}/clean`, {});
  }

  public finishCleaning(id: number): Observable<ApiResponse<DiningTable>> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.API_URL}/${id}/ready`, {});
  }

  public getTableHistory(id: number): Observable<ApiResponse<TableHistoryItem[]>> {
    return this.http.get<ApiResponse<TableHistoryItem[]>>(`${this.API_URL}/${id}/history`);
  }

  public deleteTable(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  // Table Reservations
  public getReservations(date?: string, status?: string): Observable<ApiResponse<TableReservation[]>> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (status && status !== 'ALL') params = params.set('status', status);
    return this.http.get<ApiResponse<TableReservation[]>>(`${this.API_URL}/reservations`, { params });
  }

  public createReservation(data: Partial<TableReservation>): Observable<ApiResponse<TableReservation>> {
    return this.http.post<ApiResponse<TableReservation>>(`${this.API_URL}/reservations`, data);
  }

  public seatReservation(reservationId: number, tableId: number): Observable<ApiResponse<DiningTable>> {
    return this.http.put<ApiResponse<DiningTable>>(`${this.API_URL}/reservations/${reservationId}/seat`, { tableId });
  }

  public cancelReservation(reservationId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/reservations/${reservationId}`);
  }
}

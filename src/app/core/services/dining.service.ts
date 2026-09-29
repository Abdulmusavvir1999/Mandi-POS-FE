import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiningTable, ApiResponse, TableStatus, TableReservation, TableHistoryItem } from '../models';
import { environment } from '../../../environments/environment';

export interface TableHistoryFilters {
  tableId: number;
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TableHistorySummary {
  sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  revenue: number;
  avg_bill: number;
  avg_minutes: number;
  last_session_at: string | null;
}

export interface TableHistoryPage {
  table: DiningTable;
  summary: TableHistorySummary;
  rows: (TableHistoryItem & { payment_status?: string; customer_id?: number })[];
  total: number;
  page: number;
  limit: number;
}

export interface DiningTabLine {
  id: number;
  product_id: number | null;
  product_name: string;
  variant_id: number | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  item_type?: 'PRODUCT' | 'COMBO' | 'ADDON';
  combo_id?: number | null;
  addon_id?: number | null;
  is_complimentary: boolean;
  complimentary_reason?: string | null;
  selected_addons: any[];
  kot_round: number | null;
  created_at?: string;
}

export interface DiningTab {
  table: DiningTable;
  order: { id: number; order_number: string; status: string; customer_id: number | null; created_at: string } | null;
  items: DiningTabLine[];
  rounds: number;
  subtotal: number;
}

export interface ReservationFilters {
  from?: string;
  to?: string;
  status?: string;
  search?: string;
}

export interface ReservationInput {
  customerName: string;
  customerPhone: string;
  reservationTime: string;
  guestCount: number;
  tableId?: number | null;
  preferredSection?: string;
  specialRequests?: string;
}

export type ReservationRow = TableReservation & { table_status?: TableStatus; minutes_until?: number };

export interface ReservationList {
  rows: ReservationRow[];
  counts: { total: number; confirmed: number; seated: number; cancelled: number; no_show: number; covers: number; late: number };
  today: { bookings: number; covers: number; pending: number; seated: number };
}

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

  public getTableHistoryPage(filters: TableHistoryFilters): Observable<ApiResponse<TableHistoryPage>> {
    return this.http.post<ApiResponse<TableHistoryPage>>(`${this.API_URL}/history`, filters);
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

  // ─── Open dining tabs (POST, params in body) ───
  public getTab(tableId: number): Observable<ApiResponse<DiningTab>> {
    return this.http.post<ApiResponse<DiningTab>>(`${this.API_URL}/tab/get`, { tableId });
  }

  public sendTabToKitchen(body: {
    tableId: number;
    items: any[];
    customerId?: number | null;
    guestCount?: number | null;
    notes?: string;
  }): Observable<ApiResponse<{ tab: DiningTab; round: number; kot: any }>> {
    return this.http.post<ApiResponse<{ tab: DiningTab; round: number; kot: any }>>(`${this.API_URL}/tab/send`, body);
  }

  public removeTabLine(orderItemId: number, reason?: string): Observable<ApiResponse<DiningTab>> {
    return this.http.post<ApiResponse<DiningTab>>(`${this.API_URL}/tab/remove-line`, { orderItemId, reason });
  }

  public cancelTab(tableId: number, reason?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/tab/cancel`, { tableId, reason });
  }

  // ─── Reservations page (POST, params in body) ───
  public listReservations(filters: ReservationFilters): Observable<ApiResponse<ReservationList>> {
    return this.http.post<ApiResponse<ReservationList>>(`${this.API_URL}/reservations/list`, filters);
  }

  public createReservationPost(data: ReservationInput): Observable<ApiResponse<TableReservation>> {
    return this.http.post<ApiResponse<TableReservation>>(`${this.API_URL}/reservations/create`, data);
  }

  public seatReservationPost(reservationId: number, tableId?: number | null): Observable<ApiResponse<DiningTable>> {
    return this.http.post<ApiResponse<DiningTable>>(`${this.API_URL}/reservations/seat`, { reservationId, tableId });
  }

  public cancelReservationPost(reservationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/reservations/cancel`, { reservationId });
  }

  public markReservationNoShow(reservationId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/reservations/no-show`, { reservationId });
  }

  public cancelReservation(reservationId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/reservations/${reservationId}`);
  }
}

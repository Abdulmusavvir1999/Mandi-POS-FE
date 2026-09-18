import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Filters shared by every Staff Track screen. One shape keeps a date range or a
 * staff selection meaningful when the user moves between tabs instead of each
 * tab inventing its own query string.
 */
export interface StaffTrackFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: number | null;
  roleId?: number | null;
  status?: string;
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  tableId?: number | null;
  module?: string;
  action?: string;
}

export interface StaffRef {
  id: number;
  name: string;
  username: string;
  roleName?: string;
  at?: string;
}

export interface StaffTrackOverview {
  totalUsers: number;
  activeUsers: number;
  recentlyActiveStaff: number;
  activeWindowMinutes: number;
  ordersTaken: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  orderValue: number;
  tablesServed: number;
  revenue: number;
  billsSettled: number;
  grossSales: number;
  discountAmount: number;
  taxAmount: number;
  activeTables: number;
  totalTables: number;
}

export interface StaffTrackRow {
  id: number;
  name: string;
  username: string;
  email: string;
  imageUrl: string | null;
  roleName: string;
  status: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  currentActivity: { action: string; module: string; recordId: string | null; at: string } | null;
  ordersTaken: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  orderValue: number;
  averageOrderValue: number;
  itemsHandled: number;
  revenue: number;
  billsSettled: number;
  grossSales: number;
  discountAmount: number;
  taxAmount: number;
  activeTables: number;
  tablesAttended: number;
  averageServiceSeconds: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class StaffTrackService {
  private readonly API_URL = `${environment.apiUrl}/staff-track`;

  constructor(private http: HttpClient) {}

  /** Only filters the caller actually set are sent, keeping WHERE clauses lean. */
  private toParams(filters: StaffTrackFilters = {}, extra: Record<string, any> = {}): HttpParams {
    let params = new HttpParams();
    const all: Record<string, any> = { ...filters, ...extra };
    Object.keys(all).forEach((key) => {
      const value = all[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  public getOverview(filters: StaffTrackFilters = {}): Observable<ApiResponse<StaffTrackOverview>> {
    return this.http.get<ApiResponse<StaffTrackOverview>>(`${this.API_URL}/overview`, {
      params: this.toParams(filters),
    });
  }

  /**
   * Snapshot of who is active right now. Loaded on entry and on explicit
   * refresh — the API has no socket or event stream to subscribe to.
   */
  public getLive(windowMinutes = 30): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/live`, {
      params: this.toParams({}, { windowMinutes }),
    });
  }

  public getFilterOptions(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/filters`);
  }

  public getStaff(filters: StaffTrackFilters = {}, page = 1, limit = 25): Observable<ApiResponse<StaffTrackRow[]>> {
    return this.http.get<ApiResponse<StaffTrackRow[]>>(`${this.API_URL}/staff`, {
      params: this.toParams(filters, { page, limit }),
    });
  }

  public getStaffDetail(id: number, filters: StaffTrackFilters = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/staff/${id}`, {
      params: this.toParams(filters),
    });
  }

  public getOrders(filters: StaffTrackFilters = {}, page = 1, limit = 25): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/orders`, {
      params: this.toParams(filters, { page, limit }),
    });
  }

  public getOrderDetail(orderId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/orders/${orderId}`);
  }

  public getRevenue(filters: StaffTrackFilters = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/revenue`, { params: this.toParams(filters) });
  }

  public getTables(filters: StaffTrackFilters = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/tables`, { params: this.toParams(filters) });
  }

  public getActivity(filters: StaffTrackFilters = {}, page = 1, limit = 50): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/activity`, {
      params: this.toParams(filters, { page, limit }),
    });
  }

  public getOrdersReport(filters: StaffTrackFilters = {}): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/reports/orders`, { params: this.toParams(filters) });
  }

  public getRevenueReport(filters: StaffTrackFilters = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/reports/revenue`, { params: this.toParams(filters) });
  }

  public getTablesReport(filters: StaffTrackFilters = {}): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/reports/tables`, { params: this.toParams(filters) });
  }

  public getActivityReport(filters: StaffTrackFilters = {}): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/reports/activity`, { params: this.toParams(filters) });
  }

  public getSummaryReport(
    period: 'daily' | 'weekly' | 'monthly',
    filters: StaffTrackFilters = {}
  ): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/reports/summary`, {
      params: this.toParams(filters, { period }),
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Bill, Order, OrderStatus, OrderType, PaymentMethod } from '../models';
import { environment } from '../../../environments/environment';

/** One record's outcome inside a bulk operation. */
export interface BulkOutcome {
  id: number;
  reference: string;
  reason: string;
}

export interface BulkResult<T = any> {
  requested: number;
  succeeded: BulkOutcome[];
  failed: BulkOutcome[];
  details?: T;
}

/** An order row as the back-office grid needs it: always carrying its invoice. */
export interface BackOfficeOrder extends Order {
  bill_is_voided?: boolean | number;
}

export interface BackOfficeOrderLine {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface BackOfficeOrderDraft {
  customerId?: number | null;
  diningTableId?: number | null;
  orderType: OrderType;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: BackOfficeOrderLine[];
}

/**
 * Client for the administrator-only Back-Office API.
 *
 * It talks exclusively to `/back-office/*`. The existing OrderService and
 * BillService are left alone so the Orders, POS and Invoices screens keep
 * calling the endpoints they always have.
 */
@Injectable({
  providedIn: 'root',
})
export class BackOfficeService {
  private readonly API_URL = `${environment.apiUrl}/back-office`;

  constructor(private http: HttpClient) {}

  // ── Orders ──────────────────────────────────────────────────────────

  public getOrders(filters: {
    page?: number;
    limit?: number;
    status?: OrderStatus | '';
    orderType?: OrderType | '';
    search?: string;
    hasInvoice?: 'YES' | 'NO' | '';
    dateFrom?: string;
    dateTo?: string;
  }): Observable<ApiResponse<BackOfficeOrder[]>> {
    let params = new HttpParams()
      .set('page', filters.page || 1)
      .set('limit', filters.limit || 20);

    if (filters.status) params = params.set('status', filters.status);
    if (filters.orderType) params = params.set('orderType', filters.orderType);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.hasInvoice) params = params.set('hasInvoice', filters.hasInvoice);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get<ApiResponse<BackOfficeOrder[]>>(`${this.API_URL}/orders`, { params });
  }

  public getOrderById(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.API_URL}/orders/${id}`);
  }

  /** Creates the order and its invoice in one call — no manual invoicing step. */
  public createOrder(draft: BackOfficeOrderDraft): Observable<ApiResponse<{ order: Order; invoice: Bill | null }>> {
    return this.http.post<ApiResponse<{ order: Order; invoice: Bill | null }>>(
      `${this.API_URL}/orders`,
      draft
    );
  }

  public deleteOrder(id: number): Observable<ApiResponse<BulkResult>> {
    return this.http.delete<ApiResponse<BulkResult>>(`${this.API_URL}/orders/${id}`);
  }

  public deleteOrders(orderIds: number[]): Observable<ApiResponse<BulkResult>> {
    return this.http.post<ApiResponse<BulkResult>>(`${this.API_URL}/orders/bulk-delete`, { orderIds });
  }

  /**
   * Applies the discount in full to every selected order — a fixed 100 means
   * 100 off each order, not 100 shared between them.
   */
  public applyDiscount(
    orderIds: number[],
    discountType: 'FIXED' | 'PERCENTAGE',
    discountValue: number
  ): Observable<ApiResponse<BulkResult>> {
    return this.http.post<ApiResponse<BulkResult>>(`${this.API_URL}/orders/bulk-discount`, {
      orderIds,
      discountType,
      discountValue,
    });
  }

  // ── Invoices ────────────────────────────────────────────────────────

  public getInvoices(filters: {
    page?: number;
    limit?: number;
    search?: string;
    paymentMethod?: PaymentMethod | '';
    orderType?: OrderType | '';
    dateFrom?: string;
    dateTo?: string;
  }): Observable<ApiResponse<Bill[]>> {
    let params = new HttpParams()
      .set('page', filters.page || 1)
      .set('limit', filters.limit || 20);

    if (filters.search) params = params.set('search', filters.search);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    if (filters.orderType) params = params.set('orderType', filters.orderType);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get<ApiResponse<Bill[]>>(`${this.API_URL}/invoices`, { params });
  }

  public getInvoiceById(id: number): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.API_URL}/invoices/${id}`);
  }

  public deleteInvoice(id: number): Observable<ApiResponse<BulkResult>> {
    return this.http.delete<ApiResponse<BulkResult>>(`${this.API_URL}/invoices/${id}`);
  }

  public deleteInvoices(invoiceIds: number[]): Observable<ApiResponse<BulkResult>> {
    return this.http.post<ApiResponse<BulkResult>>(`${this.API_URL}/invoices/bulk-delete`, { invoiceIds });
  }
}

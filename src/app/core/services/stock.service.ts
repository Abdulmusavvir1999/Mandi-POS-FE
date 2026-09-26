import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockItem, StockEntry, StockMovement, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly API_URL = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  /**
   * 1. Stock Master Items List
   */
  public getStock(
    page = 1,
    limit = 50,
    search?: string,
    categoryId?: number,
    lowStockOnly = false,
    status = 'active',
    unitType?: string
  ): Observable<ApiResponse<StockItem[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (lowStockOnly) params = params.set('lowStockOnly', true);
    if (status && status !== 'all') params = params.set('status', status);
    if (unitType) params = params.set('unitType', unitType);

    return this.http.get<ApiResponse<StockItem[]>>(this.API_URL, { params });
  }

  /**
   * 2. Stock Item Details with History
   */
  public getStockItemById(id: number): Observable<ApiResponse<StockItem & { entries: StockEntry[]; movements: StockMovement[] }>> {
    return this.http.get<ApiResponse<StockItem & { entries: StockEntry[]; movements: StockMovement[] }>>(`${this.API_URL}/items/${id}`);
  }

  /**
   * 3. Create New Stock Master Item
   */
  public createStockItem(data: {
    name: string;
    stockCode?: string;
    unitType?: string;
    minStockAlert?: number;
    reorderLevel?: number;
    reorderQuantity?: number;
    maxStockThreshold?: number;
    shelfLifeDays?: number;
    productId?: number | null;
    initialQuantity?: number;
    multiplier?: number;
    initialTotalPrice?: number;
    initialPrice?: number;
  }): Observable<ApiResponse<StockItem>> {
    return this.http.post<ApiResponse<StockItem>>(`${this.API_URL}/items`, data);
  }

  /**
   * 4. Update Stock Master Item
   */
  public updateStockItem(
    id: number,
    data: {
      name?: string;
      unitType?: string;
      minStockAlert?: number;
      reorderLevel?: number;
      reorderQuantity?: number;
      maxStockThreshold?: number;
      shelfLifeDays?: number;
      status?: 'active' | 'inactive';
    }
  ): Observable<ApiResponse<StockItem>> {
    return this.http.put<ApiResponse<StockItem>>(`${this.API_URL}/items/${id}`, data);
  }

  /**
   * 5. Get Purchase Entries Ledger
   */
  public getStockEntries(
    page = 1,
    limit = 50,
    stockItemId?: number,
    search?: string,
    supplier?: string,
    dateFrom?: string,
    dateTo?: string,
    vendorId?: number
  ): Observable<ApiResponse<StockEntry[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (stockItemId) params = params.set('stockItemId', stockItemId);
    if (search) params = params.set('search', search);
    if (supplier) params = params.set('supplier', supplier);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (vendorId) params = params.set('vendorId', vendorId);

    return this.http.get<ApiResponse<StockEntry[]>>(`${this.API_URL}/entries`, { params });
  }

  /**
   * 6. Create Purchase Entry (Quantity × Multiplier = Total Quantity, Total Price ÷ Total Qty = Unit Price)
   */
  public createStockEntry(data: {
    stockItemId?: number;
    productId?: number;
    quantity: number;
    multiplier?: number;
    totalPrice: number;
    unitPrice?: number;
    supplier?: string;
    notes?: string;
    entryDate?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/entries`, data);
  }

  /**
   * 7. Get Stock Movements Audit Trail
   */
  public getStockMovements(
    page = 1,
    limit = 50,
    stockItemId?: number,
    movementType?: string,
    search?: string,
    dateFrom?: string,
    dateTo?: string
  ): Observable<ApiResponse<StockMovement[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (stockItemId) params = params.set('stockItemId', stockItemId);
    if (movementType && movementType !== 'all') params = params.set('movementType', movementType);
    if (search) params = params.set('search', search);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<ApiResponse<StockMovement[]>>(`${this.API_URL}/movements`, { params });
  }

  /**
   * 8. Stock Adjustment (Audit, Wastage, Spoilage, Returns)
   */
  public adjustStock(data: {
    stockItemId?: number;
    productId?: number;
    adjustmentType: string;
    quantity: number;
    multiplier?: number;
    totalPrice?: number;
    unitPrice?: number;
    reason: string;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/adjust`, data);
  }

  /**
   * 9. Comprehensive Stock Alerts Suite
   */
  public getStockAlerts(type?: string): Observable<ApiResponse<{ alerts: any[]; summary: any }>> {
    let params = new HttpParams();
    if (type && type !== 'all') params = params.set('type', type);
    return this.http.get<ApiResponse<{ alerts: any[]; summary: any }>>(`${this.API_URL}/alerts`, { params });
  }

  /**
   * 10. Low Stock Alerts
   */
  public getLowStockAlerts(): Observable<ApiResponse<StockItem[]>> {
    return this.http.get<ApiResponse<StockItem[]>>(`${this.API_URL}/low-stock`);
  }

  /**
   * 10. Legacy quick stock in
   */
  public stockIn(data: {
    productId?: number;
    stockItemId?: number;
    quantity: number;
    multiplier?: number;
    totalPrice?: number;
    supplier?: string;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/in`, data);
  }

  /**
   * 11. Legacy transactions
   */
  public getTransactions(page = 1, limit = 50, productId?: number, type?: string): Observable<ApiResponse<StockMovement[]>> {
    return this.getStockMovements(page, limit, productId, type);
  }
}

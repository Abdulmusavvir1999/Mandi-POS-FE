import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly API_URL = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  public getProducts(
    page = 1,
    limit = 50,
    search?: string,
    categoryId?: number,
    status?: string,
    sortBy?: string,
    sortOrder?: string
  ): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (status) params = params.set('status', status);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortOrder) params = params.set('sortOrder', sortOrder);

    return this.http.get<ApiResponse<Product[]>>(this.API_URL, { params });
  }

  public getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.API_URL}/${id}`);
  }

  /** Uploads a dish photo as a data URL and returns its stored path. */
  public uploadProductImage(dataUrl: string): Observable<ApiResponse<{ url: string; fileName: string; bytes: number }>> {
    return this.http.post<ApiResponse<{ url: string; fileName: string; bytes: number }>>(`${this.API_URL}/image`, { dataUrl });
  }

  public createProduct(data: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.API_URL, data);
  }

  public updateProduct(id: number, data: any): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.API_URL}/${id}`, data);
  }

  public deleteProduct(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  // -------------------------------------------------------------
  // Add-ons
  // -------------------------------------------------------------
  public getAddons(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/addons`);
  }

  public createAddon(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/addons`, data);
  }

  public updateAddon(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/addons/${id}`, data);
  }

  public deleteAddon(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/addons/${id}`);
  }

  public linkProductAddons(productId: number, addonIds: number[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${productId}/addons`, { addonIds });
  }

  // -------------------------------------------------------------
  // Combo Deals
  // -------------------------------------------------------------
  public getComboDeals(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/combo-deals`);
  }

  public createComboDeal(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/combo-deals`, data);
  }

  public updateComboDeal(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/combo-deals/${id}`, data);
  }

  public deleteComboDeal(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/combo-deals/${id}`);
  }
}

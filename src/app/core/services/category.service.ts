import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly API_URL = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  public getCategories(includeInactive = false): Observable<ApiResponse<Category[]>> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<ApiResponse<Category[]>>(this.API_URL, { params });
  }

  public getCategoryById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.API_URL}/${id}`);
  }

  /**
   * Uploads a thumbnail as a base64 data URL and returns its stored path.
   * Runs before the category row exists, so the form holds the returned URL
   * until it is saved with the rest of the fields.
   */
  public uploadCategoryImage(dataUrl: string): Observable<ApiResponse<{ url: string; fileName: string; bytes: number }>> {
    return this.http.post<ApiResponse<{ url: string; fileName: string; bytes: number }>>(`${this.API_URL}/image`, { dataUrl });
  }

  public createCategory(data: any): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.API_URL, data);
  }

  public updateCategory(id: number, data: any): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.API_URL}/${id}`, data);
  }

  public deleteCategory(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }
}

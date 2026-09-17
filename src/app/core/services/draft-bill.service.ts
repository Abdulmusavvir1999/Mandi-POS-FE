import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DraftBill, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DraftBillService {
  private readonly API_URL = `${environment.apiUrl}/draft-bills`;

  constructor(private http: HttpClient) {}

  public getDrafts(): Observable<ApiResponse<DraftBill[]>> {
    return this.http.get<ApiResponse<DraftBill[]>>(this.API_URL);
  }

  public getDraftById(id: number): Observable<ApiResponse<DraftBill>> {
    return this.http.get<ApiResponse<DraftBill>>(`${this.API_URL}/${id}`);
  }

  public holdBill(data: any): Observable<ApiResponse<DraftBill>> {
    return this.http.post<ApiResponse<DraftBill>>(this.API_URL, data);
  }

  public resumeDraft(id: number): Observable<ApiResponse<DraftBill>> {
    return this.http.post<ApiResponse<DraftBill>>(`${this.API_URL}/${id}/resume`, {});
  }

  public deleteDraft(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }
}

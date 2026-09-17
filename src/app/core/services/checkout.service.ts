import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly API_URL = `${environment.apiUrl}/checkout`;

  constructor(private http: HttpClient) {}

  public checkout(payload: any): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(this.API_URL, payload);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly API_URL = `${environment.apiUrl}/audit`;

  constructor(private http: HttpClient) {}

  public getLogs(page = 1, limit = 50, module?: string, action?: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (module) params = params.set('module', module);
    if (action) params = params.set('action', action);

    return this.http.get<ApiResponse<any[]>>(this.API_URL, { params });
  }
}

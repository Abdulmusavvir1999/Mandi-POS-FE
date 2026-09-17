import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly ROLES_URL = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  public getUsers(page = 1, limit = 50, search?: string, roleId?: number, status?: string): Observable<ApiResponse<User[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (roleId) params = params.set('roleId', roleId);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<User[]>>(this.API_URL, { params });
  }

  public getRoles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.ROLES_URL);
  }

  public createUser(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.API_URL, data);
  }

  public updateUser(id: number, data: any): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/${id}`, data);
  }

  public deleteUser(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }
}

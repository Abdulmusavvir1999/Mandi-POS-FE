import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role, Permission, ApiResponse } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;
  private readonly ROLES_URL = `${environment.apiUrl}/roles`;
  private readonly PERMISSIONS_URL = `${environment.apiUrl}/permissions`;

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------------------
  // Staff Users
  // -------------------------------------------------------------------------
  public getUsers(page = 1, limit = 50, search?: string, roleId?: number, status?: string): Observable<ApiResponse<User[]>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (roleId) params = params.set('roleId', roleId);
    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<User[]>>(this.API_URL, { params });
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

  // -------------------------------------------------------------------------
  // Dynamic Roles
  // -------------------------------------------------------------------------
  public getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.ROLES_URL);
  }

  public getRoleById(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.ROLES_URL}/${id}`);
  }

  public createRole(data: { name: string; description?: string; permissionIds?: number[] }): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.ROLES_URL, data);
  }

  public updateRole(id: number, data: { name?: string; description?: string; permissionIds?: number[] }): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.ROLES_URL}/${id}`, data);
  }

  public deleteRole(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.ROLES_URL}/${id}`);
  }

  public updateRolePermissions(roleId: number, permissionIds: number[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.ROLES_URL}/${roleId}/permissions`, { permissionIds });
  }

  // -------------------------------------------------------------------------
  // Dynamic Permissions
  // -------------------------------------------------------------------------
  public getPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(this.PERMISSIONS_URL);
  }

  public createPermission(data: { code: string; module: string; description?: string }): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(this.PERMISSIONS_URL, data);
  }

  public deletePermission(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.PERMISSIONS_URL}/${id}`);
  }
}

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, ApiResponse } from '../../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'mandi_pos_token';
  private readonly REFRESH_KEY = 'mandi_pos_refresh';
  private readonly USER_KEY = 'mandi_pos_user';

  private currentUserSignal = signal<User | null>(this.getStoredUser());

  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => !!this.currentUserSignal());
  public userRole = computed(() => this.currentUserSignal()?.role || null);
  public userPermissions = computed(() => this.currentUserSignal()?.permissions || []);

  constructor(private http: HttpClient, private router: Router) {}

  public login(credentials: { username: string; password: string }): Observable<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.refreshToken, res.data.user);
        }
      })
    );
  }

  public logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
        error: () => {},
      });
    }
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public hasPermission(permCode: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permCode) || false;
  }

  public hasRole(...roles: string[]): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  }

  public updateProfile(data: { name: string; email?: string; phone?: string; image_url?: string }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/auth/profile`, data).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const current = this.currentUserSignal();
          const updatedUser: User = {
            ...current,
            ...res.data,
            permissions: res.data.permissions || current?.permissions || [],
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          this.currentUserSignal.set(updatedUser);
        }
      })
    );
  }

  public changePassword(data: { currentPassword?: string; newPassword: string }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.API_URL}/auth/change-password`, data);
  }

  public refreshUserData(): void {
    const token = this.getToken();
    if (!token) return;
    this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
          this.currentUserSignal.set(res.data);
        }
      },
      error: () => {},
    });
  }

  public setSession(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  }
}

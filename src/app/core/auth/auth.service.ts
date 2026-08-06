import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ShopUser } from './auth.models';

const TOKEN_KEY = 'qet3etak.shop.token';
const USER_KEY = 'qet3etak.shop.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<ShopUser | null>(this.readUser());
  private readonly tokenSignal = signal<string | null>(this.readToken());

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isPending = computed(
    () => this.userSignal()?.status === 'PENDING_VERIFICATION',
  );
  readonly isApproved = computed(() => this.userSignal()?.status === 'APPROVED');
  /** True when the shop has a saved map pin for delivery navigation. */
  readonly hasShopLocation = computed(() => {
    const u = this.userSignal();
    return (
      u?.locationLat != null &&
      u?.locationLng != null &&
      Number.isFinite(u.locationLat) &&
      Number.isFinite(u.locationLng)
    );
  });

  registerShop(formData: FormData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register-shop`, formData)
      .pipe(tap((res) => this.persistSession(res)));
  }

  login(phone: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { phone, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  refreshMe(): Observable<ShopUser> {
    return this.http.get<ShopUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  updateShopProfile(data: {
    city?: string;
    address?: string;
    locationLat?: number;
    locationLng?: number;
  }): Observable<ShopUser> {
    return this.http
      .patch<ShopUser>(`${environment.apiUrl}/auth/me/shop-profile`, data)
      .pipe(
        tap((user) => {
          this.userSignal.set(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }),
      );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    void this.router.navigateByUrl('/');
  }

  getAuthorizationHeader(): string | null {
    const token = this.tokenSignal();
    return token ? `Bearer ${token}` : null;
  }

  private persistSession(res: AuthResponse): void {
    this.tokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): ShopUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as ShopUser) : null;
    } catch {
      return null;
    }
  }
}

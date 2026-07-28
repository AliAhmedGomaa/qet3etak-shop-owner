import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopCustomerAppBranding {
  shopId: string;
  shopName: string;
  city?: string;
  address?: string;
  enabled: boolean;
  displayName: string;
  tagline: string;
  slug: string;
  accentColor: string;
  accentStrongColor: string;
  brandColor: string;
  logoUrl: string;
  faviconUrl: string;
  appName?: string;
}

export type UpdateShopCustomerAppPayload = Partial<{
  enabled: boolean;
  displayName: string;
  tagline: string;
  slug: string;
  accentColor: string;
  accentStrongColor: string;
  brandColor: string;
}>;

@Injectable({ providedIn: 'root' })
export class ShopCustomerAppService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wholesale/customer-app`;

  get(): Observable<ShopCustomerAppBranding> {
    return this.http.get<ShopCustomerAppBranding>(this.base);
  }

  update(
    body: UpdateShopCustomerAppPayload,
  ): Observable<ShopCustomerAppBranding> {
    return this.http.patch<ShopCustomerAppBranding>(this.base, body);
  }

  uploadLogo(file: File): Observable<ShopCustomerAppBranding> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<ShopCustomerAppBranding>(`${this.base}/logo`, fd);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopProduct {
  id: string;
  shopId: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface PaginatedShopProducts {
  items: ShopProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ShopProductsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wholesale/shop-products`;

  list(page = 1, limit = 50): Observable<PaginatedShopProducts> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<PaginatedShopProducts>(this.base, { params });
  }

  create(form: FormData): Observable<ShopProduct> {
    return this.http.post<ShopProduct>(this.base, form);
  }

  update(id: string, form: FormData): Observable<ShopProduct> {
    return this.http.patch<ShopProduct>(`${this.base}/${id}`, form);
  }

  remove(id: string): Observable<{ deleted: true }> {
    return this.http.delete<{ deleted: true }>(`${this.base}/${id}`);
  }
}

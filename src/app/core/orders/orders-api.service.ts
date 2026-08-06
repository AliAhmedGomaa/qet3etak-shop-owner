import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';

export type PaymentMethod = 'CREDIT' | 'CASH_ON_DELIVERY';
export type OrderStatus = 'RECEIVED' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

export interface WalletTx {
  id?: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt?: string;
  orderId?: string;
}

export interface WalletView {
  id: string;
  shopId: string;
  creditLimit: number;
  currentDebt: number;
  availableCredit: number;
  utilization: number;
  transactions: WalletTx[];
  transactionsMeta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: Array<{
    productId?: string;
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
  statusHistory: Array<{ status: OrderStatus; at: string; note: string }>;
  createdAt?: string;
}

export type ReorderWarningCode =
  | 'UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'QTY_REDUCED'
  | 'PRICE_CHANGED';

export interface ReorderWarning {
  code: ReorderWarningCode;
  productId: string;
  title: string;
  message: string;
  requestedQuantity?: number;
  availableQuantity?: number;
  previousUnitPrice?: number;
  currentUnitPrice?: number;
}

export interface ReorderResult {
  order: ShopOrder;
  warnings: ReorderWarning[];
  sourceOrderId: string;
  sourceOrderNumber: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  wallet(params: PageParams = {}): Observable<WalletView> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<WalletView>(`${this.api}/wholesale/wallet`, {
      params: httpParams,
    });
  }

  checkout(body: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Observable<ShopOrder> {
    return this.http.post<ShopOrder>(`${this.api}/wholesale/orders/checkout`, body);
  }

  myOrders(params: PageParams = {}): Observable<Paginated<ShopOrder>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<Paginated<ShopOrder>>(`${this.api}/wholesale/orders`, {
      params: httpParams,
    });
  }

  myOrder(id: string): Observable<ShopOrder> {
    return this.http.get<ShopOrder>(`${this.api}/wholesale/orders/${id}`);
  }

  reorder(
    id: string,
    body: { paymentMethod?: PaymentMethod; notes?: string } = {},
  ): Observable<ReorderResult> {
    return this.http.post<ReorderResult>(
      `${this.api}/wholesale/orders/${id}/reorder`,
      body,
    );
  }
}

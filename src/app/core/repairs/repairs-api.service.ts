import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageParams, Paginated } from '../pagination';

export type RepairStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_FOR_PARTS'
  | 'REPAIRING'
  | 'READY'
  | 'DELIVERED';

export interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  brandName?: string;
  deviceModel: string;
  issueCode?: string;
  issueDescription: string;
  status: RepairStatus;
  statusHistory?: Array<{ status: string; at: string; note?: string }>;
  requiredPartTitle?: string;
  partsOrderNumber?: string;
  estimatedCost: number;
  laborFee: number;
  partsCost: number;
  totalCost: number;
  warrantyDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  RECEIVED: 'مستلم',
  DIAGNOSING: 'تشخيص',
  WAITING_FOR_PARTS: 'بانتظار القطع',
  REPAIRING: 'قيد الإصلاح',
  READY: 'جاهز',
  DELIVERED: 'تم التسليم',
};

@Injectable({ providedIn: 'root' })
export class RepairsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/repair-tickets`;

  list(params: PageParams & { q?: string } = {}): Observable<Paginated<RepairTicket>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<Paginated<RepairTicket>>(this.base, { params: httpParams });
  }

  get(id: string): Observable<RepairTicket> {
    return this.http.get<RepairTicket>(`${this.base}/${id}`);
  }

  create(body: {
    customerName: string;
    customerPhone: string;
    deviceModel: string;
    issueDescription: string;
    issueCode?: string;
    brandName?: string;
    laborFee?: number;
    estimatedCost?: number;
    warrantyDays?: number;
  }): Observable<RepairTicket> {
    return this.http.post<RepairTicket>(this.base, body);
  }

  updateStatus(
    id: string,
    body: { status: RepairStatus; note?: string; warrantyDays?: number },
  ): Observable<RepairTicket> {
    return this.http.patch<RepairTicket>(`${this.base}/${id}/status`, body);
  }

  attachPart(
    id: string,
    body: { productId: string; laborFee?: number; warrantyDays?: number },
  ): Observable<RepairTicket> {
    return this.http.patch<RepairTicket>(`${this.base}/${id}/attach-part`, body);
  }
}

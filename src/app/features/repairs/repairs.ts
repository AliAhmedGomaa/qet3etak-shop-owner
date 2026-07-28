import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CatalogProduct } from '../../core/catalog/catalog.models';
import {
  REPAIR_STATUS_LABEL,
  RepairStatus,
  RepairTicket,
  RepairsApiService,
} from '../../core/repairs/repairs-api.service';

@Component({
  selector: 'app-repairs',
  imports: [FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './repairs.html',
  styleUrl: './repairs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepairsPage implements OnInit {
  private readonly api = inject(RepairsApiService);
  private readonly catalog = inject(CatalogService);

  protected readonly tickets = signal<RepairTicket[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly selected = signal<RepairTicket | null>(null);
  protected readonly productHits = signal<CatalogProduct[]>([]);
  protected readonly labels = REPAIR_STATUS_LABEL;

  protected customerName = '';
  protected customerPhone = '';
  protected deviceModel = '';
  protected issueDescription = '';
  protected laborFee = 0;
  protected productQ = '';
  protected selectedProductId = '';
  protected attachLabor = 0;

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.api.list({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        this.tickets.set(res.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل تذاكر الإصلاح');
      },
    });
  }

  protected create(): void {
    if (
      !this.customerName.trim() ||
      !this.customerPhone.trim() ||
      !this.deviceModel.trim() ||
      !this.issueDescription.trim()
    ) {
      this.error.set('أكمل بيانات العميل والجهاز والعطل');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api
      .create({
        customerName: this.customerName.trim(),
        customerPhone: this.customerPhone.trim(),
        deviceModel: this.deviceModel.trim(),
        issueDescription: this.issueDescription.trim(),
        laborFee: this.laborFee || 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.customerName = '';
          this.customerPhone = '';
          this.deviceModel = '';
          this.issueDescription = '';
          this.laborFee = 0;
          this.reload();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('فشل إنشاء التذكرة');
        },
      });
  }

  protected open(t: RepairTicket): void {
    this.selected.set(t);
    this.selectedProductId = '';
    this.productHits.set([]);
    this.attachLabor = t.laborFee || 0;
  }

  protected close(): void {
    this.selected.set(null);
  }

  protected nextStatuses(current: RepairStatus): RepairStatus[] {
    const map: Record<RepairStatus, RepairStatus[]> = {
      RECEIVED: ['DIAGNOSING', 'WAITING_FOR_PARTS', 'REPAIRING'],
      DIAGNOSING: ['WAITING_FOR_PARTS', 'REPAIRING', 'READY'],
      WAITING_FOR_PARTS: ['REPAIRING', 'DIAGNOSING'],
      REPAIRING: ['READY', 'WAITING_FOR_PARTS'],
      READY: ['DELIVERED'],
      DELIVERED: [],
    };
    return map[current] ?? [];
  }

  protected setStatus(status: RepairStatus): void {
    const t = this.selected();
    if (!t) return;
    this.saving.set(true);
    this.api
      .updateStatus(t.id, {
        status,
        warrantyDays: status === 'READY' ? 90 : undefined,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.selected.set(updated);
          this.reload();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('تعذر تحديث الحالة');
        },
      });
  }

  protected searchParts(): void {
    const q = this.productQ.trim();
    if (!q) return;
    this.catalog.search({ q, limit: 8 }).subscribe({
      next: (res) => this.productHits.set(res.items ?? []),
      error: () => this.productHits.set([]),
    });
  }

  protected attachPart(): void {
    const t = this.selected();
    if (!t || !this.selectedProductId) return;
    this.saving.set(true);
    this.api
      .attachPart(t.id, {
        productId: this.selectedProductId,
        laborFee: this.attachLabor || undefined,
        warrantyDays: 90,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.selected.set(updated);
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(
            err?.error?.message ?? 'فشل ربط القطعة / إنشاء طلب الجملة',
          );
        },
      });
  }
}

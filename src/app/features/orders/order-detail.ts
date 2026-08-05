import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  OrdersApiService,
  ReorderWarning,
  ShopOrder,
} from '../../core/orders/orders-api.service';
import { InvoicesApiService } from '../../core/invoices/invoices-api.service';
import { OrderStepper } from './order-stepper';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink, OrderStepper],
  template: `
    <section class="detail safe-area-page" dir="rtl">
      <a routerLink="/orders">← الطلبات</a>
      @if (order(); as o) {
        <h1>{{ o.orderNumber }}</h1>
        <app-order-stepper [status]="o.status" />
        <p class="meta">
          {{ o.paymentMethod === 'CREDIT' ? 'دفع بالآجل' : 'دفع عند الاستلام' }}
          · {{ o.createdAt | date: 'medium' }}
        </p>
        @if (invoiceId()) {
          <a class="invoice-link" [routerLink]="['/invoices', invoiceId()]">عرض الفاتورة</a>
        }
        <ul>
          @for (item of o.items; track $index) {
            <li>
              <span>{{ item.title }} × {{ item.quantity }}</span>
              <strong>{{ item.lineTotal | currency: 'EGP':'symbol-narrow':'1.2-2' }}</strong>
            </li>
          }
        </ul>
        <div class="total">
          <span>الإجمالي</span>
          <strong>{{ o.total | currency: 'EGP':'symbol-narrow':'1.2-2' }}</strong>
        </div>

        @if (reorderError(); as err) {
          <p class="err">{{ err }}</p>
        }
        @if (reorderWarnings().length) {
          <ul class="warns">
            @for (w of reorderWarnings(); track $index) {
              <li>{{ warningLabel(w) }}</li>
            }
          </ul>
        }

        <button
          type="button"
          class="submit"
          (click)="reorder()"
          [disabled]="reordering()"
        >
          {{ reordering() ? 'جارٍ إعادة الطلب…' : 'إعادة الطلب' }}
        </button>

        @if (o.status === 'DELIVERED') {
          <a class="return-cta" [routerLink]="['/returns/new', o.id]">طلب إرجاع</a>
        }
        <p class="returns-link"><a routerLink="/returns">عرض طلبات الإرجاع</a></p>

        <h2>الخط الزمني</h2>
        <ol class="timeline">
          @for (ev of o.statusHistory; track $index) {
            <li>
              <strong>{{ statusLabel(ev.status) }}</strong>
              <span>{{ ev.at | date: 'short' }} · {{ ev.note }}</span>
            </li>
          }
        </ol>
      } @else {
        <p>جارٍ التحميل…</p>
      }
    </section>
  `,
  styles: `
    .detail {
      --page-pad-bottom: 2rem;
      max-width: 28rem;
      margin: 0 auto;
    }
    a { color: #0d9a6a; font-weight: 700; text-decoration: none; }
    h1 { margin: 0.75rem 0; font-size: 1.25rem; }
    .meta { color: #64748b; font-size: 0.85rem; }
    .invoice-link {
      display: inline-flex;
      align-items: center;
      margin: 0.75rem 0 0.25rem;
      padding: 0.55rem 0.9rem;
      border-radius: 0.75rem;
      background: rgba(16, 184, 128, 0.12);
      border: 1.5px solid rgba(16, 184, 128, 0.35);
    }
    ul { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.5rem; }
    li { display: flex; justify-content: space-between; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem; }
    .total { display: flex; justify-content: space-between; font-size: 1.05rem; margin: 0.75rem 0 1rem; }
    .submit {
      width: 100%;
      border: 0;
      border-radius: 0.85rem;
      padding: 0.9rem 1rem;
      background: #10b880;
      color: #fff;
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      margin-bottom: 1.25rem;
    }
    .submit:disabled { opacity: 0.65; cursor: wait; }
    .return-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
      margin-bottom: 0.65rem;
      border-radius: 0.85rem;
      background: #fff;
      color: #0d9a6a !important;
      font-weight: 800;
      text-decoration: none;
      border: 1.5px solid #10b880;
    }
    .returns-link {
      margin: 0 0 1.25rem;
      text-align: center;
      font-size: 0.85rem;
    }
    .returns-link a { font-weight: 600; }
    .err {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 0.75rem;
      padding: 0.75rem;
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
    }
    .warns {
      list-style: none;
      padding: 0;
      margin: 0 0 0.75rem;
      display: grid;
      gap: 0.4rem;
    }
    .warns li {
      display: block;
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 0.75rem;
      padding: 0.65rem 0.75rem;
      font-size: 0.85rem;
    }
    h2 { font-size: 0.95rem; }
    .timeline { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.55rem; }
    .timeline li {
      border-inline-start: 3px solid #10b880;
      padding-inline-start: 0.75rem;
      background: transparent;
      border: 0;
      border-radius: 0;
      padding-block: 0;
    }
    .timeline span { display: block; color: #94a3b8; font-size: 0.75rem; margin-top: 0.15rem; }
    @media (min-width: 900px) {
      .detail { max-width: 44rem; }
      h1 { font-size: 1.75rem; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(OrdersApiService);
  private readonly invoicesApi = inject(InvoicesApiService);
  protected readonly order = signal<ShopOrder | null>(null);
  protected readonly invoiceId = signal<string | null>(null);
  protected readonly reordering = signal(false);
  protected readonly reorderError = signal<string | null>(null);
  protected readonly reorderWarnings = signal<ReorderWarning[]>([]);

  protected statusLabel(status: string): string {
    const map: Record<string, string> = {
      RECEIVED: 'مستلم',
      SHIPPED: 'تم الشحن',
      DELIVERED: 'تم التسليم',
    };
    return map[status] ?? status;
  }

  protected warningLabel(w: ReorderWarning): string {
    switch (w.code) {
      case 'UNAVAILABLE':
        return `${w.title}: غير متاح حالياً`;
      case 'OUT_OF_STOCK':
        return `${w.title}: نفد المخزون`;
      case 'QTY_REDUCED':
        return `${w.title}: تم تقليل الكمية إلى ${w.availableQuantity}`;
      case 'PRICE_CHANGED':
        return `${w.title}: تغيّر السعر من ${w.previousUnitPrice} إلى ${w.currentUnitPrice}`;
      default:
        return w.message;
    }
  }

  ngOnInit(): void {
    const stateWarnings = history.state?.['reorderWarnings'] as
      | ReorderWarning[]
      | undefined;
    if (stateWarnings?.length) {
      this.reorderWarnings.set(stateWarnings);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.myOrder(id).subscribe({ next: (o) => this.order.set(o) });
    this.invoicesApi.byOrder(id).subscribe({
      next: (inv) => this.invoiceId.set(inv.id),
      error: () => this.invoiceId.set(null),
    });
  }

  protected reorder(): void {
    const o = this.order();
    if (!o || this.reordering()) return;
    this.reordering.set(true);
    this.reorderError.set(null);
    this.reorderWarnings.set([]);
    this.api.reorder(o.id, { paymentMethod: o.paymentMethod }).subscribe({
      next: (result) => {
        this.reordering.set(false);
        void this.router.navigate(['/orders', result.order.id], {
          state: { reorderWarnings: result.warnings ?? [] },
        });
      },
      error: (err: unknown) => {
        this.reordering.set(false);
        const http = err as HttpErrorResponse;
        const body = http?.error;
        if (body?.warnings && Array.isArray(body.warnings)) {
          this.reorderWarnings.set(body.warnings);
        }
        if (body?.code === 'CREDIT_LIMIT_EXCEEDED') {
          this.reorderError.set(
            'تجاوزت الحد الائتماني — لا يمكن إعادة الطلب بالآجل حالياً',
          );
          return;
        }
        const msg =
          (typeof body?.message === 'string' && body.message) ||
          (Array.isArray(body?.message) ? body.message.join(' · ') : null) ||
          'تعذر إعادة الطلب';
        this.reorderError.set(
          msg === 'None of the items from this order are available to reorder'
            ? 'لا تتوفر أي منتجات من هذا الطلب لإعادة طلبها'
            : msg,
        );
      },
    });
  }
}

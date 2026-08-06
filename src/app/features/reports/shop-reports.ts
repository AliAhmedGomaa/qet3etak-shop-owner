import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  ShopOrdersReport,
  ShopReportsApiService,
} from '../../core/reports/shop-reports-api.service';

type RangePreset = 'month' | 'year' | 'all';

const STATUS_AR: Record<string, string> = {
  RECEIVED: 'مستلم',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  RETURNED: 'مرتجع',
};

const PAYMENT_AR: Record<string, string> = {
  CREDIT: 'ائتمان',
  CASH_ON_DELIVERY: 'دفع عند الاستلام',
};

@Component({
  selector: 'app-shop-reports',
  imports: [CurrencyPipe],
  templateUrl: './shop-reports.html',
  styleUrl: './shop-reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopReportsPage implements OnInit {
  private readonly api = inject(ShopReportsApiService);

  protected readonly report = signal<ShopOrdersReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly preset = signal<RangePreset>('month');

  protected readonly presets: Array<{ id: RangePreset; label: string }> = [
    { id: 'month', label: 'هذا الشهر' },
    { id: 'year', label: 'هذه السنة' },
    { id: 'all', label: 'الكل' },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected setPreset(p: RangePreset): void {
    this.preset.set(p);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    const { from, to } = this.rangeDates(this.preset());
    this.api.myOrders(from, to).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل التقرير');
        this.loading.set(false);
      },
    });
  }

  protected statusLabel(s: string): string {
    return STATUS_AR[s] ?? s;
  }

  protected paymentLabel(s: string): string {
    return PAYMENT_AR[s] ?? s;
  }

  private rangeDates(preset: RangePreset): { from?: string; to?: string } {
    const now = new Date();
    const to = this.iso(now);
    if (preset === 'all') return {};
    if (preset === 'year') return { from: `${now.getFullYear()}-01-01`, to };
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return { from, to };
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

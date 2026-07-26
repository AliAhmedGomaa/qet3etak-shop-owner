import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, interval } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogService } from '../../core/catalog/catalog.service';
import {
  CatalogBrand,
  CatalogCategory,
  CatalogProduct,
} from '../../core/catalog/catalog.models';
import { resolveMediaUrl } from '../../core/media/media-url';
import { environment } from '../../../environments/environment';

type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  link: string;
  tone: 'navy' | 'emerald' | 'slate';
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly catalogApi = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly auth = inject(AuthService);

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly brands = signal<CatalogBrand[]>([]);
  protected readonly categories = signal<CatalogCategory[]>([]);
  protected readonly featured = signal<CatalogProduct[]>([]);
  protected readonly heroIndex = signal(0);

  protected readonly slides: HeroSlide[] = [
    {
      id: 'catalog',
      kicker: 'جملة مباشرة',
      title: 'كتالوج قطع الموبايل محدّث لحظياً',
      text: 'شاشات، بطاريات، لوحات، وقطع نادرة بأسعار شرائح للمحلات.',
      cta: 'تصفح الكتالوج',
      link: '/catalog',
      tone: 'navy',
    },
    {
      id: 'credit',
      kicker: 'ائتمان تجاري',
      title: 'اطلب الآن… وادفع لاحقاً',
      text: 'محفظة حد ائتماني واضحة لكل محل معتمد مع تتبع الدين.',
      cta: 'محفظتي',
      link: '/wallet',
      tone: 'emerald',
    },
    {
      id: 'rare',
      kicker: 'قطع نادرة',
      title: 'ما تلاقيه في المخزون؟ اطلبه بصورة',
      text: 'أرسل صورة القطعة واحصل على تسعير من الإدارة خلال وقت قصير.',
      cta: 'طلب نادرة',
      link: '/special-requests',
      tone: 'slate',
    },
  ];

  protected readonly shortcuts = [
    { label: 'الكتالوج', link: '/catalog', tone: 'primary' },
    { label: 'الطلبات', link: '/orders', tone: 'ghost' },
    { label: 'المحفظة', link: '/wallet', tone: 'ghost' },
    { label: 'قطعة نادرة', link: '/special-requests', tone: 'ghost' },
  ] as const;

  constructor() {
    // Auto-rotate the hero carousel — browser only, so the running timer
    // never blocks server-side render from reaching stability.
    afterNextRender(() => {
      interval(5200)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.nextHero());
    });
  }

  ngOnInit(): void {
    forkJoin({
      brands: this.catalogApi.brands({ page: 1, limit: 100 }),
      categories: this.catalogApi.categories({ page: 1, limit: 100 }),
      products: this.catalogApi.search({ page: 1, limit: 12 }),
    }).subscribe({
      next: ({ brands, categories, products }) => {
        this.brands.set(brands.items ?? []);
        this.categories.set(categories.items ?? []);
        this.featured.set(products.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر الاتصال بالخادم. حاول مرة أخرى.');
      },
    });
  }

  protected nextHero(): void {
    this.heroIndex.update((i) => (i + 1) % this.slides.length);
  }

  protected prevHero(): void {
    this.heroIndex.update(
      (i) => (i - 1 + this.slides.length) % this.slides.length,
    );
  }

  protected goHero(index: number): void {
    this.heroIndex.set(index);
  }

  protected brandInitial(brand: string): string {
    return (brand.trim().charAt(0) || '?').toUpperCase();
  }

  protected brandIcon(brand: CatalogBrand): string {
    const url = brand.iconUrl?.trim() ?? '';
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${environment.apiUrl}${url}`;
    return url;
  }

  protected productImage(url?: string): string {
    return resolveMediaUrl(url, 'icons/icon-192x192.png');
  }

  protected stockLabel(p: CatalogProduct): string {
    if (p.stockQuantity <= 0) return 'غير متوفر';
    if (p.stockQuantity <= 5) return `متبقي ${p.stockQuantity}`;
    return `متوفر · ${p.stockQuantity}`;
  }
}

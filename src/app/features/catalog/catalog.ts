import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { CatalogService } from '../../core/catalog/catalog.service';
import { CatalogFacets, CatalogBrand, CatalogCategory, CatalogProduct } from '../../core/catalog/catalog.models';
import { ProductCard } from './product-card';
import { environment } from '../../../environments/environment';

type FilterKey = 'brand' | 'model' | 'category' | 'part' | 'qualityGrade';

const COLLAPSE_AFTER = 8;

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterLink, ProductCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog implements OnInit {
  private readonly catalogApi = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly brandMeta = signal<CatalogBrand[]>([]);
  protected readonly categoryMeta = signal<CatalogCategory[]>([]);
  protected readonly facets = signal<CatalogFacets>({
    brand: [],
    model: [],
    category: [],
    part: [],
    qualityGrade: [],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly selected: Record<FilterKey, string[]> = {
    brand: [],
    model: [],
    category: [],
    part: [],
    qualityGrade: [],
  };

  /** Local chip-search text per filter row (does not hit the API). */
  protected readonly facetQuery: Record<FilterKey, string> = {
    brand: '',
    model: '',
    category: '',
    part: '',
    qualityGrade: '',
  };

  protected readonly expanded = signal<Record<FilterKey, boolean>>({
    brand: false,
    model: false,
    category: false,
    part: false,
    qualityGrade: false,
  });

  protected readonly search = signal('');

  private readonly gradeLabels: Record<string, string> = {
    Original: 'أصلي',
    HighCopy: 'هاي كوبي',
    Copy: 'كوبي',
    Used: 'مستعمل',
  };

  protected readonly filterRows: Array<{
    key: FilterKey;
    label: string;
    searchable: boolean;
    placeholder: string;
  }> = [
    { key: 'brand', label: 'الماركة', searchable: false, placeholder: '' },
    {
      key: 'model',
      label: 'الموديل',
      searchable: true,
      placeholder: 'ابحث في الموديل…',
    },
    { key: 'category', label: 'الفئة', searchable: false, placeholder: '' },
    {
      key: 'part',
      label: 'القطعة',
      searchable: true,
      placeholder: 'ابحث في القطعة…',
    },
    { key: 'qualityGrade', label: 'الجودة', searchable: false, placeholder: '' },
  ];

  ngOnInit(): void {
    this.restoreFromUrl();

    this.search$
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.search.set(term);
        this.page.set(1);
        this.reload();
      });

    this.catalogApi.brands({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.brandMeta.set(res.items ?? []),
    });
    this.catalogApi.categories({ page: 1, limit: 100 }).subscribe({
      next: (res) => this.categoryMeta.set(res.items ?? []),
    });

    this.reload();
  }

  private readonly filterKeys: FilterKey[] = [
    'brand',
    'model',
    'category',
    'part',
    'qualityGrade',
  ];

  /** Hydrate all filters, search and page from the URL query params. */
  private restoreFromUrl(): void {
    const q = this.route.snapshot.queryParamMap;
    const split = (value: string | null): string[] =>
      value
        ? value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : [];

    for (const key of this.filterKeys) {
      this.selected[key] = split(q.get(key));
    }
    this.search.set(q.get('q') ?? '');
    this.page.set(Math.max(1, Number(q.get('page')) || 1));
  }

  /** Reflect the current filters, search and page into the URL query params. */
  private syncUrl(): void {
    const csv = (arr: string[]): string | null => (arr.length ? arr.join(',') : null);
    const queryParams: Record<string, string | number | null> = {
      q: this.search().trim() || null,
      page: this.page() > 1 ? this.page() : null,
    };
    for (const key of this.filterKeys) {
      queryParams[key] = csv(this.selected[key]);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  protected labelFor(key: FilterKey, value: string): string {
    if (key === 'qualityGrade') return this.gradeLabels[value] ?? value;
    return value;
  }

  protected brandIconUrl(name: string): string {
    const brand = this.brandMeta().find(
      (b) => b.name.toLowerCase() === name.toLowerCase(),
    );
    const url = brand?.iconUrl?.trim() ?? '';
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${environment.apiUrl}${url}`;
    return url;
  }

  protected isSelected(key: FilterKey, value: string): boolean {
    return this.selected[key].includes(value);
  }

  /** Source list for a filter row (brands/categories come from dashboard). */
  protected facetSource(key: FilterKey): string[] {
    if (key === 'brand' && this.brandMeta().length) {
      return this.brandMeta().map((b) => b.name);
    }
    if (key === 'category' && this.categoryMeta().length) {
      return this.categoryMeta().map((c) => c.name);
    }
    return this.facets()[key] ?? [];
  }

  /** Values to render: selected first, then filtered, then collapsed. */
  protected visibleFacetValues(key: FilterKey): string[] {
    const all = this.facetSource(key);
    const q = this.facetQuery[key].trim().toLowerCase();
    const selected = this.selected[key];

    const matches = (value: string) => {
      if (!q) return true;
      const label = this.labelFor(key, value).toLowerCase();
      return label.includes(q) || value.toLowerCase().includes(q);
    };

    const selectedVisible = selected.filter((v) => all.includes(v) || matches(v));
    const rest = all.filter((v) => !selected.includes(v) && matches(v));

    if (q || this.expanded()[key] || rest.length <= COLLAPSE_AFTER) {
      return [...selectedVisible, ...rest];
    }

    return [...selectedVisible, ...rest.slice(0, COLLAPSE_AFTER)];
  }

  protected hiddenFacetCount(key: FilterKey): number {
    const all = this.facetSource(key);
    const q = this.facetQuery[key].trim().toLowerCase();
    if (q || this.expanded()[key]) return 0;

    const selected = this.selected[key];
    const rest = all.filter((v) => !selected.includes(v));
    return Math.max(0, rest.length - COLLAPSE_AFTER);
  }

  protected showFacetSearch(key: FilterKey, searchable: boolean): boolean {
    if (!searchable) return false;
    return this.facetSource(key).length > COLLAPSE_AFTER;
  }

  protected onFacetQuery(key: FilterKey, value: string): void {
    this.facetQuery[key] = value;
    // Force view refresh for OnPush + mutable record
    this.expanded.update((e) => ({ ...e }));
  }

  protected toggleExpanded(key: FilterKey): void {
    this.expanded.update((e) => ({ ...e, [key]: !e[key] }));
  }

  protected toggle(key: FilterKey, value: string): void {
    const list = this.selected[key];
    const idx = list.indexOf(value);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(value);
    this.page.set(1);
    this.reload();
  }

  protected clearFilters(): void {
    this.selected.brand = [];
    this.selected.model = [];
    this.selected.category = [];
    this.selected.part = [];
    this.selected.qualityGrade = [];
    this.facetQuery.brand = '';
    this.facetQuery.model = '';
    this.facetQuery.category = '';
    this.facetQuery.part = '';
    this.facetQuery.qualityGrade = '';
    this.expanded.set({
      brand: false,
      model: false,
      category: false,
      part: false,
      qualityGrade: false,
    });
    this.search.set('');
    this.page.set(1);
    this.reload();
  }

  protected onSearchInput(value: string): void {
    this.search.set(value);
    this.search$.next(value.trim());
  }

  protected clearSearch(): void {
    this.search.set('');
    this.search$.next('');
  }

  protected goPage(delta: number): void {
    const next = Math.min(
      this.totalPages(),
      Math.max(1, this.page() + delta),
    );
    if (next === this.page()) return;
    this.page.set(next);
    this.reload();
  }

  protected cartQty(productId: string): number {
    return this.cart.quantityFor(productId);
  }

  protected reload(): void {
    this.syncUrl();
    this.loading.set(true);
    this.error.set(null);
    const filters = {
      q: this.search().trim() || undefined,
      brand: this.selected.brand,
      model: this.selected.model,
      category: this.selected.category,
      part: this.selected.part,
      qualityGrade: this.selected.qualityGrade,
      page: this.page(),
      limit: 24,
    };

    this.catalogApi.facets(filters).subscribe({
      next: (f) =>
        this.facets.set({
          brand: f.brand ?? [],
          model: f.model ?? [],
          category: f.category ?? [],
          part: f.part ?? [],
          qualityGrade: f.qualityGrade ?? [],
        }),
    });

    this.catalogApi.search(filters).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل الكتالوج');
      },
    });
  }

}

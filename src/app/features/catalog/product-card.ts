import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { CatalogProduct, resolveUnitPrice } from '../../core/catalog/catalog.models';
import { resolveMediaUrl } from '../../core/media/media-url';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  readonly product = input.required<CatalogProduct>();
  /** Hydrate from cart when browsing (0 = show 1 for preview pricing). */
  readonly initialQuantity = input(0);

  protected readonly qty = signal(1);
  protected readonly matrixOpen = signal(false);
  protected readonly added = signal(false);
  protected readonly resolveMediaUrl = resolveMediaUrl;

  constructor() {
    effect(() => {
      const fromCart = this.initialQuantity();
      const stock = this.product().stockQuantity;
      if (stock <= 0) {
        this.qty.set(1);
        return;
      }
      this.qty.set(fromCart > 0 ? Math.min(fromCart, stock) : 1);
    });
  }

  protected readonly pricing = computed(() => {
    const p = this.product();
    return resolveUnitPrice(this.qty(), p.basePrice, p.tieredPricing ?? []);
  });

  protected readonly stockClass = computed(() => {
    const stock = this.product().stockQuantity;
    if (stock <= 0) return 'stock stock--out';
    if (stock <= 5) return 'stock stock--low';
    return 'stock stock--ok';
  });

  protected readonly gradeLabel = computed(() => {
    const labels: Record<string, string> = {
      Original: 'أصلي',
      HighCopy: 'هاي كوبي',
      Copy: 'كوبي',
      Used: 'مستعمل',
    };
    return labels[this.product().qualityGrade] ?? this.product().qualityGrade;
  });

  protected readonly stockLabelAr = computed(() => {
    const stock = this.product().stockQuantity;
    if (stock <= 0) return 'غير متوفر';
    if (stock <= 5) return `متبقي ${stock} فقط`;
    return `متوفر · ${stock} قطعة`;
  });

  protected readonly gradeClass = computed(() => {
    const g = this.product().qualityGrade;
    if (g === 'Original') return 'grade grade--original';
    if (g === 'HighCopy') return 'grade grade--copy';
    if (g === 'Used') return 'grade grade--used';
    return 'grade grade--generic';
  });

  protected openDetails(): void {
    void this.router.navigate(['/catalog', this.product().id]);
  }

  protected inc(): void {
    const max = this.product().stockQuantity;
    if (max <= 0) return;
    this.qty.update((q) => Math.min(max, q + 1));
    this.added.set(false);
  }

  protected dec(): void {
    this.qty.update((q) => Math.max(1, q - 1));
    this.added.set(false);
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p || p.stockQuantity <= 0) return;
    this.cart.setQuantity(p, this.qty());
    this.added.set(true);
  }

  protected toggleMatrix(event: Event): void {
    event.stopPropagation();
    this.matrixOpen.update((v) => !v);
  }
}

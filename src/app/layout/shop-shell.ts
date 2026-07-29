import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart/cart.service';
import { ChatService } from '../core/chat/chat.service';
import { ThemeService } from '../core/theme/theme.service';
import { BrandingService } from '../core/branding/branding.service';
import { PushNotificationService } from '../core/push/push-notification.service';

type ShellNavItem = {
  path: string;
  label: string;
  chat?: boolean;
};

@Component({
  selector: 'app-shop-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shop-shell.html',
  styleUrl: './shop-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopShell {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly chat = inject(ChatService);
  protected readonly theme = inject(ThemeService);
  protected readonly branding = inject(BrandingService);
  protected readonly push = inject(PushNotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuOpen = signal(false);

  protected readonly navItems: ShellNavItem[] = [
    { path: '/home', label: 'الرئيسية' },
    { path: '/catalog', label: 'الكتالوج' },
    { path: '/orders', label: 'الطلبات' },
    { path: '/reports', label: 'التقارير' },
    { path: '/returns', label: 'المرتجعات' },
    { path: '/invoices', label: 'الفواتير' },
    { path: '/wallet', label: 'المحفظة' },
    { path: '/special-requests', label: 'قطعة نادرة' },
    { path: '/repairs', label: 'الإصلاحات' },
    { path: '/customer-app', label: 'تطبيق العملاء' },
    { path: '/shop-products', label: 'منتجات العملاء' },
    { path: '/support', label: 'الدعم', chat: true },
  ];

  /** Secondary links shown in the mobile “More” sheet (not on the tab bar). */
  protected readonly moreItems: ShellNavItem[] = [
    { path: '/reports', label: 'التقارير' },
    { path: '/returns', label: 'المرتجعات' },
    { path: '/invoices', label: 'الفواتير' },
    { path: '/wallet', label: 'المحفظة' },
    { path: '/special-requests', label: 'قطعة نادرة' },
    { path: '/repairs', label: 'الإصلاحات' },
    { path: '/customer-app', label: 'تطبيق العملاء' },
    { path: '/shop-products', label: 'منتجات العملاء' },
    { path: '/support', label: 'الدعم', chat: true },
  ];

  protected readonly cartLabel = computed(() => {
    const n = this.cart.itemCount();
    return n > 0 ? `السلة (${n})` : 'السلة';
  });

  protected readonly moreActive = computed(() => {
    const url = this.router.url.split('?')[0] ?? '';
    return this.moreItems.some(
      (item) => url === item.path || url.startsWith(`${item.path}/`),
    );
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuOpen.set(false));

    afterNextRender(() => {
      this.auth.refreshMe().subscribe({
        next: (user) => {
          const status = user.status;
          if (status === 'REJECTED' || status === 'SUSPENDED') {
            void this.router.navigateByUrl('/inactive');
            return;
          }
          if (status === 'PENDING_VERIFICATION') {
            void this.router.navigateByUrl('/pending');
            return;
          }
          this.chat.connect();
          this.push.listenForPush();
        },
        error: () => {
          this.chat.connect();
          this.push.listenForPush();
        },
      });
    });
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}

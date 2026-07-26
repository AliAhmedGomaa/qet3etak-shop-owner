import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart/cart.service';
import { ChatService } from '../core/chat/chat.service';
import { ThemeService } from '../core/theme/theme.service';
import { BrandingService } from '../core/branding/branding.service';
import { PushNotificationService } from '../core/push/push-notification.service';

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

  protected readonly cartLabel = computed(() => {
    const n = this.cart.itemCount();
    return n > 0 ? `السلة (${n})` : 'السلة';
  });

  constructor() {
    // Open the support socket once the app is running in the browser so the
    // unread badge stays live across the whole app (SSR-safe).
    afterNextRender(() => {
      this.chat.connect();
      this.push.listenForPush();
    });
  }
}

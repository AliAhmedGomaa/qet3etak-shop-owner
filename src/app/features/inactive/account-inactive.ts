import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-inactive',
  template: `
    <section class="inactive" dir="rtl">
      <div class="card">
        <h1>الحساب غير نشط</h1>
        <p>
          حساب
          @if (name()) {
            <strong>{{ name() }}</strong>
          } @else {
            المحل
          }
          غير مفعّل حالياً (موقوف أو مرفوض). لا يمكنك استخدام منصة الجملة حتى تعيد الإدارة تفعيل الحساب.
        </p>
        <p class="hint">تواصل مع الإدارة إذا كنت تعتقد أن هذا خطأ.</p>
        <button type="button" (click)="auth.logout()">تسجيل الخروج</button>
      </div>
    </section>
  `,
  styles: `
    .inactive {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background:
        radial-gradient(ellipse at top, color-mix(in srgb, #ef4444 16%, transparent), transparent 55%),
        var(--canvas, #f8fafc);
      color: var(--ink, #0f172a);
    }
    .card {
      width: min(26rem, 100%);
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1.15rem;
      padding: 1.5rem;
      display: grid;
      gap: 0.75rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }
    h1 {
      margin: 0;
      font-size: 1.35rem;
    }
    p {
      margin: 0;
      line-height: 1.55;
      color: var(--ink-muted, #64748b);
    }
    .hint {
      font-size: 0.85rem;
    }
    button {
      margin-top: 0.35rem;
      min-height: 2.75rem;
      border: 0;
      border-radius: 0.75rem;
      background: var(--accent, #0d9488);
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountInactivePage {
  protected readonly auth = inject(AuthService);
  protected readonly name = computed(
    () => this.auth.user()?.shopName || this.auth.user()?.fullName || '',
  );
}

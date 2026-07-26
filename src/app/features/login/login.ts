import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { BrandingService } from '../../core/branding/branding.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);
  protected readonly branding = inject(BrandingService);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);
    const { phone, password } = this.form.getRawValue();
    this.auth.login(phone, password).subscribe({
      next: (res) => {
        this.submitting.set(false);
        void this.router.navigateByUrl(
          res.user.status === 'APPROVED' ? '/home' : '/pending',
        );
      },
      error: (err: {
        error?: { message?: string | string[]; code?: string };
      }) => {
        this.submitting.set(false);
        const msg = err.error?.message;
        this.error.set(
          Array.isArray(msg)
            ? msg.join(' · ')
            : typeof msg === 'string'
              ? msg
              : 'بيانات الدخول غير صحيحة',
        );
      },
    });
  }
}

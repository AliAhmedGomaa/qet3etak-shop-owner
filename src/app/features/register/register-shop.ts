import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { compressImageForUpload } from '../../core/media/compress-image';
import { FileUpload } from '../../shared/file-upload/file-upload';
import {
  LocationMapPicker,
  ShopLocation,
} from '../../shared/location-map-picker/location-map-picker';

@Component({
  selector: 'app-register-shop',
  imports: [ReactiveFormsModule, RouterLink, FileUpload, LocationMapPicker],
  templateUrl: './register-shop.html',
  styleUrl: './register-shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterShop {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly photoFile = signal<File | null>(null);
  protected readonly attempted = signal(false);
  protected readonly location = signal<ShopLocation | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    shopName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,20}$/)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected fieldError(name: keyof typeof this.form.controls): string | null {
    if (!this.attempted() && !this.form.controls[name].touched) return null;
    const control = this.form.controls[name];
    if (control.valid) return null;
    if (control.hasError('required')) return 'هذا الحقل مطلوب';
    if (control.hasError('minlength')) {
      const min = control.getError('minlength')?.requiredLength as number;
      return `يجب إدخال ${min} أحرف على الأقل`;
    }
    if (control.hasError('pattern')) return 'رقم الجوال غير صالح';
    return 'قيمة غير صالحة';
  }

  protected onPhotoSelected(file: File | null): void {
    if (file && !file.type.startsWith('image/')) {
      this.error.set('يرجى اختيار صورة فقط (JPG / PNG / WEBP)');
      return;
    }
    this.photoFile.set(file);
    this.error.set(null);
  }

  protected onLocationChange(loc: ShopLocation | null): void {
    this.location.set(loc);
    this.error.set(null);
  }

  protected submit(): void {
    this.attempted.set(true);
    this.normalizePhone();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.error.set('أكمل الحقول المطلوبة بشكل صحيح قبل الإرسال');
      this.focusFirstInvalid();
      return;
    }
    if (!this.photoFile()) {
      this.error.set('اللوجو مطلوب');
      return;
    }
    if (!this.location()) {
      this.error.set('حدد موقع المحل على الخريطة');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    void this.submitRegistration();
  }

  private async submitRegistration(): Promise<void> {
    try {
      const photo = await compressImageForUpload(this.photoFile()!);
      const value = this.form.getRawValue();
      const loc = this.location()!;
      const data = new FormData();
      Object.entries(value).forEach(([key, val]) =>
        data.append(key, String(val).trim()),
      );
      data.append('locationLat', String(loc.lat));
      data.append('locationLng', String(loc.lng));
      data.append('commercialRegPhoto', photo);

      this.auth.registerShop(data).subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigateByUrl('/pending');
        },
        error: (err: {
          error?: { message?: string | string[]; error?: string };
          status?: number;
        }) => {
          this.submitting.set(false);
          this.error.set(this.formatRegisterError(err));
        },
      });
    } catch {
      this.submitting.set(false);
      this.error.set('تعذر تجهيز الصورة. جرّب صورة أصغر أو بصيغة JPG.');
    }
  }

  private formatRegisterError(err: {
    error?: { message?: string | string[]; error?: string };
    status?: number;
  }): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' · ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (err.status === 413 || err.status === 503) {
      return 'حجم الصورة كبير جداً. اختر صورة أوضح بحجم أصغر وحاول مرة أخرى.';
    }
    if (err.status === 0) {
      return 'تعذر الاتصال بالخادم. حدّث الصفحة وتأكد من الاتصال.';
    }
    return 'تعذر إكمال التسجيل. حاول مرة أخرى.';
  }

  /** Convert Arabic-Indic digits and trim so validation/API accept the phone. */
  private normalizePhone(): void {
    const raw = this.form.controls.phone.value ?? '';
    const normalized = raw
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .trim();
    if (normalized !== raw) {
      this.form.controls.phone.setValue(normalized);
    }
  }

  private focusFirstInvalid(): void {
    const order: Array<keyof typeof this.form.controls> = [
      'fullName',
      'shopName',
      'phone',
      'city',
      'address',
      'password',
    ];
    for (const name of order) {
      const control = this.form.controls[name] as AbstractControl;
      if (control.invalid) {
        const el = document.querySelector<HTMLElement>(
          `[formControlName="${name}"]`,
        );
        el?.focus();
        return;
      }
    }
  }
}

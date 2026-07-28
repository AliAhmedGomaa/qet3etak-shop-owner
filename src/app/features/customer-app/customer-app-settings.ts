import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ShopCustomerAppBranding,
  ShopCustomerAppService,
} from '../../core/customer-app/shop-customer-app.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customer-app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './customer-app-settings.html',
  styleUrl: './customer-app-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerAppSettings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ShopCustomerAppService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly preview = signal<ShopCustomerAppBranding | null>(null);

  protected readonly shareUrl = computed(() => {
    const data = this.preview();
    if (!data) return '';
    const key = data.slug?.trim() || data.shopId;
    const base = environment.customerPortalUrl;
    return `${base.replace(/\/$/, '')}/?shop=${encodeURIComponent(key)}`;
  });

  protected readonly form = this.fb.nonNullable.group({
    enabled: [true],
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    tagline: [''],
    slug: [
      '',
      [Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/)],
    ],
    accentColor: [
      '#10b880',
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
    accentStrongColor: [
      '#0d9a6a',
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
    brandColor: [
      '#0f172a',
      [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    ],
  });

  ngOnInit(): void {
    this.api.get().subscribe({
      next: (data) => {
        this.preview.set(data);
        this.form.patchValue({
          enabled: data.enabled !== false,
          displayName: data.displayName || data.shopName || '',
          tagline: data.tagline || '',
          slug: data.slug || '',
          accentColor: data.accentColor || '#10b880',
          accentStrongColor: data.accentStrongColor || '#0d9a6a',
          brandColor: data.brandColor || '#0f172a',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل هوية تطبيق العملاء');
      },
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    const raw = this.form.getRawValue();
    this.api
      .update({
        enabled: raw.enabled,
        displayName: raw.displayName,
        tagline: raw.tagline,
        slug: raw.slug.trim().toLowerCase(),
        accentColor: raw.accentColor,
        accentStrongColor: raw.accentStrongColor,
        brandColor: raw.brandColor,
      })
      .subscribe({
        next: (data) => {
          this.preview.set(data);
          this.saving.set(false);
          this.success.set('تم حفظ هوية تطبيق العملاء.');
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.error.set(
            err?.error?.message || 'تعذر حفظ الإعدادات',
          );
        },
      });
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.uploadLogo(file).subscribe({
      next: (data) => {
        this.preview.set(data);
        this.uploading.set(false);
        this.success.set('تم رفع الشعار.');
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('تعذر رفع الشعار');
      },
    });
  }

  protected async copyLink(): Promise<void> {
    const url = this.shareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.success.set('تم نسخ رابط تطبيق العملاء.');
    } catch {
      this.error.set('تعذر نسخ الرابط');
    }
  }
}

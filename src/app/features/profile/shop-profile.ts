import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import {
  LocationMapPicker,
  ShopLocation,
} from '../../shared/location-map-picker/location-map-picker';

@Component({
  selector: 'app-shop-profile',
  imports: [ReactiveFormsModule, LocationMapPicker],
  template: `
    <section class="page safe-area-page" dir="rtl">
      <header>
        <h1>موقع المتجر</h1>
        <p>حدّث العنوان وثبّت موقع المحل على الخريطة ليصل المندوب بسهولة.</p>
      </header>

      @if (loading()) {
        <p class="muted">جارٍ التحميل…</p>
      } @else {
        <form class="form" [formGroup]="form" (ngSubmit)="save()">
          <label class="field">
            <span>المدينة</span>
            <input formControlName="city" type="text" placeholder="القاهرة" />
          </label>

          <label class="field">
            <span>العنوان</span>
            <textarea
              formControlName="address"
              rows="3"
              placeholder="الحي، الشارع، رقم المحل"
            ></textarea>
          </label>

          <div class="map-block">
            <h2>موقع المحل على الخريطة</h2>
            <app-location-map-picker
              [lat]="location()?.lat ?? null"
              [lng]="location()?.lng ?? null"
              (locationChange)="onLocationChange($event)"
            />
            @if (attempted() && !location()) {
              <em class="err-inline">حدد موقع المحل على الخريطة</em>
            }
          </div>

          @if (error()) {
            <p class="err" role="alert">{{ error() }}</p>
          }
          @if (success()) {
            <p class="ok" role="status">{{ success() }}</p>
          }

          <button type="submit" class="save" [disabled]="saving()">
            {{ saving() ? 'جارٍ الحفظ…' : 'حفظ التغييرات' }}
          </button>
        </form>
      }
    </section>
  `,
  styles: `
    .page {
      display: grid;
      gap: 1.1rem;
      max-width: 36rem;
    }
    header h1 {
      margin: 0 0 0.35rem;
      font-size: 1.4rem;
    }
    header p {
      margin: 0;
      color: var(--ink-muted, #64748b);
      line-height: 1.5;
    }
    .form {
      display: grid;
      gap: 0.9rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1rem;
      padding: 1.1rem;
    }
    .field {
      display: grid;
      gap: 0.35rem;
      font-weight: 700;
      font-size: 0.88rem;
    }
    .field span {
      color: var(--ink-muted, #64748b);
    }
    input,
    textarea {
      min-height: 2.6rem;
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 0.7rem;
      padding: 0.55rem 0.8rem;
      font: inherit;
      background: var(--input-bg, #fff);
      color: var(--ink, #0f172a);
    }
    textarea {
      min-height: 5rem;
      resize: vertical;
    }
    .map-block {
      display: grid;
      gap: 0.55rem;
    }
    .map-block h2 {
      margin: 0;
      font-size: 0.95rem;
    }
    .save {
      min-height: 2.85rem;
      border: 0;
      border-radius: 0.85rem;
      background: var(--accent, #10b880);
      color: #fff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .save:disabled {
      opacity: 0.65;
    }
    .err {
      margin: 0;
      background: var(--danger-bg, #fef2f2);
      color: var(--danger, #991b1b);
      padding: 0.7rem 0.85rem;
      border-radius: 0.7rem;
      font-weight: 600;
    }
    .err-inline {
      font-style: normal;
      font-size: 0.8rem;
      color: var(--danger, #991b1b);
      font-weight: 700;
    }
    .ok {
      margin: 0;
      background: #dcfce7;
      color: #166534;
      padding: 0.7rem 0.85rem;
      border-radius: 0.7rem;
      font-weight: 700;
    }
    .muted {
      color: var(--ink-muted, #64748b);
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly attempted = signal(false);
  protected readonly location = signal<ShopLocation | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    city: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.auth.refreshMe().subscribe({
      next: (user) => {
        this.form.patchValue({
          city: user.city || '',
          address: user.address || '',
        });
        if (
          user.locationLat != null &&
          user.locationLng != null &&
          Number.isFinite(user.locationLat) &&
          Number.isFinite(user.locationLng)
        ) {
          this.location.set({
            lat: user.locationLat,
            lng: user.locationLng,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        const user = this.auth.user();
        if (user) {
          this.form.patchValue({
            city: user.city || '',
            address: user.address || '',
          });
          if (user.locationLat != null && user.locationLng != null) {
            this.location.set({
              lat: user.locationLat,
              lng: user.locationLng,
            });
          }
        }
        this.loading.set(false);
      },
    });
  }

  protected onLocationChange(loc: ShopLocation | null): void {
    this.location.set(loc);
    this.success.set(null);
  }

  protected save(): void {
    this.attempted.set(true);
    this.form.markAllAsTouched();
    this.success.set(null);
    if (this.form.invalid) {
      this.error.set('أكمل المدينة والعنوان بشكل صحيح');
      return;
    }
    const loc = this.location();
    if (!loc) {
      this.error.set('حدد موقع المحل على الخريطة');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.auth
      .updateShopProfile({
        city: value.city.trim(),
        address: value.address.trim(),
        locationLat: loc.lat,
        locationLng: loc.lng,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('تم حفظ بيانات المتجر بنجاح');
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.saving.set(false);
          const msg = err.error?.message;
          this.error.set(
            Array.isArray(msg)
              ? msg.join(' · ')
              : typeof msg === 'string'
                ? msg
                : 'تعذر حفظ البيانات',
          );
        },
      });
  }
}

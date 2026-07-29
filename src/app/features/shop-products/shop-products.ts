import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ShopProduct,
  ShopProductsAdminService,
} from '../../core/shop-products/shop-products-admin.service';

@Component({
  selector: 'app-shop-products',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './shop-products.html',
  styleUrl: './shop-products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopProductsPage implements OnInit {
  private readonly api = inject(ShopProductsAdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<ShopProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly imageFile = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    sortOrder: [0],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('تعذر تحميل المنتجات');
      },
    });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      price: 0,
      sortOrder: 0,
      isActive: true,
    });
    this.clearImage();
    this.success.set(null);
    this.error.set(null);
  }

  protected startEdit(item: ShopProduct): void {
    this.editingId.set(item.id);
    this.form.patchValue({
      title: item.title,
      description: item.description || '',
      price: item.price,
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
    this.imageFile.set(null);
    this.imagePreview.set(item.imageUrl || null);
    this.success.set(null);
    this.error.set(null);
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.imageFile.set(file);
    if (!file) {
      this.imagePreview.set(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(String(reader.result));
    reader.readAsDataURL(file);
  }

  protected clearImage(): void {
    this.imageFile.set(null);
    this.imagePreview.set(null);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    const raw = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', raw.title.trim());
    fd.append('description', raw.description.trim());
    fd.append('price', String(raw.price));
    fd.append('sortOrder', String(raw.sortOrder ?? 0));
    fd.append('isActive', String(raw.isActive));
    const file = this.imageFile();
    if (file) fd.append('image', file);

    const id = this.editingId();
    const req = id ? this.api.update(id, fd) : this.api.create(fd);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(id ? 'تم تحديث المنتج' : 'تمت إضافة المنتج');
        this.startCreate();
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'تعذر حفظ المنتج');
      },
    });
  }

  protected remove(item: ShopProduct): void {
    if (!confirm(`حذف «${item.title}»؟`)) return;
    this.api.remove(item.id).subscribe({
      next: () => {
        this.success.set('تم حذف المنتج');
        if (this.editingId() === item.id) this.startCreate();
        this.load();
      },
      error: () => this.error.set('تعذر حذف المنتج'),
    });
  }
}

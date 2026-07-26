import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DEFAULT_BRANDING,
  PlatformBranding,
} from './branding.models';

const CACHE_KEY = 'qet3etak.branding';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly http = inject(HttpClient);

  readonly branding = signal<PlatformBranding>(this.readCache() ?? DEFAULT_BRANDING);

  init(): void {
    this.apply(this.branding());
    this.http
      .get<PlatformBranding>(`${environment.apiUrl}/branding`)
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        if (!data) return;
        this.branding.set(data);
        this.writeCache(data);
        this.apply(data);
      });
  }

  reapply(): void {
    this.apply(this.branding());
  }

  apply(data: PlatformBranding): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const dark = root.getAttribute('data-theme') === 'dark';
    root.style.setProperty('--accent', data.accentColor);
    root.style.setProperty('--accent-strong', data.accentStrongColor);
    root.style.setProperty(
      '--accent-soft',
      this.hexToRgba(data.accentColor, dark ? 0.16 : 0.12),
    );
    root.style.setProperty('--brand', dark ? '#e2e8f0' : data.brandColor);

    const titleBase = data.appName?.trim() || DEFAULT_BRANDING.appName;
    document.title = `${titleBase} - بالجملة`;

    const icon = data.faviconUrl || data.logoUrl;
    if (icon) this.setFavicon(icon);
  }

  private setFavicon(url: string): void {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return `rgba(16, 184, 128, ${alpha})`;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  private readCache(): PlatformBranding | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as PlatformBranding) : null;
    } catch {
      return null;
    }
  }

  private writeCache(data: PlatformBranding): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
}

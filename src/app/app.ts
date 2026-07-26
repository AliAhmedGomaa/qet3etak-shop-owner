import { Component, inject, isDevMode, OnInit } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { InstallAppBanner } from './shared/install-app-banner/install-app-banner';
import { ThemeService } from './core/theme/theme.service';
import { BrandingService } from './core/branding/branding.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallAppBanner],
  template: `
    <router-outlet />
    <app-install-app-banner />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      min-height: 100svh;
    }
  `,
})
export class App implements OnInit {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly theme = inject(ThemeService);
  private readonly branding = inject(BrandingService);

  ngOnInit(): void {
    this.theme.init();
    this.branding.init();
    if (isDevMode() || !this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        void this.swUpdate!.activateUpdate().then(() => document.location.reload());
      });
    void this.swUpdate.checkForUpdate();
  }
}

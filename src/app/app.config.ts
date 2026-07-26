import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { timeoutInterceptor } from './core/http/timeout.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([timeoutInterceptor, authInterceptor])),
    provideServiceWorker('push-sw.js', {
      enabled: !isDevMode(),
      // Register ASAP so Android Chrome can treat the site as installable
      // (beforeinstallprompt requires an active controlling service worker).
      registrationStrategy: 'registerImmediately',
    }),
    provideClientHydration(withEventReplay()),
  ],
};

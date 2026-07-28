import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

function isInactiveShopStatus(status: string | undefined): boolean {
  return status === 'REJECTED' || status === 'SUSPENDED';
}

/** Blocks wholesale/home when account is still under review or inactive. */
export const pendingVerificationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  if (auth.isPending()) {
    return router.createUrlTree(['/pending']);
  }

  if (isInactiveShopStatus(auth.user()?.status)) {
    return router.createUrlTree(['/inactive']);
  }

  return true;
};

/** Pending review screen — only for authenticated pending users. */
export const pendingScreenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  if (auth.isApproved()) {
    return router.createUrlTree(['/home']);
  }

  if (isInactiveShopStatus(auth.user()?.status)) {
    return router.createUrlTree(['/inactive']);
  }

  return true;
};

/** Inactive / suspended / rejected account screen. */
export const inactiveScreenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  if (auth.isApproved()) {
    return router.createUrlTree(['/home']);
  }

  if (auth.isPending()) {
    return router.createUrlTree(['/pending']);
  }

  if (!isInactiveShopStatus(auth.user()?.status)) {
    return router.createUrlTree(['/pending']);
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;
  if (auth.isPending()) {
    return router.createUrlTree(['/pending']);
  }
  if (isInactiveShopStatus(auth.user()?.status)) {
    return router.createUrlTree(['/inactive']);
  }
  return router.createUrlTree(['/home']);
};

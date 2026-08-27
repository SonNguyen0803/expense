import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuthInitialization();

  const isAuthenticated =
    authService.isAuthenticated();

  if (!isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuthInitialization();

  const isAuthenticated =
    authService.isAuthenticated();
  if (isAuthenticated) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/service/auth.service';
import { OAuthService } from 'angular-oauth2-oidc';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const oauthService = inject(OAuthService);

  const internalAccessToken = authService.getInternalAccessToken();

  if (internalAccessToken) {
    // If offline, allow access if we have a token
    if (!navigator.onLine) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(internalAccessToken.split('.')[1]));
      if (payload.isDefaultPassword) {
        router.navigate(['/change-password']);
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem('accessToken_Internal');
      router.navigate(['/login']);
      return false;
    }
  }

  if (oauthService.hasValidAccessToken()) {
    return true;
  }

  // If offline and we have some token (even if oauth check failed because of expiry check requiring time sync or something),
  // we might want to allow. But for now, let's assume internal token is main one or oauth token is checked.
  // Actually, oauthService.hasValidAccessToken() might rely on clock.
  // Let's keep it simple for now.

  router.navigate(['/login']);
  return false;
};

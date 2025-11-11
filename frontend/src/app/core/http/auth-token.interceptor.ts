import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const tokens = authStore.tokens();

  if (!tokens?.accessToken) {
    return next(req);
  }

  const withAuth = req.clone({
    setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  return next(withAuth);
};

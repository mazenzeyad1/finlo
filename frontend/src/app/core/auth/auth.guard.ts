import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/auth/signin'], {
    queryParams: state.url && state.url !== '/auth/signin' ? { redirectTo: state.url } : undefined,
  });
};

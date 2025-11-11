import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../state/auth.store';

export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  if (!auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/dashboard']);
};

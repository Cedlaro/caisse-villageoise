import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router      = inject(Router);
    const role        = authService.userRole();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Send the user to their own dashboard instead of a generic 403 page.
    // This prevents horizontal privilege escalation via URL manipulation.
    if (role === 'member') {
      return router.createUrlTree(['/dashboard/member']);
    }
    if (role === 'staff' || role === 'admin') {
      return router.createUrlTree(['/dashboard/admin']);
    }

    return router.createUrlTree(['/login']);
  };
};

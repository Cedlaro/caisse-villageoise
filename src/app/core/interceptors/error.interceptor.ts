import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only force-logout on 401s from protected endpoints, not from the login endpoints themselves
      if (error.status === 401 && !req.url.includes('/auth/')) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};

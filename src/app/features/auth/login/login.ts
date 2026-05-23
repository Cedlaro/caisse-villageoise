import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

type LoginTab = 'member' | 'staff';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  readonly currentYear = new Date().getFullYear();

  readonly activeTab     = signal<LoginTab>('member');
  readonly isLoading     = signal(false);
  readonly errorMessage  = signal<string | null>(null);
  readonly showPassword  = signal(false);

  readonly form = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password:   ['', [Validators.required, Validators.minLength(8)]],
  });

  setTab(tab: LoginTab): void {
    this.activeTab.set(tab);
    this.form.reset();
    this.errorMessage.set(null);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    const { identifier, password } = this.form.value;
    if (!identifier || !password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const login$ = this.activeTab() === 'member'
      ? this.authService.memberLogin({ member_number_or_email: identifier, password })
      : this.authService.staffLogin({ employee_id_or_email: identifier, password });

    login$.subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const destination = response.user.role === 'member'
          ? '/dashboard/member'
          : '/dashboard/admin';
        this.router.navigate([destination]);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          (err.error as { message?: string })?.message ?? 'An unexpected error occurred. Please try again.',
        );
      },
    });
  }
}

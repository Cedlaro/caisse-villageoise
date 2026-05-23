import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MemberService } from '../../../core/services/member.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password')?.value as string;
  const confirmPassword = control.get('confirm_password')?.value as string;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb            = inject(FormBuilder);
  private readonly memberService = inject(MemberService);
  private readonly router        = inject(Router);

  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly success      = signal(false);

  readonly form = this.fb.group({
    first_name:       ['', [Validators.required, Validators.maxLength(100)]],
    last_name:        ['', [Validators.required, Validators.maxLength(100)]],
    email:            ['', [Validators.required, Validators.email]],
    phone:            ['', [Validators.required, Validators.maxLength(30)]],
    dob:              ['', [Validators.required]],
    address:          ['', [Validators.required]],
    password:         ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/),
    ]],
    confirm_password: ['', [Validators.required]],
  }, { validators: passwordMatchValidator });

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.memberService.register(this.form.value as Parameters<MemberService['register']>[0]).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          (err.error as { message?: string })?.message ?? 'Registration failed. Please try again.',
        );
      },
    });
  }

  field(name: string) {
    return this.form.get(name);
  }

  isInvalid(name: string): boolean {
    const f = this.field(name);
    return !!(f?.invalid && f.touched);
  }
}

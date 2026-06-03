import { Component, inject, signal, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { StaffService } from '../../../core/services/staff.service';
import { StaffUser } from '../../../core/models/staff.models';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [SlicePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class AdminProfile implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb           = inject(FormBuilder);

  readonly staffUser   = signal<StaffUser | null>(null);
  readonly isLoading   = signal(true);
  readonly loadError   = signal<string | null>(null);
  readonly successMsg  = signal<string | null>(null);

  readonly isSavingProfile  = signal(false);
  readonly profileError     = signal<string | null>(null);

  readonly isSavingPassword = signal(false);
  readonly passwordError    = signal<string | null>(null);
  readonly passwordSuccess  = signal<string | null>(null);
  readonly showCurrent      = signal(false);
  readonly showNew          = signal(false);
  readonly showConfirm      = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.staffService.getMyProfile().subscribe({
      next: (s) => {
        this.staffUser.set(s);
        this.isLoading.set(false);
        this.profileForm = this.fb.group({
          first_name: [s.first_name, [Validators.required, Validators.maxLength(100)]],
          last_name:  [s.last_name,  [Validators.required, Validators.maxLength(100)]],
          email:      [s.email,      [Validators.required, Validators.email]],
        });
        this.passwordForm = this.buildPasswordForm();
      },
      error: () => { this.loadError.set('Failed to load profile.'); this.isLoading.set(false); },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isSavingProfile.set(true);
    this.profileError.set(null);
    this.staffService.updateMyProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.isSavingProfile.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.successMsg.set(null), 3000);
        this.staffService.getMyProfile().subscribe(s => this.staffUser.set(s));
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingProfile.set(false);
        this.profileError.set((err.error as { message?: string })?.message ?? 'Failed to update profile.');
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.isSavingPassword.set(true);
    this.passwordError.set(null);
    this.staffService.changeMyPassword(this.passwordForm.value).subscribe({
      next: (res) => {
        this.isSavingPassword.set(false);
        this.passwordSuccess.set(res.message);
        this.passwordForm = this.buildPasswordForm();
        setTimeout(() => this.passwordSuccess.set(null), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.isSavingPassword.set(false);
        this.passwordError.set((err.error as { message?: string })?.message ?? 'Failed to change password.');
      },
    });
  }

  roleLabel(role: string): string {
    return role === 'admin' ? 'Admin' : 'Staff';
  }

  roleClass(role: string): string {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  private buildPasswordForm(): FormGroup {
    return this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[A-Z])(?=.*\d)/),
      ]],
      confirm_password: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup): { mismatch: true } | null {
    return g.get('new_password')?.value === g.get('confirm_password')?.value
      ? null : { mismatch: true };
  }
}

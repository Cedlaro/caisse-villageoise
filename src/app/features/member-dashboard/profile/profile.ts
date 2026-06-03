import { Component, inject, signal, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MemberService } from '../../../core/services/member.service';
import { MemberDetail } from '../../../core/models/member.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SlicePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly fb            = inject(FormBuilder);

  readonly member      = signal<MemberDetail | null>(null);
  readonly isLoading   = signal(true);
  readonly errorMsg    = signal<string | null>(null);

  readonly isSavingPassword = signal(false);
  readonly passwordError    = signal<string | null>(null);
  readonly passwordSuccess  = signal<string | null>(null);
  readonly showCurrent      = signal(false);
  readonly showNew          = signal(false);
  readonly showConfirm      = signal(false);

  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.memberService.getMyProfile().subscribe({
      next: (m) => {
        this.member.set(m);
        this.isLoading.set(false);
        this.passwordForm = this.buildPasswordForm();
      },
      error: () => { this.errorMsg.set('Failed to load profile.'); this.isLoading.set(false); },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.isSavingPassword.set(true);
    this.passwordError.set(null);
    this.memberService.changeMyPassword(this.passwordForm.value).subscribe({
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

  statusLabel(status: string): string {
    return { pending_kyc: 'Pending KYC', active: 'Active', suspended: 'Suspended' }[status] ?? status;
  }

  statusClass(status: string): string {
    return {
      pending_kyc: 'bg-yellow-100 text-yellow-800',
      active:      'bg-green-100 text-green-800',
      suspended:   'bg-red-100 text-red-800',
    }[status] ?? 'bg-gray-100 text-gray-700';
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

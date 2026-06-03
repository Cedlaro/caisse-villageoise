import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { StaffService } from '../../../core/services/staff.service';
import { StaffUser, StaffRole, StaffStatus } from '../../../core/models/staff.models';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SlicePipe],
  templateUrl: './staff.html',
})
export class Staff implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb           = inject(FormBuilder);

  readonly staffUsers   = signal<StaffUser[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(1);
  readonly limit        = signal(20);
  readonly searchQuery  = signal('');
  readonly roleFilter   = signal('all');
  readonly statusFilter = signal('all');
  readonly isLoading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly actionMsg    = signal<string | null>(null);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  readonly showModal      = signal(false);
  readonly modalMode      = signal<'create' | 'edit'>('create');
  readonly editingId      = signal<number | null>(null);
  readonly isSaving       = signal(false);
  readonly isModalLoading = signal(false);
  readonly modalError     = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.staffService.listStaff({
      page:   this.page(),
      limit:  this.limit(),
      search: this.searchQuery(),
      role:   this.roleFilter(),
      status: this.statusFilter(),
    }).subscribe({
      next: (res) => { this.staffUsers.set(res.data); this.total.set(res.total); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Failed to load staff users.'); this.isLoading.set(false); },
    });
  }

  search(value: string): void { this.searchQuery.set(value); this.page.set(1); this.load(); }
  filterRole(value: string): void { this.roleFilter.set(value); this.page.set(1); this.load(); }
  filterStatus(value: string): void { this.statusFilter.set(value); this.page.set(1); this.load(); }
  goToPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.modalError.set(null);
    this.form = this.buildForm();
    this.showModal.set(true);
  }

  openEdit(staff: StaffUser): void {
    this.modalMode.set('edit');
    this.editingId.set(staff.id);
    this.modalError.set(null);
    this.form = this.buildForm(staff);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isSaving.set(false);
    this.isModalLoading.set(false);
    this.modalError.set(null);
  }

  saveModal(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.modalError.set(null);

    const payload = {
      first_name: this.form.value.first_name,
      last_name:  this.form.value.last_name,
      email:      this.form.value.email,
      role:       this.form.value.role as StaffRole,
    };

    const obs$ = this.modalMode() === 'create'
      ? this.staffService.createStaff(payload)
      : this.staffService.updateStaff(this.editingId()!, payload);

    obs$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.closeModal();
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.modalError.set((err.error as { message?: string })?.message ?? 'Operation failed.');
      },
    });
  }

  updateStatus(staff: StaffUser, status: 'active' | 'suspended'): void {
    this.staffService.updateStatus(staff.id, status).subscribe({
      next: (res) => {
        this.actionMsg.set(res.message);
        setTimeout(() => this.actionMsg.set(null), 3000);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set((err.error as { message?: string })?.message ?? 'Action failed.');
      },
    });
  }

  roleLabel(role: StaffRole): string {
    return role === 'admin' ? 'Admin' : 'Staff';
  }

  roleClass(role: StaffRole): string {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  statusLabel(status: StaffStatus): string {
    return status === 'active' ? 'Active' : 'Suspended';
  }

  statusClass(status: StaffStatus): string {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  private buildForm(staff?: StaffUser): FormGroup {
    return this.fb.group({
      first_name: [staff?.first_name ?? '', [Validators.required, Validators.maxLength(100)]],
      last_name:  [staff?.last_name  ?? '', [Validators.required, Validators.maxLength(100)]],
      email:      [staff?.email      ?? '', [Validators.required, Validators.email]],
      role:       [staff?.role       ?? 'staff', Validators.required],
    });
  }
}

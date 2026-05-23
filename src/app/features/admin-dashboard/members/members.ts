import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MemberService } from '../../../core/services/member.service';
import { MemberSummary, MemberDetail, MemberStatus } from '../../../core/models/member.models';

const STATUS_FILTERS = ['all', 'pending_kyc', 'active', 'suspended'] as const;
type Filter = typeof STATUS_FILTERS[number];

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SlicePipe],
  templateUrl: './members.html',
})
export class Members implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly fb            = inject(FormBuilder);

  readonly members        = signal<MemberSummary[]>([]);
  readonly total          = signal(0);
  readonly page           = signal(1);
  readonly limit          = signal(20);
  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<Filter>('all');
  readonly isLoading      = signal(false);
  readonly errorMsg       = signal<string | null>(null);
  readonly actionMsg      = signal<string | null>(null);

  readonly showModal      = signal(false);
  readonly modalMode      = signal<'create' | 'edit'>('create');
  readonly editingId      = signal<number | null>(null);
  readonly isSaving       = signal(false);
  readonly isModalLoading = signal(false);
  readonly modalError     = signal<string | null>(null);

  form!: FormGroup;

  readonly totalPages = computed(() => Math.ceil(this.total() / this.limit()));
  readonly filters = STATUS_FILTERS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.memberService.listMembers({
      page:   this.page(),
      limit:  this.limit(),
      search: this.searchQuery(),
      status: this.statusFilter(),
    }).subscribe({
      next: (res) => {
        this.members.set(res.data);
        this.total.set(res.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load members.');
        this.isLoading.set(false);
      },
    });
  }

  search(value: string): void {
    this.searchQuery.set(value);
    this.page.set(1);
    this.load();
  }

  setFilter(f: Filter): void {
    this.statusFilter.set(f);
    this.page.set(1);
    this.load();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  updateStatus(member: MemberSummary, status: 'active' | 'suspended'): void {
    this.memberService.updateStatus(member.id, status).subscribe({
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

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.modalError.set(null);
    this.isModalLoading.set(false);
    this.form = this.buildForm('create');
    this.showModal.set(true);
  }

  openEdit(member: MemberSummary): void {
    this.modalMode.set('edit');
    this.editingId.set(member.id);
    this.modalError.set(null);
    this.isModalLoading.set(true);
    this.form = this.buildForm('edit');
    this.showModal.set(true);

    this.memberService.getMember(member.id).subscribe({
      next: (detail) => {
        this.form = this.buildForm('edit', detail);
        this.isModalLoading.set(false);
      },
      error: () => {
        this.closeModal();
        this.errorMsg.set('Failed to load member details.');
      },
    });
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

    if (this.modalMode() === 'create') {
      this.memberService.adminCreateMember({
        first_name: this.form.value.first_name,
        last_name:  this.form.value.last_name,
        email:      this.form.value.email,
        phone:      this.form.value.phone    || undefined,
        dob:        this.form.value.dob      || undefined,
        address:    this.form.value.address  || undefined,
        password:   this.form.value.password,
        status:     this.form.value.status   || undefined,
      }).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.closeModal();
          this.actionMsg.set(`Member ${res.memberNumber} created successfully.`);
          setTimeout(() => this.actionMsg.set(null), 3000);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.modalError.set((err.error as { message?: string })?.message ?? 'Failed to create member.');
        },
      });
    } else {
      this.memberService.updateMember(this.editingId()!, {
        first_name: this.form.value.first_name,
        last_name:  this.form.value.last_name,
        email:      this.form.value.email,
        phone:      this.form.value.phone    || '',
        dob:        this.form.value.dob      || '',
        address:    this.form.value.address  || '',
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.actionMsg.set('Member updated successfully.');
          setTimeout(() => this.actionMsg.set(null), 3000);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.modalError.set((err.error as { message?: string })?.message ?? 'Failed to update member.');
        },
      });
    }
  }

  statusLabel(status: MemberStatus): string {
    return { pending_kyc: 'Pending KYC', active: 'Active', suspended: 'Suspended' }[status];
  }

  statusClass(status: MemberStatus): string {
    return {
      pending_kyc: 'bg-yellow-100 text-yellow-800',
      active:      'bg-green-100 text-green-800',
      suspended:   'bg-red-100 text-red-800',
    }[status];
  }

  private buildForm(mode: 'create' | 'edit', member?: MemberDetail): FormGroup {
    return this.fb.group({
      first_name: [member?.first_name ?? '', [Validators.required, Validators.maxLength(100)]],
      last_name:  [member?.last_name  ?? '', [Validators.required, Validators.maxLength(100)]],
      email:      [member?.email      ?? '', [Validators.required, Validators.email]],
      phone:      [member?.phone      ?? ''],
      dob:        [(member?.dob       ?? '').slice(0, 10)],
      address:    [member?.address    ?? ''],
      status:     [member?.status     ?? 'active'],
      password:   ['', mode === 'create'
        ? [Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*[A-Z])(?=.*\d)/)]
        : []],
    });
  }
}

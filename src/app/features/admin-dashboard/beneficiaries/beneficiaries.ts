import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BeneficiaryService } from '../../../core/services/beneficiary.service';
import { MemberService } from '../../../core/services/member.service';
import { Beneficiary } from '../../../core/models/beneficiary.models';
import { MemberSummary } from '../../../core/models/member.models';

type ModalMode = 'add' | 'edit';

@Component({
  selector: 'app-admin-beneficiaries',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './beneficiaries.html',
})
export class AdminBeneficiaries {
  private readonly beneficiaryService = inject(BeneficiaryService);
  private readonly memberService      = inject(MemberService);
  private readonly fb                 = inject(FormBuilder);

  // Member lookup
  readonly lookupQuery  = signal('');
  readonly member       = signal<MemberSummary | null>(null);
  readonly isSearching  = signal(false);
  readonly searchError  = signal<string | null>(null);

  // Beneficiaries
  readonly beneficiaries  = signal<Beneficiary[]>([]);
  readonly isLoading      = signal(false);
  readonly actionMsg      = signal<string | null>(null);
  readonly listError      = signal<string | null>(null);

  readonly allocated  = computed(() => this.beneficiaries().reduce((s, b) => s + b.percentage, 0));
  readonly remaining  = computed(() => 100 - this.allocated());

  // Add / Edit modal
  readonly showModal  = signal(false);
  readonly modalMode  = signal<ModalMode>('add');
  readonly editingId  = signal<number | null>(null);
  readonly isSaving   = signal(false);
  readonly modalError = signal<string | null>(null);
  form!: FormGroup;

  protected readonly Math = Math;
  readonly relationships = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

  // Delete confirm
  readonly deletingId = signal<number | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  lookupMember(): void {
    const query = this.lookupQuery().trim();
    if (!query) return;
    this.isSearching.set(true);
    this.searchError.set(null);
    this.member.set(null);
    this.beneficiaries.set([]);

    this.memberService.listMembers({ search: query, limit: 5 }).subscribe({
      next: (res) => {
        const match = res.data.find(
          m => m.member_number.toLowerCase() === query.toLowerCase()
            || `${m.first_name} ${m.last_name}`.toLowerCase().includes(query.toLowerCase()),
        );
        if (!match) {
          this.searchError.set(`No member found for "${query}".`);
          this.isSearching.set(false);
          return;
        }
        this.member.set(match);
        this.isSearching.set(false);
        this.loadBeneficiaries(match.id);
      },
      error: () => {
        this.searchError.set('Member lookup failed. Please try again.');
        this.isSearching.set(false);
      },
    });
  }

  loadBeneficiaries(memberId: number): void {
    this.isLoading.set(true);
    this.listError.set(null);
    this.beneficiaryService.getMemberBeneficiaries(memberId).subscribe({
      next:  (list) => { this.beneficiaries.set(list); this.isLoading.set(false); },
      error: ()     => { this.listError.set('Failed to load beneficiaries.'); this.isLoading.set(false); },
    });
  }

  openAdd(): void {
    this.modalMode.set('add');
    this.editingId.set(null);
    this.modalError.set(null);
    this.form = this.fb.group({
      full_name:    ['', Validators.required],
      relationship: ['', Validators.required],
      percentage:   [null, [Validators.required, Validators.min(1), Validators.max(100)]],
    });
    this.showModal.set(true);
  }

  openEdit(b: Beneficiary): void {
    this.modalMode.set('edit');
    this.editingId.set(b.id);
    this.modalError.set(null);
    this.form = this.fb.group({
      full_name:    [b.full_name,    Validators.required],
      relationship: [b.relationship, Validators.required],
      percentage:   [b.percentage,   [Validators.required, Validators.min(1), Validators.max(100)]],
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.isSaving.set(false); this.modalError.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const m = this.member();
    if (!m) return;

    this.isSaving.set(true);
    this.modalError.set(null);

    const payload = this.form.value as { full_name: string; relationship: string; percentage: number };
    const obs$ = this.modalMode() === 'add'
      ? this.beneficiaryService.addBeneficiary(m.id, payload)
      : this.beneficiaryService.updateBeneficiary(this.editingId()!, payload);

    obs$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.flash(this.modalMode() === 'add' ? 'Beneficiary added.' : 'Beneficiary updated.');
        this.loadBeneficiaries(m.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.modalError.set((err.error as { message?: string })?.message ?? 'Operation failed.');
      },
    });
  }

  confirmDelete(id: number): void {
    this.deletingId.set(id);
    this.deleteError.set(null);
  }

  cancelDelete(): void { this.deletingId.set(null); this.deleteError.set(null); }

  doDelete(): void {
    const id = this.deletingId();
    const m  = this.member();
    if (id === null || !m) return;
    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.beneficiaryService.deleteBeneficiary(id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deletingId.set(null);
        this.flash('Beneficiary removed.');
        this.loadBeneficiaries(m.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.deleteError.set((err.error as { message?: string })?.message ?? 'Delete failed.');
      },
    });
  }

  private flash(msg: string): void {
    this.actionMsg.set(msg);
    setTimeout(() => this.actionMsg.set(null), 3000);
  }
}

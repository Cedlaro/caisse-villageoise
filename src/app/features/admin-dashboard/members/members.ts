import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MemberService } from '../../../core/services/member.service';
import { AuthService } from '../../../core/services/auth.service';
import { MemberSummary, MemberDetail, MemberStatus, BulkImportPayload, BulkImportResult } from '../../../core/models/member.models';

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
  protected readonly authService = inject(AuthService);
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
        activity:   this.form.value.activity || undefined,
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
        activity:   this.form.value.activity || '',
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

  // ── Bulk import ─────────────────────────────────────────────────────────────

  readonly showImportModal = signal(false);
  readonly importStep      = signal<'upload' | 'preview' | 'results'>('upload');
  readonly importRows      = signal<BulkImportPayload[]>([]);
  readonly importParseError = signal<string | null>(null);
  readonly isImporting     = signal(false);
  readonly importResult    = signal<BulkImportResult | null>(null);

  readonly CSV_HEADERS = 'first_name,last_name,email,phone,dob,address,activity,status';
  readonly CSV_EXAMPLE = 'Marie,Dupont,marie@example.com,+2309876543,1990-05-20,"12 Rue Centrale",Farmer,active\nJean,Martin,,+2301234567,,,,"pending_kyc"';

  openImportModal(): void {
    this.importStep.set('upload');
    this.importRows.set([]);
    this.importParseError.set(null);
    this.importResult.set(null);
    this.showImportModal.set(true);
  }

  closeImportModal(): void { this.showImportModal.set(false); }

  downloadTemplate(): void {
    const content = `${this.CSV_HEADERS}\n${this.CSV_EXAMPLE}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'members_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      try {
        const rows = this.parseCSV(text);
        if (rows.length === 0) {
          this.importParseError.set('No data rows found in the CSV file.');
          return;
        }
        this.importRows.set(rows);
        this.importParseError.set(null);
        this.importStep.set('preview');
      } catch {
        this.importParseError.set('Failed to parse the CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }

  runImport(): void {
    const rows = this.importRows();
    if (rows.length === 0) return;
    this.isImporting.set(true);
    this.memberService.bulkImport(rows).subscribe({
      next: (result) => {
        this.isImporting.set(false);
        this.importResult.set(result);
        this.importStep.set('results');
        if (result.created > 0) this.load();
      },
      error: () => {
        this.isImporting.set(false);
        this.importParseError.set('Import request failed. Please try again.');
      },
    });
  }

  private parseCSV(text: string): BulkImportPayload[] {
    const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const nonEmpty = lines.filter(l => l.trim());
    if (nonEmpty.length < 2) throw new Error('Not enough rows');

    const headers = this.splitCSVLine(nonEmpty[0]).map(h => h.toLowerCase().trim());
    const idx = (name: string) => headers.indexOf(name);

    return nonEmpty.slice(1).map(line => {
      const cols  = this.splitCSVLine(line);
      const get   = (name: string) => (cols[idx(name)] ?? '').trim() || undefined;
      const first = get('first_name') ?? '';
      const last  = get('last_name')  ?? '';
      const statusRaw = get('status') ?? '';
      const status: MemberStatus = ['pending_kyc', 'active', 'suspended'].includes(statusRaw)
        ? statusRaw as MemberStatus : 'active';
      return { first_name: first, last_name: last, email: get('email'), phone: get('phone'),
               dob: get('dob'), address: get('address'), activity: get('activity'), status };
    }).filter(r => r.first_name || r.last_name);
  }

  private splitCSVLine(line: string): string[] {
    const cols: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur);
    return cols.map(c => c.trim());
  }

  private buildForm(_mode: 'create' | 'edit', member?: MemberDetail): FormGroup {
    return this.fb.group({
      first_name: [member?.first_name ?? '', [Validators.required, Validators.maxLength(100)]],
      last_name:  [member?.last_name  ?? '', [Validators.required, Validators.maxLength(100)]],
      email:      [member?.email      ?? '', [Validators.email]],
      phone:      [member?.phone      ?? ''],
      dob:        [(member?.dob       ?? '').slice(0, 10)],
      address:    [member?.address    ?? ''],
      activity:   [member?.activity   ?? ''],
      status:     [member?.status     ?? 'active'],
    });
  }
}

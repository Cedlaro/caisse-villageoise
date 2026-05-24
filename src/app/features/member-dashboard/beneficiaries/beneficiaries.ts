import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { BeneficiaryService } from '../../../core/services/beneficiary.service';
import { Beneficiary } from '../../../core/models/beneficiary.models';

@Component({
  selector: 'app-member-beneficiaries',
  standalone: true,
  imports: [],
  templateUrl: './beneficiaries.html',
})
export class MemberBeneficiaries implements OnInit {
  private readonly beneficiaryService = inject(BeneficiaryService);

  readonly beneficiaries = signal<Beneficiary[]>([]);
  readonly isLoading     = signal(true);
  readonly errorMsg      = signal<string | null>(null);

  readonly allocated = computed(() => this.beneficiaries().reduce((s, b) => s + b.percentage, 0));

  ngOnInit(): void {
    this.beneficiaryService.getMyBeneficiaries().subscribe({
      next:  (list) => { this.beneficiaries.set(list); this.isLoading.set(false); },
      error: ()     => { this.errorMsg.set('Failed to load beneficiaries.'); this.isLoading.set(false); },
    });
  }
}

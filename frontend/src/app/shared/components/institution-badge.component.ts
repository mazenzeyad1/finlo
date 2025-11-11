import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-institution-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;gap:.5rem">
      <img *ngIf="logoUrl" [src]="logoUrl" alt="" width="20" height="20" style="border-radius:4px"/>
      <span>{{ name }}</span>
    </div>
  `,
})
export class InstitutionBadgeComponent {
  @Input() name = '';
  @Input() logoUrl?: string; // fallback: /assets/logos/{{institutionId}}.svg
}

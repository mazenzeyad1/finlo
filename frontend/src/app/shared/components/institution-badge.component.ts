import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-institution-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './institution-badge.component.html',
})
export class InstitutionBadgeComponent {
  @Input() name = '';
  @Input() logoUrl?: string; // fallback: /assets/logos/{{institutionId}}.svg
}

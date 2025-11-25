import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ui-date-range',
  standalone: true,
  templateUrl: './date-range.component.html',
})
export class DateRangeComponent {
  from?: string; to?: string;
  @Output() change = new EventEmitter<{from?:string; to?:string}>();
  emit(){ this.change.emit({ from: this.from, to: this.to }); }
}

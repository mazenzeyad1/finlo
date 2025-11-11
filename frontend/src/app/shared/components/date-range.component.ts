import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ui-date-range',
  standalone: true,
  template: `
    <label>From <input type="date" (change)="from=$any($event.target).value; emit()"></label>
    <label>To <input type="date" (change)="to=$any($event.target).value; emit()"></label>
  `,
})
export class DateRangeComponent {
  from?: string; to?: string;
  @Output() change = new EventEmitter<{from?:string; to?:string}>();
  emit(){ this.change.emit({ from: this.from, to: this.to }); }
}

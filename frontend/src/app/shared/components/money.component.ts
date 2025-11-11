import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';

@Pipe({ name: 'currencySymbol', standalone: true })
export class CurrencySymbolPipe implements PipeTransform {
  transform(code: string) {
    return ({ USD:'$', CAD:'$', EUR:'€', GBP:'£' } as any)[code] ?? code;
  }
}

@Component({
  selector: 'ui-money',
  standalone: true,
  imports: [CommonModule, CurrencySymbolPipe],
  template: `{{ amount | number:'1.2-2' }} {{ currency | currencySymbol }}`,
})
export class MoneyComponent {
  @Input() amount = 0;
  @Input() currency = 'CAD';
}

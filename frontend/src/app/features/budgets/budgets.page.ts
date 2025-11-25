import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type BudgetPeriod = 'monthly' | 'weekly' | 'custom';
type Budget = { name: string; amount: number; spent: number; period: BudgetPeriod };

@Component({
  standalone: true,
  selector: 'app-budgets',
  imports: [CommonModule, FormsModule],
  templateUrl: './budgets.page.html'
})
export class BudgetsPage {
  open = false;
  draft: Budget = { name:'', amount:0, period:'monthly', spent: 0 };
  budgets: Budget[] = [
    { name:'Groceries', amount:400, spent:230, period: 'monthly' },
    { name:'Transport', amount:120, spent:68, period: 'monthly'  },
  ];
  save(){
    this.budgets.unshift({ name:this.draft.name, amount:this.draft.amount, spent:0, period: this.draft.period });
    this.open = false; this.draft = { name:'', amount:0, period:'monthly', spent: 0 };
  }

  progressRatio(budget: Budget) {
    if (!budget.amount) { return 0; }
    return Math.min(1, Math.max(0, budget.spent / budget.amount));
  }

  formatPeriod(period: BudgetPeriod) {
    return period.charAt(0).toUpperCase() + period.slice(1);
  }
}

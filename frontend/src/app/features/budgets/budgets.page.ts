import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type BudgetPeriod = 'monthly' | 'weekly' | 'custom';
type Budget = { name: string; amount: number; spent: number; period: BudgetPeriod };

@Component({
  standalone: true,
  selector: 'app-budgets',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="section-heading">
        <div>
          <h2>Budgets</h2>
          <p class="helper-text">Stay on track by planning spend across categories.</p>
        </div>
        <button class="btn" (click)="open = !open">{{ open ? 'Close form' : 'New budget' }}</button>
      </header>

      <div *ngIf="open" class="card form-card">
        <h3>Create budget</h3>
        <div class="form-grid">
          <label class="input-field">
            <span>Name</span>
            <input type="text" placeholder="e.g. Groceries" [(ngModel)]="draft.name" />
          </label>
          <label class="input-field">
            <span>Amount</span>
            <input type="number" min="0" step="0.01" [(ngModel)]="draft.amount" />
          </label>
          <label class="input-field">
            <span>Period</span>
            <select [(ngModel)]="draft.period">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn secondary" (click)="open = false">Cancel</button>
          <button class="btn" (click)="save()" [disabled]="!draft.name || !draft.amount">Save budget</button>
        </div>
      </div>

      <div class="card-grid">
        <article *ngFor="let b of budgets" class="card budget-card">
          <header class="card-title-row">
            <div>
              <span class="card-title">{{ b.name }}</span>
              <p class="helper-text">{{ formatPeriod(b.period) }} target</p>
            </div>
            <strong>{{ b.spent | number:'1.0-0' }} / {{ b.amount | number:'1.0-0' }}</strong>
          </header>
          <div class="budget-progress">
            <div class="budget-progress__bar" [style.width.%]="progressRatio(b) * 100"></div>
          </div>
          <div class="helper-text">{{ (progressRatio(b) * 100) | number:'1.0-0' }}% used</div>
        </article>
      </div>
    </section>
  `
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

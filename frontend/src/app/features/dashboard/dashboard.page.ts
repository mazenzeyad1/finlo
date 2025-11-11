import { Component, inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { AccountApi } from '../api/account.api';
import { AppStore } from '../../state/app.store';
import { MoneyComponent } from '../../shared/components/money.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, NgFor, MoneyComponent],
  template: `
    <section class="page">
      <header class="section-heading">
        <div>
          <h2>Overview</h2>
          <p class="helper-text">Instant snapshot of balances and active institutions.</p>
        </div>
        <span class="helper-text">{{ accounts.length }} accounts</span>
      </header>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span>Total balance</span>
          <strong><ui-money [amount]="totalBalance" [currency]="primaryCurrency"></ui-money></strong>
        </div>
        <div class="kpi-card">
          <span>Selected account</span>
          <strong>{{ store.selectedAccount()?.name || 'All accounts' }}</strong>
        </div>
        <div class="kpi-card">
          <span>Average balance</span>
          <strong><ui-money [amount]="averageBalance" [currency]="primaryCurrency"></ui-money></strong>
        </div>
      </div>

      <div class="card-grid">
        <article *ngFor="let a of accounts" class="card">
          <header class="card-title-row">
            <span class="card-title">{{ a.name }}</span>
            <span class="badge">{{ formatType(a.type) }}</span>
          </header>
          <div class="helper-text">{{ a.connectionId }}</div>
          <div class="account-balance">
            <ui-money [amount]="a.balance" [currency]="a.currency"></ui-money>
          </div>
        </article>
      </div>
    </section>
  `
})
export class DashboardPage {
  private api = inject(AccountApi);
  store = inject(AppStore);
  userId = 'demo-user';
  accounts: any[] = [];
  ngOnInit(){ this.api.list(this.userId).subscribe(xs => this.accounts = xs); }

  get totalBalance(){
    return this.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  }

  get averageBalance(){
    if (!this.accounts.length) { return 0; }
    return this.totalBalance / this.accounts.length;
  }
  get primaryCurrency(){
    return this.accounts[0]?.currency || 'USD';
  }
  formatType(type: string){
    if (!type) { return 'Unknown'; }
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

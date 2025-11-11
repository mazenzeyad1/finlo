import { Component, inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AccountApi } from '../api/account.api';
import { MoneyComponent } from '../../shared/components/money.component';
import { AppStore } from '../../state/app.store';
import { ConnectionApi } from '../api/connection.api';

@Component({
  standalone: true,
  selector: 'app-accounts',
  imports: [CommonModule, NgFor, MoneyComponent],
  template: `
    <section class="page">
      <header class="page-header accounts-header">
        <div>
          <h1>Accounts</h1>
          <p class="muted">A quick look at balances across institutions.</p>
        </div>
        <button class="btn" type="button" (click)="linkBank()" [disabled]="isLinking">
          {{ isLinking ? 'Linking…' : 'Link new bank' }}
        </button>
      </header>

      <div class="card-grid">
        <article *ngFor="let a of store.accounts()" class="card account-card">
          <header class="card-title-row">
            <span class="card-title">{{ a.name }}</span>
            <span class="badge">{{ formatType(a.type) }}</span>
          </header>
          <dl class="account-meta">
            <div><dt>Institution</dt><dd>{{ a.connectionId }}</dd></div>
            <div><dt>Account #</dt><dd>{{ a.mask || '—' }}</dd></div>
          </dl>
          <div class="account-balance">
            <ui-money [amount]="a.balance" [currency]="a.currency"></ui-money>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AccountsPage {
  private accountApi = inject(AccountApi);
  private connectionApi = inject(ConnectionApi);
  store = inject(AppStore);
  userId = 'demo-user';
  isLinking = false;
  formatType(type: string){
    if (!type) { return 'Unknown'; }
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  constructor() {
    if (!this.store.accounts().length) {
      void this.loadAccounts();
    }
  }

  private async loadAccounts(){
    const accounts = await firstValueFrom(this.accountApi.list(this.userId));
    this.store.setAccounts(accounts);
  }

  async linkBank(){
    if (this.isLinking) { return; }
    this.isLinking = true;
    try {
      await firstValueFrom(this.connectionApi.startLink({ userId: this.userId, provider: 'plaid' }));
      await firstValueFrom(this.connectionApi.exchange({ userId: this.userId, provider: 'plaid', publicToken: 'public-token-demo' }));
  await this.loadAccounts();
    } catch (err) {
      console.error('Failed to link bank', err);
    } finally {
      this.isLinking = false;
    }
  }
}

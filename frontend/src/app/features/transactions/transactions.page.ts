import { Component, inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { TransactionApi, Page } from '../api/transaction.api';
import { Transaction } from '../../shared/models/types';
import { AppStore } from '../../state/app.store';
import { DateRangeComponent } from '../../shared/components/date-range.component';
import { MoneyComponent } from '../../shared/components/money.component';

@Component({
  standalone: true,
  selector: 'app-transactions',
  imports: [CommonModule, NgFor, DateRangeComponent, MoneyComponent],
  template: `
    <section class="page transactions-page">
      <div class="card transactions-panel">
        <header class="transactions-header">
          <div>
            <h2>Transactions</h2>
            <p class="helper-text">Latest activity across linked accounts.</p>
          </div>
          <button class="icon-btn" type="button" aria-label="More options">
            <span></span><span></span><span></span>
          </button>
        </header>

        <div class="transactions-chips">
          <button class="chip active" type="button">
            {{ selectedAccountLabel() }}
          </button>
          <button class="chip" type="button" (click)="toggleSearch()">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13.8333 12.5H14.5833L18.3333 16.25L16.25 18.3333L12.5 14.5833V13.8333L12.25 13.5833C11.0417 14.5417 9.5 15.0833 7.83333 15.0833C3.91667 15.0833 0.833333 12 0.833333 8.08333C0.833333 4.16667 3.91667 1.08333 7.83333 1.08333C11.75 1.08333 14.8333 4.16667 14.8333 8.08333C14.8333 9.75 14.2917 11.2917 13.3333 12.5L13.8333 12.5ZM3.83333 8.08333C3.83333 10.375 5.54167 12.0833 7.83333 12.0833C10.125 12.0833 11.8333 10.375 11.8333 8.08333C11.8333 5.79167 10.125 4.08333 7.83333 4.08333C5.54167 4.08333 3.83333 5.79167 3.83333 8.08333Z" fill="currentColor"/>
            </svg>
            Search
          </button>
          <button class="chip" type="button" (click)="toggleFilters()">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M6 10H14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M9 15H11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            Filter
          </button>
          <button class="chip apply" type="button" (click)="reload()">Apply</button>
        </div>

        <div class="transactions-controls" *ngIf="showSearch">
          <div class="input-wrapper">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13.8333 12.5H14.5833L18.3333 16.25L16.25 18.3333L12.5 14.5833V13.8333L12.25 13.5833C11.0417 14.5417 9.5 15.0833 7.83333 15.0833C3.91667 15.0833 0.833333 12 0.833333 8.08333C0.833333 4.16667 3.91667 1.08333 7.83333 1.08333C11.75 1.08333 14.8333 4.16667 14.8333 8.08333C14.8333 9.75 14.2917 11.2917 13.3333 12.5L13.8333 12.5ZM3.83333 8.08333C3.83333 10.375 5.54167 12.0833 7.83333 12.0833C10.125 12.0833 11.8333 10.375 11.8333 8.08333C11.8333 5.79167 10.125 4.08333 7.83333 4.08333C5.54167 4.08333 3.83333 5.79167 3.83333 8.08333Z" fill="currentColor"/>
            </svg>
            <input type="search" placeholder="Search description…" (input)="onSearch($any($event.target).value)" (keyup.enter)="reload()" />
          </div>
        </div>

        <div class="transactions-controls" *ngIf="showFilters">
          <label class="input-field" style="width:100%">
            <span>Date range</span>
            <ui-date-range (change)="onRange($event)"></ui-date-range>
          </label>
        </div>
      </div>

      <div class="card transactions-list-card">
        <ul class="transaction-list">
          <li *ngFor="let t of page.items" class="transaction-item">
            <div class="transaction-icon" [style.background]="badgeColor(t)">
              {{ badgeLabel(t) }}
            </div>
            <div class="transaction-details">
              <span class="transaction-title">{{ t.description }}</span>
              <span class="transaction-subtitle">{{ subtitleFor(t) }}</span>
            </div>
            <div class="transaction-value" [class.negative]="t.amount < 0">
              <ui-money [amount]="t.amount" [currency]="t.currency"></ui-money>
              <span class="transaction-date">{{ t.date | date:'MMM d' }}</span>
            </div>
          </li>
        </ul>
        <footer class="transaction-summary">
          <div class="summary-label">
            <span>Total Budget</span>
            <small class="helper-text">Across all linked accounts</small>
          </div>
          <div class="summary-value">
            <strong>{{ budgetUsage() | number:'1.0-0' }}%</strong>
            <span class="helper-text">used</span>
          </div>
        </footer>
      </div>

      <div class="pagination">
        <button class="chip" (click)="prev()" [disabled]="page.page<=1">Prev</button>
        <span class="helper-text">Page {{ page.page }} of {{ totalPages() }}</span>
        <button class="chip" (click)="next()" [disabled]="page.page>=totalPages()">Next</button>
      </div>
    </section>
  `
})
export class TransactionsPage {
  private api = inject(TransactionApi);
  private store = inject(AppStore);
  userId = 'demo-user';

  page: Page<Transaction> = { items: [], total: 0, page: 1, pageSize: 20 };
  q?: string; from?: string; to?: string;
  showSearch = false;
  showFilters = false;

  ngOnInit(){ this.reload(); }
  totalPages(){ return Math.max(1, Math.ceil(this.page.total / this.page.pageSize)); }

  onSearch(v: string){ this.q = v; }
  onRange(r: {from?:string; to?:string}){ this.from = r.from; this.to = r.to; }
  toggleSearch(){ this.showSearch = !this.showSearch; }
  toggleFilters(){ this.showFilters = !this.showFilters; }

  load(){
    this.api.list({
      userId: this.userId,
  accountId: this.store.selectedAccountId() || undefined,
      from: this.from, to: this.to, q: this.q,
      page: this.page.page, pageSize: this.page.pageSize
    }).subscribe(p => this.page = p);
  }
  reload(){ this.page.page = 1; this.load(); }
  next(){ this.page.page++; this.load(); }
  prev(){ this.page.page--; this.load(); }
  selectedAccountLabel(){
    return this.store.selectedAccount()?.name || 'All Accounts';
  }
  subtitleFor(tx: Transaction){
    const date = tx.date ? new Date(tx.date) : null;
    const formatted = date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
    const context = this.accountName(tx) || (tx.pending ? 'Pending' : 'Posted');
    return `${context} · ${formatted}`;
  }
  badgeLabel(tx: Transaction){
    const source = this.accountName(tx) || tx.description || 'TX';
    const trimmed = source.replace(/[^A-Za-z0-9]/g, '');
    return (trimmed.slice(0, 2) || 'TX').toUpperCase();
  }
  badgeColor(tx: Transaction){
    const palette = ['#4c6ef5', '#f97316', '#0ea5e9', '#22c55e', '#6366f1'];
    const key = (this.accountName(tx) || tx.description || 'key').toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  }
  private accountName(tx: Transaction){
    return this.store.accounts().find(a => a.id === tx.accountId)?.name ?? null;
  }
  budgetUsage(){
    const spend = this.page.items
      .filter(t => t.amount < 0)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const cap = 5000;
    if (!cap) { return 0; }
    return Math.min(100, (spend / cap) * 100);
  }
}

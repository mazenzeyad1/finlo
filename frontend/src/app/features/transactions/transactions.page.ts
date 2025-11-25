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
  templateUrl: './transactions.page.html'
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

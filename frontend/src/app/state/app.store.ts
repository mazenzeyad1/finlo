import { Injectable, signal, computed } from '@angular/core';
import { Account } from '../shared/models/types';

@Injectable({ providedIn: 'root' })
export class AppStore {
  // “All Accounts” selection by default
  accounts = signal<Account[]>([]);
  selectedAccountId = signal<string | null>(null);

  setAccounts(xs: Account[]) { this.accounts.set(xs); }
  selectAccount(id: string | null) { this.selectedAccountId.set(id); }

  selectedAccount = computed(() =>
    this.accounts().find(a => a.id === this.selectedAccountId()) ?? null
  );
}

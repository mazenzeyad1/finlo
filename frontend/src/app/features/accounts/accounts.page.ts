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
  templateUrl: './accounts.page.html'
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
    
    // Redirect to connections page for proper Flinks integration
    alert('Please use the Connections page to link a new bank with Flinks.');
    // Or implement the same iframe modal here if needed
  }
}

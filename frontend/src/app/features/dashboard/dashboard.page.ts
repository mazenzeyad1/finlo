import { Component, inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { AccountApi } from '../api/account.api';
import { AppStore } from '../../state/app.store';
import { MoneyComponent } from '../../shared/components/money.component';
import { VerificationBannerComponent } from '../../shared/components/verification-banner.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, NgFor, MoneyComponent, VerificationBannerComponent],
  templateUrl: './dashboard.page.html'
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

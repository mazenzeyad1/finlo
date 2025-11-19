import { Component, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ConnectionApi } from '../api/connection.api';
import { AccountApi } from '../api/account.api';
import { AuthStore } from '../../state/auth.store';
import { AppStore } from '../../state/app.store';
import { InstitutionBadgeComponent } from '../../shared/components/institution-badge.component';
import { FlinksConnectButtonComponent } from '../../shared/components/flinks-connect-button.component';

@Component({
  standalone: true,
  selector: 'app-connections',
  imports: [CommonModule, NgFor, NgIf, InstitutionBadgeComponent, FlinksConnectButtonComponent],
  templateUrl: './connections.page.html'
})
export class ConnectionsPage {
  private api = inject(ConnectionApi);
  private accountApi = inject(AccountApi);
  private auth = inject(AuthStore);
  private appStore = inject(AppStore);
  
  userId = this.auth.user()?.id || 'demo-user';
  connections: any[] = [];

  ngOnInit() {
    this.refresh();
  }

  ngOnDestroy() {
  }

  onConnected() {
    // Refresh and update global accounts after a successful connection
    this.refresh();
    this.accountApi.list(this.userId).subscribe(accounts => {
      this.appStore.setAccounts(accounts);
    });
  }

  async refresh() {
    this.connections = await this.api.list(this.userId).toPromise() || [];
  }

  logoFor(instId: string) {
    return `/assets/logos/${instId}.svg`;
  }

  statusClass(status: string) {
    switch ((status || '').toLowerCase()) {
      case 'active':
      case 'connected':
        return 'connected';
      case 'pending':
      case 'refreshing':
        return 'pending';
      case 'error':
      case 'disconnected':
        return 'error';
      default:
        return '';
    }
  }

  formatStatus(status: string) {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

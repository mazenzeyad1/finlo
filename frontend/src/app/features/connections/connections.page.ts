import { Component, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ConnectionApi } from '../api/connection.api';
import { InstitutionBadgeComponent } from '../../shared/components/institution-badge.component';

@Component({
  standalone: true,
  selector: 'app-connections',
  imports: [CommonModule, NgFor, NgIf, InstitutionBadgeComponent],
  template: `
    <section class="page">
      <header class="section-heading">
        <div>
          <h2>Connected Institutions</h2>
          <p class="helper-text">Manage your linked banks and monitor sync status.</p>
        </div>
        <div class="actions">
          <button class="btn" (click)="start('plaid')">Link New Bank</button>
          <button class="btn secondary" (click)="start('flinks')">Link via Flinks</button>
        </div>
      </header>

      <div class="card table-card" *ngIf="connections.length; else emptyState">
        <table>
          <thead>
            <tr>
              <th>Institution</th>
              <th>Status</th>
              <th>Last Synced</th>
              <th>Accounts</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of connections">
              <td>
                <ui-institution-badge [name]="c.institutionId" [logoUrl]="logoFor(c.institutionId)"></ui-institution-badge>
              </td>
              <td>
                <span class="status-pill {{ statusClass(c.status) }}">{{ formatStatus(c.status) }}</span>
              </td>
              <td>{{ c.linkedAt | date:'mediumDate' }}</td>
              <td>{{ c.accountCount || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="card" style="text-align:center; padding:2.5rem 1.5rem;">
          <h3 style="margin-bottom:0.5rem">No institutions yet</h3>
          <p class="muted" style="margin-bottom:1.25rem">Connect your first bank to start aggregating balances and transactions.</p>
          <button class="btn" (click)="start('plaid')">Get Started</button>
        </div>
      </ng-template>
    </section>
  `
})
export class ConnectionsPage {
  private api = inject(ConnectionApi);
  userId = 'demo-user';
  connections: any[] = [];

  ngOnInit(){ this.refresh(); }
  async start(provider: 'plaid'|'flinks'){
    await this.api.startLink({ userId: this.userId, provider }).toPromise();
    await this.api.exchange({ userId: this.userId, provider, publicToken: 'public-token-demo' }).toPromise();
    await this.refresh();
  }
  async refresh(){ this.connections = await this.api.list(this.userId).toPromise() || []; }
  logoFor(instId: string){ return `/assets/logos/${instId}.svg`; }
  statusClass(status: string){
    switch ((status || '').toLowerCase()) {
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
  formatStatus(status: string){
    if (!status) { return 'Unknown'; }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConnectionApi } from '../api/connection.api';
import { AccountApi } from '../api/account.api';
import { AuthStore } from '../../state/auth.store';
import { AppStore } from '../../state/app.store';
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
          <button class="btn" (click)="start()" [disabled]="isLinking()">
            {{ isLinking() ? 'Opening Flinks...' : 'Link Bank (Flinks)' }}
          </button>
        </div>
      </header>

      <!-- Flinks Connect Modal -->
      <div class="flinks-modal" *ngIf="flinksUrl()" (click)="closeFlinks()">
        <div class="flinks-modal-content" (click)="$event.stopPropagation()">
          <div class="flinks-modal-header">
            <h3>Connect Your Bank</h3>
            <button class="close-btn" (click)="closeFlinks()">&times;</button>
          </div>
          <iframe [src]="flinksUrl()" class="flinks-iframe"></iframe>
          <div class="flinks-sandbox-hint">
            <strong>Sandbox Mode:</strong> Use institution "FlinksCapital", username & password: "Greatday"
          </div>
        </div>
      </div>

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
          <button class="btn" (click)="start()">Get Started</button>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .flinks-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .flinks-modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .flinks-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .flinks-modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #6b7280;
      line-height: 1;
      padding: 0;
    }
    .close-btn:hover {
      color: #111827;
    }
    .flinks-iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
    .flinks-sandbox-hint {
      padding: 0.75rem 1.5rem;
      background: #fef3c7;
      border-top: 1px solid #fbbf24;
      font-size: 0.875rem;
      color: #92400e;
    }
  `]
})
export class ConnectionsPage {
  private api = inject(ConnectionApi);
  private accountApi = inject(AccountApi);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthStore);
  private appStore = inject(AppStore);
  
  userId = this.auth.user()?.id || 'demo-user';
  connections: any[] = [];
  isLinking = signal(false);
  flinksUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit() {
    this.refresh();
    // Listen for messages from Flinks iframe
    window.addEventListener('message', this.handleFlinksMessage.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.handleFlinksMessage.bind(this));
  }

  async start() {
    if (this.isLinking()) return;
    
    this.isLinking.set(true);
    try {
      const response = await this.api.startLink({ userId: this.userId }).toPromise();
      if (response?.linkToken) {
        // Open Flinks Connect in iframe
        const url = this.sanitizer.bypassSecurityTrustResourceUrl(response.linkToken);
        this.flinksUrl.set(url);
      }
    } catch (err) {
      console.error('Failed to start Flinks link', err);
      alert('Failed to open Flinks connection. Check console for details.');
    } finally {
      this.isLinking.set(false);
    }
  }

  closeFlinks() {
    this.flinksUrl.set(null);
  }

  private async handleFlinksMessage(event: MessageEvent) {
    // Flinks sends messages when user completes the flow
    // Check origin for security in production
    if (event.data?.step === 'REDIRECT' || event.data?.loginId) {
      const loginId = event.data.loginId || event.data.requestId;
      
      if (loginId) {
        console.log('Flinks login completed:', loginId);
        
        try {
          await this.api.exchange({ userId: this.userId, publicToken: loginId }).toPromise();
          await this.refresh();
          // Auto-fetch accounts after successful connection
          this.accountApi.list(this.userId).subscribe(accounts => {
            this.appStore.setAccounts(accounts);
          });
          this.closeFlinks();
          alert('Bank connected successfully! Check the Accounts page to see your linked accounts.');
        } catch (err) {
          console.error('Failed to exchange Flinks token', err);
          alert('Failed to complete connection. Please try again.');
        }
      }
    }
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

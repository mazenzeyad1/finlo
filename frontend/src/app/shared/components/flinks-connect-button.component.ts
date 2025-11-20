import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface FlinksMessage {
  LoginId?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'flinks-connect-button',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './flinks-connect-button.component.html',
  styleUrls: ['./flinks-connect-button.component.css']
})
export class FlinksConnectButtonComponent implements OnInit, OnDestroy {
  @Input() userId!: string;
  @Output() connected = new EventEmitter<void>();

  isOpen = false;
  isLoading = false;
  errorMessage: string | null = null;
  sanitizedConnectUrl: SafeResourceUrl | null = null;

  private onMessage = (event: MessageEvent<FlinksMessage>) => {
    // Optional origin validation
    const allowed = (environment as any).FLINKS_ORIGIN as string | undefined;
    if (allowed && event.origin !== allowed) {
      // Helpful during debugging: see unexpected origins
      // eslint-disable-next-line no-console
      console.debug('[FlinksConnectButton] Ignoring postMessage from origin', event.origin);
      return;
    }

    // Debug: log full event payload to ensure LoginId/status visibility
    // eslint-disable-next-line no-console
    console.debug('[FlinksConnectButton] postMessage received', { origin: event.origin, data: event.data });

    const data = event.data as FlinksMessage | undefined;
    if (data && data.LoginId) {
      // eslint-disable-next-line no-console
      console.debug('[FlinksConnectButton] LoginId received from toolbox', data.LoginId);
      this.handleLoginId(data.LoginId);
    }
  };

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    window.addEventListener('message', this.onMessage as any);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage as any);
  }

  open(): void {
    this.errorMessage = null;
    this.isOpen = true;
    this.ensureUrl();
  }

  close(): void {
    if (!this.isLoading) {
      this.isOpen = false;
    }
  }

  private ensureUrl(): void {
    const base = environment.FLINKS_CONNECT_URL || '';
    let url = base;

    // Append demo=true in sandbox if not already present
    const hasQuery = url.includes('?');
    const hasDemo = /[?&]demo=/.test(url);
    if (!hasDemo) {
      url += (hasQuery ? '&' : '?') + 'demo=true';
    }

    this.sanitizedConnectUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private handleLoginId(loginId: string): void {
    if (!this.userId) {
      this.errorMessage = 'Missing userId';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.http.post('/api/connections/link/exchange', {
      userId: this.userId,
      loginId,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isOpen = false;
        this.connected.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = (err?.error?.message) || 'Failed to connect. Please try again.';
      }
    });
  }
}

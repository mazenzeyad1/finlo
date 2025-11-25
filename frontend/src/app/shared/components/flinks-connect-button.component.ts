import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface FlinksMessage {
  LoginId?: string;
  [key: string]: unknown;
}

/**
 * FlinksConnectButtonComponent - Modal for bank connection via Flinks iframe.
 */
@Component({
  selector: 'flinks-connect-button',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './flinks-connect-button.component.html',
  styleUrls: ['./flinks-connect-button.component.css'],
})
export class FlinksConnectButtonComponent implements OnInit, OnDestroy {
  /** User ID for creating the bank connection */
  @Input() userId!: string;

  /** Emitted when bank connection is successfully created */
  @Output() connected = new EventEmitter<void>();

  /** Controls modal visibility */
  isOpen = false;

  /** Loading state during LoginId exchange API call */
  isLoading = false;

  /** Error message to display if exchange fails */
  errorMessage: string | null = null;

  /** Sanitized iframe URL */
  sanitizedConnectUrl: SafeResourceUrl | null = null;

  private onMessage = (event: MessageEvent<FlinksMessage>) => {
    const allowed = (environment as any).FLINKS_ORIGIN as string | undefined;
    if (allowed && event.origin !== allowed) {
      // eslint-disable-next-line no-console
      console.debug(
        '[FlinksConnectButton] Ignoring postMessage from origin',
        event.origin,
      );
      return;
    }

    // eslint-disable-next-line no-console
    console.debug('[FlinksConnectButton] postMessage', {
      origin: event.origin,
      data: event.data,
    });

    const data = event.data as FlinksMessage | undefined;
    if (data?.LoginId) {
      // eslint-disable-next-line no-console
      console.debug('[FlinksConnectButton] LoginId received', data.LoginId);
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

  /** Open modal and fetch iframe URL */
  open(): void {
    this.errorMessage = null;
    this.isOpen = true;
    this.ensureUrl();
  }

  /** Close modal (unless we’re in the middle of exchanging LoginId) */
  close(): void {
    if (!this.isLoading) {
      this.isOpen = false;
    }
  }

  /**
   * Fetch a fresh Flinks Connect iframe URL from the backend.
   * Backend route: POST /api/connections/link/start
   */
  private ensureUrl(): void {
    this.sanitizedConnectUrl = null;
    this.errorMessage = null;

    this.http
      .post<{ linkToken: string }>(
        `${environment.apiBase}/connections/link/start`,
        {},
      )
      .subscribe({
        next: (res) => {
          const url = res.linkToken;
          this.sanitizedConnectUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(url);

          // eslint-disable-next-line no-console
          console.debug(
            '[FlinksConnectButton] Received linkToken from backend',
            url,
          );
        },
        error: (err) => {
          // eslint-disable-next-line no-console
          console.error(
            '[FlinksConnectButton] Failed to load iframe URL',
            err,
          );
          this.errorMessage =
            err?.error?.message ||
            'Failed to start bank connection. Please try again.';
        },
      });
  }

  /**
   * Exchange Flinks LoginId for a database connection.
   */
  private handleLoginId(loginId: string): void {
    if (!this.userId) {
      this.errorMessage = 'Missing userId';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.http
      .post(`${environment.apiBase}/connections/link/exchange`, {
        userId: this.userId,
        loginId,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.isOpen = false;
          this.connected.emit();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.message ||
            'Failed to connect. Please try again.';
        },
      });
  }
}

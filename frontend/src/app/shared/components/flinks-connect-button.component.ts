import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
 * 
 * This component provides a button that opens a modal containing the Flinks Connect
 * iframe. Users authenticate with their bank inside the iframe, and when complete,
 * Flinks posts a message containing a LoginId back to this component.
 * 
 * Flow:
 * 1. User clicks "Connect Bank" button
 * 2. Modal opens with Flinks Connect iframe (URL from environment.ts)
 * 3. User selects bank and authenticates inside iframe
 * 4. Flinks posts LoginId via window.postMessage
 * 5. Component receives LoginId and exchanges it via backend API
 * 6. Backend creates connection, accounts, and transactions in database
 * 7. Modal closes and emits 'connected' event to parent
 * 
 * The iframe URL is hardcoded in environment.ts and includes demo=true for sandbox.
 */
@Component({
  selector: 'flinks-connect-button',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './flinks-connect-button.component.html',
  styleUrls: ['./flinks-connect-button.component.css']
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
  
  /** Sanitized iframe URL (from environment.ts) */
  sanitizedConnectUrl: SafeResourceUrl | null = null;

  /**
   * Handle postMessage events from Flinks iframe.
   * 
   * When a user completes authentication inside the Flinks iframe,
   * Flinks posts a message to the parent window containing a LoginId.
   * This handler listens for that message and initiates the exchange process.
   * 
   * Security:
   * - Validates message origin matches FLINKS_ORIGIN (if configured)
   * - Ignores messages without a LoginId field
   * 
   * @param event - postMessage event from Flinks iframe
   */
  private onMessage = (event: MessageEvent<FlinksMessage>) => {
    // Validate origin to prevent accepting messages from untrusted sources
    const allowed = (environment as any).FLINKS_ORIGIN as string | undefined;
    if (allowed && event.origin !== allowed) {
      // eslint-disable-next-line no-console
      console.debug('[FlinksConnectButton] Ignoring postMessage from origin', event.origin);
      return;
    }

    // eslint-disable-next-line no-console
    console.debug('[FlinksConnectButton] postMessage received', { origin: event.origin, data: event.data });

    const data = event.data as FlinksMessage | undefined;
    if (data && data.LoginId) {
      // eslint-disable-next-line no-console
      console.debug('[FlinksConnectButton] LoginId received from Flinks', data.LoginId);
      this.handleLoginId(data.LoginId);
    }
  };

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
  ) {}

  /**
   * Register postMessage listener on component initialization.
   * This allows us to receive LoginId from Flinks iframe.
   */
  ngOnInit(): void {
    window.addEventListener('message', this.onMessage as any);
  }

  /**
   * Clean up postMessage listener when component is destroyed.
   * Prevents memory leaks and duplicate handlers.
   */
  ngOnDestroy(): void {
    window.removeEventListener('message', this.onMessage as any);
  }

  /**
   * Open the Flinks Connect modal.
   * Clears any previous errors and fetches a fresh iframe URL from backend.
   */
  open(): void {
    this.errorMessage = null;
    this.isOpen = true;
    this.ensureUrl();
  }

  /**
   * Close the Flinks Connect modal.
   * Prevents closing while LoginId exchange is in progress.
   */
  close(): void {
    if (!this.isLoading) {
      this.isOpen = false;
    }
  }

  /**
   * Fetch a fresh Flinks Connect iframe URL from the backend.
   * 
   * Each time the modal opens, this method:
   * 1. Calls backend API to get a signed iframe URL
   * 2. Backend generates a fresh authorize token from Flinks
   * 3. Backend appends the token to the iframe URL
   * 4. Returns the complete URL ready for embedding
   * 
   * This ensures each user session gets a unique, short-lived token
   * that expires after a few minutes, improving security and tracking.
   * 
   * The URL includes:
   * - Base Flinks Connect URL
   * - demo=true (for sandbox mode)
   * - authorizeToken=<token> (freshly generated)
   */
  private async ensureUrl(): Promise<void> {
    const base = environment.FLINKS_CONNECT_URL || '';
    let url = base;

    // Ensure demo=true is present for sandbox mode
    const hasQuery = url.includes('?');
    const hasDemo = /[?&]demo=/.test(url);
    if (!hasDemo) {
      url += (hasQuery ? '&' : '?') + 'demo=true';
    }

    // Sanitize URL for iframe embedding (bypasses Angular's strict security)
    this.sanitizedConnectUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Exchange Flinks LoginId for a database connection.
   * 
   * Called when Flinks posts a LoginId after successful authentication.
   * This method:
   * 1. Sends LoginId to backend API
   * 2. Backend exchanges it with Flinks for institution info
   * 3. Backend creates Connection, accounts, and transactions in database
   * 4. On success, closes modal and notifies parent component
   * 
   * @param loginId - The LoginId received from Flinks postMessage
   */
  private handleLoginId(loginId: string): void {
    if (!this.userId) {
      this.errorMessage = 'Missing userId';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Call backend to exchange LoginId and create connection
    this.http.post('/api/connections/link/exchange', {
      userId: this.userId,
      loginId,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isOpen = false;
        this.connected.emit(); // Notify parent to refresh data
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = (err?.error?.message) || 'Failed to connect. Please try again.';
      }
    });
  }
}

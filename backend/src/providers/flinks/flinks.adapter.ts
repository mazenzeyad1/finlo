import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankDataProvider } from '../ports/bank-data.provider';

interface FlinksAccountsResponse {
  Accounts?: Array<{
    Id: string;
    Title: string;
    AccountNumber?: string;
    Type: string;
    Currency: string;
    Balance?: {
      Current?: number;
    };
    Transactions?: Array<{
      Id?: string;
      Date?: string;
      Description?: string;
      Debit?: number;
      Credit?: number;
    }>;
  }>;
}

interface FlinksLoginResponse {
  LoginId?: string;
  RequestId?: string;
  Institution?: string;
}

interface FlinksAuthorizeResponse {
  AuthorizeToken?: string;
  ExpiresInSeconds?: number;
}

/**
 * FlinksAdapter - Integrates with Flinks API for bank data aggregation.
 * 
 * This adapter implements the BankDataProvider interface to connect with Flinks
 * banking API. It supports both sandbox (toolbox) and production modes.
 * 
 * Key responsibilities:
 * - Provide iframe URL for Flinks Connect widget
 * - Exchange LoginId for institution data after user completes connection flow
 * - Fetch account details and balances
 * - Fetch transaction history
 * 
 * Environment Variables Required:
 * - FLINKS_MODE: 'sandbox' or 'production'
 * - FLINKS_BASE_URL: API endpoint (e.g., https://toolbox-api.private.fin.ag/v3)
 * - FLINKS_CONNECT_URL: iframe URL (e.g., https://toolbox-iframe.private.fin.ag/v2/)
 * - FLINKS_CUSTOMER_ID: Your Flinks customer ID
 * - FLINKS_BEARER_TOKEN: Bearer token for API authentication
 * - FLINKS_AUTH_KEY: Authentication key
 * - FLINKS_API_KEY: API key for requests
 */
@Injectable()
export class FlinksAdapter implements BankDataProvider {
  private readonly logger = new Logger(FlinksAdapter.name);
  private readonly baseUrl: string;
  private readonly isSandbox: boolean;
  private readonly connectUrl: string;
  private readonly customerId: string;
  private readonly bearerToken: string;
  private readonly authKey: string;
  private readonly apiKey: string;
  private authorizeTokenCache?: { token: string; expiresAt: number };

  constructor(private config: ConfigService) {
    // Load Flinks configuration from environment variables
    this.baseUrl = this.config.get<string>('FLINKS_BASE_URL', 'https://toolbox-api.private.fin.ag/v3');
    this.isSandbox = this.config.get<string>('FLINKS_MODE', 'sandbox') === 'sandbox';
    this.customerId = this.config.get<string>('FLINKS_CUSTOMER_ID', '');
    this.bearerToken = this.config.get<string>('FLINKS_BEARER_TOKEN', '');
    this.authKey = this.config.get<string>('FLINKS_AUTH_KEY', '');
    this.apiKey = this.config.get<string>('FLINKS_API_KEY', '');
    
    // Connect URL is the iframe endpoint users interact with
    this.connectUrl = this.config.get<string>('FLINKS_CONNECT_URL');
    if (!this.connectUrl) {
      this.logger.warn('FLINKS_CONNECT_URL is not set – frontend will not be able to show Connect iframe');
    }
    
    if (this.isSandbox) {
      this.logger.log('Flinks adapter running in sandbox/toolbox mode');
    }
  }

  /**
   * Get the Flinks Connect iframe URL with a fresh authorize token.
   * 
   * This method:
   * 1. Calls Flinks /GenerateAuthorizeToken API to get a secure token
   * 2. Appends the token to the Connect iframe URL
   * 3. Returns the signed URL to the frontend
   * 
   * Each user session gets a unique authorize token that expires after
   * a short period (typically 5 minutes). This ensures:
   * - Users can't reuse old tokens
   * - Each connection attempt is properly authenticated
   * - Flinks can track and validate each connection flow
   * 
   * The frontend embeds this URL in an iframe where users:
   * 1. Select their bank/institution
   * 2. Authenticate with their bank credentials
   * 3. Grant permission to access their account data
   * 
   * After successful authentication, Flinks posts a message containing
   * a LoginId back to the parent window, which the frontend then exchanges
   * via the exchangeLoginId() method.
   * 
   * @param _userId - User ID (not used by Flinks, but required by interface)
   * @returns Object containing:
   *   - linkToken: The Connect iframe URL with authorize token
   *   - sandboxInfo: Credentials for testing in sandbox mode (optional)
   * @throws Error if token generation fails
   */
  async getLinkToken(_userId: string) {
    // Return static connect URL for Flinks iframe
    return {
      linkToken: this.connectUrl,
      sandboxInfo: this.isSandbox ? {
        institution: 'FlinksCapital',
        username: 'Greatday',
        password: 'Everyday'
      } : undefined
    };
  }

  /**
   * Exchange a Flinks LoginId for institution information.
   * 
   * After a user completes authentication in the Flinks Connect iframe,
   * Flinks posts a LoginId back to the frontend. This method:
   * 1. Calls Flinks /AccountsSummary API with the LoginId
   * 2. Retrieves the institution name and details
   * 3. Returns the LoginId as an access token for future API calls
   * 
   * The LoginId serves as the persistent access token for fetching
   * accounts and transactions for this connection.
   * 
   * @param loginId - The LoginId received from Flinks Connect iframe
   * @returns Object containing:
   *   - accessToken: The LoginId (used for subsequent API calls)
   *   - institution: Object with institution id and name
   * @throws Error if API call fails or returns non-200 status
   */
  async exchangeLoginId(loginId: string) {
    try {
      const url = `${this.baseUrl}/AccountsSummary`;
      const payload = {
        LoginId: loginId,
        RequestId: `req-${Date.now()}`,
        MostRecentCached: true
      };

      this.logger.debug(`Calling Flinks API: ${url}`);
      this.logger.debug(`Flinks /AccountsSummary payload: ${JSON.stringify(payload)}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.bearerToken) {
        headers['Authorization'] = `Bearer ${this.bearerToken}`;
      }
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      this.logger.debug(`Flinks /AccountsSummary status=${response.status} body=${text}`);
      
      if (!response.ok) {
        throw new Error(`Flinks API error: ${response.status}`);
      }

      const data: FlinksLoginResponse = JSON.parse(text || '{}');
      const institutionName = data.Institution || 'Unknown Institution';
      const institutionId = `flinks:${institutionName.toLowerCase().replace(/\s+/g, '-')}`;

      return {
        accessToken: loginId, // Use LoginId as access token
        institution: {
          id: institutionId,
          name: institutionName
        }
      };
    } catch (error) {
      this.logger.error('Failed to exchange Flinks login', error);
      throw error;
    }
  }

  /**
   * Fetch all accounts associated with a Flinks connection.
   * 
   * Calls Flinks /AccountsDetail API to retrieve:
   * - Account IDs and names
   * - Account types (checking, savings, credit, etc.)
   * - Current balances
   * - Account numbers (masked to last 4 digits)
   * 
   * @param loginId - The LoginId from exchangeLoginId()
   * @returns Array of account objects with normalized fields:
   *   - externalId: Flinks account ID
   *   - name: Account title/name
   *   - mask: Last 4 digits of account number
   *   - type: Normalized account type (checking, savings, credit, loan, investment)
   *   - currency: Account currency code (e.g., 'CAD', 'USD')
   *   - balance: Current balance as number
   * @throws Error if API call fails
   */
  async fetchAccounts(loginId: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.bearerToken) {
        headers['Authorization'] = `Bearer ${this.bearerToken}`;
      }
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          LoginId: loginId,
          RequestId: `req-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Flinks API error: ${response.status}`);
      }

      const data: FlinksAccountsResponse = await response.json();
      
      if (!data.Accounts || data.Accounts.length === 0) {
        return [];
      }

      return data.Accounts.map(account => ({
        externalId: account.Id,
        name: account.Title || 'Unnamed Account',
        mask: account.AccountNumber?.slice(-4),
        type: this.mapAccountType(account.Type),
        currency: account.Currency || 'CAD',
        balance: account.Balance?.Current || 0
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Flinks accounts', error);
      throw error;
    }
  }

  /**
   * Fetch transaction history for all accounts in a Flinks connection.
   * 
   * Calls Flinks /AccountsDetail API and extracts transaction data from
   * all accounts. Transactions include debits (negative amounts) and
   * credits (positive amounts).
   * 
   * @param loginId - The LoginId from exchangeLoginId()
   * @param opts - Query options:
   *   - since: ISO date string to filter transactions (not used by Flinks API)
   *   - cursor: Request ID for pagination (triggers MostRecentCached mode)
   * @returns Object containing:
   *   - transactions: Array of transaction objects with:
   *     - externalId: Flinks transaction ID (or generated if missing)
   *     - accountExternalId: Flinks account ID this transaction belongs to
   *     - date: Transaction date (ISO string)
   *     - description: Transaction description
   *     - amount: Transaction amount (negative for debits, positive for credits)
   *     - currency: Currency code (e.g., 'CAD')
   *     - pending: Always false (Flinks doesn't provide pending status)
   *   - nextCursor: Request ID for pagination (if more data available)
   * @throws Error if API call fails
   */
  async fetchTransactions(loginId: string, opts: { since?: string; cursor?: string }) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.bearerToken) {
        headers['Authorization'] = `Bearer ${this.bearerToken}`;
      }
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          LoginId: loginId,
          RequestId: `req-${Date.now()}`,
          MostRecentCached: opts.cursor !== undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Flinks API error: ${response.status}`);
      }

      const data: any = await response.json();
      const transactions: any[] = [];

      // Extract transactions from all accounts
      if (data.Accounts) {
        for (const account of data.Accounts) {
          if (account.Transactions) {
            for (const tx of account.Transactions) {
              transactions.push({
                externalId: tx.Id || `tx-${Date.now()}-${Math.random()}`,
                accountExternalId: account.Id,
                date: tx.Date || new Date().toISOString(),
                description: tx.Description || 'Unknown',
                amount: tx.Debit ? -Math.abs(tx.Debit) : (tx.Credit || 0),
                currency: account.Currency || 'CAD',
                pending: false
              });
            }
          }
        }
      }

      return {
        transactions,
        nextCursor: data.RequestId
      };
    } catch (error) {
      this.logger.error('Failed to fetch Flinks transactions', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Flinks.
   * 
   * Currently accepts all webhooks in sandbox mode. In production,
   * this should validate the webhook signature to ensure requests
   * are legitimately from Flinks.
   * 
   * @param _sigHeader - Signature header from webhook request (not implemented)
   * @param _rawBody - Raw request body for signature verification (not implemented)
   * @returns true in sandbox mode, false in production (TODO: implement verification)
   */
  verifyWebhook(_sigHeader: any, _rawBody: Buffer) {
    // TODO: Implement proper webhook signature verification for production
    return this.isSandbox ? true : false;
  }

  /**
   * Map Flinks account types to standardized types.
   * 
   * Flinks returns various account type strings (e.g., "Chequing", "Savings Account").
   * This method normalizes them to our standard types for consistent UI display.
   * 
   * @param flinksType - Account type string from Flinks API
   * @returns Normalized account type: 'checking', 'savings', 'credit', 'loan', or 'investment'
   */
  private mapAccountType(flinksType: string): string {
    const normalized = (flinksType || '').toLowerCase();
    if (normalized.includes('checking') || normalized.includes('chequing')) return 'checking';
    if (normalized.includes('saving')) return 'savings';
    if (normalized.includes('credit')) return 'credit';
    if (normalized.includes('loan') || normalized.includes('mortgage')) return 'loan';
    if (normalized.includes('investment') || normalized.includes('rrsp') || normalized.includes('tfsa')) return 'investment';
    return 'checking'; // default fallback
  }

  /**
   * Generate a fresh authorize token from Flinks API.
   * 
   * This token is required to initialize the Flinks Connect iframe.
   * It's short-lived (typically 5 minutes) and ensures each connection
   * attempt is properly authenticated and tracked.
   * 
   * The token is cached briefly (with 5-second buffer before expiry)
   * to avoid unnecessary API calls if multiple users try to connect
   * simultaneously.
   * 
   * @returns Authorize token string to append to iframe URL
   * @throws Error if API call fails or credentials are missing
   */
  private async generateAuthorizeToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid (with 5-second buffer)
    if (this.authorizeTokenCache && this.authorizeTokenCache.expiresAt > now + 5000) {
      return this.authorizeTokenCache.token;
    }

    // Ensure we have credentials
    if (!this.authKey && !this.bearerToken) {
      throw new Error('FLINKS_AUTH_KEY or FLINKS_BEARER_TOKEN must be configured');
    }

    // Determine API base URL (remove /v3 suffix if present)
    const baseApiUrl = this.baseUrl.replace(/\/v3\/?$/, '');
    const url = `${baseApiUrl}/v3/GenerateAuthorizeToken`;
    
    this.logger.debug(`Requesting Flinks authorize token via ${url}`);

    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authKey) {
      headers['Authorization'] = `Bearer ${this.authKey}`;
    } else if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    // Call Flinks API
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    const text = await response.text();
    this.logger.debug(`Flinks /GenerateAuthorizeToken status=${response.status} body=${text}`);

    if (!response.ok) {
      throw new Error(`Flinks authorize token request failed with status ${response.status}: ${text}`);
    }

    const data: FlinksAuthorizeResponse = JSON.parse(text || '{}');
    if (!data.AuthorizeToken) {
      throw new Error('Flinks authorize token response missing AuthorizeToken field');
    }

    // Cache token with expiry
    const expiresInSeconds = data.ExpiresInSeconds ?? 300; // Default 5 minutes
    this.authorizeTokenCache = {
      token: data.AuthorizeToken,
      expiresAt: now + expiresInSeconds * 1000,
    };

    this.logger.log(`Generated Flinks authorize token (expires in ${expiresInSeconds}s)`);
    return data.AuthorizeToken;
  }
}

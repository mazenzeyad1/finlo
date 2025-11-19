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

@Injectable()
export class FlinksAdapter implements BankDataProvider {
  private readonly logger = new Logger(FlinksAdapter.name);
  private readonly baseUrl: string;
  private readonly isSandbox: boolean;
  private readonly connectUrl: string;

  constructor(private config: ConfigService) {
    // Flinks sandbox/toolbox endpoint (no credentials needed)
    this.baseUrl = this.config.get<string>('FLINKS_BASE_URL', 'https://toolbox-api.private.fin.ag/v3');
    this.isSandbox = this.config.get<string>('FLINKS_MODE', 'sandbox') === 'sandbox';
    
    // Your account-specific connect URL from Flinks dashboard
    this.connectUrl = this.config.get<string>('FLINKS_CONNECT_URL');
    if (!this.connectUrl) {
      this.logger.warn('FLINKS_CONNECT_URL is not set – frontend will not be able to show Connect iframe');
    }
    
    if (this.isSandbox) {
      this.logger.log('Flinks adapter running in sandbox/toolbox mode');
    }
  }

  /**
   * For Flinks, "getLinkToken" just means:
   * return the Connect URL the frontend should embed in an iframe.
   */
  async getLinkToken(_userId: string) {
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
   * In Flinks, what was previously called "publicToken" is actually LoginId.
   * This method exchanges the LoginId for institution info and stores it.
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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async fetchAccounts(loginId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async fetchTransactions(loginId: string, opts: { since?: string; cursor?: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/AccountsDetail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  verifyWebhook(_sigHeader: any, _rawBody: Buffer) {
    // Flinks webhook verification would go here
    // For now, accept all in sandbox mode
    return this.isSandbox ? true : false;
  }

  private mapAccountType(flinksType: string): string {
    const normalized = (flinksType || '').toLowerCase();
    if (normalized.includes('checking') || normalized.includes('chequing')) return 'checking';
    if (normalized.includes('saving')) return 'savings';
    if (normalized.includes('credit')) return 'credit';
    if (normalized.includes('loan') || normalized.includes('mortgage')) return 'loan';
    if (normalized.includes('investment') || normalized.includes('rrsp') || normalized.includes('tfsa')) return 'investment';
    return 'checking'; // default
  }
}

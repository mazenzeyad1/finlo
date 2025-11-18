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

  constructor(private config: ConfigService) {
    // Flinks sandbox/toolbox endpoint (no credentials needed)
    this.baseUrl = this.config.get<string>('FLINKS_BASE_URL', 'https://toolbox-api.private.fin.ag/v3');
    this.isSandbox = this.config.get<string>('FLINKS_MODE', 'sandbox') === 'sandbox';
    
    if (this.isSandbox) {
      this.logger.log('Flinks adapter running in sandbox/toolbox mode');
    }
  }

  async getLinkToken(_userId: string) {
    // In Flinks, the frontend connects directly via iframe/redirect
    // Return the Connect URL for the frontend to embed
    const connectUrl = this.config.get<string>(
      'FLINKS_CONNECT_URL',
      'https://toolbox.flinks.com/v3'
    );
    
    return { 
      linkToken: connectUrl,
      // In toolbox mode, you can use demo institution credentials
      sandboxInfo: this.isSandbox ? {
        institution: 'FlinksCapital',
        username: 'Greatday',
        password: 'Greatday'
      } : undefined
    };
  }

  async exchangePublicToken(loginId: string) {
    // loginId is the LoginId returned from Flinks Connect flow
    try {
      const response = await fetch(`${this.baseUrl}/AccountsSummary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ LoginId: loginId })
      });

      if (!response.ok) {
        throw new Error(`Flinks API error: ${response.status}`);
      }

      const data: FlinksLoginResponse = await response.json();
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

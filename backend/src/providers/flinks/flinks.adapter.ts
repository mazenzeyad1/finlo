import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BankDataProvider } from '../ports/bank-data.provider';

@Injectable()
export class FlinksAdapter implements BankDataProvider {
  private readonly logger = new Logger(FlinksAdapter.name);
  private readonly customerId: string;
  private readonly authKey: string;
  private readonly apiKey: string;
  private readonly connectUrl: string;
  private authorizeTokenCache?: { token: string; expiresAt: number };

  constructor(private config: ConfigService) {
    this.customerId = this.config.get<string>('FLINKS_CUSTOMER_ID', '');
    this.authKey = this.config.get<string>('FLINKS_AUTH_KEY', '');
    this.apiKey = this.config.get<string>('FLINKS_API_KEY', '');
    this.connectUrl = this.config.get<string>('FLINKS_CONNECT_URL');

    if (!this.connectUrl) {
      this.logger.warn('FLINKS_CONNECT_URL is not set');
    }
  }

  async getLinkToken() {
    const token = await this.generateAuthorizeToken();
    const finalUrl = `${this.connectUrl}?demo=true&authorizeToken=${token}`;
    return { linkToken: finalUrl };
  }

  private async generateAuthorizeToken(): Promise<string> {
    const now = Date.now();

    if (this.authorizeTokenCache && this.authorizeTokenCache.expiresAt > now + 5000) {
      return this.authorizeTokenCache.token;
    }

    if (!this.customerId) throw new Error('Missing FLINKS_CUSTOMER_ID');
    if (!this.authKey) throw new Error('Missing FLINKS_AUTH_KEY');

    const url = `https://toolbox-api.private.fin.ag/v3/${this.customerId}/BankingServices/GenerateAuthorizeToken`;

    this.logger.debug(`[FlinksAdapter] Requesting token → ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'flinks-auth-key': this.authKey,
      },
      body: JSON.stringify({}),
    });

    const raw = await response.text();
    this.logger.debug(`[FlinksAdapter] Response ${response.status} → ${raw}`);

    if (!response.ok) {
      throw new Error(`Authorize token failed: ${response.status} → ${raw}`);
    }

    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error('Failed to parse JSON from GenerateAuthorizeToken');
    }

    const token = json.Token; // sandbox uses "Token"
    if (!token) throw new Error('Missing Token in Flinks response');

    const expiresIn = json.ExpiresInSeconds ?? 300;

    this.authorizeTokenCache = {
      token,
      expiresAt: now + expiresIn * 1000,
    };

    return token;
  }

  async exchangeLoginId(loginId: string) {
    const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsSummary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        LoginId: loginId,
        RequestId: `req-${Date.now()}`,
        MostRecentCached: true,
      }),
    });

    const text = await response.text();
    this.logger.debug(`AccountsSummary → ${response.status} → ${text}`);

    if (!response.ok) {
      throw new Error(`Flinks AccountsSummary failed: ${response.status}`);
    }

    const data = JSON.parse(text);

    return {
      accessToken: loginId,
      institution: {
        id: `flinks:${(data.Institution || 'Unknown')}`,
        name: data.Institution || 'Unknown',
      },
    };
  }

  async fetchAccounts(loginId: string) {
    const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsDetail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ LoginId: loginId }),
    });

    if (!response.ok) throw new Error('Failed to fetch accounts');

    const data = await response.json();
    if (!data.Accounts) return [];

    return data.Accounts.map((acc: any) => ({
      externalId: acc.Id,
      name: acc.Title,
      mask: acc.AccountNumber?.slice(-4),
      type: acc.Type,
      currency: acc.Currency,
      balance: acc.Balance?.Current ?? 0,
    }));
  }

  async fetchTransactions(loginId: string) {
    const response = await fetch(`https://toolbox-api.private.fin.ag/v3/AccountsDetail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ LoginId: loginId }),
    });

    if (!response.ok) throw new Error('Failed to fetch transactions');

    const data = await response.json();
    const txs: any[] = [];

    if (data.Accounts) {
      for (const acc of data.Accounts) {
        if (acc.Transactions) {
          for (const tx of acc.Transactions) {
            txs.push({
              externalId: tx.Id,
              accountExternalId: acc.Id,
              date: tx.Date,
              description: tx.Description,
              amount: tx.Debit ? -tx.Debit : tx.Credit,
              currency: acc.Currency,
              pending: false,
            });
          }
        }
      }
    }

    return { transactions: txs };
  }

  verifyWebhook(_sig: any, _body: Buffer) {
    return true; // sandbox accepts all
  }
}

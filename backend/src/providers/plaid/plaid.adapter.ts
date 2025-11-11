import { Injectable } from '@nestjs/common';
import { BankDataProvider } from '../ports/bank-data.provider';

@Injectable()
export class PlaidAdapter implements BankDataProvider {
  async getLinkToken(userId: string) {
    // TODO: Call Plaid link/token create
    return { linkToken: `mock-link-token-for-${userId}` };
  }
  async exchangePublicToken(publicToken: string) {
    // TODO: Exchange with Plaid to get access token + institution
    return { accessToken: `mock-access-${publicToken}`, institution: { id: 'plaid:mock', name: 'Mock Bank (Plaid)' } };
  }
  async fetchAccounts(_accessToken: string) {
    // TODO: Plaid accounts/get
    return [ { externalId: 'ext-acc-1', name: 'Checking', type: 'checking', currency: 'CAD', balance: 1200.50 } ];
  }
  async fetchTransactions(_accessToken: string, opts: { since?: string; cursor?: string }) {
    // TODO: Plaid transactions/sync
    return {
      transactions: [
        { externalId: 'ext-tx-1', accountExternalId: 'ext-acc-1', date: new Date().toISOString(), description: 'Coffee', amount: -4.25, currency: 'CAD', pending: false }
      ],
      nextCursor: opts.cursor || 'cursor-1'
    };
  }
  verifyWebhook(_sigHeader: any, _rawBody: Buffer) {
    // TODO: verify signature
    return true;
  }
}

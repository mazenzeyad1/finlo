import { Injectable } from '@nestjs/common';
import { BankDataProvider } from '../ports/bank-data.provider';

@Injectable()
export class FlinksAdapter implements BankDataProvider {
  async getLinkToken(userId: string) { return { linkToken: `mock-flinks-link-${userId}` }; }
  async exchangePublicToken(publicToken: string) {
    return { accessToken: `mock-flinks-access-${publicToken}`, institution: { id: 'flinks:mock', name: 'Mock Bank (Flinks)' } };
  }
  async fetchAccounts(_accessToken: string) {
    return [ { externalId: 'flinks-acc-1', name: 'Savings', type: 'savings', currency: 'CAD', balance: 5000 } ];
  }
  async fetchTransactions(accessToken: string, opts: { since?: string; cursor?: string }) {
    return { transactions: [], nextCursor: opts.cursor || 'cursor-1' };
  }
  verifyWebhook(_sigHeader: any, _rawBody: Buffer) { return true; }
}

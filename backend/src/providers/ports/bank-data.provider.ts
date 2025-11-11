export interface BankDataProvider {
  getLinkToken(userId: string): Promise<{ linkToken: string }>;
  exchangePublicToken(publicToken: string): Promise<{
    accessToken: string;
    institution: { id: string; name: string };
  }>;
  fetchAccounts(accessToken: string): Promise<Array<{
    externalId: string; name: string; mask?: string; type: string; currency: string; balance: number;
  }>>;
  fetchTransactions(accessToken: string, opts: { since?: string; cursor?: string }): Promise<{
    transactions: Array<{
      externalId: string;
      accountExternalId: string;
      date: string;
      description: string;
      amount: number;
      currency: string;
      pending: boolean;
    }>;
    nextCursor?: string;
  }>;
  verifyWebhook(sigHeader: string | string[] | undefined, rawBody: Buffer): boolean;
}

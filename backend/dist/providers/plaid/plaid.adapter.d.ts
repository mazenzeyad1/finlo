/// <reference types="node" />
/// <reference types="node" />
import { BankDataProvider } from '../ports/bank-data.provider';
export declare class PlaidAdapter implements BankDataProvider {
    getLinkToken(userId: string): Promise<{
        linkToken: string;
    }>;
    exchangePublicToken(publicToken: string): Promise<{
        accessToken: string;
        institution: {
            id: string;
            name: string;
        };
    }>;
    fetchAccounts(accessToken: string): Promise<{
        externalId: string;
        name: string;
        type: string;
        currency: string;
        balance: number;
    }[]>;
    fetchTransactions(accessToken: string, opts: {
        since?: string;
        cursor?: string;
    }): Promise<{
        transactions: {
            externalId: string;
            accountExternalId: string;
            date: string;
            description: string;
            amount: number;
            currency: string;
            pending: boolean;
        }[];
        nextCursor: string;
    }>;
    verifyWebhook(sigHeader: any, rawBody: Buffer): boolean;
}

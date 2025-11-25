/// <reference types="node" />
/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
import { BankDataProvider } from '../ports/bank-data.provider';
export declare class FlinksAdapter implements BankDataProvider {
    private config;
    private readonly logger;
    private readonly baseUrl;
    private readonly isSandbox;
    private readonly connectUrl;
    private readonly customerId;
    private readonly bearerToken;
    private readonly authKey;
    private readonly apiKey;
    private authorizeTokenCache?;
    constructor(config: ConfigService);
    getLinkToken(_userId: string): Promise<{
        linkToken: string;
        sandboxInfo: {
            institution: string;
            username: string;
            password: string;
        };
    }>;
    exchangeLoginId(loginId: string): Promise<{
        accessToken: string;
        institution: {
            id: string;
            name: string;
        };
    }>;
    fetchAccounts(loginId: string): Promise<{
        externalId: string;
        name: string;
        mask: string;
        type: string;
        currency: string;
        balance: number;
    }[]>;
    fetchTransactions(loginId: string, opts: {
        since?: string;
        cursor?: string;
    }): Promise<{
        transactions: any[];
        nextCursor: any;
    }>;
    verifyWebhook(_sigHeader: any, _rawBody: Buffer): boolean;
    private mapAccountType;
    private generateAuthorizeToken;
}

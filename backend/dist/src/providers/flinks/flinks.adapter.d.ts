/// <reference types="node" />
/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
import { BankDataProvider } from '../ports/bank-data.provider';
export declare class FlinksAdapter implements BankDataProvider {
    private config;
    private readonly logger;
    private readonly customerId;
    private readonly authKey;
    private readonly apiKey;
    private readonly connectUrl;
    private authorizeTokenCache?;
    constructor(config: ConfigService);
    getLinkToken(): Promise<{
        linkToken: string;
    }>;
    private generateAuthorizeToken;
    exchangeLoginId(loginId: string): Promise<{
        accessToken: string;
        institution: {
            id: string;
            name: any;
        };
    }>;
    fetchAccounts(loginId: string): Promise<any>;
    fetchTransactions(loginId: string): Promise<{
        transactions: any[];
    }>;
    verifyWebhook(_sig: any, _body: Buffer): boolean;
}

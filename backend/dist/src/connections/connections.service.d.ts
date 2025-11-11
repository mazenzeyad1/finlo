import { PrismaService } from '../common/prisma.service';
import { ProviderRegistry } from '../providers/registry';
export declare class ConnectionsService {
    private prisma;
    private providers;
    constructor(prisma: PrismaService, providers: ProviderRegistry);
    startLink(userId: string, provider: 'plaid' | 'flinks'): Promise<{
        linkToken: string;
    }>;
    exchangePublicToken(userId: string, provider: 'plaid' | 'flinks', publicToken: string): Promise<{
        connectionId: string;
    }>;
}

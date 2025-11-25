import { PrismaService } from '../common/prisma.service';
import { FlinksAdapter } from '../providers/flinks/flinks.adapter';
export declare class ConnectionsService {
    private prisma;
    private flinks;
    constructor(prisma: PrismaService, flinks: FlinksAdapter);
    startLink(userId: string): Promise<{
        linkToken: string;
        sandboxInfo: {
            institution: string;
            username: string;
            password: string;
        };
    }>;
    exchangeLoginId(userId: string, loginId: string): Promise<{
        connectionId: string;
    }>;
    syncConnection(connectionId: string): Promise<{
        synced: boolean;
        accountsCount: number;
        transactionsCount: number;
    }>;
}

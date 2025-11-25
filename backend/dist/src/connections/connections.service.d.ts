import { PrismaService } from '../common/prisma.service';
import { FlinksAdapter } from '../providers/flinks/flinks.adapter';
export declare class ConnectionsService {
    private prisma;
    private flinks;
    constructor(prisma: PrismaService, flinks: FlinksAdapter);
    startLink(): Promise<{
        linkToken: string;
    }>;
    exchangeLoginId(userId: string, loginId: string): Promise<{
        connectionId: string;
    }>;
    syncConnection(connectionId: string): Promise<{
        synced: boolean;
        accountsCount: any;
        transactionsCount: number;
    }>;
}

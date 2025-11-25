import { ConnectionsService } from './connections.service';
export declare class ConnectionsController {
    private readonly svc;
    constructor(svc: ConnectionsService);
    start(): Promise<{
        linkToken: string;
    }>;
    exchange(body: {
        userId: string;
        loginId: string;
    }): Promise<{
        connectionId: string;
    }>;
    list(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        userId: string;
        institutionId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        accessToken: string;
        refreshToken: string;
        scope: string;
        linkedAt: Date;
        cursor: string;
    }[]>;
    sync(connectionId: string, userId: string): Promise<{
        synced: boolean;
        accountsCount: any;
        transactionsCount: number;
    }>;
}

import { ConnectionsService } from './connections.service';
export declare class ConnectionsController {
    private readonly svc;
    constructor(svc: ConnectionsService);
    start(body: {
        userId: string;
    }): Promise<{
        linkToken: string;
        sandboxInfo: {
            institution: string;
            username: string;
            password: string;
        };
    }>;
    exchange(body: {
        userId: string;
        loginId: string;
    }): Promise<{
        connectionId: string;
    }>;
    list(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
        refreshToken: string;
        id: string;
        userId: string;
        institutionId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        accessToken: string;
        scope: string;
        linkedAt: Date;
        cursor: string;
    }[]>;
    sync(connectionId: string, userId: string): Promise<{
        synced: boolean;
        accountsCount: number;
        transactionsCount: number;
    }>;
}

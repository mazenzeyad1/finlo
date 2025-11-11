import { ConnectionsService } from './connections.service';
export declare class ConnectionsController {
    private readonly svc;
    constructor(svc: ConnectionsService);
    start(body: {
        userId: string;
        provider: 'plaid' | 'flinks';
    }): Promise<{
        linkToken: string;
    }>;
    exchange(body: {
        userId: string;
        provider: 'plaid' | 'flinks';
        publicToken: string;
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
}

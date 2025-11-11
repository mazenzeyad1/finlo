import { AccountsService } from './accounts.service';
export declare class AccountsController {
    private readonly svc;
    constructor(svc: AccountsService);
    list(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        connection: {
            scope: string;
            id: string;
            userId: string;
            institutionId: string;
            status: import(".prisma/client").$Enums.ConnectionStatus;
            accessToken: string;
            refreshToken: string;
            linkedAt: Date;
            cursor: string;
        };
    } & {
        type: import(".prisma/client").$Enums.AccountType;
        name: string;
        id: string;
        connectionId: string;
        mask: string;
        currency: string;
        balance: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}

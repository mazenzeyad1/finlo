import { AccountsService } from './accounts.service';
export declare class AccountsController {
    private readonly svc;
    constructor(svc: AccountsService);
    list(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        connection: {
            status: import(".prisma/client").$Enums.ConnectionStatus;
            id: string;
            userId: string;
            institutionId: string;
            accessToken: string;
            refreshToken: string;
            scope: string;
            linkedAt: Date;
            cursor: string;
        };
    } & {
        name: string;
        type: import(".prisma/client").$Enums.AccountType;
        id: string;
        connectionId: string;
        mask: string;
        currency: string;
        balance: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}

import { PrismaService } from '../common/prisma.service';
export declare class BudgetsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        categories: {
            id: string;
            categoryId: string;
            budgetId: string;
        }[];
    } & {
        name: string;
        id: string;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.BudgetPeriod;
        start: Date;
        end: Date;
    })[]>;
}

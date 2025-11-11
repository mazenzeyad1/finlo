import { BudgetsService } from './budgets.service';
export declare class BudgetsController {
    private readonly svc;
    constructor(svc: BudgetsService);
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

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
        end: Date;
        start: Date;
        id: string;
        userId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.BudgetPeriod;
    })[]>;
}

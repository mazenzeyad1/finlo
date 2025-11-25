import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
export declare class TransactionsController {
    private readonly svc;
    constructor(svc: TransactionsService);
    search(userId: string, q: QueryTransactionsDto): Promise<{
        items: {
            date: Date;
            description: string;
            pending: boolean;
            id: string;
            currency: string;
            accountId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            categoryId: string;
            externalId: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}

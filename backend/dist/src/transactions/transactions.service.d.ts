import { PrismaService } from '../common/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    search(userId: string, q: QueryTransactionsDto): Promise<{
        items: {
            id: string;
            currency: string;
            accountId: string;
            date: Date;
            description: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            pending: boolean;
            categoryId: string;
            externalId: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}

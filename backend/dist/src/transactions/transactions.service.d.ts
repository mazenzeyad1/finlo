import { PrismaService } from '../common/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
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

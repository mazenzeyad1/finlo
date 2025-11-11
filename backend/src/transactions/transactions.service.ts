import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, q: QueryTransactionsDto) {
    const where: any = { account: { connection: { userId } } };
    if (q.accountId) where.accountId = q.accountId;
    if (q.from || q.to) where.date = {
      gte: q.from ? new Date(q.from) : undefined,
      lte: q.to   ? new Date(q.to)   : undefined
    };
    if (q.q) where.OR = [
      { description: { contains: q.q, mode: 'insensitive' } }
    ];
    const skip = (q.page - 1) * q.pageSize;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, skip, take: q.pageSize, orderBy: { date: 'desc' } }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
}

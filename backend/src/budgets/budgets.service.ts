import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.budget.findMany({ where: { userId }, include: { categories: true } });
  }
}

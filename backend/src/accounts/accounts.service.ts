import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.account.findMany({
      where: { connection: { userId } },
      include: { connection: true }
    });
  }
}

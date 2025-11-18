import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FlinksAdapter } from '../providers/flinks/flinks.adapter';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService, private flinks: FlinksAdapter) {}

  async startLink(userId: string) {
    return this.flinks.getLinkToken(userId);
  }

  async exchangePublicToken(userId: string, publicToken: string) {
    const res = await this.flinks.exchangePublicToken(publicToken);
    await this.prisma.institution.upsert({
      where: { id: res.institution.id },
      create: { id: res.institution.id, name: res.institution.name, provider: 'flinks' },
      update: { name: res.institution.name, provider: 'flinks' },
    });
    const connection = await this.prisma.connection.create({
      data: {
        userId,
        institutionId: res.institution.id,
        accessToken: res.accessToken,
        status: 'active',
      },
    });
    return { connectionId: connection.id };
  }
}

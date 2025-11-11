import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProviderRegistry } from '../providers/registry';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService, private providers: ProviderRegistry) {}

  async startLink(userId: string, provider: 'plaid' | 'flinks') {
    return this.providers.byProvider(provider).getLinkToken(userId);
  }

  async exchangePublicToken(userId: string, provider: 'plaid' | 'flinks', publicToken: string) {
    const res = await this.providers.byProvider(provider).exchangePublicToken(publicToken);
    // Upsert institution and connection
    await this.prisma.institution.upsert({
      where: { id: res.institution.id },
      create: { id: res.institution.id, name: res.institution.name, provider: provider },
      update: { name: res.institution.name, provider: provider },
    });
    const connection = await this.prisma.connection.create({
      data: {
        userId,
        institutionId: res.institution.id,
        accessToken: res.accessToken,
        status: 'active'
      }
    });
    return { connectionId: connection.id };
  }
}

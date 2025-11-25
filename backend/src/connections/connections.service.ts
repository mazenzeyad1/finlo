// backend/src/connections/connections.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AccountType } from '@prisma/client';
import { FlinksAdapter } from '../providers/flinks/flinks.adapter';

@Injectable()
export class ConnectionsService {
  constructor(
    private prisma: PrismaService,
    private flinks: FlinksAdapter,
  ) {}

  /**
   * Start the Flinks link flow.
   * Returns an iframe URL (with demo=true and authorizeToken) that the frontend
   * embeds in the FlinksConnectButton component.
   */
  async startLink(): Promise<{ linkToken: string }> {
    // No userId is needed to generate the authorize token / iframe URL
    return this.flinks.getLinkToken();
  }

  /**
   * Exchange Flinks LoginId for connection record.
   * The LoginId comes from the Flinks Connect iframe after user completes auth.
   */
  async exchangeLoginId(userId: string, loginId: string) {
    const res = await this.flinks.exchangeLoginId(loginId);

    // Upsert institution
    await this.prisma.institution.upsert({
      where: { id: res.institution.id },
      create: {
        id: res.institution.id,
        name: res.institution.name,
        provider: 'flinks',
      },
      update: {
        name: res.institution.name,
        provider: 'flinks',
      },
    });

    // Create connection using LoginId as accessToken
    const connection = await this.prisma.connection.create({
      data: {
        userId,
        institutionId: res.institution.id,
        accessToken: loginId,
        status: 'active',
        cursor: null,
      },
    });

    // Automatically sync accounts and transactions after connection
    await this.syncConnection(connection.id);

    return { connectionId: connection.id };
  }

  /**
   * Sync accounts + transactions for a given connection.
   */
  async syncConnection(connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: { institution: true },
    });

    if (!connection || connection.status !== 'active') {
      throw new Error('Connection not found or inactive');
    }

    const loginId = connection.accessToken;

    // Fetch accounts from Flinks
    const accounts = await this.flinks.fetchAccounts(loginId);

    // Map externalId to accountId for transaction lookups
    const accountIdMap = new Map<string, string>();

    // Helper to coerce incoming string to Prisma enum
    const toAccountType = (t: string): AccountType => {
      const valid: AccountType[] = [
        'checking',
        'savings',
        'credit',
        'loan',
        'investment',
      ];
      const lower = (t || '').toLowerCase();
      return (valid as string[]).includes(lower)
        ? (lower as AccountType)
        : 'checking';
    };

    // Upsert accounts in database
    for (const acc of accounts) {
      const account = await this.prisma.account.upsert({
        where: { id: acc.externalId },
        create: {
          id: acc.externalId,
          connectionId: connection.id,
          name: acc.name,
          mask: acc.mask,
          type: toAccountType(acc.type as any),
          currency: acc.currency,
          balance: acc.balance,
        },
        update: {
          name: acc.name,
          mask: acc.mask,
          balance: acc.balance,
        },
      });
      accountIdMap.set(acc.externalId, account.id);
    }

    // Fetch transactions (no cursor/pagination for now)
    const result = await this.flinks.fetchTransactions(loginId);
    const transactions = result.transactions;

    for (const txn of transactions) {
      const accountId = accountIdMap.get(txn.accountExternalId);
      if (!accountId) continue; // Skip if account not found

      await this.prisma.transaction.upsert({
        where: { externalId: txn.externalId },
        create: {
          accountId,
          date: new Date(txn.date),
          description: txn.description,
          amount: txn.amount,
          currency: txn.currency,
          pending: txn.pending,
          externalId: txn.externalId,
        },
        update: {
          description: txn.description,
          amount: txn.amount,
          pending: txn.pending,
        },
      });
    }

    // We’re not using pagination/cursor yet, so just keep cursor as null
    await this.prisma.connection.update({
      where: { id: connectionId },
      data: { cursor: null },
    });

    return {
      synced: true,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
    };
  }
}

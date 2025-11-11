import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'demo-user';
  const connectionId = 'demo-connection';
  const accountId = 'demo-checking';

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: 'demo@multibank.local',
      name: 'Demo User',
      password: 'demo-password',
      emailVerifiedAt: new Date()
    }
  });

  await prisma.institution.upsert({
    where: { id: 'td-bank' },
    update: {},
    create: {
      id: 'td-bank',
      name: 'TD Bank',
      provider: 'plaid'
    }
  });

  await prisma.connection.upsert({
    where: { id: connectionId },
    update: {},
    create: {
      id: connectionId,
      userId,
      institutionId: 'td-bank',
      status: 'active',
      accessToken: 'demo-token',
      linkedAt: new Date('2024-04-15')
    }
  });

  await prisma.account.upsert({
    where: { id: accountId },
    update: {},
    create: {
      id: accountId,
      connectionId,
      name: 'TD Checking',
      type: 'checking',
      currency: 'CAD',
      balance: new Prisma.Decimal(8250.75),
      mask: '1234'
    }
  });

  const transactions = [
    {
      id: 'tx-stansagire',
      description: 'Stansagire',
      amount: new Prisma.Decimal(-900),
      date: new Date('2024-04-24'),
      pending: false
    },
    {
      id: 'tx-payroll',
      description: 'Payroll',
      amount: new Prisma.Decimal(7000),
      date: new Date('2024-04-20'),
      pending: false
    },
    {
      id: 'tx-rent',
      description: 'Rent',
      amount: new Prisma.Decimal(-1200),
      date: new Date('2024-04-20'),
      pending: false
    },
    {
      id: 'tx-electric',
      description: 'Electric',
      amount: new Prisma.Decimal(-800),
      date: new Date('2024-04-19'),
      pending: false
    },
    {
      id: 'tx-rbc',
      description: 'RBC Transfer',
      amount: new Prisma.Decimal(100),
      date: new Date('2024-04-18'),
      pending: true
    }
  ];

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: tx,
      create: {
        ...tx,
        accountId,
        currency: 'CAD'
      }
    });
  }
}

main()
  .catch(err => {
    console.error('Seeding failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaService],
  exports: [PrismaService],
})
class PrismaCliModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(PrismaCliModule, {
    logger: false,
  });
  const prisma = app.get(PrismaService);
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  const tokens = await prisma.emailToken.findMany({
    select: {
      id: true,
      userId: true,
      purpose: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ users, tokens }, null, 2));
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

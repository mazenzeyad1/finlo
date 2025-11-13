import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MailerService } from '../common/mailer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [MailerService],
  exports: [MailerService],
})
class MailerCliModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MailerCliModule, {
    logger: ['log', 'error', 'warn'],
  });
  const mailer = app.get(MailerService);

  const recipient = process.env.MAIL_TEST_RECIPIENT ?? process.argv[2];
  if (!recipient) {
    throw new Error('Set MAIL_TEST_RECIPIENT or provide an address as the first argument.');
  }

  const subject = 'Finance dashboard mailer test';
  const text = 'This is a verification email sent by the Multibank backend. Credentials are working.';
  const html = `<p>${text}</p>`;

  await mailer.sendBasic(recipient, subject, html, text);
  await app.close();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

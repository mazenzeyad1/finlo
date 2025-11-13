import { Injectable } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

type Provider = 'ses' | 'dev';

@Injectable()
export class MailerService {
  private provider: Provider = (process.env.EMAIL_PROVIDER as Provider) || 'dev';
  private from = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;
  private ses?: SESv2Client;

  constructor() {
    if (this.provider === 'ses') {
      this.ses = new SESv2Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: process.env.AWS_ACCESS_KEY_ID
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            }
          : undefined,
      });
    }
  }

  async sendBasic(to: string, subject: string, html: string, text?: string) {
    if (this.provider === 'ses' && this.ses) {
      const cmd = new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: {
              Html: { Data: html },
              Text: text ? { Data: text } : undefined,
            },
          },
        },
      });
      const res = await this.ses.send(cmd);
      return { messageId: res.MessageId || '' };
    }

    // Dev fallback
    // eslint-disable-next-line no-console
    console.log(`[DEV EMAIL] → ${to}\nSubj: ${subject}\n${text ?? html}`);
    return { messageId: 'dev' };
  }
}

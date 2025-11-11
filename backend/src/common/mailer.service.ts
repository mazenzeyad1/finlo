import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createTransport,
  createTestAccount,
  getTestMessageUrl,
  TestAccount,
  Transporter,
} from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private readonly defaultFrom: string;
  private readonly fromName?: string;
  private readonly isProduction: boolean;
  private transportConfigured: boolean;
  private transporter?: Transporter;
  private transportLabel?: string;
  private readonly transportConfig?:
    | { kind: 'url'; value: string }
    | { kind: 'smtp'; host: string; port: number; secure: boolean; auth?: { user: string; pass: string } }
    | { kind: 'ethereal' };
  private testAccount?: TestAccount;

  constructor(private readonly config: ConfigService) {
    this.defaultFrom = this.config.get<string>('MAIL_FROM', 'no-reply@multibank.local');
    this.fromName = this.config.get<string>('MAIL_FROM_NAME') ?? undefined;
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';

    const useEthereal = this.parseBoolean(this.config.get<string>('MAIL_USE_ETHEREAL'));
    const url = this.config.get<string>('MAIL_URL');
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.parseNumber(this.config.get<string>('MAIL_PORT')) ?? 587;
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    const secure = this.parseBoolean(this.config.get<string>('MAIL_SECURE'));

    if (url) {
      this.transportConfig = { kind: 'url', value: url };
      this.transportLabel = url;
    } else if (host) {
      this.transportConfig = {
        kind: 'smtp',
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      };
      this.transportLabel = `${host}:${port}`;
    } else if (useEthereal) {
      this.transportConfig = { kind: 'ethereal' };
      this.transportLabel = 'ethereal account';
    }

    this.transportConfigured = Boolean(this.transportConfig);

    if (!this.transportConfig) {
      this.logger.warn('Mail transport not configured; emails will be logged locally.');
    } else if (this.isProduction && this.transportConfig.kind === 'ethereal') {
      this.logger.warn('MAIL_USE_ETHEREAL is enabled in production; emails will not reach real inboxes.');
    }
  }

  async onModuleInit() {
    if (!this.transportConfig) {
      return;
    }

    try {
      const transporter = await this.ensureTransport();

      if (!transporter) {
        this.logger.error('Failed to initialize mail transport from configuration.');
        return;
      }

      await transporter.verify();
      this.logger.log(`Mail transport verified (${this.transportLabel ?? 'custom transporter'})`);

      if (this.transportConfig.kind === 'ethereal' && this.testAccount) {
        this.logger.log(`Ethereal inbox ready at ${this.testAccount.user}`);
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Mail transport verification failed (${this.transportLabel ?? 'unknown'})`, stack);
      this.transporter = undefined;
    }
  }

  async send(message: MailMessage): Promise<void> {
    const payload = {
      ...message,
      from: this.resolveFromAddress(message.from),
    };

    let transporter: Transporter | undefined;

    try {
      transporter = await this.ensureTransport();
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to initialize mail transport for send', stack);
      transporter = undefined;
    }

    if (transporter) {
      try {
        const info: SentMessageInfo = await transporter.sendMail(payload);
        this.logger.log(`Email delivered to ${payload.to} (${payload.subject})`);

        if (this.transportConfig?.kind === 'ethereal') {
          const previewUrl = getTestMessageUrl(info);
          if (previewUrl) {
            this.logger.log(`Preview email in Ethereal: ${previewUrl}`);
          }
        }

        return;
      } catch (error) {
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Failed to send email to ${payload.to}`, stack);
        throw error;
      }
    }

    if (!this.isProduction) {
      this.logger.log(`Simulated email delivery to ${payload.to} (${payload.subject})`);
      return;
    }

    if (this.transportConfigured) {
      this.logger.error(`Email to ${payload.to} not sent despite configured transport.`);
    } else {
      this.logger.warn('Mail delivery transport not configured. Email dropped.');
    }
  }

  private async ensureTransport(): Promise<Transporter | undefined> {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.transportConfig) {
      return undefined;
    }

    switch (this.transportConfig.kind) {
      case 'ethereal': {
        this.testAccount = await createTestAccount();
        this.transporter = createTransport({
          host: this.testAccount.smtp.host,
          port: this.testAccount.smtp.port,
          secure: this.testAccount.smtp.secure,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });
        this.transportLabel = `ethereal:${this.testAccount.user}`;
        break;
      }
      case 'url': {
        this.transporter = createTransport(this.transportConfig.value);
        this.transportLabel ??= this.transportConfig.value;
        break;
      }
      case 'smtp': {
        const { host, port, secure, auth } = this.transportConfig;
        const transportOptions = {
          host,
          port,
          secure,
          ...(auth ? { auth } : {}),
        };
        this.transporter = createTransport(transportOptions);
        this.transportLabel ??= `${host}:${port}`;
        break;
      }
    }

    return this.transporter;
  }

  private resolveFromAddress(overrides?: string) {
    if (overrides) {
      return overrides;
    }
    if (this.fromName) {
      return `${this.fromName} <${this.defaultFrom}>`;
    }
    return this.defaultFrom;
  }

  private parseBoolean(value?: string | null): boolean {
    if (!value) {
      return false;
    }
    return ['true', '1', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
  }

  private parseNumber(value?: string | null): number | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

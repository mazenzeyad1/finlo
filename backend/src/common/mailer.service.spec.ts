import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
  createTestAccount: jest.fn(),
  getTestMessageUrl: jest.fn(),
}));

const { createTransport, createTestAccount, getTestMessageUrl } = jest.requireMock('nodemailer') as {
  createTransport: jest.MockedFunction<typeof import('nodemailer')['createTransport']>;
  createTestAccount: jest.MockedFunction<typeof import('nodemailer')['createTestAccount']>;
  getTestMessageUrl: jest.MockedFunction<typeof import('nodemailer')['getTestMessageUrl']>;
};

describe('MailerService', () => {
  const createConfig = (values: Record<string, string | undefined>) => {
    return {
      get: jest.fn((key: string, defaultValue?: string) => (key in values ? values[key] : defaultValue)),
    } as unknown as ConfigService;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createTestAccount.mockResolvedValue({
      user: 'ethereal.user',
      pass: 'ethereal.pass',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
    });
    getTestMessageUrl.mockReturnValue('https://ethereal.email/message/test');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('verifies transport and sends real emails when configured', async () => {
    const verify = jest.fn(async () => true);
    const sendMail = jest.fn(async () => ({}));
    createTransport.mockReturnValue({ verify, sendMail });

    const config = createConfig({
      MAIL_FROM: 'support@example.com',
      MAIL_FROM_NAME: 'Finance Desk',
      NODE_ENV: 'production',
      MAIL_URL: 'smtp://user:secret@smtp.example.com:2525',
    });

    const service = new MailerService(config);
    await service.onModuleInit();
    await service.send({ to: 'user@example.com', subject: 'Test', text: 'Hello world' });

    expect(createTransport).toHaveBeenCalledWith('smtp://user:secret@smtp.example.com:2525');
    expect(verify).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'Finance Desk <support@example.com>',
        subject: 'Test',
      })
    );
  });

  it('logs simulated delivery when transport is missing', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const config = createConfig({
      NODE_ENV: 'development',
      MAIL_HOST: undefined,
    });

    const service = new MailerService(config);
    await service.onModuleInit();
    await service.send({ to: 'user@example.com', subject: 'Test', text: 'Missing transport' });

    expect(createTransport).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Simulated email delivery to user@example.com'));
    expect(warnSpy).toHaveBeenCalledWith('Mail transport not configured; emails will be logged locally.');
  });

  it('creates ethereal transport when enabled', async () => {
    const verify = jest.fn(async () => true);
    const sendMail = jest.fn(async () => ({ messageId: 'abc123' }));
    createTransport.mockReturnValue({ verify, sendMail });

    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    const config = createConfig({
      NODE_ENV: 'development',
      MAIL_USE_ETHEREAL: 'true',
    });

    const service = new MailerService(config);
    await service.onModuleInit();
    await service.send({ to: 'ethereal@example.com', subject: 'Ethereal', text: 'Hello Ethereal' });

    expect(createTestAccount).toHaveBeenCalled();
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: 'ethereal.user', pass: 'ethereal.pass' },
    });
    expect(getTestMessageUrl).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Preview email in Ethereal'));
  });
});

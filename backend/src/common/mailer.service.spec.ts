import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MailerService } from './mailer.service';

jest.mock('@aws-sdk/client-sesv2', () => {
  const sendMock = jest.fn(async () => ({ MessageId: 'msg-123' }));
  return {
    SESv2Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
    SendEmailCommand: jest.fn().mockImplementation((input) => input),
  };
});

const { SESv2Client } = jest.requireMock('@aws-sdk/client-sesv2') as unknown as {
  SESv2Client: jest.Mock;
};

describe('MailerService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MAIL_FROM_NAME = 'Test App';
    process.env.MAIL_FROM_ADDRESS = 'from@example.com';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('sends via SES when provider is ses', async () => {
    process.env.EMAIL_PROVIDER = 'ses';
    process.env.AWS_REGION = 'us-east-1';
    const service = new MailerService();

    const result = await service.sendBasic('to@example.com', 'Subject', '<p>Hello</p>', 'Hello');

    expect(SESv2Client).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'us-east-1' })
    );
  const clientInstance = SESv2Client.mock.results[0].value as { send: jest.Mock };
    expect(clientInstance.send).toHaveBeenCalled();
    expect(result).toEqual({ messageId: 'msg-123' });
  });

  it('logs to console when provider is dev', async () => {
    process.env.EMAIL_PROVIDER = 'dev';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new MailerService();

    const result = await service.sendBasic('dev@example.com', 'Hi', '<p>Hi</p>', 'Hi');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('dev@example.com'));
    expect(result).toEqual({ messageId: 'dev' });
  });
});

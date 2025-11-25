"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mailer_service_1 = require("./mailer.service");
globals_1.jest.mock('@aws-sdk/client-sesv2', () => {
    const sendMock = globals_1.jest.fn(async () => ({ MessageId: 'msg-123' }));
    return {
        SESv2Client: globals_1.jest.fn().mockImplementation(() => ({ send: sendMock })),
        SendEmailCommand: globals_1.jest.fn().mockImplementation((input) => input),
    };
});
const { SESv2Client } = globals_1.jest.requireMock('@aws-sdk/client-sesv2');
(0, globals_1.describe)('MailerService', () => {
    const originalEnv = process.env;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        process.env = { ...originalEnv };
        process.env.MAIL_FROM_NAME = 'Test App';
        process.env.MAIL_FROM_ADDRESS = 'from@example.com';
    });
    (0, globals_1.afterEach)(() => {
        process.env = originalEnv;
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.it)('sends via SES when provider is ses', async () => {
        process.env.EMAIL_PROVIDER = 'ses';
        process.env.AWS_REGION = 'us-east-1';
        const service = new mailer_service_1.MailerService();
        const result = await service.sendBasic('to@example.com', 'Subject', '<p>Hello</p>', 'Hello');
        (0, globals_1.expect)(SESv2Client).toHaveBeenCalledWith(globals_1.expect.objectContaining({ region: 'us-east-1' }));
        const clientInstance = SESv2Client.mock.results[0].value;
        (0, globals_1.expect)(clientInstance.send).toHaveBeenCalled();
        (0, globals_1.expect)(result).toEqual({ messageId: 'msg-123' });
    });
    (0, globals_1.it)('logs to console when provider is dev', async () => {
        process.env.EMAIL_PROVIDER = 'dev';
        const logSpy = globals_1.jest.spyOn(console, 'log').mockImplementation(() => undefined);
        const service = new mailer_service_1.MailerService();
        const result = await service.sendBasic('dev@example.com', 'Hi', '<p>Hi</p>', 'Hi');
        (0, globals_1.expect)(logSpy).toHaveBeenCalledWith(globals_1.expect.stringContaining('dev@example.com'));
        (0, globals_1.expect)(result).toEqual({ messageId: 'dev' });
    });
});
//# sourceMappingURL=mailer.service.spec.js.map
export declare class MailerService {
    private readonly logger;
    private smtp;
    private from;
    constructor();
    sendBasic(to: string, subject: string, html: string, text?: string): Promise<{
        messageId: any;
    }>;
}

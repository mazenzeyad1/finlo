"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const mailer_service_1 = require("../common/mailer.service");
let MailerCliModule = class MailerCliModule {
};
MailerCliModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ isGlobal: true })],
        providers: [mailer_service_1.MailerService],
        exports: [mailer_service_1.MailerService],
    })
], MailerCliModule);
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(MailerCliModule, {
        logger: ['log', 'error', 'warn'],
    });
    const mailer = app.get(mailer_service_1.MailerService);
    const recipient = process.env.MAIL_TEST_RECIPIENT ?? process.argv[2];
    if (!recipient) {
        throw new Error('Set MAIL_TEST_RECIPIENT or provide an address as the first argument.');
    }
    const subject = 'Finance dashboard mailer test';
    const text = 'This is a verification email sent by the Finlo backend. Credentials are working.';
    const html = `<p>${text}</p>`;
    await mailer.sendBasic(recipient, subject, html, text);
    await app.close();
}
bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=send-test-email.js.map
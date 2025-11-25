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
const prisma_service_1 = require("../common/prisma.service");
let PrismaCliModule = class PrismaCliModule {
};
PrismaCliModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ isGlobal: true })],
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaCliModule);
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(PrismaCliModule, {
        logger: false,
    });
    const prisma = app.get(prisma_service_1.PrismaService);
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
    console.log(JSON.stringify({ users, tokens }, null, 2));
    await app.close();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=inspect-email-state.js.map
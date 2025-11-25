"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const flinks_adapter_1 = require("../providers/flinks/flinks.adapter");
let ConnectionsService = class ConnectionsService {
    constructor(prisma, flinks) {
        this.prisma = prisma;
        this.flinks = flinks;
    }
    async startLink(userId) {
        return this.flinks.getLinkToken(userId);
    }
    async exchangeLoginId(userId, loginId) {
        const res = await this.flinks.exchangeLoginId(loginId);
        await this.prisma.institution.upsert({
            where: { id: res.institution.id },
            create: { id: res.institution.id, name: res.institution.name, provider: 'flinks' },
            update: { name: res.institution.name, provider: 'flinks' },
        });
        const connection = await this.prisma.connection.create({
            data: {
                userId,
                institutionId: res.institution.id,
                accessToken: loginId,
                status: 'active',
            },
        });
        await this.syncConnection(connection.id);
        return { connectionId: connection.id };
    }
    async syncConnection(connectionId) {
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: { institution: true },
        });
        if (!connection || connection.status !== 'active') {
            throw new Error('Connection not found or inactive');
        }
        const loginId = connection.accessToken;
        const accounts = await this.flinks.fetchAccounts(loginId);
        const accountIdMap = new Map();
        const toAccountType = (t) => {
            const valid = ['checking', 'savings', 'credit', 'loan', 'investment'];
            return valid.includes((t || '').toLowerCase())
                ? t.toLowerCase()
                : 'checking';
        };
        for (const acc of accounts) {
            const account = await this.prisma.account.upsert({
                where: { id: acc.externalId },
                create: {
                    id: acc.externalId,
                    connectionId: connection.id,
                    name: acc.name,
                    mask: acc.mask,
                    type: toAccountType(acc.type),
                    currency: acc.currency,
                    balance: acc.balance,
                },
                update: {
                    name: acc.name,
                    mask: acc.mask,
                    balance: acc.balance,
                },
            });
            accountIdMap.set(acc.externalId, account.id);
        }
        const { transactions, nextCursor } = await this.flinks.fetchTransactions(loginId, {
            cursor: connection.cursor,
        });
        for (const txn of transactions) {
            const accountId = accountIdMap.get(txn.accountExternalId);
            if (!accountId)
                continue;
            await this.prisma.transaction.upsert({
                where: { externalId: txn.externalId },
                create: {
                    accountId,
                    date: new Date(txn.date),
                    description: txn.description,
                    amount: txn.amount,
                    currency: txn.currency,
                    pending: txn.pending,
                    externalId: txn.externalId,
                },
                update: {
                    description: txn.description,
                    amount: txn.amount,
                    pending: txn.pending,
                },
            });
        }
        await this.prisma.connection.update({
            where: { id: connectionId },
            data: { cursor: nextCursor },
        });
        return { synced: true, accountsCount: accounts.length, transactionsCount: transactions.length };
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, flinks_adapter_1.FlinksAdapter])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map
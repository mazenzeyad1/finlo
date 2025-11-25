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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(userId, q) {
        const where = { account: { connection: { userId } } };
        if (q.accountId)
            where.accountId = q.accountId;
        if (q.from || q.to)
            where.date = {
                gte: q.from ? new Date(q.from) : undefined,
                lte: q.to ? new Date(q.to) : undefined
            };
        if (q.q)
            where.OR = [
                { description: { contains: q.q, mode: 'insensitive' } }
            ];
        const skip = (q.page - 1) * q.pageSize;
        const [items, total] = await Promise.all([
            this.prisma.transaction.findMany({ where, skip, take: q.pageSize, orderBy: { date: 'desc' } }),
            this.prisma.transaction.count({ where }),
        ]);
        return { items, total, page: q.page, pageSize: q.pageSize };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map
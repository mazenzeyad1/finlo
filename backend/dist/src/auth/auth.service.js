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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../common/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, configService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.saltRounds = 12;
        this.accessTtl = configService.get('JWT_ACCESS_TTL', '15m');
        this.refreshTtlMs = Number(configService.get('JWT_REFRESH_TTL_MS', `${1000 * 60 * 60 * 24 * 30}`));
        this.emailTokenTtlMs = Number(configService.get('EMAIL_TOKEN_TTL_MS', `${1000 * 60 * 60 * 24}`));
        this.resetTokenTtlMs = Number(configService.get('RESET_TOKEN_TTL_MS', `${1000 * 60 * 60}`));
        this.isProduction = configService.get('NODE_ENV') === 'production';
    }
    async signUp(dto, meta) {
        const email = dto.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    name: dto.name,
                    password: passwordHash,
                },
            });
            await this.ensureHouseholdForUser(tx, user.id, dto.name);
            const session = await this.createSession(tx, user.id, meta);
            const tokens = await this.issueTokens(tx, user.id, session.id);
            const verification = await this.createEmailVerification(tx, user.id);
            return { user, session, tokens, verificationToken: verification };
        });
        return {
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                emailVerified: Boolean(result.user.emailVerifiedAt),
            },
            tokens: result.tokens,
            emailVerificationToken: this.isProduction ? undefined : result.verificationToken,
        };
    }
    async signIn(dto, meta) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.prisma.$transaction(async (tx) => {
            const session = await this.createSession(tx, user.id, meta);
            return this.issueTokens(tx, user.id, session.id);
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: Boolean(user.emailVerifiedAt),
            },
            tokens,
        };
    }
    async refresh(dto, meta) {
        const parsed = this.parseToken(dto.refreshToken);
        const token = await this.prisma.refreshToken.findUnique({
            where: { id: parsed.id },
            include: { session: true },
        });
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (token.revokedAt || token.session.revokedAt) {
            await this.revokeSession(token.sessionId);
            throw new common_1.UnauthorizedException('Refresh token revoked');
        }
        if (token.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        const matches = await bcrypt.compare(parsed.secret, token.tokenHash);
        if (!matches) {
            await this.revokeSession(token.sessionId);
            throw new common_1.UnauthorizedException('Refresh token reuse detected');
        }
        return this.prisma.$transaction(async (tx) => {
            const session = await tx.session.update({
                where: { id: token.sessionId },
                data: {
                    userAgent: meta.userAgent ?? token.session.userAgent,
                    ip: meta.ip ?? token.session.ip,
                },
            });
            return this.issueTokens(tx, token.session.userId, session.id, token.id);
        });
    }
    async verifyEmail(userId, dto) {
        const parsed = this.parseToken(dto.token);
        const record = await this.prisma.emailVerification.findUnique({
            where: { id: parsed.id },
        });
        if (!record || record.userId !== userId) {
            throw new common_1.ForbiddenException('Invalid verification token');
        }
        if (record.usedAt) {
            return { verified: Boolean(await this.ensureEmailVerified(record.userId)), reused: true };
        }
        if (record.expiresAt < new Date()) {
            throw new common_1.ForbiddenException('Verification token expired');
        }
        const matches = await bcrypt.compare(parsed.secret, record.tokenHash);
        if (!matches) {
            throw new common_1.ForbiddenException('Verification token invalid');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.emailVerification.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            });
            await tx.user.update({
                where: { id: record.userId },
                data: { emailVerifiedAt: new Date() },
            });
        });
        return { verified: true };
    }
    async resendVerification(userId) {
        const verification = await this.createEmailVerification(this.prisma, userId);
        return this.isProduction ? { sent: true } : { sent: true, token: verification };
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { sent: true };
        }
        const token = await this.createPasswordReset(this.prisma, user.id);
        return this.isProduction ? { sent: true } : { sent: true, token };
    }
    async resetPassword(dto) {
        const parsed = this.parseToken(dto.token);
        const record = await this.prisma.passwordReset.findUnique({ where: { id: parsed.id } });
        if (!record) {
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (record.usedAt) {
            throw new common_1.BadRequestException('Reset token already used');
        }
        if (record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Reset token expired');
        }
        const matches = await bcrypt.compare(parsed.secret, record.tokenHash);
        if (!matches) {
            throw new common_1.BadRequestException('Reset token invalid');
        }
        const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
        await this.prisma.$transaction(async (tx) => {
            await tx.passwordReset.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            });
            await tx.user.update({
                where: { id: record.userId },
                data: { password: passwordHash },
            });
            await this.revokeAllSessions(tx, record.userId);
        });
        return { reset: true };
    }
    async listSessions(userId, currentSessionId) {
        const sessions = await this.prisma.session.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return sessions
            .filter((session) => !session.revokedAt)
            .map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            ip: session.ip,
            createdAt: session.createdAt,
            lastSeen: session.lastSeen,
            current: session.id === currentSessionId,
        }));
    }
    async revokeSessionById(userId, sessionId) {
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== userId) {
            throw new common_1.NotFoundException('Session not found');
        }
        await this.revokeSession(sessionId);
        return { revoked: true };
    }
    async ensureHouseholdForUser(tx, userId, name) {
        await tx.household.create({
            data: {
                name: name ? `${name}'s Household` : 'Household',
                ownerId: userId,
                members: {
                    create: {
                        role: 'owner',
                        userId,
                    },
                },
            },
        });
    }
    async createSession(tx, userId, meta) {
        return tx.session.create({
            data: {
                userId,
                userAgent: meta.userAgent ?? null,
                ip: meta.ip ?? null,
            },
        });
    }
    async issueTokens(tx, userId, sessionId, previousTokenId) {
        const payload = { sub: userId, sid: sessionId };
        const accessToken = await this.jwt.signAsync(payload, { expiresIn: this.accessTtl });
        const refreshSecret = this.generateSecret();
        const tokenHash = await bcrypt.hash(refreshSecret, this.saltRounds);
        const expiresAt = new Date(Date.now() + this.refreshTtlMs);
        const newToken = await tx.refreshToken.create({
            data: {
                userId,
                sessionId,
                tokenHash,
                expiresAt,
            },
        });
        if (previousTokenId) {
            await tx.refreshToken.update({
                where: { id: previousTokenId },
                data: {
                    revokedAt: new Date(),
                    replacedById: newToken.id,
                },
            });
        }
        const refreshToken = this.composeToken(newToken.id, refreshSecret);
        return { accessToken, refreshToken, expiresIn: this.parseExpiresIn(this.accessTtl) };
    }
    async createEmailVerification(tx, userId) {
        const secret = this.generateSecret();
        const tokenHash = await bcrypt.hash(secret, this.saltRounds);
        const expiresAt = new Date(Date.now() + this.emailTokenTtlMs);
        const record = await tx.emailVerification.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
        return this.composeToken(record.id, secret);
    }
    async createPasswordReset(tx, userId) {
        const secret = this.generateSecret();
        const tokenHash = await bcrypt.hash(secret, this.saltRounds);
        const expiresAt = new Date(Date.now() + this.resetTokenTtlMs);
        const record = await tx.passwordReset.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
        return this.composeToken(record.id, secret);
    }
    parseToken(token) {
        const parts = token.split('.');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new common_1.BadRequestException('Malformed token');
        }
        return { id: parts[0], secret: parts[1] };
    }
    composeToken(id, secret) {
        return `${id}.${secret}`;
    }
    generateSecret() {
        return (0, crypto_1.randomUUID)().replace(/-/g, '');
    }
    parseExpiresIn(ttl) {
        if (/^\d+$/.test(ttl)) {
            return Number(ttl);
        }
        const match = ttl.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 900;
        }
        const value = Number(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                return 900;
        }
    }
    async revokeSession(sessionId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.session.update({
                where: { id: sessionId },
                data: { revokedAt: new Date() },
            });
            await tx.refreshToken.updateMany({
                where: { sessionId },
                data: { revokedAt: new Date() },
            });
        });
    }
    async revokeAllSessions(tx, userId) {
        await tx.session.updateMany({
            where: { userId },
            data: { revokedAt: new Date() },
        });
        await tx.refreshToken.updateMany({
            where: { userId },
            data: { revokedAt: new Date() },
        });
    }
    async ensureEmailVerified(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        return user?.emailVerifiedAt;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
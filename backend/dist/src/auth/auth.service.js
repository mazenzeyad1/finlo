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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../common/prisma.service");
const mailer_service_1 = require("../common/mailer.service");
const token_util_1 = require("./token.util");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, mailer, configService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mailer = mailer;
        this.saltRounds = 12;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.accessTtl = configService.get('JWT_ACCESS_TTL', '15m');
        this.refreshTtlMs = Number(configService.get('JWT_REFRESH_TTL_MS', `${1000 * 60 * 60 * 24 * 30}`));
        this.verificationTtlMs = Number(configService.get('EMAIL_TOKEN_TTL_MS', `${1000 * 60 * 60 * 24}`));
        this.resetTokenTtlMs = Number(configService.get('RESET_TOKEN_TTL_MS', `${1000 * 60 * 60}`));
        this.isProduction = configService.get('NODE_ENV') === 'production';
        this.appUrl =
            configService.get('APP_BASE_URL') ||
                configService.get('APP_URL', 'http://localhost:4200');
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
            return { user, session, tokens };
        });
        const verificationToken = await this.sendVerificationEmail({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.name,
        });
        this.logger.log(`User ${result.user.id} registered (${this.describeMeta(meta)})`);
        return {
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                emailVerified: result.user.emailVerified,
            },
            tokens: result.tokens,
            emailVerificationToken: this.isProduction ? undefined : verificationToken,
        };
    }
    async signIn(dto, meta) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.logFailedSignIn(email, meta, 'account not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            this.logFailedSignIn(email, meta, 'invalid password');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.prisma.$transaction(async (tx) => {
            const session = await this.createSession(tx, user.id, meta);
            return this.issueTokens(tx, user.id, session.id);
        });
        this.logger.log(`User ${user.id} signed in (${this.describeMeta(meta)})`);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
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
            this.logger.warn('Refresh token rejected: not found');
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (token.revokedAt || token.session.revokedAt) {
            this.logger.warn(`Refresh token rejected: session ${token.sessionId} revoked`);
            await this.revokeSession(token.sessionId);
            throw new common_1.UnauthorizedException('Refresh token revoked');
        }
        if (token.expiresAt < new Date()) {
            this.logger.warn(`Refresh token rejected: token ${token.id} expired`);
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        const matches = await bcrypt.compare(parsed.secret, token.tokenHash);
        if (!matches) {
            this.logger.warn(`Refresh token reuse detected for session ${token.sessionId}`);
            await this.revokeSession(token.sessionId);
            throw new common_1.UnauthorizedException('Refresh token reuse detected');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const session = await tx.session.update({
                where: { id: token.sessionId },
                data: {
                    userAgent: meta.userAgent ?? token.session.userAgent,
                    ip: meta.ip ?? token.session.ip,
                },
            });
            return this.issueTokens(tx, token.session.userId, session.id, token.id);
        });
        this.logger.log(`Issued new tokens for session ${token.sessionId} (${this.describeMeta(meta)})`);
        return result;
    }
    async verifyEmail(uid, token) {
        const hashed = (0, token_util_1.hashToken)(token);
        const record = await this.prisma.emailToken.findFirst({
            where: {
                userId: uid,
                purpose: client_1.EmailTokenPurpose.VERIFY_EMAIL,
                tokenHash: hashed,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!record) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: uid },
                data: { emailVerified: true },
            }),
            this.prisma.emailToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);
        this.logger.log(`User ${uid} verified email via token`);
        return { ok: true };
    }
    async verifyEmailByToken(token) {
        const hashed = (0, token_util_1.hashToken)(token);
        const record = await this.prisma.emailToken.findFirst({
            where: {
                purpose: client_1.EmailTokenPurpose.VERIFY_EMAIL,
                tokenHash: hashed,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!record) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { emailVerified: true },
            }),
            this.prisma.emailToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);
        this.logger.log(`User ${record.userId} verified email via token`);
        return { ok: true };
    }
    async resendVerification(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recent = await this.prisma.emailLog.findFirst({
            where: {
                userId,
                template: 'verify-email',
                createdAt: { gt: fiveMinutesAgo },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (recent) {
            throw new common_1.BadRequestException('Please wait before requesting another verification email');
        }
        const token = await this.sendVerificationEmail({
            id: user.id,
            email: user.email,
            firstName: user.name,
        });
        this.logger.log(`Resent verification email for user ${userId}`);
        return this.isProduction ? { ok: true } : { ok: true, token };
    }
    async forgotPassword(dto, meta) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            this.logger.warn(`Password reset requested for unknown email ${email} (${this.describeMeta(meta)})`);
            return { sent: true };
        }
        const token = await this.createEmailToken(user.id, client_1.EmailTokenPurpose.RESET_PASSWORD, this.resetTokenTtlMs);
        const resetUrl = this.buildAppUrl('/reset-password', { token });
        const name = user.name ?? user.email;
        const { subject, html, text } = this.buildPasswordResetEmail(name, resetUrl);
        await this.sendEmailAndLog({
            userId: user.id,
            template: 'reset-password',
            to: user.email,
            subject,
            html,
            text,
        });
        this.logger.log(`Password reset email issued for user ${user.id} (${this.describeMeta(meta)})`);
        return this.isProduction ? { sent: true } : { sent: true, token };
    }
    async resetPassword(dto, meta) {
        const hashed = (0, token_util_1.hashToken)(dto.token);
        const record = await this.prisma.emailToken.findFirst({
            where: {
                purpose: client_1.EmailTokenPurpose.RESET_PASSWORD,
                tokenHash: hashed,
                usedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!record) {
            throw new common_1.BadRequestException('Invalid reset token');
        }
        if (record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Reset token expired');
        }
        const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
        await this.prisma.$transaction(async (tx) => {
            await tx.emailToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            });
            await tx.user.update({
                where: { id: record.userId },
                data: { password: passwordHash },
            });
            await this.revokeAllSessions(tx, record.userId);
        });
        this.logger.log(`Password reset completed for user ${record.userId} (${this.describeMeta(meta)})`);
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
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
        };
    }
    describeMeta(meta) {
        const ip = meta?.ip ?? 'ip:unknown';
        const agent = meta?.userAgent ?? 'agent:unknown';
        return `${ip}; ${agent}`;
    }
    logFailedSignIn(email, meta, reason) {
        this.logger.warn(`Failed sign-in for ${email}: ${reason} (${this.describeMeta(meta)})`);
    }
    async sendVerificationEmail(user) {
        const token = await this.createEmailToken(user.id, client_1.EmailTokenPurpose.VERIFY_EMAIL, this.verificationTtlMs);
        const verifyUrl = this.buildAppUrl('/verify', { uid: user.id, token });
        this.logger.log(`Verification URL for ${user.email}: ${verifyUrl}`);
        const name = user.firstName ?? user.email;
        const { subject, html, text } = this.buildVerificationEmail(name, verifyUrl);
        this.logger.log(`Email HTML includes href: ${html.includes('href=')}, text includes link: ${text.includes('http')}`);
        await this.sendEmailAndLog({
            userId: user.id,
            template: 'verify-email',
            to: user.email,
            subject,
            html,
            text,
        });
        return token;
    }
    buildVerificationEmail(name, verifyUrl) {
        const subject = 'Verify your email';
        const text = [
            `Hi ${name},`,
            'Please verify your email address to finish setting up your account.',
            `Verification link: ${verifyUrl}`,
            "If you didn't create an account, you can safely ignore this message.",
        ].join('\n\n');
        const html = [
            `<p>Hi ${name},</p>`,
            '<p>Please verify your email address to finish setting up your account.</p>',
            `<p><a href="${verifyUrl}" style="color:#2563eb;text-decoration:underline;">Verify email</a></p>`,
            "<p>If you didn't create an account, you can safely ignore this message.</p>",
        ].join('');
        this.logger.debug(`Built verification email with URL: ${verifyUrl}`);
        return { subject, html, text };
    }
    buildPasswordResetEmail(name, resetUrl) {
        const subject = 'Reset your password';
        const text = [
            `Hi ${name},`,
            'You requested to reset your password.',
            `Reset link: ${resetUrl}`,
            "If you didn't request this, you can ignore this email.",
        ].join('\n\n');
        const html = [
            `<p>Hi ${name},</p>`,
            '<p>You requested to reset your password.</p>',
            `<p><a href="${resetUrl}" style="color:#2563eb;text-decoration:underline;">Reset password</a></p>`,
            "<p>If you didn't request this, you can safely ignore this message.</p>",
        ].join('');
        return { subject, html, text };
    }
    async sendEmailAndLog(options) {
        let status = 'sent';
        let providerId;
        let error;
        try {
            const result = await this.mailer.sendBasic(options.to, options.subject, options.html, options.text);
            providerId = result.messageId;
        }
        catch (err) {
            status = 'failed';
            error = err;
            if (err instanceof Error) {
                this.logger.error(`Failed to send ${options.template} email to ${options.to}: ${err.message}`);
            }
        }
        await this.prisma.emailLog.create({
            data: {
                userId: options.userId ?? null,
                template: options.template,
                toAddress: options.to,
                providerId,
                status,
            },
        });
        if (error) {
            throw error;
        }
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
    async createEmailToken(userId, purpose, ttlMs) {
        await this.prisma.emailToken.deleteMany({
            where: {
                userId,
                purpose,
                usedAt: null,
            },
        });
        const token = (0, token_util_1.generateToken)(32);
        await this.prisma.emailToken.create({
            data: {
                userId,
                purpose,
                tokenHash: (0, token_util_1.hashToken)(token),
                expiresAt: new Date(Date.now() + ttlMs),
            },
        });
        return token;
    }
    buildAppUrl(path, params) {
        const url = new URL(path, this.appUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        return url.toString();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mailer_service_1.MailerService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
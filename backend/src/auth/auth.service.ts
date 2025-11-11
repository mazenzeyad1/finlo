import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaClient, EmailVerification } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { MailerService, MailMessage } from '../common/mailer.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { ActiveSession } from './interfaces/active-session.interface';

interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

interface TokenComponents {
  id: string;
  secret: string;
}

@Injectable()
export class AuthService {
  private readonly accessTtl: string;
  private readonly refreshTtlMs: number;
  private readonly emailTokenTtlMs: number;
  private readonly resetTokenTtlMs: number;
  private readonly saltRounds = 12;
  private readonly isProduction: boolean;
  private readonly frontendUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    configService: ConfigService
  ) {
    this.accessTtl = configService.get<string>('JWT_ACCESS_TTL', '15m');
    this.refreshTtlMs = Number(configService.get<string>('JWT_REFRESH_TTL_MS', `${1000 * 60 * 60 * 24 * 30}`));
    this.emailTokenTtlMs = Number(configService.get<string>('EMAIL_TOKEN_TTL_MS', `${1000 * 60 * 60 * 24}`));
    this.resetTokenTtlMs = Number(configService.get<string>('RESET_TOKEN_TTL_MS', `${1000 * 60 * 60}`));
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  }

  async signUp(dto: SignUpDto, meta: SessionMeta) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
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

    await this.safeSendMail(
      this.buildVerificationMail(result.user.email, result.verificationToken),
      `verification email for user ${result.user.id}`
    );

    this.logger.log(`User ${result.user.id} registered (${this.describeMeta(meta)})`);

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

  async signIn(dto: SignInDto, meta: SessionMeta) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logFailedSignIn(email, meta, 'account not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      this.logFailedSignIn(email, meta, 'invalid password');
      throw new UnauthorizedException('Invalid credentials');
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
        emailVerified: Boolean(user.emailVerifiedAt),
      },
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto, meta: SessionMeta) {
    const parsed = this.parseToken(dto.refreshToken);
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: parsed.id },
      include: { session: true },
    });

    if (!token) {
      this.logger.warn('Refresh token rejected: not found');
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (token.revokedAt || token.session.revokedAt) {
      this.logger.warn(`Refresh token rejected: session ${token.sessionId} revoked`);
      await this.revokeSession(token.sessionId);
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (token.expiresAt < new Date()) {
      this.logger.warn(`Refresh token rejected: token ${token.id} expired`);
      throw new UnauthorizedException('Refresh token expired');
    }

    const matches = await bcrypt.compare(parsed.secret, token.tokenHash);
    if (!matches) {
      this.logger.warn(`Refresh token reuse detected for session ${token.sessionId}`);
      await this.revokeSession(token.sessionId);
      throw new UnauthorizedException('Refresh token reuse detected');
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

  async verifyEmail(userId: string, dto: VerifyEmailDto) {
    const { record, secret } = await this.getVerificationRecord(dto.token);
    if (record.userId !== userId) {
      throw new ForbiddenException('Invalid verification token');
    }

    const result = await this.consumeEmailVerification(record, secret);
    if (result.verified && !result.reused) {
      this.logger.log(`User ${record.userId} verified email via authenticated request`);
    }

    return result;
  }

  async verifyEmailFromLink(dto: VerifyEmailDto, meta?: SessionMeta) {
    const { record, secret } = await this.getVerificationRecord(dto.token);
    const result = await this.consumeEmailVerification(record, secret);

    if (result.verified && !result.reused) {
      this.logger.log(`User ${record.userId} verified email via link (${this.describeMeta(meta)})`);
    }

    return result;
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verification = await this.createEmailVerification(this.prisma, userId);

    await this.safeSendMail(
      this.buildVerificationMail(user.email, verification),
      `verification email for user ${userId}`
    );

    this.logger.log(`Resent verification email for user ${userId}`);

    return this.isProduction ? { sent: true } : { sent: true, token: verification };
  }

  async forgotPassword(dto: ForgotPasswordDto, meta?: SessionMeta) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Obfuscate response to avoid email enumeration
      this.logger.warn(`Password reset requested for unknown email ${email} (${this.describeMeta(meta)})`);
      return { sent: true };
    }

    const token = await this.createPasswordReset(this.prisma, user.id);

    await this.safeSendMail(
      this.buildPasswordResetMail(user.email, token),
      `password reset email for user ${user.id}`
    );

    this.logger.log(`Password reset email issued for user ${user.id} (${this.describeMeta(meta)})`);

    return this.isProduction ? { sent: true } : { sent: true, token };
  }

  async resetPassword(dto: ResetPasswordDto, meta?: SessionMeta) {
    const parsed = this.parseToken(dto.token);
    const record = await this.prisma.passwordReset.findUnique({ where: { id: parsed.id } });
    if (!record) {
      throw new BadRequestException('Invalid reset token');
    }

    if (record.usedAt) {
      throw new BadRequestException('Reset token already used');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    const matches = await bcrypt.compare(parsed.secret, record.tokenHash);
    if (!matches) {
      throw new BadRequestException('Reset token invalid');
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

    this.logger.log(`Password reset completed for user ${record.userId} (${this.describeMeta(meta)})`);

    return { reset: true };
  }

  async listSessions(userId: string, currentSessionId: string): Promise<ActiveSession[]> {
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

  async revokeSessionById(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.revokeSession(sessionId);
    return { revoked: true };
  }

  private async getVerificationRecord(token: string): Promise<{ record: EmailVerification; secret: string }> {
    const parsed = this.parseToken(token);
    const record = await this.prisma.emailVerification.findUnique({ where: { id: parsed.id } });
    if (!record) {
      throw new ForbiddenException('Invalid verification token');
    }

    return { record, secret: parsed.secret };
  }

  private async consumeEmailVerification(record: EmailVerification, secret: string) {
    if (record.usedAt) {
      return { verified: Boolean(await this.ensureEmailVerified(record.userId)), reused: true };
    }

    if (record.expiresAt < new Date()) {
      throw new ForbiddenException('Verification token expired');
    }

    const matches = await bcrypt.compare(secret, record.tokenHash);
    if (!matches) {
      throw new ForbiddenException('Verification token invalid');
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

    return { verified: true } as const;
  }

  private describeMeta(meta?: SessionMeta) {
    const ip = meta?.ip ?? 'ip:unknown';
    const agent = meta?.userAgent ?? 'agent:unknown';
    return `${ip}; ${agent}`;
  }

  private logFailedSignIn(email: string, meta: SessionMeta, reason: string) {
    this.logger.warn(`Failed sign-in for ${email}: ${reason} (${this.describeMeta(meta)})`);
  }

  private buildVerificationMail(email: string, token: string): MailMessage {
    const url = new URL('/verify-email', this.frontendUrl);
    url.searchParams.set('token', token);

    const subject = 'Verify your email address';
    const text = [
      'Thanks for signing up for the finance dashboard.',
      `Confirm your email by visiting: ${url.toString()}`,
      'If you did not create an account, you can ignore this message.',
    ].join('\n\n');

    const html = [
      '<p>Thanks for signing up for the finance dashboard.</p>',
      `<p><a href="${url.toString()}">Confirm your email address</a></p>`,
      '<p>If you did not create an account, you can ignore this message.</p>',
    ].join('');

    return {
      to: email,
      subject,
      text,
      html,
    };
  }

  private buildPasswordResetMail(email: string, token: string): MailMessage {
    const url = new URL('/reset-password', this.frontendUrl);
    url.searchParams.set('token', token);

    const subject = 'Reset your password';
    const text = [
      'A request was made to reset your password.',
      `Reset your password by visiting: ${url.toString()}`,
      'If you did not request this change, you can ignore this message.',
    ].join('\n\n');

    const html = [
      '<p>A request was made to reset your password.</p>',
      `<p><a href="${url.toString()}">Reset your password</a></p>`,
      '<p>If you did not request this change, you can ignore this message.</p>',
    ].join('');

    return {
      to: email,
      subject,
      text,
      html,
    };
  }

  private async safeSendMail(message: MailMessage, context: string) {
    try {
      await this.mailer.send(message);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to send ${context}`, stack);
    }
  }

  private async ensureHouseholdForUser(tx: Prisma.TransactionClient | PrismaClient, userId: string, name?: string | null) {
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

  private async createSession(tx: Prisma.TransactionClient | PrismaClient, userId: string, meta: SessionMeta) {
    return tx.session.create({
      data: {
        userId,
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      },
    });
  }

  private async issueTokens(
  tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
    sessionId: string,
    previousTokenId?: string
  ): Promise<AuthTokens> {
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

  private async createEmailVerification(tx: Prisma.TransactionClient | PrismaClient, userId: string) {
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

  private async createPasswordReset(tx: Prisma.TransactionClient | PrismaClient, userId: string) {
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

  private parseToken(token: string): TokenComponents {
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new BadRequestException('Malformed token');
    }
    return { id: parts[0], secret: parts[1] };
  }

  private composeToken(id: string, secret: string): string {
    return `${id}.${secret}`;
  }

  private generateSecret() {
    return randomUUID().replace(/-/g, '');
  }

  private parseExpiresIn(ttl: string): number {
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

  private async revokeSession(sessionId: string) {
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

  private async revokeAllSessions(tx: Prisma.TransactionClient, userId: string) {
    await tx.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    await tx.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  private async ensureEmailVerified(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.emailVerifiedAt;
  }
}

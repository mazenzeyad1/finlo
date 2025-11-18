import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaClient, EmailTokenPurpose } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { MailerService } from '../common/mailer.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { ActiveSession } from './interfaces/active-session.interface';
import { generateToken, hashToken } from './token.util';

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
  private readonly verificationTtlMs: number;
  private readonly resetTokenTtlMs: number;
  private readonly saltRounds = 12;
  private readonly isProduction: boolean;
  private readonly appUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    configService: ConfigService
  ) {
    this.accessTtl = configService.get<string>('JWT_ACCESS_TTL', '15m');
    this.refreshTtlMs = Number(configService.get<string>('JWT_REFRESH_TTL_MS', `${1000 * 60 * 60 * 24 * 30}`));
    this.verificationTtlMs = Number(
      configService.get<string>('EMAIL_TOKEN_TTL_MS', `${1000 * 60 * 60 * 24}`)
    );
    this.resetTokenTtlMs = Number(configService.get<string>('RESET_TOKEN_TTL_MS', `${1000 * 60 * 60}`));
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    this.appUrl =
      configService.get<string>('APP_BASE_URL') ||
      configService.get<string>('APP_URL', 'http://localhost:4200');
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

    // TODO(copilot): On login, if emailVerified=false, show banner with a "Resend verification" action.
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

  // TODO(copilot): Add unit tests for verifyEmail: valid, expired, used token.
  async verifyEmail(uid: string, token: string) {
    const hashed = hashToken(token);
    const record = await this.prisma.emailToken.findFirst({
      where: {
        userId: uid,
        purpose: EmailTokenPurpose.VERIFY_EMAIL,
        tokenHash: hashed,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
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

  // New: verify email using only the token (for GET /auth/verify-email?token=...)
  async verifyEmailByToken(token: string) {
    const hashed = hashToken(token);
    const record = await this.prisma.emailToken.findFirst({
      where: {
        purpose: EmailTokenPurpose.VERIFY_EMAIL,
        tokenHash: hashed,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
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

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // DB-backed rate limit: allow once per 5 minutes
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
      throw new BadRequestException('Please wait before requesting another verification email');
    }

    const token = await this.sendVerificationEmail({
      id: user.id,
      email: user.email,
      firstName: user.name,
    });

    this.logger.log(`Resent verification email for user ${userId}`);

    return this.isProduction ? { ok: true } : { ok: true, token };
  }

  async forgotPassword(dto: ForgotPasswordDto, meta?: SessionMeta) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    // TODO(copilot): Normalize auth error messages to avoid revealing if an email exists.
    if (!user) {
      this.logger.warn(`Password reset requested for unknown email ${email} (${this.describeMeta(meta)})`);
      return { sent: true };
    }

    const token = await this.createEmailToken(
      user.id,
      EmailTokenPurpose.RESET_PASSWORD,
      this.resetTokenTtlMs
    );
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

  async resetPassword(dto: ResetPasswordDto, meta?: SessionMeta) {
    const hashed = hashToken(dto.token);
    const record = await this.prisma.emailToken.findFirst({
      where: {
        purpose: EmailTokenPurpose.RESET_PASSWORD,
        tokenHash: hashed,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid reset token');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
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

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    };
  }

  private describeMeta(meta?: SessionMeta) {
    const ip = meta?.ip ?? 'ip:unknown';
    const agent = meta?.userAgent ?? 'agent:unknown';
    return `${ip}; ${agent}`;
  }

  private logFailedSignIn(email: string, meta: SessionMeta, reason: string) {
    this.logger.warn(`Failed sign-in for ${email}: ${reason} (${this.describeMeta(meta)})`);
  }

  private async sendVerificationEmail(user: { id: string; email: string; firstName?: string | null }) {
    const token = await this.createEmailToken(
      user.id,
      EmailTokenPurpose.VERIFY_EMAIL,
      this.verificationTtlMs
    );
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

  private buildVerificationEmail(name: string, verifyUrl: string) {
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

  private buildPasswordResetEmail(name: string, resetUrl: string) {
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

  private async sendEmailAndLog(options: {
    userId?: string;
    template: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    let status = 'sent';
    let providerId: string | undefined;
    let error: unknown;

    try {
      const result = await this.mailer.sendBasic(options.to, options.subject, options.html, options.text);
      providerId = result.messageId;
    } catch (err) {
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

  private async issueTokens(tx: Prisma.TransactionClient | PrismaClient, userId: string, sessionId: string, previousTokenId?: string): Promise<AuthTokens> {
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

  private async createEmailToken(
    userId: string,
    purpose: EmailTokenPurpose,
    ttlMs: number
  ) {
    await this.prisma.emailToken.deleteMany({
      where: {
        userId,
        purpose,
        usedAt: null,
      },
    });

    const token = generateToken(32);
    await this.prisma.emailToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    return token;
  }

  private buildAppUrl(path: string, params: Record<string, string>) {
    const url = new URL(path, this.appUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

}

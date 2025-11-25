import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { MailerService } from '../common/mailer.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { ActiveSession } from './interfaces/active-session.interface';
interface SessionMeta {
    ip?: string | null;
    userAgent?: string | null;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly mailer;
    private readonly accessTtl;
    private readonly refreshTtlMs;
    private readonly verificationTtlMs;
    private readonly resetTokenTtlMs;
    private readonly saltRounds;
    private readonly isProduction;
    private readonly appUrl;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, mailer: MailerService, configService: ConfigService);
    signUp(dto: SignUpDto, meta: SessionMeta): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            emailVerified: boolean;
        };
        tokens: AuthTokens;
        emailVerificationToken: string;
    }>;
    signIn(dto: SignInDto, meta: SessionMeta): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            emailVerified: boolean;
        };
        tokens: AuthTokens;
    }>;
    refresh(dto: RefreshTokenDto, meta: SessionMeta): Promise<AuthTokens>;
    verifyEmail(uid: string, token: string): Promise<{
        ok: boolean;
    }>;
    verifyEmailByToken(token: string): Promise<{
        ok: boolean;
    }>;
    resendVerification(userId: string): Promise<{
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto, meta?: SessionMeta): Promise<{
        sent: boolean;
        token?: undefined;
    } | {
        sent: boolean;
        token: string;
    }>;
    resetPassword(dto: ResetPasswordDto, meta?: SessionMeta): Promise<{
        reset: boolean;
    }>;
    listSessions(userId: string, currentSessionId: string): Promise<ActiveSession[]>;
    revokeSessionById(userId: string, sessionId: string): Promise<{
        revoked: boolean;
    }>;
    getUserById(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
    }>;
    private describeMeta;
    private logFailedSignIn;
    private sendVerificationEmail;
    private buildVerificationEmail;
    private buildPasswordResetEmail;
    private sendEmailAndLog;
    private ensureHouseholdForUser;
    private createSession;
    private issueTokens;
    private parseToken;
    private composeToken;
    private generateSecret;
    private parseExpiresIn;
    private revokeSession;
    private revokeAllSessions;
    private createEmailToken;
    private buildAppUrl;
}
export {};

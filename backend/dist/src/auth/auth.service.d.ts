import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
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
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly accessTtl;
    private readonly refreshTtlMs;
    private readonly emailTokenTtlMs;
    private readonly resetTokenTtlMs;
    private readonly saltRounds;
    private readonly isProduction;
    constructor(prisma: PrismaService, jwt: JwtService, configService: ConfigService);
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
    verifyEmail(userId: string, dto: VerifyEmailDto): Promise<{
        verified: boolean;
        reused: boolean;
    } | {
        verified: boolean;
        reused?: undefined;
    }>;
    resendVerification(userId: string): Promise<{
        sent: boolean;
        token?: undefined;
    } | {
        sent: boolean;
        token: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        sent: boolean;
        token?: undefined;
    } | {
        sent: boolean;
        token: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        reset: boolean;
    }>;
    listSessions(userId: string, currentSessionId: string): Promise<ActiveSession[]>;
    revokeSessionById(userId: string, sessionId: string): Promise<{
        revoked: boolean;
    }>;
    private ensureHouseholdForUser;
    private createSession;
    private issueTokens;
    private createEmailVerification;
    private createPasswordReset;
    private parseToken;
    private composeToken;
    private generateSecret;
    private parseExpiresIn;
    private revokeSession;
    private revokeAllSessions;
    private ensureEmailVerified;
}
export {};

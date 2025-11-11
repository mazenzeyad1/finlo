import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(dto: SignUpDto, userAgent: string | undefined, ip: string | undefined): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            emailVerified: boolean;
        };
        tokens: import("./interfaces/auth-tokens.interface").AuthTokens;
        emailVerificationToken: string;
    }>;
    signIn(dto: SignInDto, userAgent: string | undefined, ip: string | undefined): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            emailVerified: boolean;
        };
        tokens: import("./interfaces/auth-tokens.interface").AuthTokens;
    }>;
    refresh(dto: RefreshTokenDto, userAgent: string | undefined, ip: string | undefined): Promise<import("./interfaces/auth-tokens.interface").AuthTokens>;
    verify(user: {
        userId: string;
    }, dto: VerifyEmailDto): Promise<{
        verified: boolean;
        reused: boolean;
    } | {
        verified: boolean;
        reused?: undefined;
    }>;
    resend(user: {
        userId: string;
    }): Promise<{
        sent: boolean;
        token?: undefined;
    } | {
        sent: boolean;
        token: string;
    }>;
    forgot(dto: ForgotPasswordDto): Promise<{
        sent: boolean;
        token?: undefined;
    } | {
        sent: boolean;
        token: string;
    }>;
    reset(dto: ResetPasswordDto): Promise<{
        reset: boolean;
    }>;
    sessions(user: {
        userId: string;
        sessionId: string;
    }): Promise<import("./interfaces/active-session.interface").ActiveSession[]>;
    revokeSession(user: {
        userId: string;
    }, id: string): Promise<{
        revoked: boolean;
    }>;
}

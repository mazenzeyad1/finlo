import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { AuthTokens, AuthUser } from '../../state/auth.store';

export interface AuthSessionResponse {
  user: AuthUser;
  tokens: AuthTokens;
  emailVerificationToken?: string;
}

export interface ForgotPasswordResponse {
  sent: boolean;
  token?: string;
}

export interface ResendVerificationResponse {
  ok: boolean;
  token?: string;
}

export interface ActiveSession {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeen: string | null;
  current: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  constructor(private http: HttpClient) {}

  signUp(payload: { name: string; email: string; password: string }): Observable<AuthSessionResponse> {
    return this.http.post<AuthSessionResponse>('auth/signup', payload);
  }

  signIn(payload: { email: string; password: string }): Observable<AuthSessionResponse> {
    return this.http.post<AuthSessionResponse>('auth/signin', payload);
  }

  refresh(payload: { refreshToken: string }): Observable<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return this.http.post<{ accessToken: string; refreshToken: string; expiresIn: number }>('auth/refresh', payload);
  }

  verifyEmail(payload: { uid: string; token: string }): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('auth/verify', payload);
  }

  resendVerification(): Observable<ResendVerificationResponse> {
    return this.http.post<ResendVerificationResponse>('auth/verify/resend', {});
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>('auth/forgot', { email });
  }

  resetPassword(token: string, password: string): Observable<{ reset: boolean }> {
    return this.http.post<{ reset: boolean }>('auth/reset', { token, password });
  }

  sessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>('auth/sessions');
  }

  revokeSession(id: string): Observable<{ revoked: boolean }> {
    return this.http.delete<{ revoked: boolean }>(`auth/sessions/${encodeURIComponent(id)}`);
  }
}

import { Injectable, computed, effect, signal } from '@angular/core';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
}

interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly sessionKey = 'multibank.auth.session';
  private readonly noticeKey = 'multibank.auth.notice';

  private readonly sessionSignal = signal<AuthSession | null>(null);
  postResetNotice = signal<string | null>(null);

  user = computed(() => this.sessionSignal()?.user ?? null);
  tokens = computed(() => this.sessionSignal()?.tokens ?? null);
  isAuthenticated = computed(() => Boolean(this.sessionSignal()?.tokens));
  emailVerified = computed(() => this.sessionSignal()?.user?.emailVerified ?? false);

  constructor() {
    if (typeof window !== 'undefined') {
      const storedSession = window.localStorage.getItem(this.sessionKey);
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession) as AuthSession;
          this.sessionSignal.set(parsed);
        } catch {
          window.localStorage.removeItem(this.sessionKey);
        }
      }

      const storedNotice = window.sessionStorage.getItem(this.noticeKey);
      if (storedNotice) {
        this.postResetNotice.set(storedNotice);
      }
    }

    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }
      const session = this.sessionSignal();
      if (session) {
        window.localStorage.setItem(this.sessionKey, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(this.sessionKey);
      }
    });

    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }
      const notice = this.postResetNotice();
      if (notice) {
        window.sessionStorage.setItem(this.noticeKey, notice);
      } else {
        window.sessionStorage.removeItem(this.noticeKey);
      }
    });
  }

  setSession(user: AuthUser, tokens: AuthTokens) {
    this.sessionSignal.set({ user, tokens });
  }

  clearSession() {
    this.sessionSignal.set(null);
  }

  updateTokens(tokens: AuthTokens) {
    const current = this.sessionSignal();
    if (!current) {
      return;
    }
    this.sessionSignal.set({ ...current, tokens });
  }

  markEmailVerified() {
    const current = this.sessionSignal();
    if (!current?.user) {
      return;
    }
    if (current.user.emailVerified) {
      return;
    }
    this.sessionSignal.set({
      ...current,
      user: {
        ...current.user,
        emailVerified: true,
      },
    });
  }

  setPostResetNotice(message: string) {
    this.postResetNotice.set(message);
  }

  clearPostResetNotice() {
    this.postResetNotice.set(null);
  }
}

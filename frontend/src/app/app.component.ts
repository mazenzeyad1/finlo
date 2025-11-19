import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject, interval } from 'rxjs';
import { AccountApi } from './features/api/account.api';
import { AuthApi } from './features/api/auth.api';
import { AppStore } from './state/app.store';
import { AuthStore } from './state/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, NgFor],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  private accountApi = inject(AccountApi);
  private authApi = inject(AuthApi);
  store = inject(AppStore);
  auth = inject(AuthStore);
  private readonly authUser$ = toObservable(this.auth.user);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  resendState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  resendMessage = signal<string | null>(null);
  devVerificationToken = signal<string | null>(null);
  private resendMessageTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(){
    this.authUser$
      .pipe(
        filter((user): user is NonNullable<typeof user> => Boolean(user)),
        map(user => user.id),
        distinctUntilChanged(),
        tap(() => this.store.selectAccount(null)),
        switchMap(userId => this.accountApi.list(userId)),
        takeUntil(this.destroy$)
      )
      .subscribe(xs => this.store.setAccounts(xs));

    // Refresh user data immediately on load if authenticated
    if (this.auth.isAuthenticated()) {
      this.authApi.me()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            const tokens = this.auth.tokens();
            if (tokens) {
              this.auth.setSession(user, tokens);
            }
          },
          error: () => {
            // Ignore refresh errors
          },
        });
    }

    // Poll for verification status every 10s when user is unverified
    interval(10000)
      .pipe(
        filter(() => this.auth.isAuthenticated() && !this.auth.emailVerified()),
        switchMap(() => this.authApi.me()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (user) => {
          const tokens = this.auth.tokens();
          if (tokens) {
            this.auth.setSession(user, tokens);
          }
        },
        error: () => {
          // Ignore polling errors
        },
      });
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resendMessageTimer) {
      clearTimeout(this.resendMessageTimer);
    }
  }

  greetingName(){
    return this.auth.user()?.name?.trim() || 'Demo User';
  }

  avatarInitials(){
    const name = this.greetingName();
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return 'MB';
    }
    return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
  }

  dismissPostResetNotice(){
    this.auth.clearPostResetNotice();
  }

  onAccountChange(val: string){
    this.store.selectAccount(val || null);
  }

  signOut(){
    this.auth.clearSession();
    this.auth.clearPostResetNotice();
    this.resendMessage.set(null);
    this.devVerificationToken.set(null);
    this.store.setAccounts([]);
    this.store.selectAccount(null);
    this.router.navigateByUrl('/auth/signin');
  }

  resendVerification(){
    if (this.resendState() === 'loading') {
      return;
    }
    this.resendState.set('loading');
    this.resendMessage.set(null);

    this.authApi
      .resendVerification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            this.resendState.set('success');
            this.devVerificationToken.set(response.token ?? null);
            this.resendMessage.set('Verification email sent. Preview link available in backend logs.');
          } else {
            this.resendState.set('error');
            this.resendMessage.set('Unable to send a new verification email right now.');
          }
          this.queueMessageClear();
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Unable to send a new verification email right now.';
          this.resendMessage.set(message);
          this.resendState.set('error');
          this.queueMessageClear();
        },
      });
  }

  private queueMessageClear(){
    if (this.resendMessageTimer) {
      clearTimeout(this.resendMessageTimer);
    }
    this.resendMessageTimer = setTimeout(() => {
      this.resendMessage.set(null);
      this.resendState.set('idle');
    }, 6000);
  }
}

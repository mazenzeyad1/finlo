import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AccountApi } from './features/api/account.api';
import { AuthApi } from './features/api/auth.api';
import { AppStore } from './state/app.store';
import { AuthStore } from './state/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, NgFor],
  template: `
  <ng-container *ngIf="auth.isAuthenticated(); else publicShell">
    <div class="layout-shell">
      <aside class="layout-sidebar">
        <div class="sidebar-brand">
          <span>Financial Dashboard</span>
          <strong>Multi-Bank</strong>
        </div>
        <nav class="nav-list">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">Dashboard</a>
          <a routerLink="/accounts" routerLinkActive="active" class="nav-item">Accounts</a>
          <a routerLink="/transactions" routerLinkActive="active" class="nav-item">Transactions</a>
          <a routerLink="/budgets" routerLinkActive="active" class="nav-item">Budgets</a>
        </nav>
        <footer class="nav-footer">Secure banking overview · {{ store.accounts().length }} accounts</footer>
      </aside>

      <div class="layout-content">
        <div *ngIf="auth.postResetNotice() as notice" class="notice-banner">
          <span>{{ notice }}</span>
          <button type="button" (click)="dismissPostResetNotice()">Dismiss</button>
        </div>
        <header class="topbar">
          <div class="search-field">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13.8333 12.5H14.5833L18.3333 16.25L16.25 18.3333L12.5 14.5833V13.8333L12.25 13.5833C11.0417 14.5417 9.5 15.0833 7.83333 15.0833C3.91667 15.0833 0.833333 12 0.833333 8.08333C0.833333 4.16667 3.91667 1.08333 7.83333 1.08333C11.75 1.08333 14.8333 4.16667 14.8333 8.08333C14.8333 9.75 14.2917 11.2917 13.3333 12.5L13.8333 12.5ZM3.83333 8.08333C3.83333 10.375 5.54167 12.0833 7.83333 12.0833C10.125 12.0833 11.8333 10.375 11.8333 8.08333C11.8333 5.79167 10.125 4.08333 7.83333 4.08333C5.54167 4.08333 3.83333 5.79167 3.83333 8.08333Z" fill="currentColor"/>
            </svg>
            <input type="search" placeholder="Search accounts, transactions…" />
          </div>
          <div class="user-card">
            <div class="user-meta">
              <p class="muted">Hello, {{ greetingName() }}</p>
              <span class="status" [class.verified]="auth.emailVerified()">
                {{ auth.emailVerified() ? 'Email verified' : 'Verify your email to unlock more features' }}
              </span>
              <p class="status-message" *ngIf="resendMessage()">{{ resendMessage() }}</p>
              <div class="auth-actions">
                <button type="button" class="link-button" (click)="signOut()">Sign out</button>
                <button
                  type="button"
                  class="link-button"
                  *ngIf="!auth.emailVerified()"
                  [disabled]="resendState() === 'loading'"
                  (click)="resendVerification()"
                >
                  {{ resendState() === 'loading' ? 'Sending…' : 'Resend verification email' }}
                </button>
              </div>
              <div class="dev-hint" *ngIf="devVerificationToken()">
                Dev token: <code>{{ devVerificationToken() }}</code>
              </div>
            </div>
            <div class="account-filter">
              <label for="accountSelector" class="muted">Account filter</label>
              <select id="accountSelector" (change)="onAccountChange($any($event.target).value)">
                <option value="">All accounts</option>
                <option *ngFor="let a of store.accounts()" [value]="a.id">{{ a.name }}</option>
              </select>
            </div>
            <div class="avatar">{{ avatarInitials() }}</div>
          </div>
        </header>

        <main>
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  </ng-container>
  <ng-template #publicShell>
    <router-outlet></router-outlet>
  </ng-template>
  `,
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

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-card">
        <header>
          <h1>Create your account</h1>
          <p class="muted">Start syncing bank data and track every balance in one place.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="status() !== 'success'" novalidate>
          <label>
            Full name
            <input type="text" formControlName="name" placeholder="Alex Rivera" [disabled]="status() === 'submitting'" />
          </label>
          <label>
            Work email
            <input type="email" formControlName="email" placeholder="you@company.com" [disabled]="status() === 'submitting'" />
          </label>
          <label>
            Password
            <input type="password" formControlName="password" placeholder="Minimum 8 characters" [disabled]="status() === 'submitting'" />
          </label>
          <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
          <button type="submit" [disabled]="status() === 'submitting'">
            {{ status() === 'submitting' ? 'Creating account…' : 'Create account' }}
          </button>
          <p class="helper">
            Already have access?
            <a routerLink="/auth/signin">Sign in</a>
          </p>
        </form>

        <div *ngIf="status() === 'success'" class="success-state">
          <h2>Account created</h2>
          <p>We sent a verification email so you can confirm {{ form.controls.email.value }}.</p>
          <p *ngIf="verificationToken()" class="dev-token">
            Dev preview token: <code>{{ verificationToken() }}</code>
          </p>
          <div class="resend-feedback" *ngIf="resendMessage()">
            {{ resendMessage() }}
          </div>
          <div class="actions">
            <a routerLink="/dashboard" class="btn">Go to dashboard</a>
            <button type="button" class="ghost" (click)="resetForm()">Create another</button>
            <button
              type="button"
              class="ghost"
              [disabled]="resendState() === 'loading'"
              (click)="resendVerification()"
            >{{ resendState() === 'loading' ? 'Sending…' : 'Resend verification email' }}</button>
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noopener noreferrer"
              class="ghost-link"
            >Open local inbox</a>
          </div>
          <p class="resend-hint">The link contains a one-time token that marks your email as verified when opened.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at 15% 15%, rgba(14,165,233,0.12), transparent 50%),
                  radial-gradient(circle at 80% 10%, rgba(59,130,246,0.1), transparent 45%),
                  radial-gradient(circle at 50% 100%, rgba(110,231,183,0.12), transparent 55%),
                  linear-gradient(180deg, #f9fbff 0%, #edf2fb 100%);
    }
    .auth-card {
      max-width: 520px;
      width: min(100%, 520px);
      padding: 2.75rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header h1 {
      font-size: 2rem;
      margin-bottom: 0.35rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
    }
    input {
      padding: 0.8rem 1rem;
      border-radius: 10px;
      border: 1px solid #d0d7e6;
      font-size: 1rem;
      transition: border 0.2s ease;
    }
    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    button {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    button[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    button:not([disabled]):hover {
      background: #1d4ed8;
    }
    .helper {
      font-size: 0.95rem;
      color: #64748b;
      text-align: center;
    }
    .helper a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
    .helper a:hover {
      text-decoration: underline;
    }
    .error {
      color: #b91c1c;
      font-weight: 500;
      text-align: center;
    }
    .success-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      color: #065f46;
    }
    .success-state .actions {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.85rem 1.5rem;
      background: #2563eb;
      color: #fff;
      border-radius: 999px;
      font-weight: 600;
      text-decoration: none;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .ghost {
      background: transparent;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 999px;
      padding: 0.85rem 1.5rem;
    }
    .ghost:hover {
      background: rgba(37, 99, 235, 0.08);
    }
    .ghost-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 999px;
      padding: 0.85rem 1.5rem;
      font-weight: 600;
      text-decoration: none;
    }
    .ghost-link:hover {
      background: rgba(37, 99, 235, 0.08);
    }
    .dev-token {
      font-size: 0.85rem;
      color: #0f172a;
      background: rgba(37, 99, 235, 0.09);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      word-break: break-all;
    }
    .resend-feedback {
      font-size: 0.9rem;
      color: #0369a1;
      background: rgba(14, 165, 233, 0.12);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
    }
    .resend-hint {
      font-size: 0.85rem;
      color: #0f172a;
      margin: 0;
    }
    code {
      font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }
  `]
})
export class SignUpPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly destroy$ = new Subject<void>();

  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  errorMessage = signal<string | null>(null);
  verificationToken = signal<string | null>(null);
  resendState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  resendMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private resendMessageTimer?: ReturnType<typeof setTimeout>;

  submit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Fill every field and ensure the password is at least 8 characters.');
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set(null);

    const payload = this.form.getRawValue();

    this.authApi
      .signUp(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.authStore.setSession(response.user, response.tokens);
          this.authStore.setPostResetNotice('Account created. Check your inbox to verify your email.');
          this.verificationToken.set(response.emailVerificationToken ?? null);
          this.status.set('success');
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Could not create the account. Try again in a moment.';
          this.errorMessage.set(message);
          this.status.set('error');
        },
      });
  }

  resetForm(): void {
    this.form.reset({ name: '', email: '', password: '' });
    this.verificationToken.set(null);
    this.errorMessage.set(null);
    this.status.set('idle');
    this.resendState.set('idle');
    this.resendMessage.set(null);
    if (this.resendMessageTimer) {
      clearTimeout(this.resendMessageTimer);
      this.resendMessageTimer = undefined;
    }
  }

  resendVerification(): void {
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
            if (response.token) {
              this.verificationToken.set(response.token);
            }
            this.resendMessage.set('Verification email sent. Check your inbox.');
          } else {
            this.resendState.set('error');
            this.resendMessage.set('Unable to send a new verification email right now.');
          }
          this.queueResendMessageClear();
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Unable to send a new verification email right now.';
          this.resendMessage.set(message);
          this.resendState.set('error');
          this.queueResendMessageClear();
        },
      });
  }

  private queueResendMessageClear(): void {
    if (this.resendMessageTimer) {
      clearTimeout(this.resendMessageTimer);
    }
    this.resendMessageTimer = setTimeout(() => {
      this.resendMessage.set(null);
      this.resendState.set('idle');
    }, 6000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resendMessageTimer) {
      clearTimeout(this.resendMessageTimer);
    }
  }
}

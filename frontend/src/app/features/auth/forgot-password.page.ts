import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <header>
        <h1>Forgot password</h1>
        <p class="muted">Tell us your email and we'll send a secure link to reset your password.</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="status() !== 'sent'" novalidate>
        <label>
          Work email
          <input type="email" formControlName="email" placeholder="you@company.com" [disabled]="status() === 'submitting'" />
        </label>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
        <button type="submit" [disabled]="status() === 'submitting'">
          {{ status() === 'submitting' ? 'Sending link…' : 'Send reset link' }}
        </button>
        <p class="helper">
          Remembered your password?
          <a routerLink="/auth/signin">Back to sign in</a>
        </p>
      </form>

      <div *ngIf="status() === 'sent'" class="success-state">
        <h2>Check your inbox</h2>
        <p>If we found {{ form.controls.email.value }}, a reset link is on the way.</p>
        <p *ngIf="devResetToken()" class="dev-token">
          Dev preview token: <code>{{ devResetToken() }}</code>
        </p>
        <a routerLink="/auth/reset-password" class="btn">Already have a link?</a>
      </div>
    </section>
  `,
  styles: [`
    .auth-card {
      max-width: 460px;
      margin: 4rem auto;
      padding: 2.6rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header h1 {
      font-size: 1.9rem;
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
    }
    button[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .helper {
      text-align: center;
      color: #64748b;
      font-size: 0.95rem;
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
      text-align: center;
      font-weight: 500;
    }
    .success-state {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      text-align: center;
      color: #1e3a8a;
    }
    .dev-token {
      font-size: 0.85rem;
      color: #0f172a;
      background: rgba(37, 99, 235, 0.09);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      word-break: break-all;
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
    code {
      font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }
  `]
})
export class ForgotPasswordPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly destroy$ = new Subject<void>();

  status = signal<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  errorMessage = signal<string | null>(null);
  devResetToken = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Enter a valid email address.');
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set(null);
    this.devResetToken.set(null);

    const { email } = this.form.getRawValue();

    this.authApi
      .forgotPassword(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.status.set('sent');
          this.devResetToken.set(response.token ?? null);
          this.authStore.setPostResetNotice('If the account exists, a reset email is on the way.');
        },
        error: (err) => {
          const message = err?.error?.message ?? 'We could not process the request. Try again later.';
          this.errorMessage.set(message);
          this.status.set('error');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

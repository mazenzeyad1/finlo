import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
    <section class="auth-card">
      <header>
        <h1>Sign in</h1>
        <p class="muted">Continue where you left off by entering your credentials.</p>
      </header>

      <div *ngIf="authStore.postResetNotice()" class="info-banner">
        <span>{{ authStore.postResetNotice() }}</span>
        <button type="button" (click)="dismissNotice()">Dismiss</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          Email address
          <input type="email" formControlName="email" placeholder="you@company.com" [disabled]="status() === 'submitting'" />
        </label>
        <label>
          Password
          <input type="password" formControlName="password" placeholder="••••••••" [disabled]="status() === 'submitting'" />
        </label>
        <div class="form-footer">
          <a routerLink="/auth/forgot-password">Forgot password?</a>
        </div>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
        <button type="submit" [disabled]="status() === 'submitting'">
          {{ status() === 'submitting' ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="helper">
        Need an account?
        <a routerLink="/auth/signup">Create one</a>
      </p>
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
      background: radial-gradient(circle at 20% 20%, rgba(37,99,235,0.12), transparent 50%),
                  radial-gradient(circle at 80% 0%, rgba(59,130,246,0.08), transparent 45%),
                  radial-gradient(circle at 50% 100%, rgba(148,163,255,0.12), transparent 55%),
                  linear-gradient(180deg, #f9fbff 0%, #edf2fb 100%);
    }
    .auth-card {
      max-width: 440px;
      width: min(100%, 440px);
      padding: 2.5rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header h1 {
      font-size: 1.9rem;
      margin-bottom: 0.4rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .info-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      color: #1d4ed8;
      font-weight: 500;
    }
    .info-banner button {
      border: none;
      background: rgba(37, 99, 235, 0.15);
      color: #1d4ed8;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
    }
    .info-banner button:hover {
      background: rgba(37, 99, 235, 0.25);
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
    .form-footer {
      display: flex;
      justify-content: flex-end;
    }
    .form-footer a {
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
    }
    .form-footer a:hover {
      text-decoration: underline;
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
    .error {
      color: #b91c1c;
      text-align: center;
      font-weight: 500;
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
  `]
})
export class SignInPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApi);
  protected readonly authStore = inject(AuthStore);
  private readonly destroy$ = new Subject<void>();

  status = signal<'idle' | 'submitting' | 'error'>('idle');
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.status() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Enter your email and password to continue.');
      return;
    }

    this.status.set('submitting');
    this.errorMessage.set(null);

    const payload = this.form.getRawValue();

    this.authApi
      .signIn(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.authStore.setSession(response.user, response.tokens);
          if (!response.user.emailVerified) {
            this.authStore.setPostResetNotice('Please verify your email address to access all features.');
          } else {
            this.authStore.clearPostResetNotice();
          }
          this.status.set('idle');
          const desired = this.route.snapshot.queryParamMap.get('redirectTo');
          const safeRedirect = desired && desired.startsWith('/') && !desired.startsWith('/auth/') ? desired : '/dashboard';
          this.router.navigateByUrl(safeRedirect, { replaceUrl: true });
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Sign-in failed. Check your credentials and try again.';
          this.errorMessage.set(message);
          this.status.set('error');
        },
      });
  }
  dismissNotice(): void {
    this.authStore.clearPostResetNotice();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

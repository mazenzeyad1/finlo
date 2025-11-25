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
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.css']
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

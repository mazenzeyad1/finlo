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
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.css']
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

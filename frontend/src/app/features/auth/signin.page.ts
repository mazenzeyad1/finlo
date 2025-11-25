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
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.css']
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

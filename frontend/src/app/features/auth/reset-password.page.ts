import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <h1>Reset Password</h1>

      <div *ngIf="status() === 'missing'" class="error">
        <p>The reset link is missing a token. Start the reset process again to receive a valid email.</p>
      </div>

      <form *ngIf="status() === 'ready' || status() === 'submitting'" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          New password
          <input type="password" formControlName="password" placeholder="Enter a new password" [disabled]="status() === 'submitting'" />
        </label>
        <label>
          Confirm password
          <input type="password" formControlName="confirm" placeholder="Re-enter the password" [disabled]="status() === 'submitting'" />
        </label>
        <p *ngIf="formErrors()" class="error">{{ formErrors() }}</p>
        <button type="submit" [disabled]="status() === 'submitting'">{{ status() === 'submitting' ? 'Resetting…' : 'Reset Password' }}</button>
      </form>

      <div *ngIf="status() === 'success'" class="success">
        <p>Your password was updated. You can sign in with your new credentials.</p>
        <a routerLink="/dashboard" class="btn">Return to Dashboard</a>
      </div>

      <div *ngIf="status() === 'error'" class="error">
        <p>{{ errorMessage() }}</p>
        <button type="button" (click)="retry()">Try Again</button>
      </div>
    </section>
  `,
  styles: [`
    .auth-card {
      max-width: 480px;
      margin: 4rem auto;
      padding: 2.5rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: 1.75rem;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
    }
    input {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5f5;
      font-size: 1rem;
    }
    button {
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button[disabled] {
      background: #93c5fd;
      cursor: not-allowed;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .success {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      color: #065f46;
    }
    .error {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #b91c1c;
      text-align: center;
    }
  `]
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);

  status = signal<'idle' | 'missing' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  errorMessage = signal('We could not reset your password. Please request a new link and try again.');
  token: string | null = null;

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.status.set('missing');
      return;
    }
    this.status.set('ready');
  }

  formErrors() {
    if (this.status() === 'error' && this.errorMessage()) {
      return this.errorMessage();
    }
    if (this.form.controls.password.invalid && this.form.controls.password.touched) {
      return 'Your password must be at least 8 characters long.';
    }
    if (this.form.controls.confirm.invalid && this.form.controls.confirm.touched) {
      return 'Confirm the password using at least 8 characters.';
    }
    if (this.form.value.password !== this.form.value.confirm && this.form.controls.confirm.touched) {
      return 'The passwords do not match.';
    }
    return '';
  }

  submit(): void {
    if (this.status() !== 'ready' && this.status() !== 'submitting') {
      return;
    }

    if (!this.token) {
      this.status.set('missing');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirm } = this.form.getRawValue();
    if (password !== confirm) {
      this.errorMessage.set('The passwords do not match.');
      this.status.set('error');
      return;
    }

    this.status.set('submitting');
    this.authApi.resetPassword(this.token, password).subscribe({
      next: () => {
        this.authStore.clearSession();
        this.authStore.setPostResetNotice('Password updated. Sign in again to continue.');
        this.form.reset({ password: '', confirm: '' });
        this.status.set('success');
      },
      error: (err) => {
        const message = err?.error?.message ?? 'The reset link is no longer valid. Request a new email to continue.';
        this.errorMessage.set(message);
        this.status.set('error');
      },
    });
  }

  retry(): void {
    if (this.status() !== 'error') {
      return;
    }
    this.errorMessage.set('We could not reset your password. Please request a new link and try again.');
    this.status.set(this.token ? 'ready' : 'missing');
  }
}

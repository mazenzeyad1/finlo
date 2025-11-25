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
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.css']
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

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-card">
      <h1>Email Verification</h1>

      <ng-container [ngSwitch]="status()">
        <p *ngSwitchCase="'missing'">
          We could not find a verification token in the link you followed. Double-check the email or request a new verification email from your profile settings.
        </p>

        <p *ngSwitchCase="'loading'">Verifying your email address…</p>

        <div *ngSwitchCase="'success'" class="success">
          <p>Your email address is verified. You can return to the dashboard.</p>
          <a routerLink="/dashboard" class="btn">Go to Dashboard</a>
        </div>

        <div *ngSwitchCase="'reused'" class="success">
          <p>This verification link was already used. Your email address is confirmed, so you're all set.</p>
          <a routerLink="/dashboard" class="btn">Go to Dashboard</a>
        </div>

        <div *ngSwitchCase="'error'" class="error">
          <p>{{ errorMessage() }}</p>
          <a routerLink="/dashboard" class="btn">Return to Dashboard</a>
        </div>
      </ng-container>
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
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 1.75rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .success {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #065f46;
    }
    .error {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #b91c1c;
    }
  `]
})
export class VerifyEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);

  status = signal<'idle' | 'missing' | 'loading' | 'success' | 'reused' | 'error'>('idle');
  errorMessage = signal('Something went wrong while verifying your email. Try requesting a new link.');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status.set('missing');
      return;
    }

    this.status.set('loading');

    this.authApi.verifyEmail(token).subscribe({
      next: ({ verified, reused }) => {
        if (reused) {
          this.authStore.markEmailVerified();
          this.status.set('reused');
          return;
        }
        if (verified) {
          this.authStore.markEmailVerified();
          this.status.set('success');
          return;
        }
        this.status.set('error');
      },
      error: (err) => {
        const message = err?.error?.message ?? 'This verification link is no longer valid. Request a new email from your account settings.';
        this.errorMessage.set(message);
        this.status.set('error');
      },
    });
  }
}

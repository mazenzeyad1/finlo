import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../state/auth.store';
import { AuthApi } from '../../features/api/auth.api';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'verification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="shouldShow()" class="verification-banner">
      <div class="banner-content">
        <div class="banner-message">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span>Your email address is not verified. Please check your inbox for the verification link.</span>
        </div>
        <div class="banner-actions">
          <button
            type="button"
            class="resend-btn"
            [disabled]="resendState() === 'loading' || cooldown() > 0"
            (click)="resendVerification()"
          >
            <span *ngIf="resendState() === 'loading'">Sending…</span>
            <span *ngIf="resendState() !== 'loading' && cooldown() === 0">Resend email</span>
            <span *ngIf="cooldown() > 0">Wait {{ cooldown() }}s</span>
          </button>
          <button type="button" class="dismiss-btn" (click)="dismiss()">Dismiss</button>
        </div>
      </div>
      <div *ngIf="message()" class="banner-feedback" [class.success]="resendState() === 'success'" [class.error]="resendState() === 'error'">
        {{ message() }}
      </div>
    </div>
  `,
  styles: [`
    .verification-banner {
      background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.12) 100%);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      color: #9a3412;
    }
    .banner-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .banner-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 250px;
    }
    .banner-message svg {
      flex-shrink: 0;
      color: #ea580c;
    }
    .banner-actions {
      display: flex;
      gap: 0.75rem;
    }
    button {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .resend-btn {
      background: rgba(249, 115, 22, 0.15);
      color: #9a3412;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }
    .resend-btn:hover:not([disabled]) {
      background: rgba(249, 115, 22, 0.25);
    }
    .resend-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .dismiss-btn {
      background: transparent;
      color: #9a3412;
      border: 1px solid rgba(249, 115, 22, 0.25);
    }
    .dismiss-btn:hover {
      background: rgba(249, 115, 22, 0.08);
    }
    .banner-feedback {
      margin-top: 0.75rem;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .banner-feedback.success {
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .banner-feedback.error {
      background: rgba(239, 68, 68, 0.15);
      color: #991b1b;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
  `]
})
export class VerificationBannerComponent implements OnDestroy {
  protected authStore = inject(AuthStore);
  private authApi = inject(AuthApi);
  private destroy$ = new Subject<void>();

  resendState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  message = signal<string | null>(null);
  cooldown = signal(0);
  dismissed = signal(false);

  private cooldownTimer?: ReturnType<typeof setInterval>;
  private messageTimer?: ReturnType<typeof setTimeout>;

  shouldShow(): boolean {
    return this.authStore.isAuthenticated() && 
           !this.authStore.emailVerified() && 
           !this.dismissed();
  }

  resendVerification(): void {
    if (this.resendState() === 'loading' || this.cooldown() > 0) {
      return;
    }

    this.resendState.set('loading');
    this.message.set(null);

    this.authApi
      .resendVerification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resendState.set('success');
          this.message.set('Verification email sent! Check your inbox.');
          this.startCooldown(60);
          this.clearMessageAfterDelay();
        },
        error: (err) => {
          this.resendState.set('error');
          const msg = err?.error?.message ?? 'Unable to send verification email. Please try again later.';
          this.message.set(msg);
          this.startCooldown(30);
          this.clearMessageAfterDelay();
        },
      });
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  private startCooldown(seconds: number): void {
    this.cooldown.set(seconds);
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.cooldownTimer = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        clearInterval(this.cooldownTimer);
        this.cooldown.set(0);
        this.resendState.set('idle');
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
  }

  private clearMessageAfterDelay(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    this.messageTimer = setTimeout(() => {
      this.message.set(null);
    }, 6000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }
}

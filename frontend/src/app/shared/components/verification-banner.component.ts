import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../state/auth.store';
import { AuthApi } from '../../features/api/auth.api';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'verification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification-banner.component.html',
  styleUrls: ['./verification-banner.component.css']
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

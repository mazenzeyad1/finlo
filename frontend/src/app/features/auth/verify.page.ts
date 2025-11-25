import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApi } from '../api/auth.api';
import { AuthStore } from '../../state/auth.store';

@Component({
  standalone: true,
  selector: 'app-verify',
  imports: [CommonModule, RouterLink],
  templateUrl: './verify.page.html',
})
export default class VerifyPage {
  private api = inject(AuthApi);
  private route = inject(ActivatedRoute);
  private authStore = inject(AuthStore);

  state = signal<'loading' | 'ok' | 'error'>('loading');
  cooldown = signal(0);
  private timer?: any;

  constructor() {
    const uid = this.route.snapshot.queryParamMap.get('uid') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!uid || !token) {
      this.state.set('error');
      return;
    }
    this.api.verifyEmail({ uid, token }).subscribe({
      next: () => {
        this.state.set('ok');
        // Fetch fresh user data to update session with current verification status
        if (this.authStore.isAuthenticated()) {
          this.api.me().subscribe({
            next: (user) => {
              const tokens = this.authStore.tokens();
              if (tokens) {
                this.authStore.setSession(user, tokens);
              }
            },
            error: () => {
              // Fallback to manual update if fetch fails
              this.authStore.markEmailVerified();
            },
          });
        } else {
          this.authStore.markEmailVerified();
        }
      },
      error: () => this.state.set('error'),
    });
  }

  resend() {
    this.api.resendVerification().subscribe({
      next: () => this.startCooldown(60),
      error: () => this.startCooldown(60),
    });
  }

  private startCooldown(s: number) {
    this.cooldown.set(s);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const v = this.cooldown();
      if (v <= 1) { clearInterval(this.timer); this.cooldown.set(0); }
      else this.cooldown.set(v - 1);
    }, 1000);
  }
}

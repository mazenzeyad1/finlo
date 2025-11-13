import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApi } from '../api/auth.api';

@Component({
  standalone: true,
  selector: 'app-verify',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 max-w-lg mx-auto">
      <h1 class="text-2xl font-semibold mb-4">Email verification</h1>

      <ng-container [ngSwitch]="state()">
        <p *ngSwitchCase="'loading'">Verifying your email…</p>

        <div *ngSwitchCase="'ok'" class="space-y-4">
          <p class="font-medium">Verified 🎉</p>
          <a routerLink="/login" class="underline">Go to Login</a>
        </div>

        <div *ngSwitchCase="'error'" class="space-y-4">
          <p class="text-red-600">This verification link is invalid or expired.</p>
          <button (click)="resend()" [disabled]="cooldown()>0" class="border rounded px-3 py-1">
            Resend verification email
          </button>
          <span *ngIf="cooldown()>0">Try again in {{ cooldown() }}s</span>
        </div>
      </ng-container>
    </div>
  `,
})
export default class VerifyPage {
  private api = inject(AuthApi);
  private route = inject(ActivatedRoute);

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
      next: () => this.state.set('ok'),
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

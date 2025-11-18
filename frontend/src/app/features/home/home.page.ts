import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="landing">
      <header>
        <p class="eyebrow">Personal finance dashboard</p>
        <h1>Sign in to continue</h1>
        <p class="tagline">Connect all of your financial institutions, monitor balances, and stay ahead of cash flow.</p>
      </header>

      <div class="cta-grid">
        <a routerLink="/auth/signin" class="cta primary">Sign in</a>
        <a routerLink="/auth/signup" class="cta outline">Create an account</a>
      </div>

      <footer *ngIf="auth.isAuthenticated()" class="authed-banner">
        <span>You are already signed in as {{ auth.user()?.email }}.</span>
        <button type="button" (click)="goToDashboard()">Go to dashboard</button>
      </footer>
    </section>
  `,
  styles: [`
    .landing {
      max-width: 640px;
      margin: 5rem auto;
      padding: 3.5rem;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
      display: flex;
      flex-direction: column;
      gap: 2.25rem;
      text-align: center;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #60a5fa;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 2.4rem;
      margin: 0 0 0.75rem;
    }
    .tagline {
      color: #64748b;
      font-size: 1.05rem;
      line-height: 1.6;
    }
    .cta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 3.2rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .primary {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
    }
    .primary:hover {
      background: #1d4ed8;
    }
    .outline {
      border: 1px solid #cbd5f5;
      color: #1d4ed8;
      background: #f8fbff;
    }
    .outline:hover {
      background: #e0edff;
    }
    .authed-banner {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      color: #1e3a8a;
    }
    .authed-banner button {
      align-self: center;
      padding: 0.6rem 1.4rem;
      border-radius: 999px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .authed-banner button:hover {
      background: #1d4ed8;
    }
  `]
})
export class HomePage {
  auth = inject(AuthStore);
  private router = inject(Router);

  goToDashboard(){
    this.router.navigateByUrl('/dashboard');
  }
}

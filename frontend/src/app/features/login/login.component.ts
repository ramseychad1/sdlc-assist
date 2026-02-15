import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
    ],
    template: `
    <div class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <div class="logo">
            <lucide-icon name="layers" [size]="28"></lucide-icon>
            <span class="logo-text">SDLC Assist</span>
          </div>
          <p class="subtitle">Sign in to your account</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input id="username"
                   class="input"
                   [(ngModel)]="username"
                   name="username"
                   placeholder="Enter your username"
                   autocomplete="username"
                   required />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-wrapper">
              <input id="password"
                     class="input"
                     [type]="showPassword() ? 'text' : 'password'"
                     [(ngModel)]="password"
                     name="password"
                     placeholder="Enter your password"
                     autocomplete="current-password"
                     required />
              <button type="button"
                      class="toggle-password"
                      (click)="showPassword.set(!showPassword())">
                @if (showPassword()) {
                  <lucide-icon name="eye-off" [size]="18"></lucide-icon>
                } @else {
                  <lucide-icon name="eye" [size]="18"></lucide-icon>
                }
              </button>
            </div>
          </div>

          @if (errorMessage) {
            <p class="error-message">{{ errorMessage }}</p>
          }

          <button type="submit"
                  class="btn btn-primary login-button"
                  [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: var(--background);
    }

    .login-card {
      width: 400px;
      overflow: hidden;
    }

    .login-header {
      padding: 24px 24px 4px;
      text-align: center;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 4px;
      color: var(--foreground);
    }

    .logo-text {
      font-size: 24px;
      font-weight: 600;
      color: var(--foreground);
    }

    .subtitle {
      color: var(--muted-foreground);
      font-size: 14px;
    }

    .login-form {
      padding: 24px;
    }

    .password-wrapper {
      position: relative;
    }

    .password-wrapper .input {
      padding-right: 40px;
    }

    .toggle-password {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 4px;
      display: flex;
      align-items: center;
    }

    .toggle-password:hover {
      color: var(--foreground);
    }

    .error-message {
      color: var(--destructive);
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }

    .login-button {
      width: 100%;
      height: 40px;
      margin-top: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--primary-foreground);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoginComponent {
    username = '';
    password = '';
    errorMessage = '';
    showPassword = signal(false);
    loading = signal(false);

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    onLogin(): void {
        if (!this.username || !this.password) {
            this.errorMessage = 'Please enter both username and password';
            return;
        }

        this.loading.set(true);
        this.errorMessage = '';

        this.authService.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: () => {
                this.errorMessage = 'Invalid username or password';
                this.loading.set(false);
            },
        });
    }
}

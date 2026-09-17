import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <div class="auth-viewport">
      <router-outlet></router-outlet>
      <app-toast></app-toast>
    </div>
  `,
  styles: [
    `
      .auth-viewport {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #F8FAFC;
        position: relative;
      }
    `,
  ],
})
export class AuthLayoutComponent { }

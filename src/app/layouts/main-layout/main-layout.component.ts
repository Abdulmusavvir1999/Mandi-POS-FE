import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastComponent,
    ConfirmationDialogComponent,
  ],
  template: `
    <div
      class="flex h-screen w-screen overflow-hidden"
      [style.background-color]="isPosRoute ? '#F4F7F6' : 'var(--bg-app, #FAF5FF)'"
      [style.color]="'var(--text-main, #2E1065)'"
    >
      <!-- Full-height Sidebar: its brand header occupies the top-left corner -->
      <app-sidebar
        *ngIf="!isPosRoute"
        [isCollapsed]="isSidebarCollapsed"
        (toggleCollapse)="isSidebarCollapsed = !isSidebarCollapsed"
      ></app-sidebar>

      <!-- Right column: top navbar above the routed screen -->
      <div class="flex flex-col flex-1 overflow-hidden relative">
        <!-- Top Iconic Navbar (Hidden in Fullscreen POS mode) -->
        <app-header *ngIf="!isPosRoute"></app-header>

        <!-- Routed Feature Screen with Canvas -->
        <main
          class="flex-1 overflow-hidden"
          [ngClass]="isPosRoute ? 'p-0 w-full h-full' : 'overflow-y-auto p-4 md:p-6'"
          [style.color]="'var(--text-main, #2E1065)'"
        >
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Overlays -->
      <app-toast></app-toast>
      <app-confirmation-dialog></app-confirmation-dialog>
    </div>
  `,
})
export class MainLayoutComponent {
  private router = inject(Router);
  public isSidebarCollapsed = false;
  public isPosRoute = false;

  constructor() {
    this.checkPosRoute(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkPosRoute(event.urlAfterRedirects || event.url);
      });
  }

  private checkPosRoute(url: string): void {
    this.isPosRoute = !!url && (url === '/pos' || url.startsWith('/pos?') || url.startsWith('/pos/'));
  }
}

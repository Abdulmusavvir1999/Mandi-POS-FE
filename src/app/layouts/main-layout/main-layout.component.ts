import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SidebarLayoutService } from '../../core/services/sidebar-layout.service';

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
      <!-- Full-height Sidebar with Desktop Dock + Mobile Overlay Drawer Support -->
      <app-sidebar
        *ngIf="!isPosRoute"
        [isCollapsed]="isSidebarCollapsed()"
        [isMobileOpen]="isMobileSidebarOpen"
        (toggleCollapse)="onToggleCollapse()"
        (closeMobileDrawer)="isMobileSidebarOpen = false"
      ></app-sidebar>

      <!-- Right column: top navbar above the routed screen -->
      <div class="flex flex-col flex-1 overflow-hidden relative min-w-0">
        <!-- Top Iconic Navbar (Hidden in Fullscreen POS mode) -->
        <app-header
          *ngIf="!isPosRoute"
          (toggleMobileSidebar)="isMobileSidebarOpen = !isMobileSidebarOpen"
        ></app-header>

        <!-- Routed Feature Screen with Canvas -->
        <main
          #scrollArea
          class="flex-1 overflow-hidden min-w-0"
          [ngClass]="isPosRoute ? 'p-0 w-full h-full' : 'overflow-y-auto p-3 sm:p-4 md:p-6'"
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
  private sidebarLayout = inject(SidebarLayoutService);

  /** The one pane that scrolls on a feature route; see resetScroll(). */
  private scrollArea = viewChild<ElementRef<HTMLElement>>('scrollArea');

  public isSidebarCollapsed = signal(false);
  public isMobileSidebarOpen = false;
  public isPosRoute = false;

  constructor() {
    this.checkPosRoute(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkPosRoute(event.urlAfterRedirects || event.url);
        this.isMobileSidebarOpen = false;
        this.resetScroll();
      });

    // Each sidebar template opens with the operator's remembered rail state,
    // falling back to that template's own preference (Compact starts narrow).
    effect(() => {
      const slot = this.sidebarLayout.collapseSlot();
      this.isSidebarCollapsed.set(this.sidebarLayout.resolveInitialCollapsed(slot));
    });
  }

  /**
   * Opens every route at its top.
   *
   * The document does not scroll in this shell, so the browser has no scroll
   * position of its own to restore and Angular's scroll restoration has
   * nothing to act on — <main> simply keeps whatever offset the previous
   * screen left behind, and the next one opens part-way down.
   *
   * Instant, not smooth: easing a whole screen back to the top on every
   * navigation is a wait, not a flourish. The global smooth rule would
   * otherwise apply here, so the jump is asked for explicitly.
   */
  private resetScroll(): void {
    const el = this.scrollArea()?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  public onToggleCollapse(): void {
    const next = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(next);
    this.sidebarLayout.persistCollapsed(this.sidebarLayout.collapseSlot(), next);
  }

  private checkPosRoute(url: string): void {
    this.isPosRoute = !!url && (url === '/pos' || url.startsWith('/pos?') || url.startsWith('/pos/'));
  }
}

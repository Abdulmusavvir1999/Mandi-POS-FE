import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/guards/auth.guard';
import { backOfficeGuard } from './features/back-office/back-office.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  // Auth Layout Route
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
    ],
  },

  // Standalone Back-Office.
  //
  // Declared at the top level rather than inside the shell so it renders
  // without the sidebar and header — and, deliberately, so nothing in the
  // panel navigation links to it. `/admin/back-office` typed into the address
  // bar is the only way in, and the backOfficeGuard plus the admin-only
  // Back-Office API decide who gets through.
  {
    path: 'admin/back-office',
    canActivate: [backOfficeGuard],
    loadComponent: () =>
      import('./features/back-office/back-office.component').then((m) => m.BackOfficeComponent),
  },

  // Main Dashboard / POS Shell Layout Routes (Protected)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { permission: 'dashboard.view' },
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
        canActivate: [roleGuard],
        data: { permission: 'pos.billing' },
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then((m) => m.OrdersComponent),
        canActivate: [roleGuard],
        data: { permission: 'order.manage' },
      },
      {
        path: 'draft-bills',
        loadComponent: () =>
          import('./features/draft-bills/draft-bills.component').then((m) => m.DraftBillsComponent),
        canActivate: [roleGuard],
        data: { permission: 'pos.hold_bill' },
      },
      {
        path: 'bills',
        loadComponent: () =>
          import('./features/bills/bills.component').then((m) => m.BillsComponent),
        canActivate: [roleGuard],
        data: { permission: 'bill.view' },
      },
      {
        path: 'dining',
        loadComponent: () =>
          import('./features/dining/dining.component').then((m) => m.DiningComponent),
        canActivate: [roleGuard],
        data: { permission: 'dining.manage' },
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/queue/queue.component').then((m) => m.QueueComponent),
        canActivate: [roleGuard],
        data: { permission: 'queue.manage' },
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
        canActivate: [roleGuard],
        data: { permission: 'product.manage' },
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        canActivate: [roleGuard],
        data: { permission: 'product.manage' },
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        canActivate: [roleGuard],
        data: { permission: 'product.manage' },
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
        canActivate: [roleGuard],
        data: { permission: 'product.manage' },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
        canActivate: [roleGuard],
        data: { permission: 'category.manage' },
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock.component').then((m) => m.StockComponent),
        canActivate: [roleGuard],
        data: { permission: 'stock.view' },
      },
      {
        path: 'stock/:id',
        loadComponent: () =>
          import('./features/stock/stock-detail/stock-detail.component').then((m) => m.StockDetailComponent),
        canActivate: [roleGuard],
        data: { permission: 'stock.view' },
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
        canActivate: [roleGuard],
        data: { permission: 'customer.manage' },
      },
      {
        path: 'vendors',
        loadComponent: () =>
          import('./features/vendors/vendors.component').then((m) => m.VendorsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { permission: 'report.view' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        canActivate: [roleGuard],
        data: { permission: 'user.manage' },
      },
      {
        // No `permission` here on purpose. `stafftrack.view` means "see every
        // staff member", not "reach this page": without it the API scopes the
        // caller to their own attribution rather than refusing them, so the
        // page is reachable by any authenticated user and simply shows less.
        // The parent shell's authGuard still applies, and the server decides
        // what comes back — the route is not what protects anyone's figures.
        path: 'staff-track',
        loadComponent: () =>
          import('./features/staff-track/staff-track.component').then((m) => m.StaffTrackComponent),
      },
      {
        // Declared before the shell's catch-all so a staff link resolves rather
        // than falling through to the 404 page. Requesting somebody else's id
        // without the permission is refused by the API, not by this guard.
        path: 'staff-track/staff/:id',
        loadComponent: () =>
          import('./features/staff-track/staff-detail/staff-detail.component').then(
            (m) => m.StaffDetailComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { permission: 'settings.manage' },
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then((m) => m.AuditComponent),
        canActivate: [roleGuard],
        data: { permission: 'audit.view' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // Any unmatched URL inside the shell renders the module-aware 404 with
      // the sidebar still in place. It sits here rather than at the top level
      // so a bad link keeps its navigation, and it replaces the old silent
      // bounce to the dashboard that made broken links look like they worked.
      {
        path: '**',
        loadComponent: () =>
          import('./features/page-not-found/page-not-found.component').then(
            (m) => m.PageNotFoundComponent
          ),
      },
    ],
  },
];

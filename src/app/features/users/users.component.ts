import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models';
import { SettingsService } from '../../core/services/settings.service';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDropdownComponent],
  template: `
    <div class="users-page-wrapper">
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 1. BREADCRUMBS & PAGE HEADER                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="breadcrumbs-row">
        <span>{{ settingsService.businessName() }}</span>
        <span class="breadcrumb-separator">›</span>
        <span>Administration</span>
        <span class="breadcrumb-separator">›</span>
        <span>Team & Roles</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">User Accounts</span>
      </div>

      <div class="users-header-card">
        <div class="header-left">
          <div class="header-icon-box">
            <span class="material-symbols-outlined">badge</span>
          </div>
          <div>
            <div class="header-title-flex">
              <h1 class="page-title">Users, Cashiers & Staff</h1>
              <span class="status-dot-pill is-active">
                <span class="status-dot"></span>
                <span>{{ activeCount }} Active</span>
              </span>
            </div>
            <div class="header-meta-row">
              <span class="meta-item">
                <span class="material-symbols-outlined meta-icon">manage_accounts</span>
                <span>Role-Based Access Control (RBAC)</span>
              </span>
            </div>
          </div>
        </div>

        <div class="header-action-buttons">
          <button
            type="button"
            (click)="loadUsers()"
            class="action-btn btn-outline-purple"
            title="Refresh user list"
          >
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="exportCSV()"
            class="action-btn btn-outline-purple"
            title="Export CSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            (click)="openAddModal()"
            class="action-btn btn-gradient-purple"
          >
            <span class="material-symbols-outlined">person_add</span>
            <span>+ New User</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 2. SUB-NAVIGATION ROLE TABS                                     -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="module-tabs-bar">
        <button
          type="button"
          (click)="selectedRole = ''; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="selectedRole === ''"
        >
          <span class="material-symbols-outlined">group</span>
          <span>All Users</span>
          <span class="tab-count-badge">{{ users.length }}</span>
        </button>

        <button
          type="button"
          (click)="selectedRole = 'CASHIER'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="selectedRole === 'CASHIER'"
        >
          <span class="material-symbols-outlined">point_of_sale</span>
          <span>Cashiers</span>
          <span class="tab-count-badge">{{ countByRole('CASHIER') }}</span>
        </button>

        <button
          type="button"
          (click)="selectedRole = 'MANAGER'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="selectedRole === 'MANAGER'"
        >
          <span class="material-symbols-outlined">manage_accounts</span>
          <span>Managers</span>
          <span class="tab-count-badge">{{ countByRole('MANAGER') }}</span>
        </button>

        <button
          type="button"
          (click)="selectedRole = 'ADMIN'; currentPage = 1"
          class="module-tab-btn"
          [class.is-active]="selectedRole === 'ADMIN'"
        >
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <span>Admins</span>
          <span class="tab-count-badge">{{ countByRole('ADMIN') }}</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 3. 6 KPI METRIC MINI CARDS STRIP                                -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="kpi-cards-grid">
        <!-- 1. Total Staff -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Total Staff</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">groups</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ users.length }}</span>
            <span class="kpi-pill pill-purple">Members</span>
          </div>
        </div>

        <!-- 2. Active Shifts -->
        <div class="kpi-card card-accent-green">
          <div class="kpi-header-row">
            <span class="kpi-title">Active Shifts</span>
            <span class="kpi-icon-bubble bg-green-tint">
              <span class="material-symbols-outlined">how_to_reg</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-green">{{ activeCount }}</span>
            <span class="kpi-pill pill-live">● Online</span>
          </div>
        </div>

        <!-- 3. Cashiers -->
        <div class="kpi-card card-accent-purple">
          <div class="kpi-header-row">
            <span class="kpi-title">Cashiers</span>
            <span class="kpi-icon-bubble bg-purple-tint">
              <span class="material-symbols-outlined">point_of_sale</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countByRole('CASHIER') }}</span>
            <span class="kpi-pill pill-purple">Front Desk</span>
          </div>
        </div>

        <!-- 4. Admins -->
        <div class="kpi-card card-accent-amber">
          <div class="kpi-header-row">
            <span class="kpi-title">Admins</span>
            <span class="kpi-icon-bubble bg-amber-tint">
              <span class="material-symbols-outlined">shield_person</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ countByRole('ADMIN') }}</span>
            <span class="kpi-pill pill-amber">Superusers</span>
          </div>
        </div>

        <!-- 5. Managers -->
        <div class="kpi-card card-accent-teal">
          <div class="kpi-header-row">
            <span class="kpi-title">Managers</span>
            <span class="kpi-icon-bubble bg-teal-tint">
              <span class="material-symbols-outlined">badge</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number text-teal-700">{{ countByRole('MANAGER') }}</span>
            <span class="kpi-pill pill-teal">Supervisors</span>
          </div>
        </div>

        <!-- 6. Role Groups -->
        <div class="kpi-card card-accent-blue">
          <div class="kpi-header-row">
            <span class="kpi-title">Role Groups</span>
            <span class="kpi-icon-bubble bg-blue-tint">
              <span class="material-symbols-outlined">account_tree</span>
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-number">{{ roles.length || 4 }}</span>
            <span class="kpi-pill pill-blue">RBAC Tiers</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 4. FILTER & SEARCH ACTION TOOLBAR                               -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="filter-toolbar-card">
        <div class="filter-controls-group">
          <!-- Search Box -->
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              title="Search users"
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              placeholder="Search by name, username, email or role..."
              class="toolbar-search-input"
            />
            <button
              *ngIf="searchQuery"
              (click)="searchQuery = ''; currentPage = 1"
              class="search-clear-btn"
              title="Clear search"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Role Selector -->
          <app-custom-dropdown
            [options]="roleOptions"
            [(ngModel)]="selectedRole"
            (valueChange)="currentPage = 1"
            placeholder="All Staff Roles"
            minWidth="200px"
          ></app-custom-dropdown>

          <span class="results-counter-pill">
            Showing {{ filteredUsers.length }} users
          </span>
        </div>

        <div class="filter-actions-group">
          <button
            *ngIf="hasSelectedUsers"
            type="button"
            (click)="deleteSelected()"
            class="action-btn btn-sm btn-outline-danger"
          >
            <span class="material-symbols-outlined text-[17px]">delete</span>
            <span>Delete Selected ({{ selectedCount }})</span>
          </button>

          <button
            type="button"
            (click)="loadUsers()"
            class="action-btn btn-sm btn-outline-purple"
            title="Reload list"
          >
            <span class="material-symbols-outlined text-[17px]">refresh</span>
            <span>Reload</span>
          </button>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- 5. USERS SAAS DATA TABLE                                        -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="table-container-card">
        <div class="table-responsive-wrapper">
          <table class="saas-data-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    title="Select all users"
                    type="checkbox"
                    [(ngModel)]="selectAll"
                    (change)="toggleSelectAll()"
                    class="custom-checkbox"
                  />
                </th>
                <th style="width: 26%;">Name & Username</th>
                <th style="width: 24%;">Email Address</th>
                <th style="width: 15%;">Role / Access</th>
                <th style="width: 13%;">Status</th>
                <th style="width: 14%;">Last Login</th>
                <th style="width: 80px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of paginatedUsers" class="data-row">
                <!-- Checkbox -->
                <td style="text-align: center;">
                  <input
                    title="Select this user"
                    type="checkbox"
                    [(ngModel)]="u.selected"
                    class="custom-checkbox"
                  />
                </td>

                <!-- Name & Avatar -->
                <td>
                  <div class="user-identity-cell">
                    <div class="avatar-wrapper">
                      <div class="user-avatar-bubble">
                        {{ getInitials(u.name) }}
                      </div>
                      <span class="avatar-status-dot" [class.is-active]="u.status === 'ACTIVE'" [class.is-inactive]="u.status !== 'ACTIVE'"></span>
                    </div>
                    <div class="user-names-col">
                      <div class="user-display-name">{{ u.name }}</div>
                      <div class="user-handle">&#64;{{ u.username }}</div>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td>
                  <span class="email-text">{{ u.email }}</span>
                </td>

                <!-- Role Badge -->
                <td>
                  <span
                    class="role-badge"
                    [ngClass]="getRoleBadgeClass(u.role)"
                  >
                    {{ u.role }}
                  </span>
                </td>

                <!-- Status Dot Pill -->
                <td>
                  <span
                    class="status-dot-pill"
                    [ngClass]="u.status === 'ACTIVE' ? 'is-active' : 'is-inactive'"
                  >
                    <span class="status-dot"></span>
                    {{ u.status || 'Active' }}
                  </span>
                </td>

                <!-- Last Login -->
                <td>
                  <span class="last-login-text">
                    {{ u.lastLoginAt ? (u.lastLoginAt | date:'dd/MM/yyyy HH:mm') : 'Never' }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="text-align: center;">
                  <div class="row-actions-flex">
                    <button
                      type="button"
                      (click)="openEditModal(u)"
                      class="btn-action-icon"
                      title="Edit user"
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      *ngIf="u.username !== 'admin'"
                      type="button"
                      (click)="deleteUser(u)"
                      class="btn-action-icon is-danger"
                      title="Delete user"
                    >
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredUsers.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-box">
                    <span class="material-symbols-outlined empty-icon">{{ isLoading ? 'hourglass_top' : loadError ? 'cloud_off' : 'group_off' }}</span>
                    <div class="empty-title">{{ isLoading ? 'Loading…' : loadError ? 'Could not load data' : 'No Staff Accounts Found' }}</div>
                    <p class="empty-desc">{{ isLoading ? 'Fetching records from the server…' : loadError ? loadError : 'No users match your selected role filter or search query.' }}</p>
                    <button type="button" (click)="selectedRole = ''; searchQuery = ''" class="action-btn btn-sm btn-outline-purple mt-2">
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- 6. BOTTOM PAGINATION BAR                                        -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="pagination-footer-bar" *ngIf="filteredUsers.length > 0">
          <div class="pagination-info">
            Showing <strong>{{ paginationStart }}</strong> to <strong>{{ paginationEnd }}</strong> of <strong>{{ filteredUsers.length }}</strong> users
          </div>

          <div class="pagination-controls">
            <button
              type="button"
              [disabled]="currentPage <= 1"
              (click)="currentPage = currentPage - 1"
              class="page-nav-btn"
              title="Previous page"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>

            <button
              type="button"
              *ngFor="let page of pageNumbers"
              (click)="currentPage = page"
              class="page-num-btn"
              [class.is-active]="currentPage === page"
            >
              {{ page }}
            </button>

            <button
              type="button"
              [disabled]="currentPage >= totalPages"
              (click)="currentPage = currentPage + 1"
              class="page-nav-btn"
              title="Next page"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- MODAL DIALOG                                                    -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content p-7 md:p-8 w-full max-w-lg shadow-2xl">
          <div class="flex items-center justify-between pb-4 mb-5 border-b border-[#E9D5FF]">
            <div class="flex items-center gap-3.5">
              <span class="modal-icon-badge">
                <span class="material-symbols-outlined text-2xl">person_add</span>
              </span>
              <div>
                <h3 class="text-xl font-black text-[#2E1065] leading-tight">
                  {{ editingUserId ? 'Edit Staff Account' : 'Create New Staff Account' }}
                </h3>
                <p class="text-xs text-[var(--text-muted)] mt-0.5">Manage operator permissions, roles, and credentials</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showModal = false"
              class="modal-close-btn"
              title="Close"
              aria-label="Close"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveUser()" class="space-y-3.5">
            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Full Name
              </label>
              <input
                title="Full Name"
                type="text"
                [(ngModel)]="form.name"
                name="name"
                placeholder="e.g. Aamir Khan"
                class="form-control text-sm w-full"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3.5 items-start">
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Username
                </label>
                <input
                  title="Username"
                  type="text"
                  [(ngModel)]="form.username"
                  name="username"
                  placeholder="cashier1"
                  class="form-control font-mono text-sm w-full"
                  [disabled]="!!editingUserId"
                  required
                />
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                  Staff Role
                </label>
                <select [(ngModel)]="form.roleId" name="roleId" class="form-control text-sm w-full font-bold">
                  <option *ngFor="let r of roles" [ngValue]="r.id">{{ r.name }}</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Email Address
              </label>
              <input
                title="Email Address"
                type="email"
                [(ngModel)]="form.email"
                name="email"
                placeholder="user@projectx.com"
                class="form-control text-sm w-full"
                [disabled]="!!editingUserId"
                required
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                Phone Number (Optional)
              </label>
              <input
                title="Phone Number (Optional)"
                type="tel"
                [(ngModel)]="form.phone"
                name="phone"
                placeholder="+91 98765 00000"
                class="form-control font-mono text-sm w-full"
              />
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-0 block">
                {{ editingUserId ? 'New Password (Leave blank to keep unchanged)' : 'Password' }}
              </label>
              <input
                [title]="editingUserId ? 'New Password (Leave blank to keep unchanged)' : 'Password'"
                type="password"
                [(ngModel)]="form.password"
                name="password"
                placeholder="••••••••"
                class="form-control font-mono text-sm w-full"
                [required]="!editingUserId"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#E9D5FF]">
              <button
                type="button"
                (click)="showModal = false"
                class="action-btn btn-outline-purple"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="action-btn btn-gradient-purple"
              >
                {{ editingUserId ? 'Save Changes ✓' : 'Create Account ✓' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  public users: (User & { selected?: boolean })[] = [];
  public roles: any[] = [];
  public selectAll = false;
  public selectedRole = '';

  public roleOptions: DropdownOption[] = [
    { value: '', label: 'All Staff Roles', icon: 'groups' },
    { value: 'ADMIN', label: 'System Admins', icon: 'shield_person', description: 'Full system management' },
    { value: 'MANAGER', label: 'Store Managers', icon: 'manage_accounts', description: 'Operations & oversight' },
    { value: 'CASHIER', label: 'Billing Cashiers', icon: 'point_of_sale', description: 'POS billing & counter' },
    { value: 'STAFF', label: 'Service Staff', icon: 'badge', description: 'Dining service & kitchen' },
  ];

  public searchQuery = '';
  public pageSize = 10;
  public currentPage = 1;

  public showModal = false;
  public editingUserId: number | null = null;
  public form: any = {
    name: '',
    username: '',
    email: '',
    phone: '',
    roleId: 3,
    password: '',
    status: 'ACTIVE',
  };

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data;
          if (this.roles.length > 0 && !this.form.roleId) {
            this.form.roleId = this.roles[0].id;
          }
        }
      },
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.loadError = null;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.users = res.data.map((u) => ({ ...u, selected: false }));
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load data from the server.';
      },
    });
  }

  get activeCount(): number {
    return this.users.filter((u) => u.status === 'ACTIVE').length;
  }

  countByRole(role: string): number {
    return this.users.filter((u) => u.role === role).length;
  }

  get hasSelectedUsers(): boolean {
    return this.users.some((u) => u.selected && u.username !== 'admin');
  }

  get selectedCount(): number {
    return this.users.filter((u) => u.selected && u.username !== 'admin').length;
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'role-badge-admin';
      case 'MANAGER':
        return 'role-badge-manager';
      case 'CASHIER':
        return 'role-badge-cashier';
      default:
        return 'role-badge-staff';
    }
  }

  get filteredUsers(): (User & { selected?: boolean })[] {
    let list = this.users;

    if (this.selectedRole) {
      list = list.filter((u) => u.role === this.selectedRole);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  get paginatedUsers(): (User & { selected?: boolean })[] {
    const list = this.filteredUsers;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  toggleSelectAll(): void {
    this.paginatedUsers.forEach((u) => (u.selected = this.selectAll));
  }

  deleteSelected(): void {
    const selected = this.users.filter((u) => u.selected && u.username !== 'admin');
    if (selected.length === 0) {
      this.notify.info('No users selected');
      return;
    }

    this.notify.confirm({
      title: 'Delete Selected Users',
      message: `Are you sure you want to delete ${selected.length} user(s)?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        selected.forEach((u) => {
          this.userService.deleteUser(u.id).subscribe();
        });
        this.notify.success(`Deleted ${selected.length} user(s)`);
        this.loadUsers();
      },
    });
  }

  exportCSV(): void {
    const items = this.filteredUsers;
    const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'Last Login'];
    const rows = items.map((u) => [u.id, `"${u.name}"`, u.username, u.email, u.role, u.status, u.lastLoginAt || 'Never']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notify.success('Staff list exported successfully!');
  }

  openAddModal(): void {
    this.editingUserId = null;
    this.form = {
      name: '',
      username: '',
      email: '',
      phone: '',
      roleId: this.roles.find((r) => r.name === 'CASHIER')?.id || this.roles[0]?.id,
      password: '',
      status: 'ACTIVE',
    };
    this.showModal = true;
  }

  openEditModal(u: any): void {
    this.editingUserId = u.id;
    this.form = {
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      roleId: u.role_id,
      password: '',
      status: u.status,
    };
    this.showModal = true;
  }

  saveUser(): void {
    if (!this.form.name) {
      this.notify.error('Please enter full name');
      return;
    }

    if (this.editingUserId) {
      this.userService.updateUser(this.editingUserId, this.form).subscribe({
        next: () => {
          this.notify.success('User updated successfully');
          this.showModal = false;
          this.loadUsers();
        },
      });
    } else {
      if (!this.form.username || !this.form.email || !this.form.password) {
        this.notify.error('Please fill username, email and password');
        return;
      }
      this.userService.createUser(this.form).subscribe({
        next: () => {
          this.notify.success('User created successfully');
          this.showModal = false;
          this.loadUsers();
        },
      });
    }
  }

  deleteUser(u: User): void {
    this.notify.confirm({
      title: 'Delete User Account',
      message: `Are you sure you want to delete ${u.name} (${u.username})?`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.userService.deleteUser(u.id).subscribe({
          next: () => {
            this.notify.info('User deleted');
            this.loadUsers();
          },
        });
      },
    });
  }
}

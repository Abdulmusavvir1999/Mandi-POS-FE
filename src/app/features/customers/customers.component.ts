import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { CartService } from '../../core/services/cart.service';
import { CustomerLayoutService } from '../../core/services/customer-layout.service';
import { Customer, CustomerNote, CustomerAnalytics, CustomerSummaryKpis } from '../../core/models';
import { CustomDropdownComponent, DropdownOption } from '../../shared/components/custom-dropdown/custom-dropdown.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { DEFAULT_ACTION_BUTTON_CSS } from '../../shared/styles/default-action-buttons.styles';
import { CUSTOMER_LAYOUT_CSS } from '../../shared/styles/customer-layout.styles';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [PageLoaderComponent, CommonModule, FormsModule, RouterLink, CustomDropdownComponent, AppCurrencyPipe],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  styles: [CUSTOMER_LAYOUT_CSS, DEFAULT_ACTION_BUTTON_CSS],
})
export class CustomersComponent implements OnInit {
  public isLoading = false;
  public loadError: string | null = null;
  public settingsService = inject(SettingsService);
  public customerLayout = inject(CustomerLayoutService);
  private customerService = inject(CustomerService);
  private notify = inject(NotificationService);
  private cartService = inject(CartService);
  private router = inject(Router);

  public customers: (Customer & { selected?: boolean })[] = [];
  public crmSummary: CustomerSummaryKpis | null = null;
  public activeNavTab: 'all' | 'vip' | 'frequent' | 'at_risk' | 'new' = 'all';
  public selectAll = false;

  public searchQuery = '';
  public spendingFilter = 'ALL';
  public sortBy = 'name';

  public spendingOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Spenders', icon: 'payments' },
    { value: 'HIGH', label: 'High Spenders (Top Tier)', icon: 'star', description: 'VIP High Value Guests' },
    { value: 'REGULAR', label: 'Regular Spenders', icon: 'loyalty', description: 'Standard Dining Guests' },
  ];

  public sortOptions: DropdownOption[] = [
    { value: 'name', label: 'Sort: Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'spent_desc', label: 'Sort: Highest Spend', icon: 'currency_rupee' },
    { value: 'visits_desc', label: 'Sort: Most Visits', icon: 'repeat' },
    { value: 'recency', label: 'Sort: Recent Visits', icon: 'schedule' },
  ];

  public tierOptions: DropdownOption[] = [
    { value: 'REGULAR', label: 'Regular Diner' },
    { value: 'VIP_SILVER', label: 'VIP Silver' },
    { value: 'VIP_GOLD', label: 'VIP Gold' },
    { value: 'VIP_PLATINUM', label: 'VIP Platinum' },
    { value: 'VIP', label: 'VIP Member' },
  ];

  public noteTypeOptions: DropdownOption[] = [
    { value: 'GENERAL', label: 'General Note', icon: 'notes' },
    { value: 'PREFERENCE', label: 'Preference', icon: 'favorite' },
    { value: 'DIETARY', label: 'Dietary Choice', icon: 'restaurant' },
    { value: 'ALLERGY', label: 'Allergy Alert', icon: 'warning' },
    { value: 'VIP_REQUEST', label: 'VIP Request', icon: 'star' },
  ];

  public pageSize = 10;
  public currentPage = 1;

  // Add / Edit Modal State
  public showModal = false;
  public editingCustomerId: number | null = null;
  public form: any = {
    customer_code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    tier: 'REGULAR',
    image_url: '',
    notes: '',
  };
  public isUploadingImage = false;

  // Customer 360° Drawer State
  public selectedCustomerFor360: Customer | null = null;
  public active360Tab: 'analytics' | 'history' | 'notes' | 'timeline' = 'analytics';
  public customerAnalytics: CustomerAnalytics | null = null;
  public customerNotes: CustomerNote[] = [];
  public purchaseHistory: any[] = [];
  public isLoadingAnalytics = false;
  public isLoadingNotes = false;
  public isLoadingHistory = false;

  // New Note Form inside 360° Drawer
  public newNoteForm = {
    note_type: 'GENERAL',
    note_text: '',
  };
  public isSavingNote = false;
  public noteTypeFilter = 'ALL';

  ngOnInit(): void {
    this.loadCustomers();
    this.loadCrmSummary();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.loadError = null;
    // Fetched unfiltered on purpose - the search box filters this list
    // client-side, so narrowing it here would leave rows missing after the
    // search is cleared, until the next reload.
    this.customerService.getCustomers(1, 250).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.customers = res.data.map((c) => ({ ...c, selected: false }));
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'Unable to load customers from server.';
      },
    });
  }

  loadCrmSummary(): void {
    this.customerService.getCrmSummary().subscribe({
      next: (res) => {
        if (res.success) {
          this.crmSummary = res.data;
        }
      },
      error: () => {},
    });
  }

  // --- KPI & Tier Helpers ---

  get vipCount(): number {
    return this.crmSummary?.vip_customers ?? this.customers.filter((c) => (c.total_spent || 0) >= 2500 || c.tier === 'VIP' || c.tier === 'VIP_GOLD' || c.tier === 'VIP_PLATINUM').length;
  }

  get frequentCount(): number {
    return this.customers.filter((c) => (c.total_visits || 0) >= 5 || c.activity_status === 'FREQUENT').length;
  }

  get atRiskCount(): number {
    return this.crmSummary?.at_risk_customers ?? this.customers.filter((c) => c.activity_status === 'AT_RISK' || ((c.total_visits || 0) >= 2 && (c.days_since_last_visit || 0) > 45)).length;
  }

  get newGuestsCount(): number {
    return this.customers.filter((c) => c.activity_status === 'NEW' || (c.total_visits || 0) <= 1).length;
  }

  get totalVisits(): number {
    return this.customers.reduce((sum, c) => sum + (c.total_visits || 0), 0);
  }

  get totalSpentAll(): number {
    return this.customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  }

  get repeatCustomerPercent(): number {
    if (this.crmSummary) return this.crmSummary.repeat_rate_percent;
    if (this.customers.length === 0) return 0;
    const repeat = this.customers.filter((c) => (c.total_visits || 0) > 1).length;
    return Math.round((repeat / this.customers.length) * 100);
  }

  get avgSpend(): number {
    if (this.crmSummary) return this.crmSummary.store_avg_order_value;
    return this.customers.length === 0 ? 0 : this.totalSpentAll / this.customers.length;
  }

  getTier(c: Customer): string {
    if (c.tier === 'VIP_PLATINUM' || (c.total_spent || 0) >= 15000) return 'VIP Platinum';
    if (c.tier === 'VIP_GOLD' || (c.total_spent || 0) >= 5000) return 'VIP Gold';
    if (c.tier === 'VIP_SILVER' || (c.total_spent || 0) >= 2500) return 'VIP Silver';
    if (c.tier === 'VIP') return 'VIP Member';
    if ((c.total_visits || 0) >= 5) return 'Regular';
    return 'New Guest';
  }

  getTierBg(c: Customer): string {
    const tier = this.getTier(c);
    if (tier.includes('Platinum')) return 'var(--primary-light, #F3E8FF)';
    if (tier.includes('Gold')) return 'var(--warning-light, #FEF3C7)';
    if (tier.includes('Silver')) return 'var(--card-hover, #F1F5F9)';
    if (tier.includes('VIP')) return '#FDF2F8';
    if (tier.includes('Regular')) return '#CCFBF1';
    return '#F3F4F6';
  }

  getTierColor(c: Customer): string {
    const tier = this.getTier(c);
    if (tier.includes('Platinum')) return 'var(--primary, #7E22CE)';
    if (tier.includes('Gold')) return 'var(--warning, #B45309)';
    if (tier.includes('Silver')) return '#475569';
    if (tier.includes('VIP')) return '#BE185D';
    if (tier.includes('Regular')) return '#0F766E';
    return 'var(--text-muted, #6B7280)';
  }

  getActivityBadge(c: Customer): { label: string; bg: string; color: string; icon: string } {
    const status = c.activity_status || 'ACTIVE';
    if (status === 'FREQUENT') {
      return { label: 'Frequent Diner', bg: 'var(--success-light, #DCFCE7)', color: 'var(--success, #15803D)', icon: 'trending_up' };
    }
    if (status === 'AT_RISK') {
      return { label: 'At-Risk Diner', bg: 'var(--danger-light, #FEE2E2)', color: 'var(--danger, #B91C1C)', icon: 'warning' };
    }
    if (status === 'DORMANT') {
      return { label: 'Dormant (>90d)', bg: '#F3F4F6', color: 'var(--text-muted, #6B7280)', icon: 'schedule' };
    }
    if (status === 'NEW') {
      return { label: 'New Diner', bg: '#E0E7FF', color: '#4338CA', icon: 'fiber_new' };
    }
    return { label: 'Active Guest', bg: 'var(--card-border, #E9D5FF)', color: 'var(--primary, #7E22CE)', icon: 'check_circle' };
  }

  get filteredCustomers(): (Customer & { selected?: boolean })[] {
    let list = this.customers;

    // Segment tab filtering
    if (this.activeNavTab === 'vip') {
      list = list.filter((c) => (c.total_spent || 0) >= 2500 || c.tier === 'VIP' || c.tier === 'VIP_GOLD' || c.tier === 'VIP_PLATINUM');
    } else if (this.activeNavTab === 'frequent') {
      list = list.filter((c) => (c.total_visits || 0) >= 5 || c.activity_status === 'FREQUENT');
    } else if (this.activeNavTab === 'at_risk') {
      list = list.filter((c) => c.activity_status === 'AT_RISK' || ((c.total_visits || 0) >= 2 && (c.days_since_last_visit || 0) > 45));
    } else if (this.activeNavTab === 'new') {
      list = list.filter((c) => c.activity_status === 'NEW' || (c.total_visits || 0) <= 1);
    }

    // Search query filtering
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }

    // Spend filter
    if (this.spendingFilter === 'HIGH') {
      list = list.filter((c) => (c.total_spent || 0) >= 2500);
    } else if (this.spendingFilter === 'REGULAR') {
      list = list.filter((c) => (c.total_spent || 0) < 2500);
    }

    // Sorting
    if (this.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy === 'spent_desc') {
      list = [...list].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
    } else if (this.sortBy === 'visits_desc') {
      list = [...list].sort((a, b) => (b.total_visits || 0) - (a.total_visits || 0));
    } else if (this.sortBy === 'recency') {
      list = [...list].sort((a, b) => (a.days_since_last_visit ?? 999) - (b.days_since_last_visit ?? 999));
    }

    return list;
  }

  /**
   * The current page, never past the end of the filtered list.
   *
   * Deleting the last rows on the final page, or any refresh that returns
   * fewer records, used to leave `currentPage` pointing past the end and the
   * table rendering empty. Clamped on read rather than written back, so it
   * cannot fire a change-after-checked error during rendering.
   */
  get safePage(): number {
    return Math.min(Math.max(1, this.currentPage), this.totalPages);
  }

  get paginatedCustomers(): (Customer & { selected?: boolean })[] {
    const list = this.filteredCustomers;
    const start = (this.safePage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredCustomers.length === 0 ? 0 : (this.safePage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.safePage * this.pageSize, this.filteredCustomers.length);
  }

  getInitials(name: string): string {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  toggleSelectAll(): void {
    this.paginatedCustomers.forEach((c) => (c.selected = this.selectAll));
  }

  // --- Customer 360° Drawer Methods ---

  openCustomer360(c: Customer, tab: 'analytics' | 'history' | 'notes' | 'timeline' = 'analytics'): void {
    this.selectedCustomerFor360 = c;
    this.active360Tab = tab;
    this.load360Details(c.id);
  }

  closeCustomer360(): void {
    this.selectedCustomerFor360 = null;
    this.customerAnalytics = null;
    this.customerNotes = [];
    this.purchaseHistory = [];
  }

  load360Details(customerId: number): void {
    // 1. Analytics
    this.isLoadingAnalytics = true;
    this.customerService.getCustomerAnalytics(customerId).subscribe({
      next: (res) => {
        this.isLoadingAnalytics = false;
        if (res.success) {
          this.customerAnalytics = res.data;
        }
      },
      error: () => {
        this.isLoadingAnalytics = false;
      },
    });

    // 2. Notes
    this.isLoadingNotes = true;
    this.customerService.getCustomerNotes(customerId).subscribe({
      next: (res) => {
        this.isLoadingNotes = false;
        if (res.success) {
          this.customerNotes = res.data;
        }
      },
      error: () => {
        this.isLoadingNotes = false;
      },
    });

    // 3. Purchase History
    this.isLoadingHistory = true;
    this.customerService.getPurchaseHistory(customerId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        if (res.success) {
          this.purchaseHistory = res.data;
        }
      },
      error: () => {
        this.isLoadingHistory = false;
      },
    });
  }

  get filteredNotes(): CustomerNote[] {
    if (this.noteTypeFilter === 'ALL') return this.customerNotes;
    return this.customerNotes.filter((n) => n.note_type === this.noteTypeFilter);
  }

  addCustomerNote(): void {
    if (!this.selectedCustomerFor360 || !this.newNoteForm.note_text.trim()) {
      this.notify.error('Please enter note text');
      return;
    }

    this.isSavingNote = true;
    this.customerService.createCustomerNote(this.selectedCustomerFor360.id, this.newNoteForm).subscribe({
      next: (res) => {
        this.isSavingNote = false;
        if (res.success) {
          this.notify.success('Note added successfully');
          this.newNoteForm.note_text = '';
          this.customerNotes.unshift(res.data);
        }
      },
      error: (err) => {
        this.isSavingNote = false;
        this.notify.error(err?.error?.message || 'Failed to save note');
      },
    });
  }

  deleteNote(note: CustomerNote): void {
    if (!this.selectedCustomerFor360) return;
    this.customerService.deleteCustomerNote(this.selectedCustomerFor360.id, note.id).subscribe({
      next: () => {
        this.notify.info('Note removed');
        this.customerNotes = this.customerNotes.filter((n) => n.id !== note.id);
      },
      error: () => {
        this.notify.error('Failed to remove note');
      },
    });
  }

  getNoteBadgeStyle(type: string): { bg: string; color: string; icon: string; border: string } {
    switch (type) {
      case 'ALLERGY':
        return { bg: 'var(--danger-light, #FEE2E2)', color: 'var(--danger, #DC2626)', icon: 'warning', border: '#FCA5A5' };
      case 'DIETARY':
        return { bg: 'var(--success-light, #DCFCE7)', color: 'var(--success, #16A34A)', icon: 'eco', border: '#86EFAC' };
      case 'VIP_REQUEST':
        return { bg: 'var(--warning-light, #FEF3C7)', color: 'var(--warning, #D97706)', icon: 'star', border: 'var(--warning-light, #FDE68A)' };
      case 'PREFERENCE':
        return { bg: '#EDE9FE', color: 'var(--primary, #7E22CE)', icon: 'favorite', border: '#DDD6FE' };
      default:
        return { bg: '#F3F4F6', color: 'var(--text-muted, #4B5563)', icon: 'notes', border: '#E5E7EB' };
    }
  }

  getMaxMonthlySpend(): number {
    if (!this.customerAnalytics?.monthly_spending || this.customerAnalytics.monthly_spending.length === 0) return 1;
    return Math.max(...this.customerAnalytics.monthly_spending.map((m) => Number(m.total_spent || 0)), 1);
  }

  startPosOrder(customer: Customer): void {
    this.cartService.selectedCustomer.set(customer);
    this.notify.success(`Customer ${customer.name} attached to new POS ticket`);
    this.router.navigate(['/pos']);
  }

  // --- Add / Edit Customer Form & Actions ---

  openAddModal(): void {
    this.editingCustomerId = null;
    this.form = {
      customer_code: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      tier: 'REGULAR',
      image_url: '',
      notes: '',
    };
    this.isUploadingImage = false;
    this.showModal = true;
  }

  openEditModal(c: Customer): void {
    this.editingCustomerId = c.id;
    this.form = {
      customer_code: c.customer_code || '',
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      tier: c.tier || 'REGULAR',
      image_url: c.image_url || '',
      notes: c.notes || '',
    };
    this.isUploadingImage = false;
    this.showModal = true;
  }

  saveCustomer(): void {
    if (!this.form.name || !this.form.phone) {
      this.notify.error('Please enter customer name and phone');
      return;
    }

    if (this.editingCustomerId) {
      this.customerService.updateCustomer(this.editingCustomerId, this.form).subscribe({
        next: () => {
          this.notify.success('Customer updated successfully');
          this.showModal = false;
          this.loadCustomers();
          this.loadCrmSummary();
        },
        error: (err) => {
          this.notify.error(err?.error?.message || 'Failed to update customer');
        },
      });
    } else {
      this.customerService.createCustomer(this.form).subscribe({
        next: () => {
          this.notify.success('Customer registered successfully');
          this.showModal = false;
          this.loadCustomers();
          this.loadCrmSummary();
        },
        error: (err) => {
          this.notify.error(err?.error?.message || 'Failed to register customer');
        },
      });
    }
  }

  deleteCustomer(c: Customer): void {
    this.notify.confirm({
      title: 'Delete Customer',
      message: `Are you sure you want to delete profile for ${c.name}? All history will be archived.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        this.customerService.deleteCustomer(c.id).subscribe({
          next: () => {
            this.notify.info('Customer removed');
            if (this.selectedCustomerFor360?.id === c.id) {
              this.closeCustomer360();
            }
            this.loadCustomers();
            this.loadCrmSummary();
          },
          error: (err) => {
            this.notify.error(err?.error?.message || 'Failed to delete customer');
          },
        });
      },
    });
  }

  onPhotoFile(event: Event, picker: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    picker.value = '';
    if (!file) return;

    const types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!types.includes(file.type)) {
      this.notify.error('Customer photo must be a PNG, JPG, WEBP or GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error(`Customer photo is ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum allowed is 2 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.isUploadingImage = false;
      this.notify.error(`Could not read ${file.name}.`);
    };
    reader.onload = () => {
      this.customerService.uploadCustomerImage(String(reader.result)).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.form.image_url = res.data.url;
            this.notify.success('Photo uploaded — save to apply it.');
          } else {
            this.notify.error(res?.message || 'Photo upload failed.');
          }
        },
        error: (err) => {
          this.isUploadingImage = false;
          this.notify.error(err?.error?.message || 'Photo upload failed.');
        },
      });
    };

    this.isUploadingImage = true;
    reader.readAsDataURL(file);
  }

  exportCSV(): void {
    const items = this.filteredCustomers;
    const headers = ['Code', 'Name', 'Phone', 'Email', 'Address', 'Tier', 'Activity', 'Visits', 'Total Spent', 'AOV', 'Last Visit'];
    const rows = items.map((c) => [
      `"${c.customer_code || ('CUST-' + c.id)}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.address || ''}"`,
      `"${this.getTier(c)}"`,
      `"${c.activity_status || 'ACTIVE'}"`,
      c.total_visits || 0,
      c.total_spent || 0,
      c.avg_order_value || (c.total_visits ? Math.round(c.total_spent / c.total_visits) : 0),
      `"${c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : 'N/A'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customers_CRM_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Per-module content for the 404 page.
 *
 * Keyed by the first URL segment, which is also the sidebar route - so
 * `/orders/9999` resolves to the Orders entry and `/nothing/here` falls back to
 * DEFAULT. Adding a module means adding one entry plus its illustration; there
 * is deliberately no second PageNotFound component anywhere.
 */
export interface PageNotFoundModule {
  /** File under `assets/page-not-found/`. */
  image: string;
  /** Sidebar label, used in the heading and the back button. */
  label: string;
  title: string;
  message: string;
  backLabel: string;
  /** Where the back button goes; null means "use browser history". */
  backRoute: string | null;
}

export const PAGE_NOT_FOUND_DEFAULT: PageNotFoundModule = {
  image: 'assets/page-not-found/default.svg',
  label: 'Page',
  title: 'Page Not Found',
  message: "The page you're looking for doesn't exist or may have been moved.",
  backLabel: 'Go Back',
  backRoute: null,
};

export const PAGE_NOT_FOUND_CONFIG: Record<string, PageNotFoundModule> = {
  // ─── MAIN ───
  dashboard: {
    image: 'assets/page-not-found/dashboard.svg',
    label: 'Dashboard',
    title: 'Dashboard Page Not Found',
    message: "The dashboard page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Dashboard',
    backRoute: '/dashboard',
  },
  pos: {
    image: 'assets/page-not-found/pos-billing.svg',
    label: 'POS Billing',
    title: 'POS Billing Page Not Found',
    message: "The billing page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to POS Billing',
    backRoute: '/pos',
  },
  orders: {
    image: 'assets/page-not-found/orders.svg',
    label: 'Orders',
    title: 'Orders Page Not Found',
    message: "The orders page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Orders',
    backRoute: '/orders',
  },
  dining: {
    image: 'assets/page-not-found/dining-floor.svg',
    label: 'Dining Floor',
    title: 'Dining Floor Page Not Found',
    message: "The dining floor page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Dining Floor',
    backRoute: '/dining',
  },
  queue: {
    image: 'assets/page-not-found/queue.svg',
    label: 'Queue',
    title: 'Queue Page Not Found',
    message: "The queue page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Queue',
    backRoute: '/queue',
  },

  // ─── MANAGEMENT ───
  products: {
    image: 'assets/page-not-found/products.svg',
    label: 'Products',
    title: 'Products Page Not Found',
    message: "The products page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Products',
    backRoute: '/products',
  },
  categories: {
    image: 'assets/page-not-found/categories.svg',
    label: 'Categories',
    title: 'Categories Page Not Found',
    message: "The categories page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Categories',
    backRoute: '/categories',
  },
  stock: {
    image: 'assets/page-not-found/stock-ledger.svg',
    label: 'Stock Ledger',
    title: 'Stock Ledger Page Not Found',
    message: "The stock ledger page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Stock Ledger',
    backRoute: '/stock',
  },
  customers: {
    image: 'assets/page-not-found/customers.svg',
    label: 'Customers',
    title: 'Customers Page Not Found',
    message: "The customers page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Customers',
    backRoute: '/customers',
  },
  bills: {
    image: 'assets/page-not-found/sales-bills.svg',
    label: 'Sales Bills',
    title: 'Sales Bills Page Not Found',
    message: "The sales bills page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Sales Bills',
    backRoute: '/bills',
  },

  // ─── ADMINISTRATION ───
  reports: {
    image: 'assets/page-not-found/reports-analytics.svg',
    label: 'Reports & Analytics',
    title: 'Reports & Analytics Page Not Found',
    message: "The reports page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Reports & Analytics',
    backRoute: '/reports',
  },
  users: {
    image: 'assets/page-not-found/staff-roles.svg',
    label: 'Staff & Roles',
    title: 'Staff & Roles Page Not Found',
    message: "The staff page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Staff & Roles',
    backRoute: '/users',
  },
  audit: {
    image: 'assets/page-not-found/audit-trail.svg',
    label: 'Audit Trail',
    title: 'Audit Trail Page Not Found',
    message: "The audit trail page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Audit Trail',
    backRoute: '/audit',
  },
  settings: {
    image: 'assets/page-not-found/pos-settings.svg',
    label: 'POS Settings',
    title: 'POS Settings Page Not Found',
    message: "The settings page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to POS Settings',
    backRoute: '/settings',
  },

  // Draft Bills is not its own sidebar entry, but it is a reachable route and
  // reads as billing, so it borrows the Sales Bills artwork.
  'draft-bills': {
    image: 'assets/page-not-found/sales-bills.svg',
    label: 'Draft Bills',
    title: 'Draft Bills Page Not Found',
    message: "The draft bills page you're looking for doesn't exist or may have been moved.",
    backLabel: 'Back to Draft Bills',
    backRoute: '/draft-bills',
  },
};

/**
 * Resolves a URL to its module entry. Query strings, fragments and a leading
 * slash are stripped first, so `/orders/99?tab=x` still matches `orders`.
 */
export function resolvePageNotFoundModule(url: string): PageNotFoundModule {
  const path = (url || '').split(/[?#]/)[0];
  const segment = path.split('/').filter(Boolean)[0] || '';
  return PAGE_NOT_FOUND_CONFIG[segment.toLowerCase()] || PAGE_NOT_FOUND_DEFAULT;
}

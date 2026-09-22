/**
 * The sidebar's menu, as shipped.
 *
 * It lives here rather than inside SidebarComponent because two screens need
 * it: the rail that renders it, and the Settings page that lets an operator
 * rename every row. Settings cannot import the rail's own copy without
 * dragging the whole component in, and keeping two copies in step by hand is
 * exactly the kind of drift that leaves a renamed module showing its old name
 * in one place.
 *
 * `id` is the stable handle. Renames are stored against it, never against the
 * label, so a row keeps its custom name when the shipped wording changes and
 * an id that disappears simply drops its override.
 */

export interface NavItem {
  id: string;
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  iconName: string;
  badge?: string;
  permission?: string;
  roles?: string[];
  isPos?: boolean;
}

export interface NavSection {
  /** Stable handle for the section, used the same way item ids are. */
  id: string;
  title: string;
  items: NavItem[];
}

export const SIDEBAR_NAV_SECTIONS: NavSection[] = [
  {
    id: 'pos-operations',
    title: 'POS COUNTER & OPERATIONS',
    items: [
      {
        id: 'pos',
        label: 'POS Billing',
        route: '/pos',
        iconName: 'point_of_sale',
        badge: 'F1',
        permission: 'pos.billing',
        isPos: true,
      },
      {
        id: 'orders',
        label: 'Order Details',
        route: '/orders',
        iconName: 'receipt_long',
        permission: 'order.manage',
      },
      {
        id: 'dining',
        label: 'Dining & Tables',
        route: '/dining',
        iconName: 'table_restaurant',
        permission: 'dining.manage',
      },
      {
        id: 'queue',
        label: 'Takeaway Queue',
        route: '/queue',
        iconName: 'takeout_dining',
        permission: 'queue.manage',
      },
      {
        id: 'drafts',
        label: 'Held Drafts',
        route: '/draft-bills',
        iconName: 'drafts',
        permission: 'pos.hold_bill',
      },
    ],
  },
  {
    id: 'catalog-inventory',
    title: 'CATALOG & INVENTORY',
    items: [
      {
        id: 'dashboard',
        label: 'Live Dashboard',
        route: '/dashboard',
        iconName: 'dashboard',
        permission: 'dashboard.view',
      },
      {
        id: 'products',
        label: 'Dishes & Products',
        route: '/products',
        iconName: 'inventory_2',
        permission: 'product.manage',
      },
      {
        id: 'categories',
        label: 'Categories',
        route: '/categories',
        iconName: 'category',
        permission: 'category.manage',
      },
      {
        id: 'stock',
        label: 'Stock Ledger',
        route: '/stock',
        iconName: 'warehouse',
        permission: 'stock.view',
      },
      {
        id: 'vendors',
        label: 'Vendor Management',
        route: '/vendors',
        iconName: 'local_shipping',
      },
      {
        id: 'customers',
        label: 'Customers',
        route: '/customers',
        iconName: 'group',
        permission: 'customer.view',
      },
      {
        id: 'bills',
        label: 'Sales Bills',
        route: '/bills',
        iconName: 'receipt',
        permission: 'bill.view',
      },
    ],
  },
  {
    id: 'administration',
    title: 'ADMINISTRATION',
    items: [
      {
        id: 'reports',
        label: 'Reports & Analytics',
        route: '/reports',
        iconName: 'analytics',
        permission: 'reports.view',
      },
      {
        id: 'users',
        label: 'Staff & Roles',
        route: '/users',
        iconName: 'manage_accounts',
        permission: 'user.manage',
      },
      {
        // Deliberately unpermissioned: `stafftrack.view` widens this page to
        // the whole roster, it does not unlock it. Every authenticated user
        // has their own activity to look at, and the API returns only that
        // much without the permission, so hiding the row would conceal a
        // page they are entitled to rather than protect anything.
        id: 'staff-track',
        label: 'Staff Track',
        route: '/staff-track',
        iconName: 'groups',
      },
      {
        id: 'audit',
        label: 'Audit Trail',
        route: '/audit',
        iconName: 'history',
        permission: 'audit.view',
      },
      {
        id: 'master-data',
        label: 'Master Data',
        route: '/master-data',
        iconName: 'database',
      },
      {
        id: 'settings',
        label: 'POS Settings',
        route: '/settings',
        iconName: 'settings',
        permission: 'settings.manage',
      },
    ],
  },
];

/** The shortcut templates with the quickActions capability surface. */
export const SIDEBAR_ALERTS_SHORTCUT: NavItem = {
  id: 'quick-alerts',
  label: 'Alerts',
  route: '/orders',
  iconName: 'notifications',
  permission: 'order.manage',
};

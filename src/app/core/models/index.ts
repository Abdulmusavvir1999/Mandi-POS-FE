export type RoleName = string;

export type OrderType = 'WALK_IN' | 'TAKEAWAY' | 'DINING';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TableStatus = 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'UNAVAILABLE';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'OTHER';

export interface Permission {
  id: number;
  code: string;
  module: string;
  description?: string;
  selected?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  /** 1 for built-in roles, which are exempt from the manual role limit. */
  is_system?: number;
  user_count?: number;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phone?: string;
  role: RoleName;
  role_id?: number;
  role_name?: string;
  status?: string;
  lastLoginAt?: string;
  last_login_at?: string;
  permissions: string[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  display_order: number;
  status: 'ACTIVE' | 'INACTIVE';
  product_count?: number;
}

/** A portion of a dish: its own price, and how much stock one sale consumes. */
export interface ProductVariant {
  id: number;
  product_id?: number;
  name: string;
  selling_price: number;
  stock_consumption: number;
  display_order?: number;
  is_default?: boolean | number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  sku: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  stock_quantity: number;
  current_stock: number;
  low_stock_threshold: number;
  min_stock_alert?: number;
  is_available: number | boolean;
  status: 'ACTIVE' | 'INACTIVE';
  /** Portions this dish is sold in. Empty means it sells as a single item. */
  variants?: ProductVariant[];
  /** Balance of the linked stock ledger item, which variants consume from. */
  linked_stock_quantity?: number;
  linked_unit_type?: string;
  linked_stock_code?: string;
  linked_avg_cost?: number;
  linked_min_alert?: number;
  linked_stock_status?: string;
  /** Held against open orders; available = current_stock - reserved_stock. */
  reserved_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  total_visits: number;
  total_spent: number;
  created_at?: string;
}

export interface DiningTable {
  id: number;
  table_number: string;
  name: string;
  section: string;
  capacity: number;
  status: TableStatus;
  current_order_id?: number | null;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  order_start_time?: string;
  order_current_total?: number;
  display_order: number;
}

export interface CartItem {
  /**
   * Stable line key. A dish sold as Full and as Half is two separate lines,
   * so the cart can no longer be keyed on product id alone.
   */
  lineId: string;
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
  notes?: string;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  dining_table_id?: number | null;
  table_number?: string;
  table_name?: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_type: 'FIXED' | 'PERCENTAGE';
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_by_name?: string;
  item_count?: number;
  items?: OrderItem[];
  history?: OrderHistoryItem[];
  bill_number?: string;
  bill_id?: number;
  payment_status?: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  sku?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
}

export interface OrderHistoryItem {
  id: number;
  previous_status?: string;
  new_status: string;
  changed_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface DraftBill {
  id: number;
  draft_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  dining_table_id?: number;
  table_number?: string;
  table_name?: string;
  order_type: OrderType;
  discount_type: 'FIXED' | 'PERCENTAGE';
  discount_value: number;
  notes?: string;
  created_by_name?: string;
  item_count: number;
  subtotal: number;
  items?: any[];
  created_at: string;
}

export interface Bill {
  id: number;
  bill_number: string;
  order_id: number;
  order_number?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  dining_table_id?: number;
  table_number?: string;
  cashier_id: number;
  cashier_name?: string;
  order_type: OrderType;
  subtotal: number;
  discount_type: 'FIXED' | 'PERCENTAGE';
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: PaymentMethod;
  notes?: string;
  printed_count: number;
  items?: BillItem[];
  payments?: any[];
  created_at: string;
}

export interface BillItem {
  id: number;
  product_id: number;
  product_name: string;
  sku?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface QueueToken {
  id: number;
  queue_number: string;
  order_id?: number;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  token_type: string;
  estimated_minutes: number;
  total_amount?: number;
  order_type?: string;
  created_at: string;
}

export type StockUnitType = 'piece' | 'kg' | 'liter' | 'gram' | 'box' | 'packet' | 'portion' | 'other';
export type StockEntryStatus = 'draft' | 'posted' | 'cancelled';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return' | 'wastage' | 'transfer_in' | 'transfer_out';

export interface StockItem {
  id: number;
  uuid?: string;
  stock_code: string;
  name: string;
  unit_type: StockUnitType;
  current_quantity: number;
  current_value: number;
  average_unit_price: number;
  status: 'active' | 'inactive';
  min_stock_alert: number;
  product_id?: number | null;
  product_name?: string;
  sku?: string;
  category_name?: string;
  selling_price?: number;
  cost_price?: number;
  current_stock?: number;
  is_low_stock?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface StockEntry {
  id: number;
  uuid: string;
  stock_item_id: number;
  stock_item_name?: string;
  stock_code?: string;
  unit_type?: StockUnitType;
  entry_number: string;
  entry_date: string;
  quantity: number;
  multiplier: number;
  total_quantity: number;
  total_price: number;
  unit_price: number;
  status: StockEntryStatus;
  supplier?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  created_by?: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  uuid: string;
  stock_item_id: number;
  stock_item_name?: string;
  stock_code?: string;
  unit_type?: StockUnitType;
  movement_type: StockMovementType;
  reference_type: string;
  reference_id?: string | null;
  quantity: number;
  unit_price: number;
  total_value: number;
  balance_quantity: number;
  balance_value: number;
  movement_date: string;
  notes?: string | null;
  created_by?: number | null;
  created_by_name?: string;
  created_at: string;
  // Compatibility fields
  product_name?: string;
  transaction_type?: string;
  previous_stock?: number;
  new_stock?: number;
}

export interface StockTransaction extends StockMovement {}

export interface StockSummaryMetrics {
  totalItems: number;
  totalUnits: number;
  totalValuation: number;
  lowStockCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    details?: any;
  };
}

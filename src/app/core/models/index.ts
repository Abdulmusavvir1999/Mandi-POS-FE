export type RoleName = string;

/**
 * The two ways an order leaves the counter.
 *
 * Walk-in, pickup and counter were separate values once. They described how
 * the customer arrived rather than how the order is served, and nothing in
 * the kitchen, the receipt or the reports ever treated them differently, so
 * they are all TAKEAWAY now. DINING keeps its original spelling because it is
 * the value already written to every dine-in row in every deployed database.
 */
export type OrderType = 'DINING' | 'TAKEAWAY';

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TableStatus = 'AVAILABLE' | 'SELECTED' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'UNAVAILABLE';

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OTHER';

export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'VOIDED';

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
  image_url?: string;
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
  /** Ledger item this portion draws from; null uses the dish's common source. */
  stock_item_id?: number | null;
  stock_item_name?: string;
  stock_item_code?: string;
  stock_item_unit?: string;
  stock_item_quantity?: number;
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
  /** Dish-level (COMMON mode) source, and which mode the editor is in. */
  stock_item_id?: number | null;
  variant_stock_mode?: 'COMMON' | 'EACH';
  resolved_stock_item_id?: number | null;
  linked_avg_cost?: number;
  linked_min_alert?: number;
  linked_stock_status?: string;
  addons?: ProductAddon[];
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  customer_code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  image_url?: string;
  loyalty_points?: number;
  status: 'ACTIVE' | 'INACTIVE';
  total_visits: number;
  total_spent: number;
  last_visit_at?: string;
  days_since_last_visit?: number;
  avg_order_value?: number;
  activity_status?: 'ACTIVE' | 'FREQUENT' | 'AT_RISK' | 'DORMANT' | 'NEW';
  created_at?: string;
  updated_at?: string;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  user_id?: number | null;
  author_name?: string;
  user_full_name?: string;
  note_type: 'GENERAL' | 'PREFERENCE' | 'DIETARY' | 'ALLERGY' | 'VIP_REQUEST';
  note_text: string;
  created_at: string;
}

export interface CustomerAnalytics {
  customer: Customer;
  summary: {
    total_orders: number;
    total_spent: number;
    avg_order_value: number;
    first_visit_at: string | null;
    last_visit_at: string | null;
    days_since_last_visit: number;
    frequency_category: 'FIRST_TIME' | 'REGULAR' | 'FREQUENT' | 'VERY_FREQUENT';
    activity_status: string;
  };
  favorite_items: Array<{
    product_name: string;
    product_id: number;
    total_qty: number;
    total_spent: number;
    last_ordered_at: string;
  }>;
  monthly_spending: Array<{
    month_key: string;
    order_count: number;
    total_spent: number;
  }>;
  order_type_breakdown: Array<{
    order_type: string;
    count: number;
    total_amount: number;
  }>;
  recent_orders: Array<{
    id: number;
    bill_number: string;
    order_type: string;
    payment_method: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
  }>;
}

export interface CustomerSummaryKpis {
  total_customers: number;
  active_customers: number;
  vip_customers: number;
  at_risk_customers: number;
  store_avg_order_value: number;
  repeat_rate_percent: number;
}

export interface DiningTable {
  id: number;
  table_number: string;
  name: string;
  section: string;
  capacity: number;
  active_guest_count?: number;
  status: TableStatus;
  current_order_id?: number | null;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  order_start_time?: string;
  seated_at?: string | null;
  cleaning_started_at?: string | null;
  reservation_id?: number | null;
  reservation_customer?: string | null;
  reservation_time?: string | null;
  reservation_guests?: number | null;
  elapsed_minutes?: number;
  cleaning_minutes?: number;
  order_current_total?: number;
  display_order: number;
}

export interface TableReservation {
  id: number;
  uuid: string;
  reservation_code: string;
  table_id?: number | null;
  table_number?: string;
  table_name?: string;
  table_section?: string;
  table_capacity?: number;
  customer_name: string;
  customer_phone: string;
  guest_count: number;
  reservation_time: string;
  preferred_section?: string;
  special_requests?: string;
  status: 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
  created_at?: string;
}

export interface TableHistoryItem {
  order_id: number;
  order_number: string;
  order_type: string;
  order_status: string;
  total_amount: number;
  order_start_time: string;
  order_date?: string;
  order_end_time?: string;
  duration_minutes?: number;
  bill_number?: string;
  payment_method?: string;
  staff_name?: string;
  waiter_name?: string;
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
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
  isComplimentary?: boolean;
  complimentaryReason?: string;
  itemType?: 'PRODUCT' | 'COMBO';
  comboId?: number;
  selectedAddons?: ProductAddon[];
}

export interface PosDayClosing {
  id: number;
  closing_number: string;
  user_id: number;
  cashier_name?: string;
  opening_time: string;
  closing_time: string;
  opening_cash: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_upi_sales: number;
  total_online_sales: number;
  gross_sales: number;
  total_discounts: number;
  total_tax: number;
  total_service_charges: number;
  total_bills_count: number;
  void_bills_count: number;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
  cash_difference?: number;
  total_orders?: number;
  net_sales?: number;
  closing_date?: string;
  notes?: string;
  created_at?: string;
}

export interface PrinterConfig {
  receiptPrinter: {
    enabled: boolean;
    name: string;
    paperWidth: '80mm' | '58mm';
    autoPrintOnCheckout: boolean;
  };
  kitchenPrinter: {
    enabled: boolean;
    name: string;
    paperWidth: '80mm' | '58mm';
    autoPrintKot: boolean;
  };
  barPrinter: {
    enabled: boolean;
    name: string;
    paperWidth: '80mm' | '58mm';
    autoPrintKot: boolean;
  };
}

export interface OfflineOrder {
  offlineSyncId: string;
  orderNumber: string;
  billNumber: string;
  timestamp: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  customerId?: number | null;
  customerName?: string;
  diningTableId?: number | null;
  tableNumber?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  surchargeAmount: number;
  couponCode?: string;
  couponDiscount: number;
  grandTotal: number;
  cashTendered?: number;
  changeReturned?: number;
  paymentReference?: string;
  notes?: string;
  isSynced: boolean;
  syncedAt?: string;
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
  payment_reference?: string;
  service_charge_amount?: number;
  surcharge_amount?: number;
  coupon_code?: string;
  coupon_discount?: number;
  cash_tendered?: number;
  change_returned?: number;
  is_voided?: boolean | number;
  void_reason?: string;
  void_by?: number;
  void_at?: string;
  is_reopened?: boolean | number;
  reopened_from_bill_id?: number;
  reopened_at?: string;
  offline_sync_id?: string;
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
  reorder_level?: number;
  reorder_quantity?: number;
  max_stock_threshold?: number;
  shelf_life_days?: number;
  product_id?: number | null;
  product_name?: string;
  sku?: string;
  category_name?: string;
  selling_price?: number;
  cost_price?: number;
  current_stock?: number;
  is_low_stock?: boolean | number;
  /** Supplier this item is normally ordered from. Null on rows created
   *  before stock_item_default_vendor.sql, which the UI reads as "not set". */
  default_vendor_id?: number | null;
  default_vendor_name?: string | null;
  default_vendor_code?: string | null;
  default_vendor_status?: string | null;
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
  /** Name snapshot at purchase time; survives the vendor being renamed. */
  supplier?: string | null;
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

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type PaymentTermsType = 'COD' | 'ADVANCE' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'DUE_ON_RECEIPT' | 'PAY_ANYTIME';
export type PreferredPaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CASH' | 'PAY_LATER' | 'CREDIT_TERMS';
export type PurchasePaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
export type PurchaseDeliveryStatus = 'RECEIVED' | 'PENDING' | 'CANCELLED';

export interface Vendor {
  id: number;
  uuid: string;
  vendor_code: string;
  name: string;
  /** Primary category — mirrors categories[0]. Kept for headers, pills and reports. */
  category: string;
  /** Every kind of goods this vendor supplies. */
  categories?: string[];
  status: VendorStatus;
  image_url?: string | null;
  notes?: string | null;

  // Contact Information & Location
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;

  // Tax Details
  tax_id?: string | null;
  pan_number?: string | null;

  // Financial & Balances
  outstanding_balance: number;

  // Banking & Electronic Settlement
  preferred_payment_method: PreferredPaymentMethod | string;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;

  // Optional legacy fields
  credit_limit?: number;
  payment_terms?: PaymentTermsType | string;
  tax_category?: string;
  branch_name?: string | null;
  total_purchases_amount?: number;
  total_paid_amount?: number;
  total_purchases_count?: number;
  last_purchase_date?: string | null;
  last_payment_date?: string | null;
  rating?: number;
  delivery_speed_rating?: number;
  quality_rating?: number;
  pricing_rating?: number;
  on_time_delivery_rate?: number;
  quality_score?: number;
  fulfillment_rate?: number;
  performance_notes?: string | null;

  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: number | boolean;

  purchases?: VendorPurchase[];
  payments?: VendorPayment[];
}

export interface VendorPurchase {
  id: number;
  uuid: string;
  vendor_id: number;
  invoice_number: string;
  order_date: string;
  due_date?: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PurchasePaymentStatus;
  delivery_status: PurchaseDeliveryStatus;
  items_summary?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface VendorPayment {
  id: number;
  uuid: string;
  vendor_id: number;
  purchase_id?: number | null;
  invoice_number?: string | null;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  totalOutstanding: number;
  totalPurchases: number;
  avgRating: string;
  avgOnTime: string;
  avgQuality: string;
  avgFulfillment: string;
  overdueCount: number;
  overdueAmount: number;
  categories: { name: string; count: number }[];
}

// -------------------------------------------------------------
// Product Add-ons & Combo Deals
// -------------------------------------------------------------
export interface ProductAddon {
  id: number;
  name: string;
  price: number;
  cost_price?: number;
  image_url?: string | null;
  is_available: boolean | number;
  is_active?: boolean | number;
  product_id?: number | null;
  category?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  selected?: boolean;
}

export interface ComboDealItem {
  id?: number;
  combo_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  selling_price?: number;
  variant_id?: number | null;
  quantity: number;
  display_order?: number;
}

export interface ComboDeal {
  id: number;
  name: string;
  code?: string;
  description?: string;
  image_url?: string;
  combo_price: number;
  original_price?: number;
  savings_amount?: number;
  is_available: boolean | number;
  status: 'ACTIVE' | 'INACTIVE';
  items?: ComboDealItem[];
  created_at?: string;
  updated_at?: string;
}

// -------------------------------------------------------------
// Inventory Alerts Suite
// -------------------------------------------------------------
export interface StockAlertSummary {
  totalAlerts: number;
  outOfStock: number;
  lowStock: number;
  minStock: number;
  reorderLevel: number;
  overstock: number;
  expired: number;
  expiringSoon: number;
}

export interface StockAlertItem extends StockItem {
  alert_category: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'REORDER_LEVEL' | 'OVERSTOCK' | 'NORMAL';
  severity: 'critical' | 'warning' | 'info' | 'normal';
  suggested_reorder_quantity: number;
}



/**
 * Coerces whatever arrived into one of the two order types.
 *
 * Rows written before walk-in, pickup and counter were folded into TAKEAWAY
 * still carry those values until the catch-up migration is run, and an offline
 * cart cached on a till can carry one for as long as it sits there. Everything
 * that reads an order type off the wire goes through here, so a stale value
 * shows as Takeaway rather than falling through a chain of equality checks and
 * rendering as a blank badge.
 */
export function normalizeOrderType(value: unknown): OrderType {
  return String(value ?? '').toUpperCase() === 'DINING' ? 'DINING' : 'TAKEAWAY';
}

/** Display label for an order type, for badges, chips and receipts. */
export function orderTypeLabel(value: unknown): string {
  return normalizeOrderType(value) === 'DINING' ? 'Dine In' : 'Takeaway';
}

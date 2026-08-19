export type Role = "ADMIN" | "KASIR";

export type PaymentMethod = "CASH" | "QRIS" | "SHOPEE" | "ONLINE" | "LAINNYA";

export type TransactionStatus = "COMPLETED" | "CANCELLED";

export type MovementType =
  | "INITIAL_STOCK"
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUSTMENT"
  | "STOCK_OPNAME"
  | "RECIPE_USAGE";

export type PurchaseRequestStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  _count?: {
    transactions: number;
  };
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export interface ProductRecipe {
  id: string;
  productId: string;
  ingredientId: string;
  quantityNeeded: number;
  unit: string;
  ingredient?: Ingredient;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedBy?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category?: MenuCategory;
  price: number;
  costPrice: number;
  image?: string | null;
  description?: string | null;
  isAvailable: boolean;
  isActive: boolean;
  recipes?: ProductRecipe[];
  priceHistory?: ProductPriceHistory[];
  _count?: {
    items: number;
  };
}

export interface UnitConversion {
  id: string;
  ingredientId: string;
  ingredient?: {
    id: string;
    name: string;
    baseUnit: string;
  };
  fromUnit: string;
  toUnit: string;
  conversionRate: number;
  createdAt?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  baseUnit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  isActive: boolean;
  notes?: string | null;
  conversions?: UnitConversion[];
  stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredient?: {
    id: string;
    name: string;
    baseUnit: string;
  };
  date: string;
  type: MovementType;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  stockBefore: number;
  stockAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface StockOpnameItem {
  id: string;
  stockOpnameId: string;
  ingredientId: string;
  ingredient?: Ingredient;
  systemStock: number;
  physicalStock: number;
  difference: number;
  baseUnit: string;
  notes?: string | null;
}

export interface StockOpname {
  id: string;
  date: string;
  status: string;
  notes?: string | null;
  conductedByUserId: string;
  conductedBy?: {
    id: string;
    name: string;
    email: string;
  };
  items: StockOpnameItem[];
  createdAt: string;
}

export interface PurchaseRequestItem {
  id?: string;
  ingredientId?: string | null;
  ingredientName: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  ingredient?: Ingredient;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  date: string;
  status: PurchaseRequestStatus;
  notes?: string | null;
  requestedByUserId: string;
  requestedBy?: {
    id: string;
    name: string;
  };
  reviewedByUserId?: string | null;
  reviewedBy?: {
    id: string;
    name: string;
  };
  items: PurchaseRequestItem[];
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  priceSnapshot: number;
  costPriceSnapshot: number;
  subtotal: number;
  notes?: string | null;
  product?: Product;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  cashierId: string;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  customerCount: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number | null;
  cashChange?: number | null;
  status: TransactionStatus;
  notes?: string | null;
  items: TransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CashClosing {
  id: string;
  cashierId: string;
  cashier?: {
    id: string;
    name: string;
  };
  date: string;
  openingBalance: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  totalTransactions: number;
  totalCustomers: number;
  totalCashSales: number;
  totalQrisSales: number;
  totalShopeeSales: number;
  totalOnlineSales: number;
  totalSales: number;
  notes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
}

export interface DashboardData {
  summary: {
    date: string;
    totalSales: number;
    totalTransactions: number;
    totalCustomers: number;
    averageTransactionValue: number;
    averageBuyersPerDay: number;
    payments: {
      cash: number;
      qris: number;
      shopee: number;
      online: number;
      others: number;
    };
    topSellingProducts: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    lowStockItems: Array<{
      id: string;
      name: string;
      currentStock: number;
      minimumStock: number;
      baseUnit: string;
      status: "HABIS" | "MENIPIS";
    }>;
  };
  trends: Array<{
    date?: string;
    label?: string;
    monthName?: string;
    year?: string;
    totalSales: number;
    totalTransactions: number;
    totalCustomers: number;
  }>;
  hourlySummary: {
    peakCustomerHour: string;
    peakCustomerCount: number;
    peakCustomerText: string;
    peakOmzetHour: string;
    peakOmzetAmount: number;
    peakOmzetText: string;
    averageCustomersPerHour: number;
    averageCustomerText: string;
  };
}

export interface HourlyAnalyticsData {
  date: string;
  hourlyData: Array<{
    hour: number;
    label: string;
    customerCount: number;
    transactionCount: number;
    omzet: number;
    isOperatingHour: boolean;
  }>;
  summary: {
    peakCustomerHour: string;
    peakCustomerCount: number;
    peakCustomerText: string;
    peakOmzetHour: string;
    peakOmzetAmount: number;
    peakOmzetText: string;
    averageCustomersPerHour: number;
    averageCustomerText: string;
  };
}

import axios from "axios";
import {
  User,
  Product,
  MenuCategory,
  Transaction,
  Ingredient,
  UnitConversion,
  StockMovement,
  StockOpname,
  PurchaseRequest,
  CashClosing,
  DashboardData,
  HourlyAnalyticsData,
  AuditLog,
} from "../types";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("martabak_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor to handle unauthenticated 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("martabak_token");
        localStorage.removeItem("martabak_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/login",
      credentials
    );
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; data: User }>("/auth/me");
    return res.data.data;
  },

  // Categories
  getCategories: async (activeOnly = false) => {
    const res = await apiClient.get<{ success: boolean; data: MenuCategory[] }>(
      `/categories?activeOnly=${activeOnly}`
    );
    return res.data.data;
  },
  createCategory: async (data: Partial<MenuCategory>) => {
    const res = await apiClient.post<{ success: boolean; data: MenuCategory }>("/categories", data);
    return res.data.data;
  },
  updateCategory: async (id: string, data: Partial<MenuCategory>) => {
    const res = await apiClient.put<{ success: boolean; data: MenuCategory }>(`/categories/${id}`, data);
    return res.data.data;
  },
  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },

  // Products
  getProducts: async (params?: {
    categoryId?: string;
    search?: string;
    activeOnly?: boolean;
    availableOnly?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append("categoryId", params.categoryId);
    if (params?.search) query.append("search", params.search);
    if (params?.activeOnly) query.append("activeOnly", "true");
    if (params?.availableOnly) query.append("availableOnly", "true");
    const res = await apiClient.get<{ success: boolean; data: Product[] }>(`/products?${query.toString()}`);
    return res.data.data;
  },
  getProduct: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return res.data.data;
  },
  createProduct: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: Product }>("/products", data);
    return res.data.data;
  },
  updateProduct: async (id: string, data: any) => {
    const res = await apiClient.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
    return res.data.data;
  },
  deleteProduct: async (id: string) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
  getProductRecipes: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/products/${id}/recipes`);
    return res.data.data;
  },
  saveProductRecipes: async (id: string, recipes: any[]) => {
    const res = await apiClient.post<{ success: boolean; data: any[] }>(`/products/${id}/recipes`, { recipes });
    return res.data.data;
  },

  // Transactions
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.paymentMethod && params.paymentMethod !== "ALL")
      query.append("paymentMethod", params.paymentMethod);
    if (params?.search) query.append("search", params.search);

    const res = await apiClient.get<{
      success: boolean;
      data: Transaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/transactions?${query.toString()}`);
    return res.data;
  },
  getTransaction: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: { transaction: Transaction; receiptMeta: any } }>(
      `/transactions/${id}`
    );
    return res.data.data;
  },
  createTransaction: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: Transaction }>("/transactions", data);
    return res.data.data;
  },

  // Inventory
  getIngredients: async (params?: { search?: string; activeOnly?: boolean; lowStockOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.activeOnly) query.append("activeOnly", "true");
    if (params?.lowStockOnly) query.append("lowStockOnly", "true");
    const res = await apiClient.get<{ success: boolean; data: Ingredient[] }>(`/inventory?${query.toString()}`);
    return res.data.data;
  },
  createIngredient: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: Ingredient }>("/inventory", data);
    return res.data.data;
  },
  updateIngredient: async (id: string, data: any) => {
    const res = await apiClient.put<{ success: boolean; data: Ingredient }>(`/inventory/${id}`, data);
    return res.data.data;
  },
  deleteIngredient: async (id: string) => {
    const res = await apiClient.delete(`/inventory/${id}`);
    return res.data;
  },

  // Unit Conversions
  getConversions: async (ingredientId?: string) => {
    const query = ingredientId ? `?ingredientId=${ingredientId}` : "";
    const res = await apiClient.get<{ success: boolean; data: UnitConversion[] }>(`/inventory/conversions${query}`);
    return res.data.data;
  },
  createConversion: async (data: { ingredientId: string; fromUnit: string; toUnit: string; conversionRate: number }) => {
    const res = await apiClient.post<{ success: boolean; data: UnitConversion }>("/inventory/conversions", data);
    return res.data.data;
  },
  deleteConversion: async (id: string) => {
    const res = await apiClient.delete(`/inventory/conversions?id=${id}`);
    return res.data;
  },

  // Stock Movements
  getMovements: async (params?: { page?: number; limit?: number; ingredientId?: string; type?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.ingredientId) query.append("ingredientId", params.ingredientId);
    if (params?.type && params.type !== "ALL") query.append("type", params.type);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const res = await apiClient.get<{
      success: boolean;
      data: StockMovement[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/inventory/movements?${query.toString()}`);
    return res.data;
  },
  createMovement: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: any }>("/inventory/movements", data);
    return res.data.data;
  },

  // Stock Opname
  getStockOpnames: async (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const res = await apiClient.get<{ success: boolean; data: StockOpname[] }>(`/inventory/stock-opname?${query.toString()}`);
    return res.data.data;
  },
  performStockOpname: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: StockOpname }>("/inventory/stock-opname", data);
    return res.data.data;
  },

  // Purchase Requests
  getPurchaseRequests: async (status?: string) => {
    const query = status && status !== "ALL" ? `?status=${status}` : "";
    const res = await apiClient.get<{ success: boolean; data: PurchaseRequest[] }>(`/purchase-requests${query}`);
    return res.data.data;
  },
  createPurchaseRequest: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: PurchaseRequest }>("/purchase-requests", data);
    return res.data.data;
  },
  updatePurchaseRequestStatus: async (id: string, data: { status: string; notes?: string }) => {
    const res = await apiClient.put<{ success: boolean; data: PurchaseRequest }>(`/purchase-requests/${id}`, data);
    return res.data.data;
  },
  deletePurchaseRequest: async (id: string) => {
    const res = await apiClient.delete(`/purchase-requests/${id}`);
    return res.data;
  },

  // Cash Closing (Tutup Kasir)
  getClosingPreview: async (date?: string) => {
    const query = date ? `?preview=true&date=${date}` : "?preview=true";
    const res = await apiClient.get<{ success: boolean; data: any }>(`/cash-closing${query}`);
    return res.data.data;
  },
  getClosingHistory: async () => {
    const res = await apiClient.get<{ success: boolean; data: CashClosing[] }>("/cash-closing");
    return res.data.data;
  },
  submitClosing: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: CashClosing }>("/cash-closing", data);
    return res.data.data;
  },

  // Dashboard & Analytics
  getDashboardData: async (params?: { date?: string; trend?: string; days?: number }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.trend) query.append("trend", params.trend);
    if (params?.days) query.append("days", params.days.toString());
    const res = await apiClient.get<{ success: boolean; data: DashboardData }>(`/dashboard?${query.toString()}`);
    return res.data.data;
  },
  getHourlyAnalytics: async (date?: string) => {
    const query = date ? `?date=${date}` : "";
    const res = await apiClient.get<{ success: boolean; data: HourlyAnalyticsData }>(`/reports/hourly${query}`);
    return res.data.data;
  },

  // Reports
  getSalesReport: async (params?: { startDate?: string; endDate?: string; cashierId?: string; paymentMethod?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.cashierId) query.append("cashierId", params.cashierId);
    if (params?.paymentMethod && params.paymentMethod !== "ALL")
      query.append("paymentMethod", params.paymentMethod);
    const res = await apiClient.get<{ success: boolean; data: any }>(`/reports/sales?${query.toString()}`);
    return res.data.data;
  },
  getProductReport: async (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/reports/products?${query.toString()}`);
    return res.data.data;
  },
  getStockReport: async (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/reports/stock?${query.toString()}`);
    return res.data.data;
  },
  getWhatsAppReport: async (type: "sales" | "stock", date?: string) => {
    const query = new URLSearchParams();
    query.append("type", type);
    if (date) query.append("date", date);
    const res = await apiClient.get<{ success: boolean; data: { text: string; type: string; date: string } }>(
      `/reports/whatsapp?${query.toString()}`
    );
    return res.data.data;
  },

  // Users
  getUsers: async () => {
    const res = await apiClient.get<{ success: boolean; data: User[] }>("/users");
    return res.data.data;
  },
  createUser: async (data: any) => {
    const res = await apiClient.post<{ success: boolean; data: User }>("/users", data);
    return res.data.data;
  },
  updateUser: async (id: string, data: any) => {
    const res = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, data);
    return res.data.data;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { page?: number; limit?: number; entity?: string; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.entity) query.append("entity", params.entity);
    if (params?.action) query.append("action", params.action);
    const res = await apiClient.get<{
      success: boolean;
      data: AuditLog[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/audit-logs?${query.toString()}`);
    return res.data;
  },

  // Settings
  getSettings: async () => {
    const res = await apiClient.get<{ success: boolean; data: { list: any[]; map: Record<string, string> } }>(
      "/settings"
    );
    return res.data.data;
  },
  updateSettings: async (settingsMap: Record<string, string>) => {
    const res = await apiClient.put<{ success: boolean; data: any }>("/settings", settingsMap);
    return res.data.data;
  },
};

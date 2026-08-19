import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { MainLayout } from "./layouts/MainLayout";

// Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PosPage } from "./pages/pos/PosPage";
import { TransactionsPage } from "./pages/transactions/TransactionsPage";
import { ProductsPage } from "./pages/products/ProductsPage";
import { CategoriesPage } from "./pages/categories/CategoriesPage";
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { UnitConversionsPage } from "./pages/inventory/UnitConversionsPage";
import { MovementsPage } from "./pages/inventory/MovementsPage";
import { StockOpnamePage } from "./pages/inventory/StockOpnamePage";
import { PurchaseRequestsPage } from "./pages/purchase-requests/PurchaseRequestsPage";
import { CashClosingPage } from "./pages/cash-closing/CashClosingPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { UsersPage } from "./pages/users/UsersPage";
import { SettingsPage } from "./pages/settings/SettingsPage";

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, token, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="text-xs font-bold tracking-wider text-slate-400">MEMUAT SISTEM MARTABAK...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/pos" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { user, isAdmin, token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/dashboard" : "/pos"} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RootRedirect />} />

          {/* POS & Transactions (Cashier & Admin) */}
          <Route path="pos" element={<PosPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="cash-closing" element={<CashClosingPage />} />

          {/* Inventory & Opname */}
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/stock-opname" element={<StockOpnamePage />} />
          <Route path="purchase-requests" element={<PurchaseRequestsPage />} />

          {/* Admin Only Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute requireAdmin>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute requireAdmin>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/conversions"
            element={
              <ProtectedRoute requireAdmin>
                <UnitConversionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/movements"
            element={
              <ProtectedRoute requireAdmin>
                <MovementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute requireAdmin>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/*"
            element={
              <ProtectedRoute requireAdmin>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute requireAdmin>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute requireAdmin>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { LogOut, User, Store, ShoppingBag, DollarSign, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard Analitik";
    if (path.startsWith("/pos")) return "Kasir / Point of Sale";
    if (path.startsWith("/transactions")) return "Daftar Transaksi";
    if (path.startsWith("/products")) return "Manajemen Produk & Harga";
    if (path.startsWith("/categories")) return "Kategori Menu";
    if (path.startsWith("/inventory/conversions")) return "Konversi Satuan Stok";
    if (path.startsWith("/inventory/movements")) return "Riwayat Pergerakan Stok";
    if (path.startsWith("/inventory/stock-opname")) return "Stok Opname Harian";
    if (path.startsWith("/inventory")) return "Inventaris Bahan Baku";
    if (path.startsWith("/purchase-requests")) return "Permintaan Barang";
    if (path.startsWith("/cash-closing")) return "Tutup Kasir / Cash Closing";
    if (path.startsWith("/reports")) return "Laporan & Rekapitulasi";
    if (path.startsWith("/users")) return "Manajemen Pengguna";
    if (path.startsWith("/settings")) return "Pengaturan Sistem";
    return "Sistem Manajemen Martabak";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
              <Store className="mr-1 h-3 w-3" />
              {settings.store_name || "Martabak Aldi"}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              {settings.opening_time || "16:00"} – {settings.closing_time || "23:00"}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Shortcut to POS */}
        <Link
          to="/pos"
          className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition"
        >
          <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
          <span>Buka Kasir</span>
        </Link>

        {/* Quick Shortcut to Cash Closing */}
        <Link
          to="/cash-closing"
          className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition hidden sm:inline-flex"
        >
          <DollarSign className="mr-1 h-3.5 w-3.5" />
          <span>Tutup Kasir</span>
        </Link>

        {/* User profile dropdown info */}
        <div className="flex items-center pl-2 sm:pl-4 border-l border-slate-200 space-x-2">
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-slate-400 flex items-center space-x-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isAdmin ? "bg-purple-500" : "bg-emerald-500"
                }`}
              />
              <span>{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar"
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition ml-1"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

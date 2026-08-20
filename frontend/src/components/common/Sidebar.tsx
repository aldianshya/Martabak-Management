import React from "react";
import { Link, useLocation } from "react-router-dom";
import martabakImage from "../../assets/rap.jpg";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  UtensilsCrossed,
  Layers,
  Boxes,
  ArrowLeftRight,
  ClipboardCheck,
  Truck,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  Scale,
  LogOut,
  X,
  Send,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    if (path === "/inventory" && location.pathname === "/inventory")
      return true;
    if (path === "/reports" && location.pathname.startsWith("/reports"))
      return true;
    if (path !== "/dashboard" && path !== "/inventory" && path !== "/reports") {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      label: "Kasir (POS)",
      path: "/pos",
      icon: ShoppingBag,
      adminOnly: false,
    },
    {
      label: "Transaksi",
      path: "/transactions",
      icon: Receipt,
      adminOnly: false,
    },
    {
      header: "MENU & PRODUK",
      adminOnly: true,
      items: [
        { label: "Daftar Menu", path: "/products", icon: UtensilsCrossed },
        { label: "Kategori", path: "/categories", icon: Layers },
      ],
    },
    {
      header: "INVENTARIS & STOK",
      adminOnly: false,
      items: [
        { label: "Stok Bahan", path: "/inventory", icon: Boxes },
        {
          label: "Konversi Satuan",
          path: "/inventory/conversions",
          icon: Scale,
          adminOnly: true,
        },
        {
          label: "Mutasi Stok",
          path: "/inventory/movements",
          icon: ArrowLeftRight,
          adminOnly: true,
        },
        {
          label: "Stok Opname",
          path: "/inventory/stock-opname",
          icon: ClipboardCheck,
        },
        { label: "Permintaan Barang", path: "/purchase-requests", icon: Truck },
      ],
    },
    {
      header: "OPERASIONAL & LAPORAN",
      adminOnly: false,
      items: [
        { label: "Tutup Kasir", path: "/cash-closing", icon: DollarSign },
        {
          label: "Laporan & Rekap",
          path: "/reports",
          icon: BarChart3,
          adminOnly: true,
        },
      ],
    },
    {
      header: "SISTEM",
      adminOnly: true,
      items: [
        { label: "Pengguna", path: "/users", icon: Users },
        { label: "Pengaturan", path: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 overflow-hidden rounded-xl shadow-lg shadow-brand-500/30">
              <img
                src={martabakImage}
                alt="Martabak"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-wider">
                MARTABAK RAP
              </div>
              <div className="text-[10px] font-medium text-brand-400">
                MANAGEMENT SUITE
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group, idx) => {
            if (group.adminOnly && !isAdmin) return null;

            if (group.items) {
              const visibleItems = group.items.filter(
                (item) => !item.adminOnly || isAdmin,
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1">
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {group.header}
                  </div>
                  {visibleItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                          active
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const active = isActive(group.path!);
            const Icon = group.icon!;
            return (
              <div key={idx}>
                <Link
                  to={group.path!}
                  onClick={onClose}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                  />
                  <span>{group.label}</span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="border-t border-slate-800 p-3 bg-slate-950">
          <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2.5">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="h-8 w-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-500/30">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="truncate text-xs">
                <div className="font-bold text-white truncate">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

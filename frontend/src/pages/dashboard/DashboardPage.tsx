import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { formatRupiah, formatNumber } from "../../utils/formatters";
import { WhatsAppExportModal } from "../../components/common/WhatsAppExportModal";
import {
  DollarSign,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Share2,
  Calendar,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  QrCode,
  Smartphone,
  Globe,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const [trendType, setTrendType] = useState<"daily" | "monthly" | "yearly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waType, setWaType] = useState<"sales" | "stock">("sales");

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", selectedDate, trendType],
    queryFn: () => api.getDashboardData({ date: selectedDate, trend: trendType, days: 7 }),
  });

  const { data: hourlyData } = useQuery({
    queryKey: ["hourly-analytics", selectedDate],
    queryFn: () => api.getHourlyAnalytics(selectedDate),
  });

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 bg-slate-200 animate-pulse rounded-2xl lg:col-span-2" />
          <div className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const { summary, trends } = dashboardData;
  const hourlySummary = hourlyData?.summary || dashboardData.hourlySummary;
  const hourlyChartItems = hourlyData?.hourlyData || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Ringkasan Operasional Martabak
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Pantau performa penjualan, jumlah pembeli, dan status stok harian secara real-time
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 rounded-xl bg-white p-1.5 shadow-sm border border-slate-200 text-xs">
            <Calendar className="h-4 w-4 text-slate-400 ml-1" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 bg-transparent font-semibold text-slate-800 focus:outline-none text-xs"
            />
          </div>

          <button
            onClick={() => {
              setWaType("sales");
              setWaModalOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>COPY WA</span>
          </button>
        </div>
      </div>

      {/* 5 Primary KPI Cards (Distinguishing Transactions vs Customer Count) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Penjualan */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 p-5 text-white shadow-lg shadow-brand-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100">
              Total Penjualan
            </span>
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight">
            {formatRupiah(summary.totalSales)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-brand-100 font-medium">
            <span>Transaksi Hari Ini</span>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Transaksi
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {formatNumber(summary.totalTransactions)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Struk / Nota Terbit
          </div>
        </div>

        {/* Total Pembeli (SUM customerCount) */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pembeli
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">
            {formatNumber(summary.totalCustomers)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Orang / Akumulasi Pembeli
          </div>
        </div>

        {/* Rata-rata Nilai Transaksi */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rata-rata Transaksi
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {formatRupiah(summary.averageTransactionValue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Omzet ÷ Total Transaksi
          </div>
        </div>

        {/* Rata-rata Pembeli / Hari */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rata-rata Pembeli/Hari
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {summary.averageBuyersPerDay}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            Orang / Hari (Berdasarkan 30 Hari)
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center space-x-3 rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Tunai (CASH)</div>
            <div className="text-sm font-extrabold text-slate-800">
              {formatRupiah(summary.payments.cash)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">QRIS</div>
            <div className="text-sm font-extrabold text-slate-800">
              {formatRupiah(summary.payments.qris)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">ShopeePay</div>
            <div className="text-sm font-extrabold text-slate-800">
              {formatRupiah(summary.payments.shopee)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 rounded-xl bg-white p-3.5 border border-slate-200 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Online / Ojek</div>
            <div className="text-sm font-extrabold text-slate-800">
              {formatRupiah(summary.payments.online)}
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Customer Analytics Section (CRUCIAL REQUIREMENT) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Analisis Jam Pembeli & Pola Keramaian
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik distribusi pembeli dan omzet per jam operasional toko
            </p>
          </div>

          {/* Dual Peak Callouts Highlight */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-800 font-bold">
              <Flame className="h-4 w-4 text-rose-600" />
              <span>{hourlySummary.peakCustomerText || "Jam Paling Ramai: 20:00–21:00"}</span>
            </div>

            <div className="flex items-center space-x-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-bold">
              <Award className="h-4 w-4 text-amber-600" />
              <span>{hourlySummary.peakOmzetText || "Jam Omzet Tertinggi: 19:00–20:00"}</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart for Hourly Data */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyChartItems.filter((item) => item.isOperatingHour || item.customerCount > 0)}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "customerCount") return [`${value} Orang`, "Jumlah Pembeli"];
                  if (name === "transactionCount") return [`${value} Struk`, "Jumlah Transaksi"];
                  if (name === "omzet") return [formatRupiah(value), "Total Omzet"];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                formatter={(value) => {
                  if (value === "customerCount") return "Jumlah Pembeli (Orang)";
                  if (value === "transactionCount") return "Jumlah Transaksi (Struk)";
                  if (value === "omzet") return "Omzet (Rp)";
                  return value;
                }}
              />
              <Bar dataKey="customerCount" fill="#f97316" radius={[6, 6, 0, 0]} name="customerCount" />
              <Bar dataKey="transactionCount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="transactionCount" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
          <div>{hourlySummary.averageCustomerText}</div>
          <div className="text-[11px] text-slate-400">
            *Dihitung berdasarkan transaksi nyata tersimpan di database
          </div>
        </div>
      </div>

      {/* 2-Column: Sales Trends & Top Products / Low Stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Sales Trends (Daily / Monthly / Yearly) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Tren Penjualan Martabak
              </h3>
              <p className="text-xs text-slate-500">Pertumbuhan omzet penjualan harian, bulanan & tahunan</p>
            </div>

            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setTrendType("daily")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  trendType === "daily" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setTrendType("monthly")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  trendType === "monthly" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setTrendType("yearly")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  trendType === "yearly" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tahunan
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey={trendType === "monthly" ? "monthName" : trendType === "yearly" ? "year" : "label"} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatRupiah(value), "Total Penjualan"]}
                />
                <Area type="monotone" dataKey="totalSales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Top Products & Low Stock Alerts */}
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                <Flame className="mr-1.5 h-4 w-4 text-brand-500" />
                Menu Paling Laris Hari Ini
              </h3>
              <Link to="/reports" className="text-xs text-brand-600 hover:text-brand-700 font-bold">
                Detail
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {summary.topSellingProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">Belum ada menu terjual hari ini</div>
              ) : (
                summary.topSellingProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-brand-600">{p.quantity} porsi</span>
                      <span className="text-[10px] text-slate-400 block">{formatRupiah(p.revenue)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alerts Widget */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                <AlertTriangle className="mr-1.5 h-4 w-4 text-amber-500" />
                Peringatan Stok Menipis
              </h3>
              <Link to="/inventory" className="text-xs text-brand-600 hover:text-brand-700 font-bold">
                Bahan
              </Link>
            </div>

            <div className="mt-3 space-y-2.5">
              {summary.lowStockItems.length === 0 ? (
                <div className="py-4 text-center text-xs text-emerald-600 font-medium">
                  ✅ Semua stok bahan dalam batas aman
                </div>
              ) : (
                summary.lowStockItems.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{ing.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Min: {ing.minimumStock} {ing.baseUnit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          ing.status === "HABIS"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ing.currentStock} {ing.baseUnit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Report Modal */}
      <WhatsAppExportModal
        type={waType}
        date={selectedDate}
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
      />
    </div>
  );
};

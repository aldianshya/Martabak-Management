import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { formatRupiah, formatNumber, formatDate, formatDateTime } from "../../utils/formatters";
import { WhatsAppExportModal } from "../../components/common/WhatsAppExportModal";
import { downloadCsvFile, downloadTextFile } from "../../utils/export";
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Share2,
  Printer,
  PieChart as PieIcon,
  ShoppingBag,
  Boxes,
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const PAYMENT_COLORS = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#64748b"];

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"sales" | "products" | "payments" | "stock">("sales");

  // Date filters
  const [datePreset, setDatePreset] = useState<string>("today");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // WhatsApp Modal
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waType, setWaType] = useState<"sales" | "stock">("sales");

  // Preset Date Handlers
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7days") {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      setStartDate(past7.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(startOfYear.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  // Queries
  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["reports-sales", startDate, endDate],
    queryFn: () => api.getSalesReport({ startDate, endDate }),
    enabled: activeTab === "sales" || activeTab === "payments",
  });

  const { data: productsData = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["reports-products", startDate, endDate],
    queryFn: () => api.getProductReport({ startDate, endDate }),
    enabled: activeTab === "products",
  });

  const { data: stockData = [], isLoading: loadingStock } = useQuery({
    queryKey: ["reports-stock", startDate, endDate],
    queryFn: () => api.getStockReport({ startDate, endDate }),
    enabled: activeTab === "stock",
  });

  const summary = salesData?.summary || {
    totalRevenue: 0,
    totalDiscount: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    totalItemsSold: 0,
    avgTransactionValue: 0,
    paymentsSummary: {},
  };

  // Prepare Donut Chart Data
  const paymentChartData = Object.entries(summary.paymentsSummary || {}).map(([key, val]: any) => ({
    name: key,
    value: val.total,
    count: val.count,
  }));

  const handleExportCsv = () => {
    if (activeTab === "sales") {
      const txs = salesData?.transactions || [];
      const header = ["No Invoice", "Waktu", "Kasir", "Jumlah Pembeli", "Total", "Metode"];
      const rows = txs.map((t: any) => [
        t.invoiceNumber,
        formatDateTime(t.date),
        t.cashier?.name || "-",
        t.customerCount,
        t.total,
        t.paymentMethod,
      ]);
      downloadCsvFile(`Laporan-Penjualan-${startDate}-sd-${endDate}.csv`, [header, ...rows]);
    } else if (activeTab === "products") {
      const header = ["Nama Menu", "Kategori", "Porsi Terjual", "Omzet", "Estimasi HPP", "Estimasi Laba"];
      const rows = productsData.map((p: any) => [
        p.productName,
        p.categoryName,
        p.totalSold,
        p.totalRevenue,
        p.totalCost,
        p.profit,
      ]);
      downloadCsvFile(`Laporan-Produk-${startDate}-sd-${endDate}.csv`, [header, ...rows]);
    } else if (activeTab === "stock") {
      const header = ["Nama Bahan", "Satuan", "Stok Awal/Masuk", "Terpakai", "Penyesuaian", "Stok Akhir", "Status"];
      const rows = stockData.map((s: any) => [
        s.name,
        s.baseUnit,
        s.stockIn,
        s.stockOut,
        s.adjustment,
        s.currentStock,
        s.status,
      ]);
      downloadCsvFile(`Laporan-Stok-${startDate}-sd-${endDate}.csv`, [header, ...rows]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Laporan & Rekapitulasi Bisnis
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Laporan penjualan, performa menu, perbandingan metode pembayaran, dan buku stok
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setWaType(activeTab === "stock" ? "stock" : "sales");
              setWaModalOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Share2 className="h-4 w-4" />
            <span>COPY FORMAT WA</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {[
            { id: "today", label: "Hari Ini" },
            { id: "yesterday", label: "Kemarin" },
            { id: "7days", label: "7 Hari" },
            { id: "month", label: "Bulan Ini" },
            { id: "year", label: "Tahun Ini" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handlePresetChange(btn.id)}
              className={`rounded-xl px-3 py-1.5 transition ${
                datePreset === btn.id
                  ? "bg-brand-500 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
          <div className="flex items-center space-x-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="border-0 bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="border-0 bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm space-x-1 text-xs font-extrabold">
        <button
          onClick={() => setActiveTab("sales")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition ${
            activeTab === "sales"
              ? "bg-brand-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Laporan Penjualan</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition ${
            activeTab === "products"
              ? "bg-brand-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Laporan Per Produk</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition ${
            activeTab === "payments"
              ? "bg-brand-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PieIcon className="h-4 w-4" />
          <span>Distribusi Pembayaran</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition ${
            activeTab === "stock"
              ? "bg-brand-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Laporan Stok Bahan</span>
        </button>
      </div>

      {/* TAB 1: SALES REPORT */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Omzet</span>
              <div className="text-xl font-black text-brand-600 mt-1">
                {formatRupiah(summary.totalRevenue)}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Transaksi</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {formatNumber(summary.totalTransactions)} Struk
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Pembeli</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {formatNumber(summary.totalCustomers)} Orang
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Transaksi</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {formatRupiah(summary.avgTransactionValue)}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Rincian Transaksi ({salesData?.transactions?.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4 text-center">Pembeli</th>
                    <th className="py-3 px-4">Menu Terjual</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingSales ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="py-4 px-4 bg-slate-50/50">
                          <div className="h-4 bg-slate-200 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : salesData?.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada transaksi pada periode ini
                      </td>
                    </tr>
                  ) : (
                    salesData?.transactions?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{t.invoiceNumber}</td>
                        <td className="py-3 px-4">{formatDateTime(t.date)}</td>
                        <td className="py-3 px-4">{t.cashier?.name || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {t.customerCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {t.items.map((i: any) => `${i.productName} (${i.quantity})`).join(", ")}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatRupiah(t.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                            {t.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT PERFORMANCE REPORT */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Bar chart for top products */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">
              Grafik Penjualan Menu Paling Laris
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsData.slice(0, 8)} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="productName" tick={{ fontSize: 11, fill: "#64748b" }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: string) => [
                      name === "totalSold" ? `${val} porsi` : formatRupiah(val),
                      name === "totalSold" ? "Porsi Terjual" : "Omzet",
                    ]}
                  />
                  <Bar dataKey="totalSold" fill="#f97316" radius={[6, 6, 0, 0]} name="totalSold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Ranking Table */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Nama Menu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Porsi Terjual</th>
                  <th className="py-3 px-4 text-right">Total Omzet</th>
                  <th className="py-3 px-4 text-right">Estimasi Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productsData.map((p: any, idx: number) => (
                  <tr key={p.productId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-extrabold text-slate-400">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.productName}</td>
                    <td className="py-3 px-4 text-slate-500">{p.categoryName}</td>
                    <td className="py-3 px-4 text-center font-black text-brand-600 text-sm">
                      {p.totalSold} porsi
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(p.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      {formatRupiah(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT DISTRIBUTION */}
      {activeTab === "payments" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col items-center">
            <h3 className="font-extrabold text-sm text-slate-900 self-start mb-4">
              Distribusi Omzet Berdasarkan Metode Pembayaran
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatRupiah(value), "Nominal"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Rincian Nominal & Persentase
            </h3>
            <div className="space-y-3 text-xs font-semibold">
              {paymentChartData.map((item, idx) => {
                const pct =
                  summary.totalRevenue > 0
                    ? ((item.value / summary.totalRevenue) * 100).toFixed(1)
                    : "0";
                return (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                      />
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-slate-400">({item.count} tx)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">{formatRupiah(item.value)}</span>
                      <span className="text-[10px] text-slate-400">{pct}% dari omzet</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>TOTAL OMZET:</span>
                <span className="text-brand-600">{formatRupiah(summary.totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK REPORT */}
      {activeTab === "stock" && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Bahan</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-right">Barang Masuk</th>
                <th className="py-3 px-4 text-right">Terpakai</th>
                <th className="py-3 px-4 text-right">Penyesuaian</th>
                <th className="py-3 px-4 text-right">Stok Akhir</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loadingStock ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : stockData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data stok bahan
                  </td>
                </tr>
              ) : (
                stockData.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-center font-bold bg-slate-50">{s.baseUnit}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                      +{s.stockIn}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">
                      -{s.stockOut}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600 font-bold">
                      {s.adjustment > 0 ? `+${s.adjustment}` : s.adjustment}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                      {s.currentStock} {s.baseUnit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          s.status === "HABIS"
                            ? "bg-rose-100 text-rose-800"
                            : s.status === "MENIPIS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppExportModal
        type={waType}
        date={startDate}
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
      />
    </div>
  );
};

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Transaction, PaymentMethod } from "../../types";
import { formatRupiah, formatDateTime, formatTime } from "../../utils/formatters";
import { ReceiptModal } from "../../components/common/ReceiptModal";
import { useSettings } from "../../contexts/SettingsContext";
import {
  Search,
  Receipt,
  Calendar,
  Filter,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  Download,
} from "lucide-react";
import { downloadCsvFile } from "../../utils/export";

export const TransactionsPage: React.FC = () => {
  const { settings } = useSettings();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("ALL");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, limit, startDate, endDate, paymentMethod, search],
    queryFn: () =>
      api.getTransactions({
        page,
        limit,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
        search: search || undefined,
      }),
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

  const handleViewReceipt = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalOpen(true);
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const header = [
      "No Invoice",
      "Tanggal & Jam",
      "Kasir",
      "Jumlah Pembeli",
      "Daftar Menu",
      "Metode Pembayaran",
      "Subtotal",
      "Diskon",
      "Total",
      "Status",
    ];

    const rows = transactions.map((t) => [
      t.invoiceNumber,
      formatDateTime(t.date),
      t.cashier?.name || "-",
      t.customerCount.toString(),
      t.items.map((i) => `${i.productName} (${i.quantity})`).join("; "),
      t.paymentMethod,
      t.subtotal.toString(),
      t.discount.toString(),
      t.total.toString(),
      t.status,
    ]);

    downloadCsvFile(`Transaksi-${startDate}-sd-${endDate}.csv`, [header, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Daftar lengkap invoice, waktu transaksi, kasir, pembeli, dan metode pembayaran
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={transactions.length === 0}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari No. Invoice / Menu..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Date Range Start */}
        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500 text-[11px] font-semibold">Dari:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="border-0 bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          />
        </div>

        {/* Date Range End */}
        <div className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500 text-[11px] font-semibold">Sampai:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="border-0 bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          />
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:inline" />
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="CASH">CASH (Tunai)</option>
            <option value="QRIS">QRIS</option>
            <option value="SHOPEE">ShopeePay</option>
            <option value="ONLINE">Online / Ojek</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Invoice & Waktu</th>
                <th className="py-3.5 px-4">Kasir & Pembeli</th>
                <th className="py-3.5 px-4">Daftar Produk</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Metode</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">Belum ada data transaksi</p>
                    <p className="text-[11px]">Coba ubah filter tanggal atau kata kunci</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{tx.invoiceNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateTime(tx.date)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-semibold block">{tx.cashier?.name || "-"}</span>
                      <span className="inline-flex items-center text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                        <Users className="h-3 w-3 mr-1" />
                        {tx.customerCount || 1} Pembeli
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="line-clamp-2 text-slate-700">
                        {tx.items.map((item, idx) => (
                          <span key={item.id}>
                            {idx > 0 && ", "}
                            <span className="font-semibold">{item.productName}</span> ({item.quantity}x)
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900 text-sm block">
                        {formatRupiah(tx.total)}
                      </span>
                      {Number(tx.discount) > 0 && (
                        <span className="text-[10px] text-rose-500 block">
                          Diskon -{formatRupiah(tx.discount)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          tx.paymentMethod === "CASH"
                            ? "bg-emerald-100 text-emerald-800"
                            : tx.paymentMethod === "QRIS"
                            ? "bg-blue-100 text-blue-800"
                            : tx.paymentMethod === "SHOPEE"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(tx)}
                        className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Baris per halaman:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Total: {pagination.total} transaksi</span>
          </div>

          <div className="flex items-center space-x-2">
            <span>
              Halaman {pagination.page} dari {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Struk Modal */}
      {selectedTx && (
  <ReceiptModal
    transaction={selectedTx}
    storeName={settings.store_name}
    storeAddress={settings.store_address}
    storePhone={settings.store_phone}
    receiptHeader={settings.receipt_header}
    receiptFooter={settings.receipt_footer}
    onClose={() => setSelectedTx(null)}
  />
)}
    </div>
  );
};

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import {
  formatRupiah,
  formatDateTime,
  formatDate,
} from "../../utils/formatters";
import {
  DollarSign,
  Receipt,
  Users,
  AlertCircle,
  CheckCircle2,
  History,
  Save,
  QrCode,
  Smartphone,
  Globe,
  MessageCircle,
} from "lucide-react";

export const CashClosingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: todayTransactions = [], isLoading: loadingTransactions } =
    useQuery({
      queryKey: ["today-transactions"],
      queryFn: () => api.getTodayTransactions(),
    });
  const [activeTab, setActiveTab] = useState<"closing" | "history">("closing");

  // Form State
  const [openingBalance, setOpeningBalance] = useState<number>(200000);
  const [actualCash, setActualCash] = useState<number | "">("");
  const [closingNotes, setClosingNotes] = useState<string>("");

  // Menyimpan data closing terakhir yang berhasil disimpan
  const [lastClosingReport, setLastClosingReport] = useState<{
    openingBalance: number;
    actualCash: number;
    difference: number;
    notes: string;
  } | null>(null);

  // Preview Query
  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ["cash-closing-preview"],
    queryFn: () => api.getClosingPreview(),
  });

  // History Query
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["cash-closing-history"],
    queryFn: () => api.getClosingHistory(),
  });

  // Sync opening balance from preview
  React.useEffect(() => {
    if (previewData && previewData.openingBalance !== undefined) {
      setOpeningBalance(previewData.openingBalance);
    }
  }, [previewData]);

  // =========================
  // PERHITUNGAN KAS
  // =========================

  const totalCashSales = previewData?.totalCashSales || 0;

  const expectedCash = openingBalance + totalCashSales;

  const numActualCash = typeof actualCash === "number" ? actualCash : 0;

  const difference =
    typeof actualCash === "number" ? numActualCash - expectedCash : 0;

  // =========================
  // MUTATION TUTUP KASIR
  // =========================

  const closingMutation = useMutation({
    mutationFn: (data: any) => api.submitClosing(data),

    onSuccess: () => {
      alert("Laporan tutup kasir berhasil disimpan!");

      setActualCash("");
      setClosingNotes("");

      queryClient.invalidateQueries({
        queryKey: ["cash-closing-preview"],
      });

      queryClient.invalidateQueries({
        queryKey: ["cash-closing-history"],
      });

      setActiveTab("history");
    },

    onError: (err: any) => {
      alert(err.response?.data?.message || "Gagal menutup kasir");
    },
  });

  // =========================
  // SUBMIT TUTUP KASIR
  // =========================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (actualCash === "") {
      alert("Masukkan jumlah uang tunai fisik yang dihitung di laci kasir.");
      return;
    }

    // Simpan laporan yang akan dikirim ke WhatsApp
    setLastClosingReport({
      openingBalance,
      actualCash: numActualCash,
      difference,
      notes: closingNotes,
    });

    closingMutation.mutate({
      openingBalance,
      actualCash: numActualCash,
      notes: closingNotes || null,
    });
  };

  // =========================
  // KIRIM LAPORAN KE WHATSAPP
  // =========================

  // =========================
  // KIRIM LAPORAN KE WHATSAPP
  // =========================
  const getTransactionItems = (transaction: any) => {
    return (
      transaction.items ||
      transaction.transactionItems ||
      transaction.details ||
      transaction.orderItems ||
      []
    );
  };
  const buildSalesList = () => {
    const sales: {
      name: string;
      quantity: number;
      price: number;
      paymentMethod: string;
    }[] = [];

    todayTransactions.forEach((transaction: any) => {
      const items = getTransactionItems(transaction);

      items.forEach((item: any) => {
        const productName =
          item.product?.name ||
          item.productName ||
          item.name ||
          item.menu?.name ||
          "Produk";

        const quantity = Number(item.quantity) || Number(item.qty) || 1;

        const price =
          Number(item.price) ||
          Number(item.unitPrice) ||
          Number(item.subtotal) / quantity ||
          0;

        sales.push({
          name: productName,
          quantity,
          price,
          paymentMethod:
            transaction.paymentMethod || transaction.payment_method || "CASH",
        });
      });
    });

    return sales;
  };
  // =========================
// KIRIM LAPORAN KE WHATSAPP
// =========================

const handleSendWhatsApp = () => {
  const ownerNumber = import.meta.env.VITE_OWNER_WHATSAPP;

  if (!ownerNumber) {
    alert(
      "Nomor WhatsApp Owner belum dikonfigurasi. Tambahkan VITE_OWNER_WHATSAPP di file .env frontend."
    );
    return;
  }

  if (!lastClosingReport) {
    alert("Belum ada laporan tutup kasir yang dapat dikirim.");
    return;
  }

  // =========================
  // AMBIL DATA PENJUALAN
  // =========================

  const sales = buildSalesList();

  const totalCash = previewData?.totalCashSales || 0;

  const totalOnline =
    (previewData?.totalQrisSales || 0) +
    (previewData?.totalShopeeSales || 0) +
    (previewData?.totalOnlineSales || 0);

  const totalSales = previewData?.totalSales || 0;

  // =========================
  // BUAT DAFTAR PRODUK
  // =========================

  let salesText = "";

  if (sales.length === 0) {
    salesText = "• Tidak ada data transaksi";
  } else {
    salesText = sales
      .map((item, index) => {
        const quantityText =
          item.quantity > 1 ? ` x${item.quantity}` : "";

        return `${index + 1}. ${item.name}${quantityText} ${formatRupiah(
          item.price
        )}`;
      })
      .join("\n");
  }

  // =========================
  // BUAT PESAN
  // =========================

  const message = `*DATA PENJUALAN ${formatDate(
    new Date()
  ).toUpperCase()}*
${salesText}

- CASH ${formatRupiah(totalCash)}
- ONLINE ${formatRupiah(totalOnline)}
*TOTAL* ${formatRupiah(totalSales)}`;

  // =========================
  // BUKA WHATSAPP
  // =========================

  const whatsappUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(
    whatsappUrl,
    "_blank",
    "noopener,noreferrer"
  );
};

  return (
    <div className="space-y-6">
      {/* =========================
          HEADER
      ========================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Tutup Kasir & Rekap Harian (Cash Closing)
          </h2>

          <p className="text-xs text-slate-500 font-medium">
            Rekonsiliasi total transaksi fisik dengan pembukuan sistem di akhir
            shift operasional
          </p>
        </div>

        {/* Tab Toggle */}

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("closing")}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "closing"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Form Tutup Kasir</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Closing ({history.length})</span>
          </button>
        </div>
      </div>

      {/* =========================
          FORM CLOSING
      ========================= */}

      {activeTab === "closing" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* =========================
              LEFT SIDE
          ========================= */}

          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Receipt className="h-4 w-4" />
                  </span>

                  <h3 className="font-extrabold text-sm text-slate-900">
                    Ringkasan Transaksi Shift Hari Ini
                  </h3>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {formatDate(new Date())}
                </span>
              </div>

              {loadingPreview ? (
                <div className="space-y-3 py-6 animate-pulse">
                  <div className="h-10 bg-slate-100 rounded-xl" />

                  <div className="h-20 bg-slate-100 rounded-xl" />
                </div>
              ) : (
                <>
                  {/* KPI */}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Total Omzet
                      </span>

                      <div className="text-base font-black text-brand-600">
                        {formatRupiah(previewData?.totalSales)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Total Transaksi
                      </span>

                      <div className="text-base font-black text-slate-900">
                        {previewData?.totalTransactions} Struk
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Total Pembeli
                      </span>

                      <div className="text-base font-black text-slate-900">
                        {previewData?.totalCustomers} Orang
                      </div>
                    </div>
                  </div>

                  {/* PAYMENT BREAKDOWN */}

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <div className="flex items-center space-x-2 font-bold text-emerald-800">
                        <DollarSign className="h-4 w-4 text-emerald-600" />

                        <span>Penjualan Tunai (CASH)</span>
                      </div>

                      <span className="font-black text-emerald-900 text-sm">
                        {formatRupiah(previewData?.totalCashSales)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <div className="flex items-center space-x-2 font-bold text-blue-800">
                        <QrCode className="h-4 w-4 text-blue-600" />

                        <span>Penjualan QRIS</span>
                      </div>

                      <span className="font-black text-blue-900">
                        {formatRupiah(previewData?.totalQrisSales)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 border border-orange-100">
                      <div className="flex items-center space-x-2 font-bold text-orange-800">
                        <Smartphone className="h-4 w-4 text-orange-600" />

                        <span>Penjualan ShopeePay</span>
                      </div>

                      <span className="font-black text-orange-900">
                        {formatRupiah(previewData?.totalShopeeSales)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                      <div className="flex items-center space-x-2 font-bold text-purple-800">
                        <Globe className="h-4 w-4 text-purple-600" />

                        <span>Penjualan Online / Lainnya</span>
                      </div>

                      <span className="font-black text-purple-900">
                        {formatRupiah(previewData?.totalOnlineSales)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* =========================
              RIGHT SIDE
          ========================= */}

          <div className="space-y-4 lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4"
            >
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Rekonsiliasi Uang Fisik Laci
              </h3>

              {/* OPENING BALANCE */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modal Awal Kasir / Float (Rp)
                </label>

                <input
                  type="number"
                  min="0"
                  value={openingBalance}
                  onChange={(e) =>
                    setOpeningBalance(parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* EXPECTED CASH */}

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Modal Awal:</span>

                  <span>{formatRupiah(openingBalance)}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Penjualan Tunai:</span>

                  <span>{formatRupiah(totalCashSales)}</span>
                </div>

                <div className="flex justify-between items-center font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Uang Seharusnya (Expected Cash):</span>

                  <span className="text-brand-600 text-sm">
                    {formatRupiah(expectedCash)}
                  </span>
                </div>
              </div>

              {/* ACTUAL CASH */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uang Fisik Dihitung Kasir (Actual Cash)
                </label>

                <input
                  type="number"
                  required
                  min="0"
                  value={actualCash}
                  onChange={(e) =>
                    setActualCash(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  placeholder={expectedCash.toString()}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-black text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* DIFFERENCE */}

              {actualCash !== "" && (
                <div
                  className={`rounded-xl p-3.5 text-xs font-bold border flex items-center justify-between ${
                    difference === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : difference > 0
                        ? "bg-blue-50 border-blue-200 text-blue-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    {difference === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}

                    <span>
                      {difference === 0
                        ? "Uang Pas (Sesuai Sistem)"
                        : difference > 0
                          ? "Ada Selisih Lebih"
                          : "Ada Selisih Kurang (Minus)"}
                    </span>
                  </div>

                  <span className="text-sm font-black">
                    {difference > 0
                      ? `+${formatRupiah(difference)}`
                      : formatRupiah(difference)}
                  </span>
                </div>
              )}

              {/* NOTES */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Penutupan
                </label>

                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Contoh: Shift malam berjalan lancar, uang sudah disetor ke brankas"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* SAVE */}

              <button
                type="submit"
                disabled={closingMutation.isPending || actualCash === ""}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-brand-500 py-3 text-xs font-extrabold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50 transition"
              >
                <Save className="h-4 w-4" />

                <span>
                  {closingMutation.isPending
                    ? "MENYIMPAN..."
                    : "SIMPAN LAPORAN TUTUP KASIR"}
                </span>
              </button>

              {/* WHATSAPP */}

              {lastClosingReport && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      <div>
                        <p className="text-xs font-extrabold text-emerald-800">
                          Laporan berhasil disimpan
                        </p>

                        <p className="text-[10px] text-emerald-600">
                          Kamu dapat mengirimkan rekap kepada Owner melalui
                          WhatsApp.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition"
                  >
                    <MessageCircle className="h-4 w-4" />

                    <span>KIRIM LAPORAN KE WHATSAPP OWNER</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (
        /* =========================
            HISTORY TAB
        ========================= */

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Jam</th>

                  <th className="py-3.5 px-4">Kasir Shift</th>

                  <th className="py-3.5 px-4 text-right">Total Penjualan</th>

                  <th className="py-3.5 px-4 text-right">Tunai Seharusnya</th>

                  <th className="py-3.5 px-4 text-right">Fisik Dihitung</th>

                  <th className="py-3.5 px-4 text-center">Selisih</th>

                  <th className="py-3.5 px-4">Catatan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {loadingHistory ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="py-4 px-4 bg-slate-50/50">
                        <div className="h-4 bg-slate-200 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      <History className="mx-auto h-8 w-8 text-slate-300 mb-2" />

                      <p className="font-semibold text-slate-600 text-xs">
                        Belum ada riwayat tutup kasir
                      </p>
                    </td>
                  </tr>
                ) : (
                  history.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatDateTime(c.date || c.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.cashier?.name || "Kasir"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-brand-600">
                        {formatRupiah(c.totalSales)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {formatRupiah(c.expectedCash)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(c.actualCash)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-black ${
                            Number(c.difference) === 0
                              ? "bg-slate-100 text-slate-600"
                              : Number(c.difference) > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {Number(c.difference) > 0
                            ? `+${formatRupiah(c.difference)}`
                            : formatRupiah(c.difference)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {c.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

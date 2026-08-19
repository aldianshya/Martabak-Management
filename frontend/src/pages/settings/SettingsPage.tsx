import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useSettings } from "../../contexts/SettingsContext";
import { formatDateTime } from "../../utils/formatters";
import {
  Settings,
  Store,
  Printer,
  Clock,
  Boxes,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"general" | "audit">("general");

  const [form, setForm] = useState<Record<string, string>>({
    store_name: settings.store_name || "Martabak Aldi",
    store_address: settings.store_address || "Jl. Raya Martabak No. 88",
    store_phone: settings.store_phone || "0812-3456-7890",
    opening_time: settings.opening_time || "16:00",
    closing_time: settings.closing_time || "23:00",
    receipt_header: settings.receipt_header || "MARTABAK ALDI\nSensasi Gurih & Manis!",
    receipt_footer: settings.receipt_footer || "Terima Kasih Atas Kunjungan Anda!",
    auto_deduct_inventory: settings.auto_deduct_inventory || "true",
    default_cash_drawer: settings.default_cash_drawer || "200000",
  });

  React.useEffect(() => {
    if (settings) {
      setForm((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  // Audit Logs Query
  const { data: auditLogsData, isLoading: loadingAudit } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.getAuditLogs({ limit: 50 }),
    enabled: activeTab === "audit",
  });

  const auditLogs = auditLogsData?.data || [];

  const updateMutation = useMutation({
    mutationFn: (newSettings: Record<string, string>) => api.updateSettings(newSettings),
    onSuccess: () => {
      alert("Pengaturan sistem berhasil disimpan!");
      refreshSettings();
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Gagal menyimpan pengaturan"),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Pengaturan Sistem & Toko
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Atur informasi gerai martabak, format struk, jam operasional, auto-potong stok, dan riwayat audit
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "general"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Store className="h-4 w-4" />
            <span>Pengaturan Toko</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Audit Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "general" ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Informasi Toko & Jam Operasional */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Store className="h-5 w-5 text-brand-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Identitas Toko & Jam Operasional
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko / Brand</label>
                <input
                  type="text"
                  required
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={form.store_phone}
                  onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Gerai</label>
                <input
                  type="text"
                  value={form.store_address}
                  onChange={(e) => setForm({ ...form, store_address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Operational Hours (CRITICAL REQUIREMENT) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Buka Toko (Opening Time)
                </label>
                <input
                  type="text"
                  placeholder="16:00"
                  value={form.opening_time}
                  onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Format: HH:mm (contoh 16:00) untuk grafik hourly dashboard
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Tutup Toko (Closing Time)
                </label>
                <input
                  type="text"
                  placeholder="23:00"
                  value={form.closing_time}
                  onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 focus:border-brand-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Format: HH:mm (contoh 23:00)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Pengaturan Struk & Kasir */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Printer className="h-5 w-5 text-brand-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Pengaturan Struk & Kasir
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Header Struk</label>
                <textarea
                  rows={2}
                  value={form.receipt_header}
                  onChange={(e) => setForm({ ...form, receipt_header: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Footer Struk</label>
                <textarea
                  rows={2}
                  value={form.receipt_footer}
                  onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modal Awal Kasir / Float (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.default_cash_drawer}
                  onChange={(e) => setForm({ ...form, default_cash_drawer: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Auto Deduct Inventory Toggle */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Boxes className="h-5 w-5 text-brand-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Pengurangan Stok Otomatis (Auto Deduct Inventory)
              </h3>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-800 block">
                    Potong Stok Bahan Otomatis dari Resep
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Jika aktif, setiap transaksi kasir akan menghitung pemakaian resep dan mengonversi satuan ke base unit secara otomatis.
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.auto_deduct_inventory === "true"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        auto_deduct_inventory: e.target.checked ? "true" : "false",
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center space-x-2 rounded-xl bg-brand-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>SIMPAN SEMUA PENGATURAN</span>
            </button>
          </div>
        </form>
      ) : (
        /* Audit Logs Tab */
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Aksi (Action)</th>
                <th className="py-3.5 px-4">Entitas</th>
                <th className="py-3.5 px-4">Rincian Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loadingAudit ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada catatan audit log
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.user?.name || "System"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-600 font-semibold">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                      {log.newValue || log.oldValue || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

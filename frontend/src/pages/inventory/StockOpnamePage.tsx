import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Ingredient, StockOpname } from "../../types";
import { formatDateTime, formatDate } from "../../utils/formatters";
import {
  ClipboardCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  History,
  Eye,
  X,
  FileSpreadsheet,
} from "lucide-react";

export const StockOpnamePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"opname" | "history">("opname");
  const [opnameDate, setOpnameDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [generalNotes, setGeneralNotes] = useState<string>("Stok opname penutupan harian");

  // Form values map: ingredientId -> { physicalStock, notes }
  const [itemsMap, setItemsMap] = useState<
    Record<string, { physicalStock: number; notes: string }>
  >({});

  const [selectedHistory, setSelectedHistory] = useState<StockOpname | null>(null);

  // Queries
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.getIngredients({ activeOnly: true }),
  });

  const { data: opnames = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["stock-opnames"],
    queryFn: () => api.getStockOpnames(),
  });

  // Initialize itemsMap when ingredients arrive
  useEffect(() => {
    if (ingredients.length > 0) {
      const initial: Record<string, { physicalStock: number; notes: string }> = {};
      for (const ing of ingredients) {
        initial[ing.id] = {
          physicalStock: Number(ing.currentStock),
          notes: "",
        };
      }
      setItemsMap(initial);
    }
  }, [ingredients]);

  const opnameMutation = useMutation({
    mutationFn: (data: any) => api.performStockOpname(data),
    onSuccess: () => {
      alert("Stok opname berhasil disimpan! Selisih stok telah disesuaikan ke inventaris.");
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-opnames"] });
      setActiveTab("history");
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Gagal menyimpan stok opname"),
  });

  const handlePhysicalChange = (id: string, val: number) => {
    setItemsMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        physicalStock: val,
      },
    }));
  };

  const handleNotesChange = (id: string, val: string) => {
    setItemsMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes: val,
      },
    }));
  };

  const handleSubmitOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length === 0) return;

    const payloadItems = ingredients.map((ing) => ({
      ingredientId: ing.id,
      physicalStock: itemsMap[ing.id]?.physicalStock ?? Number(ing.currentStock),
      notes: itemsMap[ing.id]?.notes || null,
    }));

    opnameMutation.mutate({
      date: opnameDate,
      notes: generalNotes,
      items: payloadItems,
    });
  };

  // Calculations
  let matchedCount = 0;
  let diffCount = 0;
  ingredients.forEach((ing) => {
    const phys = itemsMap[ing.id]?.physicalStock ?? Number(ing.currentStock);
    if (phys === Number(ing.currentStock)) matchedCount++;
    else diffCount++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Stok Opname Harian Bahan Baku
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Cocokkan stok sistem dengan perhitungan fisik di toko untuk mendeteksi pemakaian dan selisih
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("opname")}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-2 transition ${
              activeTab === "opname"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Form Stok Opname</span>
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
            <span>Riwayat Opname ({opnames.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "opname" ? (
        <form onSubmit={handleSubmitOpname} className="space-y-6">
          {/* Controls Bar */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-600">Tanggal Opname:</span>
              <input
                type="date"
                value={opnameDate}
                onChange={(e) => setOpnameDate(e.target.value)}
                className="border-0 bg-transparent font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Catatan umum stok opname..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-3 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Bahan</span>
              <div className="text-lg font-black text-slate-900">{ingredients.length}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-center text-emerald-800">
              <span className="text-[11px] font-bold uppercase">Stok Sesuai (0 Selisih)</span>
              <div className="text-lg font-black">{matchedCount}</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-center text-amber-800">
              <span className="text-[11px] font-bold uppercase">Ada Selisih</span>
              <div className="text-lg font-black">{diffCount}</div>
            </div>
          </div>

          {/* Opname Table */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Nama Bahan</th>
                    <th className="py-3.5 px-4 text-center">Satuan Dasar</th>
                    <th className="py-3.5 px-4 text-right">Stok Sistem</th>
                    <th className="py-3.5 px-4 text-right">Stok Fisik Nyata</th>
                    <th className="py-3.5 px-4 text-center">Selisih</th>
                    <th className="py-3.5 px-4">Catatan Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="py-4 px-4 bg-slate-50/50">
                          <div className="h-4 bg-slate-200 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Belum ada bahan baku di inventaris
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((ing) => {
                      const systemStock = Number(ing.currentStock);
                      const physicalStock =
                        itemsMap[ing.id]?.physicalStock ?? systemStock;
                      const diff = Number((physicalStock - systemStock).toFixed(3));

                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{ing.name}</span>
                            {ing.notes && (
                              <span className="text-[10px] text-slate-400">{ing.notes}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {ing.baseUnit}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            {systemStock} {ing.baseUnit}
                          </td>

                          {/* Physical Input */}
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={itemsMap[ing.id]?.physicalStock ?? systemStock}
                              onChange={(e) =>
                                handlePhysicalChange(ing.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 rounded-lg border border-slate-300 p-1.5 font-black text-right text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </td>

                          {/* Difference Display */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-xs font-black ${
                                diff === 0
                                  ? "bg-slate-100 text-slate-600"
                                  : diff > 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff} {ing.baseUnit}
                            </span>
                          </td>

                          {/* Item Note */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={itemsMap[ing.id]?.notes || ""}
                              onChange={(e) => handleNotesChange(ing.id, e.target.value)}
                              placeholder="Contoh: Terpakai 1 Toples / Rusak"
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">
              *Menyimpan opname akan secara otomatis mengoreksi saldo inventaris ke stok fisik nyata.
            </div>

            <button
              type="submit"
              disabled={opnameMutation.isPending || ingredients.length === 0}
              className="flex items-center space-x-2 rounded-xl bg-brand-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>SIMPAN & SESUAIKAN STOK OPNAME</span>
            </button>
          </div>
        </form>
      ) : (
        /* History Tab */
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tanggal Opname</th>
                <th className="py-3.5 px-4">Petugas / Kasir</th>
                <th className="py-3.5 px-4">Jumlah Item Diperiksa</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loadingHistory ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">Belum ada riwayat stok opname</p>
                  </td>
                </tr>
              ) : (
                opnames.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatDate(op.date)}
                    </td>
                    <td className="py-3.5 px-4">{op.conductedBy?.name || "Admin"}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-600">
                      {op.items?.length || 0} Bahan
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{op.notes || "-"}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        {op.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedHistory(op)}
                        className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rincian Stok Opname: {formatDate(selectedHistory.date)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Petugas: {selectedHistory.conductedBy?.name || "Admin"}
                </p>
              </div>
              <button onClick={() => setSelectedHistory(null)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Bahan Baku</th>
                    <th className="py-2.5 px-3 text-right">Sistem</th>
                    <th className="py-2.5 px-3 text-right">Fisik</th>
                    <th className="py-2.5 px-3 text-center">Selisih</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedHistory.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {item.ingredient?.name || "-"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.systemStock} {item.baseUnit}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {item.physicalStock} {item.baseUnit}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`font-black ${
                            Number(item.difference) === 0
                              ? "text-slate-400"
                              : Number(item.difference) > 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {Number(item.difference) > 0 ? `+${item.difference}` : item.difference}{" "}
                          {item.baseUnit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{item.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setSelectedHistory(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

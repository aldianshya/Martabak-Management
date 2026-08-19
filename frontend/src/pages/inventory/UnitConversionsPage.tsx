import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { UnitConversion, Ingredient } from "../../types";
import { Scale, Plus, Trash2, ArrowRight, X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const UnitConversionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    ingredientId: "",
    fromUnit: "",
    toUnit: "",
    conversionRate: 1,
  });

  const { data: conversions = [], isLoading } = useQuery({
    queryKey: ["conversions"],
    queryFn: () => api.getConversions(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.getIngredients({ activeOnly: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createConversion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversions"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setModalOpen(false);
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Gagal menyimpan aturan konversi satuan"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteConversion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversions"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal menghapus aturan konversi"),
  });

  const handleOpenAdd = () => {
    const defaultIng = ingredients[0];
    setForm({
      ingredientId: defaultIng?.id || "",
      fromUnit: "TOPLES",
      toUnit: defaultIng?.baseUnit || "KG",
      conversionRate: 0.5,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ingredientId || !form.fromUnit || !form.toUnit || form.conversionRate <= 0) {
      alert("Harap lengkapi semua field aturan konversi.");
      return;
    }

    createMutation.mutate({
      ingredientId: form.ingredientId,
      fromUnit: form.fromUnit.trim().toUpperCase(),
      toUnit: form.toUnit.trim().toUpperCase(),
      conversionRate: form.conversionRate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/inventory" className="text-xs font-bold text-brand-600 hover:underline">
              ← Kembali ke Stok
            </Link>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl mt-1">
            Aturan Konversi Satuan Stok
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Tentukan hubungan konversi eksplisit antara satuan operasional (Toples, Sak, Gram, Tray) ke Base Unit (KG, PCS)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Aturan Konversi</span>
        </button>
      </div>

      {/* Info Alert */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Prinsip Konversi Terukur:</span> Sistem tidak pernah
          mengasumsikan konversi secara otomatis tanpa aturan dari Admin. Contoh: jika Anda mencatat
          pemakaian <strong>1 TOPLES Mesis</strong> dan aturan menyatakan <strong>1 TOPLES = 0.5 KG</strong>,
          maka stok sistem akan berkurang tepat <strong>0.5 KG</strong>.
        </div>
      </div>

      {/* Conversion Rules Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Nama Bahan</th>
              <th className="py-3.5 px-4">Satuan Asal (From)</th>
              <th className="py-3.5 px-4 text-center">Hubungan Rumus</th>
              <th className="py-3.5 px-4">Satuan Dasar (Base Unit)</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="py-4 px-4 bg-slate-50/50">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : conversions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Scale className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600 text-xs">Belum ada aturan konversi</p>
                  <p className="text-[11px]">Tambahkan aturan seperti 1 TOPLES = 0.5 KG</p>
                </td>
              </tr>
            ) : (
              conversions.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{conv.ingredient?.name}</span>
                    <span className="text-[10px] text-slate-400">Base Unit: {conv.ingredient?.baseUnit}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      1 {conv.fromUnit}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center space-x-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-brand-800 font-black">
                      <span>1 {conv.fromUnit}</span>
                      <ArrowRight className="h-3 w-3 text-brand-500" />
                      <span>{conv.conversionRate} {conv.toUnit}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      {conv.conversionRate} {conv.toUnit}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Hapus aturan konversi 1 ${conv.fromUnit} = ${conv.conversionRate} ${conv.toUnit}?`)) {
                          deleteMutation.mutate(conv.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Aturan Konversi</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Pilih Bahan Baku</label>
                <select
                  value={form.ingredientId}
                  onChange={(e) => {
                    const ing = ingredients.find((i) => i.id === e.target.value);
                    setForm({
                      ...form,
                      ingredientId: e.target.value,
                      toUnit: ing?.baseUnit || "KG",
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold focus:border-brand-500 focus:outline-none"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Base: {i.baseUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Satuan Asal (From Unit)</label>
                  <input
                    type="text"
                    required
                    value={form.fromUnit}
                    onChange={(e) => setForm({ ...form, fromUnit: e.target.value.toUpperCase() })}
                    placeholder="Contoh: TOPLES, SAK, GRAM"
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block mb-1">Satuan Tujuan (To Unit)</label>
                  <input
                    type="text"
                    required
                    value={form.toUnit}
                    onChange={(e) => setForm({ ...form, toUnit: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold uppercase bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Nilai Konversi (1 {form.fromUnit || "Satuan"} = X {form.toUnit || "Base"})</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  value={form.conversionRate}
                  onChange={(e) => setForm({ ...form, conversionRate: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-center text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Contoh: 1 TOPLES Mesis = 0.5 KG, maka masukkan 0.5
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

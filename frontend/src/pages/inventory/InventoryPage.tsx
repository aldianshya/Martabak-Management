import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Ingredient, MovementType } from "../../types";
import { formatRupiah } from "../../utils/formatters";
import { WhatsAppExportModal } from "../../components/common/WhatsAppExportModal";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Scale,
  Share2,
  X,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    baseUnit: "KG",
    currentStock: 0,
    minimumStock: 0,
    costPerUnit: 0,
    notes: "",
    isActive: true,
  });

  // Quick Movement Modal
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedIngredientForMove, setSelectedIngredientForMove] = useState<Ingredient | null>(null);
  const [movementForm, setMovementForm] = useState({
    type: "STOCK_IN" as MovementType,
    quantity: 1,
    unit: "KG",
    notes: "",
  });

  // WhatsApp Stock Report Modal
  const [waModalOpen, setWaModalOpen] = useState(false);

  // Queries
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["ingredients", search, lowStockOnly],
    queryFn: () =>
      api.getIngredients({
        search: search || undefined,
        lowStockOnly,
      }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setAddEditModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal menambah bahan baku"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateIngredient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setAddEditModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal mengupdate bahan baku"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal menghapus bahan baku"),
  });

  const recordMovementMutation = useMutation({
    mutationFn: (data: any) => api.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setMovementModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal mencatat mutasi stok"),
  });

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: "",
      baseUnit: "KG",
      currentStock: 0,
      minimumStock: 2,
      costPerUnit: 0,
      notes: "",
      isActive: true,
    });
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      baseUnit: ing.baseUnit,
      currentStock: Number(ing.currentStock),
      minimumStock: Number(ing.minimumStock),
      costPerUnit: Number(ing.costPerUnit || 0),
      notes: ing.notes || "",
      isActive: ing.isActive,
    });
    setAddEditModalOpen(true);
  };

  const handleOpenQuickMove = (ing: Ingredient, type: "STOCK_IN" | "STOCK_OUT") => {
    setSelectedIngredientForMove(ing);
    setMovementForm({
      type,
      quantity: 1,
      unit: ing.baseUnit,
      notes: type === "STOCK_IN" ? "Barang masuk / Pembelian baru" : "Penggunaan meja racik",
    });
    setMovementModalOpen(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name || !ingredientForm.baseUnit) {
      alert("Nama bahan dan base unit wajib diisi.");
      return;
    }

    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data: ingredientForm });
    } else {
      createMutation.mutate(ingredientForm);
    }
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientForMove) return;

    recordMovementMutation.mutate({
      ingredientId: selectedIngredientForMove.id,
      type: movementForm.type,
      quantity: movementForm.quantity,
      unit: movementForm.unit,
      notes: movementForm.notes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Inventaris Bahan Baku Martabak
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola stok bahan dalam base unit (KG, PCS, BTL, dll), peringatan stok menipis, dan mutasi barang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWaModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Share2 className="h-4 w-4" />
            <span>COPY STOK WA</span>
          </button>

          <Link
            to="/inventory/conversions"
            className="flex items-center space-x-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            <Scale className="h-4 w-4 text-brand-600" />
            <span>Aturan Konversi</span>
          </Link>

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama bahan (Tepung, Telur, Mesis, Keju)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs font-medium focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="flex items-center text-amber-800">
              <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" />
              Tampilkan Stok Menipis/Habis Saja
            </span>
          </label>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Bahan</th>
                <th className="py-3.5 px-4 text-center">Base Unit</th>
                <th className="py-3.5 px-4 text-right">Stok Saat Ini</th>
                <th className="py-3.5 px-4 text-right">Min. Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Konversi Satuan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4 bg-slate-50/50">
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : ingredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Boxes className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">Belum ada bahan baku</p>
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{ing.name}</span>
                      {ing.notes && <span className="text-[10px] text-slate-400">{ing.notes}</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {ing.baseUnit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900 text-sm block">
                        {ing.currentStock} {ing.baseUnit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 font-semibold">
                      {ing.minimumStock} {ing.baseUnit}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          ing.stockStatus === "HABIS"
                            ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                            : ing.stockStatus === "MENIPIS"
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {ing.stockStatus === "HABIS"
                          ? "Stok Habis"
                          : ing.stockStatus === "MENIPIS"
                          ? "Stok Menipis"
                          : "Aman"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {ing.conversions && ing.conversions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ing.conversions.map((conv) => (
                            <span
                              key={conv.id}
                              className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.5 text-[10px] font-bold text-brand-700"
                            >
                              1 {conv.fromUnit} = {conv.conversionRate} {conv.toUnit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">1:1 Base</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Quick Stock In */}
                        <button
                          onClick={() => handleOpenQuickMove(ing, "STOCK_IN")}
                          title="Barang Masuk / Pembelian"
                          className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        </button>

                        {/* Quick Stock Out */}
                        <button
                          onClick={() => handleOpenQuickMove(ing, "STOCK_OUT")}
                          title="Barang Keluar / Terpakai"
                          className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(ing)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Hapus bahan ${ing.name}?`)) {
                              deleteMutation.mutate(ing.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal */}
      {addEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingIngredient ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
              </h3>
              <button onClick={() => setAddEditModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Nama Bahan</label>
                <input
                  type="text"
                  required
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  placeholder="Contoh: Tepung Terigu, Mesis Coklat, Telur Ayam"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Base Unit</label>
                  <select
                    value={ingredientForm.baseUnit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, baseUnit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none font-bold"
                  >
                    <option value="KG">KG (Kilogram)</option>
                    <option value="GRAM">GRAM</option>
                    <option value="PCS">PCS (Butir / Biji)</option>
                    <option value="BTL">BTL (Botol)</option>
                    <option value="BKS">BKS (Bungkus)</option>
                    <option value="SASSET">SASSET</option>
                    <option value="TOPLES">TOPLES</option>
                    <option value="GALON">GALON</option>
                    <option value="LITER">LITER</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Stok Awal ({ingredientForm.baseUnit})</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ingredientForm.currentStock}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Minimum Stok (Alert)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ingredientForm.minimumStock}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, minimumStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Harga Beli / Unit (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={ingredientForm.costPerUnit}
                    onChange={(e) =>
                      setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Catatan Operasional</label>
                <textarea
                  rows={2}
                  value={ingredientForm.notes}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, notes: e.target.value })}
                  placeholder="Contoh: 1 Toples = 0.5 KG, simpan di tempat kering"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddEditModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Movement Modal */}
      {movementModalOpen && selectedIngredientForMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Catat Mutasi: {selectedIngredientForMove.name}
              </h3>
              <button onClick={() => setMovementModalOpen(false)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: "STOCK_IN" })}
                  className={`rounded-xl p-2.5 text-center font-bold transition border ${
                    movementForm.type === "STOCK_IN"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  📥 Barang Masuk
                </button>

                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: "STOCK_OUT" })}
                  className={`rounded-xl p-2.5 text-center font-bold transition border ${
                    movementForm.type === "STOCK_OUT"
                      ? "bg-rose-500 text-white border-rose-600 shadow"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  📤 Barang Keluar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Kuantitas</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={movementForm.quantity}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={movementForm.unit}
                    onChange={(e) => setMovementForm({ ...movementForm, unit: e.target.value.toUpperCase() })}
                    placeholder={selectedIngredientForMove.baseUnit}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-center uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Keterangan</label>
                <input
                  type="text"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Contoh: Pengisian 1 toples meja racik"
                  className="w-full rounded-xl border border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recordMovementMutation.isPending}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                >
                  Catat Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Stock Export Modal */}
      <WhatsAppExportModal
        type="stock"
        isOpen={waModalOpen}
        onClose={() => setWaModalOpen(false)}
      />
    </div>
  );
};

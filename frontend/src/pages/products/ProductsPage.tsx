import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Product, MenuCategory, Ingredient } from "../../types";
import { formatRupiah, formatDateTime } from "../../utils/formatters";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  History,
  BookOpen,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from "lucide-react";

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Add/Edit Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: 0,
    costPrice: 0,
    description: "",
    isAvailable: true,
    isActive: true,
    priceChangeReason: "",
  });

  // Recipe Modal
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [currentProductForRecipe, setCurrentProductForRecipe] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<
    Array<{ ingredientId: string; quantityNeeded: number; unit: string }>
  >([]);

  // Price History Modal
  const [priceHistoryModalOpen, setPriceHistoryModalOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", selectedCategory, search],
    queryFn: () =>
      api.getProducts({
        categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
        search: search || undefined,
      }),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.getIngredients({ activeOnly: true }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal membuat produk"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal memperbarui produk"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal menghapus produk"),
  });

  const saveRecipeMutation = useMutation({
    mutationFn: ({ id, recipes }: { id: string; recipes: any[] }) =>
      api.saveProductRecipes(id, recipes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRecipeModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal menyimpan resep"),
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      price: 0,
      costPrice: 0,
      description: "",
      isAvailable: true,
      isActive: true,
      priceChangeReason: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      price: Number(p.price),
      costPrice: Number(p.costPrice || 0),
      description: p.description || "",
      isAvailable: p.isAvailable,
      isActive: p.isActive,
      priceChangeReason: "",
    });
    setModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) {
      alert("Nama produk dan kategori wajib diisi.");
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenRecipe = (product: Product) => {
    setCurrentProductForRecipe(product);
    if (product.recipes && product.recipes.length > 0) {
      setRecipeItems(
        product.recipes.map((r) => ({
          ingredientId: r.ingredientId,
          quantityNeeded: Number(r.quantityNeeded),
          unit: r.unit,
        }))
      );
    } else {
      setRecipeItems([]);
    }
    setRecipeModalOpen(true);
  };

  const handleAddRecipeRow = () => {
    if (ingredients.length === 0) return;
    setRecipeItems((prev) => [
      ...prev,
      {
        ingredientId: ingredients[0].id,
        quantityNeeded: 1,
        unit: ingredients[0].baseUnit,
      },
    ]);
  };

  const handleSaveRecipe = () => {
    if (!currentProductForRecipe) return;
    saveRecipeMutation.mutate({
      id: currentProductForRecipe.id,
      recipes: recipeItems,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Daftar Menu & Resep Martabak
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola katalog menu, harga jual, harga modal (HPP), dan komposisi resep bahan baku
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs font-medium focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Menu & Kategori</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Modal (HPP)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Resep Bahan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 text-xs">Belum ada data menu</p>
                    <p className="text-[11px]">Klik tombol "Tambah Menu Baru" untuk menambahkan</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🥞</div>
                        <div>
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-brand-600 font-semibold">
                            {p.category?.name || "Kategori"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-slate-900 text-sm">
                          {formatRupiah(p.price)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProductHistory(p);
                            setPriceHistoryModalOpen(true);
                          }}
                          title="Lihat Histori Harga"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 font-semibold">{formatRupiah(p.costPrice)}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Margin: {formatRupiah(Number(p.price) - Number(p.costPrice))}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          p.isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.isAvailable ? "Tersedia" : "Kosong"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenRecipe(p)}
                        className="inline-flex items-center space-x-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Resep ({p.recipes?.length || 0})</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus menu ${p.name}?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? "Edit Menu Martabak" : "Tambah Menu Baru"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kacang Mesis"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Kategori</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                >
                  <option value="" disabled>
                    Pilih Kategori
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Harga Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {editingProduct && Number(editingProduct.price) !== Number(formData.price) && (
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-800">
                  <label className="block mb-1 text-[11px] font-bold">Alasan Perubahan Harga</label>
                  <input
                    type="text"
                    value={formData.priceChangeReason}
                    onChange={(e) => setFormData({ ...formData, priceChangeReason: e.target.value })}
                    placeholder="Contoh: Kenaikan harga bahan baku"
                    className="w-full rounded-lg border border-amber-300 bg-white p-2 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block mb-1">Deskripsi Menu</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan isian topping..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded text-brand-600"
                  />
                  <span>Tersedia untuk dijual</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-600"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Builder Modal */}
      {recipeModalOpen && currentProductForRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500 px-5 py-4 text-white">
              <div>
                <h3 className="font-bold text-sm">Resep: {currentProductForRecipe.name}</h3>
                <p className="text-[11px] text-amber-100">
                  Tentukan bahan yang otomatis dipotong saat martabak ini terjual
                </p>
              </div>
              <button onClick={() => setRecipeModalOpen(false)} className="text-white hover:bg-amber-600 p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {recipeItems.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <select
                    value={item.ingredientId}
                    onChange={(e) => {
                      const ing = ingredients.find((i) => i.id === e.target.value);
                      const updated = [...recipeItems];
                      updated[idx].ingredientId = e.target.value;
                      if (ing) updated[idx].unit = ing.baseUnit;
                      setRecipeItems(updated);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 p-1.5 font-bold"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (Base: {ing.baseUnit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={item.quantityNeeded}
                    onChange={(e) => {
                      const updated = [...recipeItems];
                      updated[idx].quantityNeeded = parseFloat(e.target.value) || 0;
                      setRecipeItems(updated);
                    }}
                    className="w-20 rounded-lg border border-slate-300 p-1.5 text-center font-bold"
                  />

                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => {
                      const updated = [...recipeItems];
                      updated[idx].unit = e.target.value.toUpperCase();
                      setRecipeItems(updated);
                    }}
                    placeholder="Unit"
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-bold uppercase"
                  />

                  <button
                    type="button"
                    onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRecipeRow}
                className="w-full flex items-center justify-center space-x-1 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-600 hover:border-brand-500 hover:text-brand-600"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Bahan Baku</span>
              </button>
            </div>

            <div className="flex justify-end space-x-2 p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRecipeModalOpen(false)}
                className="rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={saveRecipeMutation.isPending}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
              >
                Simpan Resep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {priceHistoryModalOpen && selectedProductHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Histori Perubahan Harga: {selectedProductHistory.name}
              </h3>
              <button onClick={() => setPriceHistoryModalOpen(false)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3 text-xs">
              {selectedProductHistory.priceHistory && selectedProductHistory.priceHistory.length > 0 ? (
                selectedProductHistory.priceHistory.map((h) => (
                  <div key={h.id} className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{formatRupiah(h.oldPrice)} → {formatRupiah(h.newPrice)}</span>
                      <span className="text-slate-400 text-[10px] font-normal">{formatDateTime(h.createdAt)}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Oleh: <span className="font-semibold text-slate-700">{h.changedBy || "Admin"}</span>
                    </div>
                    {h.reason && <div className="text-slate-600 italic text-[11px]">Catatan: {h.reason}</div>}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400">Belum ada riwayat perubahan harga</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

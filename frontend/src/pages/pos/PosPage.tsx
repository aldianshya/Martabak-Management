import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Product, MenuCategory, PaymentMethod, Transaction } from "../../types";
import { formatRupiah } from "../../utils/formatters";
import { ReceiptModal } from "../../components/common/ReceiptModal";
import { useSettings } from "../../contexts/SettingsContext";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Users,
  DollarSign,
  QrCode,
  Smartphone,
  Globe,
  Receipt,
  Sparkles,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const PosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  // Search and category filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerCount, setCustomerCount] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [txNotes, setTxNotes] = useState<string>("");

  // Receipt Modal state
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch Categories & Products
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(true),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products", selectedCategory, search],
    queryFn: () =>
      api.getProducts({
        categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
        search: search || undefined,
        availableOnly: true,
      }),
  });

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);

  const numCashReceived = typeof cashReceived === "number" ? cashReceived : 0;
  const cashChange = paymentMethod === "CASH" && numCashReceived >= total ? numCashReceived - total : 0;
  const isCashInsufficient =
    paymentMethod === "CASH" && cashReceived !== "" && numCashReceived < total;

  // Cart Operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerCount(1);
    setDiscount(0);
    setCashReceived("");
    setTxNotes("");
  };

  // Quick preset cash denomination
  const setQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  // Transaction Mutation
  const createTxMutation = useMutation({
    mutationFn: (txData: any) => api.createTransaction(txData),
    onSuccess: (data) => {
      setCompletedTransaction(data);
      setShowReceiptModal(true);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["hourly-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Gagal memproses transaksi.");
    },
  });

  const handleProcessTransaction = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "CASH" && (cashReceived === "" || numCashReceived < total)) {
      alert("Nominal uang tunai yang diterima kurang dari total tagihan.");
      return;
    }

    createTxMutation.mutate({
      customerCount: Math.max(1, customerCount),
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
      discount,
      paymentMethod,
      cashReceived: paymentMethod === "CASH" ? numCashReceived : null,
      notes: txNotes || null,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left 7/12: Menu Catalog & Categories */}
      <div className="space-y-4 lg:col-span-7 xl:col-span-8">
        {/* Search & Category Filter Bar */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama martabak atau minuman..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Categories Tab Pill Selector */}
          <div className="flex space-x-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`rounded-xl px-3.5 py-2 whitespace-nowrap transition ${
                selectedCategory === "ALL"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-2 whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center border border-dashed border-slate-300 text-slate-400">
            <ShoppingBag className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-semibold text-xs text-slate-600">Tidak ada produk ditemukan</p>
            <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau kategori</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group relative flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm border transition-all cursor-pointer select-none hover:shadow-md hover:border-brand-300 ${
                    inCart
                      ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20"
                      : "border-slate-200"
                  }`}
                >
                  {inCart && (
                    <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-black shadow">
                      {inCart.quantity}
                    </div>
                  )}

                  <div>
                    <div className="text-2xl mb-2">🥞</div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 transition line-clamp-2">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-xs text-brand-600">
                      {formatRupiah(product.price)}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 group-hover:bg-brand-500 group-hover:text-white transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right 5/12: Active Cart, Customer Count, & Payment Calculator */}
      <div className="space-y-4 lg:col-span-5 xl:col-span-4">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Keranjang Kasir ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
              >
                Reset
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 max-h-[36vh] overflow-y-auto p-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-slate-400">Klik menu di sebelah kiri untuk menambah</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-start justify-between text-xs">
                    <span className="font-bold text-slate-800 flex-1 pr-2">
                      {item.product.name}
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatRupiah(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatRupiah(item.product.price)} / porsi</span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Count Input (CRITICAL REQUIREMENT) */}
          <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <Users className="h-4 w-4 text-brand-500" />
                <span>Jumlah Pembeli:</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCustomerCount((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={customerCount}
                  onChange={(e) => setCustomerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center rounded-lg border border-slate-200 py-0.5 text-xs font-black text-slate-900 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setCustomerCount((prev) => prev + 1)}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-400 font-medium">Orang</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: "CASH", label: "CASH", icon: DollarSign },
                  { id: "QRIS", label: "QRIS", icon: QrCode },
                  { id: "SHOPEE", label: "Shopee", icon: Smartphone },
                  { id: "ONLINE", label: "Online", icon: Globe },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 transition border ${
                        paymentMethod === m.id
                          ? "bg-brand-500 border-brand-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 mb-1" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If CASH: Quick Money Calculator & Change */}
            {paymentMethod === "CASH" && (
              <div className="rounded-xl bg-white p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Uang Diterima:</span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) =>
                        setCashReceived(e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                      placeholder={total.toString()}
                      className="w-32 rounded-lg border border-slate-300 pl-7 pr-2 py-1 text-xs font-bold text-right focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Cash Buttons */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickCash(total)}
                    className="rounded bg-slate-100 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(20000)}
                    className="rounded bg-slate-100 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    20k
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(50000)}
                    className="rounded bg-slate-100 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    50k
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCash(100000)}
                    className="rounded bg-slate-100 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    100k
                  </button>
                </div>

                {/* Change or Warning */}
                {isCashInsufficient ? (
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-rose-600 pt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Uang kurang Rp {(total - numCashReceived).toLocaleString("id-ID")}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Kembalian:</span>
                    <span className="text-emerald-600 font-extrabold text-sm">
                      {formatRupiah(cashChange)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Discount & Totals */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Diskon (Rp):</span>
                <input
                  type="number"
                  min="0"
                  value={discount === 0 ? "" : discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-right focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="text-brand-600 text-lg">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Submit Transaction Button */}
            <button
              type="button"
              onClick={handleProcessTransaction}
              disabled={cart.length === 0 || createTxMutation.isPending || isCashInsufficient}
              className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-brand-500 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 transition"
            >
              {createTxMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>PROSES PEMBAYARAN ({formatRupiah(total)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      <ReceiptModal
        transaction={completedTransaction}
        storeName={settings.store_name}
        storeAddress={settings.store_address}
        storePhone={settings.store_phone}
        receiptHeader={settings.receipt_header}
        receiptFooter={settings.receipt_footer}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

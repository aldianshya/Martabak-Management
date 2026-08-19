import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { StockMovement, MovementType } from "../../types";
import { formatDateTime } from "../../utils/formatters";
import {
  ArrowLeftRight,
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

export const MovementsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [ingredientId, setIngredientId] = useState<string>("");
  const [type, setType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.getIngredients(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["movements", page, limit, ingredientId, type, startDate, endDate],
    queryFn: () =>
      api.getMovements({
        page,
        limit,
        ingredientId: ingredientId || undefined,
        type: type !== "ALL" ? type : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const movements = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 };

  const getMovementBadge = (mType: MovementType) => {
    switch (mType) {
      case "INITIAL_STOCK":
        return <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Stok Awal</span>;
      case "STOCK_IN":
        return <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Barang Masuk</span>;
      case "STOCK_OUT":
        return <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">Barang Keluar</span>;
      case "RECIPE_USAGE":
        return <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">Resep Menu</span>;
      case "STOCK_OPNAME":
        return <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">Stok Opname</span>;
      case "ADJUSTMENT":
        return <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">Penyesuaian</span>;
      default:
        return <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{mType}</span>;
    }
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
            Riwayat Mutasi & Pergerakan Stok
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Histori lengkap keluar masuk barang, pemakaian resep, konversi satuan, dan penyesuaian opname
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ingredient Filter */}
        <div>
          <select
            value={ingredientId}
            onChange={(e) => {
              setIngredientId(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="">Semua Bahan Baku</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type Filter */}
        <div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Mutasi</option>
            <option value="STOCK_IN">Barang Masuk (STOCK_IN)</option>
            <option value="STOCK_OUT">Barang Keluar (STOCK_OUT)</option>
            <option value="RECIPE_USAGE">Pemakaian Resep (RECIPE_USAGE)</option>
            <option value="STOCK_OPNAME">Stok Opname (STOCK_OPNAME)</option>
            <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
            <option value="INITIAL_STOCK">Stok Awal (INITIAL_STOCK)</option>
          </select>
        </div>

        {/* Date From */}
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

        {/* Date To */}
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
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Bahan Baku</th>
                <th className="py-3.5 px-4 text-center">Jenis Mutasi</th>
                <th className="py-3.5 px-4">Jumlah Input Asli</th>
                <th className="py-3.5 px-4 text-right">Hasil Konversi (Base)</th>
                <th className="py-3.5 px-4 text-right">Saldo Stok</th>
                <th className="py-3.5 px-4">Keterangan & User</th>
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
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">Belum ada riwayat mutasi stok</p>
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDateTime(m.createdAt || m.date)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {m.ingredient?.name || "-"}
                    </td>

                    <td className="py-3.5 px-4 text-center">{getMovementBadge(m.type)}</td>

                    {/* Original Input Unit */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">
                        {m.quantity} {m.unit}
                      </span>
                    </td>

                    {/* Converted Base Quantity */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-brand-600">
                      {m.baseQuantity} {m.baseUnit}
                    </td>

                    {/* Stock Before -> Stock After in Base Unit */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="text-slate-400">{m.stockBefore}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-black text-slate-900">{m.stockAfter} {m.baseUnit}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-slate-700 block truncate">{m.notes || "-"}</span>
                      <span className="text-[10px] text-slate-400">
                        Oleh: {m.user?.name || "Sistem"}
                      </span>
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
            <span>Baris:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Total: {pagination.total} catatan mutasi</span>
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
    </div>
  );
};

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import { PurchaseRequest, PurchaseRequestStatus, Ingredient } from "../../types";
import { formatDate, formatDateTime } from "../../utils/formatters";
import { copyToClipboard, shareToWhatsApp } from "../../utils/whatsapp";
import { useAuth } from "../../contexts/AuthContext";
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Share2,
  Copy,
  Check,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";

export const PurchaseRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [requestNotes, setRequestNotes] = useState(
    "Permintaan barang mingguan untuk persiapan stok akhir pekan"
  );
  const [items, setItems] = useState<
    Array<{ ingredientId?: string; ingredientName: string; quantity: number; unit: string; notes?: string }>
  >([]);

  // Queries
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["purchase-requests", statusFilter],
    queryFn: () => api.getPurchaseRequests(statusFilter),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.getIngredients({ activeOnly: true }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPurchaseRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      setModalOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal mengajukan permintaan"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.updatePurchaseRequestStatus(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      if (selectedPR) setSelectedPR(null);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Gagal memperbarui status"),
  });

  const handleOpenAdd = () => {
    if (ingredients.length > 0) {
      setItems([
        {
          ingredientId: ingredients[0].id,
          ingredientName: ingredients[0].name,
          quantity: 10,
          unit: ingredients[0].baseUnit,
          notes: "",
        },
      ]);
    } else {
      setItems([{ ingredientName: "Tepung Terigu", quantity: 1, unit: "SAK", notes: "" }]);
    }
    setModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultIng = ingredients[0];
    setItems((prev) => [
      ...prev,
      {
        ingredientId: defaultIng?.id,
        ingredientName: defaultIng ? defaultIng.name : "",
        quantity: 1,
        unit: defaultIng ? defaultIng.baseUnit : "KG",
        notes: "",
      },
    ]);
  };

  const handleSavePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Tambahkan minimal 1 item barang.");
      return;
    }

    createMutation.mutate({
      notes: requestNotes,
      items: items.map((i) => ({
        ingredientId: i.ingredientId || null,
        ingredientName: i.ingredientName,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes || null,
      })),
    });
  };

  const generateWhatsAppText = (pr: PurchaseRequest) => {
    const lines = [
      "📦 *PERMINTAAN BARANG / RESTOCK*",
      `Nomor: ${pr.requestNumber}`,
      `Tanggal: ${formatDate(pr.date)}`,
      `Oleh: ${pr.requestedBy?.name || "Kasir"}`,
      `Status: ${pr.status}`,
      "--------------------------------",
      "*DAFTAR BARANG YANG DIBUTUHKAN:*",
    ];

    pr.items.forEach((item, idx) => {
      const noteStr = item.notes ? ` (${item.notes})` : "";
      lines.push(`${idx + 1}. ${item.ingredientName} — ${item.quantity} ${item.unit}${noteStr}`);
    });

    if (pr.notes) {
      lines.push("--------------------------------");
      lines.push(`Catatan: ${pr.notes}`);
    }

    return lines.join("\n");
  };

  const handleCopyWA = async (pr: PurchaseRequest) => {
    const text = generateWhatsAppText(pr);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWA = async (pr: PurchaseRequest) => {
    const text = generateWhatsAppText(pr);
    await shareToWhatsApp(text, `Permintaan Barang ${pr.requestNumber}`);
  };

  const getStatusBadge = (status: PurchaseRequestStatus) => {
    switch (status) {
      case "DRAFT":
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">Draft</span>;
      case "SUBMITTED":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">Diajukan</span>;
      case "APPROVED":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Disetujui</span>;
      case "REJECTED":
        return <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">Ditolak</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">Selesai Diterima</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Permintaan Barang & Restock
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Catat pengajuan kebutuhan bahan baku mingguan atau mendesak dari kasir/cabang ke owner
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Permintaan Barang</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex space-x-2 overflow-x-auto text-xs font-bold">
          {["ALL", "SUBMITTED", "APPROVED", "COMPLETED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-2 transition ${
                statusFilter === st
                  ? "bg-brand-500 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL"
                ? "Semua Status"
                : st === "SUBMITTED"
                ? "Diajukan"
                : st === "APPROVED"
                ? "Disetujui"
                : st === "COMPLETED"
                ? "Selesai"
                : "Ditolak"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">No. Pengajuan & Tgl</th>
              <th className="py-3.5 px-4">Pemohon</th>
              <th className="py-3.5 px-4">Daftar Barang</th>
              <th className="py-3.5 px-4 text-center">Status</th>
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
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Truck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600 text-xs">Belum ada pengajuan permintaan barang</p>
                </td>
              </tr>
            ) : (
              requests.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{pr.requestNumber}</span>
                    <span className="text-[11px] text-slate-400">{formatDate(pr.date)}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{pr.requestedBy?.name || "Kasir"}</span>
                    {pr.reviewedBy && (
                      <span className="text-[10px] text-slate-400">Review: {pr.reviewedBy.name}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="line-clamp-2 text-slate-700">
                      {pr.items.map((it, idx) => (
                        <span key={idx}>
                          {idx > 0 && ", "}
                          <span className="font-bold">{it.ingredientName}</span> ({it.quantity} {it.unit})
                        </span>
                      ))}
                    </div>
                    {pr.notes && <span className="text-[10px] text-slate-400 italic block mt-0.5">*{pr.notes}</span>}
                  </td>

                  <td className="py-3.5 px-4 text-center">{getStatusBadge(pr.status)}</td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedPR(pr)}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 transition"
                        title="Lihat Rincian"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopyWA(pr)}
                        className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Copy Format WA"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleShareWA(pr)}
                        className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition"
                        title="Share ke WhatsApp"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create PR Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">Buat Permintaan Barang (Restock)</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePR} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Catatan Pengajuan</label>
                <input
                  type="text"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Contoh: Permintaan barang setiap hari Sabtu untuk kebutuhan satu minggu"
                  className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5">Daftar Barang yang Diminta</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={it.ingredientId || ""}
                        onChange={(e) => {
                          const ing = ingredients.find((i) => i.id === e.target.value);
                          const updated = [...items];
                          updated[idx].ingredientId = e.target.value;
                          if (ing) {
                            updated[idx].ingredientName = ing.name;
                            updated[idx].unit = ing.baseUnit;
                          }
                          setItems(updated);
                        }}
                        className="flex-1 rounded-lg border border-slate-300 p-1.5 text-xs font-bold"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (Base: {ing.baseUnit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={it.quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].quantity = parseFloat(e.target.value) || 0;
                          setItems(updated);
                        }}
                        className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-bold"
                      />

                      <input
                        type="text"
                        required
                        value={it.unit}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].unit = e.target.value.toUpperCase();
                          setItems(updated);
                        }}
                        placeholder="Satuan"
                        className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-bold uppercase"
                      />

                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="w-full flex items-center justify-center space-x-1 rounded-xl border-2 border-dashed border-slate-300 py-2 text-xs font-bold text-slate-600 hover:border-brand-500 hover:text-brand-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris Barang</span>
                  </button>
                </div>
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
                  Ajukan Permintaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail PR & Approval Modal */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedPR.requestNumber}</h3>
                <p className="text-[11px] text-slate-400">{formatDateTime(selectedPR.date)}</p>
              </div>
              <button onClick={() => setSelectedPR(null)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                <span className="font-bold text-slate-600">Status Saat Ini:</span>
                <div>{getStatusBadge(selectedPR.status)}</div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1.5">Rincian Barang Diminta:</span>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {selectedPR.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2.5">
                      <span className="font-bold text-slate-900">{item.ingredientName}</span>
                      <span className="font-extrabold text-brand-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPR.notes && (
                <div className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  Catatan: {selectedPR.notes}
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && selectedPR.status === "SUBMITTED" && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="font-bold text-slate-700 block">Tindakan Admin:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedPR.id, status: "APPROVED" })
                      }
                      className="rounded-xl bg-emerald-500 py-2 text-white font-bold hover:bg-emerald-600"
                    >
                      Setujui (Approve)
                    </button>
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedPR.id, status: "REJECTED" })
                      }
                      className="rounded-xl bg-rose-500 py-2 text-white font-bold hover:bg-rose-600"
                    >
                      Tolak (Reject)
                    </button>
                  </div>
                </div>
              )}

              {selectedPR.status === "APPROVED" && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedPR.id, status: "COMPLETED" })
                    }
                    className="w-full rounded-xl bg-blue-500 py-2 text-white font-bold hover:bg-blue-600"
                  >
                    Tandai Selesai / Barang Diterima
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

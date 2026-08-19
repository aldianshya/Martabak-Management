import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { copyToClipboard, shareToWhatsApp } from "../../utils/whatsapp";
import { downloadTextFile } from "../../utils/export";
import { Copy, Share2, Download, Check, X, RefreshCw, Send } from "lucide-react";

interface WhatsAppExportModalProps {
  type: "sales" | "stock";
  date?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppExportModal: React.FC<WhatsAppExportModalProps> = ({
  type,
  date,
  isOpen,
  onClose,
}) => {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    date || new Date().toISOString().split("T")[0]
  );

  const fetchReportText = async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await api.getWhatsAppReport(type, targetDate);
      setText(res.text);
    } catch (err) {
      console.error("Gagal memuat format WhatsApp:", err);
      setText("Terjadi kesalahan saat memuat data laporan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReportText(selectedDate);
    }
  }, [isOpen, selectedDate, type]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareToWhatsApp(
      text,
      type === "sales" ? "Laporan Penjualan Martabak" : "Laporan Stok Martabak"
    );
  };

  const handleDownload = () => {
    const filename = `Laporan-${type.toUpperCase()}-${selectedDate}.txt`;
    downloadTextFile(filename, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <div>
              <h3 className="font-bold text-sm">
                {type === "sales" ? "Laporan Penjualan WhatsApp" : "Laporan Stok WhatsApp"}
              </h3>
              <p className="text-[11px] text-emerald-100">
                Format teks instan siap copy & share ke grup WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-100 hover:bg-emerald-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Filter & Options */}
        <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Pilih Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchReportText(selectedDate)}
            disabled={loading}
            className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Text Preview Area */}
        <div className="p-5">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="text-xs">Menyiapkan format pesan WhatsApp...</span>
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                value={text}
                rows={12}
                className="w-full rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-300 shadow-inner focus:outline-none leading-relaxed select-all"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleCopy}
            disabled={loading}
            className={`flex items-center justify-center space-x-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition shadow-sm ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Tersalin!" : "COPY LAPORAN"}</span>
          </button>

          <button
            onClick={handleShare}
            disabled={loading}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 py-2.5 px-3 text-xs font-bold hover:bg-emerald-50 transition shadow-sm"
          >
            <Share2 className="h-4 w-4" />
            <span>SHARE WA</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 py-2.5 px-3 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>TXT File</span>
          </button>
        </div>
      </div>
    </div>
  );
};

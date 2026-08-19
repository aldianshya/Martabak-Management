import React, { useState } from "react";
import { Transaction } from "../../types";
import { formatRupiah, formatDateTime } from "../../utils/formatters";
import { copyToClipboard } from "../../utils/whatsapp";
import { downloadTextFile } from "../../utils/export";
import { Printer, Copy, Download, Check, X } from "lucide-react";

interface ReceiptModalProps {
  transaction: Transaction | null;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  storeName = "MARTABAK ALDI",
  storeAddress = "Jl. Raya Martabak No. 88",
  storePhone = "",
  receiptHeader = "",
  receiptFooter = "TERIMA KASIH ATAS KUNJUNGAN ANDA!",
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const generatePlainTextReceipt = () => {
    const lines = [
      "================================",
      storeName.toUpperCase(),
      storeAddress,
      storePhone ? `Telp: ${storePhone}` : "",
      "--------------------------------",
      `No: ${transaction.invoiceNumber}`,
      `Tgl: ${formatDateTime(transaction.date)}`,
      `Kasir: ${transaction.cashier?.name || "-"}`,
      `Pembeli: ${transaction.customerCount || 1} Orang`,
      "================================",
    ].filter(Boolean);

    for (const item of transaction.items) {
      lines.push(`${item.productName}`);
      const priceStr = formatRupiah(item.priceSnapshot);
      const subtotalStr = formatRupiah(item.subtotal);
      lines.push(`  ${item.quantity} x ${priceStr}  ${subtotalStr}`);
      if (item.notes) {
        lines.push(`  (${item.notes})`);
      }
    }

    lines.push("--------------------------------");
    lines.push(`SUBTOTAL: ${formatRupiah(transaction.subtotal)}`);
    if (Number(transaction.discount) > 0) {
      lines.push(`DISKON: -${formatRupiah(transaction.discount)}`);
    }
    lines.push(`TOTAL: ${formatRupiah(transaction.total)}`);
    lines.push(`METODE: ${transaction.paymentMethod}`);

    if (transaction.paymentMethod === "CASH" && transaction.cashReceived) {
      lines.push(`DITERIMA: ${formatRupiah(transaction.cashReceived)}`);
      lines.push(`KEMBALIAN: ${formatRupiah(transaction.cashChange || 0)}`);
    }

    lines.push("================================");
    if (receiptFooter) lines.push(receiptFooter);
    lines.push("================================");

    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = generatePlainTextReceipt();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = generatePlainTextReceipt();
    downloadTextFile(`Struk-${transaction.invoiceNumber}.txt`, text);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="font-bold text-slate-800 text-sm flex items-center">
            <span className="mr-2 text-brand-500">🧾</span> Struk Transaksi
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Receipt Paper Area */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[65vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className="w-full max-w-xs bg-white p-5 rounded-lg shadow-sm border border-dashed border-slate-300 font-mono text-xs text-slate-800 leading-relaxed"
          >
            <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
              <div className="font-extrabold text-sm text-slate-900">{storeName}</div>
              <div className="text-[10px] text-slate-500">{storeAddress}</div>
              {storePhone && <div className="text-[10px] text-slate-500">Telp: {storePhone}</div>}
              {receiptHeader && (
                <div className="text-[10px] text-brand-600 font-semibold italic whitespace-pre-line pt-1">
                  {receiptHeader}
                </div>
              )}
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Invoice:</span>
                <span className="font-bold text-slate-800">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{formatDateTime(transaction.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashier?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Pembeli:</span>
                <span className="font-semibold text-brand-600">
                  {transaction.customerCount || 1} Orang
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-bold text-slate-800">{item.productName}</div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>
                      {item.quantity} x {formatRupiah(item.priceSnapshot)}
                    </span>
                    <span className="font-medium text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                  {item.notes && <div className="text-[10px] text-slate-400 italic">*{item.notes}</div>}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {Number(transaction.discount) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                <span>TOTAL:</span>
                <span className="text-brand-600">{formatRupiah(transaction.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Pembayaran:</span>
                <span className="font-bold text-slate-700">{transaction.paymentMethod}</span>
              </div>
              {transaction.paymentMethod === "CASH" && transaction.cashReceived && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Diterima:</span>
                    <span>{formatRupiah(transaction.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.cashChange || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
              <div className="font-semibold">{receiptFooter}</div>
              <div className="text-[9px] text-slate-400">=== SIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN ===</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-white border-t border-slate-200">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 py-2.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Simpan</span>
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center justify-center space-x-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold transition ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100"
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Tersalin!" : "Salin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

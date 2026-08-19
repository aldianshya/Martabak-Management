import { prisma } from "../lib/prisma";
import { PaymentMethod, TransactionStatus } from "@prisma/client";
import { startOfDay, endOfDay, format } from "date-fns";

export class ReportService {
  /**
   * Get detailed sales report with filters
   */
  static async getSalesReport(params: {
    startDate?: string;
    endDate?: string;
    cashierId?: string;
    paymentMethod?: PaymentMethod;
  }) {
    const start = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(new Date());
    const end = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(new Date());

    const where: any = {
      date: { gte: start, lte: end },
      status: TransactionStatus.COMPLETED,
    };

    if (params.cashierId) where.cashierId = params.cashierId;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { date: "desc" },
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalTransactions = transactions.length;
    let totalCustomers = 0;
    let totalItemsSold = 0;

    const paymentsSummary: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      SHOPEE: { count: 0, total: 0 },
      ONLINE: { count: 0, total: 0 },
      LAINNYA: { count: 0, total: 0 },
    };

    for (const tx of transactions) {
      const amount = Number(tx.total);
      totalRevenue += amount;
      totalDiscount += Number(tx.discount || 0);
      totalCustomers += Number(tx.customerCount || 1);

      const methodKey = tx.paymentMethod.toString();
      if (paymentsSummary[methodKey]) {
        paymentsSummary[methodKey].count += 1;
        paymentsSummary[methodKey].total += amount;
      } else {
        paymentsSummary.LAINNYA.count += 1;
        paymentsSummary.LAINNYA.total += amount;
      }

      for (const item of tx.items) {
        totalItemsSold += item.quantity;
      }
    }

    const avgTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    return {
      summary: {
        totalRevenue,
        totalDiscount,
        totalTransactions,
        totalCustomers,
        totalItemsSold,
        avgTransactionValue,
        paymentsSummary,
      },
      transactions,
    };
  }

  /**
   * Get Product Performance Report
   */
  static async getProductReport(params: { startDate?: string; endDate?: string }) {
    const start = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(new Date());
    const end = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(new Date());

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          date: { gte: start, lte: end },
          status: TransactionStatus.COMPLETED,
        },
      },
      include: {
        product: { include: { category: true } },
      },
    });

    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        categoryName: string;
        totalSold: number;
        totalRevenue: number;
        totalCost: number;
        profit: number;
      }
    >();

    for (const item of items) {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        categoryName: item.product.category?.name || "Uncategorized",
        totalSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        profit: 0,
      };

      const revenue = Number(item.subtotal);
      const cost = Number(item.costPriceSnapshot) * item.quantity;

      existing.totalSold += item.quantity;
      existing.totalRevenue += revenue;
      existing.totalCost += cost;
      existing.profit += revenue - cost;

      productMap.set(item.productId, existing);
    }

    return Array.from(productMap.values()).sort((a, b) => b.totalSold - a.totalSold);
  }

  /**
   * Get Stock Ledger Report (Initial, In, Out, Current)
   */
  static async getStockReport(params: { startDate?: string; endDate?: string }) {
    const start = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(new Date());
    const end = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(new Date());

    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        stockMovements: {
          where: { date: { gte: start, lte: end } },
          orderBy: { date: "asc" },
        },
        conversions: true,
      },
      orderBy: { name: "asc" },
    });

    return ingredients.map((ing) => {
      let stockIn = 0;
      let stockOut = 0;
      let adjustment = 0;

      for (const m of ing.stockMovements) {
        const qty = Number(m.baseQuantity);
        if (m.type === "STOCK_IN" || m.type === "INITIAL_STOCK") {
          stockIn += qty;
        } else if (m.type === "STOCK_OUT" || m.type === "RECIPE_USAGE") {
          stockOut += qty;
        } else if (m.type === "ADJUSTMENT" || m.type === "STOCK_OPNAME") {
          adjustment += qty;
        }
      }

      const current = Number(ing.currentStock);
      const min = Number(ing.minimumStock);

      return {
        id: ing.id,
        name: ing.name,
        baseUnit: ing.baseUnit,
        currentStock: current,
        minimumStock: min,
        stockIn,
        stockOut,
        adjustment,
        status: current === 0 ? "HABIS" : current <= min ? "MENIPIS" : "AMAN",
        movementsCount: ing.stockMovements.length,
      };
    });
  }

  /**
   * Generate Daily Sales WhatsApp Report String
   */
  static async generateSalesWhatsAppText(dateStr?: string): Promise<string> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lte: end },
        status: TransactionStatus.COMPLETED,
      },
      include: {
        items: true,
      },
      orderBy: { date: "asc" },
    });

    const storeSetting = await prisma.setting.findUnique({ where: { key: "store_name" } });
    const storeName = storeSetting?.value || "MARTABAK ALDI";
    const formattedDate = format(targetDate, "dd MMMM yyyy");

    let totalCash = 0;
    let totalQris = 0;
    let totalShopee = 0;
    let totalOnline = 0;
    let grandTotal = 0;
    let totalCustomers = 0;

    const productSalesMap = new Map<string, number>();

    const txLines: string[] = [];

    for (const tx of transactions) {
      const amount = Number(tx.total);
      grandTotal += amount;
      totalCustomers += Number(tx.customerCount || 1);

      if (tx.paymentMethod === PaymentMethod.CASH) totalCash += amount;
      else if (tx.paymentMethod === PaymentMethod.QRIS) totalQris += amount;
      else if (tx.paymentMethod === PaymentMethod.SHOPEE) totalShopee += amount;
      else if (tx.paymentMethod === PaymentMethod.ONLINE) totalOnline += amount;

      for (const item of tx.items) {
        const count = productSalesMap.get(item.productName) || 0;
        productSalesMap.set(item.productName, count + item.quantity);

        const priceInK = Math.round(Number(item.priceSnapshot) / 1000);
        const methodTag = tx.paymentMethod !== PaymentMethod.CASH ? ` (${tx.paymentMethod})` : "";
        txLines.push(`${item.productName} — ${priceInK}K${methodTag}`);
      }
    }

    const formatRp = (num: number) => `Rp ${num.toLocaleString("id-ID")}`;

    const text = `================================
📊 *LAPORAN PENJUALAN HARIAN*
🏪 *${storeName.toUpperCase()}*
📅 Tanggal: ${formattedDate}
================================

*DATA TRANSAKSI:*
${txLines.length > 0 ? txLines.join("\n") : "(Belum ada transaksi)"}

--------------------------------
*RINGKASAN PEMBAYARAN:*
💵 CASH: ${formatRp(totalCash)}
📱 QRIS: ${formatRp(totalQris)}
🛍️ SHOPEE: ${formatRp(totalShopee)}
🌐 ONLINE: ${formatRp(totalOnline)}
💰 *TOTAL OMZET: ${formatRp(grandTotal)}*

--------------------------------
*STATISTIK:*
🧾 Total Transaksi: ${transactions.length}
👥 Total Pembeli: ${totalCustomers}

*PRODUK TERJUAL:*
${Array.from(productSalesMap.entries())
  .map(([name, qty]) => `• ${name}: ${qty} porsi`)
  .join("\n")}

================================
_Generated by Sistem Manajemen Martabak_`;

    return text;
  }

  /**
   * Generate Daily Stock WhatsApp Report String
   */
  static async generateStockWhatsAppText(dateStr?: string): Promise<string> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const formattedDate = format(targetDate, "dd MMMM yyyy");

    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        stockMovements: {
          where: {
            date: {
              gte: startOfDay(targetDate),
              lte: endOfDay(targetDate),
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const lines: string[] = [];

    for (const ing of ingredients) {
      const current = Number(ing.currentStock);
      // Check movements today
      let terpakaiNotes = "";
      const outMovements = ing.stockMovements.filter(
        (m) => m.type === "STOCK_OUT" || m.type === "RECIPE_USAGE"
      );
      if (outMovements.length > 0) {
        const totalOut = outMovements.reduce((sum, m) => sum + Number(m.quantity), 0);
        const unit = outMovements[0].unit;
        terpakaiNotes = ` (terpakai ${totalOut} ${unit})`;
      }

      lines.push(`• ${ing.name}: ${current} ${ing.baseUnit}${terpakaiNotes}`);
    }

    const text = `📦 *STOK BARANG OPERASIONAL*
📅 Tanggal: ${formattedDate}
================================

${lines.join("\n")}

================================
_Generated by Sistem Manajemen Martabak_`;

    return text;
  }
}

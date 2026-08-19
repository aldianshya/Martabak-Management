import { prisma } from "../lib/prisma";
import { PaymentMethod, TransactionStatus } from "@prisma/client";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export class AnalyticsService {
  /**
   * Get store operational hours from settings (default: 16:00 - 23:00)
   */
  static async getStoreHours(): Promise<{ openingHour: number; closingHour: number }> {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["opening_time", "closing_time"] } },
    });

    const openSetting = settings.find((s) => s.key === "opening_time")?.value || "16:00";
    const closeSetting = settings.find((s) => s.key === "closing_time")?.value || "23:00";

    const openingHour = parseInt(openSetting.split(":")[0], 10) || 16;
    const closingHour = parseInt(closeSetting.split(":")[0], 10) || 23;

    return { openingHour, closingHour };
  }

  /**
   * Get Dashboard Summary (Today, Trends, Top Products, Low Stock, Payment breakdown)
   */
  static async getDashboardSummary(selectedDateStr?: string) {
    const targetDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);

    // 1. Transactions for the selected day
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: TransactionStatus.COMPLETED,
      },
      include: {
        items: true,
      },
    });

    let totalSales = 0;
    let totalTransactions = todayTransactions.length;
    let totalCustomers = 0;
    let cashSales = 0;
    let qrisSales = 0;
    let shopeeSales = 0;
    let onlineSales = 0;
    let otherSales = 0;

    for (const tx of todayTransactions) {
      const amount = Number(tx.total);
      totalSales += amount;
      totalCustomers += Number(tx.customerCount || 1);

      switch (tx.paymentMethod) {
        case PaymentMethod.CASH:
          cashSales += amount;
          break;
        case PaymentMethod.QRIS:
          qrisSales += amount;
          break;
        case PaymentMethod.SHOPEE:
          shopeeSales += amount;
          break;
        case PaymentMethod.ONLINE:
          onlineSales += amount;
          break;
        default:
          otherSales += amount;
          break;
      }
    }

    const averageTransactionValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    // 2. Average Buyers per Day (last 30 days)
    const thirtyDaysAgo = subDays(todayStart, 30);
    const pastTx = await prisma.transaction.findMany({
      where: {
        date: { gte: thirtyDaysAgo, lte: todayEnd },
        status: TransactionStatus.COMPLETED,
      },
      select: { date: true, customerCount: true },
    });

    const uniqueDays = new Set(pastTx.map((t) => format(t.date, "yyyy-MM-dd")));
    const activeDaysCount = Math.max(1, uniqueDays.size);
    const totalPastCustomers = pastTx.reduce((sum, t) => sum + (t.customerCount || 1), 0);
    const averageBuyersPerDay = Number((totalPastCustomers / activeDaysCount).toFixed(1));

    // 3. Top Selling Products (Today)
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const tx of todayTransactions) {
      for (const item of tx.items) {
        const existing = productSalesMap.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        productSalesMap.set(item.productId, existing);
      }
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Low Stock items
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
    });

    const lowStockItems = ingredients
      .filter((i) => Number(i.currentStock) <= Number(i.minimumStock))
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: Number(i.currentStock),
        minimumStock: Number(i.minimumStock),
        baseUnit: i.baseUnit,
        status: Number(i.currentStock) === 0 ? "HABIS" : "MENIPIS",
      }));

    return {
      date: format(targetDate, "yyyy-MM-dd"),
      totalSales,
      totalTransactions,
      totalCustomers,
      averageTransactionValue,
      averageBuyersPerDay,
      payments: {
        cash: cashSales,
        qris: qrisSales,
        shopee: shopeeSales,
        online: onlineSales,
        others: otherSales,
      },
      topSellingProducts,
      lowStockItems,
    };
  }

  /**
   * Get Hourly Customer & Sales Analytics
   */
  static async getHourlyAnalytics(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const { openingHour, closingHour } = await this.getStoreHours();

    // Fetch completed transactions for the target date
    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: TransactionStatus.COMPLETED,
      },
      select: {
        id: true,
        date: true,
        customerCount: true,
        total: true,
      },
    });

    // Build 24-hour map (0 to 23)
    const hourlyData: Array<{
      hour: number;
      label: string;
      customerCount: number; // SUM(customerCount)
      transactionCount: number; // COUNT(id)
      omzet: number; // SUM(total)
      isOperatingHour: boolean;
    }> = [];

    for (let h = 0; h < 24; h++) {
      const hourStr = `${String(h).padStart(2, "0")}:00`;
      const nextHourStr = `${String((h + 1) % 24).padStart(2, "0")}:00`;
      const isOperating = h >= openingHour && h <= closingHour;

      hourlyData.push({
        hour: h,
        label: `${hourStr}`,
        customerCount: 0,
        transactionCount: 0,
        omzet: 0,
        isOperatingHour: isOperating,
      });
    }

    // Populate data
    for (const tx of transactions) {
      const txHour = new Date(tx.date).getHours();
      const bucket = hourlyData[txHour];
      if (bucket) {
        bucket.customerCount += Number(tx.customerCount || 1);
        bucket.transactionCount += 1;
        bucket.omzet += Number(tx.total);
      }
    }

    // Calculate Peak Customer Hour (SUM(customerCount))
    let maxCustomers = 0;
    let peakCustomerHourIndex = openingHour;
    for (let h = 0; h < 24; h++) {
      if (hourlyData[h].customerCount > maxCustomers) {
        maxCustomers = hourlyData[h].customerCount;
        peakCustomerHourIndex = h;
      }
    }

    // Calculate Peak Omzet Hour (SUM(total))
    let maxOmzet = 0;
    let peakOmzetHourIndex = openingHour;
    for (let h = 0; h < 24; h++) {
      if (hourlyData[h].omzet > maxOmzet) {
        maxOmzet = hourlyData[h].omzet;
        peakOmzetHourIndex = h;
      }
    }

    // Calculate Average Buyers per active operating hour
    const operatingBuckets = hourlyData.filter((h) => h.isOperatingHour);
    const totalOperatingCustomers = operatingBuckets.reduce((sum, b) => sum + b.customerCount, 0);
    const avgCustomersPerOperatingHour =
      operatingBuckets.length > 0 ? Number((totalOperatingCustomers / operatingBuckets.length).toFixed(1)) : 0;

    const peakCustomerStart = `${String(peakCustomerHourIndex).padStart(2, "0")}:00`;
    const peakCustomerEnd = `${String((peakCustomerHourIndex + 1) % 24).padStart(2, "0")}:00`;

    const peakOmzetStart = `${String(peakOmzetHourIndex).padStart(2, "0")}:00`;
    const peakOmzetEnd = `${String((peakOmzetHourIndex + 1) % 24).padStart(2, "0")}:00`;

    return {
      date: format(targetDate, "yyyy-MM-dd"),
      hourlyData,
      summary: {
        peakCustomerHour: `${peakCustomerStart}–${peakCustomerEnd}`,
        peakCustomerCount: maxCustomers,
        peakCustomerText: `Jam paling ramai hari ini: ${peakCustomerStart}–${peakCustomerEnd} (${maxCustomers} pembeli)`,
        peakOmzetHour: `${peakOmzetStart}–${peakOmzetEnd}`,
        peakOmzetAmount: maxOmzet,
        peakOmzetText: `Jam omzet tertinggi: ${peakOmzetStart}–${peakOmzetEnd} (Rp ${maxOmzet.toLocaleString("id-ID")})`,
        averageCustomersPerHour: avgCustomersPerOperatingHour,
        averageCustomerText: `Rata-rata pembeli jam operasional: ${avgCustomersPerOperatingHour} pembeli/jam`,
      },
    };
  }

  /**
   * Get Sales Trend chart data (Daily, Monthly, Yearly)
   */
  static async getSalesTrends(type: "daily" | "monthly" | "yearly", days = 7) {
    const now = new Date();

    if (type === "daily") {
      const startDate = subDays(startOfDay(now), days - 1);
      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: startDate, lte: endOfDay(now) },
          status: TransactionStatus.COMPLETED,
        },
        select: { date: true, total: true, customerCount: true },
      });

      const resultMap = new Map<string, { date: string; label: string; totalSales: number; totalTransactions: number; totalCustomers: number }>();
      for (let i = 0; i < days; i++) {
        const d = subDays(now, days - 1 - i);
        const key = format(d, "yyyy-MM-dd");
        const label = format(d, "EEE, dd MMM");
        resultMap.set(key, { date: key, label, totalSales: 0, totalTransactions: 0, totalCustomers: 0 });
      }

      for (const tx of transactions) {
        const key = format(new Date(tx.date), "yyyy-MM-dd");
        const item = resultMap.get(key);
        if (item) {
          item.totalSales += Number(tx.total);
          item.totalTransactions += 1;
          item.totalCustomers += Number(tx.customerCount || 1);
        }
      }

      return Array.from(resultMap.values());
    }

    if (type === "monthly") {
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);

      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: startOfYear, lte: endOfYear },
          status: TransactionStatus.COMPLETED,
        },
        select: { date: true, total: true, customerCount: true },
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthsData = monthNames.map((name, idx) => ({
        monthIndex: idx,
        monthName: name,
        totalSales: 0,
        totalTransactions: 0,
        totalCustomers: 0,
      }));

      for (const tx of transactions) {
        const m = new Date(tx.date).getMonth();
        monthsData[m].totalSales += Number(tx.total);
        monthsData[m].totalTransactions += 1;
        monthsData[m].totalCustomers += Number(tx.customerCount || 1);
      }

      return monthsData;
    }

    if (type === "yearly") {
      const currentYear = now.getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      const startYear = new Date(years[0], 0, 1);

      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: startYear },
          status: TransactionStatus.COMPLETED,
        },
        select: { date: true, total: true, customerCount: true },
      });

      const yearsData = years.map((y) => ({
        year: y.toString(),
        totalSales: 0,
        totalTransactions: 0,
        totalCustomers: 0,
      }));

      for (const tx of transactions) {
        const y = new Date(tx.date).getFullYear().toString();
        const item = yearsData.find((yd) => yd.year === y);
        if (item) {
          item.totalSales += Number(tx.total);
          item.totalTransactions += 1;
          item.totalCustomers += Number(tx.customerCount || 1);
        }
      }

      return yearsData;
    }

    return [];
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { cashClosingSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { startOfDay, endOfDay } from "date-fns";
import { PaymentMethod, TransactionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const preview = searchParams.get("preview") === "true";
    const dateStr = searchParams.get("date");

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    if (preview) {
      // Calculate real-time summary for closing preview
      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: dayStart, lte: dayEnd },
          status: TransactionStatus.COMPLETED,
        },
      });

      const defaultFloatSetting = await prisma.setting.findUnique({
        where: { key: "default_cash_drawer" },
      });
      const defaultOpening = parseFloat(defaultFloatSetting?.value || "200000");

      let totalCashSales = 0;
      let totalQrisSales = 0;
      let totalShopeeSales = 0;
      let totalOnlineSales = 0;
      let totalOtherSales = 0;
      let totalCustomers = 0;

      for (const tx of transactions) {
        const amt = Number(tx.total);
        totalCustomers += Number(tx.customerCount || 1);

        if (tx.paymentMethod === PaymentMethod.CASH) totalCashSales += amt;
        else if (tx.paymentMethod === PaymentMethod.QRIS) totalQrisSales += amt;
        else if (tx.paymentMethod === PaymentMethod.SHOPEE) totalShopeeSales += amt;
        else if (tx.paymentMethod === PaymentMethod.ONLINE) totalOnlineSales += amt;
        else totalOtherSales += amt;
      }

      const totalSales =
        totalCashSales + totalQrisSales + totalShopeeSales + totalOnlineSales + totalOtherSales;
      const expectedCash = defaultOpening + totalCashSales;

      return successResponse({
        date: targetDate,
        openingBalance: defaultOpening,
        totalTransactions: transactions.length,
        totalCustomers,
        totalCashSales,
        totalQrisSales,
        totalShopeeSales,
        totalOnlineSales,
        totalOtherSales,
        totalSales,
        expectedCash,
      });
    }

    const closings = await prisma.cashClosing.findMany({
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(closings, "Riwayat tutup kasir");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validated = cashClosingSchema.parse(body);

    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: TransactionStatus.COMPLETED,
      },
    });

    let totalCashSales = 0;
    let totalQrisSales = 0;
    let totalShopeeSales = 0;
    let totalOnlineSales = 0;
    let totalCustomers = 0;

    for (const tx of transactions) {
      const amt = Number(tx.total);
      totalCustomers += Number(tx.customerCount || 1);

      if (tx.paymentMethod === PaymentMethod.CASH) totalCashSales += amt;
      else if (tx.paymentMethod === PaymentMethod.QRIS) totalQrisSales += amt;
      else if (tx.paymentMethod === PaymentMethod.SHOPEE) totalShopeeSales += amt;
      else if (tx.paymentMethod === PaymentMethod.ONLINE) totalOnlineSales += amt;
    }

    const totalSales = totalCashSales + totalQrisSales + totalShopeeSales + totalOnlineSales;
    const openingBalance = validated.openingBalance;
    const expectedCash = openingBalance + totalCashSales;
    const actualCash = validated.actualCash;
    const difference = actualCash - expectedCash;

    const closing = await prisma.cashClosing.create({
      data: {
        cashierId: user.userId,
        date: now,
        openingBalance,
        expectedCash,
        actualCash,
        difference,
        totalTransactions: transactions.length,
        totalCustomers,
        totalCashSales,
        totalQrisSales,
        totalShopeeSales,
        totalOnlineSales,
        totalSales,
        notes: validated.notes,
      },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "CASH_CLOSING",
        entity: "CashClosing",
        entityId: closing.id,
        newValue: JSON.stringify({
          expectedCash,
          actualCash,
          difference,
          totalSales,
        }),
      },
    });

    return successResponse(closing, "Tutup kasir berhasil disimpan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { transactionCreateSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { TransactionService } from "@/services/transaction.service";
import { startOfDay, endOfDay } from "date-fns";
import { PaymentMethod, TransactionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMethod = searchParams.get("paymentMethod") as PaymentMethod | null;
    const cashierId = searchParams.get("cashierId");
    const search = searchParams.get("search");
    const status = searchParams.get("status") as TransactionStatus | null;

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    } else if (startDate) {
      where.date = { gte: startOfDay(new Date(startDate)) };
    }

    if (paymentMethod && Object.values(PaymentMethod).includes(paymentMethod)) {
      where.paymentMethod = paymentMethod;
    }

    if (cashierId) {
      where.cashierId = cashierId;
    }

    if (status && Object.values(TransactionStatus).includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { items: { some: { productName: { contains: search } } } },
      ];
    }

    const total = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(total / limit);

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse(transactions, "Daftar transaksi", 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validated = transactionCreateSchema.parse(body);

    const transaction = await TransactionService.createTransaction({
      cashierId: user.userId,
      customerCount: validated.customerCount,
      items: validated.items,
      discount: validated.discount,
      paymentMethod: validated.paymentMethod,
      cashReceived: validated.cashReceived,
      notes: validated.notes,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE_TRANSACTION",
        entity: "Transaction",
        entityId: transaction.id,
        newValue: JSON.stringify({
          invoiceNumber: transaction.invoiceNumber,
          total: transaction.total,
          paymentMethod: transaction.paymentMethod,
          customerCount: transaction.customerCount,
        }),
      },
    });

    return successResponse(transaction, "Transaksi berhasil diproses", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

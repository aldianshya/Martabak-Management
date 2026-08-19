import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { stockOpnameSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { InventoryService } from "@/services/inventory.service";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    }

    const opnames = await prisma.stockOpname.findMany({
      where,
      include: {
        conductedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { ingredient: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return successResponse(opnames, "Riwayat stok opname");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validated = stockOpnameSchema.parse(body);

    const result = await InventoryService.performStockOpname({
      date: validated.date,
      notes: validated.notes,
      conductedByUserId: user.userId,
      items: validated.items,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "STOCK_OPNAME",
        entity: "StockOpname",
        entityId: result?.id,
        newValue: JSON.stringify({ itemsCount: validated.items.length }),
      },
    });

    return successResponse(result, "Stok opname berhasil disimpan dan disesuaikan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

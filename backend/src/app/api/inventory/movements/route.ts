import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { stockMovementSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { InventoryService } from "@/services/inventory.service";
import { MovementType } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const ingredientId = searchParams.get("ingredientId");
    const type = searchParams.get("type") as MovementType | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (ingredientId) where.ingredientId = ingredientId;
    if (type && Object.values(MovementType).includes(type)) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: startOfDay(new Date(startDate)),
        lte: endOfDay(new Date(endDate)),
      };
    }

    const total = await prisma.stockMovement.count({ where });
    const totalPages = Math.ceil(total / limit);

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        ingredient: { select: { id: true, name: true, baseUnit: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse(movements, "Daftar mutasi stok", 200, {
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
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validated = stockMovementSchema.parse(body);

    const result = await InventoryService.recordMovement({
      ingredientId: validated.ingredientId,
      type: validated.type,
      quantity: validated.quantity,
      unit: validated.unit,
      notes: validated.notes,
      userId: user.userId,
      referenceType: "MANUAL",
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "RECORD_STOCK_MOVEMENT",
        entity: "StockMovement",
        entityId: result.movement.id,
        newValue: JSON.stringify(result.movement),
      },
    });

    return successResponse(result, "Mutasi stok berhasil dicatat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

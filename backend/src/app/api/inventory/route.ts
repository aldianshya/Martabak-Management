import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { ingredientSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { MovementType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (search) {
      where.name = { contains: search };
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        conversions: true,
        _count: { select: { stockMovements: true, recipes: true } },
      },
      orderBy: { name: "asc" },
    });

    const formatted = ingredients.map((ing) => {
      const current = Number(ing.currentStock);
      const min = Number(ing.minimumStock);
      const isLow = current <= min;
      const isOut = current === 0;

      return {
        ...ing,
        currentStock: current,
        minimumStock: min,
        costPerUnit: Number(ing.costPerUnit),
        stockStatus: isOut ? "HABIS" : isLow ? "MENIPIS" : "AMAN",
      };
    });

    const result = lowStockOnly
      ? formatted.filter((i) => i.stockStatus === "HABIS" || i.stockStatus === "MENIPIS")
      : formatted;

    return successResponse(result, "Daftar bahan baku");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menambah bahan baku.", 403);
    }

    const body = await req.json();
    const validated = ingredientSchema.parse(body);

    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: {
          name: validated.name,
          baseUnit: validated.baseUnit.trim().toUpperCase(),
          currentStock: validated.currentStock,
          minimumStock: validated.minimumStock,
          costPerUnit: validated.costPerUnit,
          notes: validated.notes,
          isActive: validated.isActive,
        },
      });

      if (validated.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            ingredientId: created.id,
            type: MovementType.INITIAL_STOCK,
            quantity: validated.currentStock,
            unit: created.baseUnit,
            baseQuantity: validated.currentStock,
            baseUnit: created.baseUnit,
            stockBefore: 0,
            stockAfter: validated.currentStock,
            notes: "Stok awal bahan baku saat ditambahkan",
            userId: user?.userId,
          },
        });
      }

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entity: "Ingredient",
        entityId: ingredient.id,
        newValue: JSON.stringify(ingredient),
      },
    });

    return successResponse(ingredient, "Bahan baku berhasil ditambahkan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

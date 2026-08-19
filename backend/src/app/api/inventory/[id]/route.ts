import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { ingredientSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        conversions: true,
        recipes: { include: { product: true } },
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!ingredient) {
      return errorResponse("Bahan baku tidak ditemukan", 404);
    }

    return successResponse(ingredient, "Detail bahan baku");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengubah bahan baku.", 403);
    }

    const { id } = params;
    const body = await req.json();
    const validated = ingredientSchema.partial().parse(body);

    const oldIngredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!oldIngredient) {
      return errorResponse("Bahan baku tidak ditemukan", 404);
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...validated,
        baseUnit: validated.baseUnit ? validated.baseUnit.trim().toUpperCase() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entity: "Ingredient",
        entityId: id,
        oldValue: JSON.stringify(oldIngredient),
        newValue: JSON.stringify(updated),
      },
    });

    return successResponse(updated, "Bahan baku berhasil diperbarui");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus bahan baku.", 403);
    }

    const { id } = params;
    const existing = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        _count: { select: { stockMovements: true, recipes: true } },
      },
    });

    if (!existing) {
      return errorResponse("Bahan baku tidak ditemukan", 404);
    }

    if (existing._count.stockMovements > 0 || existing._count.recipes > 0) {
      await prisma.ingredient.update({
        where: { id },
        data: { isActive: false },
      });
      return successResponse(null, "Bahan baku dinonaktifkan untuk menjaga histori data.");
    }

    await prisma.ingredient.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "DELETE",
        entity: "Ingredient",
        entityId: id,
        oldValue: JSON.stringify(existing),
      },
    });

    return successResponse(null, "Bahan baku berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

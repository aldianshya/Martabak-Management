import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { z } from "zod";

const recipeUpdateSchema = z.object({
  recipes: z.array(
    z.object({
      ingredientId: z.string().min(1),
      quantityNeeded: z.number().positive(),
      unit: z.string().min(1),
    })
  ),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const recipes = await prisma.productRecipe.findMany({
      where: { productId: id },
      include: { ingredient: { include: { conversions: true } } },
    });
    return successResponse(recipes, "Resep produk");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengelola resep.", 403);
    }

    const { id } = params;
    const body = await req.json();
    const validated = recipeUpdateSchema.parse(body);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.productRecipe.deleteMany({ where: { productId: id } });
      if (validated.recipes.length > 0) {
        await tx.productRecipe.createMany({
          data: validated.recipes.map((r) => ({
            productId: id,
            ingredientId: r.ingredientId,
            quantityNeeded: r.quantityNeeded,
            unit: r.unit,
          })),
        });
      }
    });

    const updatedRecipes = await prisma.productRecipe.findMany({
      where: { productId: id },
      include: { ingredient: { include: { conversions: true } } },
    });

    return successResponse(updatedRecipes, "Resep berhasil disimpan");
  } catch (error) {
    return handleApiError(error);
  }
}

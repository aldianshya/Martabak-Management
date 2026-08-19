import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const availableOnly = searchParams.get("availableOnly") === "true";

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (availableOnly) where.isAvailable = true;
    if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;
    if (search) {
      where.name = { contains: search };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });

    return successResponse(products, "Daftar produk");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menambah produk.", 403);
    }

    const body = await req.json();
    const validated = productSchema.parse(body);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: validated.name,
          categoryId: validated.categoryId,
          price: validated.price,
          costPrice: validated.costPrice || 0,
          image: validated.image,
          description: validated.description,
          isAvailable: validated.isAvailable,
          isActive: validated.isActive,
        },
      });

      // If recipes are supplied, link them
      if (validated.recipes && validated.recipes.length > 0) {
        await tx.productRecipe.createMany({
          data: validated.recipes.map((r) => ({
            productId: created.id,
            ingredientId: r.ingredientId,
            quantityNeeded: r.quantityNeeded,
            unit: r.unit,
          })),
        });
      }

      // Record initial price history
      await tx.productPriceHistory.create({
        data: {
          productId: created.id,
          oldPrice: 0,
          newPrice: validated.price,
          changedBy: user?.name || "Admin",
          reason: "Harga awal produk",
        },
      });

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entity: "Product",
        entityId: product.id,
        newValue: JSON.stringify(product),
      },
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        recipes: { include: { ingredient: true } },
      },
    });

    return successResponse(fullProduct, "Produk berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

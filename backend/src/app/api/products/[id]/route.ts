import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: { ingredient: true },
        },
        priceHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    return successResponse(product, "Detail produk");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengedit produk.", 403);
    }

    const { id } = params;
    const body = await req.json();
    const validated = productSchema.partial().parse(body);

    const oldProduct = await prisma.product.findUnique({
      where: { id },
      include: { recipes: true },
    });

    if (!oldProduct) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Check price change
      const oldPrice = Number(oldProduct.price);
      const newPrice = validated.price !== undefined ? Number(validated.price) : oldPrice;

      if (validated.price !== undefined && oldPrice !== newPrice) {
        await tx.productPriceHistory.create({
          data: {
            productId: id,
            oldPrice,
            newPrice,
            changedBy: user?.name || "Admin",
            reason: body.priceChangeReason || "Perubahan harga oleh admin",
          },
        });
      }

      // Update product info
      const res = await tx.product.update({
        where: { id },
        data: {
          name: validated.name,
          categoryId: validated.categoryId,
          price: validated.price,
          costPrice: validated.costPrice,
          image: validated.image,
          description: validated.description,
          isAvailable: validated.isAvailable,
          isActive: validated.isActive,
        },
      });

      // Update recipes if passed
      if (validated.recipes) {
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
      }

      return res;
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entity: "Product",
        entityId: id,
        oldValue: JSON.stringify(oldProduct),
        newValue: JSON.stringify(updated),
      },
    });

    const full = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: { include: { ingredient: true } },
        priceHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    return successResponse(full, "Produk berhasil diperbarui");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus produk.", 403);
    }

    const { id } = params;
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });

    if (!existing) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    if (existing._count.items > 0) {
      // Soft delete to protect transaction snapshots
      await prisma.product.update({
        where: { id },
        data: { isActive: false, isAvailable: false },
      });
      return successResponse(null, "Produk dinonaktifkan untuk menjaga histori transaksi.");
    }

    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "DELETE",
        entity: "Product",
        entityId: id,
        oldValue: JSON.stringify(existing),
      },
    });

    return successResponse(null, "Produk berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengedit kategori.", 403);
    }

    const { id } = params;
    const body = await req.json();
    const validated = categorySchema.partial().parse(body);

    const oldCategory = await prisma.menuCategory.findUnique({ where: { id } });
    if (!oldCategory) {
      return errorResponse("Kategori tidak ditemukan", 404);
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: validated,
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE",
        entity: "MenuCategory",
        entityId: id,
        oldValue: JSON.stringify(oldCategory),
        newValue: JSON.stringify(updated),
      },
    });

    return successResponse(updated, "Kategori berhasil diperbarui");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus kategori.", 403);
    }

    const { id } = params;
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return errorResponse("Kategori tidak ditemukan", 404);
    }

    if (existing._count.products > 0) {
      // Soft delete by setting isActive = false to preserve transaction history integrity
      await prisma.menuCategory.update({
        where: { id },
        data: { isActive: false },
      });
      return successResponse(null, "Kategori dinonaktifkan karena memiliki produk terhubung.");
    }

    await prisma.menuCategory.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "DELETE",
        entity: "MenuCategory",
        entityId: id,
        oldValue: JSON.stringify(existing),
      },
    });

    return successResponse(null, "Kategori berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

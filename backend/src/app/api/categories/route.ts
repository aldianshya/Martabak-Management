import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const categories = await prisma.menuCategory.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return successResponse(categories, "Daftar kategori");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menambah kategori.", 403);
    }

    const body = await req.json();
    const validated = categorySchema.parse(body);

    const slug = validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const category = await prisma.menuCategory.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE",
        entity: "MenuCategory",
        entityId: category.id,
        newValue: JSON.stringify(category),
      },
    });

    return successResponse(category, "Kategori berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

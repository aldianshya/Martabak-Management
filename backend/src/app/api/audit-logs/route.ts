import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat melihat audit logs.", 403);
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const total = await prisma.auditLog.count({ where });
    const totalPages = Math.ceil(total / limit);

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse(logs, "Daftar audit log", 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

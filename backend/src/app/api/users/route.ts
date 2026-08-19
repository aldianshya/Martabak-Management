import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hashPassword, requireAdmin } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat melihat daftar pengguna.", 403);
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(users, "Daftar pengguna");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat membuat pengguna baru.", 403);
    }

    const body = await req.json();
    const validated = userCreateSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return errorResponse("Email sudah terdaftar.", 409);
    }

    const passwordHash = await hashPassword(validated.password);

    const newUser = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: validated.role,
        isActive: validated.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE_USER",
        entity: "User",
        entityId: newUser.id,
        newValue: JSON.stringify(newUser),
      },
    });

    return successResponse(newUser, "Pengguna berhasil dibuat", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

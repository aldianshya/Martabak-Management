import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hashPassword, requireAdmin } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak", 403);
    }

    const { id } = params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!targetUser) return errorResponse("Pengguna tidak ditemukan", 404);

    return successResponse(targetUser, "Detail pengguna");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengedit data pengguna.", 403);
    }

    const { id } = params;
    const body = await req.json();
    const validated = userUpdateSchema.parse(body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return errorResponse("Pengguna tidak ditemukan", 404);

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.email) updateData.email = validated.email;
    if (validated.role) updateData.role = validated.role;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.password) {
      updateData.passwordHash = await hashPassword(validated.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE_USER",
        entity: "User",
        entityId: id,
        oldValue: JSON.stringify({ name: target.name, email: target.email, role: target.role }),
        newValue: JSON.stringify(updated),
      },
    });

    return successResponse(updated, "Data pengguna berhasil diperbarui");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus pengguna.", 403);
    }

    const { id } = params;
    if (user?.userId === id) {
      return errorResponse("Anda tidak dapat menghapus akun Anda sendiri.", 400);
    }

    // Soft delete to protect relational transaction history
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "DEACTIVATE_USER",
        entity: "User",
        entityId: id,
      },
    });

    return successResponse(null, "Pengguna berhasil dinonaktifkan");
  } catch (error) {
    return handleApiError(error);
  }
}

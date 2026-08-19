import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { purchaseRequestStatusUpdateSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { PurchaseRequestStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        items: { include: { ingredient: true } },
      },
    });

    if (!request) return errorResponse("Permintaan barang tidak ditemukan", 404);

    return successResponse(request, "Detail permintaan barang");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = params;
    const body = await req.json();
    const validated = purchaseRequestStatusUpdateSchema.parse(body);

    const existing = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!existing) return errorResponse("Permintaan barang tidak ditemukan", 404);

    // Only admin can approve/reject
    if (
      (validated.status === PurchaseRequestStatus.APPROVED ||
        validated.status === PurchaseRequestStatus.REJECTED) &&
      !requireAdmin(user)
    ) {
      return errorResponse("Hanya Admin yang dapat menyetujui atau menolak permintaan barang.", 403);
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: validated.status,
        notes: validated.notes !== undefined ? validated.notes : existing.notes,
        reviewedByUserId: user.userId,
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
        items: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "UPDATE_PURCHASE_REQUEST_STATUS",
        entity: "PurchaseRequest",
        entityId: id,
        oldValue: existing.status,
        newValue: validated.status,
      },
    });

    return successResponse(updated, `Status permintaan diperbarui menjadi ${validated.status}`);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus permintaan barang.", 403);
    }

    const { id } = params;
    await prisma.purchaseRequest.delete({ where: { id } });

    return successResponse(null, "Permintaan barang berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { purchaseRequestSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { PurchaseRequestStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PurchaseRequestStatus | null;

    const where: any = {};
    if (status && Object.values(PurchaseRequestStatus).includes(status)) {
      where.status = status;
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: { ingredient: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return successResponse(requests, "Daftar permintaan barang");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const validated = purchaseRequestSchema.parse(body);

    const now = validated.date ? new Date(validated.date) : new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `PR-${year}${month}${day}`;

    // Count today's requests
    const count = await prisma.purchaseRequest.count({
      where: { requestNumber: { startsWith: datePrefix } },
    });
    const requestNumber = `${datePrefix}-${String(count + 1).padStart(4, "0")}`;

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNumber,
        date: now,
        status: PurchaseRequestStatus.SUBMITTED,
        notes: validated.notes,
        requestedByUserId: user.userId,
        items: {
          create: validated.items.map((i) => ({
            ingredientId: i.ingredientId || null,
            ingredientName: i.ingredientName,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes,
          })),
        },
      },
      include: {
        items: true,
        requestedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE_PURCHASE_REQUEST",
        entity: "PurchaseRequest",
        entityId: purchaseRequest.id,
        newValue: JSON.stringify({ requestNumber, itemsCount: validated.items.length }),
      },
    });

    return successResponse(purchaseRequest, "Permintaan barang berhasil diajukan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });

    if (!transaction) {
      return errorResponse("Transaksi tidak ditemukan", 404);
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["store_name", "store_address", "store_phone", "receipt_header", "receipt_footer"] },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    return successResponse(
      {
        transaction,
        receiptMeta: {
          storeName: settingsMap.get("store_name") || "Martabak Aldi",
          storeAddress: settingsMap.get("store_address") || "Jl. Raya Martabak",
          storePhone: settingsMap.get("store_phone") || "",
          receiptHeader: settingsMap.get("receipt_header") || "",
          receiptFooter: settingsMap.get("receipt_footer") || "Terima Kasih Atas Kunjungan Anda!",
        },
      },
      "Detail transaksi"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

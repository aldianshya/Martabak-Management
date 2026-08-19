import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { ReportService } from "@/services/report.service";
import { PaymentMethod } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const cashierId = searchParams.get("cashierId") || undefined;
    const paymentMethod = (searchParams.get("paymentMethod") as PaymentMethod) || undefined;

    const data = await ReportService.getSalesReport({
      startDate,
      endDate,
      cashierId,
      paymentMethod,
    });

    return successResponse(data, "Laporan penjualan");
  } catch (error) {
    return handleApiError(error);
  }
}

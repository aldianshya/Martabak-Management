import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { ReportService } from "@/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const data = await ReportService.getStockReport({
      startDate,
      endDate,
    });

    return successResponse(data, "Laporan mutasi & status stok");
  } catch (error) {
    return handleApiError(error);
  }
}

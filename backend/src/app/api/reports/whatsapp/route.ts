import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { ReportService } from "@/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales"; // "sales" or "stock"
    const date = searchParams.get("date") || undefined;

    let text = "";
    if (type === "stock") {
      text = await ReportService.generateStockWhatsAppText(date);
    } else {
      text = await ReportService.generateSalesWhatsAppText(date);
    }

    return successResponse({ text, type, date }, "Format laporan WhatsApp berhasil dibuat");
  } catch (error) {
    return handleApiError(error);
  }
}

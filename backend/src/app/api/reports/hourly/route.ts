import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;

    const data = await AnalyticsService.getHourlyAnalytics(date);

    return successResponse(data, "Analisis jam ramai & omzet per jam");
  } catch (error) {
    return handleApiError(error);
  }
}

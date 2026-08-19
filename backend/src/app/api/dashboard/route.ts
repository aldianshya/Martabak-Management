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
    const trendType = (searchParams.get("trend") || "daily") as "daily" | "monthly" | "yearly";
    const days = parseInt(searchParams.get("days") || "7", 10);

    const summary = await AnalyticsService.getDashboardSummary(date);
    const trends = await AnalyticsService.getSalesTrends(trendType, days);
    const hourly = await AnalyticsService.getHourlyAnalytics(date);

    return successResponse(
      {
        summary,
        trends,
        hourlySummary: hourly.summary,
      },
      "Data dashboard berhasil dimuat"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

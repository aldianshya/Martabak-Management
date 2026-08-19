import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return successResponse(
      {
        list: settings,
        map: settingsMap,
      },
      "Pengaturan sistem"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat mengubah pengaturan.", 403);
    }

    const body = await req.json();
    const validated = settingsUpdateSchema.parse(body);

    const updatedSettings = [];
    for (const [key, value] of Object.entries(validated)) {
      const s = await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          description: `Pengaturan ${key}`,
        },
      });
      updatedSettings.push(s);
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "UPDATE_SETTINGS",
        entity: "Setting",
        newValue: JSON.stringify(validated),
      },
    });

    return successResponse(updatedSettings, "Pengaturan berhasil disimpan");
  } catch (error) {
    return handleApiError(error);
  }
}

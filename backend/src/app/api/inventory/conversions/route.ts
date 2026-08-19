import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { unitConversionSchema } from "@/lib/validation";
import { errorResponse, handleApiError, successResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ingredientId = searchParams.get("ingredientId");

    const conversions = await prisma.unitConversion.findMany({
      where: ingredientId ? { ingredientId } : {},
      include: {
        ingredient: { select: { id: true, name: true, baseUnit: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(conversions, "Daftar aturan konversi satuan");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menambah konversi satuan.", 403);
    }

    const body = await req.json();
    const validated = unitConversionSchema.parse(body);

    const fromUnit = validated.fromUnit.trim().toUpperCase();
    const toUnit = validated.toUnit.trim().toUpperCase();

    const conversion = await prisma.unitConversion.upsert({
      where: {
        ingredientId_fromUnit_toUnit: {
          ingredientId: validated.ingredientId,
          fromUnit,
          toUnit,
        },
      },
      update: {
        conversionRate: validated.conversionRate,
      },
      create: {
        ingredientId: validated.ingredientId,
        fromUnit,
        toUnit,
        conversionRate: validated.conversionRate,
      },
      include: {
        ingredient: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.userId,
        action: "CREATE_OR_UPDATE_CONVERSION",
        entity: "UnitConversion",
        entityId: conversion.id,
        newValue: JSON.stringify(conversion),
      },
    });

    return successResponse(conversion, "Aturan konversi berhasil disimpan", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!requireAdmin(user)) {
      return errorResponse("Akses ditolak: Hanya Admin yang dapat menghapus konversi satuan.", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return errorResponse("ID konversi wajib disertakan", 400);
    }

    await prisma.unitConversion.delete({ where: { id } });

    return successResponse(null, "Aturan konversi berhasil dihapus");
  } catch (error) {
    return handleApiError(error);
  }
}

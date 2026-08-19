import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

export function successResponse<T>(
  data: T,
  message = "Berhasil",
  status = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  message = "Terjadi kesalahan pada server",
  status = 400,
  data: any = null
) {
  const body: ApiResponse = {
    success: false,
    message,
    data,
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: any) {
  console.error("API Error caught:", error);

  if (error instanceof ZodError) {
    const errorDetails = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return errorResponse(
      `Validasi gagal: ${errorDetails.map((e) => e.message).join(", ")}`,
      422,
      errorDetails
    );
  }

  if (error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "data";
    return errorResponse(`Data ${target} sudah terdaftar / duplikat.`, 409);
  }

  if (error.code === "P2025") {
    return errorResponse("Data tidak ditemukan.", 404);
  }

  const message = error.message || "Internal Server Error";
  return errorResponse(message, 500);
}

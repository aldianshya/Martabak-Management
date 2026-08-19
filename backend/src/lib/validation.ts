import { z } from "zod";
import { PaymentMethod, Role, MovementType, PurchaseRequestStatus } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const userCreateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.nativeEnum(Role).default(Role.KASIR),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori wajib diisi"),
  slug: z.string().min(2, "Slug kategori wajib diisi").optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nama produk wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  price: z.number().min(0, "Harga jual tidak boleh negatif"),
  costPrice: z.number().min(0, "Harga modal (HPP) tidak boleh negatif").default(0),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  recipes: z
    .array(
      z.object({
        ingredientId: z.string().min(1, "Bahan baku wajib dipilih"),
        quantityNeeded: z.number().positive("Jumlah bahan pada resep harus lebih dari 0"),
        unit: z.string().min(1, "Satuan resep wajib diisi"),
      })
    )
    .optional(),
});

export const productPriceUpdateSchema = z.object({
  newPrice: z.number().min(0, "Harga baru tidak boleh negatif"),
  reason: z.string().optional().nullable(),
});

export const ingredientSchema = z.object({
  name: z.string().min(2, "Nama bahan baku wajib diisi"),
  baseUnit: z.string().min(1, "Base unit wajib diisi (contoh: KG, PCS, BTL)"),
  currentStock: z.number().min(0, "Stok tidak boleh negatif").default(0),
  minimumStock: z.number().min(0, "Minimum stok tidak boleh negatif").default(0),
  costPerUnit: z.number().min(0, "Biaya per satuan tidak boleh negatif").default(0),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const unitConversionSchema = z.object({
  ingredientId: z.string().min(1, "Bahan baku wajib dipilih"),
  fromUnit: z.string().min(1, "Satuan asal (fromUnit) wajib diisi"),
  toUnit: z.string().min(1, "Satuan tujuan (toUnit) wajib diisi"),
  conversionRate: z.number().positive("Nilai konversi harus lebih dari 0"),
});

export const stockMovementSchema = z.object({
  ingredientId: z.string().min(1, "Bahan baku wajib dipilih"),
  type: z.nativeEnum(MovementType),
  quantity: z.number().positive("Jumlah pergerakan stok harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  notes: z.string().optional().nullable(),
});

export const stockOpnameItemInputSchema = z.object({
  ingredientId: z.string().min(1, "Bahan baku wajib dipilih"),
  physicalStock: z.number().min(0, "Stok fisik tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

export const stockOpnameSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(stockOpnameItemInputSchema).min(1, "Minimal satu item stok opname"),
});

export const purchaseRequestItemSchema = z.object({
  ingredientId: z.string().optional().nullable(),
  ingredientName: z.string().min(1, "Nama barang wajib diisi"),
  quantity: z.number().positive("Jumlah harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  notes: z.string().optional().nullable(),
});

export const purchaseRequestSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseRequestItemSchema).min(1, "Minimal satu item permintaan barang"),
});

export const purchaseRequestStatusUpdateSchema = z.object({
  status: z.nativeEnum(PurchaseRequestStatus),
  notes: z.string().optional().nullable(),
});

export const transactionItemInputSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.number().int().positive("Jumlah item harus minimal 1"),
  notes: z.string().optional().nullable(),
});

export const transactionCreateSchema = z.object({
  customerCount: z.number().int().min(1, "Jumlah pembeli minimal 1").default(1),
  items: z.array(transactionItemInputSchema).min(1, "Minimal 1 produk dalam transaksi"),
  discount: z.number().min(0, "Diskon tidak boleh negatif").default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  cashReceived: z.number().min(0, "Nominal uang diterima tidak boleh negatif").optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const cashClosingSchema = z.object({
  openingBalance: z.number().min(0, "Modal awal tidak boleh negatif").default(0),
  actualCash: z.number().min(0, "Uang fisik tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

export const settingsUpdateSchema = z.record(z.string());

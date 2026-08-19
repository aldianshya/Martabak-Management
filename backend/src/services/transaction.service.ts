import { prisma } from "../lib/prisma";
import { PaymentMethod, TransactionStatus, MovementType, Prisma } from "@prisma/client";
import { convertToBaseUnit } from "../lib/unit-converter";

export interface CreateTransactionInput {
  cashierId: string;
  customerCount?: number;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string | null;
  }>;
  discount?: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number | null;
  notes?: string | null;
}

export class TransactionService {
  /**
   * Generates a sequential unique invoice number for the date: INV-YYYYMMDD-XXXX
   */
  private static async generateInvoiceNumber(tx: Prisma.TransactionClient, date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const datePrefix = `INV-${year}${month}${day}`;

    // Find the latest invoice with this prefix
    const latestTx = await tx.transaction.findFirst({
      where: {
        invoiceNumber: { startsWith: datePrefix },
      },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (latestTx && latestTx.invoiceNumber) {
      const parts = latestTx.invoiceNumber.split("-");
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    return `${datePrefix}-${String(nextSeq).padStart(4, "0")}`;
  }

  /**
   * Create a transaction atomically with price snapshotting and optional auto-inventory deduction
   */
  static async createTransaction(input: CreateTransactionInput) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // 1. Fetch products & validate
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: {
          recipes: {
            include: { ingredient: true },
          },
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("Satu atau lebih produk tidak ditemukan atau sudah tidak aktif.");
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. Calculate subtotal & prepare item snapshots
      let subtotal = 0;
      const transactionItemsData: Array<{
        productId: string;
        productName: string;
        quantity: number;
        priceSnapshot: number;
        costPriceSnapshot: number;
        subtotal: number;
        notes?: string | null;
      }> = [];

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;

        if (item.quantity <= 0) {
          throw new Error(`Kuantitas untuk produk ${product.name} harus lebih dari 0.`);
        }

        const priceSnapshot = Number(product.price);
        const costPriceSnapshot = Number(product.costPrice || 0);
        const itemSubtotal = priceSnapshot * item.quantity;
        subtotal += itemSubtotal;

        transactionItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          priceSnapshot,
          costPriceSnapshot,
          subtotal: itemSubtotal,
          notes: item.notes,
        });
      }

      const discount = input.discount && input.discount > 0 ? input.discount : 0;
      if (discount > subtotal) {
        throw new Error("Diskon tidak boleh melebihi subtotal transaksi.");
      }

      const total = subtotal - discount;

      // 3. Validate Cash payment & calculate change
      let cashReceived = input.cashReceived ? Number(input.cashReceived) : null;
      let cashChange: number | null = null;

      if (input.paymentMethod === PaymentMethod.CASH) {
        if (cashReceived === null || cashReceived === undefined) {
          cashReceived = total; // exact amount
        }
        if (cashReceived < total) {
          throw new Error(
            `Nominal uang tunai yang diterima (Rp ${cashReceived.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${total.toLocaleString("id-ID")}).`
          );
        }
        cashChange = cashReceived - total;
      }

      // 4. Generate sequential invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tx, now);

      const customerCount = input.customerCount && input.customerCount > 0 ? input.customerCount : 1;

      // 5. Create Transaction Record
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          date: now,
          cashierId: input.cashierId,
          customerCount,
          subtotal,
          discount,
          total,
          paymentMethod: input.paymentMethod,
          cashReceived,
          cashChange,
          status: TransactionStatus.COMPLETED,
          notes: input.notes,
          items: {
            create: transactionItemsData,
          },
        },
        include: {
          items: true,
          cashier: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 6. Check auto-deduct inventory setting
      const autoDeductSetting = await tx.setting.findUnique({
        where: { key: "auto_deduct_inventory" },
      });

      const shouldAutoDeduct = autoDeductSetting?.value === "true";

      if (shouldAutoDeduct) {
        for (const item of input.items) {
          const product = productMap.get(item.productId);
          if (!product || !product.recipes || product.recipes.length === 0) continue;

          for (const recipe of product.recipes) {
            const recipeTotalNeeded = Number(recipe.quantityNeeded) * item.quantity;
            const converted = await convertToBaseUnit(
              recipe.ingredientId,
              recipeTotalNeeded,
              recipe.unit,
              tx
            );

            // Fetch current stock
            const ingredient = await tx.ingredient.findUnique({
              where: { id: recipe.ingredientId },
            });

            if (ingredient) {
              const stockBefore = Number(ingredient.currentStock);
              const stockAfter = Math.max(0, stockBefore - converted.baseQuantity);

              // Update ingredient currentStock
              await tx.ingredient.update({
                where: { id: ingredient.id },
                data: { currentStock: stockAfter },
              });

              // Record stock movement
              await tx.stockMovement.create({
                data: {
                  ingredientId: ingredient.id,
                  type: MovementType.RECIPE_USAGE,
                  quantity: recipeTotalNeeded,
                  unit: recipe.unit,
                  baseQuantity: converted.baseQuantity,
                  baseUnit: converted.baseUnit,
                  stockBefore,
                  stockAfter,
                  referenceType: "TRANSACTION",
                  referenceId: transaction.id,
                  notes: `Pemakaian resep untuk transaksi ${invoiceNumber} (${product.name} x ${item.quantity})`,
                  userId: input.cashierId,
                },
              });
            }
          }
        }
      }

      return transaction;
    });
  }

  /**
   * Get transaction details with formatted receipt data
   */
  static async getTransactionById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        cashier: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}

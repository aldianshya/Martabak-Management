import { prisma } from "../lib/prisma";
import { MovementType, Prisma } from "@prisma/client";
import { convertToBaseUnit } from "../lib/unit-converter";

export interface RecordMovementInput {
  ingredientId: string;
  type: MovementType;
  quantity: number;
  unit: string;
  notes?: string | null;
  userId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface StockOpnameInput {
  date?: string | Date;
  notes?: string | null;
  conductedByUserId: string;
  items: Array<{
    ingredientId: string;
    physicalStock: number;
    notes?: string | null;
  }>;
}

export class InventoryService {
  /**
   * Record a stock movement with explicit unit conversion to baseUnit
   */
  static async recordMovement(input: RecordMovementInput, txClient?: Prisma.TransactionClient) {
    const client = txClient || prisma;

    const converted = await convertToBaseUnit(
      input.ingredientId,
      input.quantity,
      input.unit,
      client
    );

    const ingredient = await client.ingredient.findUnique({
      where: { id: input.ingredientId },
    });

    if (!ingredient) {
      throw new Error(`Bahan baku dengan ID ${input.ingredientId} tidak ditemukan.`);
    }

    const currentBaseStock = Number(ingredient.currentStock);
    let newBaseStock = currentBaseStock;

    switch (input.type) {
      case MovementType.STOCK_IN:
      case MovementType.INITIAL_STOCK:
        newBaseStock = currentBaseStock + converted.baseQuantity;
        break;
      case MovementType.STOCK_OUT:
      case MovementType.RECIPE_USAGE:
        newBaseStock = Math.max(0, currentBaseStock - converted.baseQuantity);
        break;
      case MovementType.ADJUSTMENT:
      case MovementType.STOCK_OPNAME:
        newBaseStock = converted.baseQuantity;
        break;
    }

    // Update ingredient
    await client.ingredient.update({
      where: { id: ingredient.id },
      data: { currentStock: newBaseStock },
    });

    // Create movement record
    const movement = await client.stockMovement.create({
      data: {
        ingredientId: ingredient.id,
        type: input.type,
        quantity: input.quantity,
        unit: input.unit,
        baseQuantity: converted.baseQuantity,
        baseUnit: converted.baseUnit,
        stockBefore: currentBaseStock,
        stockAfter: newBaseStock,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
        userId: input.userId,
      },
    });

    return { movement, newBaseStock };
  }

  /**
   * Perform Daily Stock Opname
   */
  static async performStockOpname(input: StockOpnameInput) {
    const opnameDate = input.date ? new Date(input.date) : new Date();

    return prisma.$transaction(async (tx) => {
      // Create StockOpname header
      const opname = await tx.stockOpname.create({
        data: {
          date: opnameDate,
          status: "COMPLETED",
          notes: input.notes,
          conductedByUserId: input.conductedByUserId,
        },
      });

      const opnameItemsData: Array<{
        stockOpnameId: string;
        ingredientId: string;
        systemStock: number;
        physicalStock: number;
        difference: number;
        baseUnit: string;
        notes?: string | null;
      }> = [];

      for (const item of input.items) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
        });

        if (!ingredient) continue;

        const systemStock = Number(ingredient.currentStock);
        const physicalStock = Number(item.physicalStock);
        const difference = physicalStock - systemStock;

        opnameItemsData.push({
          stockOpnameId: opname.id,
          ingredientId: ingredient.id,
          systemStock,
          physicalStock,
          difference,
          baseUnit: ingredient.baseUnit,
          notes: item.notes,
        });

        // Update ingredient currentStock
        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: { currentStock: physicalStock },
        });

        // Record stock movement if there is a difference
        if (difference !== 0) {
          await tx.stockMovement.create({
            data: {
              ingredientId: ingredient.id,
              type: MovementType.STOCK_OPNAME,
              quantity: Math.abs(difference),
              unit: ingredient.baseUnit,
              baseQuantity: Math.abs(difference),
              baseUnit: ingredient.baseUnit,
              stockBefore: systemStock,
              stockAfter: physicalStock,
              referenceType: "OPNAME",
              referenceId: opname.id,
              notes: `Penyesuaian Stok Opname (${difference > 0 ? "+" : ""}${difference} ${ingredient.baseUnit}). Catatan: ${item.notes || "-"}`,
              userId: input.conductedByUserId,
            },
          });
        }
      }

      // Save all opname items
      await tx.stockOpnameItem.createMany({
        data: opnameItemsData,
      });

      return tx.stockOpname.findUnique({
        where: { id: opname.id },
        include: {
          items: {
            include: { ingredient: true },
          },
          conductedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });
  }

  /**
   * Get Low Stock Alert items
   */
  static async getLowStockAlerts() {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: { conversions: true },
      orderBy: { name: "asc" },
    });

    const lowStockItems = ingredients.filter((item) => {
      const current = Number(item.currentStock);
      const min = Number(item.minimumStock);
      return current <= min;
    });

    return lowStockItems.map((item) => {
      const current = Number(item.currentStock);
      const min = Number(item.minimumStock);
      return {
        id: item.id,
        name: item.name,
        currentStock: current,
        minimumStock: min,
        baseUnit: item.baseUnit,
        status: current === 0 ? "HABIS" : "MENIPIS",
        conversions: item.conversions,
      };
    });
  }
}

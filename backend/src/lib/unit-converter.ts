import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export interface ConversionResult {
  baseQuantity: number;
  baseUnit: string;
  originalQuantity: number;
  originalUnit: string;
  conversionRate: number;
  converted: boolean;
}

/**
 * Converts a quantity in `inputUnit` to the ingredient's `baseUnit`.
 * Looks up explicit conversion rules defined in `unit_conversions`.
 */
export async function convertToBaseUnit(
  ingredientId: string,
  quantity: number,
  inputUnit: string,
  tx?: Prisma.TransactionClient
): Promise<ConversionResult> {
  const client = tx || prisma;

  const ingredient = await client.ingredient.findUnique({
    where: { id: ingredientId },
    select: { id: true, name: true, baseUnit: true },
  });

  if (!ingredient) {
    throw new Error(`Bahan baku dengan ID ${ingredientId} tidak ditemukan.`);
  }

  const normalizedInputUnit = inputUnit.trim().toUpperCase();
  const normalizedBaseUnit = ingredient.baseUnit.trim().toUpperCase();

  // If input unit is identical to base unit, no conversion rate needed
  if (normalizedInputUnit === normalizedBaseUnit) {
    return {
      baseQuantity: quantity,
      baseUnit: ingredient.baseUnit,
      originalQuantity: quantity,
      originalUnit: inputUnit,
      conversionRate: 1,
      converted: false,
    };
  }

  // Look up explicit conversion rule: fromUnit -> toUnit (baseUnit)
  const conversion = await client.unitConversion.findFirst({
    where: {
      ingredientId: ingredient.id,
      fromUnit: { equals: normalizedInputUnit },
      toUnit: { equals: normalizedBaseUnit },
    },
  });

  if (!conversion) {
    // Check reverse conversion: e.g. rule is KG -> GRAM (rate 1000) and we want GRAM -> KG
    const reverseConversion = await client.unitConversion.findFirst({
      where: {
        ingredientId: ingredient.id,
        fromUnit: { equals: normalizedBaseUnit },
        toUnit: { equals: normalizedInputUnit },
      },
    });

    if (reverseConversion) {
      const rate = 1 / Number(reverseConversion.conversionRate);
      const baseQuantity = quantity * rate;
      return {
        baseQuantity,
        baseUnit: ingredient.baseUnit,
        originalQuantity: quantity,
        originalUnit: inputUnit,
        conversionRate: rate,
        converted: true,
      };
    }

    throw new Error(
      `Tidak ditemukan aturan konversi satuan dari "${inputUnit}" ke base unit "${ingredient.baseUnit}" untuk bahan "${ingredient.name}". Harap tambahkan aturan konversi di pengaturan inventaris.`
    );
  }

  const rate = Number(conversion.conversionRate);
  const baseQuantity = quantity * rate;

  return {
    baseQuantity,
    baseUnit: ingredient.baseUnit,
    originalQuantity: quantity,
    originalUnit: inputUnit,
    conversionRate: rate,
    converted: true,
  };
}

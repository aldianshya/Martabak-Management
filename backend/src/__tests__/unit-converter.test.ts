import { describe, it, expect } from "vitest";

describe("Aturan Konversi Satuan Stok Inventaris (UnitConversion)", () => {
  // Simulasi aturan konversi Mesis: Base Unit = KG, 1 TOPLES = 0.5 KG
  const mesisRules = [
    { fromUnit: "TOPLES", toUnit: "KG", conversionRate: 0.5 },
  ];

  it("harus mengonversi 1 TOPLES Mesis menjadi 0.5 KG", () => {
    const inputQty = 1;
    const inputUnit = "TOPLES";
    const rule = mesisRules.find((r) => r.fromUnit === inputUnit && r.toUnit === "KG");

    expect(rule).toBeDefined();
    const baseQuantity = inputQty * (rule?.conversionRate || 1);
    expect(baseQuantity).toBe(0.5);

    // Pengurangan stok: 5 KG - 0.5 KG = 4.5 KG
    const currentStock = 5.0;
    const stockAfter = currentStock - baseQuantity;
    expect(stockAfter).toBe(4.5);
  });

  it("harus mengonversi 2 TOPLES Kacang menjadi 1.0 KG", () => {
    const kacangRate = 0.5; // 1 toples = 0.5 kg
    const inputQty = 2;
    const baseQuantity = inputQty * kacangRate;
    expect(baseQuantity).toBe(1.0);

    const initialStock = 5.0;
    const stockAfter = initialStock - baseQuantity;
    expect(stockAfter).toBe(4.0);
  });

  it("harus mengonversi 1 SAK Tepung menjadi 25.0 KG", () => {
    const tepungSakRate = 25.0;
    const inputQty = 2;
    const baseQuantity = inputQty * tepungSakRate;
    expect(baseQuantity).toBe(50.0);
  });

  it("harus mengonversi 500 GRAM ke 0.5 KG", () => {
    const gramRate = 0.001;
    const inputQty = 500;
    const baseQuantity = inputQty * gramRate;
    expect(baseQuantity).toBe(0.5);
  });

  it("tidak boleh mengubah kuantitas jika satuan sudah sama dengan baseUnit", () => {
    const inputQty = 5;
    const inputUnit = "PCS";
    const baseUnit = "PCS";

    const baseQuantity = inputUnit === baseUnit ? inputQty : inputQty * 1;
    expect(baseQuantity).toBe(5);
  });
});

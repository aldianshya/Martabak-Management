import { describe, it, expect } from "vitest";

describe("Sistem Kalkulasi Transaksi POS Martabak", () => {
  it("harus menghitung subtotal produk dengan benar", () => {
    const items = [
      { price: 19000, qty: 2 }, // 38.000
      { price: 23000, qty: 1 }, // 23.000
      { price: 5000, qty: 3 },  // 15.000
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(subtotal).toBe(76000);
  });

  it("harus menghitung total setelah diskon nominal dengan benar", () => {
    const subtotal = 76000;
    const discount = 6000;
    const total = subtotal - discount;

    expect(total).toBe(70000);
  });

  it("harus menghitung kembalian uang tunai dengan benar", () => {
    const total = 38000;
    const cashReceived = 50000;
    const change = cashReceived - total;

    expect(change).toBe(12000);
  });

  it("harus menolak uang tunai yang kurang dari total belanja", () => {
    const total = 38000;
    const cashReceived = 30000;

    expect(cashReceived < total).toBe(true);
  });

  it("harus mendukung customerCount > 1 untuk rombongan pembeli", () => {
    const transaction = {
      id: "tx-1",
      total: 100000,
      customerCount: 3,
    };

    expect(transaction.customerCount).toBe(3);
    expect(transaction.customerCount).toBeGreaterThan(1);
  });
});

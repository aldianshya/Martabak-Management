import { describe, it, expect } from "vitest";

describe("Analisis Jam Ramai & Omzet Martabak (Hourly Analytics)", () => {
  const transactions = [
    // 17:00: 2 transactions, total 3 customers, total 50.000 omzet
    { hour: 17, customerCount: 1, total: 20000 },
    { hour: 17, customerCount: 2, total: 30000 },

    // 19:00: 2 transactions, total 4 customers, total 250.000 omzet (Highest Omzet)
    { hour: 19, customerCount: 2, total: 100000 },
    { hour: 19, customerCount: 2, total: 150000 },

    // 20:00: 4 transactions, total 9 customers, total 180.000 omzet (Highest Customers / Paling Ramai)
    { hour: 20, customerCount: 3, total: 50000 },
    { hour: 20, customerCount: 2, total: 40000 },
    { hour: 20, customerCount: 2, total: 40000 },
    { hour: 20, customerCount: 2, total: 50000 },
  ];

  it("harus menghitung SUM(customerCount) dan bukan hanya COUNT(transactions)", () => {
    const totalTransactions = transactions.length; // 8
    const totalCustomers = transactions.reduce((sum, tx) => sum + tx.customerCount, 0); // 16

    expect(totalTransactions).toBe(8);
    expect(totalCustomers).toBe(16);
    expect(totalCustomers).toBeGreaterThan(totalTransactions);
  });

  it("harus mendeteksi jam paling ramai berdasarkan SUM(customerCount) yaitu jam 20:00", () => {
    const hourMap = new Map<number, { customers: number; omzet: number }>();
    for (const tx of transactions) {
      const existing = hourMap.get(tx.hour) || { customers: 0, omzet: 0 };
      existing.customers += tx.customerCount;
      existing.omzet += tx.total;
      hourMap.set(tx.hour, existing);
    }

    let peakCustomerHour = 0;
    let maxCustomers = 0;
    hourMap.forEach((val, hour) => {
      if (val.customers > maxCustomers) {
        maxCustomers = val.customers;
        peakCustomerHour = hour;
      }
    });

    expect(peakCustomerHour).toBe(20);
    expect(maxCustomers).toBe(9);
  });

  it("harus mendeteksi jam omzet tertinggi secara terpisah yaitu jam 19:00", () => {
    const hourMap = new Map<number, { customers: number; omzet: number }>();
    for (const tx of transactions) {
      const existing = hourMap.get(tx.hour) || { customers: 0, omzet: 0 };
      existing.customers += tx.customerCount;
      existing.omzet += tx.total;
      hourMap.set(tx.hour, existing);
    }

    let peakOmzetHour = 0;
    let maxOmzet = 0;
    hourMap.forEach((val, hour) => {
      if (val.omzet > maxOmzet) {
        maxOmzet = val.omzet;
        peakOmzetHour = hour;
      }
    });

    expect(peakOmzetHour).toBe(19);
    expect(maxOmzet).toBe(250000);
  });
});

import { PrismaClient, Role, PaymentMethod, TransactionStatus, MovementType, PurchaseRequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Martabak Management Database Seed...");

  // 1. Clean existing records (in foreign key order)
  await prisma.auditLog.deleteMany({});
  await prisma.cashClosing.deleteMany({});
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.purchaseRequestItem.deleteMany({});
  await prisma.purchaseRequest.deleteMany({});
  await prisma.stockOpnameItem.deleteMany({});
  await prisma.stockOpname.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.productRecipe.deleteMany({});
  await prisma.unitConversion.deleteMany({});
  await prisma.productPriceHistory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.ingredient.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Users
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const kasirPassword = await bcrypt.hash("Kasir123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Aldi (Owner/Admin)",
      email: "admin@martabak.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const kasir = await prisma.user.create({
    data: {
      name: "Budi (Kasir Shift Malam)",
      email: "kasir@martabak.local",
      passwordHash: kasirPassword,
      role: Role.KASIR,
      isActive: true,
    },
  });

  console.log("✅ Users seeded (admin@martabak.local, kasir@martabak.local)");

  // 3. Seed Settings
  const settingsData = [
    { key: "store_name", value: "Martabak Bangka Aldi", description: "Nama Usaha / Toko" },
    { key: "store_address", value: "Jl. Pemuda No. 128, Rawamangun, Jakarta Timur", description: "Alamat Toko" },
    { key: "store_phone", value: "0812-3456-7890", description: "Nomor Telepon Toko" },
    { key: "receipt_header", value: "MARTABAK BANGKA ALDI\nSensasi Gurih & Manis Juara!", description: "Header Struk" },
    { key: "receipt_footer", value: "Terima Kasih Atas Kunjungan Anda!\nSelamat Menikmati Martabak Hangat", description: "Footer Struk" },
    { key: "opening_time", value: "16:00", description: "Jam Buka Toko" },
    { key: "closing_time", value: "23:00", description: "Jam Tutup Toko" },
    { key: "auto_deduct_inventory", value: "true", description: "Otomatis potong stok bahan saat transaksi dibuat (true/false)" },
    { key: "default_cash_drawer", value: "200000", description: "Modal awal kasir / float balance" },
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }
  console.log("✅ Settings seeded");

  // 4. Seed Menu Categories
  const catManisKlasik = await prisma.menuCategory.create({
    data: {
      name: "Martabak Manis Klasik",
      slug: "martabak-manis-klasik",
      description: "Martabak manis dengan adonan original legit bersarang",
      sortOrder: 1,
    },
  });

  const catManisSpesial = await prisma.menuCategory.create({
    data: {
      name: "Martabak Manis Spesial",
      slug: "martabak-manis-spesial",
      description: "Kombinasi topping premium pilihan",
      sortOrder: 2,
    },
  });

  const catTelur = await prisma.menuCategory.create({
    data: {
      name: "Martabak Telur",
      slug: "martabak-telur",
      description: "Martabak telur renyah gurih dengan kuah cuko asam manis",
      sortOrder: 3,
    },
  });

  const catMinuman = await prisma.menuCategory.create({
    data: {
      name: "Minuman & Tambahan",
      slug: "minuman-tambahan",
      description: "Minuman segar pendamping martabak",
      sortOrder: 4,
    },
  });

  console.log("✅ Categories seeded");

  // 5. Seed Products
  const prodKacang = await prisma.product.create({
    data: {
      name: "Kacang",
      categoryId: catManisKlasik.id,
      price: 19000,
      costPrice: 8000,
      description: "Martabak manis isi taburan kacang tanah sangrai gurih & susu kental manis",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodMesis = await prisma.product.create({
    data: {
      name: "Mesis",
      categoryId: catManisKlasik.id,
      price: 19000,
      costPrice: 8000,
      description: "Martabak manis isi butiran mesis coklat pekat lumer",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodKacangMesis = await prisma.product.create({
    data: {
      name: "Kacang Mesis",
      categoryId: catManisKlasik.id,
      price: 23000,
      costPrice: 10000,
      description: "Paduan klasik kacang sangrai renyah dan mesis coklat lezat",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodKeju = await prisma.product.create({
    data: {
      name: "Keju",
      categoryId: catManisKlasik.id,
      price: 23000,
      costPrice: 10500,
      description: "Parutan keju cheddar melimpah dengan susu kental manis",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodKejuMesis = await prisma.product.create({
    data: {
      name: "Keju Mesis",
      categoryId: catManisSpesial.id,
      price: 25000,
      costPrice: 11500,
      description: "Perpaduan rasa gurih keju dan manisnya mesis coklat",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodKomplit = await prisma.product.create({
    data: {
      name: "Komplit (Keju + Kacang + Mesis + Wijen)",
      categoryId: catManisSpesial.id,
      price: 28000,
      costPrice: 13000,
      description: "Semua topping favorit dalam satu loyang spesial",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodTelurAyam2 = await prisma.product.create({
    data: {
      name: "Martabak Telur Ayam (2 Telur)",
      categoryId: catTelur.id,
      price: 24000,
      costPrice: 11000,
      description: "Martabak telur ayam dengan isian daging daun bawang gurih",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodTelurBebek2 = await prisma.product.create({
    data: {
      name: "Martabak Telur Bebek (2 Telur)",
      categoryId: catTelur.id,
      price: 27000,
      costPrice: 12500,
      description: "Martabak telur bebek lebih gurih dan renyah",
      isAvailable: true,
      isActive: true,
    },
  });

  const prodTehManis = await prisma.product.create({
    data: {
      name: "Es Teh Manis",
      categoryId: catMinuman.id,
      price: 5000,
      costPrice: 1500,
      description: "Es teh manis melati segar dingin",
      isAvailable: true,
      isActive: true,
    },
  });

  console.log("✅ Products seeded");

  // 6. Seed Ingredients
  const ingTepung = await prisma.ingredient.create({
    data: {
      name: "Tepung Terigu Segitiga Biru",
      baseUnit: "KG",
      currentStock: 16.0,
      minimumStock: 5.0,
      costPerUnit: 12000,
      notes: "Bahan utama adonan martabak manis",
    },
  });

  const ingGula = await prisma.ingredient.create({
    data: {
      name: "Gula Pasir",
      baseUnit: "KG",
      currentStock: 10.0,
      minimumStock: 3.0,
      costPerUnit: 17500,
      notes: "Pemanis adonan martabak",
    },
  });

  const ingMesis = await prisma.ingredient.create({
    data: {
      name: "Mesis Coklat",
      baseUnit: "KG",
      currentStock: 4.5,
      minimumStock: 2.0,
      costPerUnit: 45000,
      notes: "1 Toples = 0.5 KG",
    },
  });

  const ingKacang = await prisma.ingredient.create({
    data: {
      name: "Kacang Tanah Sangrai Cincang",
      baseUnit: "KG",
      currentStock: 4.0,
      minimumStock: 2.0,
      costPerUnit: 38000,
      notes: "1 Toples = 0.5 KG",
    },
  });

  const ingMentega = await prisma.ingredient.create({
    data: {
      name: "Mentega / Margarin Blueband",
      baseUnit: "KG",
      currentStock: 4.0,
      minimumStock: 2.0,
      costPerUnit: 42000,
      notes: "1 Toples = 0.5 KG",
    },
  });

  const ingKeju = await prisma.ingredient.create({
    data: {
      name: "Keju Cheddar Olahan",
      baseUnit: "PCS",
      currentStock: 7.0,
      minimumStock: 3.0,
      costPerUnit: 22000,
      notes: "Blok keju 2kg per batang",
    },
  });

  const ingSusu = await prisma.ingredient.create({
    data: {
      name: "Susu Kental Manis Kaleng",
      baseUnit: "PCS",
      currentStock: 13.0,
      minimumStock: 5.0,
      costPerUnit: 12500,
      notes: "Susu kaleng 370gr",
    },
  });

  const ingTelurAyam = await prisma.ingredient.create({
    data: {
      name: "Telur Ayam Negeri",
      baseUnit: "PCS",
      currentStock: 16.0,
      minimumStock: 10.0,
      costPerUnit: 2000,
      notes: "1 Tray = 30 PCS",
    },
  });

  const ingKotak = await prisma.ingredient.create({
    data: {
      name: "Kotak Dus Martabak",
      baseUnit: "PCS",
      currentStock: 84.0,
      minimumStock: 30.0,
      costPerUnit: 1200,
      notes: "Kemasan take-away",
    },
  });

  const ingAsoy = await prisma.ingredient.create({
    data: {
      name: "Plastik Kresek Asoy 24",
      baseUnit: "BKS",
      currentStock: 4.0,
      minimumStock: 2.0,
      costPerUnit: 8000,
    },
  });

  const ingWijen = await prisma.ingredient.create({
    data: {
      name: "Wijen Sangrai",
      baseUnit: "BKS",
      currentStock: 1.0,
      minimumStock: 1.0,
      costPerUnit: 15000,
    },
  });

  const ingGas = await prisma.ingredient.create({
    data: {
      name: "Tabung Gas LPG 3KG",
      baseUnit: "PCS",
      currentStock: 5.0,
      minimumStock: 2.0,
      costPerUnit: 22000,
      notes: "2 ada, 1 terpakai, 2 kosong",
    },
  });

  console.log("✅ Ingredients seeded");

  // 7. Seed Unit Conversions
  await prisma.unitConversion.createMany({
    data: [
      { ingredientId: ingMesis.id, fromUnit: "TOPLES", toUnit: "KG", conversionRate: 0.5 },
      { ingredientId: ingKacang.id, fromUnit: "TOPLES", toUnit: "KG", conversionRate: 0.5 },
      { ingredientId: ingMentega.id, fromUnit: "TOPLES", toUnit: "KG", conversionRate: 0.5 },
      { ingredientId: ingTepung.id, fromUnit: "SAK", toUnit: "KG", conversionRate: 25.0 },
      { ingredientId: ingTepung.id, fromUnit: "GRAM", toUnit: "KG", conversionRate: 0.001 },
      { ingredientId: ingGula.id, fromUnit: "GRAM", toUnit: "KG", conversionRate: 0.001 },
      { ingredientId: ingTelurAyam.id, fromUnit: "TRAY", toUnit: "PCS", conversionRate: 30.0 },
      { ingredientId: ingTelurAyam.id, fromUnit: "KG", toUnit: "PCS", conversionRate: 16.0 },
    ],
  });
  console.log("✅ Unit conversions seeded");

  // 8. Seed Product Recipes
  await prisma.productRecipe.createMany({
    data: [
      // Recipe Kacang
      { productId: prodKacang.id, ingredientId: ingTepung.id, quantityNeeded: 0.15, unit: "KG" },
      { productId: prodKacang.id, ingredientId: ingGula.id, quantityNeeded: 0.05, unit: "KG" },
      { productId: prodKacang.id, ingredientId: ingMentega.id, quantityNeeded: 0.03, unit: "KG" },
      { productId: prodKacang.id, ingredientId: ingKacang.id, quantityNeeded: 0.05, unit: "KG" },
      { productId: prodKacang.id, ingredientId: ingKotak.id, quantityNeeded: 1, unit: "PCS" },

      // Recipe Mesis
      { productId: prodMesis.id, ingredientId: ingTepung.id, quantityNeeded: 0.15, unit: "KG" },
      { productId: prodMesis.id, ingredientId: ingGula.id, quantityNeeded: 0.05, unit: "KG" },
      { productId: prodMesis.id, ingredientId: ingMentega.id, quantityNeeded: 0.03, unit: "KG" },
      { productId: prodMesis.id, ingredientId: ingMesis.id, quantityNeeded: 0.05, unit: "KG" },
      { productId: prodMesis.id, ingredientId: ingKotak.id, quantityNeeded: 1, unit: "PCS" },

      // Recipe Keju
      { productId: prodKeju.id, ingredientId: ingTepung.id, quantityNeeded: 0.15, unit: "KG" },
      { productId: prodKeju.id, ingredientId: ingGula.id, quantityNeeded: 0.05, unit: "KG" },
      { productId: prodKeju.id, ingredientId: ingMentega.id, quantityNeeded: 0.03, unit: "KG" },
      { productId: prodKeju.id, ingredientId: ingKeju.id, quantityNeeded: 0.05, unit: "PCS" },
      { productId: prodKeju.id, ingredientId: ingKotak.id, quantityNeeded: 1, unit: "PCS" },

      // Recipe Martabak Telur 2 Telur
      { productId: prodTelurAyam2.id, ingredientId: ingTelurAyam.id, quantityNeeded: 2, unit: "PCS" },
      { productId: prodTelurAyam2.id, ingredientId: ingKotak.id, quantityNeeded: 1, unit: "PCS" },
    ],
  });
  console.log("✅ Product recipes seeded");

  // 9. Seed Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        ingredientId: ingTepung.id,
        type: MovementType.INITIAL_STOCK,
        quantity: 16,
        unit: "KG",
        baseQuantity: 16,
        baseUnit: "KG",
        stockBefore: 0,
        stockAfter: 16,
        notes: "Stok awal pembukaan sistem",
        userId: admin.id,
      },
      {
        ingredientId: ingMesis.id,
        type: MovementType.STOCK_OUT,
        quantity: 1,
        unit: "TOPLES",
        baseQuantity: 0.5,
        baseUnit: "KG",
        stockBefore: 5.0,
        stockAfter: 4.5,
        notes: "Pengisian toples meja racik (1 toples)",
        userId: kasir.id,
      },
      {
        ingredientId: ingKacang.id,
        type: MovementType.STOCK_OUT,
        quantity: 2,
        unit: "TOPLES",
        baseQuantity: 1.0,
        baseUnit: "KG",
        stockBefore: 5.0,
        stockAfter: 4.0,
        notes: "Pengisian toples kacang meja racik (2 toples)",
        userId: kasir.id,
      },
    ],
  });
  console.log("✅ Stock movements seeded");

  // 10. Seed Realistic Sample Transactions (across operational hours 16:00 - 22:00)
  const today = new Date();
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const sampleTransactions = [
    { hour: 16, min: 20, items: [{ prod: prodKacang, qty: 1 }], count: 1, method: PaymentMethod.CASH, cash: 20000 },
    { hour: 17, min: 10, items: [{ prod: prodMesis, qty: 1 }], count: 1, method: PaymentMethod.CASH, cash: 50000 },
    { hour: 17, min: 45, items: [{ prod: prodKacang, qty: 1 }, { prod: prodTehManis, qty: 1 }], count: 2, method: PaymentMethod.QRIS },
    { hour: 18, min: 15, items: [{ prod: prodKacangMesis, qty: 1 }], count: 1, method: PaymentMethod.SHOPEE },
    { hour: 18, min: 30, items: [{ prod: prodKeju, qty: 1 }], count: 1, method: PaymentMethod.CASH, cash: 30000 },
    { hour: 18, min: 50, items: [{ prod: prodTelurAyam2, qty: 1 }], count: 2, method: PaymentMethod.QRIS },
    { hour: 19, min: 10, items: [{ prod: prodKomplit, qty: 1 }], count: 1, method: PaymentMethod.QRIS },
    { hour: 19, min: 25, items: [{ prod: prodKacang, qty: 2 }], count: 2, method: PaymentMethod.CASH, cash: 40000 },
    { hour: 19, min: 40, items: [{ prod: prodKejuMesis, qty: 1 }, { prod: prodMesis, qty: 1 }], count: 3, method: PaymentMethod.SHOPEE },
    { hour: 19, min: 55, items: [{ prod: prodTelurBebek2, qty: 2 }], count: 2, method: PaymentMethod.ONLINE },
    // Peak customer hours: 20:00 (multiple customer batches)
    { hour: 20, min: 5, items: [{ prod: prodKacangMesis, qty: 2 }], count: 3, method: PaymentMethod.QRIS },
    { hour: 20, min: 15, items: [{ prod: prodKeju, qty: 2 }], count: 4, method: PaymentMethod.CASH, cash: 50000 },
    { hour: 20, min: 25, items: [{ prod: prodMesis, qty: 2 }, { prod: prodKacang, qty: 1 }], count: 4, method: PaymentMethod.QRIS },
    { hour: 20, min: 40, items: [{ prod: prodKomplit, qty: 2 }], count: 3, method: PaymentMethod.SHOPEE },
    { hour: 20, min: 50, items: [{ prod: prodTelurAyam2, qty: 2 }], count: 4, method: PaymentMethod.CASH, cash: 50000 },
    // 21:00
    { hour: 21, min: 10, items: [{ prod: prodKejuMesis, qty: 1 }], count: 2, method: PaymentMethod.QRIS },
    { hour: 21, min: 30, items: [{ prod: prodMesis, qty: 1 }], count: 1, method: PaymentMethod.CASH, cash: 20000 },
    { hour: 21, min: 45, items: [{ prod: prodTelurAyam2, qty: 1 }], count: 2, method: PaymentMethod.ONLINE },
    // 22:00
    { hour: 22, min: 15, items: [{ prod: prodKacang, qty: 1 }], count: 1, method: PaymentMethod.CASH, cash: 20000 },
  ];

  let invoiceSeq = 1;
  const dateStr = `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, "0")}${String(baseDate.getDate()).padStart(2, "0")}`;

  for (const sample of sampleTransactions) {
    const txDate = new Date(baseDate);
    txDate.setHours(sample.hour, sample.min, 0, 0);

    let subtotal = 0;
    const itemsData = sample.items.map((item) => {
      const itemPrice = Number(item.prod.price);
      const itemSubtotal = itemPrice * item.qty;
      subtotal += itemSubtotal;
      return {
        productId: item.prod.id,
        productName: item.prod.name,
        quantity: item.qty,
        priceSnapshot: itemPrice,
        costPriceSnapshot: Number(item.prod.costPrice),
        subtotal: itemSubtotal,
      };
    });

    const total = subtotal;
    const cashRec = sample.cash || (sample.method === PaymentMethod.CASH ? total : null);
    const cashChg = sample.method === PaymentMethod.CASH && cashRec ? cashRec - total : null;

    const inv = `INV-${dateStr}-${String(invoiceSeq++).padStart(4, "0")}`;

    await prisma.transaction.create({
      data: {
        invoiceNumber: inv,
        date: txDate,
        cashierId: kasir.id,
        customerCount: sample.count,
        subtotal: subtotal,
        discount: 0,
        total: total,
        paymentMethod: sample.method,
        cashReceived: cashRec,
        cashChange: cashChg,
        status: TransactionStatus.COMPLETED,
        notes: "Transaksi Kasir Martabak",
        createdAt: txDate,
        updatedAt: txDate,
        items: {
          create: itemsData,
        },
      },
    });
  }

  console.log(`✅ Sample transactions seeded (${invoiceSeq - 1} transactions with realistic customer counts)`);

  // 11. Seed Sample Purchase Request
  const pr = await prisma.purchaseRequest.create({
    data: {
      requestNumber: `PR-${dateStr}-0001`,
      date: new Date(),
      status: PurchaseRequestStatus.SUBMITTED,
      notes: "Permintaan barang mingguan untuk persiapan akhir pekan",
      requestedByUserId: kasir.id,
      items: {
        create: [
          {
            ingredientId: ingTepung.id,
            ingredientName: ingTepung.name,
            quantity: 1,
            unit: "SAK",
            notes: "1 Sak = 25 KG",
          },
          {
            ingredientId: ingTelurAyam.id,
            ingredientName: ingTelurAyam.name,
            quantity: 2,
            unit: "TRAY",
            notes: "2 Tray = 60 butir",
          },
          {
            ingredientId: ingMesis.id,
            ingredientName: ingMesis.name,
            quantity: 2,
            unit: "KG",
          },
          {
            ingredientId: ingKeju.id,
            ingredientName: ingKeju.name,
            quantity: 5,
            unit: "PCS",
          },
        ],
      },
    },
  });
  console.log("✅ Purchase request seeded");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

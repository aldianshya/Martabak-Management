# 🥞 Sistem Manajemen Martabak — Full Stack POS, Inventory & Analytics

Sistem Manajemen Martabak adalah aplikasi web full-stack siap pakai untuk operasional harian gerai martabak modern. Sistem ini menghubungkan kasir (POS), pencatatan transaksi real-time, manajemen harga & menu, inventaris bahan multi-satuan dengan aturan konversi eksplisit, stok opname harian, tutup kasir (cash closing), analitik jam ramai pembeli, dan fitur salin laporan ke WhatsApp (Clipboard API & Web Share API).

---

## 🌟 Fitur Utama

### 1. Point of Sale (POS / Kasir)
- **Katalog Menu Cepat**: Navigasi kategori (Martabak Manis Klasik, Spesial, Martabak Telur, Minuman) dan pencarian instan.
- **Input "Jumlah Pembeli" (`customerCount`)**: Mendukung transaksi kelompok/rombongan (default = 1).
- **Kalkulator Kembalian Tunai**: Perhitungan otomatis uang diterima dan kembalian dengan tombol pecahan cepat (Uang Pas, 20k, 50k, 100k).
- **Metode Pembayaran Lengkap**: `CASH`, `QRIS`, `SHOPEE`, `ONLINE`, dan `LAINNYA`.
- **Struk Transaksi Digital & Cetak**: Format struk standar 80mm yang dapat dicetak (Print PDF), disalin (Copy Plain Text), atau diunduh sebagai file TXT.
- **Atomic Transaction & Snapshot Harga**: Harga produk di-snapshot ke database saat transaksi terjadi sehingga histori transaksi masa lalu tidak berubah saat harga menu diubah.

### 2. Inventaris & Konversi Satuan Eksplisit
- **Base Unit Architecture**: Penyimpanan stok utama dalam satuan dasar baku (`KG`, `PCS`, `BTL`, `BKS`, `SASSET`, `TOPLES`, `GALON`, `LITER`).
- **Aturan Konversi Dinamis (`UnitConversion`)**: Admin dapat menentukan aturan konversi (contoh: 1 TOPLES Mesis = 0.5 KG, 1 SAK Tepung = 25 KG, 1 TRAY Telur = 30 PCS).
- **Riwayat Mutasi Multi-Satuan (`StockMovement`)**: Menyimpan kuantitas input pengguna (`quantity`, `unit`) sekaligus kuantitas konversi sistem (`baseQuantity`, `baseUnit`) dan saldo sebelum/sesudah.
- **Resep & Auto Deduct Inventory**: Pilihan sistem untuk memotong stok bahan baku secara otomatis saat transaksi kasir dibuat berdasarkan resep dan aturan konversi.
- **Peringatan Stok Menipis (Low Stock Alert)**: Notifikasi visual untuk bahan yang mencapai `minimumStock` (Status: `MENIPIS` atau `HABIS`).

### 3. Stok Opname Harian
- Antarmuka pencocokan antara **Stok Sistem** dan **Stok Fisik Nyata**.
- Kalkulasi selisih otomatis (+ / -) dengan catatan operasional per bahan (contoh: *"Terpakai 1 Toples"*, *"Bahan Rusak"*, *"Pembelian Baru"*).
- Penyesuaian stok otomatis ke inventaris dan pencatatan riwayat opname.

### 4. Permintaan Barang (Purchase Request)
- Pengajuan kebutuhan bahan baku mingguan atau mendesak dari kasir/cabang ke owner.
- Alur status: `Draft` ➔ `Diajukan` ➔ `Disetujui` ➔ `Ditolak` ➔ `Selesai Diterima`.
- Generator teks permintaan barang siap kirim ke WhatsApp / supplier.

### 5. Tutup Kasir (Cash Closing Shift)
- Rekonsiliasi fisik laci kasir saat pergantian shift / tutup toko.
- Sistem menampilkan total omzet tunai, QRIS, Shopee, Online, modal awal kasir (*opening balance*), dan **Expected Cash**.
- Kasir memasukkan **Actual Cash** dan sistem menghitung **Selisih (Difference)** secara transparan.

### 6. Dashboard & Analitik Jam Ramai (Hourly Analytics)
- **KPI Metrics Utama**:
  - Total Penjualan Hari Ini (`SUM(total)`)
  - Total Transaksi (`COUNT(id)`)
  - Total Pembeli (`SUM(customerCount)`)
  - Rata-rata Nilai Transaksi (`SUM(total) / COUNT(id)`)
  - Rata-rata Pembeli / Hari (Berdasarkan 30 hari aktif)
- **Dual Peak Highlight pada Analisis Jam Ramai**:
  - 🌟 **Jam Paling Ramai**: Jam dengan akumulasi jumlah pembeli terbanyak (`SUM(customerCount)`).
  - 💰 **Jam Omzet Tertinggi**: Jam dengan akumulasi omzet rupiah tertinggi (`SUM(total)`).
  - Rata-rata jumlah pembeli pada jam operasional.
- **Grafik Tren Penjualan**: Filter 7 Hari, 30 Hari, Bulanan, dan Tahunan via Recharts.

### 7. Laporan & Export WhatsApp
- Laporan Penjualan (Filter tanggal, kasir, metode pembayaran).
- Laporan Performa Produk (Porsi terjual, omzet per produk, estimasi laba kotor).
- Laporan Distribusi Pembayaran (Donut Chart & tabel persentase omzet).
- Laporan Stok Bahan Baku (Barang masuk, keluar, penyesuaian, stok akhir).
- **Generator Format WhatsApp**:
  - **Copy Laporan Penjualan**: Ringkasan transaksi harian, breakdown pembayaran, dan statistik pembeli siap kirim ke grup WA.
  - **Copy Laporan Stok**: Format ringkas operasional (contoh: `tepung (15 KG) 16 KG`, `mesis (5 KG) 4.5 KG (terpakai 1 toples)`).
  - Terintegrasi dengan **Clipboard API** dan **Web Share API**.
- Export file CSV dan TXT.

### 8. Autentikasi & RBAC (Role-Based Access Control)
- **ADMIN / OWNER**: Akses penuh ke Dashboard, Laporan, CRUD Menu & Resep, Konversi Satuan, Mutasi Stok, Manajemen Pengguna, dan Pengaturan Sistem.
- **KASIR**: Akses ke Kasir (POS), Transaksi Hari Ini, Cetak Struk, Stok Opname, Permintaan Barang, dan Tutup Kasir.
- Audit Log untuk melacak setiap perubahan harga, penghapusan produk, dan penyesuaian inventaris.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Tema Warm Martabak Orange & Slate)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Server State**: TanStack Query (React Query v5)
- **Charts**: Recharts
- **HTTP Client**: Axios

### Backend
- **Framework**: Next.js 14 (App Router API Route Handlers)
- **Language**: TypeScript
- **ORM**: Prisma ORM
- **Database**: MySQL
- **Auth**: JSON Web Token (JWT) & bcryptjs
- **Validation**: Zod Schemas

---

## 📁 Struktur Direktori

```text
martabak-management/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # Axios client & endpoints
│   │   ├── components/
│   │   │   ├── common/               # Navbar, Sidebar, ReceiptModal, WhatsAppExportModal
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx       # Auth session & role helper
│   │   │   └── SettingsContext.tsx   # Store settings & operational hours
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx        # Responsive POS / SaaS Layout
│   │   ├── pages/
│   │   │   ├── auth/LoginPage.tsx
│   │   │   ├── dashboard/DashboardPage.tsx
│   │   │   ├── pos/PosPage.tsx
│   │   │   ├── transactions/TransactionsPage.tsx
│   │   │   ├── products/ProductsPage.tsx
│   │   │   ├── categories/CategoriesPage.tsx
│   │   │   ├── inventory/InventoryPage.tsx
│   │   │   ├── inventory/UnitConversionsPage.tsx
│   │   │   ├── inventory/MovementsPage.tsx
│   │   │   ├── inventory/StockOpnamePage.tsx
│   │   │   ├── purchase-requests/PurchaseRequestsPage.tsx
│   │   │   ├── cash-closing/CashClosingPage.tsx
│   │   │   ├── reports/ReportsPage.tsx
│   │   │   ├── users/UsersPage.tsx
│   │   │   └── settings/SettingsPage.tsx
│   │   ├── types/                    # Interfaces & Enums
│   │   ├── utils/                    # Formatters, WhatsApp & CSV exporters
│   │   ├── App.tsx                   # Routes with RBAC protection
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── app/api/                  # Next.js App Router REST API Endpoints
│   │   │   ├── auth/login/route.ts
│   │   │   ├── auth/me/route.ts
│   │   │   ├── categories/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── products/[id]/route.ts
│   │   │   ├── products/[id]/recipes/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   ├── transactions/[id]/route.ts
│   │   │   ├── inventory/route.ts
│   │   │   ├── inventory/[id]/route.ts
│   │   │   ├── inventory/conversions/route.ts
│   │   │   ├── inventory/movements/route.ts
│   │   │   ├── inventory/stock-opname/route.ts
│   │   │   ├── purchase-requests/route.ts
│   │   │   ├── purchase-requests/[id]/route.ts
│   │   │   ├── cash-closing/route.ts
│   │   │   ├── dashboard/route.ts
│   │   │   ├── reports/sales/route.ts
│   │   │   ├── reports/hourly/route.ts
│   │   │   ├── reports/products/route.ts
│   │   │   ├── reports/payments/route.ts
│   │   │   ├── reports/stock/route.ts
│   │   │   ├── reports/whatsapp/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── users/[id]/route.ts
│   │   │   ├── audit-logs/route.ts
│   │   │   └── settings/route.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts             # Prisma Client singleton
│   │   │   ├── auth.ts               # JWT & bcrypt utilities
│   │   │   ├── api-response.ts       # Standardized response helper
│   │   │   ├── unit-converter.ts     # Multi-unit conversion to baseUnit
│   │   │   └── validation.ts         # Zod schemas
│   │   ├── services/
│   │   │   ├── transaction.service.ts # Atomic transaction & auto-deduct logic
│   │   │   ├── inventory.service.ts   # Movements & opname adjustments
│   │   │   ├── analytics.service.ts   # SUM(customerCount) & hourly peak calculations
│   │   │   └── report.service.ts      # Sales & WhatsApp report generators
│   │   └── __tests__/                # Vitest Unit Tests
│   ├── prisma/
│   │   ├── schema.prisma             # MySQL Prisma Database Schema
│   │   └── seed.ts                   # Realistic sample data seed
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.mjs
│
├── README.md
└── package.json                      # Workspace runner scripts
```

---

## 🚀 Panduan Instalasi & Menjalankan Project

### 1. Prasyarat Sistem
- **Node.js**: v18.x atau lebih baru (disarankan v20.x+)
- **npm**: v9.x atau lebih baru
- **MySQL Server**: v8.x / MariaDB v10.x running on port 3306

### 2. Konfigurasi Database MySQL
Buat database baru di MySQL:
```sql
CREATE DATABASE martabak_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Buka file `backend/.env` dan sesuaikan kredensial user & password MySQL Anda:
```env
DATABASE_URL="mysql://root:password_anda@localhost:3306/martabak_management"
JWT_SECRET="martabak-super-secret-jwt-key-2026-secure-random"
JWT_EXPIRES_IN="7d"
PORT=5000
```

### 3. Install Dependency & Setup Database

#### Di direktori `backend/`:
```bash
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi schema ke MySQL
npx prisma db push

# Jalankan database seeding (mengisi akun admin, kasir, menu, bahan, aturan konversi & transaksi simulasi)
npm run prisma:seed:ts
```

#### Di direktori `frontend/`:
```bash
cd ../frontend
npm install
```

### 4. Menjalankan Server Aplikasi

#### Jalankan Backend API Server (Port 5000):
```bash
cd backend
npm run dev
```

#### Jalankan Frontend Web Application (Port 3000):
```bash
cd frontend
npm run dev
```

Buka browser Anda dan akses:
👉 **`http://localhost:3000`**

---

## 🔑 Akun Login Demo

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin / Owner** | `admin@martabak.local` | `Admin123!` | Akses penuh (Dashboard, Laporan, Menu, Stok, Pengguna, Pengaturan) |
| **Kasir** | `kasir@martabak.local` | `Kasir123!` | Kasir (POS), Transaksi, Stok Opname, Permintaan Barang, Tutup Kasir |

*Catatan: Tersedia tombol quick demo login di halaman `/login` untuk kemudahan pengujian langsung.*

---

## 🧪 Pengujian Unit & Validasi (Testing)

Jalankan unit test kalkulasi POS, konversi multi-satuan, dan analitik hourly pembeli:
```bash
cd backend
npm run test
```

---

## 📖 Dokumentasi REST API

Semua endpoint mengembalikan struktur respons JSON konsisten:
```json
{
  "success": true,
  "message": "Deskripsi status operasi",
  "data": {},
  "pagination": { "page": 1, "limit": 25, "total": 100, "totalPages": 4 }
}
```

| Method | Endpoint | Keterangan | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login pengguna & penerbitan token JWT | Public |
| `GET` | `/api/auth/me` | Profil pengguna saat ini | Authenticated |
| `GET` | `/api/categories` | Daftar kategori menu | Authenticated |
| `POST` | `/api/categories` | Tambah kategori baru | Admin |
| `GET` | `/api/products` | Daftar menu dengan filter kategori & search | Authenticated |
| `POST` | `/api/products` | Tambah menu baru & relasi resep | Admin |
| `PUT` | `/api/products/:id` | Update data menu (mencatat histori harga) | Admin |
| `DELETE` | `/api/products/:id` | Hapus / nonaktifkan menu | Admin |
| `GET` | `/api/products/:id/recipes` | Ambil resep bahan baku produk | Admin |
| `POST` | `/api/products/:id/recipes` | Simpan/ubah komposisi resep produk | Admin |
| `GET` | `/api/transactions` | Daftar riwayat transaksi dengan filter & paginasi | Authenticated |
| `POST` | `/api/transactions` | Buat transaksi kasir (atomic & auto-deduct) | Authenticated |
| `GET` | `/api/transactions/:id` | Detail transaksi & format struk | Authenticated |
| `GET` | `/api/inventory` | Daftar bahan baku, base unit, dan status stok | Authenticated |
| `POST` | `/api/inventory` | Tambah bahan baku baru | Admin |
| `GET` | `/api/inventory/conversions` | Daftar aturan konversi satuan | Authenticated |
| `POST` | `/api/inventory/conversions` | Tambah / perbarui aturan konversi | Admin |
| `GET` | `/api/inventory/movements` | Riwayat buku mutasi pergerakan stok | Admin |
| `POST` | `/api/inventory/movements` | Catat barang masuk / barang keluar manual | Authenticated |
| `GET` | `/api/inventory/stock-opname` | Riwayat stok opname | Authenticated |
| `POST` | `/api/inventory/stock-opname` | Submit stok opname & auto adjustment | Authenticated |
| `GET` | `/api/purchase-requests` | Daftar pengajuan permintaan barang | Authenticated |
| `POST` | `/api/purchase-requests` | Ajukan permintaan barang baru | Authenticated |
| `PUT` | `/api/purchase-requests/:id` | Update status (Approve / Reject / Complete) | Admin |
| `GET` | `/api/cash-closing` | Preview closing hari ini & riwayat shift | Authenticated |
| `POST` | `/api/cash-closing` | Submit rekonsiliasi tutup kasir | Authenticated |
| `GET` | `/api/dashboard` | KPI omzet, pembeli, grafik tren & jam ramai | Admin |
| `GET` | `/api/reports/hourly` | Analitik pembeli & omzet per jam (`SUM(customerCount)`) | Authenticated |
| `GET` | `/api/reports/sales` | Laporan penjualan detail & filter periode | Admin |
| `GET` | `/api/reports/products` | Laporan ranking menu terlaris & margin laba | Admin |
| `GET` | `/api/reports/payments` | Laporan distribusi metode pembayaran | Admin |
| `GET` | `/api/reports/stock` | Laporan mutasi buku stok bahan | Admin |
| `GET` | `/api/reports/whatsapp` | Generator teks laporan penjualan / stok WhatsApp | Authenticated |
| `GET` | `/api/users` | Daftar seluruh pengguna sistem | Admin |
| `POST` | `/api/users` | Buat pengguna baru (Admin/Kasir) | Admin |
| `GET` | `/api/settings` | Pengaturan toko & jam operasional | Authenticated |
| `PUT` | `/api/settings` | Update pengaturan toko & jam operasional | Admin |
| `GET` | `/api/audit-logs` | Jejak audit log aktivitas admin | Admin |

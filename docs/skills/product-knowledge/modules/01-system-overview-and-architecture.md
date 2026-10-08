---
name: mock-api-studio-system-overview
description: Panduan arsitektur sistem, konsep fundamental, keamanan, autentikasi (Local & Google Workspace SSO), kontrol akses role, dan model entitas di Mock API Studio.
---

# Skill: System Overview, Architecture & Security

Skill ini menjelaskan arsitektur tingkat tinggi, pola desain perangkat lunak, sistem autentikasi dan otorisasi, manajemen sesi, serta model relasional data yang mendasari **Mock API Studio**.

---

## 1. Arsitektur & Pola Desain (Clean Architecture + MVVM)

Mock API Studio dibangun di atas arsitektur berlapis yang memisahkan urusan presentasi antarmuka, logika bisnis, akses data, dan engine backend:

```text
src/
├── app/                  # Next.js App Router (Routing, SSR, Layouts, API Handlers)
│   ├── (auth)/           # Route group autentikasi (Sign In)
│   ├── (protected)/      # Route group terlindungi (Dashboard, Projects, Flows, dll)
│   └── api/              # API internal & dynamic mock proxy engine (/api/[...path])
│
├── client/               # Client Layer (Prinsip Clean Architecture & MVVM)
│   ├── domain/           # Pure Business Logic (Entities, Repository Interfaces, UseCases)
│   ├── data/             # Implementasi Data Source & Repository (HTTP API / Axios Fetch)
│   └── presentation/     # Presentation Layer
│       ├── components/   # Atomic & Reusable UI Components
│       ├── stores/       # Zustand State Stores (Auth, UI, Theme, Tour)
│       └── views/        # Feature Views & Colocated ViewModel Hooks (useXViewModel)
│
├── server/               # Server-Side Services & Controllers (Node.js Runtime)
│   ├── [feature]/        # Service, Controller, Types, & Repositories per domain
│   └── mock-proxy/       # High-performance Internal Mock Proxy Engine & In-Memory Cache
│
└── core/                 # Cross-Cutting Infrastructure
    ├── db/               # Prisma Client Singleton (`prisma-client.ts`)
    ├── di/               # Dependency Injection Container (@needle-di/core)
    ├── constants/        # Konfigurasi ENV & Nilai Default
    └── notification/     # Google Space Card v2 Webhook Notifier
```

### Alur Kerja MVVM pada Client
1. **View (`src/client/presentation/views/*`)**: Komponen antarmuka React murni yang hanya bertugas me-render UI dan menangkap event interaksi pengguna.
2. **ViewModel (`use*ViewModel.ts`)**: Custom hook yang mengelola local state, form handling (React Hook Form + Zod), dan memanggil UseCase domain.
3. **Domain UseCase (`src/client/domain/*/usecase/*`)**: Logika bisnis independen yang mengorkestrasi operasi data.
4. **Repository Implementation (`src/client/data/*/repository/*`)**: Mengirimkan HTTP request ke Next.js API Routes.

---

## 2. Model Autentikasi & Manajemen Sesi

Mock API Studio mendukung dual-authentication: **Kredensial Lokal (Database)** dan **Single Sign-On (SSO) Google Workspace**.

### A. Autentikasi Kredensial Lokal
- Menggunakan tabel `tblAccount` pada PostgreSQL.
- Verifikasi password terenkripsi via `bcryptjs`.
- Endpoint autentikasi: `POST /api/auth/signin`.
- Sesi disimpan dalam HTTP-Only Cookie terenkripsi atau JWT Bearer token untuk External API.

### B. Google Workspace SSO
- Integrasi OAuth2 Google Workspace (`/api/auth/google`, `/api/auth/google/callback`).
- **Domain Whitelist**: Pembatasan domain organisasi melalui variabel environment `SSO_DOMAINS` (contoh: `SSO_DOMAINS="company.com,subsidiary.id"`). Akun dari domain di luar whitelist akan otomatis ditolak dengan status *403 Forbidden*.
- Pembuatan akun otomatis (*auto-provisioning*) saat login pertama kali jika email valid dan domain terdaftar.

### C. Roles & Hak Akses
| Role | Akses & Wewenang |
|---|---|
| `ADMIN` | Akses penuh ke seluruh fitur, manajemen user accounts, audit change logs, database backup/reset, global settings, dan semua project. |
| `MEMBER` | Akses pembuatan & modifikasi project, API, scenario flows, data sheets, dan eksekusi mock. Tidak dapat mengelola user lain atau melakukan reset database. |

---

## 3. Penugasan PIC (Person In Charge)

Sistem mengimplementasikan atribusi tanggung jawab kepemilikan data:
- **Project PIC (`tblProjectPic`)**: Mengasosiasikan satu atau lebih akun pengguna sebagai penanggung jawab utama sebuah Project API.
- **API PIC (`tblApiPic`)**: Mengasosiasikan anggota tim spesifik pada tingkat endpoint API individu untuk memperjelas kepemilikan modul.

---

## 4. Audit Trail & Jejak Perubahan (`tblChangeLog`)

Setiap mutasi data penting (Create, Update, Delete, Import, Restore, Reset) dicatat secara otomatis ke dalam `tblChangeLog` dengan detail:
- `action`: Jenis aksi (`CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `IMPORT`, `RESET`).
- `entityType`: Entitas target (`project`, `collection`, `environment`, `api`, `request_scenario`, `response_scenario`, `scenario_flow`, `data_sheet`, `database`).
- `operator` & `userId`: Identitas pengguna pengeksekusi.
- `beforeState` & `afterState`: Snapshot payload JSON sebelum dan sesudah perubahan untuk audit diff.
- `metadata`: Konteks tambahan (IP address, client user-agent, import counters).

### Notifikasi Real-time Google Chat / Google Space
Jika `GOOGLE_SPACE_WEBHOOK_URL` dikonfigurasikan di `.env`, setiap operasi mutasi akan memicu pengiriman notifikasi interaktif berbasis **Card v2 layout** lengkap dengan icon representatif, nama operator, dan ringkasan perubahan.

---

## 5. Ringkasan Variabel Lingkungan Kunci (`.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mock_api_studio?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/mock_api_studio_shadow?schema=public"

APP_USERNAME="admin@example.com"
APP_PASSWORD="AdminPassword123!"

JWT_SECRET="your-super-secret-jwt-key"
SSO_DOMAINS="example.com,company.org"
GOOGLE_CLIENT_ID="xxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

GOOGLE_SPACE_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/XXXXX/messages?key=YYYYY&token=ZZZZZ"
```

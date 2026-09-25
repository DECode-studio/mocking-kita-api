# Mocking Kita Studio (Mock API Studio)

**Mocking Kita Studio** adalah platform engine mock API modern berbasis **Next.js 16 (App Router - Node.js Runtime), React 19, Clean Architecture, Server-Side Rendering (SSR), dan PostgreSQL Database yang dikelola melalui Prisma ORM**. Aplikasi ini dirancang untuk memungkinkan pengembang frontend, backend, dan QA merancang endpoint REST, mengonfigurasi skenario pencocokan request (*Exact, Partial, Regex, JSON Schema*), mensimulasikan respons berbobot (*weighted response scenarios*) dengan latensi dinamis, mengorkestrasi skenario pengujian berantai (*Scenario Flows / Request Flow*) dengan visual canvas dan classic list, mengelola dataset pengujian (*Data Sheets*), serta melakukan proxying dan mock testing API secara komprehensif.

---

## Tujuan & Fitur Utama

1. **Predictable & Dynamic API Prototyping**: Membangun kontrak REST API secara cepat dan konsisten sebelum backend selesai dikembangkan.
2. **Advanced Request Matching Engine**: Evaluasi pencocokan rute masuk berdasarkan *Headers*, *Query Parameters*, *Path Parameters*, dan *Body* (mendukung format JSON, Form-Data, URL-Encoded, dan No-Body) menggunakan strategi matching `ALL` atau `ANY` serta validasi struktur ketat (*strict body structure*).
3. **Dynamic Latency & Weighted Response Simulation**: Simulasi latensi jaringan sesungguhnya (*delay ms*) dan distribusi respon probabilistik acak (*weighted response*) untuk pengujian A/B testing dan API yang tidak stabil (*flaky API*).
4. **Scenario Flows / Request Flow Orchestration**:
   - **Multi-Step End-to-End Testing**: Orkestrasi alur request API berantai (misal: *Login -> Ambil Profil -> Buat Order -> Bayar*) tanpa memerlukan alat pihak ketiga seperti Postman Collection Runner.
   - **Dual View Modes**: Tampilan **Classic List View** (tampilan default dengan sistem paginasi 10 langkah per halaman, kontrol urutan, dan proteksi text overflow) serta **Visual Canvas View** (diagram alur grafis berbasis node interaktif).
   - **Isolated Step Execution (`Run Step`)**: Eksekusi satu langkah API secara terisolasi langsung dari kartu step atau canvas untuk kebutuhan debugging cepat.
   - **Dynamic Variable Chaining**: Ekstraksi nilai dari response header atau body langkah sebelumnya (contoh: `${step_1.response.body.data.token}`) untuk disuntikkan secara dinamis ke URL, header, query param, atau body langkah berikutnya.
   - **Batch Multi-Runs & Report Export**: Jalankan flow berulang kali (batch execution) untuk menguji ketahanan, lalu ekspor laporan akumulasi hasil eksekusi ke dalam format **Markdown (.md)** dan **CSV (.csv)**.
   - **Paginated Execution Timeline & Inspector**: Riwayat eksekusi terpaginasi yang menampilkan snapshot lengkap request/response, durasi (ms), status code HTTP, variabel terekstraksi, dan hasil validasi assertion.
5. **Data Sheets (Test Datasets)**: Pengelolaan dataset pengujian terpusat dalam format List atau Tabel untuk parameterisasi skenario pengujian.
6. **OpenAPI 3.0 & Insomnia Integration**: Impor spesifikasi OpenAPI/Swagger (lengkap dengan anotasi `x-environments` untuk pemetaan environment server) serta parser koleksi Insomnia untuk menghasilkan API dan Scenario Flows secara otomatis.
7. **Enterprise Authentication & Audit Logs**: Autentikasi lokal terenkripsi, integrasi **Single Sign-On (SSO) Google Workspace** dengan pembatasan domain (*whitelist* `SSO_DOMAINS`), serta pencatatan jejak audit sistem secara otomatis (**Change Logs** / `tblChangeLog`).
8. **Relational Persistence & Migration via Prisma**: Database relasional **PostgreSQL** dengan integritas referensial kuat, didukung fitur Export/Import snapshot JSON (mode *MERGE* dan *REPLACE*) dan Reset Database.
9. **Clean Architecture & Scalable Codebase**: Pemisahan tanggung jawab yang ketat antara **Core**, **Client Domain**, **Client Data**, **Client Presentation (MVVM Pattern)**, dan **Server Services / Controllers**.

---

## Arsitektur & Struktur Direktori

Struktur proyek mematuhi prinsip **Clean Architecture** dengan pemisahan client-server yang jelas serta penerapan pola **MVVM (Model-View-ViewModel)** pada presentation layer:

```text
mock-api-studio/
├── prisma/
│   └── schema.prisma                  # Skema Prisma ORM (Model & Relasi PostgreSQL)
├── src/
│   ├── app/                           # Next.js App Router (SSR, Views, & API Handlers)
│   │   ├── (auth)/                    # Route Group Auth (Sign-In)
│   │   ├── (protected)/               # Route Group Protected (Dashboard, Projects, Flows, FAQ, dll)
│   │   │   ├── dashboard/             # Halaman Dashboard
│   │   │   ├── projects/              # Halaman Manajemen Project & Detail
│   │   │   ├── scenario-flows/        # Halaman Scenario Flows (Request Flow)
│   │   │   ├── data-sheets/           # Halaman Data Sheets
│   │   │   ├── external-api-docs/     # Halaman OpenAPI / External Docs
│   │   │   ├── faq/                   # Halaman FAQ & Knowledge Base
│   │   │   ├── admin-accounts/        # Halaman Admin User Accounts
│   │   │   ├── admin-change-logs/     # Halaman Admin Audit Change Logs
│   │   │   └── settings/              # Halaman Settings & Database Engine
│   │   ├── api/                       # Next.js API Routes & Dynamic Router Engine
│   │   │   ├── [...path]/route.ts     # Engine Mock Proxying Dinamis (GET, POST, PUT, DELETE, dll)
│   │   │   ├── auth/                  # Route Autentikasi Internal & Google SSO Callback
│   │   │   ├── database/              # Route Aksi Database Snapshot (Export, Import, Reset)
│   │   │   ├── faq/                   # Route API FAQ Knowledge Base
│   │   │   ├── settings/              # Route API System Settings
│   │   │   └── upload/                # Route API Upload Berkas
│   │   ├── globals.css                # Global CSS & Tailwind CSS v4 Setup
│   │   └── layout.tsx                 # Root Layout & Global Providers
│   │
│   ├── client/                        # Client Layer (Clean Architecture & MVVM)
│   │   ├── domain/                    # Pure Business Logic (Framework Agnostic)
│   │   │   ├── account/               # Entity, Repository, & UseCases Akun Pengguna
│   │   │   ├── api/                   # Entity & UseCases API Endpoint
│   │   │   ├── auth/                  # UseCases Autentikasi & Sesi
│   │   │   ├── change-log/            # Entity & UseCases Audit Change Log
│   │   │   ├── collection/            # Entity & UseCases API Collections
│   │   │   ├── data-sheet/            # Entity & UseCases Data Sheets
│   │   │   ├── database/              # UseCases Database Snapshot & Reset
│   │   │   ├── environment/           # Entity & UseCases Environment
│   │   │   ├── faq/                   # Entity & UseCases FAQ
│   │   │   ├── project/               # Entity & UseCases Project
│   │   │   ├── request-scenario/      # Entity & UseCases Request Matching Scenario
│   │   │   ├── response-scenario/     # Entity & UseCases Response Scenario
│   │   │   ├── scenario-flow/         # Entity & UseCases Scenario Flow
│   │   │   └── settings/              # Entity & UseCases System Settings
│   │   ├── data/                      # Data Access Layer
│   │   │   └── [feature]/             # DTOs, Remote Data Sources (HTTP API), & Repository Impl
│   │   └── presentation/              # Presentation Layer (MVVM)
│   │       ├── components/            # Reusable UI Components (Navbar, Sidebar, Modals, Picker)
│   │       ├── stores/                # Zustand State Stores (Auth, UI, Onboarding)
│   │       └── views/                 # Feature Views + ViewModel Hooks Co-location
│   │           ├── dashboard/         # Dashboard View & ViewModel
│   │           ├── projects/          # Projects List View & ViewModel
│   │           ├── project-detail/    # Project Detail View & ViewModel
│   │           ├── api-detail/        # API Detail View & ViewModel
│   │           ├── request-scenario-editor/ # Request Scenario Editor
│   │           ├── scenario-flows/    # Scenario Flows List View
│   │           ├── scenario-flow-detail/ # Scenario Flow Detail (Classic List, Canvas, Timeline)
│   │           ├── data-sheets/       # Data Sheets View & ViewModel
│   │           ├── faq/               # FAQ View & ViewModel
│   │           └── settings/          # Settings View & ViewModel
│   │
│   ├── server/                        # Backend Server Services, Controllers, & Core Engine
│   │   ├── account/                   # Account Service & Controller
│   │   ├── api/                       # API Endpoint CRUD Services
│   │   ├── auth/                      # Session & Credentials Services
│   │   ├── change-log/                # Audit Logging Service
│   │   ├── collection/                # Collection Services
│   │   ├── dashboard/                 # Analytics Summary Service
│   │   ├── data-sheet/                # Data Sheet Services
│   │   ├── database/                  # Prisma Database Actions, Export, Import, & Reset
│   │   ├── environment/               # Environment Services
│   │   ├── external/                  # External API Services
│   │   ├── faq/                       # FAQ Service & Static Base Knowledge Data
│   │   ├── mock-proxy/                # Internal Mock Proxy Engine & In-Memory Cache
│   │   ├── openapi/                   # OpenAPI Parser, Exporter, & Environment Mapper
│   │   ├── project/                   # Project Services
│   │   ├── request-scenario/          # Request Scenario Services
│   │   ├── response-scenario/         # Response Scenario Services
│   │   └── scenario-flow/             # Scenario Flow Runner & Batch Execution Reporter
│   │
│   ├── core/                          # Cross-Cutting Core Infrastructure
│   │   ├── db/                        # Prisma Client Instance (`prisma-client.ts`), Helpers, & Seeder
│   │   ├── di/                        # Dependency Injection Container (@needle-di/core)
│   │   ├── http-client/               # Fetch API Wrapper Client
│   │   ├── constants/                 # Environment Variables, Roles, & System Defaults
│   │   └── utils/                     # Formatters, Validation Helpers, & Response Utilities
│   └── proxy.ts                       # Edge / Server Route Proxy Routing Configuration
```

---

## Alur Data Dinamis & Execution Engines

### 1. View-to-Database Mutation Flow (Client ke PostgreSQL)
$$\text{View Component} \xrightarrow{\text{User Event}} \text{ViewModel Hook} \xrightarrow{\text{Execute}} \text{UseCase (Domain)} \xrightarrow{\text{Interface}} \text{Repository Impl (Data)} \xrightarrow{\text{API Call}} \text{Server Service / Controller} \xrightarrow{\text{Prisma Client}} \text{PostgreSQL DB}$$

### 2. Mock API Proxy Engine Flow (`/api/[...path]`)
$$\text{External / Client HTTP Request} \longrightarrow \text{Next.js API Route } (\text{/api/[...path]}) \longrightarrow \text{Internal Proxy Engine}$$
$$\text{Internal Proxy Engine} \longrightarrow \begin{cases} 
1. \text{Fetch Project \& Active Environment Path} \\
2. \text{Match Endpoint Path \& HTTP Method} \\
3. \text{Evaluate Request Matching Scenarios } (\text{EXACT, PARTIAL, REGEX, JSON\_SCHEMA}) \\
4. \text{Select Weighted Response Scenario \& Apply Delay Latency } (\text{delay\_ms}) \\
5. \text{Return Simulated HTTP Response with Headers \& Body (JSON / File)}
\end{cases}$$

### 3. Scenario Flow Execution Flow (Request Flow)
$$\text{Trigger Run (Full Flow / Single Step)} \longrightarrow \text{Step Runner} \longrightarrow \begin{cases} 
1. \text{Resolve Target Environment \& Base URL} \\
2. \text{Inject Environment \& Upstream Extracted Variables } (\$\{step\_N.response...\}) \\
3. \text{Construct Request Payload } (\text{JSON, Form-Data, URL-Encoded, No-Body}) \\
4. \text{Execute HTTP Request \& Record Duration (ms)} \\
5. \text{Evaluate Step Assertions \& Extract Response Variables} \\
6. \text{Append Step Snapshot to Execution Timeline / Batch Accumulator}
\end{cases}$$

---

## Relasi Skema Database (Prisma PostgreSQL)

Seluruh relasi entitas didefinisikan secara deklaratif pada `prisma/schema.prisma` dan dikelola menggunakan Prisma Client:

- **`tblProject`**: Menyimpan metadata proyek API (*id, name, description, status, created_at, updated_at, deleted_at*).
- **`tblEnvironment`**: Menyimpan environment proyek (*LOCAL, DEVELOPMENT, TESTING, STAGING, PRODUCTION*), konfigurasi Base URL, dan variabel lingkungan (*variables Json*).
- **`tblCollection`**: Menyimpan folder modul / koleksi endpoint API dalam proyek.
- **`tblApi`**: Definisi endpoint REST (*path, method_request: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, status*).
- **`tblApiEnvironment`**: Pengaturan aktif/inaktif dan penimpaan path (*path_override*) API per environment.
- **`tblRequestScenario`**: Aturan pencocokan request (*headers, query_params, path_params, body, body_type, match_type, match_strategy: ALL/ANY, body_rules, strict_body_structure, priority*).
- **`tblResponseScenario`**: Skenario respon hasil evaluasi matching (*status_code, headers, body, response_type: JSON/FILE, file_path, delay_ms, weight, priority*).
- **`tblScenarioFlow`**: Definisi orkestrasi skenario flow (*name, description, default_environment_id, stop_on_failure, variables*).
- **`tblScenarioFlowStep`**: Langkah-langkah dalam flow (*step_order, method_override, path_override, headers_override, body_override, body_type, delay_ms, continue_on_error, extractors, assertions, target_environment*).
- **`tblScenarioFlowExecution`**: Riwayat eksekusi flow (*status, trigger_source, target_mode: LIVE/MOCK, total_steps, passed_steps, failed_steps, duration_ms, initial_variables, final_variables, executed_by, error_summary*).
- **`tblScenarioFlowExecutionStep`**: Detail snapshot tiap langkah yang dieksekusi (*step_order, step_name, method, url, status, http_status_code, duration_ms, request_snapshot, response_snapshot, extracted_variables, assertion_results, error_message*).
- **`tblDataSheet`**: Dataset pengujian (*name, code, category, description, format: LIST / TABLE, data Json*).
- **`tblAccount`**: Akun pengguna studio (*username, password, role, name, google_id, has_custom_password*).
- **`tblChangeLog`**: Jejak audit sistem (*action, entity_type, entity_id, project_id, user_id, operator, description, before_state, after_state, metadata*).
- **`tblProjectPic` & `tblApiPic`**: Relasi penugasan Person In Charge (PIC) untuk proyek dan API.

---

## Panduan Menjalankan Proyek

### Prerequisites
- **Node.js** >= 22.x
- **pnpm** (direkomendasikan: `npm i -g pnpm`) atau **npm**
- **PostgreSQL Database** (Lokal, Cloud, atau via Docker)
- **Docker & Docker Compose** (opsional untuk menjalankan via kontainer terisolasi)

---

### Menjalankan Secara Lokal

```bash
# 1. Clone repositori & masuk ke direktori
git clone <repository-url>
cd mock-api-studio

# 2. Pasang dependensi
pnpm install

# 3. Konfigurasikan Environment
cp .env.example .env
# Edit .env dan sesuaikan:
# - DATABASE_URL (Koneksi PostgreSQL)
# - APP_USERNAME & APP_PASSWORD (Kredensial login lokal)
# - Konfigurasi Google Workspace SSO (jika diperlukan)

# 4. Sinkronkan Skema Database Prisma
pnpm db:push
# atau gunakan migrasi:
# pnpm db:migrate

# 5. Jalankan Server Development
pnpm dev

# 6. Build & Jalankan Production Mode
pnpm build
pnpm start
```

Aplikasi akan aktif dan dapat diakses melalui peramban di `http://localhost:3000`.

---

### Perintah Manajemen Database (Prisma CLI)

Proyek dilengkapi dengan skrip pnpm untuk mempermudah operasi skema database:

| Perintah | Deskripsi |
| :--- | :--- |
| `pnpm db:push` | Mendorong perubahan skema `schema.prisma` langsung ke database tanpa membuat berkas migrasi (cocok untuk prototyping cepat). |
| `pnpm db:migrate` | Menjalankan migrasi database dalam lingkungan development (`prisma migrate dev`). |
| `pnpm db:deploy` | Menjalankan migrasi yang tertunda pada lingkungan production (`prisma migrate deploy`). |
| `pnpm db:generate` | Menghasilkan ulang Prisma Client TypeScript bindings (`prisma generate`). |
| `pnpm db:reset` | Mengosongkan database, menerapkan ulang seluruh migrasi, dan memuat seeder awal (`prisma migrate reset`). |

---

### Menjalankan via Docker

```bash
# 1. Siapkan berkas environment
cp .env.example .env
# Pastikan DATABASE_URL mengarah ke host PostgreSQL yang dapat diakses oleh container

# 2. Build dan jalankan container
docker compose up --build
```

Container akan mengekspos aplikasi di `http://localhost:3000`.

---

### Konfigurasi Autentikasi & Kredensial

#### 1. Kredensial Lokal Default
Kredensial login awal dibaca langsung dari variabel lingkungan:
- **`APP_USERNAME`**: `admin`
- **`APP_PASSWORD`**: `admin123`

#### 2. Konfigurasi Google Workspace SSO (OAuth 2.0)
Untuk mengaktifkan autentikasi Single Sign-On menggunakan akun Google perusahaan:
- **`GOOGLE_CLIENT_ID`**: OAuth 2.0 Client ID dari Google Cloud Console.
- **`GOOGLE_CLIENT_SECRET`**: OAuth 2.0 Client Secret dari Google Cloud Console.
- **`GOOGLE_CALLBACK_ROUTE`**: `/api/auth/sso/callback` (Daftarkan URL redirect lengkap di Google Cloud Console, misal: `http://localhost:3000/api/auth/sso/callback`).
- **`SSO_DOMAINS`**: Pembatasan domain email resmi yang diizinkan login (dipisahkan tanda koma, contoh: `company.com,partner.id`). Pengguna dengan domain di luar whitelist akan otomatis ditolak.

#### 3. Notifikasi Webhook (Google Chat Space)
- **`GOOGLE_SPACE_WEBHOOK_URL`**: URL webhook Google Chat Space untuk pengiriman notifikasi otomatis jika dikonfigurasi.

---

## FAQ & Knowledge Base

Pusat dokumentasi dan panduan interaktif telah terintegrasi di dalam aplikasi pada rute `/faq`. Anda dapat mencari informasi seputar konfigurasi endpoint, orkestrasi Scenario Flow (Request Flow), interpolasi variabel, simulasi latensi, serta arsitektur sistem secara langsung dari antarmuka studio.

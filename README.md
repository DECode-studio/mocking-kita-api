# Mocking Kita API ⚡

**Mocking Kita API** adalah platform engine mock API modern berbasis **Next.js (App Router - Node.js Runtime), Clean Architecture, SSR, dan SQLite Native Database (`node:sqlite`)**. Aplikasi ini dirancang untuk memungkinkan pengembang merancang endpoint REST, mengonfigurasi skenario request matching (*Exact, Partial, Regex, JSON Schema*), mensimulasikan skenario respons berbobot (*weighted response scenarios*) dengan latensi dinamis, serta melakukan proxying / mock testing API secara lokal.

---

## Tujuan Utama & Fitur Unggulan

1. **Predictable & Dynamic API Prototyping**: Membangun kontrak REST API secara cepat dan konsisten sebelum backend siap.
2. **Offline-First & Server-Side Persistence**: Penyimpanan terpusat dan efisien menggunakan **SQLite (`node:sqlite`)** dengan mode `WAL (Write-Ahead Logging)` dan relational schema.
3. **Smart Dynamic Proxying & Dynamic Route Mocking**: Engine `/api/[...path]` yang cerdas dan mampu memproses matching request scenario, CORS handling, fallback dynamic path parsing, serta simulasi delay latensi.
4. **Clean Architecture & Scalable Codebase**: Pemisahan yang ketat antara **Core (Driver & Infra), Domain (Pure Business Logic), Data (DTO & Concrete Repositories), dan Presentation (MVVM Pattern)**.
5. **Interactive Studio UI**: UI interaktif untuk mengelola Projects, Environments, API Collections, Request Scenarios, Response Scenarios, dan System Settings.

---

## Arsitektur & Infrastructure Design

Struktur proyek mematuhi **Clean Architecture** dan **MVVM (Model-View-ViewModel)** pada presentation layer:

```text
mock-api-studio/
├── .data/                             # Folder penyimpanan SQLite Database (.sqlite)
├── src/
│   ├── app/                           # Next.js App Router (SSR & Dynamic API Proxy Routes)
│   │   ├── (auth)/                    # Route Group Auth (Sign-In)
│   │   ├── (protected)/               # Route Group Protected (Dashboard, Projects, Environments, Settings)
│   │   ├── api/                       # API Handlers & Dynamic Engine Router
│   │   │   ├── [...path]/route.ts     # Dynamic Engine Mock Proxying (GET, POST, PUT, DELETE, dll)
│   │   │   ├── auth/                  # Internal Auth Routes
│   │   │   ├── database/              # SQLite Database Operations API
│   │   │   ├── settings/              # Settings & System Reset API
│   │   │   ├── internal-proxy.ts      # Core Engine Matching & Response Generator
│   │   │   └── internal-proxy-cache.ts# In-memory proxy caching layer
│   │   ├── globals.css                # Global CSS & Tailwind Setup
│   │   └── layout.tsx                 # Root Layout & Theme/Store Providers
│   │
│   ├── core/                          # Driver & Core System Infrastructure
│   │   ├── db/                        # SQLite Driver (`node:sqlite`), Schema Migrations & Seeder
│   │   │   ├── sqlite-client.ts       # Database Connection Client (`.data/mock-api-studio.sqlite`)
│   │   │   ├── database_storage_helper.ts # Query Helper & SQLite Storage Layer
│   │   │   ├── mock-api-database.ts    # Database Instance Contract
│   │   │   └── seed-data.ts           # Initial Default Project & Mock Data Seeder
│   │   ├── http-client/               # Custom Fetch / Base HTTP Client Wrapper
│   │   ├── constants/                 # Application-wide Constants
│   │   ├── theme/                     # Dark / Light Theme System
│   │   └── utils/                     # Formatters & Helper Utilities
│   │
│   ├── domain/                        # Pure Business Logic (Framework Agnostic)
│   │   ├── api/                       # API Entities, Repositories, & UseCases
│   │   ├── auth/                      # Authentication Logic & Session UseCases
│   │   ├── project/                   # Project Entities & Managing UseCases
│   │   ├── environment/               # Environment Configuration UseCases
│   │   ├── request-scenario/          # Request Matching Rule Entities & UseCases
│   │   ├── response-scenario/         # Response Payload & Latency/Weight UseCases
│   │   ├── settings/                  # Application Settings UseCases
│   │   └── database/                  # Core Database Reset & Management UseCases
│   │
│   ├── data/                          # Data Access Layer & Implementation
│   │   ├── api/                       # API Data DTOs, Mappers & Concrete Repositories
│   │   ├── auth/                      # Session & Credentials Data Source Implementations
│   │   ├── project/                   # Project Storage & DB Persistence Implementations
│   │   ├── environment/               # Environment Data Repositories
│   │   ├── request-scenario/          # Request Scenario Data Repositories
│   │   ├── response-scenario/         # Response Scenario Data Repositories
│   │   └── settings/                  # Settings Data Storage Implementation
│   │
│   └── presentation/                  # UI Layer (MVVM Architecture)
│       ├── components/                # Shared Components (Layout, Sidebar, Navbar, Dialogs, Cards)
│       ├── stores/                    # Client State Management (Zustand Stores)
│       └── views/                     # Feature Views (View + ViewModel Hook Co-location)
│           ├── dashboard/             # Dashboard View & ViewModel (`useDashboardViewModel.ts`)
│           ├── projects/              # Projects List & Detail Views + ViewModels
│           ├── environments/          # Environments View & ViewModel
│           ├── settings/              # System Settings View & ViewModel
│           └── sign-in/               # Authentication View & ViewModel
```

---

## Dynamic Data Flow & Request Matching Engine

### 1. View-to-Database Mutation Flow (Client to DB)
$$\text{View Component} \xrightarrow{\text{User Event}} \text{ViewModel Hook} \xrightarrow{\text{Execute}} \text{UseCase (Domain)} \xrightarrow{\text{Interface}} \text{Repository Impl (Data)} \xrightarrow{\text{Query}} \text{SQLite Storage Helper (Core)} \xrightarrow{\text{SQL Execute}} \text{SQLite DB}$$

### 2. Mock API Proxy Engine Flow (`/api/[...path]`)
$$\text{External / Client HTTP Request} \longrightarrow \text{Next.js API Route } (\text{/api/[...path]}) \longrightarrow \text{Internal Proxy Engine}$$
$$\text{Internal Proxy Engine} \longrightarrow \begin{cases} 
1. \text{Fetch Project \& Environment Path} \\
2. \text{Match Endpoint Path \& HTTP Method} \\
3. \text{Evaluate Request Matching Scenarios } (\text{EXACT, PARTIAL, REGEX, JSON\_SCHEMA}) \\
4. \text{Select Weighted Response Scenario \& Apply Delay Latency } (\text{delay\_ms}) \\
5. \text{Return Simulated HTTP Response with Headers \& Body}
\end{cases}$$

---

## Relasi Schema Database (SQLite Schema)

Database menggunakan native SQLite via `node:sqlite` yang disimpan di `.data/mock-api-studio.sqlite`. Struktur tabel meliputi:

- **`tblProject`**: Menyimpan metadata proyek API (*id, name, description, status, created_at, updated_at, deleted_at*).
- **`tblEnvironment`**: Menyimpan environment proyek (*LOCAL, DEVELOPMENT, STAGING, PRODUCTION*) beserta base URL.
- **`tblApi`**: Definisi endpoint REST (*path, method_request: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD*).
- **`tblApiEnvironment`**: Override path & status aktif API per environment tertentu.
- **`tblRequestScenario`**: Aturan matching request (*headers, query_params, path_params, body, match_type, priority*).
- **`tblResponseScenario`**: Skenario respon hasil matching (*status_code, headers, body, delay_ms, weight, priority*).

---

## Panduan Menjalankan Proyek

### Prerequisites
- Node.js >= 22.x (Membutuhkan dukungan built-in `node:sqlite`)
- pnpm package manager (`npm i -g pnpm`)
- Docker dan Docker Compose, jika ingin menjalankan via container

### Run Lokal

```bash
# 1. Install Dependencies
pnpm install

# 2. Siapkan environment
cp .env.example .env
# isi APP_USERNAME dan APP_PASSWORD di .env

# 3. Jalankan Server Development
pnpm dev

# 4. Build & Run Production Mode
pnpm build
pnpm start
```

### Run via Docker

```bash
# 1. Siapkan environment
cp .env.example .env
# isi APP_USERNAME dan APP_PASSWORD di .env

# 2. Build dan jalankan container
docker compose up --build
```

Container akan mengekspos aplikasi di `http://localhost:3000` dan menyimpan database SQLite di folder `.data/` pada host.

### Default Credentials

Pastikan nilai `APP_USERNAME` dan `APP_PASSWORD` di `.env` sama dengan kredensial login demo yang ingin dipakai.

Contoh:
- **Username**: `admin`
- **Password**: `admin123`

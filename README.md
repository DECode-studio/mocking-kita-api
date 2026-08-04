# Mock API Studio ⚡

**Mock API Studio** adalah aplikasi engine mock API modern berbasis **Next.js (App Router), Clean Architecture, SSR, dan SQLite Database**. Aplikasi ini dirancang untuk memungkinkan pengembang merancang endpoint REST, mengonfigurasi skenario respons berbobot (weighted response scenarios), mengelola lingkungan multi-environment, serta melakukan simulasi aturan HTTP secara lokal sebelum layanan backend sebenarnya siap.

---

## 📌 Tujuan Utama Aplikasi

1. **Predictable API Prototyping**: Membangun kontrak REST API secara cepat dan konsisten sebelum backend selesai dikembangkan.
2. **Offline-First & Server-Side Persistence**: Menggantikan penyimpanan `LocalStorage` dengan **SQLite Database** yang terpusat, aman, dan dapat diakses langsung oleh **SSR (Server-Side Rendering)**.
3. **Multi-Scenario Mocking**: Menyediakan fitur skenario pencocokan request (*Exact, Partial, Regex, JSON Schema*) serta variasi respons berbobot (*weighted response scenarios*) dan simulasi delay latensi.
4. **Clean Architecture & Scalable Codebase**: Menerapkan arsitektur yang terpisah secara tegas antara **Core, Domain, Data, dan Presentation (MVVM)** untuk mempermudah pengembangan jangka panjang.

---

## 🏗 Arsitektur & System Design (Clean Architecture + MVVM)

Aplikasi ini membagi struktur kode menjadi 4 layer utama berdasarkan prinsip **Dependency Rule** (dependensi hanya mengarah ke dalam):

```text
mock-api-studio/
├── app/                                # Next.js App Router (SSR Entry Points & Server APIs)
│   ├── api/                            # Server API Routes (SQLite Server Access)
│   ├── (auth)/sign-in/page.tsx         # SSR Entry Point untuk Login View
│   └── (protected)/dashboard/page.tsx  # SSR Entry Point untuk Dashboard View
│
└── src/
    ├── core/                           # Driver & System Infrastructure
    │   ├── db/                         # SQLite Connection Driver & Setup
    │   ├── http-client/                # Base HTTP Client Wrapper (Fetch/Axios)
    │   └── errors/                     # Exception Handling
    │
    ├── domain/                         # Pure Business Logic (Framework Agnostic)
    │   ├── entities/                   # UserSession, Project, Api, Environment, Scenario
    │   ├── repositories/               # Repository Contracts / Interfaces
    │   └── usecases/                   # Application Use Cases (Pure Business Rules)
    │
    ├── data/                           # Data Management & Persistence Layer
    │   ├── models/                     # DTO & Database Schemas
    │   ├── repositories/               # Concrete Repository Implementations
    │   └── resources/                  # Data Sources (local/ SQLite vs remote/ API Client)
    │
    └── presentation/                   # UI Layer (MVVM Pattern)
        ├── views/                      # Feature Views Co-located
        │   ├── sign-in/
        │   │   ├── SignInView.tsx      # Pure View Component ('use client')
        │   │   ├── useSignInViewModel.ts
        │   │   └── components/         # Sub-widgets (Form, Header, DemoBox)
        │   ├── dashboard/
        │   │   ├── DashboardView.tsx
        │   │   ├── useDashboardViewModel.ts
        │   │   └── components/
        │   └── ...                     # Projects, Environments, API Detail, Settings
        └── components/                 # Shared Reusable Widgets
```

---

## 🔄 Dynamic Data Flow (Request & Response Pipeline)

### 1. Write / Mutation Flow (Post, Put, Delete, Form Submit)
$$\text{View Component} \longrightarrow \text{View Model Hook} \longrightarrow \text{UseCase (Domain)} \longrightarrow \text{Repo Interface} \longrightarrow \text{Repo Impl (Data)} \longrightarrow \text{Remote Resource} \longrightarrow \text{HTTP Client (Core)} \longrightarrow \text{Server API Route} \longrightarrow \text{Local Resource} \longrightarrow \text{SQLite DB (Core)}$$

### 2. Read / Fetch GET Flow (SSR Page Rendering)
$$\text{SQLite DB (Core)} \longrightarrow \text{Local Resource (Data)} \longrightarrow \text{Repo Impl (Data)} \longrightarrow \text{SSR Page (app/route/page.tsx)} \longrightarrow \text{View Component} \longrightarrow \text{View Model Hook}$$

---

## 🗄 Relasi Schema Database (SQLite)

Penyimpanan SQLite dirancang berdasarkan skema relational [mocking-kita.sql](file:///.extra/mocking-kita.sql):

- **`tblProject`**: Menyimpan proyek API utama.
- **`tblEnvironment`**: Konfigurasi environment (*LOCAL, DEVELOPMENT, STAGING, PRODUCTION*) dan Base URL.
- **`tblApi`**: Endpoint API (*Path, HTTP Method: GET, POST, PUT, dll.*).
- **`tblApiEnvironment`**: Pemetaan & Override path API per environment.
- **`tblRequestScenario`**: Aturan matching request (*EXACT, PARTIAL, REGEX, JSON_SCHEMA*) beserta JSON body/headers/params.
- **`tblResponseScenario`**: Respon mock (Status Code, JSON Body, Latency Delay `delay_ms`, dan `weight` probabilitas).

---

## 🛠 Panduan Jalankan Proyek

### Prerequisites
- Node.js >= 18.x
- pnpm package manager (`npm i -g pnpm`)

### Installation & Running

```bash
# 1. Install Dependencies
pnpm install

# 2. Jalankan Server Development
pnpm dev

# 3. Build & Run Production Mode
pnpm build
pnpm start
```

Default credentials untuk lokal demo:
- **Username**: `admin`
- **Password**: `admin123`

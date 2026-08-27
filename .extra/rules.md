# Architecture Rules & Guidelines

Dokumen panduan aturan pengkodean (*Coding Standards*) untuk proyek **Mock API Studio** berdasarkan struktur **Clean Architecture + SSR (Next.js App Router)** dan **MVVM Pattern**.

---

## 1. Prinsip Utama Arsitektur (Core Principles)

1. **Unidirectional Dependency Rule**:
   - Dependensi hanya boleh mengarah ke dalam (`Presentation` -> `Domain` <- `Data`, `Core`).
   - Domain layer tidak boleh mengimpor modul dari Presentation, Data, atau Next.js Framework.
2. **Single Responsibility per Layer**:
   - **`app/`**: Hanya tempat entry point SSR page router dan API Route handling.
   - **`src/core/`**: Driver tingkat rendah (SQLite Client, Axios/Fetch HTTP Client).
   - **`src/domain/`**: Pure Business Entities, Business Interfaces, dan Use Cases (Bebas dari React/Next.js).
   - **`src/data/`**: Data Mappers, DTO Models, Concrete Repositories, Data Sources.
   - **`src/presentation/`**: Views (Murni UI) & View Models (Hook di dalam folder `hook/` pemegang UI State & Logic).
3. **No LocalStorage**:
   - Seluruh data wajib disimpan & dibaca dari **SQLite Database** via Data Layer. `LocalStorage` atau `SessionStorage` dilarang digunakan untuk persistence data.

---

## 2. Aturan Layer & Modul (Detail DOs & DON'Ts)

### A. Next.js App Router (`app/`)
* **DOs**:
  - ✅ Gunakan `app/[route]/page.tsx` murni sebagai **Server Component (SSR Page Shell)**.
  - ✅ Ambil initial data di server side (SSR) via Data Layer / UseCase, lalu operkan sebagai `props` ke View Component.
  - ✅ Buat API route handler di `app/api/` untuk endpoint HTTP yang diakses oleh Client Data Source.
* **DON'Ts**:
  - ❌ **JANGAN** membuat UI kompleks, form state, atau handler event langsung di `app/[route]/page.tsx`.
  - ❌ **JANGAN** menggunakan `'use client'` pada file `app/[route]/page.tsx` utama jika halaman tersebut dimaksudkan untuk SSR initial fetching.

---

### B. Core Layer (`src/core/`)
* **DOs**:
  - ✅ Tempatkan driver dasar seperti insialisasi SQLite Connection (`src/core/db/sqlite-client.ts`) dan Base HTTP Client (`src/core/http-client/api-client.ts`).
  - ✅ Kelola error global dan utility helper tingkat rendah di sini.
* **DON'Ts**:
  - ❌ **JANGAN** menempatkan business logic, domain entities, atau UI state di dalam `core/`.
  - ❌ **JANGAN** mengimpor elemen dari `presentation/` atau `domain/`.

---

### C. Domain Layer (`src/domain/`)
* **DOs**:
  - ✅ Tulis Pure Typescript untuk `entities/`, `repositories/` (Interfaces saja), dan `usecases/`.
  - ✅ Strukturkan domain per module bisnis dengan pola:
    - `src/domain/<module>/entity/`
    - `src/domain/<module>/usecase/`
    - `src/domain/<module>/repository/`
  - ✅ Setiap module menaruh usecase spesifik pada file `<module>_usecase.ts`.
  - ✅ Pastikan `UseCases` bertindak sebagai eksekutor satu unit tugas bisnis per module atau per use case spesifik.
  - ✅ Buat `Repository` di Domain HANYA berupa Interface dan pisahkan per module.
* **DON'Ts**:
  - ❌ **JANGAN** mengimpor `React`, `Next.js`, UI Libraries, Axios, atau SQLite Driver di dalam `domain/`.
  - ❌ **JANGAN** menuliskankan kode logika database SQL query di `domain/`.
  - ❌ **JANGAN** menggabungkan semua entity/repository/usecase dalam satu file besar jika modulnya sudah jelas terpisah.

---

### D. Data Layer (`src/data/`)
* **DOs**:
  - ✅ Pisahkan menjadi **`models/`** (DTO DB/API schema), **`repositories/`** (Implementasi konkrit interface domain), dan **`resources/`** (Data Sources).
  - ✅ Strukturkan data per module dengan pola:
    - `src/data/<module>/model/`
    - `src/data/<module>/data_source/`
    - `src/data/<module>/repository/`
  - ✅ Setiap module menaruh data source spesifik pada file `<module>_data_source.ts` dan `<module>_data_source_impl.ts`.
  - ✅ Data source server-side tetap mengarah ke SQLite, dan data source client-side tetap mengarah ke `app/api/`.
  - ✅ Setiap module harus punya model, data source, dan repository sendiri bila memang memiliki tabel/entitas di schema.
  - ✅ Selalu lakukan mapping data dari `Data Model` (DTO) ke `Domain Entity` di dalam Repository Implementation sebelum mengembalikan data ke Use Case.
* **DON'Ts**:
  - ❌ **JANGAN** mengembalikan raw Database Model / DTO langsung ke Domain atau View Model tanpa melalui mapper.
  - ❌ **JANGAN** memanggil `db` SQLite langsung di dalam View Component atau View Model. Panggil via Data Source/Repository.
  - ❌ **JANGAN** menaruh semua akses tabel ke satu repository/resource monolitik kalau entitasnya sudah terpisah di schema.

---

### E. Presentation Layer & MVVM (`src/presentation/views/`)
* **DOs**:
  - ✅ Terapkan **Feature Co-location MVVM**:
    - `[Feature]View.tsx`: Murni UI Layout & Render JSX (`'use client'`).
    - `hook/use[Feature].ts`: Custom Hook sebagai View Model (semua hook disimpan di dalam folder `hook/`). Tempat untuk `useState`, `useForm`, routing, dan memanggil Use Cases.
    - `components/`: Sub-widget lokal spesifik modul tersebut.
  - ✅ Operkan state dan event handler dari View Model hook ke View Component (`const vm = useSignIn()`).
* **DON'Ts**:
  - ❌ **JANGAN** menuliskan inline business logic atau panggil API HTTP langsung dari `View.tsx`. Semua harus melalui `hook/use[Feature].ts` View Model hook.
  - ❌ **JANGAN** menempatkan `hook/use[Feature].ts` di luar folder `hook/` pada tiap module presentation layer atau di folder global jika hook tersebut hanya digunakan oleh 1 halaman spesifik.

---

## 3. Matriks Aturan Impor (Import Dependency Matrix)

| Layer | Boleh Mengimpor Dari | DILARANG Mengimpor Dari |
| :--- | :--- | :--- |
| **`app/` (SSR Pages)** | `presentation/`, `domain/`, `data/`, `core/` | - |
| **`presentation/`** | `domain/`, `presentation/components` | `data/resources/local`, `core/db` |
| **`domain/`** | - (Pure TS only) | `presentation/`, `data/`, `core/`, `react`, `next` |
| **`data/`** | `domain/`, `core/` | `presentation/`, `app/` |
| **`core/`** | Node.js Libraries (SQLite, Fetch/Axios) | `presentation/`, `domain/`, `data/` |

---

## 4. Ringkasan Singkat DOs & DON'Ts

### ✅ DOs:
1. **Ikuti Flow Write Request**: `View` ➔ `ViewModel (Hook)` ➔ `UseCase` ➔ `Repo Interface per module` ➔ `Repo Impl per module` ➔ `Remote Data Source per module` ➔ `HTTP Client` ➔ `Server API` ➔ `Local Data Source per module` ➔ `SQLite DB`.
2. **Ikuti Flow Read GET Request (SSR)**: `SQLite DB` ➔ `Local Data Source per module` ➔ `Repo Impl per module` ➔ `SSR Page` ➔ `View Component` ➔ `ViewModel`.
3. **Simpan Seluruh Data di SQLite**: Gantikan `LocalStorage` dengan SQLite DB yang diakses via Data Layer.
4. **Jaga Layer Presentation Clean**: View Component hanya untuk JSX & styling, View Model Hook untuk state & action.

### ❌ DON'Ts:
1. **DILARANG** menggunakan `LocalStorage` atau `SessionStorage` untuk menyimpan data aplikasi.
2. **DILARANG** mengimpor `better-sqlite3` atau query database langsung di dalam Client Component (`'use client'`) atau View Model.
3. **DILARANG** mengimpor infrastruktur / framework di dalam `src/domain/`.
4. **DILARANG** mencampur View Model hook global jika modul hanya dipakai secara lokal (gunakan Co-location `src/presentation/views/[feature]/hook/use[Feature].ts`).

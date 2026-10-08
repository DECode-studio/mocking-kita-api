---
name: mock-api-studio-product-knowledge
description: Bundle panduan lengkap Product Knowledge Mock API Studio (Mocking Kita Studio), mencakup arsitektur sistem, otentikasi SSO/Local, manajemen project & multi-environment, REST mock engine & weighted scenarios, orkestrasi Scenario Flows (Dual View, variable chaining, assertions), Scenario Flow Jobs scheduler, dataset Data Sheets, integrasi OpenAPI/Insomnia, External API CI/CD, dan audit Change Logs.
---

# Skill: Mock API Studio - Complete Product Knowledge Bundle

Selamat datang di modul bundle **Product Knowledge Mock API Studio (Mocking Kita Studio)**.

Dokumen ini berfungsi sebagai gerbang utama (*entry point*) untuk memahami seluruh kapabilitas, arsitektur, dan cara penggunaan sistem Mock API Studio secara menyeluruh namun tetap hemat *context window* berkat pemisahan modul fungsional (*modularized context loading*).

---

## 🧭 Peta Modul Product Knowledge (`docs/skills/product-knowledge/modules/`)

Jika Anda memerlukan pemahaman mendalam mengenai topik spesifik, baca berkas modul terkait di bawah ini:

| No | Modul Fungsional | File Modul | Ringkasan Topik |
|---|---|---|---|
| 01 | **System Overview & Security** | [`modules/01-system-overview-and-architecture.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/01-system-overview-and-architecture.md) | Clean Architecture + MVVM, Prisma PostgreSQL, Autentikasi (Local & Google SSO Whitelist), Roles (`ADMIN`, `MEMBER`), PIC penugasan, dan notifikasi Google Space. |
| 02 | **Project & Environment Management** | [`modules/02-project-and-environment-management.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/02-project-and-environment-management.md) | Hierarki Project & Collection, 5 tipe environment (`LOCAL` $\rightarrow$ `PROD`), Base URL, dan Environment Variables (`{{KEY}}`). |
| 03 | **REST API & Mock Proxy Engine** | [`modules/03-mock-api-and-proxy-engine.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/03-mock-api-and-proxy-engine.md) | Definisi API REST, Request Matching (`EXACT`, `PARTIAL`, `REGEX`, `JSON_SCHEMA`), Weighted Response Lottery, Latensi Dinamis, In-Memory Proxy Cache. |
| 04 | **Scenario Flows (E2E API Orchestrator)** | [`modules/04-scenario-flows.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/04-scenario-flows.md) | Dual View (Classic List & Visual Canvas), Variable Chaining (`${step_N...}`), Isolated `Run Step`, Assertions, Batch Runs, Timeline Inspector, Ekspor MD/CSV. |
| 05 | **Scenario Flow Jobs (Scheduler)** | [`modules/05-scenario-flow-jobs.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/05-scenario-flow-jobs.md) | Background Scheduler (`CRON`, `INTERVAL`, `ONCE`), Data Iteration (`PER_TICK`, `BATCH_ALL`), Stop Conditions, Alerting Google Space Card v2. |
| 06 | **Data Sheets (Test Datasets)** | [`modules/06-data-sheets.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/06-data-sheets.md) | Dataset `TABLE` & `LIST`, Sintaks Token Pointer (`{{datasheet.code.next.field}}`, `[index]`, `random`), Data-driven testing lifecycle. |
| 07 | **OpenAPI & Importers Guide** | [`modules/07-openapi-and-importers.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/07-openapi-and-importers.md) | Panduan komprehensif Impor OpenAPI 2.0/3.x, Koleksi Insomnia v5, Template Scenario Flow JSON v1 dengan Auto-Provisioning, serta Ekspor OpenAPI/Flow. |
| 08 | **External API & CI/CD Automation** | [`modules/08-external-api-and-ci-cd.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/08-external-api-and-ci-cd.md) | Integrasi Headless `/api/v1/external/*`, Autentikasi JWT & API Key, Otomatisasi GitHub Actions/GitLab CI, Programmatic Mocks. |
| 09 | **Admin, Database & Audit Logs** | [`modules/09-admin-database-and-audit.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/product-knowledge/modules/09-admin-database-and-audit.md) | Manajemen Akun, Diff Forensik `tblChangeLog`, Export/Import Snapshot Database (`MERGE`/`REPLACE`), Reset Database, FAQ Knowledge Base. |

---

## ⚡ Ringkasan Mental Model & Cara Penggunaan

1. **Membuat Mock API Sederhana**:
   - Buka project $\rightarrow$ Tambahkan API $\rightarrow$ Konfigurasikan Request Scenario (Method, Path, Body) $\rightarrow$ Atur Response Scenario (Status Code, JSON Body / File, Latency Delay ms).
   - Akses melalui endpoint proxy dinamis: `http://localhost:3000/api/[...path]`.

2. **Merangkai Skenario Pengujian Alur (Scenario Flow)**:
   - Buat Scenario Flow $\rightarrow$ Tambahkan Langkah (Step 1: Login, Step 2: Get Profile, Step 3: Checkout) $\rightarrow$ Gunakan Ekstraktor Response (`authToken = data.token`) $\rightarrow$ Panggil di Step berikutnya dengan `{{authToken}}` atau `${step_1.response.body.data.token}` $\rightarrow$ Tambahkan Asersi Status Code & JSON Path $\rightarrow$ Jalankan Flow (Live atau Mock).

3. **Menjalankan Pengujian Terjadwal Otomatis (Scenario Flow Job)**:
   - Buka tab Jobs pada Flow $\rightarrow$ Tentukan tipe jadwal (`CRON` misal `*/10 * * * *`, `INTERVAL`, atau `ONCE`) $\rightarrow$ Pilih Target Mode (`LIVE` atau `MOCK`) $\rightarrow$ Hubungkan dengan dataset Data Sheet jika ingin data dinamis $\rightarrow$ Atur Stop Condition $\rightarrow$ Aktifkan (`ACTIVE`). Sistem akan mengeksekusi di background dan mengirim peringatan ke Google Space jika gagal.

4. **Menyinkronkan dengan OpenAPI / Swagger / Insomnia**:
   - Masuk ke tab External Docs / Import $\rightarrow$ Unggah dokumen OpenAPI JSON/YAML atau koleksi Insomnia $\rightarrow$ Pilih mode `MERGE` atau `REPLACE` $\rightarrow$ Sistem secara otomatis memetakan Collections, APIs, Request/Response Scenarios, dan Scenario Flows.

---

## 🔗 Deep Technical Parsers Reference

Untuk algoritma parsing tingkat rendah dan spesifikasi kontrak JSON:
- [`openapi-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/openapi-parser/SKILL.md): Algoritma dereferensi `$ref` & `allOf`.
- [`insomnia-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/insomnia-parser/SKILL.md): Transformasi AST Insomnia & template tag translation.
- [`scenario-flow-parser/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/scenario-flow-parser/SKILL.md): Spesifikasi `$schema: "mock-api-studio/scenario-flow/v1"`.
- [`external-api/SKILL.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/skills/external-api/SKILL.md): Kontrak payload External API `/api/v1/external/*`.

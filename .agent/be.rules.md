# Backend Rules & Guardrails

Dokumen ini adalah aturan backend yang wajib diikuti untuk proyek **Mocking Kta Api Studio** per **2026-09-03**.

Tujuan utama:
- menjaga boundary FE dan BE: `presentation/domain/data/di` untuk FE, `app/api`, `modules`, dan `core/server` untuk BE
- memastikan backend feature logic dimiliki module ala NestJS: controller/adapter -> service -> repository
- memastikan semua akses database berjalan di server melalui API internal resmi
- menjaga dynamic mock proxy tetap deterministic, aman, dan mudah dites
- mencegah kebocoran Prisma, credential, raw error, dan detail internal ke client

---

## 1. Prinsip Inti

1. **`src/app/api/**` adalah backend/BFF resmi sebagai HTTP adapter**
   - Semua operasi mutasi dan read database dari UI wajib lewat endpoint internal di `src/app/api/**`.
   - Presentation layer tidak boleh memanggil Prisma, SQL, filesystem database, atau storage helper langsung.
   - Route handler harus tipis dan mendelegasikan feature logic ke `src/server/<module>/**` untuk code baru/refactor besar.

2. **FE domain tetap murni**
   - `src/client/domain/**` berisi entity, repository interface, dan use case.
   - Domain tidak boleh import Next.js, React, Prisma, cookies, `NextRequest`, `NextResponse`, HTTP client, atau BE server module.
   - FE use case boleh mengatur flow client/UX, tetapi bukan sumber kebenaran security/authorization.

3. **FE data layer hanya remote/client infrastructure**
   - `src/client/data/**` menerjemahkan contract domain FE ke DTO/API internal.
   - Repository yang dipakai presentation harus remote-style dan lewat API internal, mengikuti pola `callDatabase`, `apiRequest`, atau client API yang setara.
   - `src/client/data/**` tidak boleh menjadi BE persistence layer, import Prisma, atau import `src/server/**`.

4. **BE server module adalah ownership feature backend**
   - `src/server/<module>/**` berisi service, repository, schema, mapper, policy, audit, errors, dan test BE.
   - BE server module tidak boleh import FE presentation, FE hook, atau FE remote repository.
   - Cross-module dependency harus lewat public API `src/server/<module>/index.ts` atau interface kecil.

5. **Core dipisah berdasarkan runtime**
   - `src/core/shared/**` untuk pure helper/type/constant yang aman untuk browser dan server.
   - `src/core/client/**` untuk HTTP client/browser-safe helper.
   - `src/core/server/**` untuk Prisma, filesystem, cookies/session, server crypto, safe-path, logger, dan rate limit.
   - Struktur existing `src/core/db/**`, `src/core/http-client/**`, `src/core/utils/**` boleh dipakai selama migrasi, tetapi module yang mengakses Prisma, filesystem, cookie, atau Node API harus dianggap server-only.

6. **Fail closed**
   - Error database, auth, validation, import/export, proxy matching, dan upload harus menghasilkan error eksplisit.
   - Jangan membuat fallback sukses palsu, persistence mock diam-diam, atau bypass auth pada production path.

---

## 2. Struktur Backend Project Ini

Struktur aktual yang harus dihormati:

```text
src/
  app/
    api/
      [...path]/route.ts          # Dynamic mock API proxy catch-all
      route.ts                    # Root dynamic proxy entry
      internal-proxy.ts           # Matching engine dan response generator
      internal-proxy-cache.ts     # In-memory cache/throttle state
      auth/                       # Login/session/SSO route
      admin/accounts/             # Admin account management
      change-logs/                # Audit/change log API
      database/                   # Database action gateway
      database/export/            # Database export
      database/import/            # Database import
      faq/                        # FAQ API
      projects/[id]/export-openapi/
      projects/[id]/import-openapi/
      settings/
      upload/
  server/                        # Target BE server module ownership untuk code baru/refactor
    auth/
    account/
    project/
    environment/
    collection/
    api/
    request-scenario/
    response-scenario/
    mock-proxy/
    database/
    openapi/
    upload/
    change-log/
    settings/
  core/
    shared/                       # Target pure shared helper/type/constant
    client/                       # Target browser-safe client helper
    server/                       # Target server-only helper: Prisma/session/security/logger
    db/                           # Existing server-only Prisma/storage helpers during migration
    http-client/                  # Existing FE API clients during migration
    openapi/                      # OpenAPI converter
    utils/
    constants/
  domain/
    account/
    api/
    auth/
    change-log/
    collection/
    database/
    environment/
    faq/
    project/
    request-scenario/
    response-scenario/
  data/
    account/
    api/
    auth/
    change-log/
    collection/
    database/
    environment/
    faq/
    project/
    request-scenario/
    response-scenario/
  di/
    container.ts (getService)
```

Catatan:
- Jangan menambahkan struktur generik seperti `src/server/server/**`; gunakan `src/server/**` untuk BE server module.
- Existing `src/client/domain/**`, `src/client/data/**`, dan `src/core/di/**` diperlakukan sebagai flow FE/client application selama migrasi.
- Backend persistence logic baru/refactor besar harus masuk `src/server/<module>/**`, bukan menambah coupling di `src/client/data/**`.
- `prisma/schema.prisma` saat ini memakai provider `postgresql`; jangan mengasumsikan SQLite untuk code baru tanpa memeriksa config aktif.
- Jika README atau dokumen lain berbeda dengan kode aktual, ikuti kode aktual dan rapikan dokumentasinya pada perubahan terpisah.

---

## 3. Boundary Antar Layer

### A. Presentation (`src/client/presentation/**`)

**Boleh**
- memakai View, component, Zustand store, dan hook/view model
- memanggil use case dari `src/core/di/container.ts (getService)`
- memakai repository remote melalui use case
- memakai DTO/entity domain yang aman untuk client

**Dilarang**
- import `@prisma/client`
- import `src/core/db/prisma-client`
- import `src/core/db/database_storage_helper`
- import datasource impl yang melakukan DB query langsung
- import route handler, `internal-proxy`, atau module server-only
- membaca cookie auth sensitif secara langsung dari client

### B. API Route Handler (`src/app/api/**/route.ts`)

**Boleh**
- parsing request, params, query, cookie
- validasi input
- memanggil public controller/service dari `src/server/<module>/index.ts`
- memanggil helper backend existing hanya untuk route legacy selama migrasi
- mapping output ke JSON/Response
- memilih status code HTTP

**Dilarang**
- menaruh business logic panjang yang sulit dites
- return raw Prisma record jika ada field sensitif atau shape internal
- expose stack trace/raw database error
- import component/hook dari `src/client/presentation/**`
- import FE remote repository dari `src/client/data/**`
- import repository internal module lain secara langsung
- mengubah error infra menjadi `{ success: true }`

### C. Domain (`src/client/domain/**`)

**Boleh**
- entity dan type bisnis
- repository interface
- use case dan orchestration murni
- aturan status, duplicate, toggle, matching policy yang tidak bergantung framework

**Dilarang**
- dependency ke Next.js, React, Prisma, filesystem, cookies, environment variable, atau HTTP client
- membaca/menulis database langsung
- memakai `any` untuk melewati contract penting

### D. Data (`src/client/data/**`)

**Boleh**
- implement FE remote repository untuk interface `src/client/domain/**/repository`
- mapping DTO/API response ke entity/domain object yang aman untuk FE
- memanggil `callDatabase`, `apiRequest`, atau HTTP client internal
- menyimpan detail endpoint internal yang dipakai FE

**Dilarang**
- menjadi BE persistence repository
- import Prisma, `src/core/db/**`, `src/core/server/**`, filesystem, cookies, atau Node-only API
- import `src/server/**`
- dipakai langsung oleh UI jika melewati use case/repository contract
- mengekspor raw persistence model sebagai domain entity tanpa mapper
- fallback ke data local/memory untuk operasi yang seharusnya persistent

### E. BE Modules (`src/server/**`)

**Boleh**
- berisi controller/handler, service, repository, schema, mapper, policy, audit, errors, dan test per module
- import Prisma melalui repository atau server infrastructure
- import `src/core/server/**` dan pure shared helper
- import module lain hanya melalui public `index.ts` atau interface kecil

**Dilarang**
- import `src/client/presentation/**`, FE hook/view model, atau FE remote repository
- export raw Prisma helper sebagai API publik module
- membuat dependency cycle antar module
- mencampur business logic final ke route adapter

### F. Core DB / Server Infrastructure (`src/core/db/**`, `src/core/server/**`)

**Boleh**
- import Prisma client
- transaksi, seed, import/export, reset, snapshot, change log
- mapping database aggregate ke `MockApiDatabase`

**Dilarang**
- diimport oleh presentation/client component
- diimport oleh `src/client/data/**` FE remote layer
- memuat behavior UI
- mengabaikan soft delete/status rules tanpa alasan eksplisit

---

## 4. Data Access Rules

1. Prisma hanya boleh diakses dari backend/server infrastructure, terutama `src/core/db/**`, `src/core/server/**`, atau `src/server/**` repository.
2. `src/core/db/prisma-client.ts` adalah satu-satunya tempat membuat `PrismaClient`.
3. Jangan membuat Prisma client baru di repository, route handler, test helper, atau script aplikasi tanpa alasan kuat.
4. Semua operasi untuk tabel berikut harus melewati repository/helper yang jelas:
   - `tblProject`
   - `tblEnvironment`
   - `tblCollection`
   - `tblApi`
   - `tblApiEnvironment`
   - `tblRequestScenario`
   - `tblResponseScenario`
   - `tblAccount`
   - `tblChangeLog`
5. Mutasi dari UI harus menjaga alur:

```text
View/Hook -> FE UseCase -> FE Repository -> FE Data/API Client -> /api/...
  -> Route Adapter/Controller -> BE Service -> BE Repository -> Prisma/Core Server
```

6. FE dan BE tidak boleh memakai repository/data implementation yang sama:
   - FE repository adalah remote repository yang hanya bicara HTTP/API client.
   - BE repository adalah persistence adapter yang hanya dipakai BE service/module.
7. Jika menambah resource baru, tambahkan minimal:
   - FE domain entity/repository interface/use case bila dibutuhkan UI
   - FE remote repository/data source bila dibutuhkan UI
   - BE server module schema/service/repository/mapper/policy
   - route handler/API adapter
   - tests sesuai risiko

---

## 5. API Design Rules

1. Internal management API tetap berada di `src/app/api/**` sesuai pola project saat ini.
2. Jangan memindahkan semua endpoint ke `/api/v1` secara paksa; lakukan hanya jika ada keputusan versioning menyeluruh.
3. Endpoint internal resource-oriented lebih disukai daripada action string yang makin membesar.
   - Untuk legacy gateway `POST /api/database`, action baru boleh ditambah hanya jika scope kecil dan konsisten.
   - Untuk flow besar, buat route resource khusus.
4. Semua request body, params, dan query wajib divalidasi di server. Gunakan `zod` untuk contract baru.
5. Response JSON internal yang mengikuti pola project harus konsisten:

```ts
{ success: true, data?: T }
{ success: false, error: string, code?: string }
```

6. Jangan expose field sensitif:
   - password/hash
   - OAuth token
   - session token
   - raw database URL
   - stack trace
   - raw Prisma error
7. Gunakan status code yang tepat:
   - `400` invalid request
   - `401` unauthenticated
   - `403` unauthorized
   - `404` not found
   - `409` conflict
   - `422` validation error
   - `429` throttled/rate limited
   - `500` internal server error

---

## 6. Dynamic Mock Proxy Rules

1. `src/app/api/[...path]/route.ts` dan `src/app/api/route.ts` adalah entry point catch-all untuk mocked API traffic.
2. `src/app/api/internal-proxy.ts` adalah engine untuk:
   - path normalization
   - internal route exclusion
   - method/path matching
   - request scenario matching
   - weighted response scenario selection
   - delay simulation
   - cache/throttle integration
3. Jangan memasukkan internal management route ke dynamic mock matching. Update `INTERNAL_ROUTE_PREFIXES` setiap menambah route internal baru.
4. Matching behavior harus deterministic dan tested:
   - exact
   - partial
   - regex
   - JSON schema-like matching
   - path params
   - query params
   - headers
   - body type
5. Weighted response selection tidak boleh memilih inactive/deleted scenario.
6. Delay simulation harus dibatasi agar tidak membuka risiko DoS lokal.
7. Header response dari scenario harus disanitasi; jangan izinkan header berbahaya yang bisa merusak runtime atau security.
8. Cache/throttle state di `internal-proxy-cache.ts` harus di-clear setelah mutasi database yang mengubah project/API/scenario/environment.

---

## 7. Auth & Authorization

1. Password account wajib disimpan sebagai hash.
   - Gunakan helper `src/core/utils/password-hash.ts` atau pengganti yang lebih kuat.
   - Password plaintext di database dilarang.
2. Session auth harus disimpan di cookie yang aman.
   - Gunakan `httpOnly`, `sameSite`, dan `secure` saat production.
   - Jangan menyimpan token sensitif di `localStorage`.
3. Admin-only action wajib cek role di server.
   - Contoh: reset database harus memakai `canResetDatabase`.
4. Jangan percaya `role`, `operator`, `userId`, atau permission dari payload client tanpa verifikasi server.
5. SSO Google Workspace harus memvalidasi:
   - OAuth state/callback
   - allowed domains (`SSO_DOMAINS`)
   - session payload yang disimpan
6. Demo credential dari `.env` boleh untuk lokal, tetapi jangan hardcode credential di code path production.

---

## 8. Validation Rules

1. Validation client hanya untuk UX; validation server adalah sumber kebenaran.
2. Semua input mutasi wajib divalidasi:
   - project name/status
   - environment type/base URL
   - API path dan method
   - collection relation
   - request scenario match type/body type/priority
   - response scenario status code/headers/body/delay/weight
   - import database JSON
   - import OpenAPI JSON
   - upload metadata
3. Normalize string sebelum disimpan bila relevan:
   - trim name/path/header key
   - pastikan path dimulai `/`
   - konsisten enum uppercase untuk method/type
4. Jangan percaya nilai sensitif dari FE:
   - role
   - account id/operator
   - status lifecycle tertentu
   - createdAt/updatedAt
5. Import database/OpenAPI wajib menolak shape yang korup, bukan menyimpan sebagian secara diam-diam tanpa laporan.

---

## 9. Error Handling & Logging

1. Jangan swallow error tanpa logging atau alasan eksplisit.
2. Response ke client harus aman dan ringkas.
3. Logging internal boleh detail, tetapi jangan mencetak secret, password, token, atau full database URL.
4. Gunakan error message yang actionable:
   - "Project not found"
   - "Invalid API method"
   - "Forbidden: reset requires Admin or Manager role"
5. Database/import/export/proxy failure tidak boleh dikonversi menjadi success.
6. Untuk route handler, bungkus unknown error menjadi response konsisten dengan status `500`.

---

## 10. Model, DTO, dan Mapping

1. Pisahkan dengan jelas:
   - FE domain entity (`src/client/domain/**/entity`)
   - FE repository interface (`src/client/domain/**/repository`)
   - Prisma model (`prisma/schema.prisma`)
   - FE data model/mapper (`src/client/data/**/model`)
   - BE server module mapper (`src/server/<module>/<module>.mapper.ts`)
   - HTTP request/response DTO
2. Jangan jadikan Prisma model sebagai API contract publik.
3. Mapping harus eksplisit, terutama untuk:
   - `createdAt`/`updatedAt` Date <-> ISO string
   - nullable DB field <-> optional domain field
   - Prisma `Json` <-> typed JSON object
   - `methodRequest`, `matchType`, `bodyType`, `responseType`
4. Contract client memakai `camelCase`.
5. Nama tabel database boleh mengikuti mapping Prisma (`@@map`, `@map`), tetapi jangan bocorkan nama tabel ke UI copy/API response kecuali untuk admin/debug yang memang perlu.

---

## 11. Import, Export, Reset, dan Snapshot

1. Database import/export harus menjaga schema aggregate `MockApiDatabase`.
2. Import mode harus eksplisit:
   - `replace`
   - `merge`
   - `upsert`
3. Reset/wipe database adalah destructive admin action.
   - Wajib role check server-side.
   - Wajib audit log.
4. Setelah import/reset/mutasi besar, clear internal proxy cache.
5. OpenAPI import/export harus menjaga relasi:
   - Project
   - Collection
   - API
   - Request Scenario
   - Response Scenario
6. Jangan menghasilkan OpenAPI yang memuat secret, cookie auth, atau data admin internal.

---

## 12. Audit Log Rules

1. Mutasi penting wajib membuat change log:
   - create/update/delete/restore project
   - create/update/delete environment
   - create/update/delete collection
   - create/update/delete API
   - create/update/delete request/response scenario
   - import/export/reset database bila relevan
   - admin account changes
2. Change log harus memuat entity type, entity id, project id bila ada, operator, before/after state bila aman, dan metadata seperlunya.
3. Jangan log password, token, OAuth secret, atau raw uploaded file content.
4. Operator dari client harus diverifikasi atau diturunkan dari session server bila flow auth tersedia.

---

## 13. Next.js Rules

1. API route yang memakai Prisma/Node API wajib `export const runtime = 'nodejs'`.
2. Client component/hook tidak boleh import server-only module.
3. Server component tidak boleh bypass boundary persistent data.
   - Untuk halaman FE existing, prefer render page shell lalu ViewModel/FE repository memanggil API internal.
   - Jika perlu initial data server-side, gunakan service/module BE lewat adapter yang jelas dan jangan import FE remote repository.
4. Middleware/proxy auth tidak boleh melakukan query DB berat.
5. Dynamic import server module di route handler boleh dipakai untuk menjaga bundling, seperti pola `internal-proxy`.
6. Jangan letakkan business flow besar di `page.tsx`.

---

## 14. Testing Minimum

Gunakan Vitest sesuai script project:

```bash
pnpm test
pnpm lint
```

Coverage minimum untuk perubahan backend:
1. service/use case test untuk aturan backend orchestration
2. module repository test untuk mapping dan persistence behavior
3. route/controller handler test untuk happy path dan failure path
4. proxy engine test untuk matching/cache/throttle bila menyentuh `internal-proxy`
5. auth/admin test untuk role, cookie/session, dan forbidden path
6. import/export test untuk shape valid, invalid, dan edge case relasi

Jika tidak bisa menjalankan seluruh test, jalankan test terdekat dan sebutkan gap-nya.

---

## 15. Modular BE Module Rules

1. Backend feature baru atau refactor besar harus memakai module ownership di `src/server/<module>/**`.
2. Struktur module yang disarankan:

```text
src/server/<module>/
  index.ts
  <module>.controller.ts
  <module>.service.ts
  <module>.repository.ts
  <module>.schema.ts
  <module>.mapper.ts
  <module>.policy.ts
  <module>.audit.ts
  <module>.errors.ts
  __tests__/
```

3. `index.ts` module hanya boleh export public service/controller/type/schema yang dibutuhkan route atau module lain.
4. Module lain tidak boleh import file internal secara langsung seperti `<module>.repository.ts` kecuali memang berada dalam module yang sama.
5. BE service bertanggung jawab atas:
   - business rule final
   - authorization/policy check
   - orchestration transaction
   - audit metadata
   - cache invalidation
   - mapping output aman
6. BE repository bertanggung jawab hanya untuk persistence/query.
   - Repository tidak boleh tahu UI/view model.
   - Repository tidak boleh return raw Prisma record ke route.
7. Controller/route adapter bertanggung jawab hanya untuk:
   - parse params/query/body
   - ambil session/request context
   - validasi schema
   - panggil service
   - return response helper

---

## 16. FE/BE Separation Rules

1. FE flow wajib tetap terpisah:

```text
View -> ViewModel/Hook -> UseCase -> Repository Interface -> Remote Repository -> Data/API Client -> /api
```

2. BE flow wajib tetap terpisah:

```text
/api Route Adapter -> Module Controller/Handler -> Module Service -> Module Repository -> Prisma/Core Server
```

3. `src/client/data/**` adalah FE/client infrastructure selama migrasi.
   - Jangan menambahkan DB query baru di `src/client/data/**`.
   - Jangan import `src/client/data/**` dari `src/server/**`.
4. `src/server/**` adalah BE/server application.
   - Jangan import `src/server/**` dari `src/client/presentation/**`, `src/client/domain/**`, `src/client/data/**`, atau `src/core/di/**`.
5. Core helper boleh dipakai bersama hanya jika runtime-safe.
   - Pure helper/type/constant boleh shared.
   - Prisma, filesystem, cookies, env secret, password hash, rate limit, dan storage path harus server-only.
6. Existing feature flow tidak boleh rusak saat migrasi.
   - API response shape harus backward compatible.
   - Remote repository FE boleh tetap memanggil legacy endpoint sampai route/module baru siap.

---

## 17. Performance Rules

1. Dynamic mock proxy tidak boleh membaca full database aggregate pada setiap request cache miss jika data sudah besar.
   - Gunakan proxy config cache terpisah dari response cache.
   - Proxy config cache harus di-clear setelah mutasi project/API/environment/scenario.
   - Index data proxy minimal berdasarkan `projectId`, `methodRequest`, `apiId`, dan `requestScenarioId`.
2. Hindari nested scan berulang di hot path.
   - Jangan melakukan `.find()` di dalam loop besar untuk data yang bisa dibuat `Map`.
   - Gunakan `Map<string, T>` atau grouped collection untuk matching API/scenario/response.
3. Endpoint list harus memakai pagination, filter, dan select field.
   - Jangan return full aggregate database untuk UI list biasa.
   - Gunakan `take`, `skip`/cursor, `where`, dan `select` Prisma sesuai kebutuhan view.
4. Response cache hanya boleh dipakai untuk response deterministic.
   - Jangan cache response dengan weighted random, dynamic timestamp, auth-sensitive data, atau file besar tanpa aturan eksplisit.
   - Header cache wajib menunjukkan `x-cache: HIT/MISS/BYPASS`.
5. File response harus streaming untuk file besar.
   - Hindari `fs.readFileSync` untuk file besar di route hot path.
   - Validasi path file tetap berada di direktori upload yang diizinkan.
6. Setiap operasi import/export/reset besar harus memakai transaction, chunking, dan timeout eksplisit.
   - Import besar tidak boleh melakukan insert satu per satu jika `createMany` memungkinkan.

---

## 18. Security Hardening Rules

1. Semua route mutasi wajib punya authorization server-side.
   - Role/permission harus diambil dari session server, bukan dari payload client.
   - Endpoint admin wajib menolak request tanpa session valid.
2. Semua request body mutasi wajib divalidasi dengan schema server.
   - Gunakan `zod` untuk contract baru.
   - Reject unknown dangerous fields seperti `role`, `createdAt`, `updatedAt`, `deletedAt`, dan `operator`, kecuali memang endpoint admin resmi.
3. Sanitasi response headers dari mock scenario.
   - Block header berbahaya seperti `set-cookie`, `content-length`, `transfer-encoding`, `connection`, `server`, dan header lain yang bisa merusak runtime/security.
   - Normalize header key sebelum dipakai.
4. Batasi regex matching.
   - Regex dari user harus divalidasi panjangnya.
   - Hindari pattern yang berisiko ReDoS.
   - Jika regex invalid, fail closed dengan error aman.
5. File upload dan file response wajib path-safe.
   - Jangan izinkan `..`, absolute path arbitrary, symlink escape, atau akses file di luar upload directory.
   - Batasi ukuran file, tipe file, dan extension.
6. Error response tidak boleh membocorkan internal detail.
   - Jangan return raw Prisma error, stack trace, database URL, filesystem path penuh, token, password, atau cookie.
   - Log detail internal hanya di server, dengan secret redaction.
7. Rate limit wajib diterapkan pada auth, upload, import, dan dynamic proxy.
   - Auth failure perlu throttle lebih ketat.
   - Upload/import perlu body size limit.

---

## 19. Maintainability Rules

1. `/api/database` action gateway tidak boleh terus bertambah untuk flow besar.
   - Action kecil legacy boleh tetap ada.
   - Resource baru harus memakai route khusus seperti `/api/projects`, `/api/apis`, atau `/api/scenarios`.
2. Route handler harus tipis.
   - Route hanya parsing request, validasi, auth check, panggil controller/service/helper, dan mapping response.
   - Business logic kompleks wajib dipindahkan ke module service/helper yang bisa dites.
3. Hindari `any` untuk payload backend baru.
   - Definisikan DTO/schema request dan response.
   - Gunakan mapper eksplisit dari DTO ke domain/input persistence.
4. Shared backend response helper harus dipakai untuk route baru.
   - Sediakan helper untuk `{ success: true, data }` dan `{ success: false, error, code }`.
   - Status code harus konsisten.
5. Setiap resource baru minimal punya:
   - schema validation
   - route handler
   - use case/helper
   - repository/datasource bila menyentuh DB
   - mapper
   - test happy path dan failure path
6. Jangan duplikasi auth/session parsing di banyak route.
   - Gunakan helper server-only seperti `getServerSession()` dan `requireRole()`.

---

## 20. Observability Rules

1. Endpoint backend penting harus punya structured log minimal:
   - route/action
   - status code
   - `durationMs`
   - actor/user id jika aman
   - entity id jika relevan
   - error code, bukan raw secret/error dump
2. Tambahkan timing untuk hot path proxy.
   - Ukur waktu parse body, load config/database, match API, match scenario, dan pilih response.
   - Gunakan log debug hanya saat development atau flag observability aktif.
3. Audit log bukan pengganti application log.
   - Audit log untuk perubahan bisnis.
   - Application log untuk debugging operasional.

---

## 21. DOs

- Ikuti alur FE: `View/Hook -> UseCase -> Repository -> Data/API Client -> /api`.
- Ikuti alur BE: `/api -> Controller/Adapter -> Service -> Repository -> Prisma/Core Server`.
- Pisahkan FE remote repository dan BE persistence repository.
- Tambahkan validasi server untuk contract baru.
- Gunakan mapper eksplisit antar layer.
- Clear proxy cache setelah mutasi yang mempengaruhi mock response.
- Cache dan index proxy config untuk hot path dynamic mock proxy.
- Gunakan Prisma dari module server-only saja.
- Simpan password dalam bentuk hash.
- Verifikasi role untuk endpoint admin.
- Sanitasi response, response headers, dan error.
- Tambahkan audit log untuk mutasi penting.
- Tambahkan structured log/timing untuk endpoint penting.
- Tulis test dekat dengan perubahan.
- Jaga route handler tetap tipis bila flow mulai kompleks.

---

## 22. DON'Ts

- Jangan import Prisma dari `src/client/presentation/**`.
- Jangan import `src/core/db/**` dari client hook/component.
- Jangan import `src/server/**` dari FE layer.
- Jangan import FE `src/client/data/**` repository dari BE server module.
- Jangan memakai repository implementation yang sama untuk FE remote flow dan BE persistence flow.
- Jangan hardcode credential atau bypass auth.
- Jangan return raw error Prisma/stack trace.
- Jangan membuat success palsu ketika DB/import/proxy gagal.
- Jangan menambah action besar ke `/api/database` jika lebih cocok jadi route resource khusus.
- Jangan membaca full database aggregate untuk hot path jika cache/index/query spesifik bisa dipakai.
- Jangan mencampur internal management route dengan mocked API route.
- Jangan menyimpan password/token di change log.
- Jangan percaya payload client untuk role/operator/status sensitif.
- Jangan memakai `any` untuk contract backend baru tanpa batasan dan validasi.
- Jangan melayani file di luar direktori upload/storage yang diizinkan.

---

## 23. Red Flags Yang Wajib Direfactor

Jika ditemukan kondisi berikut, anggap sebagai pelanggaran:

- presentation hook mengimport Prisma/core DB/server route
- FE layer mengimport `src/server/**`
- BE server module mengimport FE `src/client/data/**` remote repository
- repository implementation dipakai bersama oleh FE dan BE
- route handler berisi switch/action besar yang terus bertambah tanpa validasi schema
- raw Prisma record dikembalikan ke client
- password plaintext comparison
- session cookie tidak aman di production
- reset/import database tanpa role check dan audit log
- `INTERNAL_ROUTE_PREFIXES` tidak mencakup route internal baru
- response scenario inactive/deleted masih bisa dipilih proxy
- import database menyimpan data korup sebagian tanpa error jelas
- mutasi scenario/environment/API tidak clear cache proxy
- dynamic proxy melakukan full database load berulang pada traffic tinggi tanpa proxy config cache
- response headers dari scenario diteruskan tanpa sanitasi
- file response memakai path arbitrary atau synchronous full read untuk file besar
- regex user dipakai tanpa batasan panjang/kompleksitas

---

## 24. Definition of Done Backend

Sebuah perubahan backend dianggap selesai jika:

1. boundary layer tidak bocor
2. FE remote flow dan BE persistence flow terpisah
3. input divalidasi di server
4. business logic final berada di BE service/helper yang bisa dites
5. Prisma hanya hidup di server infrastructure/repository BE
6. response dan error aman
7. auth/authorization diterapkan bila endpoint sensitif
8. change log dibuat untuk mutasi penting
9. proxy cache diperbarui/di-clear bila data mock berubah
10. request/response contract jelas
11. test relevan ditambahkan atau dijalankan
12. hot path tidak melakukan query/scan besar yang tidak perlu
13. file/header/regex handling aman untuk input user

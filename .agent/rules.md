# Architecture Rules & Guidelines

Dokumen panduan aturan pengkodean untuk proyek **Mock API Studio** dengan pemisahan flow **FE** dan **BE** yang eksplisit.

Tujuan utama:
- FE tetap memakai Clean Architecture + MVVM untuk orchestration UI/client.
- BE memakai module-oriented architecture ala NestJS: route/controller -> service -> repository.
- FE data layer dan BE repository layer tidak memakai implementasi yang sama.
- `core` tetap boleh dipakai bersama hanya untuk helper yang aman dan murni.

---

## 1. Prinsip Utama

1. **Pisahkan flow FE dan BE**
   - FE bertanggung jawab pada UX orchestration, state, view model, remote repository, dan HTTP client.
   - BE bertanggung jawab pada validasi final, authorization, business rule source of truth, persistence, audit log, cache invalidation, dan observability.

2. **FE tidak boleh import BE module**
   - `src/presentation/**`, `src/domain/**`, `src/data/**`, dan `src/di/**` pada flow FE tidak boleh mengimpor `src/modules/**`, route handler, Prisma, filesystem, cookies, atau server-only core.

3. **BE tidak boleh import FE layer**
   - `src/app/api/**` dan `src/modules/**` tidak boleh mengimpor `src/presentation/**`, FE hook/view model, atau FE remote repository.

4. **Core dibagi menurut runtime**
   - `src/core/shared/**`: pure helper/type/constant yang aman untuk browser dan server.
   - `src/core/client/**`: HTTP client dan helper browser-safe.
   - `src/core/server/**`: Prisma, cookies/session, filesystem, server crypto, storage, logger, safe-path.
   - Struktur existing `src/core/**` boleh tetap dipakai selama migrasi, tetapi file server-only wajib diperlakukan sebagai server-only.

---

## 2. Canonical Flow

### A. FE Flow

```text
View -> ViewModel/Hook -> UseCase -> Repository Interface -> Remote Repository -> Data/API Client -> /api
```

Aturan:
- View hanya render UI dan meneruskan event.
- ViewModel/hook mengelola UI state, form state, loading/error, routing, dan memanggil use case.
- FE use case mengorkestrasi flow client/UX, bukan security source of truth.
- FE repository implementation hanya boleh bicara ke API client/HTTP.
- FE data/API client tidak boleh bicara langsung ke Prisma, DB helper, filesystem, atau BE module.

### B. BE Flow

```text
/api Route Adapter -> Module Controller/Handler -> Module Service -> Module Repository -> Prisma/Core Server
```

Aturan:
- Route adapter hanya parsing request, mengambil session, validasi schema, memanggil service, dan mapping response.
- Module service adalah source of truth untuk business rule, authorization, audit metadata, cache invalidation, dan transaction orchestration.
- Module repository hanya persistence adapter dan tidak boleh diimport FE.
- Prisma hanya hidup di server infrastructure/repository.

---

## 3. Struktur Target

```text
src/
  app/
    api/                         # Next.js HTTP adapters
      projects/route.ts
      apis/route.ts
      request-scenarios/route.ts
      response-scenarios/route.ts
      upload/route.ts
      [...path]/route.ts

  presentation/                  # FE MVVM
    views/<feature>/
      <Feature>View.tsx
      hook/use<Feature>.ts
      components/
      constant/

  domain/                        # FE/client application contracts
    <feature>/
      entity/
      usecase/
      repository/                # interfaces only

  data/                          # FE/client infrastructure
    <feature>/
      model/
      repository/                # remote repository implementation
      data_source/               # remote API datasource/client wrapper

  modules/                       # BE modules, NestJS-like ownership
    <feature>/
      index.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.repository.ts
      <feature>.schema.ts
      <feature>.mapper.ts
      <feature>.policy.ts
      <feature>.audit.ts
      <feature>.errors.ts
      __tests__/

  core/
    shared/
    client/
    server/
    utils/                       # existing transitional shared utilities
    db/                          # existing server-only DB utilities during migration
    http-client/                 # existing client HTTP utilities during migration

  di/
    usecase_provider.ts          # FE dependency wiring
```

Catatan migrasi:
- Existing `src/domain/**`, `src/data/**`, dan `src/di/**` tetap menjadi flow FE.
- Existing route di `src/app/api/**` tetap hidup sebagai adapter.
- BE module baru ditambahkan incremental di `src/modules/**`.
- Jangan memindahkan semua resource sekaligus jika bisa dilakukan feature-by-feature.

---

## 4. Layer Rules

### A. `src/presentation/**`

**Boleh**
- Import FE use case dari `src/di/usecase_provider.ts`.
- Import domain entity/type yang browser-safe.
- Import shared UI component.

**Dilarang**
- Import `src/modules/**`.
- Import route handler.
- Import Prisma, `src/core/db/**`, filesystem, cookies, atau Node-only API.
- Memanggil `fetch` langsung dari View; pakai hook/usecase/repository.

### B. `src/domain/**`

**Boleh**
- Entity, repository interface, use case client/application flow.
- Pure TypeScript business-ish client orchestration.

**Dilarang**
- Import React, Next.js, Prisma, BE module, HTTP client, filesystem, cookies.
- Menjadi satu-satunya tempat security/authorization.

### C. `src/data/**`

**Boleh**
- Remote repository yang mengimplementasikan interface domain.
- DTO/model FE untuk API response/request.
- Remote datasource yang memanggil `src/core/http-client/**` atau `src/core/client/**`.

**Dilarang**
- Import Prisma/DB helper/server-only core.
- Import `src/modules/**`.
- Menjadi BE persistence layer.

### D. `src/app/api/**`

**Boleh**
- Menjadi HTTP adapter untuk BE.
- Import BE module public API dari `src/modules/<feature>/index.ts`.
- Pakai server-only helper untuk session/response.

**Dilarang**
- Import FE hook/view/component.
- Berisi business logic panjang.
- Import repository internal module lain secara langsung.

### E. `src/modules/**`

**Boleh**
- Service, repository, schema, mapper, policy, audit, error per feature.
- Import `src/core/server/**` atau transitional server-only `src/core/db/**`.
- Import module lain hanya lewat public `index.ts` atau interface kecil.

**Dilarang**
- Import `src/presentation/**`, FE remote repository, atau FE hook.
- Mengekspor Prisma query helper internal.
- Membuat circular dependency antar module.

---

## 5. Import Dependency Matrix

| Area | Boleh Mengimpor Dari | Dilarang Mengimpor Dari |
| :--- | :--- | :--- |
| `presentation/` | `domain/`, `di/`, shared UI, browser-safe core | `modules/`, `app/api/`, Prisma, `core/db`, `core/server` |
| `domain/` | pure type/helper shared | `presentation/`, `data/`, `modules/`, `next`, `react`, HTTP client |
| `data/` FE | `domain/`, `core/http-client`, `core/client`, shared core | `modules/`, `app/api/`, Prisma, `core/db`, `core/server` |
| `app/api/` | `modules/`, `core/server`, shared core | `presentation/`, FE hooks, FE repositories |
| `modules/` BE | `core/server`, shared core, public module APIs | `presentation/`, FE `data/`, route handlers internal |
| `core/shared` | pure dependencies only | app/domain-specific business flow |
| `core/server` | Node/Prisma/server libs | presentation/hooks |

---

## 6. DOs

1. Ikuti FE flow: `View -> Hook/ViewModel -> UseCase -> Repository -> Remote Data/API Client -> /api`.
2. Ikuti BE flow: `/api -> Controller/Adapter -> Service -> Repository -> Prisma/Core Server`.
3. Gunakan module BE untuk feature baru atau refactor feature besar.
4. Jaga response API backward compatible saat migrasi dari legacy route.
5. Letakkan helper runtime-neutral di shared core, dan helper Node/secret di server core.
6. Tambahkan schema, mapper, policy, dan test saat membuat module BE baru.

---

## 7. DON'Ts

1. Jangan pakai repository/data implementation yang sama untuk FE remote flow dan BE persistence flow.
2. Jangan import `src/modules/**` dari FE.
3. Jangan import `src/data/**` FE remote repository dari BE service.
4. Jangan memanggil Prisma/DB langsung dari presentation, hook, FE usecase, atau FE data layer.
5. Jangan menambah flow besar baru ke `/api/database`; buat route/module resource.
6. Jangan menaruh business rule final hanya di FE.

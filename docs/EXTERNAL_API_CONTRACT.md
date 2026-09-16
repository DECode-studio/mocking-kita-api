# Mock API Studio - External Integration API & Contract Specification

Dokumen ini berisi rancangan dan spesifikasi kontrak API external yang dapat digunakan oleh platform lain untuk mengelola **APIs**, **Request Scenarios**, dan **Response Scenarios** di Mock API Studio secara terprogram.

---

## 📌 Overview Endpoint

Base URL: `/api/v1/external`

| No | Modul | HTTP Method | Endpoint | Deskripsi |
|---|---|---|---|---|
| 1 | **Auth** | `POST` | `/auth/signin` | Sign-in external platform dengan email/username & password $\rightarrow$ Hasilkan JWT Bearer Token |
| 2 | **API** | `PUT` | `/apis/upsert` | Upsert API berdasarkan `projectId` + `path` + `methodRequest` |
| 3 | **API** | `GET` | `/apis` | Mendapatkan daftar API (dengan filter `projectId`, `collectionId`, `search`, pagination) |
| 4 | **Request Scenario** | `PUT` | `/request-scenarios/upsert` | Upsert Request Scenario berdasarkan `id` |
| 5 | **Request Scenario** | `GET` | `/request-scenarios` | Mendapatkan daftar Request Scenario berdasarkan endpoint (`projectId`, `path`, `methodRequest`) atau `apiId` |
| 6 | **Response Scenario** | `PUT` | `/response-scenarios/upsert` | Upsert Response Scenario berdasarkan `id` |
| 7 | **Response Scenario** | `GET` | `/response-scenarios` | Mendapatkan daftar Response Scenario berdasarkan endpoint (`projectId`, `path`, `methodRequest`) atau `requestScenarioId` |
| 8 | **OpenAPI / Swagger** | `POST` | `/openapi/upsert` | Upsert massal API & Scenario dari spesifikasi Swagger / OpenAPI JSON/YAML |

---

## 🔐 Autentikasi

Setiap request dari platform eksternal wajib menyertakan kunci autentikasi melalui salah satu header berikut:

```http
x-api-key: your-external-api-key
```
atau
```http
Authorization: Bearer your-external-api-token
```

---

## 📄 Format Respon Standard

### 1. Respon Sukses (Envelope)
```json
{
  "success": true,
  "message": "API upserted successfully",
  "action": "CREATED", // "CREATED" atau "UPDATED" (khusus upsert)
  "data": { ... }
}
```

### 2. Respon Error (Envelope)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Field 'projectId' and 'path' are required"
  }
}
```

---

## 🚀 Detil Spesifikasi API Kontrak

### 1. Sign-In / External Authentication
Melakukan autentikasi menggunakan email/username dan password untuk menghasilkan **JWT Access Token**. Token ini digunakan pada header `Authorization: Bearer <TOKEN>` untuk semua endpoint eksternal lainnya.

- **Method**: `POST`
- **Path**: `/api/v1/external/auth/signin`

#### Request Body
```json
{
  "email": "admin@example.com",
  "password": "P@ssw0rd123!"
}
```

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "usr-uuid-001",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

---

### 2. Upsert API by Endpoint
Menambah API baru atau memperbarui API yang sudah ada berdasarkan kombinasi kunci unik `projectId` + `path` + `methodRequest`.

- **Method**: `PUT`
- **Path**: `/api/v1/external/apis/upsert`
- **Logika Upsert**:
  - Jika kombinasi `(projectId, path, methodRequest)` **SUDAH ADA** di database $\rightarrow$ Lakukan `UPDATE` data `name`, `description`, `collectionId`, `status`.
  - Jika kombinasi **BELUM ADA** $\rightarrow$ Lakukan `CREATE` API baru.

#### Request Body
```json
{
  "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "collectionId": "b2c3d4e5-f6a7-8901-2345-6789abcdef01",
  "name": "Get User Profile",
  "description": "API untuk mengambil profil user",
  "path": "/v1/users/{id}",
  "methodRequest": "GET",
  "status": true
}
```

#### Sample Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "API upserted successfully",
  "action": "CREATED",
  "data": {
    "id": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
    "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    "collectionId": "b2c3d4e5-f6a7-8901-2345-6789abcdef01",
    "name": "Get User Profile",
    "description": "API untuk mengambil profil user",
    "path": "/v1/users/{id}",
    "methodRequest": "GET",
    "status": true,
    "createdAt": "2026-09-16T09:30:00.000Z",
    "updatedAt": "2026-09-16T09:30:00.000Z"
  }
}
```

---

### 2. Get List API
Mengambil daftar API dalam suatu project.

- **Method**: `GET`
- **Path**: `/api/v1/external/apis`
- **Query Parameters**:
  - `projectId` (required, string/UUID): ID Project.
  - `collectionId` (optional, string/UUID): ID Collection.
  - `search` (optional, string): Filter nama atau path API.
  - `page` (optional, integer, default `1`).
  - `limit` (optional, integer, default `20`).

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
      "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
      "collectionId": "b2c3d4e5-f6a7-8901-2345-6789abcdef01",
      "name": "Get User Profile",
      "description": "API untuk mengambil profil user",
      "path": "/v1/users/{id}",
      "methodRequest": "GET",
      "status": true,
      "createdAt": "2026-09-16T09:30:00.000Z",
      "updatedAt": "2026-09-16T09:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Upsert Request Scenario by ID
Menambah atau memperbarui Request Scenario berdasarkan ID Skenario (`id`).

- **Method**: `PUT`
- **Path**: `/api/v1/external/request-scenarios/upsert`
- **Logika Upsert**:
  - Jika `id` disertakan dan **DITEMUKAN** di DB $\rightarrow$ Lakukan `UPDATE` pada request scenario tersebut.
  - Jika `id` tidak disertakan / tidak ditemukan $\rightarrow$ Lakukan `CREATE` skenario baru yang terhubung ke `apiId`.

#### Request Body
```json
{
  "id": "req-scenario-uuid-001",
  "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
  "name": "Scenario - User Gold Tier",
  "description": "Request scenario untuk user gold tier",
  "headers": {
    "X-Tier": "GOLD",
    "Authorization": "Bearer *"
  },
  "queryParams": {
    "include": "loyalty"
  },
  "pathParams": {
    "id": "1001"
  },
  "body": {
    "action": "check_status"
  },
  "bodyType": "JSON",
  "matchType": "EXACT",
  "matchStrategy": "ALL",
  "strictBodyStructure": true,
  "priority": 10,
  "status": true
}
```

#### Sample Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Request scenario upserted successfully",
  "action": "UPDATED",
  "data": {
    "id": "req-scenario-uuid-001",
    "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
    "name": "Scenario - User Gold Tier",
    "description": "Request scenario untuk user gold tier",
    "headers": {
      "X-Tier": "GOLD",
      "Authorization": "Bearer *"
    },
    "queryParams": {
      "include": "loyalty"
    },
    "pathParams": {
      "id": "1001"
    },
    "body": {
      "action": "check_status"
    },
    "bodyType": "JSON",
    "matchType": "EXACT",
    "matchStrategy": "ALL",
    "strictBodyStructure": true,
    "priority": 10,
    "status": true,
    "createdAt": "2026-09-16T09:30:00.000Z",
    "updatedAt": "2026-09-16T09:35:00.000Z"
  }
}
```

---

### 4. Get List Request Scenario by Endpoint
Mendapatkan daftar Request Scenario berdasarkan identifier Endpoint (`projectId`, `path`, `methodRequest`) atau langsung melalui `apiId`.

- **Method**: `GET`
- **Path**: `/api/v1/external/request-scenarios`
- **Query Parameters**:
  - *Opsi A (by Endpoint)*: `projectId` (required), `path` (required), `methodRequest` (required).
  - *Opsi B (by API ID)*: `apiId` (required).

#### Contoh Request URL
`GET /api/v1/external/request-scenarios?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0&path=/v1/users/{id}&methodRequest=GET`

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "req-scenario-uuid-001",
      "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
      "name": "Scenario - User Gold Tier",
      "description": "Request scenario untuk user gold tier",
      "headers": { "X-Tier": "GOLD" },
      "queryParams": { "include": "loyalty" },
      "pathParams": { "id": "1001" },
      "body": null,
      "bodyType": "JSON",
      "matchType": "EXACT",
      "matchStrategy": "ALL",
      "strictBodyStructure": true,
      "priority": 10,
      "status": true,
      "createdAt": "2026-09-16T09:30:00.000Z",
      "updatedAt": "2026-09-16T09:35:00.000Z"
    }
  ]
}
```

---

### 5. Upsert Response Scenario by ID
Menambah atau memperbarui Response Scenario berdasarkan ID Response Scenario (`id`).

- **Method**: `PUT`
- **Path**: `/api/v1/external/response-scenarios/upsert`
- **Logika Upsert**:
  - Jika `id` disertakan dan **DITEMUKAN** di DB $\rightarrow$ Lakukan `UPDATE` data response scenario.
  - Jika `id` tidak disertakan / tidak ditemukan $\rightarrow$ Lakukan `CREATE` skenario respon baru under `requestScenarioId`.

#### Request Body
```json
{
  "id": "resp-scenario-uuid-001",
  "requestScenarioId": "req-scenario-uuid-001",
  "name": "Response 200 OK - User Gold Data",
  "description": "Pengembalian data lengkap user gold tier",
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "X-Mock-Engine": "MockStudio/1.0"
  },
  "body": {
    "code": "SUCCESS",
    "data": {
      "id": "1001",
      "tier": "GOLD",
      "balance": 500000
    }
  },
  "responseType": "JSON",
  "delayMs": 50,
  "weight": 100,
  "priority": 1,
  "status": true
}
```

#### Sample Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Response scenario upserted successfully",
  "action": "UPDATED",
  "data": {
    "id": "resp-scenario-uuid-001",
    "requestScenarioId": "req-scenario-uuid-001",
    "name": "Response 200 OK - User Gold Data",
    "description": "Pengembalian data lengkap user gold tier",
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "code": "SUCCESS",
      "data": {
        "id": "1001",
        "tier": "GOLD",
        "balance": 500000
      }
    },
    "responseType": "JSON",
    "filePath": null,
    "fileName": null,
    "delayMs": 50,
    "weight": 100,
    "priority": 1,
    "status": true,
    "createdAt": "2026-09-16T09:30:00.000Z",
    "updatedAt": "2026-09-16T09:35:00.000Z"
  }
}
```

---

### 6. Get List Response Scenario by Endpoint
Mendapatkan daftar Response Scenario berdasarkan Endpoint (`projectId`, `path`, `methodRequest`) atau langsung melalui `requestScenarioId`.

- **Method**: `GET`
- **Path**: `/api/v1/external/response-scenarios`
- **Query Parameters**:
  - *Opsi A (by Endpoint)*: `projectId` (required), `path` (required), `methodRequest` (required).
  - *Opsi B (by Request Scenario ID)*: `requestScenarioId` (required).

#### Contoh Request URL
`GET /api/v1/external/response-scenarios?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0&path=/v1/users/{id}&methodRequest=GET`

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "resp-scenario-uuid-001",
      "requestScenarioId": "req-scenario-uuid-001",
      "name": "Response 200 OK - User Gold Data",
      "description": "Pengembalian data lengkap user gold tier",
      "statusCode": 200,
      "headers": { "Content-Type": "application/json" },
      "body": {
        "code": "SUCCESS",
        "data": { "id": "1001", "tier": "GOLD" }
      },
      "responseType": "JSON",
      "delayMs": 50,
      "weight": 100,
      "priority": 1,
      "status": true,
      "createdAt": "2026-09-16T09:30:00.000Z",
      "updatedAt": "2026-09-16T09:35:00.000Z"
    }
  ]
}
```

---

### 7. Upsert Swagger / OpenAPI JSON
Meng-import atau melakukan **upsert massal** daftar API, Request Scenarios, dan Response Scenarios langsung dari dokumen spesifikasi Swagger / OpenAPI (JSON/YAML).

- **Method**: `POST`
- **Path**: `/api/v1/external/openapi/upsert`
- **Mode Options**: `upsert` (default), `merge`, `replace`.

#### Request Body
```json
{
  "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "mode": "upsert",
  "openApiJson": {
    "openapi": "3.0.0",
    "info": {
      "title": "Payment Service Mock",
      "version": "1.0.0"
    },
    "paths": {
      "/v1/payments/charge": {
        "post": {
          "summary": "Process Payment Charge",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "amount": { "type": "number", "example": 150000 },
                    "currency": { "type": "string", "example": "IDR" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Payment Successful",
              "content": {
                "application/json": {
                  "example": {
                    "transactionId": "TRX-998811",
                    "status": "SUCCESS"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "message": "OpenAPI specification imported/upserted successfully",
  "data": {
    "projectId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    "mode": "upsert",
    "importedApis": 1,
    "importedRequestScenarios": 1,
    "importedResponseScenarios": 1,
    "details": [
      {
        "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
        "path": "/v1/payments/charge",
        "methodRequest": "POST",
        "action": "CREATED"
      }
    ]
  }
}
```

---

## 📁 File Terkait
- Specification Open API (YAML): [`docs/external-api-contract.yaml`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/external-api-contract.yaml)
- Document Contract (Markdown): [`docs/EXTERNAL_API_CONTRACT.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/EXTERNAL_API_CONTRACT.md)
- Sign-In Auth Contract: [`docs/auth-signin.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/auth-signin.md)
- Upsert API Contract: [`docs/upsert-api.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/upsert-api.md)
- Get List APIs Contract: [`docs/get-list-apis.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/get-list-apis.md)
- Upsert Request Scenario Contract: [`docs/upsert-request-scenario.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/upsert-request-scenario.md)
- Get List Request Scenarios Contract: [`docs/get-list-request-scenarios.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/get-list-request-scenarios.md)
- Upsert Response Scenario Contract: [`docs/upsert-response-scenario.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/upsert-response-scenario.md)
- Get List Response Scenarios Contract: [`docs/get-list-response-scenarios.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/get-list-response-scenarios.md)
- Upsert OpenAPI / Swagger Contract: [`docs/upsert-openapi.md`](file:///Users/gadget/Development/experiment/mock-api-studio/docs/upsert-openapi.md)



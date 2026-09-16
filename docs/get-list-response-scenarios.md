# API Contract: Get List Response Scenario by Endpoint

Endpoint ini digunakan oleh platform eksternal untuk mengambil daftar Response Scenario berdasarkan identifier Endpoint (`projectId`, `path`, `methodRequest`) atau langsung melalui `requestScenarioId`.

---

## 📌 Endpoint Information

- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/external/response-scenarios`

---

## 🔐 Autentikasi

Header wajib:
```http
x-api-key: <YOUR_EXTERNAL_API_KEY>
```
atau
```http
Authorization: Bearer <YOUR_EXTERNAL_API_TOKEN>
```

---

## 📥 Query Parameters

Anda dapat menggunakan salah satu dari dua opsi pencarian berikut:

### Opsi A: Berdasarkan Endpoint (`projectId` + `path` + `methodRequest`)

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `projectId` | `string (UUID)` | **Ya** | ID Project | `"a1b2c3d4-e5f6-7890-1234-56789abcdef0"` |
| `path` | `string` | **Ya** | Endpoint path URI | `"/v1/users/{id}"` |
| `methodRequest` | `string` | **Ya** | HTTP Method (`GET`, `POST`, `PUT`, `DELETE`, dst) | `"GET"` |

### Opsi B: Berdasarkan Request Scenario ID Langsung

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `requestScenarioId` | `string (UUID)` | **Ya** | ID Request Scenario | `"req-scenario-uuid-001"` |

### Sample Request URL

```http
GET /api/v1/external/response-scenarios?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0&path=/v1/users/{id}&methodRequest=GET
```

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK`)

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
  ]
}
```

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Must provide either 'requestScenarioId' OR ('projectId', 'path', and 'methodRequest')"
  }
}
```

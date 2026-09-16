# API Contract: Get List Request Scenario by Endpoint

Endpoint ini digunakan oleh platform eksternal untuk mengambil daftar Request Scenario berdasarkan identifier Endpoint (`projectId`, `path`, `methodRequest`) atau langsung melalui `apiId`.

---

## 📌 Endpoint Information

- **HTTP Method**: `GET`
- **URL Path**: `/api/v1/external/request-scenarios`

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

### Opsi B: Berdasarkan API ID Langsung

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `apiId` | `string (UUID)` | **Ya** | ID API | `"c3d4e5f6-a7b8-9012-3456-789abcdef012"` |

### Sample Request URL

```http
GET /api/v1/external/request-scenarios?projectId=a1b2c3d4-e5f6-7890-1234-56789abcdef0&path=/v1/users/{id}&methodRequest=GET
```

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK`)

```json
{
  "success": true,
  "data": [
    {
      "id": "req-scenario-uuid-001",
      "apiId": "c3d4e5f6-a7b8-9012-3456-789abcdef012",
      "name": "Scenario - User Gold Tier",
      "description": "Request scenario untuk user gold tier",
      "headers": {
        "X-Tier": "GOLD"
      },
      "queryParams": {
        "include": "loyalty"
      },
      "pathParams": {
        "id": "1001"
      },
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

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Must provide either 'apiId' OR ('projectId', 'path', and 'methodRequest')"
  }
}
```

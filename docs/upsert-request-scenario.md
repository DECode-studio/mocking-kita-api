# API Contract: Upsert Request Scenario by ID

Endpoint ini digunakan oleh platform eksternal untuk menambah atau memperbarui Request Scenario berdasarkan ID skenario (`id`).

---

## 📌 Endpoint Information

- **HTTP Method**: `PUT`
- **URL Path**: `/api/v1/external/request-scenarios/upsert`
- **Content-Type**: `application/json`

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

## 🔄 Logika Upsert

1. Sistem memeriksa apakah `id` dikirimkan dalam request body.
2. **Jika `id` Disertakan & Ditemukan di DB**: Lakukan `UPDATE` pada data request scenario tersebut.
3. **Jika `id` Tidak Disertakan / Tidak Ditemukan**: Lakukan `CREATE` request scenario baru yang dikaitkan ke `apiId`.

---

## 📥 Request Schema

### Body Parameters

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | `string (UUID)` | Tidak | ID Request Scenario (Disertakan untuk update skenario spesifik) | `"req-scenario-uuid-001"` |
| `apiId` | `string (UUID)` | **Ya** | ID API induk | `"c3d4e5f6-a7b8-9012-3456-789abcdef012"` |
| `name` | `string` | **Ya** | Nama Request Scenario | `"Scenario - User Gold Tier"` |
| `description` | `string` | Tidak | Deskripsi skenario request | `"Request scenario untuk user gold tier"` |
| `headers` | `object (JSON)` | Tidak | JSON pencocokan HTTP Headers | `{"X-Tier": "GOLD"}` |
| `queryParams` | `object (JSON)` | Tidak | JSON pencocokan Query Parameters | `{"include": "loyalty"}` |
| `pathParams` | `object (JSON)` | Tidak | JSON pencocokan Path Parameters | `{"id": "1001"}` |
| `body` | `object (JSON)` | Tidak | JSON pencocokan Body Payload | `{"action": "check_status"}` |
| `bodyType` | `string` | Tidak | Tipe body (`JSON`, `FORM_DATA`, `RAW`, default: `JSON`) | `"JSON"` |
| `matchType` | `string` | Tidak | Tipe matching (`EXACT`, `REGEX`, `CONTAINS`, default: `EXACT`) | `"EXACT"` |
| `matchStrategy` | `string` | Tidak | Strategi matching (`ALL`, `ANY`, default: `ALL`) | `"ALL"` |
| `bodyRules` | `object (JSON)` | Tidak | Aturan pencocokan khusus body | `null` |
| `strictBodyStructure` | `boolean` | Tidak | Validasi struktur body ketat (default: `true`) | `true` |
| `priority` | `integer` | Tidak | Prioritas eksekusi skenario (default: `0`) | `10` |
| `status` | `boolean` | Tidak | Status aktif skenario (default: `true`) | `true` |

### Sample Request Body
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

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK` / `201 Created`)

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

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Field 'apiId' and 'name' are required"
  }
}
```

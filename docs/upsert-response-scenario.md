# API Contract: Upsert Response Scenario by ID

Endpoint ini digunakan oleh platform eksternal untuk menambah atau memperbarui Response Scenario berdasarkan ID skenario respon (`id`).

---

## 📌 Endpoint Information

- **HTTP Method**: `PUT`
- **URL Path**: `/api/v1/external/response-scenarios/upsert`
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
2. **Jika `id` Disertakan & Ditemukan di DB**: Lakukan `UPDATE` pada data response scenario tersebut.
3. **Jika `id` Tidak Disertakan / Tidak Ditemukan**: Lakukan `CREATE` response scenario baru yang dikaitkan ke `requestScenarioId`.

---

## 📥 Request Schema

### Body Parameters

| Field | Type | Required | Description | Example |
|---|---|---|---|---|
| `id` | `string (UUID)` | Tidak | ID Response Scenario (Disertakan untuk update skenario spesifik) | `"resp-scenario-uuid-001"` |
| `requestScenarioId` | `string (UUID)` | **Ya** | ID Request Scenario induk | `"req-scenario-uuid-001"` |
| `name` | `string` | **Ya** | Nama Response Scenario | `"Response 200 OK - User Gold Data"` |
| `description` | `string` | Tidak | Deskripsi respon | `"Pengembalian data lengkap user gold tier"` |
| `statusCode` | `integer` | Tidak | HTTP Status Code respon (default: `200`) | `200` |
| `headers` | `object (JSON)` | Tidak | JSON HTTP Response Headers | `{"Content-Type": "application/json"}` |
| `body` | `object (JSON)` | Tidak | JSON Response Payload | `{"code": "SUCCESS", "data": {...}}` |
| `responseType` | `string` | Tidak | Tipe respon (`JSON`, `TEXT`, `FILE`, default: `JSON`) | `"JSON"` |
| `filePath` | `string` | Tidak | Path file jika responseType=`FILE` | `null` |
| `fileName` | `string` | Tidak | Nama file jika responseType=`FILE` | `null` |
| `delayMs` | `integer` | Tidak | Simulasi delay respon dalam milidetik (default: `0`) | `50` |
| `weight` | `integer` | Tidak | Bobot untuk random response distribution (default: `100`) | `100` |
| `priority` | `integer` | Tidak | Prioritas eksekusi (default: `0`) | `1` |
| `status` | `boolean` | Tidak | Status aktif skenario (default: `true`) | `true` |

### Sample Request Body
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

---

## 📤 Response Schema

### 1. Response Sukses (`200 OK` / `201 Created`)

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

### 2. Response Error (`400 Bad Request`)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Field 'requestScenarioId' and 'name' are required"
  }
}
```

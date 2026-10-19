# SPEC\-WG\-API \- Change Asset Modal

## Spec API Management for Change Asset Modal

| **Document Status** | RELEASED |
| --- | --- |
| **Document Owner** | @Jeffri Alfred@Ery Siregar |


---

**Document Changes History**

| **Author** | **Version** | **Revision Date** | **Summary** |
| --- | --- | --- | --- |
| @Jeffri Alfred | 1.0 |  | API Doc |

---

##  Document Objective

Memberikan penjelasan tentang API Management untuk KPM WG Change Asset Modal

##  Business 

Penggunaan dan inisialisasi API Management untuk KPM WG Change Asset Modal

##  Feature Scope

API Scope untuk API Management KPM WG Change Asset Modal

##  Requirement Specification

- Apigee

### **Environment**

| **Development** | **Testing** | **Staging** | **Production** |
| --- | --- | --- | --- |
| <https://dev-api-gateway.kbfinansia.com> | <https://testing-api-gateway.kbfinansia.com> | <https://staging-api-gateway.kbfinansia.com> | <https://api-gateway.kreditplus.com> |

### **Portal**

| **Development** | **Testing** | **Staging** | **Production** |
| --- | --- | --- | --- |
| <https://dev-portal-gateway.kbfinansia.com> | <https://testing-portal-gateway.kbfinansia.com> | <https://staging-portal-gateway.kbfinansia.com> | <https://portal-gateway.kreditplus.com> |

## Change Asset Modal

Description: Change Asset Modal

POST **/v1/kpm-wg/submission/change-asset-modal**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| ApiKey | CLIENT KEY APIGEE |
| Authorization | JWT TOKEN FROM KPM |

Outbound API :

- \[POST\] <https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/submission/change-asset-modal>

```html
curl --request POST \
  --url 'https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/submission/change-asset-modal' \
  --header 'Authorization: {{token}}' \
  --header 'content-type: application/json' \
  --data '{
  "order_id": "NWG-1042623072600025",
  "device_code": "aaaa"
  }'
```

### Payload JSON Body

| **Field** | **Type** | **Validation** | **Description** |
| --- | --- | --- | --- |
| device\_code | string |   | Device Code |
| order\_id | string | - required | Order ID |

```json
{
  "order_id": "NWG-1042623072600025",
  "device_code": "aaaa"
}
```

### Response Code

| **HTTP Code** | **Message** | **Custom Code** |
| --- | --- | --- |
| 200 ( Success ) | Operasi berhasil dieksekusi | KPM-WG-000 |
| 400 ( Error Validation ) | permintaan tidak valid, kesalahan muncul ketika permintaan Anda memiliki parameter yang tidak valid. | KPM-WG-280 |
| 401 ( Unauthorized | token tidak valid. | KPM-WG-181 |
| 404 ( Data Not Found ) | Data tidak ditemukan. | KPM-WG-310 |
| 500 ( Internal Server Error ) | terjadi kesalahan, silakan hubungi administrator. | KPM-WG-999 |

### Response

```json
{
  "code": "KPM-WG-000",
  "message": "operasi berhasil dieksekusi",
  "data": {
    "message": "Kamu hanya dapat mengganti barang 2 kali. Penggantian barang dilakukan dengan petugas",
    "max_attempt": 2,
    "attempt": 0
  },
  "errors": null
}
```

```json
{
  "code": "KPM-WG-000",
  "message": "operasi berhasil dieksekusi",
  "data": {
    "message": "Kamu telah mencapai batas penggantian barang. Pengajuan akan dibatalkan jika melanjutkan proses ini",
    "max_attempt": 2,
    "attempt": 2
  },
  "errors": null
}
```

```json
{
  "code": "KPM-WG-280",
  "message": "permintaan tidak valid, kesalahan muncul ketika permintaan Anda memiliki parameter yang tidak valid",
  "data": null,
  "errors": [
    {
      "field": "order_id",
      "message": "order_id wajib diisi"
    }
  ]
}
```

```json
{
  "code": "KPM-WG-310",
  "message": "data tidak ditemukan",
  "data": null,
  "errors": null,
  "error_helper": {
    "code": "KPM-WG-310",
    "created_at": "2025-04-07T14:50:18Z",
    "description": "Data tidak ditemukan",
    "id": "67f383ba6ba9e529950e0145",
    "service_name": "kpm-v3-wg-api",
    "source_application_name": "KPM",
    "status": "active",
    "title": "kpm",
    "type": "SNACKBAR",
    "updated_at": "2025-04-07T14:50:18Z"
  }
}
```

```json
{
  "code": "KPM-WG-311",
  "message": "data order tidak ditemukan",
  "data": null,
  "errors": null,
  "error_helper": {
    "code": "KPM-WG-311",
    "created_at": "2025-04-07T14:50:18Z",
    "description": "Data order tidak ditemukan",
    "id": "67f383ba6ba9e529950e0145",
    "service_name": "kpm-v3-wg-api",
    "source_application_name": "KPM",
    "status": "active",
    "title": "kpm",
    "type": "SNACKBAR",
    "updated_at": "2025-04-07T14:50:18Z"
  }
}
```

```json
{
  "code": "KPM-WG-181",
  "message": "Token tidak valid",
  "data": null,
  "errors": null
}
```

```json
{
  "code": "KPM-WG-999",
  "message": "Terjadi kesalahan pada sistem, silahkan hubungi administrator",
  "data": null,
  "errors": null,
  "error_helper": {
    "code": "KPM-WG-999",
    "created_at": "2025-03-28T09:19:50Z",
    "description": "Server Error",
    "id": "67e607466ba9e529950e00fe",
    "service_name": "kpm-v3-wg-api",
    "source_application_name": "KPM",
    "status": "active",
    "title": "kpm",
    "type": "SNACKBAR",
    "updated_at": "2025-03-28T09:19:50Z"
  }
}
```

## **Related Document**

- <https://kb-fmf.atlassian.net/wiki/x/AQDRRg>

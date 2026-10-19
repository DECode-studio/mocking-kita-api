# SPEC\-WG\-API \- Draft Submission

## Spec API Management for Draft Submission

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

Memberikan penjelasan tentang API Management untuk KPM WG Draft Submission

##  Business 

Penggunaan dan inisialisasi API Management untuk KPM WG Draft Submission

##  Feature Scope

API Scope untuk API Management KPM WG Draft Submission

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

## Draft Submission

Description: Draft Submission

POST **/v1/kpm-wg/submission/draft-submission**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| ApiKey | CLIENT KEY APIGEE |
| Authorization | JWT TOKEN FROM KPM |

Outbound API :

- \[POST\] <https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/submission/draft-submission>

```html
curl --request POST \
  --url 'https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/submission/draft-submission' \
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
        "prospect_id": "NWG-1242623122000001",
        "assets": [
            {
                "code": "ACER.HP/SMART PHONES.HANDPHONE",
                "description": "ACER.HP/SMART PHONES.HANDPHONE",
                "category_id": "HP",
                "category_name": "HANDPHONE / PDA",
                "otr": 1500000,
                "qty": 1
            }
        ],
        "cro_id": "98264",
        "cro_name": "DIAN RADIWANSYAH",
        "supplier_id": "42600428",
        "supplier_name": "99 CELL_1_BEC",
        "supplier_address": "ISTANA BEC LU G 08 - 09\r\nJL PURNAWARMAN 13 - 15",
        "user_id": "506",
        "customer_id": 5779325,
        "customer_name": "Asep Haryanto",
        "customer_limit_category": "PLATINUM",
        "customer_mobile_phone": "081350997258",
        "latitude": "37.4219983",
        "longitude": "-122.084",
        "source_application": "SLY",
        "branch_id": "426",
        "is_new_wg": true,
        "total_otr": 1500000,
        "expired_verification_date": "",
        "is_near_customer": true,
        "status_code": "KBL"
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
            "parameter": "id",
            "message": "id wajib diisi"
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
  "errors": null
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

- <https://kb-fmf.atlassian.net/wiki/x/mYAcS>

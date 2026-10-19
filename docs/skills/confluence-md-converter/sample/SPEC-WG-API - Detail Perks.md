# SPEC\-WG\-API \- Detail Perks

## Spec API Management for KPM WG Detail Perks

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

Memberikan penjelasan tentang API Management untuk KPM WG Detail Perks

##  Business 

Penggunaan dan inisialisasi API Management untuk KPM WG Detail Perks

##  Feature Scope

API Scope untuk API Management KPM WG Detail Perks

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

## Detail Perks

Description: Detail Perks

POST **/v1/kpm-wg/kreditmu/detail-perks**

### Headers

| **Parameter** | **Value** |
| --- | --- |
| ApiKey | CLIENT KEY APIGEE |
| Authorization | JWT TOKEN FROM KPM |
| x-request-id | Per request |
| x-trx-id | For transaction purpose |
| x-device-id | For device ID |
| x-session-id | For session ID |
| x-screen-id | For screen device |

Outbound API :

- \[POST\] <https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/detail-perks>

```html
curl --request POST \
  --url 'https://dev-kpm-v3-wg-api.kbfinansia.com/api/v3/kreditmu/detail-perks' \
  --header 'Authorization: {{token}}' \
  --header 'content-type: application/json' \
  --data '{
  "device_code": "TnPDlzcfvVOYYjgRvX6IAMnX1q10y7Dxk9mqyA=="
  }'
```

### Payload JSON Body

| **Field** | **Type** | **Validation** | **Description** |
| --- | --- | --- | --- |
| device\_code | string | - required - max=36 | Device Code |

```json
{
  "device_code": "TnPDlzcfvVOYYjgRvX6IAMnX1q10y7Dxk9mqyA=="
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
    "data": [
        {
            "id": 13,
            "title": "Limit Besar",
            "description": "Limit Belanja mulai Rp 20.000.000\r\n",
            "category_limit": "platinum",
            "icon_url": "icon_perk13.png"
        },
        {
            "id": 14,
            "title": "Tenor Beragam",
            "description": "Bebas pilih tenor mulai 1,3,6 hingga 12 bulan",
            "category_limit": "platinum",
            "icon_url": "icon_perk14.png"
        },
        {
            "id": 15,
            "title": "Bebas Belanja",
            "description": "Kemudahan berbelanja online dan offline",
            "category_limit": "platinum",
            "icon_url": "icon_perk17.png"
        },
        {
            "id": 16,
            "title": "DP 0%",
            "description": "Bertransaksi tanpa minimum DP",
            "category_limit": "platinum",
            "icon_url": "icon_perk18.png"
        },
        {
            "id": 17,
            "title": "Akses Semua Fitur",
            "description": "Nikmati kemudahan akses semua fitur KPM",
            "category_limit": "platinum",
            "icon_url": "icon_perk15.png"
        },
        {
            "id": 18,
            "title": "Beragam Hadiah",
            "description": "Beragam rewards menarik serta KPoin",
            "category_limit": "platinum",
            "icon_url": "icon_perk19.png"
        },
        {
            "id": 19,
            "title": "Limit Lama",
            "description": "Masa berlaku limit hingga 6 bulan",
            "category_limit": "platinum",
            "icon_url": "icon_perk16.png"
        },
        {
            "id": 20,
            "title": "Bayar Dimana Saja",
            "description": "Bayar angsuran dimana saja kapan saja",
            "category_limit": "platinum",
            "icon_url": "icon_perk20.png"
        }
    ],
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
      "field": "device_code",
      "message": "device_code wajib diisi"
    }
  ]
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

- <https://kb-fmf.atlassian.net/wiki/x/ooCwRw>

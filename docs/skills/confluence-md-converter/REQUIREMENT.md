### Minimum Requirement agar File `.md` Bersifat Valid

Agar sebuah file markdown dapat diparsing menjadi endpoint & skenario mock yang valid di sistem, dokumen **harus memenuhi kriteria minimal berikut**:

| Elemen | Requirement | Contoh / Keterangan |
| :--- | :--- | :--- |
| **Method & Path** *(Wajib)* | Harus memiliki baris yang memuat HTTP Method & Path URL. Parser mendukung markdown escaping (seperti `POST \*\*/v1/path\*\*` atau `POST /v1/path`). | `POST **/v1/kpm-wg/submission/draft-submission**`<br>Method yang didukung: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. |
| **Response Code Table** *(Wajib)* | Tabel di bawah heading `### Response Code` yang memuat kolom `HTTP Code` dan `Custom Code` (atau `Message`). | Minimal baris HTTP Code: `200`, `400`, `404`, `500`. |
| **Response JSON Blocks** *(Wajib)* | Minimal terdapat **1 blok kode valid JSON** di bawah section `### Response`. | JSON harus valid (dapat di-parse oleh `JSON.parse`). Parser akan mencocokkan `code` di dalam body JSON dengan `Custom Code` / `HTTP Code` pada tabel response. |
| **Payload JSON Body** *(Kondisional)* | Untuk method `POST`, `PUT`, `PATCH`, jika ada blok kode JSON di bawah section `### Payload JSON Body`, blok tersebut harus berupa JSON valid untuk dijadikan body mock request scenario. | Jika tidak ada / kosong, default request body dianggap `{}`. |
| **Headers** *(Opsional)* | Tabel di bawah `### Headers`. | Jika ada, di-convert menjadi default request headers scenario. |
| **Environment URLs** *(Opsional)* | Tabel di bawah `### **Environment**`. | Dapat otomatis didaftarkan / di-link ke Environment Project (`DEVELOPMENT`, `TESTING`, `STAGING`, `PRODUCTION`). |

---

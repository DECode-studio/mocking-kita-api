---
name: mock-api-studio-data-sheets
description: Panduan pengelolaan dataset pengujian terpusat (Data Sheets), format LIST & TABLE, sintaks addressing token (next, index, random), dan integrasi data-driven testing.
---

# Skill: Data Sheets (Test Datasets & Parameterization)

Skill ini menguraikan fitur **Data Sheets**, yaitu media penyimpanan dataset pengujian terpusat yang digunakan untuk memparameterisasi pengujian skenario flow dan menghasilkan respon mock dinamis.

---

## 1. Konsep & Model Data (`tblDataSheet`)

Data Sheet bertindak sebagai tabel data virtual internal proyek yang dapat diakses oleh Scenario Flow runner dan Mock Proxy Engine melalui token `{{datasheet.<code>...}}`.

### Atribut Model:
- `id` (UUID): Identifier unik dataset.
- `projectId` (UUID, opsional): Referensi ke project pemilik.
- `name` (String): Nama deskriptif dataset (misal: *Daftar Pengguna UAT*, *Produk Katalog Test*).
- `code` (String): Kode alfanumerik unik yang menjadi namespace token interpolasi (misal: `users`, `products`, `credit_cards`).
- `category` (String, opsional): Pengelompokan kategori (misal: *Auth*, *Billing*, *Inventory*).
- `format` (String): `LIST` atau `TABLE`.
- `data` (JSON): Payload dataset array JSON.

---

## 2. Format Data Sheet

### A. Format `TABLE` (Tabel Berkolom)
Struktur data tabular dengan baris-baris objek JSON yang seragam:

```json
[
  { "id": "USR-001", "name": "Budi Santoso", "email": "budi@example.com", "role": "ADMIN" },
  { "id": "USR-002", "name": "Siti Rahma", "email": "siti@example.com", "role": "USER" },
  { "id": "USR-003", "name": "Ahmad Dani", "email": "ahmad@example.com", "role": "USER" }
]
```

### B. Format `LIST` (Array Nilai / Objek Bebas)
Array sederhana untuk kebutuhan daftar satu dimensi:

```json
["081234567890", "081234567891", "081234567892"]
```

---

## 3. Sintaks Token Addressing & Pointer Lifecycle

Untuk mengakses nilai dari Data Sheet dalam URL, Header, Query Parameter, Request Body, atau Response Scenario Body, gunakan sintaks:

### A. Pola `next` (Sekuensial / Counter Otomatis)
Setiap kali token dipanggil, sistem akan mengambil baris saat ini dan memajukan pointer counter ke baris berikutnya:
- `{{datasheet.users.next.email}}` $\rightarrow$ Menghasilkan `"budi@example.com"` pada panggilan ke-1, `"siti@example.com"` pada panggilan ke-2.
- `{{datasheet.phones.next}}` $\rightarrow$ Menghasilkan `"081234567890"` untuk format `LIST`.
- **Siklus Looping**: Jika pointer mencapai akhir dataset, sistem otomatis mengulang kembali (*wrap around*) ke baris pertama (indeks 0).

### B. Pola Indeks Langsung (`[index]` atau `first`)
Mengakses baris data secara deterministik tanpa mengubah counter sekuensial:
- `{{datasheet.users[0].name}}` $\rightarrow$ `"Budi Santoso"`
- `{{datasheet.users.first.id}}` $\rightarrow$ `"USR-001"`

### C. Pola `random` (Acak)
Mengambil baris data secara acak dari total populasi baris Data Sheet:
- `{{datasheet.users.random.email}}`

---

## 4. Integrasi Penggunaan

### 1. Pada Scenario Flow Steps
Suntikkan data sheet pada payload request untuk menguji berbagai akun pengguna tanpa perlu mengubah konfigurasi step:
```json
{
  "username": "{{datasheet.users.next.email}}",
  "pin": "123456",
  "requestId": "{{$uuid}}"
}
```

### 2. Pada Dynamic Mock Responses
Kembalikan data dinamis yang realistis pada endpoint mock:
```json
{
  "status": "SUCCESS",
  "data": {
    "userId": "{{datasheet.users.next.id}}",
    "fullName": "{{datasheet.users.next.name}}",
    "generatedAt": "{{$timestamp}}"
  }
}
```

### 3. Pada Scenario Flow Jobs (`PER_TICK` & `BATCH_ALL`)
Otomatisasikan pengujian data-driven: Job cron dapat memproses satu baris data sheet per tick waktu atau mengeksekusi semua baris sekaligus dalam satu kali trigger batch.

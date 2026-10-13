---
name: mock-api-studio-scenario-flow-jobs
description: Panduan automasi penjadwalan eksekusi Scenario Flow (Jobs & Scheduler), Cron Expressions, Data Sheet Iteration (Per-Tick & Batch), Stop Conditions, dan Alerting Google Space.
---

# Skill: Scenario Flow Scheduled Jobs & Automation

Skill ini menjelaskan arsitektur dan panduan penggunaan **Scenario Flow Jobs**, yaitu fitur penjadwalan latar belakang (*background scheduler*) untuk mengautomasi eksekusi skenario flow secara berkala atau berkelanjutan.

---

## 1. Arsitektur Background Scheduler (`ScenarioFlowJobScheduler`)

Scheduler berjalan di sisi server Node.js dan mengelola lifecycle tugas cron/interval secara persisten:

- **Lokasi Kode**: [`src/server/scenario-flow/scenario-flow-job.scheduler.ts`](file:///Users/gadget/Development/experiment/mock-api-studio/src/server/scenario-flow/scenario-flow-job.scheduler.ts)
- **Library Inti**: `node-cron` dan `cron-parser`.
- **Bootstrapping**: Saat aplikasi dijalankan (`init()`), scheduler otomatis memuat semua job dengan status `ACTIVE` dari PostgreSQL dan mendaftarkannya ke dalam memori eksekusi.
- **Integritas Eksekusi**: Setiap trigger akan membuat record eksekusi baru pada `tblScenarioFlowExecution` dengan `triggerSource: "JOB"`.

---

## 2. Model Data Job (`tblScenarioFlowJob`)

Atribut utama konfigurasi job:

| Kolom | Tipe | Deskripsi & Nilai |
|---|---|---|
| `flowId` | UUID | Relasi ke Scenario Flow yang akan dieksekusi. |
| `environmentId` | UUID | Environment target (LOCAL, DEV, QA, STAGING, PROD). |
| `scheduleType` | Enum/String | `CRON`, `INTERVAL`, atau `ONCE`. |
| `cronExpression` | String | Format 5-bagian cron standar (misal: `*/5 * * * *` = setiap 5 menit). |
| `intervalSeconds`| Integer | Interval waktu perulangan dalam satuan detik (misal: `30` detik). |
| `scheduledAt` | DateTime | Waktu eksekusi spesifik untuk mode `ONCE`. |
| `targetMode` | String | `LIVE` (Base URL environment) atau `MOCK` (Internal engine). |
| `status` | String | `ACTIVE`, `PAUSED`, `COMPLETED`, `FAILED`. |

---

## 3. Integrasi Data Source & Mode Iterasi

Job dapat digabungkan dengan dataset **Data Sheet** untuk menjalankan pengujian berparameter (*data-driven testing*):

### A. Data Source Type (`dataSourceType`)
1. **`NONE`**: Menjalankan flow dengan variabel default flow/environment.
2. **`STATIC`**: Menggunakan variabel JSON kustom (`customVariables`) yang diatur khusus pada job tersebut.
3. **`DATASHEET`**: Mengikat job dengan Data Sheet spesifik (`dataSheetId`).

### B. Mode Iterasi Data (`dataIterationMode`)
1. **`PER_TICK` (Satu Baris Per Pemicu)**:
   - Setiap kali jadwal cron/interval memicu eksekusi, job hanya memproses **satu baris data sheet** berikutnya (`dataSheetCurrentIndex`).
   - Pointer indeks otomatis bertambah 1 (`currentIndex + 1`).
   - Sangat ideal untuk simulasi transaksi pengguna yang terdistribusi sepanjang waktu (misal: 1 transaksi setiap 10 menit).
2. **`BATCH_ALL` (Semua Baris Sekaligus)**:
   - Setiap kali jadwal memicu eksekusi, job akan mengeksekusi flow untuk **seluruh baris data** yang ada di Data Sheet secara berurutan dalam satu siklus trigger.

---

## 4. Kondisi Berhenti (Stop Conditions)

Untuk mencegah konsumsi resource yang tidak terkendali, job dapat dikonfigurasikan dengan kondisi terminasi otomatis:

| Kondisi (`stopCondition`) | Parameter Pendukung | Deskripsi |
|---|---|---|
| `FOREVER` | - | Berjalan terus-menerus tanpa batas waktu hingga di-pause/stop manual. |
| `MAX_ITERATIONS` | `maxIterations` (Integer) | Otomatis berubah menjadi `COMPLETED` setelah mencapai N kali eksekusi. |
| `UNTIL_DATE` | `endAt` (DateTime) | Otomatis berhenti ketika waktu server melewati tanggal yang ditentukan. |
| `DATASHEET_EXHAUSTED` | `dataSheetId` | Otomatis berhenti ketika seluruh baris pada Data Sheet telah selesai diproses. |

---

## 5. Metrik & Notifikasi Kegagalan (Google Space Card v2)

### A. Pelacakan Metrik Real-time
Sistem mencatat performa operasional job secara langsung pada database:
- `totalRuns`: Total akumulasi trigger eksekusi.
- `successRuns` & `failedRuns`: Jumlah eksekusi yang berhasil vs gagal.
- `lastRunAt` & `nextRunAt`: Timestamp eksekusi terakhir dan jadwal kalkulasi berikutnya.
- `lastStatus` & `lastError`: Status dan ringkasan pesan error kegagalan terakhir.

### B. Alerting Otomatis ke Google Space
Jika eksekusi job mengalami kegagalan (misal asersi gagal atau network timeout):
- Fungsi `sendJobFailureGoogleSpaceNotification` otomatis mengirim kartu notifikasi peringatan (*Incident Alert*) ke Google Space Webhook.
- Notifikasi berisi nama Job, nama Flow, total durasi, status code langkah yang gagal, dan error trace lengkap untuk respons cepat tim on-call / QA.

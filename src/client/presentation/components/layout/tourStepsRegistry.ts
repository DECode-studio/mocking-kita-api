import { TourTrackId } from '../../stores/onboardingStore';
import { LAYOUT_SEMANTIC_ID } from './constant';
import { PROJECTS_SEMANTIC_ID } from '../../views/projects/constant';
import { ENVIRONMENTS_SEMANTIC_ID } from '../../views/environments/constant';
import { SCENARIO_FLOWS_SEMANTIC_ID } from '../../views/scenario-flows/constant';
import { DATA_SHEET_SEMANTIC_ID } from '../../views/data-sheets/constant';
import { EXTERNAL_API_DOCS_SEMANTIC_ID } from '../../views/external-api-docs/constant';
import { SETTINGS_SEMANTIC_ID } from '../../views/settings/constant';
import { ASSISTANT_SEMANTIC_ID } from '../../views/assistant/constant';
import { FAQ_SEMANTIC_ID } from '../../views/faq/constant';
import { ACCOUNT_SETTINGS_SEMANTIC_ID } from '../../views/account-settings/constant';
import { ADMIN_ACCOUNTS_SEMANTIC_ID } from '../../views/admin-accounts/constant';
import { CHANGE_LOGS_ADMIN_SEMANTIC_ID } from '../../views/admin-change-logs/constant';
import { DASHBOARD_SEMANTIC_ID } from '../../views/dashboard/constant';
import { ROUTES } from '@/src/core/constants/routes';

export interface TourStepDefinition {
  id: string;
  target: string;
  mode: 'click' | 'fill' | 'hold' | 'info';
  title?: string;
  content: string;
  targetPath?: string;
  optional?: boolean;
}

export const TOUR_TRACKS_META: Record<
  TourTrackId,
  {
    title: string;
    description: string;
    initialRoute: string;
    steps: TourStepDefinition[];
  }
> = {
  quickstart: {
    title: 'Quickstart: Project & Mock API',
    description: 'Panduan awal membuat project, mendefinisikan API, dan skenario respons.',
    initialRoute: ROUTES.DASHBOARD,
    steps: [], // Handled dynamically in OnboardingTour for interactive form entry
  },

  'system-overview': {
    title: '01. System Overview & Dashboard',
    description: 'Arsitektur Clean Architecture + MVVM, peran pengguna RBAC, dan navigasi utama sistem.',
    initialRoute: ROUTES.DASHBOARD,
    steps: [
      {
        id: 'sys-brand',
        target: `#${LAYOUT_SEMANTIC_ID.SIDEBAR_LOGO}`,
        mode: 'info',
        title: 'Mocking Kita Studio Platform',
        content:
          'Selamat datang di Mocking Kita Studio! Platform enterprise lokal untuk API Mocking, Scenario Flow Automation, Data Sheets, dan Testing Lifecycle.',
      },
      {
        id: 'sys-dashboard-hero',
        target: `#${DASHBOARD_SEMANTIC_ID.HERO}`,
        mode: 'info',
        title: 'Dashboard Real-Time Hero',
        content:
          'Ringkasan status engine mocking lokal Anda, metrik latensi, dan statistik operasional harian.',
        targetPath: ROUTES.DASHBOARD,
      },
      {
        id: 'sys-dashboard-stats',
        target: `#${DASHBOARD_SEMANTIC_ID.STATS_GRID}`,
        mode: 'info',
        title: 'Statistik & Metrik Total',
        content:
          'Pantau total project, koleksi API, alur skenario, dan dataset tabular yang aktif secara instan.',
        targetPath: ROUTES.DASHBOARD,
      },
      {
        id: 'sys-dashboard-dist',
        target: `#${DASHBOARD_SEMANTIC_ID.DISTRIBUTION_BAR}`,
        mode: 'info',
        title: 'Distribusi HTTP Method',
        content:
          'Visualisasi persebaran method request (GET, POST, PUT, PATCH, DELETE) di seluruh workspace Anda.',
        targetPath: ROUTES.DASHBOARD,
      },
      {
        id: 'sys-assistant',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_ASSISTANT}`,
        mode: 'info',
        title: 'AI Assistant & Studio Converters',
        content:
          'Asisten AI cerdas terintegrasi siap membantu konsultasi arsitektur, menerjemahkan dokumen OpenAPI/Insomnia, dan memandu tutorial interaktif.',
      },
      {
        id: 'sys-theme',
        target: `#${LAYOUT_SEMANTIC_ID.SIDEBAR_THEME_TOGGLE_BTN}`,
        mode: 'info',
        title: 'Tema Tampilan Fleksibel',
        content:
          'Dukungan penuh untuk mode Gelap (Dark Mode) dan mode Terang (Light Mode) yang nyaman di mata.',
      },
      {
        id: 'sys-rbac',
        target: `#${LAYOUT_SEMANTIC_ID.TOP_NAVBAR_USER_MENU}`,
        mode: 'info',
        title: 'Role-Based Access Control (RBAC)',
        content:
          'Sistem otentikasi aman (Local JWT & Google SSO) yang mendukung role SUPERADMIN, ADMIN, dan MEMBER dengan penugasan Person In Charge (PIC).',
      },
    ],
  },

  'projects-and-environments': {
    title: '02. Project & Matrix Environments',
    description: 'Hierarki Project, Collections, dan 5 tipe matrix environment (LOCAL -> PROD).',
    initialRoute: ROUTES.PROJECTS,
    steps: [
      {
        id: 'env-nav-projects',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_PROJECTS}`,
        mode: 'info',
        title: 'Manajemen Projects',
        content:
          'Project adalah kontainer utama yang mengelompokkan API Collections, Scenario Flows, Data Sheets, dan Matrix Environment.',
        targetPath: ROUTES.PROJECTS,
      },
      {
        id: 'env-add-project',
        target: `#${PROJECTS_SEMANTIC_ID.ADD_PROJECT_BTN}`,
        mode: 'info',
        title: 'Pembuatan Project Baru',
        content:
          'Klik tombol ini untuk membuat project baru, mengatur nama, deskripsi, dan menugaskan Person In Charge (PIC).',
        targetPath: ROUTES.PROJECTS,
      },
      {
        id: 'env-search-project',
        target: `#${PROJECTS_SEMANTIC_ID.SEARCH_INPUT}`,
        mode: 'info',
        title: 'Pencarian & Filter Project',
        content:
          'Cari project secara cepat berdasarkan nama, status aktif/nonaktif, atau urutkan berdasarkan waktu pembaruan.',
        targetPath: ROUTES.PROJECTS,
      },
      {
        id: 'env-nav-environments',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_ENVIRONMENTS}`,
        mode: 'info',
        title: 'Matrix Environments Menu',
        content:
          'Kelola 5 tingkatan environment terisolasi: LOCAL, DEVELOPMENT, TESTING, STAGING, dan PRODUCTION.',
        targetPath: ROUTES.ENVIRONMENTS,
      },
      {
        id: 'env-create-btn',
        target: `#${ENVIRONMENTS_SEMANTIC_ID.CREATE_BTN}`,
        mode: 'info',
        title: 'Tambah Konfigurasi Environment',
        content:
          'Tentukan Base URL target per-tipe environment untuk keperluan forward proxy otomatis ke server backend nyata.',
        targetPath: ROUTES.ENVIRONMENTS,
      },
      {
        id: 'env-vars-mode',
        target: `#${ENVIRONMENTS_SEMANTIC_ID.VIEW_MODE_VAR}`,
        mode: 'info',
        title: 'Environment Variables ({{KEY}})',
        content:
          'Gunakan mode Variables untuk mengatur variabel global per environment yang dapat dipanggil menggunakan format {{VARIABLE_NAME}}.',
        targetPath: ROUTES.ENVIRONMENTS,
      },
    ],
  },

  'mock-api-engine': {
    title: '03. Mock API & Proxy Engine',
    description: 'Endpoint mock dinamis, aturan pencocokan request, delay latensi, dan weighted lottery response.',
    initialRoute: ROUTES.PROJECTS,
    steps: [
      {
        id: 'mock-projects-list',
        target: `#${PROJECTS_SEMANTIC_ID.CONTAINER}`,
        mode: 'info',
        title: 'URL Endpoint Mock Dinamis',
        content:
          'Setiap mock API disajikan melalui rute proxy terstandarisasi: /api/mock/:projectId/:path* dengan isolasi method HTTP.',
        targetPath: ROUTES.PROJECTS,
      },
      {
        id: 'mock-search',
        target: `#${PROJECTS_SEMANTIC_ID.SEARCH_INPUT}`,
        mode: 'info',
        title: 'Katalog Endpoint API',
        content:
          'Masuk ke detail project untuk mengelola Request Scenarios, HTTP Methods, Path parameters (misal /users/:id), dan query parameters.',
        targetPath: ROUTES.PROJECTS,
      },
      {
        id: 'mock-matching-rule',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_PROJECTS}`,
        mode: 'info',
        title: 'Request Matching & Weighted Scenarios',
        content:
          'Mocking Kita mencocokkan request berdasarkan Path, Header target (X-Mock-Scenario-Id), Query Params, dan Body matching (Equal, Contains, Regex). Delay jaringan juga dapat disimulasikan.',
        targetPath: ROUTES.PROJECTS,
      },
    ],
  },

  'scenario-flows': {
    title: '04. Scenario Flows (API Orchestration)',
    description: 'Orkestrasi alur pengujian berantai, variable chaining, asersi status, dan visual canvas.',
    initialRoute: ROUTES.SCENARIO_FLOWS,
    steps: [
      {
        id: 'flow-nav',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_SCENARIO_FLOWS}`,
        mode: 'info',
        title: 'Scenario Flows Orchestrator',
        content:
          'Eksekusi pengujian API berantai (Step 1 -> Step 2 -> Step N) secara otomatis dan terisolasi.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
      {
        id: 'flow-create-btn',
        target: `#${SCENARIO_FLOWS_SEMANTIC_ID.CREATE_BTN}`,
        mode: 'info',
        title: 'Buat Scenario Flow Baru',
        content:
          'Klik tombol ini untuk mendefinisikan alur pengujian baru, menentukan stop-on-failure flag, dan variabel flow global.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
      {
        id: 'flow-import-dropdown',
        target: `#${SCENARIO_FLOWS_SEMANTIC_ID.IMPORT_DROPDOWN_TRIGGER}`,
        mode: 'info',
        title: 'Impor Template JSON & Insomnia',
        content:
          'Impor alur langsung dari berkas template Scenario Flow JSON schema v1 atau koleksi Insomnia YAML/JSON.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
      {
        id: 'flow-search',
        target: `#${SCENARIO_FLOWS_SEMANTIC_ID.SEARCH_INPUT}`,
        mode: 'info',
        title: 'Filter & Eksekusi Alur',
        content:
          'Jalankan skenario flow dalam mode MOCK atau LIVE ke server nyata, lengkap dengan inspeksi timeline waktu respons dan asersi JSONPath.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
    ],
  },

  'scenario-flow-jobs': {
    title: '05. Scenario Flow Jobs (Scheduler)',
    description: 'Background cron scheduler, iterasi dataset dinamis, dan alert Google Space.',
    initialRoute: ROUTES.SCENARIO_FLOWS,
    steps: [
      {
        id: 'job-tab-btn',
        target: `#${SCENARIO_FLOWS_SEMANTIC_ID.TAB_JOBS_BTN}`,
        mode: 'info',
        title: 'Tab Scheduled Jobs',
        content:
          'Buka tab Jobs untuk mengelola automasi eksekusi Scenario Flow yang berjalan di background secara berkala.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
      {
        id: 'job-container',
        target: `#${SCENARIO_FLOWS_SEMANTIC_ID.CONTAINER}`,
        mode: 'info',
        title: 'Jadwal Cron & Alert Webhook',
        content:
          'Mendukung tipe jadwal CRON (misal */10 * * * *), INTERVAL detik, dan ONCE. Jika flow mengalami kegagalan, peringatan otomatis dikirimkan ke Google Space.',
        targetPath: ROUTES.SCENARIO_FLOWS,
      },
    ],
  },

  'data-sheets': {
    title: '06. Data Sheets (Tabular Datasets)',
    description: 'Dataset CSV/Excel, token iterator dinamis per-step, dan pengujian berbasis data (DDT).',
    initialRoute: ROUTES.DATA_SHEETS,
    steps: [
      {
        id: 'ds-nav',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_DATA_SHEETS}`,
        mode: 'info',
        title: 'Modul Data Sheets',
        content:
          'Data Sheets menyediakan spreadsheet tabel internal untuk pengujian berulang dengan data dinamis.',
        targetPath: ROUTES.DATA_SHEETS,
      },
      {
        id: 'ds-create-btn',
        target: `#${DATA_SHEET_SEMANTIC_ID.CREATE_BTN}`,
        mode: 'info',
        title: 'Tambah Data Sheet Baru',
        content:
          'Buat dataset berformat TABLE atau LIST, dan isi kolom-kolom seperti phone, email, username, NIK, dan amount.',
        targetPath: ROUTES.DATA_SHEETS,
      },
      {
        id: 'ds-search',
        target: `#${DATA_SHEET_SEMANTIC_ID.SEARCH_INPUT}`,
        mode: 'info',
        title: 'Pencarian & Filter Dataset',
        content:
          'Kelola dan kelompokkan dataset berdasarkan project dan kategori pengujian untuk data-driven testing.',
        targetPath: ROUTES.DATA_SHEETS,
      },
      {
        id: 'ds-tokens',
        target: `#${DATA_SHEET_SEMANTIC_ID.CONTAINER}`,
        mode: 'info',
        title: 'Sintaks Token Pointer Dinamis',
        content:
          'Akses baris selanjutnya di Scenario Flow menggunakan token {{datasheet.SheetName.next.columnName}} atau baris saat ini dengan {{datasheet.SheetName.current.columnName}}.',
        targetPath: ROUTES.DATA_SHEETS,
      },
    ],
  },

  'openapi-importers': {
    title: '07. OpenAPI & Insomnia Converters',
    description: 'Konversi spesifikasi Swagger/OpenAPI 2.0 & 3.x dan koleksi Insomnia AST ke Mock Studio.',
    initialRoute: ROUTES.ASSISTANT,
    steps: [
      {
        id: 'oa-nav',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_ASSISTANT}`,
        mode: 'info',
        title: 'AI Studio Tools & Converters',
        content:
          'Pusat perkakas otomatisasi untuk mengubah dokumentasi spesifikasi API menjadi aset Mock Studio.',
        targetPath: ROUTES.ASSISTANT,
      },
      {
        id: 'oa-openapi-tab',
        target: `#${ASSISTANT_SEMANTIC_ID.OPENAPI_TAB}`,
        mode: 'info',
        title: 'OpenAPI Generator',
        content:
          'Tempelkan spesifikasi OpenAPI/Swagger (JSON/YAML) untuk secara otomatis membuat koleksi endpoint dan mock respons.',
        targetPath: ROUTES.ASSISTANT,
      },
      {
        id: 'oa-insomnia-tab',
        target: `#${ASSISTANT_SEMANTIC_ID.INSOMNIA_TAB}`,
        mode: 'info',
        title: 'Insomnia Collection Converter',
        content:
          'Unggah ekspor Insomnia v5 untuk dikonversi menjadi Scenario Flow Template v1 dengan pemetaan dependensi berantai.',
        targetPath: ROUTES.ASSISTANT,
      },
    ],
  },

  'ai-tools-and-simulator': {
    title: 'AI Tools & Dynamic Simulator',
    description: 'Simulator generator token dinamis, knowledge base explorer, dan chat session history.',
    initialRoute: ROUTES.ASSISTANT,
    steps: [
      {
        id: 'ai-chat-tab',
        target: `#${ASSISTANT_SEMANTIC_ID.CHAT_TAB}`,
        mode: 'info',
        title: 'AI Assistant Chat Session',
        content:
          'Konsultasikan perancangan skenario mock, formula regex, atau sintaksis variabel langsung bersama asisten AI pintar.',
        targetPath: ROUTES.ASSISTANT,
      },
      {
        id: 'ai-simulator-tab',
        target: `#${ASSISTANT_SEMANTIC_ID.SIMULATOR_TAB}`,
        mode: 'info',
        title: 'Variable & Generator Simulator',
        content:
          'Uji coba evaluasi token interpolasi dinamis seperti {{$uuid}}, {{$timestamp}}, {{$isoDate}}, dan generator acak secara langsung.',
        targetPath: ROUTES.ASSISTANT,
      },
      {
        id: 'ai-knowledge-tab',
        target: `#${ASSISTANT_SEMANTIC_ID.KNOWLEDGE_TAB}`,
        mode: 'info',
        title: 'Knowledge Base Explorer',
        content:
          'Jelajahi basis pengetahuan terindeks, panduan arsitektur sistem, dan standar pembuatan template alur testing.',
        targetPath: ROUTES.ASSISTANT,
      },
    ],
  },

  'external-api-cicd': {
    title: '08. External API & CI/CD Automation',
    description: 'Integrasi Headless /api/v1/external/*, autentikasi JWT/API-Key, dan pipeline CI/CD.',
    initialRoute: ROUTES.EXTERNAL_API_DOCS,
    steps: [
      {
        id: 'ext-nav',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_EXTERNAL_API_DOCS}`,
        mode: 'info',
        title: 'External API Documentation',
        content:
          'Dokumentasi interaktif untuk mengintegrasikan Mocking Kita Studio ke dalam pipeline CI/CD (GitHub Actions, GitLab CI).',
        targetPath: ROUTES.EXTERNAL_API_DOCS,
      },
      {
        id: 'ext-auth-bar',
        target: `#${EXTERNAL_API_DOCS_SEMANTIC_ID.AUTH_BAR}`,
        mode: 'info',
        title: 'Global Auth & API Key Playground',
        content:
          'Otentikasi aman menggunakan JWT Bearer Token atau SHA-256 API Key untuk eksekusi API headless.',
        targetPath: ROUTES.EXTERNAL_API_DOCS,
      },
      {
        id: 'ext-endpoints-list',
        target: `#${EXTERNAL_API_DOCS_SEMANTIC_ID.ENDPOINTS_LIST}`,
        mode: 'info',
        title: 'Daftar Endpoint Terproteksi',
        content:
          'Semua endpoint mengembalikan respons terstandarisasi format Envelope: { error, code, message, data }.',
        targetPath: ROUTES.EXTERNAL_API_DOCS,
      },
    ],
  },

  'faq-and-guide': {
    title: 'FAQ & User Knowledge Guide',
    description: 'Pusat bantuan tanya jawab, glosarium konsep, dan tips pemecahan masalah.',
    initialRoute: ROUTES.FAQ,
    steps: [
      {
        id: 'faq-container',
        target: `#${FAQ_SEMANTIC_ID.CONTAINER}`,
        mode: 'info',
        title: 'Pusat Tanya Jawab (FAQ)',
        content:
          'Temukan jawaban cepat untuk pertanyaan umum seputar mock engine, proxy forwarding, flow runner, dan sintaksis variabel.',
        targetPath: ROUTES.FAQ,
      },
      {
        id: 'faq-search',
        target: `#${FAQ_SEMANTIC_ID.SEARCH_INPUT}`,
        mode: 'info',
        title: 'Pencarian Instan Topik Bantuan',
        content:
          'Ketikkan kata kunci seperti "proxy", "token", "assertion", atau "database" untuk menyaring topik secara langsung.',
        targetPath: ROUTES.FAQ,
      },
      {
        id: 'faq-categories',
        target: `#${FAQ_SEMANTIC_ID.CATEGORY_LIST}`,
        mode: 'info',
        title: 'Kategori Bantuan Terstruktur',
        content:
          'Pilih kategori spesifik untuk mempelajari panduan terarah seputar fitur Mocking Kita.',
        targetPath: ROUTES.FAQ,
      },
    ],
  },

  'admin-change-logs': {
    title: 'Audit Trail & Change Logs Forensic',
    description: 'Pencatatan riwayat perubahan data, diff visual forensik, dan jejak aktivitas akun.',
    initialRoute: ROUTES.CHANGE_LOGS,
    steps: [
      {
        id: 'log-header',
        target: `#${CHANGE_LOGS_ADMIN_SEMANTIC_ID.HEADER}`,
        mode: 'info',
        title: 'Audit Trail Change Logs',
        content:
          'Setiap aksi pembuatan, pembaruan, dan penghapusan aset di database dicatat secara forensik untuk akuntabilitas sistem.',
        targetPath: ROUTES.CHANGE_LOGS,
      },
      {
        id: 'log-filters',
        target: `#${CHANGE_LOGS_ADMIN_SEMANTIC_ID.ACTION_FILTER}`,
        mode: 'info',
        title: 'Filter Tipe Aksi & Project',
        content:
          'Saring catatan log berdasarkan tipe aksi (CREATE, UPDATE, DELETE) atau lingkup project tertentu.',
        targetPath: ROUTES.CHANGE_LOGS,
      },
      {
        id: 'log-list',
        target: `#${CHANGE_LOGS_ADMIN_SEMANTIC_ID.LOG_LIST}`,
        mode: 'info',
        title: 'Riwayat & Visual Diff JSON',
        content:
          'Klik pada item log untuk melihat perbandingan mendalam (JSON diff) antara data lama dan data baru.',
        targetPath: ROUTES.CHANGE_LOGS,
      },
    ],
  },

  'admin-accounts': {
    title: 'Manajemen Akun Pengguna (RBAC)',
    description: 'Pengelolaan pengguna, hak akses peran (SUPERADMIN, ADMIN, MEMBER), dan penugasan PIC.',
    initialRoute: ROUTES.ADMIN_ACCOUNTS,
    steps: [
      {
        id: 'adm-header',
        target: `#${ADMIN_ACCOUNTS_SEMANTIC_ID.HEADER}`,
        mode: 'info',
        title: 'Pusat Manajemen Akun Pengguna',
        content:
          'Area khusus Superadmin untuk mengontrol kredensial, role, dan status keaktifan anggota tim.',
        targetPath: ROUTES.ADMIN_ACCOUNTS,
      },
      {
        id: 'adm-add-btn',
        target: `#${ADMIN_ACCOUNTS_SEMANTIC_ID.ADD_BTN}`,
        mode: 'info',
        title: 'Tambah Pengguna Baru',
        content:
          'Daftarkan akun pengguna lokal baru dengan menentukan username, display name, password, dan level wewenang peran.',
        targetPath: ROUTES.ADMIN_ACCOUNTS,
      },
      {
        id: 'adm-filter',
        target: `#${ADMIN_ACCOUNTS_SEMANTIC_ID.FILTER_SELECT}`,
        mode: 'info',
        title: 'Filter Peran & Status',
        content:
          'Kelola distribusi role tim dengan mudah: SUPERADMIN (akses penuh), ADMIN (pengelola project), dan MEMBER (operator).',
        targetPath: ROUTES.ADMIN_ACCOUNTS,
      },
    ],
  },

  'account-settings': {
    title: 'Pengaturan Akun & Profil Pribadi',
    description: 'Pembaruan profil nama tampilan, informasi peran akun, dan penggantian kata sandi.',
    initialRoute: ROUTES.ACCOUNT_SETTINGS,
    steps: [
      {
        id: 'acc-profile',
        target: `#${ACCOUNT_SETTINGS_SEMANTIC_ID.PROFILE_CARD}`,
        mode: 'info',
        title: 'Kartu Profil Pengguna',
        content:
          'Menampilkan identitas username Anda, email Google yang tertaut, serta level otoritas peran saat ini.',
        targetPath: ROUTES.ACCOUNT_SETTINGS,
      },
      {
        id: 'acc-update-name',
        target: `#${ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_NAME_CARD}`,
        mode: 'info',
        title: 'Ubah Nama Tampilan (Display Name)',
        content:
          'Perbarui nama lengkap yang akan ditampilkan pada penugasan PIC dan riwayat audit perubahan.',
        targetPath: ROUTES.ACCOUNT_SETTINGS,
      },
      {
        id: 'acc-update-password',
        target: `#${ACCOUNT_SETTINGS_SEMANTIC_ID.UPDATE_PASSWORD_CARD}`,
        mode: 'info',
        title: 'Ganti Kata Sandi (Password)',
        content:
          'Perbarui kata sandi akun lokal Anda secara aman dengan konfirmasi sandi saat ini.',
        targetPath: ROUTES.ACCOUNT_SETTINGS,
      },
    ],
  },

  'admin-and-database': {
    title: '09. Admin & Database Management',
    description: 'Snapshot database backup (Merge/Replace), reset database, dan pemeliharaan sistem.',
    initialRoute: ROUTES.SETTINGS,
    steps: [
      {
        id: 'adm-nav-settings',
        target: `#${LAYOUT_SEMANTIC_ID.NAV_SETTINGS}`,
        mode: 'info',
        title: 'Menu Pengaturan Sistem',
        content:
          'Konfigurasi umum aplikasi, pengaturan preferensi tema, dan manajemen database.',
        targetPath: ROUTES.SETTINGS,
      },
      {
        id: 'adm-backup-btn',
        target: `#${SETTINGS_SEMANTIC_ID.DOWNLOAD_BACKUP_BTN}`,
        mode: 'info',
        title: 'Snapshot Backup Database',
        content:
          'Unduh snapshot lengkap seluruh database Mocking Kita ke dalam arsip file terkompresi atau JSON.',
        targetPath: ROUTES.SETTINGS,
      },
      {
        id: 'adm-import-btn',
        target: `#${SETTINGS_SEMANTIC_ID.IMPORT_BACKUP_BTN}`,
        mode: 'info',
        title: 'Restore Database (MERGE / REPLACE)',
        content:
          'Pulihkan cadangan database dengan mode MERGE (menggabungkan data) atau REPLACE (reset bersih dan isi ulang).',
        targetPath: ROUTES.SETTINGS,
      },
    ],
  },
};

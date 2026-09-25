export const FAQ_TEXT = {
  TITLE: 'FAQ & Panduan Mock API Studio',
  SUBTITLE: 'Pelajari cara mengonfigurasi endpoint, skenario pencocokan request, orkestrasi Scenario Flow (Request Flow), simulasi latensi berbobot, integrasi PostgreSQL & Prisma, serta memahami Clean Architecture aplikasi Anda.',
  TAG: 'Base Knowledge Center',
  SEARCH_PLACEHOLDER: 'Cari pertanyaan, fitur, atau arsitektur...',
  EMPTY_TITLE: 'Pertanyaan tidak ditemukan',
  EMPTY_DESC: (query: string) => `Tidak ada FAQ yang cocok dengan kata kunci "${query}". Coba cari dengan kata kunci lain.`,
  ALL_CATEGORIES: 'Semua Kategori',
} as const;

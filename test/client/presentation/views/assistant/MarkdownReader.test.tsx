// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MarkdownReader } from '@/src/client/presentation/views/assistant/components/MarkdownReader';

describe('MarkdownReader Component', () => {
  it('renders headings and paragraphs', () => {
    const md = '# Main Title\n\n## Sub Title\n\nThis is a paragraph.';
    render(<MarkdownReader content={md} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Main Title');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Sub Title');
    expect(screen.getByText('This is a paragraph.')).toBeDefined();
  });

  it('renders heading immediately followed by list items without blank line', () => {
    const md = `# 8. Data Sheets Engine
- **Fungsi**: Menyediakan dataset tabular (berisi kolom-kolom seperti \`phone\`, \`email\`, \`username\`, \`nik\`, \`amount\`) untuk pengujian berulang (*data-driven testing*).
- **Fitur**:
  - Impor / Ekspor via CSV dan Excel (.xlsx).
  - Skema data kolom fleksibel dengan validasi tipe.
  - Proxy iterator terisolasi per sesi eksekusi scenario flow sehingga tidak terjadi race condition saat multi-eksekusi paralel.
  - Token \`{{datasheet.SheetName.next.columnName}}\` otomatis mengambil baris record selanjutnya untuk setiap iterasi loop.`;

    const { container } = render(<MarkdownReader content={md} />);

    // Heading should be separate and not contain the list
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('8. Data Sheets Engine');
    expect(h1.textContent).not.toContain('Fungsi');

    // Bold tags
    const strongs = container.querySelectorAll('strong');
    const strongTexts = Array.from(strongs).map((s) => s.textContent);
    expect(strongTexts).toContain('Fungsi');
    expect(strongTexts).toContain('Fitur');

    // Code tags
    const codes = container.querySelectorAll('code');
    const codeTexts = Array.from(codes).map((c) => c.textContent);
    expect(codeTexts).toContain('phone');
    expect(codeTexts).toContain('email');
    expect(codeTexts).toContain('{{datasheet.SheetName.next.columnName}}');

    // Italic tags
    const ems = container.querySelectorAll('em');
    const emTexts = Array.from(ems).map((e) => e.textContent);
    expect(emTexts).toContain('data-driven testing');
  });

  it('renders inline bold, italic, and code correctly', () => {
    const md = 'Hello **bold world** and *italic style* with `const x = 10`.';
    const { container } = render(<MarkdownReader content={md} />);

    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('bold world');

    const em = container.querySelector('em');
    expect(em?.textContent).toBe('italic style');

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('const x = 10');
  });

  it('renders fenced code blocks with language badge', () => {
    const md = '```json\n{\n  "status": "ok"\n}\n```';
    const { container } = render(<MarkdownReader content={md} />);

    expect(screen.getByText('JSON')).toBeDefined();
    expect(container.querySelector('pre')).toBeDefined();
  });

  it('renders list items with bullets', () => {
    const md = '- Item 1\n- Item 2\n  - Sub Item 2.1';
    render(<MarkdownReader content={md} />);

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
    expect(screen.getByText('Sub Item 2.1')).toBeDefined();
  });

  it('renders markdown tables properly', () => {
    const md = `Sintaksis Interpolasi yang Didukung:
| Sintaksis | Deskripsi |
|-----------|-----------|
| \`{{var}}\` | Variabel global yang sudah ditetapkan |
| \`{{$response.body.field}}\` | Ekstraksi dari response request terakhir |
---`;

    const { container } = render(<MarkdownReader content={md} textSize="sm" />);

    expect(screen.getByText('Sintaksis Interpolasi yang Didukung:')).toBeDefined();
    expect(container.querySelector('table')).toBeDefined();
    expect(screen.getByText('Sintaksis')).toBeDefined();
    expect(screen.getByText('Deskripsi')).toBeDefined();
    expect(screen.getByText('Variabel global yang sudah ditetapkan')).toBeDefined();
    expect(screen.getByText('{{var}}')).toBeDefined();
    expect(container.querySelector('hr')).toBeDefined();
  });

  it('safely renders lines starting with pipe without delimiter without entering infinite loop', () => {
    const md = `Catatan penting:
| Ini hanya satu baris yang diawali pipe tanpa header delimiter
| Baris kedua dengan | multiple pipe | symbols
Berikutnya adalah paragraf biasa.`;

    const { container } = render(<MarkdownReader content={md} />);
    expect(container.textContent).toContain('Ini hanya satu baris yang diawali pipe');
    expect(container.textContent).toContain('Berikutnya adalah paragraf biasa.');
  });
});

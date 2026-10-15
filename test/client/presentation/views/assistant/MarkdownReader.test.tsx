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
});


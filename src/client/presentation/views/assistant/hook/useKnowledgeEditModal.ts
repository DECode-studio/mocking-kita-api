'use client';

import { useState, useEffect, useRef } from 'react';
import { AssistantKnowledgeItem, SaveKnowledgeInput } from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';

interface UseKnowledgeEditModalParams {
  isOpen: boolean;
  item: AssistantKnowledgeItem | null;
  defaultCategory: 'product' | 'skill';
  onSave: (data: SaveKnowledgeInput) => Promise<void>;
  onClose: () => void;
}

export const useKnowledgeEditModal = ({
  isOpen,
  item,
  defaultCategory,
  onSave,
  onClose,
}: UseKnowledgeEditModalParams) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'product' | 'skill'>('product');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'md' | 'json'>('md');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setTitle(item.title);
        setCategory(item.category);
        setSummary(item.summary || '');
        setContent(item.content || '');
        setFormat(item.format || 'md');
      } else {
        setTitle('');
        setCategory(defaultCategory);
        setSummary('');
        setContent('');
        setFormat('md');
      }
      setActiveTab('write');
      setError(null);
    }
  }, [isOpen, item, defaultCategory]);

  const insertFormat = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 0);
  };

  const applyBold = () => insertFormat('**', '**', 'teks tebal');
  const applyItalic = () => insertFormat('*', '*', 'teks miring');
  const applyUnderline = () => insertFormat('<u>', '</u>', 'teks garis bawah');
  const applyStrikethrough = () => insertFormat('~~', '~~', 'teks coret');
  const applyInlineCode = () => insertFormat('`', '`', 'kode');
  const applyCodeBlock = () => insertFormat('\n```json\n', '\n```\n', '{\n  "status": "ok"\n}');
  const applyHeading1 = () => insertFormat('\n# ', '\n', 'Judul Utama');
  const applyHeading2 = () => insertFormat('\n## ', '\n', 'Sub Judul');
  const applyHeading3 = () => insertFormat('\n### ', '\n', 'Bagian Modul');
  const applyBulletList = () => insertFormat('\n- ', '\n- Item berikutnya', 'Poin 1');
  const applyNumberedList = () => insertFormat('\n1. ', '\n2. Langkah berikutnya', 'Langkah 1');
  const applyBlockquote = () => insertFormat('\n> ', '\n', 'Catatan penting atau kutipan...');
  const applyLink = () => insertFormat('[', '](https://example.com)', 'Teks tautan');
  const applyTable = () =>
    insertFormat(
      '\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| :--- | :--- | :--- |\n| Nilai 1 | Nilai 2 | Nilai 3 |\n',
      '',
      ''
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tidak boleh kosong');
      return;
    }
    if (!content.trim()) {
      setError('Konten tidak boleh kosong');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: item?.id,
        title: title.trim(),
        category,
        summary: summary.trim(),
        content: content.trim(),
        format,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    category,
    setCategory,
    summary,
    setSummary,
    content,
    setContent,
    format,
    setFormat,
    activeTab,
    setActiveTab,
    isSubmitting,
    error,
    textareaRef,
    handleSubmit,
    // Formatting tools
    tools: {
      applyBold,
      applyItalic,
      applyUnderline,
      applyStrikethrough,
      applyInlineCode,
      applyCodeBlock,
      applyHeading1,
      applyHeading2,
      applyHeading3,
      applyBulletList,
      applyNumberedList,
      applyBlockquote,
      applyLink,
      applyTable,
    },
  };
};


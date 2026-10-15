'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getService } from '@/src/core/di/container';
import { CLIENT_DI_TOKENS } from '@/src/core/di/tokens';
import {
  AssistantKnowledgeItem,
  SaveKnowledgeInput,
} from '@/src/client/domain/assistant-knowledge/entity/knowledge_item';
import { useAIStore } from '@/src/client/presentation/stores/aiStore';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';

export const useKnowledgeBaseExplorer = () => {
  const knowledgeUseCase = useMemo(
    () => getService(CLIENT_DI_TOKENS.knowledgeUseCase),
    []
  );

  const { addToast } = useUIStore();
  const { sendMessage, setActiveStudioTab } = useAIStore();

  const [items, setItems] = useState<AssistantKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'product' | 'skill'>('all');
  const [selectedSection, setSelectedSection] = useState<AssistantKnowledgeItem | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AssistantKnowledgeItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AssistantKnowledgeItem | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await knowledgeUseCase.getItems();
      setItems(data);
      if (data.length > 0) {
        setSelectedSection((prev) => {
          if (!prev) return data[0];
          const found = data.find((it) => it.id === prev.id && it.category === prev.category);
          return found || data[0];
        });
      } else {
        setSelectedSection(null);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memuat Knowledge',
        description: err?.message || 'Terjadi kesalahan saat memuat data',
      });
    } finally {
      setLoading(false);
    }
  }, [knowledgeUseCase, addToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredSections = useMemo(() => {
    let result = items;
    if (activeCategory !== 'all') {
      result = result.filter((it) => it.category === activeCategory);
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return result;

    return result.filter((sec) => (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.content.toLowerCase().includes(q) ||
      sec.id.toLowerCase().includes(q)
    ));
  }, [items, activeCategory, searchQuery]);

  // Keep selected section valid when filter changes
  useEffect(() => {
    if (filteredSections.length > 0) {
      if (!selectedSection || !filteredSections.some((s) => s.id === selectedSection.id && s.category === selectedSection.category)) {
        setSelectedSection(filteredSections[0]);
      }
    } else {
      setSelectedSection(null);
    }
  }, [filteredSections, selectedSection]);

  const openCreateModal = () => {
    setItemToEdit(null);
    setIsEditModalOpen(true);
  };

  const openEditModal = (item: AssistantKnowledgeItem) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async (input: SaveKnowledgeInput) => {
    const saved = await knowledgeUseCase.saveItem(input);
    await loadItems();
    setSelectedSection(saved);
    addToast({
      type: 'success',
      title: 'Tersimpan',
      description: `${input.title} berhasil disimpan`,
    });
  };

  const handleDeleteItem = async (item: AssistantKnowledgeItem) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus "${item.title}"?`);
    if (!confirmed) return;

    try {
      const ok = await knowledgeUseCase.deleteItem(item.category, item.id);
      if (ok) {
        addToast({
          type: 'success',
          title: 'Berhasil Dihapus',
          description: `"${item.title}" telah dihapus`,
        });
        await loadItems();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        description: err?.message || 'Tidak dapat menghapus item',
      });
    }
  };

  const handleExportSingle = (item: AssistantKnowledgeItem, asZip = false) => {
    const url = knowledgeUseCase.getExportUrl(item.category, item.id, asZip);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'info',
      title: 'Mengunduh File',
      description: `Mengunduh ${item.title}${asZip ? ' (.zip)' : ''}...`,
    });
  };

  const handleExportAllSkillsZip = () => {
    const url = knowledgeUseCase.getAllSkillsZipExportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'info',
      title: 'Mengunduh Semua Skills',
      description: 'Mengunduh seluruh file skills dalam format .zip...',
    });
  };

  const handleImportFile = async (category: 'product' | 'skill', file: File) => {
    const result = await knowledgeUseCase.importFile(category, file);
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Import Berhasil',
        description: result.message,
      });
      await loadItems();
    }
  };

  const askAboutSection = (sec: AssistantKnowledgeItem) => {
    setActiveStudioTab('chat');
    sendMessage(`Jelaskan lebih detail tentang modul "${sec.title}" dan bagaimana implementasinya di Mocking Kita Studio.`);
  };

  return {
    items,
    loading,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    selectedSection,
    setSelectedSection,
    filteredSections,
    // Modals
    isEditModalOpen,
    setIsEditModalOpen,
    itemToEdit,
    openCreateModal,
    openEditModal,
    handleSaveItem,
    handleDeleteItem,
    // Import / Export
    isImportModalOpen,
    setIsImportModalOpen,
    handleImportFile,
    handleExportSingle,
    handleExportAllSkillsZip,
    // AI Chat
    askAboutSection,
    refreshItems: loadItems,
  };
};

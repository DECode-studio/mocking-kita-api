export interface AssistantKnowledgeItem {
  id: string;
  title: string;
  category: 'product' | 'skill';
  summary: string;
  content: string;
  format: 'md' | 'json';
  keywords?: string[];
  source?: string;
  projectId?: string;
  isFolder?: boolean;
  updatedAt?: string;
}

export interface SaveKnowledgeInput {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category: 'product' | 'skill';
  format?: 'md' | 'json';
  keywords?: string[];
  source?: string;
  projectId?: string;
}


import YAML from 'yaml';
import AdmZip from 'adm-zip';
import { routerAiClient } from '@/src/server/ai/router-ai.client';
import { AssistantKnowledgeItem, SaveKnowledgeInput } from './assistant-knowledge.types';

function formatIsoDate(val?: string | Date | null): string | undefined {
  if (!val) return undefined;
  return typeof val === 'string' ? val : val.toISOString();
}

export class AssistantKnowledgeService {
  private static instance: AssistantKnowledgeService;

  public static getInstance(): AssistantKnowledgeService {
    if (!AssistantKnowledgeService.instance) {
      AssistantKnowledgeService.instance = new AssistantKnowledgeService();
    }
    return AssistantKnowledgeService.instance;
  }

  /**
   * Fetch all items (skills and/or product knowledge) from Router AI
   */
  public async getAllItems(category?: 'product' | 'skill'): Promise<AssistantKnowledgeItem[]> {
    const results: AssistantKnowledgeItem[] = [];

    // 1. Fetch Product Knowledge
    if (!category || category === 'product') {
      try {
        const knowledgeDocs = await routerAiClient.getKnowledge();
        for (const doc of knowledgeDocs) {
          results.push({
            id: String(doc.id),
            title: doc.title,
            category: 'product',
            summary: doc.source || 'Product Knowledge',
            content: doc.content || '',
            format: 'md',
            source: doc.source || 'Product Knowledge',
            projectId: doc.projectId,
            updatedAt: formatIsoDate(doc.updatedAt || doc.createdAt),
          });
        }
      } catch (err: unknown) {
        console.warn('[AssistantKnowledgeService] Gagal memuat product knowledge dari Router AI:', err instanceof Error ? err.message : String(err));
      }
    }

    // 2. Fetch Skills
    if (!category || category === 'skill') {
      try {
        const skills = await routerAiClient.getSkills();
        for (const skill of skills) {
          results.push({
            id: skill.id,
            title: skill.name,
            category: 'skill',
            summary: skill.description || '',
            content: skill.content || '',
            format: 'md',
            keywords: Array.isArray(skill.keywords) ? skill.keywords : [],
            projectId: skill.projectId,
            updatedAt: formatIsoDate(skill.updatedAt || skill.createdAt),
          });
        }
      } catch (err: unknown) {
        console.warn('[AssistantKnowledgeService] Gagal memuat skills dari Router AI:', err instanceof Error ? err.message : String(err));
      }
    }

    return results;
  }

  /**
   * Fetch a single item by category and ID from Router AI
   */
  public async getItemById(
    type: 'product' | 'skill',
    id: string
  ): Promise<AssistantKnowledgeItem | null> {
    if (type === 'skill') {
      const skill = await routerAiClient.getSkill(id);
      if (!skill) return null;
      return {
        id: skill.id,
        title: skill.name,
        category: 'skill',
        summary: skill.description || '',
        content: skill.content || '',
        format: 'md',
        keywords: Array.isArray(skill.keywords) ? skill.keywords : [],
        projectId: skill.projectId,
        updatedAt: formatIsoDate(skill.updatedAt || skill.createdAt),
      };
    } else {
      const doc = await routerAiClient.getKnowledgeItem(id);
      if (!doc) return null;
      return {
        id: String(doc.id),
        title: doc.title,
        category: 'product',
        summary: doc.source || 'Product Knowledge',
        content: doc.content || '',
        format: 'md',
        source: doc.source || 'Product Knowledge',
        projectId: doc.projectId,
        updatedAt: formatIsoDate(doc.updatedAt || doc.createdAt),
      };
    }
  }

  /**
   * Create or update a Knowledge or Skill item in Router AI
   */
  public async saveItem(
    category: 'product' | 'skill',
    input: SaveKnowledgeInput
  ): Promise<AssistantKnowledgeItem> {
    if (category === 'skill') {
      const saved = await routerAiClient.saveSkill({
        id: input.id,
        name: input.title,
        description: input.summary,
        content: input.content,
        keywords: input.keywords,
        projectId: input.projectId,
      });

      return {
        id: saved.id,
        title: saved.name,
        category: 'skill',
        summary: saved.description || '',
        content: saved.content || '',
        format: 'md',
        keywords: Array.isArray(saved.keywords) ? saved.keywords : [],
        projectId: saved.projectId,
        updatedAt: formatIsoDate(saved.updatedAt || saved.createdAt),
      };
    } else {
      const saved = await routerAiClient.saveKnowledge({
        id: input.id,
        title: input.title,
        content: input.content,
        source: input.source || input.summary || 'Product Knowledge',
        projectId: input.projectId,
      });

      return {
        id: String(saved.id),
        title: saved.title,
        category: 'product',
        summary: saved.source || 'Product Knowledge',
        content: saved.content || '',
        format: 'md',
        source: saved.source || 'Product Knowledge',
        projectId: saved.projectId,
        updatedAt: formatIsoDate(saved.updatedAt || saved.createdAt),
      };
    }
  }

  /**
   * Delete an item from Router AI
   */
  public async deleteItem(type: 'product' | 'skill', id: string): Promise<boolean> {
    if (type === 'skill') {
      return await routerAiClient.deleteSkill(id);
    } else {
      return await routerAiClient.deleteKnowledge(id);
    }
  }

  /**
   * Export single item as Markdown file or Zip
   */
  public async exportItem(
    type: 'product' | 'skill',
    id: string,
    asZip = false
  ): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
    const item = await this.getItemById(type, id);
    if (!item) return null;

    const frontmatter: Record<string, unknown> = {
      id: item.id,
      title: item.title,
      category: item.category,
      summary: item.summary,
      ...(item.keywords && item.keywords.length ? { keywords: item.keywords } : {}),
      ...(item.source ? { source: item.source } : {}),
      updatedAt: item.updatedAt || new Date().toISOString(),
    };

    const mdContent = `---\n${YAML.stringify(frontmatter).trim()}\n---\n\n${item.content}\n`;
    const cleanName = item.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');

    if (asZip) {
      const zip = new AdmZip();
      zip.addFile(`${cleanName}.md`, Buffer.from(mdContent, 'utf-8'));
      return {
        buffer: zip.toBuffer(),
        filename: `${cleanName}.zip`,
        contentType: 'application/zip',
      };
    }

    return {
      buffer: Buffer.from(mdContent, 'utf-8'),
      filename: `${cleanName}.md`,
      contentType: 'text/markdown; charset=utf-8',
    };
  }

  /**
   * Export all skills in a single ZIP archive for user backup
   */
  public async exportAllSkillsZip(): Promise<{
    buffer: Buffer;
    filename: string;
    contentType: string;
  }> {
    const skills = await this.getAllItems('skill');
    const zip = new AdmZip();

    for (const skill of skills) {
      const frontmatter: Record<string, unknown> = {
        id: skill.id,
        title: skill.title,
        category: 'skill',
        summary: skill.summary,
        keywords: skill.keywords || [],
        updatedAt: skill.updatedAt || new Date().toISOString(),
      };

      const mdContent = `---\n${YAML.stringify(frontmatter).trim()}\n---\n\n${skill.content}\n`;
      const cleanName = skill.title.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      zip.addFile(`${cleanName}.md`, Buffer.from(mdContent, 'utf-8'));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return {
      buffer: zip.toBuffer(),
      filename: `skills-export-${timestamp}.zip`,
      contentType: 'application/zip',
    };
  }

  /**
   * Helper to parse frontmatter from markdown text
   */
  private parseFrontmatter(text: string): { meta: Record<string, unknown>; body: string } {
    const lines = text.split(/\r?\n/);
    if (!lines[0] || lines[0].trim() !== '---') {
      return { meta: {}, body: text.trim() };
    }
    const endIdx = lines.slice(1).findIndex((l) => l.trim() === '---');
    if (endIdx === -1) return { meta: {}, body: text.trim() };

    try {
      const rawBlock = lines.slice(1, endIdx + 1).join('\n');
      const meta = (YAML.parse(rawBlock) as Record<string, unknown>) || {};
      const body = lines.slice(endIdx + 2).join('\n').trim();
      return { meta, body };
    } catch {
      return { meta: {}, body: text.trim() };
    }
  }

  /**
   * Import file (.md, .json, or .zip) into Router AI
   */
  public async importFile(
    type: 'product' | 'skill',
    file: { name: string; buffer: Buffer }
  ): Promise<{ success: boolean; count: number; message: string }> {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    // Case 1: ZIP Archive of Skills
    if (ext === '.zip') {
      if (type !== 'skill') {
        throw new Error('Impor file ZIP saat ini hanya didukung untuk Skills');
      }

      const zip = new AdmZip(file.buffer);
      const entries = zip.getEntries();
      let importedCount = 0;

      for (const entry of entries) {
        if (entry.isDirectory || entry.entryName.startsWith('.') || entry.entryName.includes('__MACOSX')) {
          continue;
        }

        const entryExt = entry.entryName.slice(entry.entryName.lastIndexOf('.')).toLowerCase();
        if (entryExt !== '.md' && entryExt !== '.json') continue;

        const content = entry.getData().toString('utf-8');
        let title = entry.name.replace(/\.[^/.]+$/, '');
        let summary = '';
        let bodyContent = content;
        let keywords: string[] = [];

        if (entryExt === '.md') {
          const { meta, body } = this.parseFrontmatter(content);
          if (meta.title || meta.name) title = String(meta.title || meta.name);
          if (meta.summary || meta.description) summary = String(meta.summary || meta.description);
          if (meta.keywords) {
            keywords = Array.isArray(meta.keywords)
              ? meta.keywords
              : String(meta.keywords).split(',').map((k) => k.trim()).filter(Boolean);
          }
          bodyContent = body;
        } else if (entryExt === '.json') {
          try {
            const parsed = JSON.parse(content);
            title = parsed.name || parsed.title || title;
            summary = parsed.description || parsed.summary || '';
            bodyContent = parsed.content || parsed.instructions || content;
            if (parsed.keywords) keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
          } catch {
            // fallback
          }
        }

        await routerAiClient.saveSkill({
          name: title,
          description: summary,
          content: bodyContent,
          keywords,
        });
        importedCount++;
      }

      return {
        success: true,
        count: importedCount,
        message: `Berhasil mengimpor ${importedCount} skill dari file ZIP`,
      };
    }

    // Case 2: Single .md or .json file
    const content = file.buffer.toString('utf-8');
    let title = file.name.replace(/\.[^/.]+$/, '');
    let summary = '';
    let bodyContent = content;
    let keywords: string[] = [];
    let source = 'Product Knowledge';

    if (ext === '.md') {
      const { meta, body } = this.parseFrontmatter(content);
      if (meta.title || meta.name) title = String(meta.title || meta.name);
      if (meta.summary || meta.description) summary = String(meta.summary || meta.description);
      if (meta.source) source = String(meta.source);
      if (meta.keywords) {
        keywords = Array.isArray(meta.keywords)
          ? meta.keywords
          : String(meta.keywords).split(',').map((k) => k.trim()).filter(Boolean);
      }
      bodyContent = body;
    } else if (ext === '.json') {
      try {
        const parsed = JSON.parse(content);
        title = parsed.name || parsed.title || title;
        summary = parsed.description || parsed.summary || '';
        bodyContent = parsed.content || parsed.instructions || content;
        source = parsed.source || source;
        if (parsed.keywords) keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      } catch {
        // fallback
      }
    }

    if (type === 'skill') {
      await routerAiClient.saveSkill({
        name: title,
        description: summary,
        content: bodyContent,
        keywords,
      });
      return {
        success: true,
        count: 1,
        message: `Berhasil mengimpor skill "${title}" ke Router AI`,
      };
    } else {
      await routerAiClient.saveKnowledge({
        title,
        content: bodyContent,
        source: source || summary,
      });
      return {
        success: true,
        count: 1,
        message: `Berhasil mengimpor product knowledge "${title}" ke Router AI`,
      };
    }
  }
}

export const assistantKnowledgeService = AssistantKnowledgeService.getInstance();

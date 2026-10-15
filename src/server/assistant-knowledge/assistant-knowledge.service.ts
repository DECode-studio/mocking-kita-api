import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import AdmZip from 'adm-zip';
import {
  getSkillsDirectory,
  getProductKnowledgeDirectory,
  getDirectoryForType,
} from './assistant-knowledge.paths';
import { AssistantKnowledgeItem, SaveKnowledgeInput } from './assistant-knowledge.types';

export class AssistantKnowledgeService {
  private static instance: AssistantKnowledgeService;

  public static getInstance(): AssistantKnowledgeService {
    if (!AssistantKnowledgeService.instance) {
      AssistantKnowledgeService.instance = new AssistantKnowledgeService();
    }
    return AssistantKnowledgeService.instance;
  }

  /**
   * Ensure directories exist and auto-seed initial knowledge if empty
   */
  public ensureDirectories(): void {
    const productDir = getProductKnowledgeDirectory();
    const skillsDir = getSkillsDirectory();

    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    // Check if product dir is empty, seed if so
    const productFiles = fs.readdirSync(productDir).filter((f) => !f.startsWith('.'));
    if (productFiles.length === 0) {
      this.seedProductKnowledge(productDir);
    }

    // Check if skills dir is empty, seed if so
    const skillFiles = fs.readdirSync(skillsDir).filter((f) => !f.startsWith('.'));
    if (skillFiles.length === 0) {
      this.seedSkills(skillsDir);
    }
  }

  private seedProductKnowledge(dir: string): void {
    const extraKnowledgeDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '.extra/assistance/knowledge');
    if (fs.existsSync(extraKnowledgeDir)) {
      const files = fs.readdirSync(extraKnowledgeDir);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        const srcFile = path.join(extraKnowledgeDir, file);
        const destFile = path.join(dir, file);
        fs.copyFileSync(srcFile, destFile);
      }
    }
  }

  private seedSkills(dir: string): void {
    const extraSkillsDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '.extra/assistance/skills');
    const extraSkillsZip = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '.extra/assistance/skills.zip');

    if (fs.existsSync(extraSkillsDir)) {
      const files = fs.readdirSync(extraSkillsDir);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        const srcFile = path.join(extraSkillsDir, file);
        const destFile = path.join(dir, file);
        fs.copyFileSync(srcFile, destFile);
      }
    } else if (fs.existsSync(extraSkillsZip)) {
      const zip = new AdmZip(extraSkillsZip);
      zip.extractAllTo(dir, true);
    }
  }

  /**
   * Helper to format markdown with YAML frontmatter
   */
  private formatMarkdownWithFrontmatter(item: {
    id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    updatedAt?: string;
  }): string {
    const frontmatter: Record<string, any> = {
      id: item.id,
      title: item.title,
      category: item.category,
      summary: item.summary,
      updatedAt: item.updatedAt || new Date().toISOString(),
    };

    const yamlStr = YAML.stringify(frontmatter).trim();
    return `---\n${yamlStr}\n---\n\n${item.content}\n`;
  }

  /**
   * Helper to parse markdown with YAML frontmatter
   */
  private parseMarkdownFile(
    filePath: string,
    defaultCategory: 'product' | 'skill'
  ): AssistantKnowledgeItem {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const baseId = path.basename(filePath, path.extname(filePath));
    const stats = fs.statSync(filePath);

    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (match) {
      try {
        const metadata = YAML.parse(match[1]) || {};
        return {
          id: String(metadata.id || baseId),
          title: String(metadata.title || baseId),
          category: metadata.category === 'skill' ? 'skill' : 'product',
          summary: String(metadata.summary || ''),
          content: match[2].trim(),
          format: 'md',
          updatedAt: metadata.updatedAt || stats.mtime.toISOString(),
        };
      } catch {
        // Fallback to plain content
      }
    }

    // No frontmatter found, derive title from first markdown heading if possible
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : baseId;

    return {
      id: baseId,
      title,
      category: defaultCategory,
      summary: '',
      content: raw.trim(),
      format: 'md',
      updatedAt: stats.mtime.toISOString(),
    };
  }

  /**
   * Helper to parse a JSON knowledge file
   */
  private parseJsonFile(
    filePath: string,
    defaultCategory: 'product' | 'skill'
  ): AssistantKnowledgeItem {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const baseId = path.basename(filePath, path.extname(filePath));
    const stats = fs.statSync(filePath);

    try {
      const data = JSON.parse(raw);
      return {
        id: String(data.id || baseId),
        title: String(data.title || baseId),
        category: data.category === 'skill' ? 'skill' : defaultCategory,
        summary: String(data.summary || ''),
        content: String(data.content || JSON.stringify(data, null, 2)),
        format: 'json',
        updatedAt: data.updatedAt || stats.mtime.toISOString(),
      };
    } catch {
      return {
        id: baseId,
        title: baseId,
        category: defaultCategory,
        summary: '',
        content: raw,
        format: 'json',
        updatedAt: stats.mtime.toISOString(),
      };
    }
  }

  /**
   * Helper to parse a directory representing a skill (e.g. skill-name/SKILL.md)
   */
  private parseSkillDirectory(dirPath: string): AssistantKnowledgeItem | null {
    const baseId = path.basename(dirPath);
    const skillMd = path.join(dirPath, 'SKILL.md');
    const skillJson = path.join(dirPath, 'skill.json');
    const readmeMd = path.join(dirPath, 'README.md');

    if (fs.existsSync(skillMd)) {
      const parsed = this.parseMarkdownFile(skillMd, 'skill');
      return { ...parsed, id: baseId, isFolder: true };
    }
    if (fs.existsSync(skillJson)) {
      const parsed = this.parseJsonFile(skillJson, 'skill');
      return { ...parsed, id: baseId, isFolder: true };
    }
    if (fs.existsSync(readmeMd)) {
      const parsed = this.parseMarkdownFile(readmeMd, 'skill');
      return { ...parsed, id: baseId, isFolder: true };
    }

    return null;
  }

  /**
   * Get all items from both skills and product knowledge directories
   */
  public getAllItems(categoryFilter?: 'product' | 'skill'): AssistantKnowledgeItem[] {
    this.ensureDirectories();
    const items: AssistantKnowledgeItem[] = [];

    if (!categoryFilter || categoryFilter === 'product') {
      const productDir = getProductKnowledgeDirectory();
      if (fs.existsSync(productDir)) {
        const entries = fs.readdirSync(productDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          const fullPath = path.join(productDir, entry.name);
          if (entry.isFile()) {
            if (entry.name.endsWith('.md')) {
              items.push(this.parseMarkdownFile(fullPath, 'product'));
            } else if (entry.name.endsWith('.json')) {
              items.push(this.parseJsonFile(fullPath, 'product'));
            }
          }
        }
      }
    }

    if (!categoryFilter || categoryFilter === 'skill') {
      const skillsDir = getSkillsDirectory();
      if (fs.existsSync(skillsDir)) {
        const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          const fullPath = path.join(skillsDir, entry.name);
          if (entry.isFile()) {
            if (entry.name.endsWith('.md')) {
              items.push(this.parseMarkdownFile(fullPath, 'skill'));
            } else if (entry.name.endsWith('.json')) {
              items.push(this.parseJsonFile(fullPath, 'skill'));
            }
          } else if (entry.isDirectory()) {
            const skillFolder = this.parseSkillDirectory(fullPath);
            if (skillFolder) {
              items.push(skillFolder);
            }
          }
        }
      }
    }

    return items;
  }

  /**
   * Find a single item by type and ID
   */
  public getItemById(type: 'product' | 'skill', id: string): AssistantKnowledgeItem | null {
    this.ensureDirectories();
    const dir = getDirectoryForType(type);
    const sanitizedId = path.basename(id);

    // Try .md
    const mdPath = path.join(dir, `${sanitizedId}.md`);
    if (fs.existsSync(mdPath)) {
      return this.parseMarkdownFile(mdPath, type);
    }

    // Try .json
    const jsonPath = path.join(dir, `${sanitizedId}.json`);
    if (fs.existsSync(jsonPath)) {
      return this.parseJsonFile(jsonPath, type);
    }

    // Try directory if skill
    if (type === 'skill') {
      const folderPath = path.join(dir, sanitizedId);
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        return this.parseSkillDirectory(folderPath);
      }
    }

    return null;
  }

  /**
   * Save (create or update) a knowledge/skill item
   */
  public saveItem(type: 'product' | 'skill', input: SaveKnowledgeInput): AssistantKnowledgeItem {
    this.ensureDirectories();
    const dir = getDirectoryForType(type);

    const id = (input.id || input.title)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `item-${Date.now()}`;

    const format = input.format || 'md';
    const updatedAt = new Date().toISOString();

    if (format === 'json') {
      const filePath = path.join(dir, `${id}.json`);
      const payload = {
        id,
        title: input.title,
        category: type,
        summary: input.summary,
        content: input.content,
        updatedAt,
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      return {
        ...payload,
        format: 'json',
      };
    }

    // Default to markdown with frontmatter
    const filePath = path.join(dir, `${id}.md`);
    const fileContent = this.formatMarkdownWithFrontmatter({
      id,
      title: input.title,
      category: type,
      summary: input.summary,
      content: input.content,
      updatedAt,
    });
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return {
      id,
      title: input.title,
      category: type,
      summary: input.summary,
      content: input.content,
      format: 'md',
      updatedAt,
    };
  }

  /**
   * Delete an item by ID
   */
  public deleteItem(type: 'product' | 'skill', id: string): boolean {
    this.ensureDirectories();
    const dir = getDirectoryForType(type);
    const sanitizedId = path.basename(id);
    let deleted = false;

    const mdPath = path.join(dir, `${sanitizedId}.md`);
    if (fs.existsSync(mdPath)) {
      fs.unlinkSync(mdPath);
      deleted = true;
    }

    const jsonPath = path.join(dir, `${sanitizedId}.json`);
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
      deleted = true;
    }

    if (type === 'skill') {
      const folderPath = path.join(dir, sanitizedId);
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        deleted = true;
      }
    }

    return deleted;
  }

  /**
   * Export a single item as raw file or ZIP (for skill)
   */
  public exportItem(
    type: 'product' | 'skill',
    id: string,
    asZip = false
  ): { filename: string; buffer: Buffer; contentType: string } | null {
    const item = this.getItemById(type, id);
    if (!item) return null;

    const dir = getDirectoryForType(type);
    const sanitizedId = path.basename(id);

    // If exporting as zip (only for skills or folder-based item)
    if (asZip && type === 'skill') {
      const zip = new AdmZip();
      const folderPath = path.join(dir, sanitizedId);
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        zip.addLocalFolder(folderPath, sanitizedId);
      } else {
        // Add the single file into the zip
        const mdPath = path.join(dir, `${sanitizedId}.md`);
        const jsonPath = path.join(dir, `${sanitizedId}.json`);
        if (fs.existsSync(mdPath)) {
          zip.addLocalFile(mdPath);
        } else if (fs.existsSync(jsonPath)) {
          zip.addLocalFile(jsonPath);
        } else {
          // Virtual file from item
          const content = this.formatMarkdownWithFrontmatter(item);
          zip.addFile(`${sanitizedId}/SKILL.md`, Buffer.from(content, 'utf-8'));
        }
      }
      return {
        filename: `${sanitizedId}.zip`,
        buffer: zip.toBuffer(),
        contentType: 'application/zip',
      };
    }

    // Export raw file
    if (item.format === 'json') {
      return {
        filename: `${sanitizedId}.json`,
        buffer: Buffer.from(JSON.stringify(item, null, 2), 'utf-8'),
        contentType: 'application/json',
      };
    }

    const mdContent = this.formatMarkdownWithFrontmatter(item);
    return {
      filename: `${sanitizedId}.md`,
      buffer: Buffer.from(mdContent, 'utf-8'),
      contentType: 'text/markdown; charset=utf-8',
    };
  }

  /**
   * Export all skills as a single ZIP archive
   */
  public exportAllSkillsZip(): { filename: string; buffer: Buffer; contentType: string } {
    this.ensureDirectories();
    const skillsDir = getSkillsDirectory();
    const zip = new AdmZip();

    if (fs.existsSync(skillsDir)) {
      const entries = fs.readdirSync(skillsDir);
      for (const entry of entries) {
        if (entry.startsWith('.')) continue;
        const entryPath = path.join(skillsDir, entry);
        const stat = fs.statSync(entryPath);
        if (stat.isDirectory()) {
          zip.addLocalFolder(entryPath, entry);
        } else if (stat.isFile()) {
          zip.addLocalFile(entryPath);
        }
      }
    }

    return {
      filename: `mock-api-studio-skills-${new Date().toISOString().slice(0, 10)}.zip`,
      buffer: zip.toBuffer(),
      contentType: 'application/zip',
    };
  }

  /**
   * Import file into specified category
   * Supports: .md, .json, and .zip (for skills)
   */
  public importFile(
    type: 'product' | 'skill',
    file: { name: string; buffer: Buffer }
  ): { success: boolean; count: number; message: string } {
    this.ensureDirectories();
    const dir = getDirectoryForType(type);
    const ext = path.extname(file.name).toLowerCase();

    // Handling ZIP import (skills only)
    if (ext === '.zip') {
      if (type !== 'skill') {
        throw new Error('ZIP import is only supported for Skills');
      }

      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();
      let importedCount = 0;

      for (const entry of zipEntries) {
        // Guard against zip slip path traversal
        if (entry.entryName.includes('..') || path.isAbsolute(entry.entryName)) {
          continue;
        }

        const targetPath = path.join(dir, entry.entryName);
        if (entry.isDirectory) {
          fs.mkdirSync(targetPath, { recursive: true });
        } else {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, entry.getData());
          if (entry.entryName.endsWith('.md') || entry.entryName.endsWith('.json')) {
            importedCount++;
          }
        }
      }

      return {
        success: true,
        count: importedCount || 1,
        message: `Successfully imported skill(s) from ZIP archive`,
      };
    }

    // Handling .md or .json
    const baseName = path.basename(file.name);
    const targetPath = path.join(dir, baseName);
    fs.writeFileSync(targetPath, file.buffer);

    return {
      success: true,
      count: 1,
      message: `Successfully imported ${baseName}`,
    };
  }

  /**
   * Get formatted context string for AI System Prompt
   */
  public getFullKnowledgeContext(): string {
    const items = this.getAllItems();
    return items
      .map((item) => {
        return `=== KNOWLEDGE SECTION: ${item.title} (${item.id}) [${item.category.toUpperCase()}] ===\nSummary: ${item.summary}\n\n${item.content}\n`;
      })
      .join('\n---\n\n');
  }
}

export const assistantKnowledgeService = AssistantKnowledgeService.getInstance();


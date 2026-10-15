import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import AdmZip from 'adm-zip';
import { assistantKnowledgeService } from '@/src/server/assistant-knowledge';
import { getSkillsDirectory, getProductKnowledgeDirectory } from '@/src/server/assistant-knowledge/assistant-knowledge.paths';

describe('AssistantKnowledgeService', () => {
  beforeEach(() => {
    assistantKnowledgeService.ensureDirectories();
  });

  it('should ensure directories exist and seed default knowledge and skills', () => {
    const productDir = getProductKnowledgeDirectory();
    const skillsDir = getSkillsDirectory();

    expect(fs.existsSync(productDir)).toBe(true);
    expect(fs.existsSync(skillsDir)).toBe(true);

    const items = assistantKnowledgeService.getAllItems();
    expect(items.length).toBeGreaterThan(0);

    const products = assistantKnowledgeService.getAllItems('product');
    const skills = assistantKnowledgeService.getAllItems('skill');

    expect(products.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
  });

  it('should create, read, update and delete a skill item', () => {
    const testSkill = assistantKnowledgeService.saveItem('skill', {
      title: 'Test Automated Skill',
      summary: 'A test skill for unit testing',
      content: '# Test Skill Instructions\nDo something useful.',
      category: 'skill',
      format: 'md',
    });

    expect(testSkill.id).toBeDefined();

    const retrieved = assistantKnowledgeService.getItemById('skill', testSkill.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Automated Skill');
    expect(retrieved?.summary).toBe('A test skill for unit testing');

    // Update
    const updated = assistantKnowledgeService.saveItem('skill', {
      id: testSkill.id,
      title: 'Test Automated Skill Updated',
      summary: 'Updated summary',
      content: '# Updated Content',
      category: 'skill',
      format: 'md',
    });
    expect(updated.title).toBe('Test Automated Skill Updated');

    // Delete
    const deleted = assistantKnowledgeService.deleteItem('skill', testSkill.id);
    expect(deleted).toBe(true);
    expect(assistantKnowledgeService.getItemById('skill', testSkill.id)).toBeNull();
  });

  it('should export all skills as zip and allow re-importing', () => {
    const exportResult = assistantKnowledgeService.exportAllSkillsZip();
    expect(exportResult.filename).toContain('.zip');
    expect(exportResult.buffer.length).toBeGreaterThan(0);

    // Verify zip validity
    const zip = new AdmZip(exportResult.buffer);
    const entries = zip.getEntries();
    expect(entries.length).toBeGreaterThan(0);

    // Test importing a custom zip
    const customZip = new AdmZip();
    customZip.addFile('test-imported-skill/SKILL.md', Buffer.from('---\ntitle: Imported Skill\nsummary: From ZIP\ncategory: skill\n---\n# Content', 'utf-8'));
    const zipBuffer = customZip.toBuffer();

    const importResult = assistantKnowledgeService.importFile('skill', {
      name: 'test-skill.zip',
      buffer: zipBuffer,
    });

    expect(importResult.success).toBe(true);

    const importedSkill = assistantKnowledgeService.getItemById('skill', 'test-imported-skill');
    expect(importedSkill).not.toBeNull();
    expect(importedSkill?.title).toBe('Imported Skill');

    // Cleanup
    assistantKnowledgeService.deleteItem('skill', 'test-imported-skill');
  });
});


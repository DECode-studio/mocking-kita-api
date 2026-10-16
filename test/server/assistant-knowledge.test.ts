import { describe, it, expect, vi } from 'vitest';
import AdmZip from 'adm-zip';
import { assistantKnowledgeService } from '@/src/server/assistant-knowledge';
import { routerAiClient } from '@/src/server/ai/router-ai.client';

describe('AssistantKnowledgeService (Router AI Integration)', () => {
  it('should fetch skills and product knowledge from Router AI', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        name: 'Mock Generator',
        description: 'Generates API mocks',
        content: '# Instructions',
        keywords: ['mock', 'json'],
        projectId: 'mock-api-studio',
      },
    ];
    const mockKnowledge = [
      {
        id: '1',
        title: 'Architecture Guide',
        content: 'System architecture details',
        source: 'Docs v1',
        projectId: 'mock-api-studio',
      },
    ];

    vi.spyOn(routerAiClient, 'getSkills').mockResolvedValue(mockSkills);
    vi.spyOn(routerAiClient, 'getKnowledge').mockResolvedValue(mockKnowledge);

    const allItems = await assistantKnowledgeService.getAllItems();
    expect(allItems.length).toBe(2);

    const skillsOnly = await assistantKnowledgeService.getAllItems('skill');
    expect(skillsOnly.length).toBe(1);
    expect(skillsOnly[0].title).toBe('Mock Generator');

    const productsOnly = await assistantKnowledgeService.getAllItems('product');
    expect(productsOnly.length).toBe(1);
    expect(productsOnly[0].title).toBe('Architecture Guide');
  });

  it('should create, read, and delete a skill via Router AI', async () => {
    const savedSkill = {
      id: 'skill-test-1',
      name: 'Test Skill',
      description: 'A test skill',
      content: '# Skill Content',
      keywords: ['test'],
      projectId: 'mock-api-studio',
    };

    vi.spyOn(routerAiClient, 'saveSkill').mockResolvedValue(savedSkill);
    vi.spyOn(routerAiClient, 'getSkill').mockResolvedValue(savedSkill);
    vi.spyOn(routerAiClient, 'deleteSkill').mockResolvedValue(true);

    const created = await assistantKnowledgeService.saveItem('skill', {
      title: 'Test Skill',
      summary: 'A test skill',
      content: '# Skill Content',
      category: 'skill',
      keywords: ['test'],
    });

    expect(created.id).toBe('skill-test-1');
    expect(created.title).toBe('Test Skill');

    const retrieved = await assistantKnowledgeService.getItemById('skill', 'skill-test-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Skill');

    const deleted = await assistantKnowledgeService.deleteItem('skill', 'skill-test-1');
    expect(deleted).toBe(true);
  });

  it('should export all skills as a valid zip archive', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        name: 'Export Test Skill',
        description: 'Test Description',
        content: '# Test Instructions',
        keywords: ['export'],
        projectId: 'mock-api-studio',
      },
    ];

    vi.spyOn(routerAiClient, 'getSkills').mockResolvedValue(mockSkills);

    const exportResult = await assistantKnowledgeService.exportAllSkillsZip();
    expect(exportResult.filename).toContain('.zip');
    expect(exportResult.buffer.length).toBeGreaterThan(0);

    const zip = new AdmZip(exportResult.buffer);
    const entries = zip.getEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].entryName).toContain('export-test-skill.md');
  });
});

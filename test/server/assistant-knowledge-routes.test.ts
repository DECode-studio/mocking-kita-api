import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getKnowledge, POST as saveKnowledge, DELETE as deleteKnowledge } from '@/src/app/api/assistant/knowledge/route';
import { GET as exportKnowledge } from '@/src/app/api/assistant/knowledge/export/route';
import { POST as importKnowledge } from '@/src/app/api/assistant/knowledge/import/route';

describe('Assistant Knowledge API Routes', () => {
  it('GET /api/assistant/knowledge should return list of items', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/knowledge');
    const res = await getKnowledge(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toBe(false);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('POST & DELETE /api/assistant/knowledge should create and delete item', async () => {
    const postReq = new NextRequest('http://localhost:3000/api/assistant/knowledge', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Route Test Skill',
        summary: 'Testing route creation',
        content: '# Route Skill Content',
        category: 'skill',
        format: 'md',
      }),
    });

    const postRes = await saveKnowledge(postReq);
    const postBody = await postRes.json();

    expect(postRes.status).toBe(200);
    expect(postBody.data.id).toBeDefined();

    // Delete
    const deleteReq = new NextRequest(`http://localhost:3000/api/assistant/knowledge?type=skill&id=${postBody.data.id}`, {
      method: 'DELETE',
    });
    const deleteRes = await deleteKnowledge(deleteReq);
    const deleteBody = await deleteRes.json();

    expect(deleteRes.status).toBe(200);
    expect(deleteBody.error).toBe(false);
  });

  it('GET /api/assistant/knowledge/export?allSkillsZip=true should export zip archive', async () => {
    const req = new NextRequest('http://localhost:3000/api/assistant/knowledge/export?allSkillsZip=true');
    const res = await exportKnowledge(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/zip');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename=');
  });
});


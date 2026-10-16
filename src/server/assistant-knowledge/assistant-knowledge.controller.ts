import { NextRequest, NextResponse } from 'next/server';
import { assistantKnowledgeService } from './assistant-knowledge.service';
import { SaveKnowledgeInput } from './assistant-knowledge.types';

export class AssistantKnowledgeController {
  public async getItems(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category') as 'product' | 'skill' | null;
      const items = await assistantKnowledgeService.getAllItems(category || undefined);

      return NextResponse.json({
        error: false,
        code: 200,
        message: 'Knowledge items retrieved successfully',
        data: items,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to retrieve knowledge items' },
        { status: 500 }
      );
    }
  }

  public async getItem(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const type = (searchParams.get('type') || 'product') as 'product' | 'skill';
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: true, code: 400, message: 'Item ID is required' },
          { status: 400 }
        );
      }

      const item = await assistantKnowledgeService.getItemById(type, id);
      if (!item) {
        return NextResponse.json(
          { error: true, code: 404, message: 'Item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        error: false,
        code: 200,
        message: 'Item retrieved successfully',
        data: item,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to retrieve item' },
        { status: 500 }
      );
    }
  }

  public async saveItem(req: NextRequest): Promise<NextResponse> {
    try {
      const body = (await req.json()) as SaveKnowledgeInput;
      if (!body.title || !body.content || !body.category) {
        return NextResponse.json(
          { error: true, code: 400, message: 'Title, content, and category are required' },
          { status: 400 }
        );
      }

      const saved = await assistantKnowledgeService.saveItem(body.category, body);
      return NextResponse.json({
        error: false,
        code: 200,
        message: 'Knowledge item saved successfully',
        data: saved,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to save item' },
        { status: 500 }
      );
    }
  }

  public async deleteItem(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const type = (searchParams.get('type') || 'product') as 'product' | 'skill';
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { error: true, code: 400, message: 'Item ID is required' },
          { status: 400 }
        );
      }

      const deleted = await assistantKnowledgeService.deleteItem(type, id);
      if (!deleted) {
        return NextResponse.json(
          { error: true, code: 404, message: 'Item not found or could not be deleted' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        error: false,
        code: 200,
        message: 'Item deleted successfully',
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to delete item' },
        { status: 500 }
      );
    }
  }

  public async exportItem(req: NextRequest): Promise<Response> {
    try {
      const { searchParams } = new URL(req.url);
      const allSkillsZip = searchParams.get('allSkillsZip') === 'true';

      if (allSkillsZip) {
        const result = await assistantKnowledgeService.exportAllSkillsZip();
        return new Response(result.buffer as any, {
          headers: {
            'Content-Type': result.contentType,
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        });
      }

      const type = (searchParams.get('type') || 'product') as 'product' | 'skill';
      const id = searchParams.get('id');
      const asZip = searchParams.get('asZip') === 'true';

      if (!id) {
        return NextResponse.json(
          { error: true, code: 400, message: 'Item ID is required' },
          { status: 400 }
        );
      }

      const result = await assistantKnowledgeService.exportItem(type, id, asZip);
      if (!result) {
        return NextResponse.json(
          { error: true, code: 404, message: 'Item not found for export' },
          { status: 404 }
        );
      }

      return new Response(result.buffer as any, {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to export item' },
        { status: 500 }
      );
    }
  }

  public async importFile(req: NextRequest): Promise<NextResponse> {
    try {
      const formData = await req.formData();
      const type = (formData.get('type') as string || 'product') as 'product' | 'skill';
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: true, code: 400, message: 'File is required' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await assistantKnowledgeService.importFile(type, {
        name: file.name,
        buffer,
      });

      return NextResponse.json({
        error: false,
        code: 200,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: true, code: 500, message: error?.message || 'Failed to import file' },
        { status: 500 }
      );
    }
  }
}

export const assistantKnowledgeController = new AssistantKnowledgeController();

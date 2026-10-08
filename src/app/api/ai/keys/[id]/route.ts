import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/src/server/ai/api-key-manager';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();
    const updated = await apiKeyManager.updateKey(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'API Key berhasil diperbarui',
      key: {
        id: updated.id,
        name: updated.name,
        keyHint: updated.keyHint,
        priority: updated.priority,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui API Key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    await apiKeyManager.deleteKey(params.id);
    return NextResponse.json({
      success: true,
      message: 'API Key berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus API Key' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getFaqs } from './faq.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const faqs = getFaqs(search);
    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

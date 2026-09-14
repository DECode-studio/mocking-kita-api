import { NextRequest, NextResponse } from 'next/server';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { getFaqs } from './faq.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const faqs = getFaqs(search);
    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    return jsonUnknownError('Failed to fetch FAQs', error, 'Failed to fetch FAQs', 'FAQ_FETCH_FAILED');
  }
}

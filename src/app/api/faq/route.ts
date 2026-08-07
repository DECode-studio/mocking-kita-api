import { NextRequest, NextResponse } from 'next/server';
import { faqDataSource } from '@/src/data/faq/data_source/faq_data_source_impl';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const faqs = faqDataSource.getFaqs(search);
    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

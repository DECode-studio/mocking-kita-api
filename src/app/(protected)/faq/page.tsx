import FaqView from '@/src/presentation/views/faq/FaqView';
import { createFaqUseCase } from '@/src/domain/faq';

export const runtime = 'nodejs';

export default async function FaqPage() {
  const faqUseCase = createFaqUseCase();
  const initialFaqs = await faqUseCase.getFaqs();

  return <FaqView initialFaqs={initialFaqs} />;
}

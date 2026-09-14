import FaqView from '@/src/client/presentation/views/faq/FaqView';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';

export const runtime = 'nodejs';

export default async function FaqPage() {
  const faqUseCase = getService(CLIENT_DI_TOKENS.faqUseCase);
  const initialFaqs = await faqUseCase.getFaqs();

  return <FaqView initialFaqs={initialFaqs} />;
}

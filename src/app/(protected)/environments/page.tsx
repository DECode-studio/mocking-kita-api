import { Suspense } from 'react';
import { EnvironmentsView } from '@/src/client/presentation/views/environments';

export default function EnvironmentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading environments...</div>}>
      <EnvironmentsView />
    </Suspense>
  );
}


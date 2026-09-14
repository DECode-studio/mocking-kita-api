import { DashboardLayout } from '@/src/client/presentation/components/layout/DashboardLayout';
import type { ReactNode } from 'react';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

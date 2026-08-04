import { DashboardLayout } from '@/src/presentation/components/layout/DashboardLayout';
import type { ReactNode } from 'react';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

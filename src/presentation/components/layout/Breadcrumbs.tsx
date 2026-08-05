'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || pathSegments[0] === 'sign-in') return null;

  const breadcrumbItems: Array<{ label: string; href: string }> = [
    { label: 'Dashboard', href: '/dashboard' },
  ];

  if (pathSegments[0] === 'projects') {
    breadcrumbItems.push({ label: 'Projects', href: '/projects' });

    if (pathSegments[1]) {
      const projectId = pathSegments[1];
      breadcrumbItems.push({ label: 'Project Detail', href: `/projects/${projectId}` });

      if (pathSegments[2] === 'environments') {
        breadcrumbItems.push({ label: 'Environments', href: `/projects/${projectId}/environments` });
      } else if (pathSegments[2] === 'apis') {
        breadcrumbItems.push({ label: 'APIs', href: `/projects/${projectId}/apis` });

        if (pathSegments[3]) {
          const apiId = pathSegments[3];
          breadcrumbItems.push({ label: 'API Detail', href: `/projects/${projectId}/apis/${apiId}` });
        }
      }
    }
  } else if (pathSegments[0] === 'settings') {
    breadcrumbItems.push({ label: 'Settings', href: '/settings' });
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
      <Link
        href="/dashboard"
        className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {breadcrumbItems.map((item, idx) => (
        <React.Fragment key={item.href + idx}>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
          {idx === breadcrumbItems.length - 1 ? (
            <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-37.5 sm:max-w-50 truncate">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors max-w-30 truncate"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

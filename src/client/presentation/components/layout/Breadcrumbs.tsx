'use client';


import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '@/src/core/constants/routes';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || pathSegments[0] === 'sign-in') return null;

  const breadcrumbItems: Array<{ label: string; href: string }> = [
    { label: 'Dashboard', href: ROUTES.DASHBOARD },
  ];

  if (pathSegments[0] === 'projects') {
    breadcrumbItems.push({ label: 'Projects', href: ROUTES.PROJECTS });

    if (pathSegments[1]) {
      const projectId = pathSegments[1];
      breadcrumbItems.push({ label: 'Project Detail', href: ROUTES.PROJECT_DETAIL(projectId) });

      if (pathSegments[2] === 'apis' && pathSegments[3]) {
        const apiId = pathSegments[3];
        breadcrumbItems.push({ label: 'API Detail', href: ROUTES.API_DETAIL(projectId, apiId) });

        if (pathSegments[4] === 'request-scenarios') {
          if (pathSegments[5] === 'create') {
            breadcrumbItems.push({ label: 'New Request Scenario', href: pathname });
          } else if (pathSegments[6] === 'edit') {
            breadcrumbItems.push({ label: 'Edit Request Scenario', href: pathname });
          }
        }
      }
    }
  } else if (pathSegments[0] === 'settings') {
    breadcrumbItems.push({ label: 'Settings', href: ROUTES.SETTINGS });
  } else if (pathSegments[0] === 'account-settings') {
    breadcrumbItems.push({ label: 'Account Settings', href: ROUTES.ACCOUNT_SETTINGS });
  } else if (pathSegments[0] === 'admin') {
    if (pathSegments[1] === 'accounts') {
      breadcrumbItems.push({ label: 'Admin Accounts', href: ROUTES.ADMIN_ACCOUNTS });
    }
  } else if (pathSegments[0] === 'change-logs') {
    breadcrumbItems.push({ label: 'Change Logs', href: ROUTES.CHANGE_LOGS });
  } else if (pathSegments[0] === 'faq') {
    breadcrumbItems.push({ label: 'FAQ', href: ROUTES.FAQ });
  } else if (pathSegments[0] === 'external-api-docs') {
    breadcrumbItems.push({ label: 'External API Docs', href: ROUTES.EXTERNAL_API_DOCS });
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
      <Link
        href={ROUTES.DASHBOARD}
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
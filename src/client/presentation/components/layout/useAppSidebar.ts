'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useThemeStore } from '@/src/core/theme/themeStore';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { useAuthStore } from '@/src/client/presentation/stores/authStore';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { Project } from '@/src/client/domain/project/entity/project';
import { ProjectUseCase } from '@/src/client/domain/project/usecase/project_usecase';



export function useAppSidebar(customProjectUseCase?: ProjectUseCase) {
  const { theme, setTheme } = useThemeStore();
  const { session } = useAuthStore();
  const {
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();

  const projectUseCase = useMemo(
    () => customProjectUseCase || getService(CLIENT_DI_TOKENS.projectUseCase),
    [customProjectUseCase]
  );

  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        const projects = await projectUseCase.getAll();
        if (isMounted) {
          const activeProjects = projects.filter((p) => !p.deletedAt);
          setRecentProjects(activeProjects.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recent projects in sidebar', err);
      }
    };
    void fetchProjects();
    return () => {
      isMounted = false;
    };
  }, [projectUseCase, pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    toggleTheme,
    session,
    pathname,
    router,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    recentProjects,
  };
}

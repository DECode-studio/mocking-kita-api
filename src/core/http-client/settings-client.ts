import { apiRequest } from './api-client';
import type { ThemeMode } from '@/src/core/theme/theme-types';

export async function getThemeSetting(): Promise<ThemeMode> {
  const res = await apiRequest<{ theme: ThemeMode }>('/api/settings');
  return res.theme;
}

export async function setThemeSetting(theme: ThemeMode): Promise<ThemeMode> {
  const res = await apiRequest<{ theme: ThemeMode }>('/api/settings', {
    method: 'PUT',
    body: { theme },
  });
  return res.theme;
}

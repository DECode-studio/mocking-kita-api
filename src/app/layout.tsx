import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mock API Studio',
  description: 'Offline-first mock API editor and local engine.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const rawSettings = cookieStore.get('mock-api-studio-settings')?.value;
  const theme = rawSettings ? (() => {
    try {
      const parsed = JSON.parse(rawSettings);
      return parsed?.theme;
    } catch {
      return null;
    }
  })() : null;
  const isDark = theme === 'dark';

  return (
    <html lang="en" className={isDark ? 'dark' : undefined} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

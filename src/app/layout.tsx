import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Mocking Kita Studio',
  description: 'Offline-first mock API editor and local engine.',
  icons: {
    icon: '/app-icon.png',
    shortcut: '/app-icon.png',
    apple: '/app-icon.png',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const rawSettings = cookieStore.get('mock-api-studio-settings')?.value;
  let theme: string | null = null;
  if (rawSettings) {
    try {
      const parsed = JSON.parse(rawSettings);
      theme = parsed?.theme;
    } catch {}
  }
  const isDark = theme ? theme === 'dark' : true;

  return (
    <html lang="en" className={isDark ? 'dark' : undefined} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import React from 'react';
import { ExternalApiDocsView } from '@/src/client/presentation/views/external-api-docs';

export const metadata = {
  title: 'External Integration API Docs & Playground | Mock API Studio',
  description: 'Interactive documentation and live testing playground for external integration REST APIs.',
};

export default function ExternalApiDocsPage() {
  return <ExternalApiDocsView />;
}

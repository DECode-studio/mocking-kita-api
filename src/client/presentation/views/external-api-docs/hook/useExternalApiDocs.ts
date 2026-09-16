import { useState } from 'react';
import { EXTERNAL_ENDPOINTS, ExternalEndpointSpec } from '../constant';

export function useExternalApiDocs() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [copiedPostman, setCopiedPostman] = useState(false);

  const [testingSpec, setTestingSpec] = useState<ExternalEndpointSpec | null>(null);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  const categories = ['All', 'Authentication', 'APIs', 'Request Scenarios', 'Response Scenarios', 'OpenAPI Import'];

  const filteredEndpoints = EXTERNAL_ENDPOINTS.filter((ep) => {
    const matchesCategory = activeCategory === 'All' || ep.category === activeCategory;
    const matchesQuery =
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleTestEndpoint = (spec: ExternalEndpointSpec) => {
    setTestingSpec(spec);
    setIsPlaygroundOpen(true);
  };

  const handleDownloadOpenApiJson = () => {
    window.open('/api/v1/external/openapi.json', '_blank');
  };

  const handleCopyPostmanUrl = () => {
    const fullUrl = `${window.location.origin}/api/v1/external/openapi.json`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPostman(true);
    setTimeout(() => setCopiedPostman(false), 2000);
  };

  return {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    authToken,
    setAuthToken,
    copiedPostman,
    testingSpec,
    isPlaygroundOpen,
    setIsPlaygroundOpen,
    categories,
    filteredEndpoints,
    handleTestEndpoint,
    handleDownloadOpenApiJson,
    handleCopyPostmanUrl,
  };
}

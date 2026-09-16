import { useState } from 'react';
import { ExternalEndpointSpec } from '../constant';

export function useEndpointCard(spec: ExternalEndpointSpec, authToken: string) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'curl'>('request');
  const [activeResponseIdx, setActiveResponseIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const methodColorClass =
    spec.method === 'GET'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
      : spec.method === 'POST'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
      : spec.method === 'PUT'
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      : 'bg-rose-500/10 text-rose-500 border-rose-500/30';

  const generateCurl = (): string => {
    let curl = `curl -X ${spec.method} "http://localhost:3000${spec.path}"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    if (spec.requiresAuth) {
      if (authToken) {
        curl += ` \\\n  -H "Authorization: Bearer ${authToken}"`;
      } else {
        curl += ` \\\n  -H "x-api-key: your-api-key"`;
      }
    }
    if (['POST', 'PUT', 'PATCH'].includes(spec.method) && spec.requestBodyExample) {
      curl += ` \\\n  -d '${JSON.stringify(spec.requestBodyExample)}'`;
    }
    return curl;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return {
    isExpanded,
    toggleExpanded,
    activeTab,
    setActiveTab,
    activeResponseIdx,
    setActiveResponseIdx,
    copiedCode,
    methodColorClass,
    generateCurl,
    handleCopy,
  };
}

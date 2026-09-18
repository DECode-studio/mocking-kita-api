import { ScenarioFlowsListView } from '@/src/client/presentation/views/scenario-flows';

interface ScenarioFlowsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ScenarioFlowsPage({ params }: ScenarioFlowsPageProps) {
  const { projectId } = await params;
  return <ScenarioFlowsListView projectId={projectId} />;
}

import { ScenarioFlowDetailView } from '@/src/client/presentation/views/scenario-flow-detail';

interface ScenarioFlowDetailPageProps {
  params: Promise<{ projectId: string; flowId: string }>;
}

export default async function ScenarioFlowDetailPage({ params }: ScenarioFlowDetailPageProps) {
  const { projectId, flowId } = await params;
  return <ScenarioFlowDetailView projectId={projectId} flowId={flowId} />;
}

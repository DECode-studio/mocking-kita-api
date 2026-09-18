import { ScenarioFlowDetailView } from '@/src/client/presentation/views/scenario-flow-detail';

interface GlobalScenarioFlowDetailPageProps {
  params: Promise<{ flowId: string }>;
}

export default async function GlobalScenarioFlowDetailPage({
  params,
}: GlobalScenarioFlowDetailPageProps) {
  const { flowId } = await params;
  return <ScenarioFlowDetailView flowId={flowId} />;
}

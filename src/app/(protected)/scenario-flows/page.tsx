import { ScenarioFlowsListView } from '@/src/client/presentation/views/scenario-flows';

export default async function GlobalScenarioFlowsPage() {
  // Global scenario flows page (no projectId specified -> loads all across projects)
  return <ScenarioFlowsListView />;
}

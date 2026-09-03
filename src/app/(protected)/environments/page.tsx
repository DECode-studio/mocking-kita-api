import EnvironmentsView from '@/src/presentation/views/environments/EnvironmentsView';
import { listEnvironments } from '@/src/data/environment/api/environment_api_client';

export default async function EnvironmentsPage() {
  const initialEnvironments = await listEnvironments();
  return <EnvironmentsView initialEnvironments={initialEnvironments} />;
}

import { DataSheetsListView } from '@/src/client/presentation/views/data-sheets';

interface DataSheetsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDataSheetsPage({ params }: DataSheetsPageProps) {
  const { projectId } = await params;
  return <DataSheetsListView projectId={projectId} />;
}

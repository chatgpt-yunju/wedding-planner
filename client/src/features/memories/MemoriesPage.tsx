import MemoryTimeline from './MemoryTimeline';

interface MemoriesPageProps {
  coupleId: string;
}

export default function MemoriesPage({ coupleId }: MemoriesPageProps) {
  return <MemoryTimeline coupleId={coupleId} />;
}

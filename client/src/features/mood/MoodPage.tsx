import MoodTracker from './MoodTracker';
import MoodCalendar from './MoodCalendar';

interface MoodPageProps {
  coupleId: string;
}

export default function MoodPage({ coupleId }: MoodPageProps) {
  return (
    <div className="space-y-6">
      <MoodTracker coupleId={coupleId} />
      <MoodCalendar coupleId={coupleId} />
    </div>
  );
}

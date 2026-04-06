import { useState } from 'react';
import CalendarView from './CalendarView';
import TaskList from '../tasks/TaskList';

interface CalendarPageProps {
  coupleId: string;
}

export default function CalendarPage({ coupleId }: CalendarPageProps) {
  const [, setRefreshKey] = useState(0);

  const handleTaskUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  // 默认婚礼日期（1年后）
  const weddingDate = new Date();
  weddingDate.setFullYear(weddingDate.getFullYear() + 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📅 智能日历</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日历视图 */}
        <div className="lg:col-span-2">
          <CalendarView coupleId={coupleId} />
        </div>

        {/* 任务列表（按截止日期） */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">即将到期的任务</h3>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <TaskList coupleId={coupleId} onTaskUpdate={handleTaskUpdate} />
          </div>
        </div>
      </div>

      {/* 倒计时 */}
      <div className="max-w-md">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">距离婚礼还有</h3>
            <p className="text-5xl font-bold mb-2">
              {Math.floor((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-white/80">天</p>
            <p className="text-sm mt-2 text-white/90">
              婚礼日期: {weddingDate.toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

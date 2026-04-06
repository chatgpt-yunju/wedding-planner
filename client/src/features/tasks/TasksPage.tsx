import { useState } from 'react';
import TaskList from './TaskList';
import TaskStats from './TaskStats';
import { Countdown } from '../calendar';

interface TasksPageProps {
  coupleId: string;
}

export default function TasksPage({ coupleId }: TasksPageProps) {
  const [, setRefreshKey] = useState(0);

  const handleTaskUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  // 婚礼日期：1年后（应从用户配置读取）
  const weddingDate = new Date();
  weddingDate.setFullYear(weddingDate.getFullYear() + 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📋 任务管理</h2>
        <span className="text-sm text-gray-500">数据实时同步中</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧任务列表 */}
        <div className="lg:col-span-2">
          <TaskList coupleId={coupleId} onTaskUpdate={handleTaskUpdate} />
        </div>

        {/* 右侧统计和倒计时 */}
        <div className="space-y-6">
          <Countdown weddingDate={weddingDate} />
          <TaskStats coupleId={coupleId} />
        </div>
      </div>
    </div>
  );
}

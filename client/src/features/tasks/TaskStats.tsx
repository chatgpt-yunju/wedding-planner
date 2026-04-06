import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';

interface TaskStatsProps {
  coupleId: string;
}

export default function TaskStats({ coupleId }: TaskStatsProps) {
  const tasks = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray(),
    [coupleId]
  );

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, done: 0, inProgress: 0, todo: 0, completionRate: 0 };

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, todo, completionRate };
  }, [tasks]);

  // SVG 圆环参数
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">任务完成度</h3>

      <div className="flex items-center gap-6">
        {/* 圆环图 */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* 背景圆环 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* 进度圆环 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#ec4899"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl font-bold text-pink-600">{stats.completionRate}%</div>
          </div>
        </div>

        {/* 统计详情 */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              已完成
            </span>
            <span className="font-semibold text-gray-800">{stats.done} / {stats.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              进行中
            </span>
            <span className="font-semibold text-gray-800">{stats.inProgress}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              待办
            </span>
            <span className="font-semibold text-gray-800">{stats.todo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

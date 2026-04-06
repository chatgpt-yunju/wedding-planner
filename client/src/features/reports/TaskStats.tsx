import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Task } from '../../db/index';

interface TaskStatsProps {
  coupleId: string;
}

export default function TaskStats({ coupleId }: TaskStatsProps) {
  const tasks: Task[] = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => t.due_date && t.due_date < Date.now() && t.status !== 'done').length;

    // By category
    const byCategory: Record<string, { total: number; done: number }> = {};
    tasks.forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { total: 0, done: 0 };
      }
      byCategory[t.category].total++;
      if (t.status === 'done') byCategory[t.category].done++;
    });

    return { total, todo, inProgress, done, overdue, byCategory };
  }, [tasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 任务进度报告</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">总任务</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-600 mb-1">待办</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.todo}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">进行中</div>
          <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">已完成</div>
          <div className="text-2xl font-bold text-green-700">{stats.done}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-red-600 mb-1">已逾期</div>
          <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>整体完成度</span>
          <span>{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-pink-500 h-3 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-2">分类完成情况</h4>
        <div className="space-y-2">
          {Object.entries(stats.byCategory).map(([category, data]) => {
            const percent = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
            return (
              <div key={category} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-gray-600 truncate">{category}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="w-12 text-right text-gray-700">
                  {data.done}/{data.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

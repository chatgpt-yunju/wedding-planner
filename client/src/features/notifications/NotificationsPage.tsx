import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Task, Guest } from '../../db/index';

interface NotificationsPageProps {
  coupleId: string;
}

export default function NotificationsPage({ coupleId }: NotificationsPageProps) {
  // 即将到期的任务 (7天内)
  const tasks: Task[] = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted && t.status !== 'done')
        .toArray(),
    [coupleId]
  ) || [];

  const upcomingTasks = useMemo(() => {
    const now = Date.now();
    const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;
    return tasks
      .filter((t) => t.due_date && t.due_date >= now && t.due_date <= sevenDaysLater)
      .sort((a, b) => (a.due_date || 0) - (b.due_date || 0));
  }, [tasks]);

  // 待确认的亲友
  const guests: Guest[] = useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted && g.rsvp_status === 'pending')
        .toArray(),
    [coupleId]
  ) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🔔 通知中心</h2>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">⏰ 即将到期任务 ({upcomingTasks.length})</h3>
        {upcomingTasks.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无即将到期的任务</p>
        ) : (
          <ul className="space-y-3">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="text-xl">📋</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{task.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    分类：{task.category} · 截止：{task.due_date ? new Date(task.due_date).toLocaleDateString('zh-CN') : '未设置'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {task.priority === 'high' ? '高优先级' : '普通'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">📨 待确认亲友 ({guests.length})</h3>
        {guests.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无待确认的亲友</p>
        ) : (
          <ul className="space-y-2">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="text-xl">👤</div>
                  <div>
                    <h4 className="font-medium text-gray-800">{guest.name}</h4>
                    <p className="text-xs text-gray-500">{guest.relationship}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                  待确认
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-blue-700">
          💡 提示：您可以在浏览器设置中开启通知权限，以便及时收到提醒。当前仅支持应用内通知。
        </p>
      </div>
    </div>
  );
}

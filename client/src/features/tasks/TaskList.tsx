import { useState } from 'react';
import { db, type Task } from '../../db/index';
import { useLiveQuery } from 'dexie-react-hooks';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';

interface TaskListProps {
  coupleId: string;
  onTaskUpdate: () => void;
}

const FILTER_OPTIONS = {
  all: '全部',
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

const CATEGORY_FILTER = [
  { value: 'all', label: '全部分类' },
  ...Object.entries({
    venue: '场地',
    catering: '餐饮',
    photography: '摄影',
    videography: '摄像',
    makeup: '化妆',
    dress: '礼服',
    rings: '婚戒',
    florals: '花艺',
    lighting: '灯光',
    sound: '音响',
    favors: '伴手礼',
    invitation: '请柬',
    transportation: '交通',
    accommodation: '住宿',
    other: '其他',
  }).map(([value, label]) => ({ value, label })),
];

export default function TaskList({ coupleId, onTaskUpdate }: TaskListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 使用 useLiveQuery 实现实时响应
  const tasks = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray()
        .then((all) => {
          let filtered = all;
          if (statusFilter !== 'all') {
            filtered = filtered.filter((t) => t.status === statusFilter);
          }
          if (categoryFilter !== 'all') {
            filtered = filtered.filter((t) => t.category === categoryFilter);
          }
          // 按截止日期和创建时间排序
          return filtered.sort((a, b) => {
            // 先按状态排序：待办 > 进行中 > 已完成
            const statusOrder = { todo: 0, in_progress: 1, done: 2 };
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            // 再按截止日期（有截止日期的优先）
            if (a.due_date && b.due_date) return a.due_date - b.due_date;
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            return 0;
          });
        }),
    [coupleId, statusFilter, categoryFilter]
  ) || [];

  const handleSubmit = async (taskData: Task) => {
    try {
      await db.tasks.put(taskData);
      onTaskUpdate();
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定删除此任务？')) return;
    try {
      await db.tasks.update(taskId, { _deleted: true });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await db.tasks.update(taskId, { status: newStatus, updatedAt: Date.now() });
      onTaskUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Task['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              {Object.entries(FILTER_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              {CATEGORY_FILTER.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
          >
            + 新建任务
          </button>
        </div>

        {/* 统计 */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{taskStats.total}</div>
            <div className="text-sm text-gray-500">总计</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.todo}</div>
            <div className="text-sm text-gray-500">待办</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{taskStats.in_progress}</div>
            <div className="text-sm text-gray-500">进行中</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
            <div className="text-sm text-gray-500">已完成</div>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            {statusFilter === 'all' && categoryFilter === 'all' ? (
              <>
                <p className="mb-2">还没有任务哦~</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  创建第一个任务
                </button>
              </>
            ) : (
              <p>该筛选条件下没有任务</p>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditingTask}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* 任务表单弹窗 */}
      {showForm && (
        <TaskForm
          coupleId={coupleId}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          initialTask={editingTask || undefined}
        />
      )}
    </div>
  );
}

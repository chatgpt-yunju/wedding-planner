import type { Task } from '../../db/index';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const CATEGORY_LABELS: Record<Task['category'], string> = {
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
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<Task['status'], string> = {
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const isOverdue = task.due_date && task.status !== 'done' && task.due_date < Date.now();

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
      task.status === 'done' ? 'border-green-500 opacity-75' :
      isOverdue ? 'border-red-500' : 'border-pink-500'
    }`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
              {CATEGORY_LABELS[task.category]}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[task.priority || 'medium']}`}>
              {task.priority === 'high' ? '高' : task.priority === 'low' ? '低' : '中'}优先级
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[task.status]}`}>
              {task.status === 'todo' ? '待办' : task.status === 'in_progress' ? '进行中' : '已完成'}
            </span>
          </div>

          <h3 className={`font-semibold text-gray-800 mb-1 ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {task.due_date && (
            <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              📅 截止: {formatDate(task.due_date)}
              {isOverdue && ' (已逾期)'}
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              子任务: {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
              onStatusChange(task.id, nextStatus);
            }}
            className={`p-2 rounded-lg ${
              task.status === 'done'
                ? 'text-green-600 hover:bg-green-50'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title={task.status === 'done' ? '标记为待办' : task.status === 'in_progress' ? '标记为完成' : '标记为进行中'}
          >
            {task.status === 'todo' ? '▶️' : task.status === 'in_progress' ? '✅' : '↩️'}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

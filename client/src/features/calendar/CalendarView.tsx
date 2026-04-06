import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';

interface CalendarViewProps {
  coupleId: string;
}

export default function CalendarView({ coupleId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasks = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => t._deleted !== true && t.due_date !== undefined)
        .toArray(),
    [coupleId]
  );

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: Date[] = [];

    // 上个月的日期
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // 当月日期
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    // 下个月的日期（填满6行）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }, [currentDate]);

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    const timestamp = date.getTime();
    return tasks.filter(
      (t) => t.due_date && Math.floor(t.due_date / (1000 * 60 * 60 * 24)) === Math.floor(timestamp / (1000 * 60 * 60 * 24))
    );
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* 月份导航 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ← 上个月
        </button>
        <h3 className="text-lg font-bold text-gray-800">
          {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          下个月 →
        </button>
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 星期标题 */}
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {/* 日期 */}
        {calendarDays.map((date, idx) => {
          const dayTasks = getTasksForDate(date);
          const hasTasks = dayTasks.length > 0;
          const isCurrentMonthDay = isCurrentMonth(date);
          const isToday_ = isToday(date);

          return (
            <div
              key={idx}
              className={`min-h-24 p-1 border rounded-lg ${
                !isCurrentMonthDay
                  ? 'bg-gray-50 text-gray-400'
                  : isToday_
                  ? 'bg-pink-50 border-pink-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className={`text-sm font-medium ${isToday_ ? 'text-pink-600' : ''}`}>
                {date.getDate()}
              </div>
              {hasTasks && (
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        task.category === 'venue' || task.category === 'catering'
                          ? 'bg-red-100 text-red-700'
                          : task.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} 更多</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-100 border border-pink-300 rounded"></div>
          <span>今天</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span>任务</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span>已完成</span>
        </div>
      </div>
    </div>
  );
}

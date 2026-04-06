import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Mood } from '../../db/index';

interface MoodCalendarProps {
  coupleId: string;
  month?: Date; // 默认当前月
}

const MOOD_COLORS: Record<string, string> = {
  '😊': 'bg-green-400',
  '😌': 'bg-blue-400',
  '😰': 'bg-yellow-400',
  '🥰': 'bg-pink-400',
  '😔': 'bg-purple-400',
  '🎉': 'bg-orange-400',
};

export default function MoodCalendar({ coupleId, month = new Date() }: MoodCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // 查询当月心情记录
  const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
  const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];

  const moods: Mood[] = useLiveQuery(
    () =>
      db.moods
        .where('couple_id')
        .equals(coupleId)
        .and((m) => !m._deleted && m.date >= startDate && m.date <= endDate)
        .toArray(),
    [coupleId, startDate, endDate]
  ) || [];

  // 构建日期映射
  const moodMap = useMemo(() => {
    const map = new Map<string, Mood>();
    moods.forEach((m) => map.set(m.date, m));
    return map;
  }, [moods]);

  // 生成月份天数网格
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0=Sunday

  const weeks = [];
  let week = [];

  // 填充前面的空白
  for (let i = 0; i < firstDayOfWeek; i++) {
    week.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const mood = moodMap.get(dateStr);
    week.push({ day, mood });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const monthName = month.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">📅 {monthName} 心情日历</h3>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <div key={d} className="text-xs font-medium text-gray-500 py-1">
            {d}
          </div>
        ))}
        {weeks.map((week, weekIdx) =>
          week.map((cell, dayIdx) =>
            cell ? (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm
                  ${cell.mood ? MOOD_COLORS[cell.mood.emoji] + ' border-2 border-white shadow-sm' : 'bg-gray-50 border border-gray-100'}
                `}
                title={cell.mood ? `${cell.mood.date} ${cell.mood.text || ''}` : `${cell.day}日`}
              >
                {cell.mood ? cell.mood.emoji : cell.day}
              </div>
            ) : (
              <div key={`${weekIdx}-${dayIdx}`} className="aspect-square" />
            )
          )
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border border-gray-100 rounded"></div>
          <span>无记录</span>
        </div>
        {Object.entries(MOOD_COLORS).map(([emoji, color]) => (
          <div key={emoji} className="flex items-center gap-1">
            <div className={`w-3 h-3 ${color} rounded border border-white shadow-sm`}></div>
            <span>{emoji}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

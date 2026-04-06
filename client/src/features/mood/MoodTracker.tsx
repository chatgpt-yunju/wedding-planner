import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Mood } from '../../db/index';

interface MoodTrackerProps {
  coupleId: string;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: '幸福', color: 'bg-green-100 border-green-300' },
  { emoji: '😌', label: '平静', color: 'bg-blue-100 border-blue-300' },
  { emoji: '😰', label: '焦虑', color: 'bg-yellow-100 border-yellow-300' },
  { emoji: '🥰', label: '兴奋', color: 'bg-pink-100 border-pink-300' },
  { emoji: '😔', label: '疲惫', color: 'bg-purple-100 border-purple-300' },
  { emoji: '🎉', label: '期待', color: 'bg-orange-100 border-orange-300' },
];

const INSPIRATIONAL_QUOTES = [
  "爱情不是寻找一个完美的人，而是学会用完美的眼光欣赏一个不完美的人。",
  "婚姻是两个人共同成长的道路。",
  "最好的关系是：彼此陪伴，共同变好。",
  "爱是恒久忍耐，又有恩慈。",
  "每一天，都因为是你们而变得特别。",
];

export default function MoodTracker({ coupleId }: MoodTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodText, setMoodText] = useState('');
  const [todayMood, setTodayMood] = useState<Mood | null>(null);

  // 查询心情记录
  const moods: Mood[] = useLiveQuery(
    () =>
      db.moods
        .where('couple_id')
        .equals(coupleId)
        .and((m) => !m._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  // 今日心情
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => {
    const todayRecord = moods.find((m) => m.date === today);
    setTodayMood(todayRecord || null);
  }, [moods, today]);

  // 连续记录天数 (简单算法)
  const streakDays = useMemo(() => {
    const sortedDates = [...new Set(moods.map((m) => m.date))].sort().reverse();
    let streak = 0;
    const checkDate = new Date();
    for (const dateStr of sortedDates) {
      const expected = checkDate.toISOString().split('T')[0];
      if (dateStr === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [moods]);

  const handleSaveMood = async () => {
    if (!selectedMood) return;

    try {
      await db.moods.put({
        id: crypto.randomUUID(),
        couple_id: coupleId,
        date: today,
        emoji: selectedMood,
        text: moodText.trim() || undefined,
        updatedAt: Date.now(),
        _deleted: false,
      });
      setSelectedMood(null);
      setMoodText('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  const quote = useMemo(() => {
    return INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
  }, [moods.length]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">😊 心情胶囊</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          {showForm ? '收起' : todayMood ? '修改今日心情' : '记录今日心情'}
        </button>
      </div>

      {/* 今日心情展示 */}
      {todayMood && !showForm && (
        <div className="mb-4 p-4 bg-pink-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{todayMood.emoji}</span>
            <div>
              <p className="font-medium text-gray-800">{MOOD_OPTIONS.find(m => m.emoji === todayMood.emoji)?.label}</p>
              {todayMood.text && <p className="text-sm text-gray-600 mt-1">{todayMood.text}</p>}
              <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('zh-CN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* 暖心语录 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
        <p className="text-sm text-purple-700 italic">"{quote}"</p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{streakDays}</div>
          <div className="text-xs text-blue-600">连续记录天数</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-700">{moods.length}</div>
          <div className="text-xs text-green-600">累计记录</div>
        </div>
      </div>

      {/* 心情日历 - 简化展示最近7天 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">最近心情</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {moods
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 14)
            .map((mood) => (
              <div key={mood.id} className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg border-2 border-white shadow-sm" title={`${mood.date} ${MOOD_OPTIONS.find(o => o.emoji === mood.emoji)?.label}`}>
                {mood.emoji}
              </div>
            ))}
        </div>
      </div>

      {/* 记录表单 */}
      {showForm && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-800 mb-3">选择今日心情</h4>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.emoji}
                onClick={() => setSelectedMood(mood.emoji)}
                className={`
                  p-3 rounded-xl border-2 text-center transition-all
                  ${selectedMood === mood.emoji ? `${mood.color} scale-105` : 'bg-gray-50 border-gray-200 hover:border-pink-300'}
                `}
              >
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-xs text-gray-600">{mood.label}</div>
              </button>
            ))}
          </div>

          {selectedMood && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">一句话记录（可选）</label>
                <textarea
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  placeholder="今天发生了什么..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveMood}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  保存
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

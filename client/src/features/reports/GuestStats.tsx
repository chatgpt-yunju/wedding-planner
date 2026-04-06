import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Guest } from '../../db/index';

interface GuestStatsProps {
  coupleId: string;
}

export default function GuestStats({ coupleId }: GuestStatsProps) {
  const guests: Guest[] = useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const stats = useMemo(() => {
    const total = guests.length;
    const accepted = guests.filter((g) => g.rsvp_status === 'accepted').length;
    const pending = guests.filter((g) => g.rsvp_status === 'pending').length;
    const declined = guests.filter((g) => g.rsvp_status === 'declined').length;
    const withPlusOne = guests.filter((g) => g.rsvp_status === 'accepted' && g.plus_one).length;
    const totalAttending = accepted + withPlusOne;

    // Relationship distribution
    const relationshipCounts: Record<string, number> = {};
    guests.forEach((g) => {
      const rel = g.relationship || '其他';
      relationshipCounts[rel] = (relationshipCounts[rel] || 0) + 1;
    });
    const sortedRelationships = Object.entries(relationshipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      accepted,
      pending,
      declined,
      totalAttending,
      withPlusOne,
      sortedRelationships,
    };
  }, [guests]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 亲友统计</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">总人数</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">已确认</div>
          <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">待确认</div>
          <div className="text-2xl font-bold text-blue-700">{stats.pending}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">预计出席</div>
          <div className="text-2xl font-bold text-purple-700">{stats.totalAttending}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 关系分布 */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">关系分布（Top 10）</h4>
          {stats.sortedRelationships.length > 0 ? (
            <ul className="space-y-2">
              {stats.sortedRelationships.map(([rel, count]) => (
                <li key={rel} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{rel}</span>
                  <span className="font-medium text-gray-800">{count} 人</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无数据</p>
          )}
        </div>

        {/* RSVP 明细 */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">RSVP 明细</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-600">已确认出席</span>
              <span className="text-green-600 font-medium">{stats.accepted} 人</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">携带 +1</span>
              <span className="text-purple-600 font-medium">{stats.withPlusOne} 人</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">待确认</span>
              <span className="text-blue-600 font-medium">{stats.pending} 人</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-600">婉拒</span>
              <span className="text-gray-400 font-medium">{stats.declined} 人</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

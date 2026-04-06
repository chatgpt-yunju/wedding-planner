import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Guest } from '../../db/index';
import GuestForm from './GuestForm';
import GiftLedger from './GiftLedger';
import GuestImportWizard from '../import/GuestImportWizard';

interface GuestListProps {
  coupleId: string;
}

const RELATIONSHIPS = [
  '父母',
  '兄弟姐妹',
  '伴郎/伴娘',
  '同事',
  '同学',
  '朋友',
  '亲戚',
  '客户',
  '其他',
];

export default function GuestList({ coupleId }: GuestListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [showImport, setShowImport] = useState(false);

  const guests = useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  // 搜索和筛选
  const filteredGuests = useMemo(() => {
    let result = guests;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.relationship.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.phone?.includes(q)
      );
    }

    if (filterRsvp !== 'all') {
      result = result.filter((g) => g.rsvp_status === filterRsvp);
    }

    return result;
  }, [guests, searchQuery, filterRsvp]);

  // 统计
  const stats = useMemo(() => {
    const total = guests.length;
    const accepted = guests.filter((g) => g.rsvp_status === 'accepted').length;
    const pending = guests.filter((g) => g.rsvp_status === 'pending').length;
    const declined = guests.filter((g) => g.rsvp_status === 'declined').length;
    const confirmedWithPlusOne = guests.filter((g) => g.rsvp_status === 'accepted' && g.plus_one).length;
    const totalAttending = accepted + confirmedWithPlusOne;
    return { total, accepted, pending, declined, totalAttending };
  }, [guests]);

  const handleSubmit = async (guest: any) => {
    try {
      await db.guests.put(guest);
      setShowForm(false);
      setEditingGuest(null);
    } catch (error) {
      console.error('Failed to save guest:', error);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (!confirm('确定删除此亲友？')) return;
    try {
      await db.guests.update(guestId, { _deleted: true });
    } catch (error) {
      console.error('Failed to delete guest:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">👥 亲友与礼金</h2>
        <button
          onClick={() => {
            setEditingGuest(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
        >
          + 添加亲友
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          导入 Excel
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">总人数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-sm text-gray-500">已确认</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">待确认</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-400">{stats.declined}</div>
          <div className="text-sm text-gray-500">婉拒</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-pink-600">{stats.totalAttending}</div>
          <div className="text-sm text-gray-500">预计出席</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：亲友列表 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* 搜索和筛选 */}
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索姓名、关系、邮箱、电话..."
                className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
              <select
                value={filterRsvp}
                onChange={(e) => setFilterRsvp(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待确认</option>
                <option value="accepted">已确认</option>
                <option value="declined">婉拒</option>
              </select>
            </div>

            {/* 列表 */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">暂无亲友数据</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    添加第一个亲友
                  </button>
                </div>
              ) : (
                filteredGuests.map((guest) => (
                  <GuestCard
                    key={guest.id}
                    guest={guest}
                    onEdit={() => setEditingGuest(guest)}
                    onDelete={() => handleDelete(guest.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧：礼金台账 */}
        <div>
          <GiftLedger coupleId={coupleId} guests={guests} />
        </div>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <GuestForm
          coupleId={coupleId}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingGuest(null);
          }}
          initialGuest={editingGuest || undefined}
          relationships={RELATIONSHIPS}
        />
      )}

      {/* 导入弹窗 */}
      {showImport && (
        <GuestImportWizard
          coupleId={coupleId}
          onComplete={() => setShowImport(false)}
          onCancel={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

interface GuestCardProps {
  guest: Guest;
  onEdit: () => void;
  onDelete: () => void;
}

function GuestCard({ guest, onEdit, onDelete }: GuestCardProps) {
  const rsvpColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-gray-100 text-gray-700',
  };

  const rsvpLabels = {
    pending: '待确认',
    accepted: '已确认',
    declined: '婉拒',
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-800">{guest.name}</h4>
            {guest.plus_one && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                +1
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${rsvpColors[guest.rsvp_status as keyof typeof rsvpColors]}`}>
              {rsvpLabels[guest.rsvp_status as keyof typeof rsvpLabels]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{guest.relationship}</p>
          {guest.email && <p className="text-xs text-gray-500 mb-1">{guest.email}</p>}
          {guest.phone && <p className="text-xs text-gray-500">{guest.phone}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import TableCard from './TableCard';

interface SeatingChartProps {
  coupleId: string;
}

export default function SeatingChart({ coupleId }: SeatingChartProps) {
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(8);

  // 预留：监听拖放事件
  useEffect(() => {
    window.addEventListener('dragover', (e) => e.preventDefault());
    return () => {
      window.removeEventListener('dragover', () => {});
    };
  }, []);

  const tables = useLiveQuery(
    () =>
      db.tables
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const guests = useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted && g.rsvp_status === 'accepted')
        .toArray(),
    [coupleId]
  ) || [];

  // 统计座位占用情况
  const stats = useMemo(() => {
    const totalSeats = tables.reduce((sum, t) => sum + t.max_seats, 0);
    const occupiedSeats = tables.reduce((sum, t) => sum + t.guests.length, 0);
    const unassignedGuests = guests.filter((g) => !g.table_id);
    return { totalSeats, occupiedSeats, unassignedCount: unassignedGuests.length };
  }, [tables, guests]);

  // 未分配的宾客
  const unassignedGuests = useMemo(
    () => guests.filter((g) => !g.table_id),
    [guests]
  );

  const handleCreateTable = async () => {
    if (!newTableName.trim()) return;

    try {
      await db.tables.add({
        id: crypto.randomUUID(),
        couple_id: coupleId,
        name: newTableName.trim(),
        max_seats: newTableSeats,
        guests: [],
        updatedAt: Date.now(),
        _deleted: false,
      });
      setNewTableName('');
      setNewTableSeats(8);
      setShowCreateTable(false);
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('确定删除此桌？该桌的客人将被解除分配')) return;
    try {
      // 先释放该桌所有客人的分配
      await Promise.all(
        tables.find((t) => t.id === tableId)?.guests.map((guestId) =>
          db.guests.update(guestId, { table_id: undefined, updatedAt: Date.now() })
        ) || []
      );
      await db.tables.update(tableId, { _deleted: true });
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    try {
      await db.guests.update(guestId, { table_id: undefined, updatedAt: Date.now() });
    } catch (error) {
      console.error('Failed to remove guest:', error);
    }
  };

  const exportToExcel = () => {
    // TODO: 使用 xlsx 库导出
    alert('导出功能待实现');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🪑 座位表</h2>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            导出 Excel
          </button>
          <button
            onClick={() => setShowCreateTable(true)}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
          >
            + 创建餐桌
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{tables.length}</div>
          <div className="text-sm text-gray-500">餐桌数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.totalSeats}</div>
          <div className="text-sm text-gray-500">总座���数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.occupiedSeats}</div>
          <div className="text-sm text-gray-500">已安排</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{stats.unassignedCount}</div>
          <div className="text-sm text-gray-500">未安排</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：餐桌列表 */}
        <div className="xl:col-span-2 space-y-4">
          {tables.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm">
              <p className="mb-4">还没有创建餐桌</p>
              <button
                onClick={() => setShowCreateTable(true)}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium"
              >
                创建第一个餐桌
              </button>
            </div>
          ) : (
            tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                guests={guests.filter((g) => table.guests.includes(g.id))}
                onRemoveGuest={handleRemoveGuest}
                onDeleteTable={() => handleDeleteTable(table.id)}
                onEditTable={() => setEditingTable(table)}
              />
            ))
          )}
        </div>

        {/* 右侧：未分配宾客 */}
        <div>
          <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-3">
              未安排宾客 ({unassignedGuests.length})
            </h3>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {unassignedGuests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">所有宾客已安排完毕</p>
              ) : (
                unassignedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('guestId', guest.id)}
                    className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 border border-gray-200"
                  >
                    <div className="font-medium text-gray-800">{guest.name}</div>
                    <div className="text-xs text-gray-500">{guest.relationship}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 创建餐桌弹窗 */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">创建餐桌</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">餐桌名称</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="例如：主桌、桌1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">座位数</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 8)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateTable(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTable}
                  disabled={!newTableName.trim()}
                  className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-lg"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑餐桌弹窗 (简化，实际可复用创建表单) */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">编辑餐桌 - {editingTable.name}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  当前 {editingTable.guests.length} / {editingTable.max_seats} 人
                </p>
                <div className="flex flex-wrap gap-2">
                  {editingTable.guests.map((guestId: string) => {
                    const guest = guests.find((g) => g.id === guestId);
                    return (
                      <span key={guestId} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        {guest?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    db.tables.delete(editingTable.id);
                    setEditingTable(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  删除餐桌
                </button>
                <button
                  onClick={() => setEditingTable(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

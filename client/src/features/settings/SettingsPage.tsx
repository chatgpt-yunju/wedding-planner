import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';

interface SettingsPageProps {
  coupleId: string;
}

export default function SettingsPage({ coupleId }: SettingsPageProps) {
  const [message, setMessage] = useState<string | null>(null);

  // Load all data for export
  const allData = useLiveQuery(async () => {
    const [tasks, budgetItems, guests, tables, moods, memories, gifts] = await Promise.all([
      db.tasks.where('couple_id').equals(coupleId).and((t) => !t._deleted).toArray(),
      db.budgetItems.where('couple_id').equals(coupleId).and((b) => !b._deleted).toArray(),
      db.guests.where('couple_id').equals(coupleId).and((g) => !g._deleted).toArray(),
      db.tables.where('couple_id').equals(coupleId).and((t) => !t._deleted).toArray(),
      db.moods.where('couple_id').equals(coupleId).and((m) => !m._deleted).toArray(),
      db.memories.where('couple_id').equals(coupleId).and((m) => !m._deleted).toArray(),
      db.gifts.where('couple_id').equals(coupleId).and((g) => !g._deleted).toArray(),
    ]);
    return { tasks, budgetItems, guests, tables, moods, memories, gifts };
  }, [coupleId]);

  const exportData = useCallback(() => {
    if (!allData) return;
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      coupleId,
      data: allData,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('✅ 数据导出成功');
    setTimeout(() => setMessage(null), 3000);
  }, [allData, coupleId]);

  const importData = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        if (!backup.data || backup.coupleId !== coupleId) {
          setMessage('❌ 无效的备份文件或 couples 不匹配');
          return;
        }
        if (!confirm('导入备份将覆盖当前所有数据，确定继续？')) return;

        await db.transaction('rw', [db.tables, db.guests, db.tasks, db.budgetItems, db.moods, db.memories, db.gifts], async () => {
          // Clear existing data for this couple (hard delete)
          const existing = await Promise.all([
            db.tables.where('couple_id').equals(coupleId).toArray(),
            db.guests.where('couple_id').equals(coupleId).toArray(),
            db.tasks.where('couple_id').equals(coupleId).toArray(),
            db.budgetItems.where('couple_id').equals(coupleId).toArray(),
            db.moods.where('couple_id').equals(coupleId).toArray(),
            db.memories.where('couple_id').equals(coupleId).toArray(),
            db.gifts.where('couple_id').equals(coupleId).toArray(),
          ]);
          const deletions = [
            ...existing[0].map((t) => db.tables.delete(t.id)),
            ...existing[1].map((g) => db.guests.delete(g.id)),
            ...existing[2].map((t) => db.tasks.delete(t.id)),
            ...existing[3].map((b) => db.budgetItems.delete(b.id)),
            ...existing[4].map((m) => db.moods.delete(m.id)),
            ...existing[5].map((m) => db.memories.delete(m.id)),
            ...existing[6].map((g) => db.gifts.delete(g.id)),
          ];
          await Promise.all(deletions);

          // Insert imported data with fresh timestamps? Keep original timestamps maybe.
          const now = Date.now();
          const insertPromises: Promise<any>[] = [];

          backup.data.tasks.forEach((t: any) => {
            insertPromises.push(db.tasks.add({ ...t, updatedAt: now, _deleted: false }));
          });
          backup.data.budgetItems.forEach((b: any) => {
            insertPromises.push(db.budgetItems.add({ ...b, updatedAt: now, _deleted: false }));
          });
          backup.data.guests.forEach((g: any) => {
            insertPromises.push(db.guests.add({ ...g, updatedAt: now, _deleted: false }));
          });
          backup.data.tables.forEach((t: any) => {
            insertPromises.push(db.tables.add({ ...t, updatedAt: now, _deleted: false }));
          });
          backup.data.moods.forEach((m: any) => {
            insertPromises.push(db.moods.add({ ...m, updatedAt: now, _deleted: false }));
          });
          backup.data.memories.forEach((m: any) => {
            insertPromises.push(db.memories.add({ ...m, updatedAt: now, _deleted: false }));
          });
          backup.data.gifts.forEach((g: any) => {
            insertPromises.push(db.gifts.add({ ...g, updatedAt: now, _deleted: false }));
          });

          await Promise.all(insertPromises);
        });

        setMessage('✅ 数据导入成功');
        setTimeout(() => setMessage(null), 3000);
      } catch (err: any) {
        setMessage('❌ 导入失败: ' + err.message);
      }
    },
    [coupleId]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">⚙️ 设置与数据</h2>

      {message && <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">{message}</div>}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">📤 数据导出</h3>
        <p className="text-sm text-gray-600 mb-4">
          将所有备婚数据导出为 JSON 文件，可用于备份或迁移。导出文件包含任务、预算、亲友、座位、心情、回忆、礼金等所有信息。
        </p>
        <button
          onClick={exportData}
          disabled={!allData}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-lg font-medium"
        >
          导出全部数据
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">📥 数据恢复</h3>
        <p className="text-sm text-gray-600 mb-4">
          从之前的备份文件恢复数据。警告：此操作将覆盖当前所有数据，建议先导出当前数据作为备份。
        </p>
        <div className="flex items-center gap-4">
          <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50">
            选择备份文件
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
          <span className="text-sm text-gray-500">支持 .json 格式</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 text-red-600">⚠️ 危险操作</h3>
        <p className="text-sm text-gray-600 mb-4">
          以下操作不可恢复，请谨慎操作。
        </p>
        <button
          onClick={async () => {
            if (confirm('确定要清除所有软删除的记录吗？此操作不可恢复。')) {
              // Could implement purge: hard delete all _deleted records.
              alert('清除功能待实现');
            }
          }}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
        >
          清除已删除数据
        </button>
      </div>
    </div>
  );
}

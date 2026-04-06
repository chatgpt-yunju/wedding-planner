import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Gift } from '../../db/index';

interface GiftLedgerProps {
  coupleId: string;
  guests: any[];
}

export default function GiftLedger({ coupleId, guests }: GiftLedgerProps) {
  const [showForm, setShowForm] = useState(false);
  const [guestIdForGift, setGuestIdForGift] = useState<string | null>(null);

  // 查询真实的礼金记录
  const gifts: Gift[] = useLiveQuery(
    () =>
      db.gifts
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const totalReceived = gifts
    .filter((g) => g.type === 'received')
    .reduce((sum, g) => sum + g.amount, 0);

  const totalGiven = gifts
    .filter((g) => g.type === 'given')
    .reduce((sum, g) => sum + g.amount, 0);

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

  // 快速记录礼金
  const handleQuickRecord = async () => {
    if (!guestIdForGift) return;

    const amountInput = document.getElementById('gift-amount') as HTMLInputElement;
    const typeInput = document.getElementById('gift-type') as HTMLSelectElement;
    const notesInput = document.getElementById('gift-notes') as HTMLTextAreaElement;

    const amount = parseFloat(amountInput.value);
    const type = typeInput.value as 'received' | 'given';
    const notes = notesInput.value;

    if (!amount || isNaN(amount)) return;

    const guest = guests.find((g) => g.id === guestIdForGift);

    try {
      await db.gifts.add({
        id: crypto.randomUUID(),
        couple_id: coupleId,
        guest_id: guestIdForGift,
        guest_name: guest?.name || '未知',
        type,
        amount,
        date: Date.now(),
        notes: notes.trim() || undefined,
        updatedAt: Date.now(),
        _deleted: false,
      });

      // 同时在guest备注中记录
      if (guest) {
        const newNote = `${guest.notes || ''}\n💰 ${type === 'received' ? '收到' : '送出'} ¥${amount} (${new Date().toLocaleDateString('zh-CN')})`;
        await db.guests.update(guestIdForGift, { notes: newNote.trim(), updatedAt: Date.now() });
      }

      setGuestIdForGift(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to record gift:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">💰 礼金台账</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          {showForm ? '收起' : '记录礼金'}
        </button>
      </div>

      {/* 礼金统计 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 mb-1">收到礼金</div>
          <div className="text-xl font-bold text-green-700">{formatCurrency(totalReceived)}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">送出礼金</div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(totalGiven)}</div>
        </div>
      </div>

      {/* 礼金列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {gifts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">暂无礼金记录</p>
        ) : (
          gifts
            .sort((a, b) => b.date - a.date)
            .map((gift) => (
              <div key={gift.id} className={`p-3 rounded-lg ${gift.type === 'received' ? 'bg-green-50' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{gift.guest_name}</p>
                    <p className="text-xs text-gray-500">{new Date(gift.date).toLocaleDateString('zh-CN')}</p>
                    {gift.notes && <p className="text-xs text-gray-500 mt-1">{gift.notes}</p>}
                  </div>
                  <div className={`text-lg font-bold ${gift.type === 'received' ? 'text-green-600' : 'text-blue-600'}`}>
                    {gift.type === 'received' ? '+' : '-'}{formatCurrency(gift.amount)}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* 快速记录表单 */}
      {showForm && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">快速记录礼金</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择亲友</label>
              <select
                onChange={(e) => e.target.value && setGuestIdForGift(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                defaultValue=""
              >
                <option value="">选择亲友...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.relationship})
                  </option>
                ))}
              </select>
            </div>
            {guestIdForGift && (
              <>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="gift-amount"
                    placeholder="金额"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <select
                    id="gift-type"
                    defaultValue="received"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="received">收到</option>
                    <option value="given">送出</option>
                  </select>
                </div>
                <textarea
                  id="gift-notes"
                  placeholder="备注（可选）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                ></textarea>
                <button
                  onClick={handleQuickRecord}
                  className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium"
                >
                  记录礼金
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

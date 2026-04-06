import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface GuestFormProps {
  coupleId: string;
  onSubmit: (guest: any) => void;
  onCancel: () => void;
  initialGuest?: any;
  relationships: string[];
}

export default function GuestForm({
  coupleId,
  onSubmit,
  onCancel,
  initialGuest,
  relationships,
}: GuestFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialGuest) {
      setName(initialGuest.name);
      setEmail(initialGuest.email || '');
      setPhone(initialGuest.phone || '');
      setRelationship(initialGuest.relationship);
      setRsvpStatus(initialGuest.rsvp_status);
      setPlusOne(initialGuest.plus_one || false);
      setPlusOneName(initialGuest.plus_one_name || '');
      setNotes(initialGuest.notes || '');
    }
  }, [initialGuest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const guest = {
        id: initialGuest?.id || nanoid(),
        couple_id: coupleId,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        relationship,
        rsvp_status: rsvpStatus,
        plus_one: plusOne,
        plus_one_name: plusOneName.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: Date.now(),
        _deleted: false,
      };

      onSubmit(guest);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {initialGuest ? '编辑亲友' : '添加亲友'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="亲友姓名"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="可选"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="可选"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关系 *</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="">选择关系</option>
              {relationships.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RSVP 状态</label>
            <div className="flex gap-3">
              {(['pending', 'accepted', 'declined'] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rsvp"
                    value={status}
                    checked={rsvpStatus === status}
                    onChange={() => setRsvpStatus(status)}
                    className="w-4 h-4 text-pink-600"
                  />
                  <span className="text-sm">
                    {status === 'pending' ? '待确认' : status === 'accepted' ? '已确认' : '婉拒'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="plusOne"
              checked={plusOne}
              onChange={(e) => setPlusOne(e.target.checked)}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="plusOne" className="text-sm font-medium text-gray-700">
              携带一位同伴 (+1)
            </label>
          </div>

          {plusOne && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">同伴姓名</label>
              <input
                type="text"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="同伴姓名"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              placeholder="备注..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-lg"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

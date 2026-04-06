import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface BudgetItemFormProps {
  coupleId: string;
  onSubmit: (item: any) => void;
  onCancel: () => void;
  initialItem?: any;
  categories: Array<{ id: string; name: string; icon: string }>;
}

export default function BudgetItemForm({
  coupleId,
  onSubmit,
  onCancel,
  initialItem,
  categories,
}: BudgetItemFormProps) {
  const [vendor, setVendor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [paid, setPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setVendor(initialItem.vendor);
      setCategoryId(initialItem.category_id);
      setEstimatedCost(initialItem.estimated_cost.toString());
      setActualCost(initialItem.actual_cost?.toString() || '');
      setPaid(initialItem.paid || false);
      setPaymentDate(initialItem.payment_date ? new Date(initialItem.payment_date).toISOString().slice(0, 10) : '');
      setPaymentMethod(initialItem.payment_method || '');
      setNotes(initialItem.notes || '');
    }
  }, [initialItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const item = {
        id: initialItem?.id || nanoid(),
        couple_id: coupleId,
        category_id: categoryId,
        vendor: vendor.trim(),
        estimated_cost: parseFloat(estimatedCost) || 0,
        actual_cost: actualCost ? parseFloat(actualCost) : undefined,
        paid,
        payment_date: paymentDate ? new Date(paymentDate).getTime() : undefined,
        payment_method: paymentMethod.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: Date.now(),
        _deleted: false,
      };

      onSubmit(item);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {initialItem ? '编辑预算项' : '新增预算项'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商/项目名称 *</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="例如：XX婚礼策划公司"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预算金额 (¥) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">实际支出 (¥)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paid"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="paid" className="text-sm font-medium text-gray-700">
              已付款
            </label>
          </div>

          {paid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">付款日期</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="">选择付款方式</option>
              <option value="cash">现金</option>
              <option value="bank_transfer">银行转账</option>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信支付</option>
              <option value="card">银行卡</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              placeholder="备注信息..."
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
              disabled={loading || !vendor.trim() || !categoryId}
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

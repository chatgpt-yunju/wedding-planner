import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import BudgetItemForm from './BudgetItemForm';

interface BudgetOverviewProps {
  coupleId: string;
}

// 预设预算分类（可从配置中读取）
const BUDGET_CATEGORIES = [
  { id: 'venue', name: '场地', icon: '🏢' },
  { id: 'catering', name: '餐饮', icon: '🍽️' },
  { id: 'photography', name: '摄影', icon: '📷' },
  { id: 'videography', name: '摄像', icon: '🎬' },
  { id: 'makeup', name: '化妆', icon: '💄' },
  { id: 'dress', name: '礼服', icon: '👗' },
  { id: 'rings', name: '婚戒', icon: '💍' },
  { id: 'florals', name: '花艺', icon: '🌸' },
  { id: 'lighting', name: '灯光', icon: '💡' },
  { id: 'sound', name: '音响', icon: '🔊' },
  { id: 'favors', name: '伴手礼', icon: '🎁' },
  { id: 'invitation', name: '请柬', icon: '💌' },
  { id: 'transportation', name: '交通', icon: '🚗' },
  { id: 'accommodation', name: '住宿', icon: '🏨' },
  { id: 'other', name: '其他', icon: '📦' },
];

export default function BudgetOverview({ coupleId }: BudgetOverviewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const budgetItems = useLiveQuery(
    () =>
      db.budgetItems
        .where('couple_id')
        .equals(coupleId)
        .and((b) => !b._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  // 计算统计
  const stats = budgetItems.reduce(
    (acc, item) => {
      acc.totalEstimated += item.estimated_cost;
      acc.totalActual += item.actual_cost || 0;
      acc.totalPaid += item.paid ? (item.actual_cost || item.estimated_cost) : 0;
      return acc;
    },
    { totalEstimated: 0, totalActual: 0, totalPaid: 0 }
  );

  // 按分类汇总
  const categoryStats = BUDGET_CATEGORIES.map((cat) => {
    const items = budgetItems.filter((i) => i.category_id === cat.id);
    const estimated = items.reduce((sum, i) => sum + i.estimated_cost, 0);
    const actual = items.reduce((sum, i) => sum + (i.actual_cost || 0), 0);
    return { ...cat, items: items.length, estimated, actual };
  }).filter((c) => c.items > 0 || filterCategory === 'all');

  const filteredItems = filterCategory === 'all'
    ? budgetItems
    : budgetItems.filter((i) => i.category_id === filterCategory);

  const handleSubmit = async (item: any) => {
    try {
      await db.budgetItems.put(item);
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to save budget item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('确定删除此预算项？')) return;
    try {
      await db.budgetItems.update(itemId, { _deleted: true });
    } catch (error) {
      console.error('Failed to delete budget item:', error);
    }
  };

  const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">💰 预算管控</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
        >
          + 新增预算
        </button>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">预算总额</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.totalEstimated)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">实际支出</h3>
          <p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.totalActual)}</p>
          <p className="text-sm text-gray-500 mt-1">
            预算剩余: {formatCurrency(stats.totalEstimated - stats.totalActual)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium mb-2">已付款</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-sm text-gray-500 mt-1">
            待付款: {formatCurrency(stats.totalActual - stats.totalPaid)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧分类统计 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">分类统计</h3>
            <div className="space-y-2">
              {BUDGET_CATEGORIES.map((cat) => {
                const stat = categoryStats.find((c) => c.id === cat.id);
                if (!stat) return null;
                const isOver = stat.actual > stat.estimated;
                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-lg cursor-pointer ${filterCategory === cat.id ? 'bg-pink-50 border border-pink-300' : 'hover:bg-gray-50'}`}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <span>{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-500">{stat.items}项</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">预算: {formatCurrency(stat.estimated)}</span>
                      <span className={`font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                        实际: {formatCurrency(stat.actual)}
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min((stat.actual / stat.estimated) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧预算明细 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">
                预算明细 {filterCategory !== 'all' && `- ${BUDGET_CATEGORIES.find(c => c.id === filterCategory)?.name}`}
              </h3>
              <span className="text-sm text-gray-500">{filteredItems.length} 项</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">暂无预算项</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  添加第一个预算
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${item.paid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{item.vendor}</span>
                          {item.paid && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              已付款
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.notes || '无备注'}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-500">
                            预算: {formatCurrency(item.estimated_cost)}
                          </span>
                          {item.actual_cost && item.actual_cost !== item.estimated_cost && (
                            <span className={item.actual_cost > item.estimated_cost ? 'text-red-600' : 'text-green-600'}>
                              实际: {formatCurrency(item.actual_cost)}
                            </span>
                          )}
                          {item.payment_date && (
                            <span className="text-gray-500">
                              付款: {new Date(item.payment_date).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 预算表单弹窗 */}
      {showForm && (
        <BudgetItemForm
          coupleId={coupleId}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          initialItem={editingItem || undefined}
          categories={BUDGET_CATEGORIES}
        />
      )}
    </div>
  );
}

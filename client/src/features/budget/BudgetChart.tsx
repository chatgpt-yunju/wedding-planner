import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';

interface BudgetChartProps {
  coupleId: string;
}

const BUDGET_CATEGORIES = [
  { id: 'venue', name: '场地' },
  { id: 'catering', name: '餐饮' },
  { id: 'photography', name: '摄影' },
  { id: 'videography', name: '摄像' },
  { id: 'makeup', name: '化妆' },
  { id: 'dress', name: '礼服' },
  { id: 'rings', name: '婚戒' },
  { id: 'florals', name: '花艺' },
  { id: 'lighting', name: '灯光' },
  { id: 'sound', name: '��响' },
  { id: 'favors', name: '伴手礼' },
  { id: 'invitation', name: '请柬' },
  { id: 'transportation', name: '交通' },
  { id: 'accommodation', name: '住宿' },
  { id: 'other', name: '其他' },
];

export default function BudgetChart({ coupleId }: BudgetChartProps) {
  const budgetItems = useLiveQuery(
    () =>
      db.budgetItems
        .where('couple_id')
        .equals(coupleId)
        .and((b) => !b._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  // 按分类汇总
  const chartData = useMemo(() => {
    const categoryData = BUDGET_CATEGORIES.map((cat) => {
      const items = budgetItems.filter((i) => i.category_id === cat.id);
      const estimated = items.reduce((sum, i) => sum + i.estimated_cost, 0);
      const actual = items.reduce((sum, i) => sum + (i.actual_cost || 0), 0);
      return { ...cat, estimated, actual, count: items.length };
    }).filter((d) => d.count > 0);

    // 计算总额
    const total = categoryData.reduce((sum, d) => sum + d.estimated, 0);
    const withPercentage = categoryData.map((d) => ({
      ...d,
      percentage: total > 0 ? (d.estimated / total) * 100 : 0,
    }));

    // 按百分比排序
    return withPercentage.sort((a, b) => b.percentage - a.percentage);
  }, [budgetItems]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 预算分布</h3>
        <p className="text-gray-500 text-center py-8">暂无数据</p>
      </div>
    );
  }

  // 找出超支的分类
  const overBudget = chartData.filter((d) => d.actual > d.estimated);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📊 预算分布</h3>

      {/* 总体统计 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">预算总额</span>
          <span className="font-bold text-lg text-blue-600">
            ¥{chartData.reduce((sum, d) => sum + d.estimated, 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">实际支出</span>
          <span className="font-bold text-lg text-yellow-600">
            ¥{chartData.reduce((sum, d) => sum + d.actual, 0).toLocaleString()}
          </span>
        </div>
        {overBudget.length > 0 && (
          <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            ⚠️ {overBudget.length} 个分类已超预算
          </div>
        )}
      </div>

      {/* 条形图 */}
      <div className="space-y-4">
        {chartData.slice(0, 10).map((cat) => (
          <div key={cat.id} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                {cat.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  ¥{cat.estimated.toLocaleString()}
                </span>
                {cat.actual > 0 && (
                  <span className={`text-sm ${cat.actual > cat.estimated ? 'text-red-600' : 'text-green-600'}`}>
                    (¥{cat.actual.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
            {/* 进度条 */}
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${cat.actual > cat.estimated ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
              ></div>
              {cat.actual > cat.estimated && (
                <div
                  className="absolute h-full bg-gray-800 opacity-30"
                  style={{ width: `${Math.min((cat.actual / (cat.estimated || 1)) * 100, 100)}%` }}
                ></div>
              )}
            </div>
            <div className="text-xs text-gray-500 text-right">
              {cat.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 10 && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          显示前 10 个分类，共 {chartData.length} 个
        </p>
      )}
    </div>
  );
}

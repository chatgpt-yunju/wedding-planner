import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { BudgetItem } from '../../db/index';

interface BudgetReportProps {
  coupleId: string;
}

export default function BudgetReport({ coupleId }: BudgetReportProps) {
  const budgetItems: BudgetItem[] = useLiveQuery(
    () =>
      db.budgetItems
        .where('couple_id')
        .equals(coupleId)
        .and((b) => !b._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const stats = useMemo(() => {
    const totalEstimated = budgetItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const totalPaid = budgetItems.filter((item) => item.paid).reduce((sum, item) => sum + (item.actual_cost || item.estimated_cost || 0), 0);
    const overBudget = budgetItems.filter((item => (item.actual_cost || 0) > (item.estimated_cost || 0)));
    return { totalEstimated, totalActual, totalPaid, overBudget, itemCount: budgetItems.length };
  }, [budgetItems]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 预算执行报告</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">预算总额</div>
          <div className="text-2xl font-bold text-gray-800">¥{stats.totalEstimated.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">实际支出</div>
          <div className="text-2xl font-bold text-blue-700">¥{stats.totalActual.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">已付款</div>
          <div className="text-2xl font-bold text-green-700">¥{stats.totalPaid.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-red-600 mb-1">超预算项目</div>
          <div className="text-2xl font-bold text-red-700">{stats.overBudget.length}</div>
        </div>
      </div>

      {budgetItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">项目</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">预算</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">实际</th>
                <th className="px-4 py-2 text-right text-gray-600 font-medium">差额</th>
                <th className="px-4 py-2 text-center text-gray-600 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((item) => {
                const estimated = item.estimated_cost || 0;
                const actual = item.actual_cost || 0;
                const variance = actual - estimated;
                const isOver = actual > estimated;
                return (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-800">{item.vendor || item.category_id}</td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{estimated.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-800 font-medium">¥{actual.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                      {isOver ? '+' : ''}{variance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.paid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">已付</span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${actual > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          {actual > 0 ? '待付' : '未付'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {budgetItems.length === 0 && (
        <p className="text-gray-500 text-center py-8">暂无预算数据</p>
      )}
    </div>
  );
}

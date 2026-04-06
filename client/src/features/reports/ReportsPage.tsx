import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { BudgetItem, Guest, Task } from '../../db/index';
import BudgetReport from './BudgetReport';
import GuestStats from './GuestStats';
import TaskStats from './TaskStats';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportsPageProps {
  coupleId: string;
}

export default function ReportsPage({ coupleId }: ReportsPageProps) {
  const budgetItems: BudgetItem[] = useLiveQuery(
    () =>
      db.budgetItems
        .where('couple_id')
        .equals(coupleId)
        .and((b) => !b._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const guests: Guest[] = useLiveQuery(
    () =>
      db.guests
        .where('couple_id')
        .equals(coupleId)
        .and((g) => !g._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const tasks: Task[] = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(coupleId)
        .and((t) => !t._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('zh-CN');

    // Title
    doc.setFontSize(18);
    doc.text('备婚统计报告', 14, 22);
    doc.setFontSize(12);
    doc.text(`生成日期: ${dateStr}`, 14, 30);

    let y = 40;

    // Summary counts
    doc.setFontSize(14);
    doc.text('概览', 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`任务总数: ${tasks.length}`, 14, y);
    y += 6;
    doc.text(`预算项目数: ${budgetItems.length}`, 14, y);
    y += 6;
    doc.text(`亲友总数: ${guests.length}`, 14, y);
    y += 12;

    // Budget table
    if (budgetItems.length > 0) {
      doc.setFontSize(14);
      doc.text('预算执行明细', 14, y);
      y += 8;
      const budgetData = budgetItems.map((item) => [
        item.vendor || item.category_id,
        `¥${(item.estimated_cost || 0).toLocaleString()}`,
        `¥${(item.actual_cost || 0).toLocaleString()}`,
        item.paid ? '已付' : (item.actual_cost ? '待付' : '未付'),
      ]);
      (doc as any).autoTable({
        head: [['项目', '预算', '实际', '付款状态']],
        body: budgetData,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Guest summary table
    if (guests.length > 0) {
      doc.setFontSize(14);
      doc.text('亲友列表', 14, y);
      y += 8;
      const guestData = guests.map((g) => [
        g.name,
        g.relationship,
        g.rsvp_status === 'accepted' ? '已确认' : g.rsvp_status === 'pending' ? '待确认' : '婉拒',
        g.plus_one ? '是' : '否',
        g.phone || '-',
      ]);
      (doc as any).autoTable({
        head: [['姓名', '关系', '状态', '+1', '电话']],
        body: guestData,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Task summary table
    if (tasks.length > 0) {
      doc.setFontSize(14);
      doc.text('任务列表', 14, y);
      y += 8;
      const taskData = tasks.map((t) => [
        t.title,
        t.category,
        t.status === 'todo' ? '待办' : t.status === 'in_progress' ? '进行中' : '已完成',
        t.due_date ? new Date(t.due_date).toLocaleDateString('zh-CN') : '-',
      ]);
      (doc as any).autoTable({
        head: [['标题', '分类', '状态', '截止日期']],
        body: taskData,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }

    doc.save(`备婚报告-${dateStr}.pdf`);
  }, [budgetItems, guests, tasks]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📊 统计报表</h2>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
        >
          导出 PDF
        </button>
      </div>

      <TaskStats coupleId={coupleId} />
      <BudgetReport coupleId={coupleId} />
      <GuestStats coupleId={coupleId} />
    </div>
  );
}

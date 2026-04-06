import { useEffect, useState, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import TaskList from '../tasks/TaskList';
import { Countdown, CalendarView } from '../calendar';

// Lazy-loaded page components
const TasksPage = lazy(() => import('../tasks/TasksPage'));
const BudgetOverview = lazy(() => import('../budget/BudgetOverview'));
const GuestList = lazy(() => import('../guests/GuestList'));
const SeatingChart = lazy(() => import('../seating/SeatingChart'));
const MoodPage = lazy(() => import('../mood/MoodPage'));
const MemoriesPage = lazy(() => import('../memories/MemoriesPage'));
const ReportsPage = lazy(() => import('../reports/ReportsPage'));
const SettingsPage = lazy(() => import('../settings/SettingsPage'));
const NotificationsPage = lazy(() => import('../notifications/NotificationsPage'));

interface DashboardProps {
  user: any;
  couple: any;
  onLogout: () => void;
}

export default function Dashboard({ user, couple, onLogout }: DashboardProps) {
  const partnerName = couple?.partner_a_name || couple?.partner_b_name;
  const [activeSection, setActiveSection] = useState<
    'overview' | 'tasks' | 'calendar' | 'budget' | 'guests' | 'seating' | 'mood' | 'memories' | 'reports' | 'notifications' | 'settings'
  >('overview');

  // 实时任务数
  const taskCount = useLiveQuery(
    () =>
      db.tasks
        .where('couple_id')
        .equals(couple.id)
        .and((t) => !t._deleted)
        .count(),
    [couple?.id]
  ) || 0;

  const weddingDate = new Date();
  weddingDate.setFullYear(weddingDate.getFullYear() + 1);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (['tasks', 'calendar', 'budget', 'guests', 'seating', 'mood', 'memories', 'reports', 'notifications', 'settings'].includes(hash)) {
        setActiveSection(hash as any);
      } else {
        setActiveSection('overview');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (section: any) => {
    window.location.hash = section === 'overview' ? '' : section;
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-pink-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-pink-600">💑 备婚助手</h1>
            <p className="text-sm text-gray-600">
              你好，{user.name} {partnerName && `与 ${partnerName} 一起`}
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <button
              onClick={() => navigateTo('overview')}
              className={`font-medium ${activeSection === 'overview' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              概览
            </button>
            <button
              onClick={() => navigateTo('tasks')}
              className={`font-medium ${activeSection === 'tasks' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              任务
            </button>
            <button
              onClick={() => navigateTo('calendar')}
              className={`font-medium ${activeSection === 'calendar' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              日历
            </button>
            <button
              onClick={() => navigateTo('budget')}
              className={`font-medium ${activeSection === 'budget' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              预算
            </button>
            <button
              onClick={() => navigateTo('guests')}
              className={`font-medium ${activeSection === 'guests' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              亲友
            </button>
            <button
              onClick={() => navigateTo('seating')}
              className={`font-medium ${activeSection === 'seating' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              座位
            </button>
            <button
              onClick={() => navigateTo('mood')}
              className={`font-medium ${activeSection === 'mood' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              心情
            </button>
            <button
              onClick={() => navigateTo('memories')}
              className={`font-medium ${activeSection === 'memories' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              回忆
            </button>
            <button
              onClick={() => navigateTo('reports')}
              className={`font-medium ${activeSection === 'reports' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              报表
            </button>
            <button
              onClick={() => navigateTo('notifications')}
              className={`font-medium ${activeSection === 'notifications' ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'}`}
            >
              通知
            </button>
            <button
              onClick={() => navigateTo('settings')}
              className={`font-medium ${activeSection === 'settings' ? 'text-pink-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              设置
            </button>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              退出
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeSection === 'overview' && (
          <>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 text-white mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {couple?.status === 'active'
                  ? `🎉 恭喜你们成功配对！开始备婚之旅吧`
                  : '👋 欢迎！请先完成配对'}
              </h2>
              <p className="opacity-90">记录备婚点滴，管理任务预算，保持情绪愉悦</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium mb-2">总任务数</h3>
                <p className="text-3xl font-bold text-pink-600">{taskCount}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium mb-2">配对状态</h3>
                <p className="text-xl font-bold text-green-600">
                  {couple?.status === 'active' ? '✅ 已配对' : '⏳ 待配对'}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium mb-2">婚礼倒计时</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.floor((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 天
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FeatureCard
                title="📋 任务管理"
                desc="创建和管理备婚任务"
                onClick={() => navigateTo('tasks')}
                color="from-blue-400 to-blue-500"
              />
              <FeatureCard
                title="📅 智能日历"
                desc="倒计时和日期规划"
                onClick={() => navigateTo('calendar')}
                color="from-green-400 to-green-500"
              />
              <FeatureCard
                title="💰 预算管控"
                desc="分类预算和付款记录"
                onClick={() => navigateTo('budget')}
                color="from-yellow-400 to-yellow-500"
              />
              <FeatureCard
                title="👥 亲友与礼金"
                desc="宾客名单和礼金管理"
                onClick={() => navigateTo('guests')}
                color="from-purple-400 to-purple-500"
              />
              <FeatureCard
                title="🪑 座位表"
                desc="拖拽安排座位"
                onClick={() => navigateTo('seating')}
                color="from-red-400 to-red-500"
              />
              <FeatureCard
                title="😊 心情胶囊"
                desc="记录每日情绪"
                onClick={() => navigateTo('mood')}
                color="from-pink-400 to-pink-500"
              />
              <FeatureCard
                title="📸 回忆时光轴"
                desc="上传照片视频"
                onClick={() => navigateTo('memories')}
                color="from-indigo-400 to-indigo-500"
              />
              <FeatureCard
                title="📊 统计报表"
                desc="备婚进度报告"
                onClick={() => navigateTo('reports')}
                color="from-teal-400 to-teal-500"
              />
            </div>
          </>
        )}

        {activeSection === 'tasks' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <TasksPage coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'calendar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 智能日历</h2>
                <CalendarView coupleId={couple.id} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">即将到期的任务</h3>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <TaskList coupleId={couple.id} onTaskUpdate={() => {}} />
                </div>
              </div>
            </div>
            <div className="max-w-md">
              <Countdown weddingDate={weddingDate} />
            </div>
          </div>
        )}

        {activeSection === 'budget' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <BudgetOverview coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'guests' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <GuestList coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'seating' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <SeatingChart coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'mood' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <MoodPage coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'memories' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <MemoriesPage coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'reports' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <ReportsPage coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'notifications' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <NotificationsPage coupleId={couple.id} />
          </Suspense>
        )}

        {activeSection === 'settings' && (
          <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
            <SettingsPage coupleId={couple.id} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  onClick,
  color,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow text-left`}
    >
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/80 text-sm">{desc}</p>
    </button>
  );
}

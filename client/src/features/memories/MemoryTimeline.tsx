import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import type { Memory } from '../../db/index';
import MemoryCard from './MemoryCard';
import MemoryUpload from './MemoryUpload';

interface MemoryTimelineProps {
  coupleId: string;
}

export default function MemoryTimeline({ coupleId }: MemoryTimelineProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [filterTag, setFilterTag] = useState<string>('all');

  const memories: Memory[] = useLiveQuery(
    () =>
      db.memories
        .where('couple_id')
        .equals(coupleId)
        .and((m) => !m._deleted)
        .toArray(),
    [coupleId]
  ) || [];

  // 提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    memories.forEach((m) => m.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [memories]);

  // 筛选
  const filteredMemories = useMemo(() => {
    if (filterTag === 'all') return memories;
    return memories.filter((m) => m.tags.includes(filterTag));
  }, [memories, filterTag]);

  const sortedMemories = [...filteredMemories].sort((a, b) => b.captured_at - a.captured_at);

  const handleSaveMemory = async (memory: Omit<Memory, 'id' | 'created_at' | 'updatedAt' | '_deleted'>) => {
    await db.memories.add({
      ...memory,
      id: crypto.randomUUID(),
      created_at: Date.now(),
      updatedAt: Date.now(),
      _deleted: false,
    });
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📸 回忆时光轴</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium"
        >
          {showUpload ? '取消' : '+ 添加回忆'}
        </button>
      </div>

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag('all')}
            className={`px-3 py-1 rounded-full text-sm ${filterTag === 'all' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${filterTag === tag ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 上传表单 */}
      {showUpload && (
        <MemoryUpload coupleId={coupleId} onSubmit={handleSaveMemory} onCancel={() => setShowUpload(false)} />
      )}

      {/* 时光轴 */}
      <div className="relative">
        {/* 竖线 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {sortedMemories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">还没有回忆记录</p>
              <button
                onClick={() => setShowUpload(true)}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                添加第一段回忆
              </button>
            </div>
          ) : (
            sortedMemories.map((memory) => (
              <div key={memory.id} className="relative pl-12">
                {/* 时间轴圆点 */}
                <div className="absolute left-2 w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow-sm"></div>
                <MemoryCard memory={memory} />
              </div>
            ))
          )}
        </div>
      </div>

      {/*  wedding review generator */}
      <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
        <h3 className="font-semibold text-gray-800 mb-2">🎊 生成婚礼回顾</h3>
        <p className="text-sm text-gray-600 mb-3">自动创建一份精美的相册回顾，汇总你们的备婚故事和精彩瞬间。</p>
        <button
          onClick={() => {
            alert('婚礼回顾生成功能即将开放，敬请期待！');
          }}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium text-sm"
        >
          生成回顾
        </button>
      </div>
    </div>
  );
}

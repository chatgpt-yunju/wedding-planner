import type { Memory } from '../../db/index';

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const date = new Date(memory.captured_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* 标题和日期 */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-800 text-lg">{memory.title}</h4>
        <p className="text-xs text-gray-500">{date}</p>
      </div>

      {/* 描述 */}
      {memory.description && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{memory.description}</p>
      )}

      {/* 媒体展示 */}
      {memory.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-3 ${memory.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
          {memory.media_urls.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={url}
                alt={`${memory.title} - ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* 标签 */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

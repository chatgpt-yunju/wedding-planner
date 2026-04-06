import { useState } from 'react';

interface MemoryUploadProps {
  coupleId: string;
  onSubmit: (memory: {
    couple_id: string;
    title: string;
    description?: string;
    media_urls: string[];
    tags: string[];
    captured_at: number;
  }) => void;
  onCancel: () => void;
}

const COMMON_TAGS = ['试纱', '场地', '求婚', '蜜月', '约会', '筹备', '婚礼现场', '日常'];

export default function MemoryUpload({ coupleId, onSubmit, onCancel }: MemoryUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [capturedAt, setCapturedAt] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const mediaUrlsArray = mediaUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    onSubmit({
      couple_id: coupleId,
      title: title.trim(),
      description: description.trim() || undefined,
      media_urls: mediaUrlsArray,
      tags: selectedTags,
      captured_at: new Date(capturedAt).getTime(),
    });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3">📝 添加回忆</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给这段回忆起个名字"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="记录下当时的故事..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">媒体链接（每行一个URL）</label>
          <textarea
            value={mediaUrls}
            onChange={(e) => setMediaUrls(e.target.value)}
            placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">注意：当前版本需要图片URL。文件上传功能待实现。</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
          <input
            type="date"
            value={capturedAt}
            onChange={(e) => setCapturedAt(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-lg"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

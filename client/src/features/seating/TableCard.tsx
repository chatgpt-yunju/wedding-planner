interface TableCardProps {
  table: any;
  guests: any[];
  onRemoveGuest: (guestId: string) => void;
  onDeleteTable: () => void;
  onEditTable: () => void;
}

export default function TableCard({
  table,
  guests,
  onRemoveGuest,
  onDeleteTable,
  onEditTable,
}: TableCardProps) {
  const remainingSeats = table.max_seats - table.guests.length;
  const isFull = remainingSeats <= 0;

  const getSeatColor = (index: number) => {
    if (index < 3) return 'bg-pink-500';
    if (index < 6) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* 餐桌头部 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{table.name}</h3>
          <p className="text-sm text-gray-500">
            {guests.length} / {table.max_seats} 人 · 剩余 {remainingSeats} 座
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEditTable}
            className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
            title="管理"
          >
            ⚙️
          </button>
          <button
            onClick={onDeleteTable}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 座位布局 - 圆形/方形 */}
      <div
        className={`relative rounded-2xl border-2 ${
          isFull ? 'bg-gray-100 border-gray-300' : 'bg-pink-50 border-pink-200'
        } p-4 mb-4`}
        style={{ minHeight: '200px' }}
      >
        {/* 餐桌座位 */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: table.max_seats }).map((_, idx) => {
            const guest = guests[idx];
            return (
              <div
                key={idx}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-white text-sm font-medium
                  ${guest ? getSeatColor(idx) : 'bg-gray-200 border-2 border-dashed border-gray-300'}
                `}
                title={guest ? `${guest.name} (${guest.relationship})` : '空座位'}
              >
                {guest ? (
                  <div className="flex flex-col items-center">
                    <span>{guest.name.slice(0, 2)}</span>
                    <button
                      onClick={() => onRemoveGuest(guest.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      title="移除"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {isFull && (
          <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
            <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium">
              已满员
            </span>
          </div>
        )}
      </div>

      {/* 已分配宾客列表 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">已安排 ({guests.length})</h4>
        <div className="flex flex-wrap gap-2">
          {guests.map((guest) => (
            <span
              key={guest.id}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm flex items-center gap-1"
            >
              {guest.name}
              <button
                onClick={() => onRemoveGuest(guest.id)}
                className="ml-1 hover:text-green-900"
                title="移除"
              >
                ×
              </button>
            </span>
          ))}
          {guests.length === 0 && (
            <p className="text-sm text-gray-400">暂未安排宾客</p>
          )}
        </div>
      </div>

      {/* 拖拽提示 */}
      {remainingSeats > 0 && (
        <div className="text-xs text-gray-500 text-center">
          🖱️ 从右侧拖拽宾客到此处座位
        </div>
      )}
    </div>
  );
}

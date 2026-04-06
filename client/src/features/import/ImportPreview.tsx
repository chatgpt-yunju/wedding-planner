import type { Guest } from '../../db/index';

interface ImportPreviewProps {
  data: any[]; // raw rows from file
  mapping: Record<string, string>;
}

export default function ImportPreview({ data, mapping }: ImportPreviewProps) {
  // Transform preview based on mapping
  const previewData = data.slice(0, 5).map((row) => {
    const mapped: Partial<Guest> = {};
    Object.entries(mapping).forEach(([col, field]) => {
      if (field !== 'ignore' && row[col] !== undefined) {
        const value = row[col];
        // Convert plus_one to boolean if needed
        if (field === 'plus_one') {
          mapped.plus_one = ['yes', 'true', '1', '是', '携带', '有'].includes(String(value).toLowerCase());
        } else if (field === 'rsvp_status') {
          const v = String(value).toLowerCase();
          if (['accepted', '已确认', '参加'].includes(v)) mapped.rsvp_status = 'accepted';
          else if (['declined', '婉拒', '不参加'].includes(v)) mapped.rsvp_status = 'declined';
          else mapped.rsvp_status = 'pending';
        } else {
          (mapped as any)[field] = value;
        }
      }
    });
    return mapped;
  });

  const headers = Object.values(mapping).filter((f) => f !== 'ignore');

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((field) => (
              <th key={field} className="px-4 py-2 text-left text-gray-600 font-medium">
                {field}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.map((row, idx) => (
            <tr key={idx} className="border-t border-gray-100">
              {headers.map((field) => (
                <td key={field} className="px-4 py-2 text-gray-800">
                  {String((row as any)[field] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 5 && (
        <div className="px-4 py-2 bg-gray-50 text-gray-500 text-xs">仅显示前 5 条记录，共 {data.length} 条</div>
      )}
    </div>
  );
}

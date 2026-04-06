import { useState } from 'react';

interface FieldMapperProps {
  columns: string[];
  onMappingChange: (mapping: Record<string, string>) => void;
  initialMapping?: Record<string, string>;
}

const FIELD_OPTIONS = [
  { value: 'name', label: '姓名 (必填)' },
  { value: 'relationship', label: '关系' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '电话' },
  { value: 'plus_one', label: '是否携带 +1' },
  { value: 'notes', label: '备注' },
  { value: 'rsvp_status', label: 'RSVP状态' },
  { value: 'ignore', label: '忽略此列' },
];

export default function FieldMapper({ columns, onMappingChange, initialMapping = {} }: FieldMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(
    columns.reduce((acc, col) => {
      // Auto-map if column name matches (case-insensitive)
      const lower = col.toLowerCase();
      let mapped = 'ignore';
      if (lower.includes('姓名') || lower.includes('name')) mapped = 'name';
      else if (lower.includes('关系') || lower.includes('relation')) mapped = 'relationship';
      else if (lower.includes('邮箱') || lower.includes('email') || lower.includes('mail')) mapped = 'email';
      else if (lower.includes('电话') || lower.includes('手机') || lower.includes('phone') || lower.includes('tel')) mapped = 'phone';
      else if (lower.includes('备注') || lower.includes('note')) mapped = 'notes';
      else if (lower.includes('+1') || lower.includes('plus') || lower.includes('伴')) mapped = 'plus_one';
      else if (lower.includes('rsvp') || lower.includes('状态') || lower.includes('参加')) mapped = 'rsvp_status';
      acc[col] = initialMapping[col] || mapped;
      return acc;
    }, {} as Record<string, string>)
  );

  const updateMapping = (column: string, field: string) => {
    const newMapping = { ...mapping, [column]: field };
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">请为每一列选择对应的字段：</p>
      {columns.map((col) => (
        <div key={col} className="flex items-center gap-3">
          <div className="w-48 truncate text-sm text-gray-700" title={col}>
            {col}
          </div>
          <select
            value={mapping[col]}
            onChange={(e) => updateMapping(col, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

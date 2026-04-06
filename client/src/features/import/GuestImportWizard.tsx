import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../db/index';
import FieldMapper from './FieldMapper';
import ImportPreview from './ImportPreview';

interface GuestImportWizardProps {
  coupleId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function GuestImportWizard({ coupleId, onComplete, onCancel }: GuestImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'done'>('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // Convert to array of arrays (raw rows)
        const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        if (rows.length === 0) throw new Error('表格为空');

        // First row is headers
        const headerRow = rows[0];
        const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== ''));

        setColumns(headerRow);
        setRawData(dataRows);
        setStep('map');
        setError(null);
      } catch (err: any) {
        setError('读取文件失败: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingComplete = () => {
    // Ensure name field is mapped
    if (!mapping['姓名'] && !mapping['name'] && !Object.values(mapping).includes('name')) {
      setError('必须映射“姓名”字段');
      return;
    }
    setStep('preview');
  };

  const handleImport = useCallback(async () => {
    setStep('importing');
    setError(null);
    let imported = 0;
    let skipped = 0;

    try {
      // Use transaction for batch write
      await db.transaction('rw', db.guests, async () => {
        for (const row of rawData) {
          const guest: any = {
            id: crypto.randomUUID(),
            couple_id: coupleId,
            updatedAt: Date.now(),
            _deleted: false,
          };

          // Apply mapping
          let hasName = false;
          Object.entries(mapping).forEach(([col, field]) => {
            if (field === 'ignore') return;
            const value = row[col];
            if (value === undefined || value === null || String(value).trim() === '') return;

            if (field === 'name') {
              guest.name = String(value).trim();
              hasName = true;
            } else if (field === 'relationship') {
              guest.relationship = String(value).trim();
            } else if (field === 'email') {
              guest.email = String(value).trim();
            } else if (field === 'phone') {
              guest.phone = String(value).trim();
            } else if (field === 'plus_one') {
              guest.plus_one = ['yes', 'true', '1', '是', '携带', '有'].includes(String(value).toLowerCase());
            } else if (field === 'notes') {
              guest.notes = String(value).trim();
            } else if (field === 'rsvp_status') {
              const v = String(value).toLowerCase();
              if (['accepted', '已确认', '参加'].includes(v)) guest.rsvp_status = 'accepted';
              else if (['declined', '婉拒', '不参加'].includes(v)) guest.rsvp_status = 'declined';
              else guest.rsvp_status = 'pending';
            }
          });

          // Skip if no name
          if (!hasName) {
            skipped++;
            continue;
          }

          // Set defaults
          guest.rsvp_status = guest.rsvp_status || 'pending';
          guest.plus_one = guest.plus_one || false;

          await db.guests.add(guest);
          imported++;
        }
      });

      setImportedCount(imported);
      setSkippedCount(skipped);
      setStep('done');
    } catch (err: any) {
      setError('导入失败: ' + err.message);
      setStep('preview');
    }
  }, [rawData, mapping, coupleId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            导入宾客名单
            <span className="text-sm font-normal text-gray-500 ml-2">
              (步骤 {step === 'upload' ? '1' : step === 'map' ? '2' : step === 'preview' ? '3' : step === 'importing' ? '4' : '5'}/4)
            </span>
          </h2>
          <button onClick={onCancel} className="text-2xl text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            ×
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {step === 'upload' && (
            <div className="text-center py-8">
              <p className="mb-4 text-gray-600">请选择 Excel 文件（.xlsx 或 .xls）</p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100"
              />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <FieldMapper columns={columns} onMappingChange={setMapping} />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  返回
                </button>
                <button
                  onClick={handleMappingComplete}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  下一步：预览
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <ImportPreview data={rawData} mapping={mapping} />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('map')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  返回修改
                </button>
                <button
                  onClick={handleImport}
                  disabled={importedCount > 0}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-pink-300"
                >
                  开始导入
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">正在导入数据...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-lg font-medium text-gray-800 mb-2">导入完成！</p>
              <p className="text-gray-600 mb-4">
                成功导入 {importedCount} 位宾客{skippedCount > 0 ? `，跳过 ${skippedCount} 条无效记录` : ''}
              </p>
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

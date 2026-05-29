'use client';

import { useQuery } from '@tanstack/react-query';

interface LineItem {
  id?: string;
  materialItemId: string;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  quantity: number;
  unitCost: number;
  vatRate?: number;
  wbsId?: string;
}

interface InventoryDocumentLinesTableProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  readOnly?: boolean;
  docType: string;
}

export function InventoryDocumentLinesTable({ lines, onChange, readOnly = false, docType }: InventoryDocumentLinesTableProps) {
  // Fetch materials
  const { data: materialsRes } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/materials');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch warehouses
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/warehouses');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  // Fetch WBS items
  const { data: wbsRes } = useQuery({
    queryKey: ['wbs'],
    queryFn: async () => {
      const res = await fetch('/api/wbs');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });

  const materials = Array.isArray(materialsRes) ? materialsRes : [];
  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : [];
  const wbsItems = Array.isArray(wbsRes) ? wbsRes : [];

  const handleAddLine = () => {
    if (readOnly) return;
    onChange([
      ...lines,
      {
        materialItemId: '',
        sourceWarehouseId: docType === 'PURCHASE_RECEIPT' ? undefined : (warehouses[0]?.id || ''),
        targetWarehouseId: docType === 'ISSUE_TO_PROJECT' ? undefined : (warehouses[0]?.id || ''),
        quantity: 1,
        unitCost: 0,
        vatRate: 0,
        wbsId: ''
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (readOnly) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
    if (readOnly) return;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Chi tiết vật tư hạch toán</h4>
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddLine}
            className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all"
          >
            Thêm dòng vật tư
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3 w-8">#</th>
              <th className="p-3 min-w-[200px]">Vật tư *</th>
              {docType !== 'PURCHASE_RECEIPT' && <th className="p-3 min-w-[150px]">Kho nguồn</th>}
              {docType !== 'ISSUE_TO_PROJECT' && <th className="p-3 min-w-[150px]">Kho đích</th>}
              <th className="p-3 w-24">Số lượng *</th>
              <th className="p-3 w-32 text-right">Đơn giá *</th>
              <th className="p-3 w-20">VAT (%)</th>
              <th className="p-3 min-w-[150px]">Hạng mục WBS</th>
              <th className="p-3 w-32 text-right">Thành tiền</th>
              {!readOnly && <th className="p-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-zinc-500 italic">
                  Chưa có dòng vật tư nào được chọn. Nhấp &quot;Thêm dòng vật tư&quot; để lập chi tiết.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => {
                const total = Number(line.quantity || 0) * Number(line.unitCost || 0);
                return (
                  <tr key={idx} className="hover:bg-zinc-800/20">
                    <td className="p-3 text-zinc-500 font-medium">{idx + 1}</td>
                    <td className="p-2">
                      <select
                        disabled={readOnly}
                        value={line.materialItemId}
                        onChange={(e) => handleLineChange(idx, 'materialItemId', e.target.value)}
                        className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65"
                      >
                        <option value="">-- Chọn vật tư --</option>
                        {materials.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            [{m.code}] {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    </td>

                    {docType !== 'PURCHASE_RECEIPT' && (
                      <td className="p-2">
                        <select
                          disabled={readOnly}
                          value={line.sourceWarehouseId || ''}
                          onChange={(e) => handleLineChange(idx, 'sourceWarehouseId', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65"
                        >
                          <option value="">-- Chọn kho nguồn --</option>
                          {warehouses.map((w: any) => (
                            <option key={w.id} value={w.id}>
                              [{w.code}] {w.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {docType !== 'ISSUE_TO_PROJECT' && (
                      <td className="p-2">
                        <select
                          disabled={readOnly}
                          value={line.targetWarehouseId || ''}
                          onChange={(e) => handleLineChange(idx, 'targetWarehouseId', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65"
                        >
                          <option value="">-- Chọn kho đích --</option>
                          {warehouses.map((w: any) => (
                            <option key={w.id} value={w.id}>
                              [{w.code}] {w.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    <td className="p-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65 text-center"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        value={line.unitCost}
                        onChange={(e) => handleLineChange(idx, 'unitCost', Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65 text-right font-mono"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        value={line.vatRate || 0}
                        onChange={(e) => handleLineChange(idx, 'vatRate', Number(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65 text-center"
                      />
                    </td>

                    <td className="p-2">
                      <select
                        disabled={readOnly}
                        value={line.wbsId || ''}
                        onChange={(e) => handleLineChange(idx, 'wbsId', e.target.value)}
                        className="w-full h-8 px-2 rounded border border-zinc-750 bg-zinc-850 text-white focus:outline-none focus:border-blue-500 disabled:opacity-65"
                      >
                        <option value="">-- Hạng mục WBS --</option>
                        {wbsItems.map((w: any) => (
                          <option key={w.id} value={w.id}>
                            [{w.code}] {w.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 text-right font-bold font-mono text-blue-400">
                      {total.toLocaleString('vi-VN')} đ
                    </td>

                    {!readOnly && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-red-500 hover:text-red-400 font-bold text-sm"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

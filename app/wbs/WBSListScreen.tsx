'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import WBSHeader from '@/app/components/wbs/WBSHeader';
import WBSStats from '@/app/components/wbs/WBSStats';
import WBSActions from '@/app/components/wbs/WBSActions';
import WBSTable from '@/app/components/wbs/WBSTable';
import { EnrichedWBSNode, WBSItem } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddWBSModal from '@/app/components/modals/AddWBSModal';

export default function WBSListScreen() {
  const init = useERPStore(state => state.init);
  const getWBSTreeWithCost = useERPStore(state => state.getWBSTreeWithCost);
  const wbsItems = useERPStore(state => state.wbs);
  const budgets = useERPStore(state => state.budgets);
  const costs = useERPStore(state => state.costs);
  const isInitialized = useERPStore(state => state.initialized);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingWBS, setEditingWBS] = useState<WBSItem | null>(null);
  const [isAddingWBS, setIsAddingWBS] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const { tree: rawTree, stats } = useMemo(() => {
    if (!isInitialized) return { tree: [], stats: { totalItems: 0, totalBudget: 0, totalActual: 0, variance: 0, progress: 0 } };
    return getWBSTreeWithCost();
  }, [wbsItems, budgets, costs, isInitialized, getWBSTreeWithCost]);

  // Apply expanded state
  const tree = useMemo(() => {
    const applyExpanded = (nodes: EnrichedWBSNode[]): EnrichedWBSNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: expandedIds.has(node.id) || (node.level === 0 && !expandedIds.has('initialized')),
        children: applyExpanded(node.children)
      }));
    };
    return applyExpanded(rawTree);
  }, [rawTree, expandedIds]);

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add('initialized');
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen bg-[#020617]">
        <Sidebar activeItem="wbs" />
        <main className="ml-[258px] flex-1 grid place-items-center">
           <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-4 text-sm font-semibold text-slate-300">Đang tải dữ liệu WBS...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100">
      <Sidebar activeItem="wbs" />
      <main className="ml-[258px] flex-1">
        <WBSHeader />
        <div className="p-6">
          <WBSStats 
            totalItems={stats.totalItems} 
            totalBudget={stats.totalBudget} 
            totalActual={stats.totalActual} 
            variance={stats.variance} 
            progress={stats.progress} 
          />
          <WBSActions onAdd={() => setIsAddingWBS(true)} />
          <WBSTable 
            nodes={tree} 
            onToggleExpand={handleToggleExpand} 
            onEdit={setEditingWBS}
            totalBudget={stats.totalBudget}
            totalActual={stats.totalActual}
            variance={stats.variance}
            progress={stats.progress}
          />
        </div>
      </main>

      <AddWBSModal 
        isOpen={isAddingWBS || !!editingWBS} 
        onClose={() => { setIsAddingWBS(false); setEditingWBS(null); }} 
        wbsItem={editingWBS} 
      />
    </div>
  );
}

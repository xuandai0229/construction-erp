'use client';
/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

import { useState, useEffect, useCallback } from 'react';
import { Project, WBSItem, WBSTreeNode } from '@/app/types';
import * as wbsService from '@/app/services/wbs.service';
import * as projectService from '@/app/services/project.service';

interface WBSTreeProps {
  projectId?: string;
}

export default function WBSTree({ projectId }: WBSTreeProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tree, setTree] = useState<WBSTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wbsName, setWbsName] = useState('');
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await projectService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        if (projectId && data.some(p => p.id === projectId)) {
          setSelectedProjectId(projectId);
        } else {
          setSelectedProjectId(data[0].id);
        }
      }
    };
    fetchProjects();
  }, [projectId]);

  const loadWBS = useCallback(async () => {
    if (selectedProjectId) {
      const items = await wbsService.getWBS(selectedProjectId);
      const treeData = wbsService.buildWBSTree(items);
      setTree(treeData);
      
      setExpandedNodes(prev => {
        const next = new Set(prev);
        if (next.size === 0) {
          treeData.forEach(node => next.add(node.id));
        }
        return next;
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadWBS();
  }, [loadWBS]);

  function toggleExpand(nodeId: string) {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function resetForm() {
    setWbsName('');
    setEditingId(null);
    setParentIdForNew(null);
    setShowForm(false);
  }

  function handleAddRoot() {
    setParentIdForNew(null);
    setEditingId(null);
    setShowForm(true);
  }

  function handleAddChild(parentId: string) {
    setParentIdForNew(parentId);
    setEditingId(null);
    setWbsName('');
    setShowForm(true);
  }

  function handleEdit(node: WBSItem) {
    setEditingId(node.id);
    setWbsName(node.name);
    setParentIdForNew(node.parent_id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;

    if (editingId) {
      await wbsService.updateWBS(selectedProjectId, editingId, { name: wbsName });
    } else {
      await wbsService.addWBS(selectedProjectId, wbsName, parentIdForNew);
    }

    resetForm();
    await loadWBS();
    if (parentIdForNew) {
      setExpandedNodes(prev => new Set([...prev, parentIdForNew]));
    }
  }

  async function handleDelete(projId: string, wbsId: string) {
    if (confirm('Xóa hạng mục này và tất cả hạng mục con?')) {
      await wbsService.deleteWBS(projId, wbsId);
      await loadWBS();
    }
  }

  function renderNode(node: WBSTreeNode, projId: string): React.ReactNode {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = node.level * 24;

    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-slate-800 rounded group" style={{ paddingLeft: `${indent + 12}px` }}>
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : <span className="w-6 h-6"></span>}
          <span className="w-4 h-4 flex items-center justify-center text-slate-600 text-xs">
            {hasChildren && isExpanded ? '├' : '└'}
          </span>
          <span className="flex-1 text-white">{node.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleAddChild(node.id)} className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded hover:bg-green-600/30">+</button>
            <button onClick={() => handleEdit(node)} className="px-2 py-1 text-xs bg-slate-600/20 text-slate-400 rounded hover:bg-slate-600/30">✎</button>
            <button onClick={() => handleDelete(projId, node.id)} className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">×</button>
          </div>
        </div>
        {hasChildren && isExpanded && <div>{node.children.map(child => renderNode(child as WBSTreeNode, projId))}</div>}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Hạng mục công trình (WBS)</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
          >
            <option value="">Chọn dự án...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleAddRoot} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Thêm hạng mục
          </button>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="text-center text-slate-500 py-12"><p className="text-xl">Vui lòng chọn dự án</p></div>
      ) : (
        <>
          {showForm && (
            <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                {editingId ? 'Sửa hạng mục' : parentIdForNew ? 'Thêm hạng mục con' : 'Thêm hạng mục gốc'}
              </h3>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={wbsName}
                  onChange={(e) => setWbsName(e.target.value)}
                  required
                  className="flex-1 px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg"
                  placeholder="Nhập tên hạng mục..."
                  autoFocus
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingId ? 'Lưu' : 'Thêm'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                  Hủy
                </button>
              </form>
            </div>
          )}

          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            {tree.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <p className="text-xl mb-2">Chưa có hạng mục nào</p>
                <p>Nhấn "Thêm hạng mục" để bắt đầu</p>
              </div>
            ) : (
              <div className="py-2">{tree.map(node => renderNode(node, selectedProjectId))}</div>
            )}
          </div>
          <div className="mt-4 text-slate-500 text-sm">
            <p>💡 Nhấn ◀▶ để mở/đóng | Nhấn + để thêm con | Nhấn × để xóa</p>
          </div>
        </>
      )}
    </div>
  );
}

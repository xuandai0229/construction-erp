'use client';

import React, { useState, useCallback } from 'react';
import type { WBSItem } from '@/types';

interface WBSTreeProps {
  items: WBSItem[];
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  projectId: string;
}

interface WBSNodeProps {
  item: WBSItem;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  isLast?: boolean;
}

function WBSNode({ item, onAddChild, onDelete, isLast = true }: WBSNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className='font-mono text-sm'>
      <div className='flex items-center gap-2 py-1 hover:bg-slate-700 rounded px-2 group'>
        {/* Tree lines */}
        <div className='w-4 flex justify-center'>
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className='text-slate-400 hover:text-blue-400 transition-colors'
            >
              {expanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className='text-slate-600'>•</span>
          )}
        </div>

        {/* Item name */}
        <span className='text-slate-200 flex-1'>{item.name}</span>

        {/* Actions */}
        <div className='hidden group-hover:flex gap-1 items-center'>
          <button
            onClick={() => onAddChild(item.id)}
            className='p-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors'
            title='Add child item'
          >
            +
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this item and all children?')) {
                onDelete(item.id);
              }
            }}
            className='p-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors'
            title='Delete'
          >
            ×
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className='ml-4 border-l border-slate-600'>
          {item.children.map((child, idx) => (
            <div key={child.id} className='ml-2'>
              <WBSNode
                item={child}
                onAddChild={onAddChild}
                onDelete={onDelete}
                isLast={idx === item.children!.length - 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WBSTree({ items, onAddChild, onDelete, projectId }: WBSTreeProps) {
  if (items.length === 0) {
    return (
      <div className='p-4 text-slate-400 text-center'>
        <p>No items yet</p>
        <button
          onClick={() => onAddChild(null)}
          className='mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
        >
          Add Root Item
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-0'>
      {items.map((item) => (
        <WBSNode key={item.id} item={item} onAddChild={onAddChild} onDelete={onDelete} />
      ))}
    </div>
  );
}

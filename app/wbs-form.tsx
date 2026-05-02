'use client';

import React, { useState } from 'react';

interface WBSFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  parentName?: string;
}

export default function WBSForm({ onSubmit, onCancel, parentName }: WBSFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }
    onSubmit(name);
    setName('');
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-slate-800 rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold text-white mb-2'>Add WBS Item</h2>
        {parentName && (
          <p className='text-sm text-slate-400 mb-4'>Parent: {parentName}</p>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-300 mb-1'>
              Item Name *
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., Foundation'
              className='w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500'
              autoFocus
              required
            />
          </div>

          <div className='flex gap-2 pt-4'>
            <button
              type='submit'
              className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors'
            >
              Add Item
            </button>
            <button
              type='button'
              onClick={onCancel}
              className='flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition-colors'
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

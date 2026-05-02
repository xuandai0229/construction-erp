'use client';

import React, { useState } from 'react';
import type { Project } from '@/types';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

export default function ProjectForm({ onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    investor: '',
    total_value: 0,
    status: 'active' as const,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total_value' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.investor.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
    setFormData({ name: '', investor: '', total_value: 0, status: 'active' });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-slate-800 rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-xl font-bold text-white mb-4'>Create New Project</h2>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-300 mb-1'>
              Project Name *
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='e.g., Office Building A'
              className='w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-300 mb-1'>
              Investor *
            </label>
            <input
              type='text'
              name='investor'
              value={formData.investor}
              onChange={handleChange}
              placeholder='e.g., ABC Corporation'
              className='w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-300 mb-1'>
              Total Value (VND)
            </label>
            <input
              type='number'
              name='total_value'
              value={formData.total_value}
              onChange={handleChange}
              placeholder='0'
              className='w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-300 mb-1'>
              Status
            </label>
            <select
              name='status'
              value={formData.status}
              onChange={handleChange}
              className='w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500'
            >
              <option value='active'>Active</option>
              <option value='completed'>Completed</option>
              <option value='archived'>Archived</option>
            </select>
          </div>

          <div className='flex gap-2 pt-4'>
            <button
              type='submit'
              className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors'
            >
              Create Project
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

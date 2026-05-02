'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '../../sidebar';
import WBSTree from '../../wbs-tree';
import WBSForm from '../../wbs-form';
import { projectService } from '@/services.projectService';
import { wbsService } from '@/services.wbsService';
import type { Project, WBSItem } from '@/types';
import Link from 'next/link';

export default function ProjectWBSPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [wbsTree, setWbsTree] = useState<WBSItem[]>([]);
  const [showWBSForm, setShowWBSForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);

    const proj = projectService.getProject(projectId);
    setProject(proj);

    const tree = wbsService.getWBSTree(projectId);
    setWbsTree(tree);
    setIsLoading(false);
  }, [projectId]);

  const handleAddChild = (parentId: string | null) => {
    setSelectedParentId(parentId);

    if (parentId) {
      const allItems = wbsService.getWBSItems(projectId);
      const parent = allItems.find((item) => item.id === parentId);
      setParentName(parent?.name || '');
    } else {
      setParentName('');
    }

    setShowWBSForm(true);
  };

  const handleAddWBS = (name: string) => {
    wbsService.addWBSItem(projectId, name, selectedParentId);
    const updated = wbsService.getWBSTree(projectId);
    setWbsTree(updated);
    setShowWBSForm(false);
  };

  const handleDelete = (id: string) => {
    wbsService.deleteWBSItem(projectId, id);
    const updated = wbsService.getWBSTree(projectId);
    setWbsTree(updated);
  };

  if (!project) {
    return (
      <div className='flex h-screen bg-slate-900'>
        <Sidebar active='wbs' />
        <main className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <p className='text-slate-400 mb-4'>Project not found</p>
            <Link
              href='/projects-page'
              className='text-blue-400 hover:text-blue-300'
            >
              Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-slate-900'>
      <Sidebar active='wbs' />

      <main className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 px-8 py-6'>
          <div className='flex items-center justify-between mb-4'>
            <Link
              href='/projects-page'
              className='text-slate-400 hover:text-slate-200 text-sm'
            >
              ← Back to Projects
            </Link>
          </div>
          <div>
            <h1 className='text-3xl font-bold text-white'>{project.name}</h1>
            <p className='text-slate-400 mt-1'>Work Breakdown Structure (WBS)</p>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-8'>
          {isLoading ? (
            <div className='text-center text-slate-400'>Loading...</div>
          ) : (
            <div className='bg-slate-800 border border-slate-700 rounded-lg p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-white'>WBS Items</h2>
                <button
                  onClick={() => handleAddChild(null)}
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
                >
                  + Add Root Item
                </button>
              </div>

              <div className='bg-slate-700 rounded p-4 text-slate-100 max-h-96 overflow-y-auto'>
                <WBSTree
                  items={wbsTree}
                  onAddChild={handleAddChild}
                  onDelete={handleDelete}
                  projectId={projectId}
                />
              </div>

              <div className='mt-6 text-sm text-slate-400'>
                <p>Total Items: {wbsService.getWBSItems(projectId).length}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {showWBSForm && (
        <WBSForm
          onSubmit={handleAddWBS}
          onCancel={() => setShowWBSForm(false)}
          parentName={parentName}
        />
      )}
    </div>
  );
}

'use client';

import Sidebar from './sidebar';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className='flex h-screen bg-slate-900'>
      <Sidebar active='overview' />

      <main className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 px-8 py-6'>
          <div>
            <h1 className='text-3xl font-bold text-white'>Overview</h1>
            <p className='text-slate-400 mt-1'>Welcome to BuildERP Dashboard</p>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-8'>
          <div className='max-w-6xl mx-auto'>
            {/* Quick Stats */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
              {[
                { label: 'Total Projects', value: '0', color: 'blue' },
                { label: 'Active Projects', value: '0', color: 'green' },
                { label: 'Total Budget', value: '₀ VND', color: 'purple' },
                { label: 'Total Actual Cost', value: '₀ VND', color: 'orange' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-6`}
                >
                  <p className='text-slate-400 text-sm'>{stat.label}</p>
                  <p className={`text-2xl font-bold mt-2 text-${stat.color}-400`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Getting Started */}
            <div className='bg-slate-800 border border-slate-700 rounded-lg p-6'>
              <h2 className='text-xl font-bold text-white mb-4'>Getting Started</h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Link
                  href='/projects-page'
                  className='p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors group'
                >
                  <p className='text-sm text-slate-400 group-hover:text-slate-300'>
                    📁
                  </p>
                  <p className='text-white font-medium mt-2'>Create First Project</p>
                  <p className='text-sm text-slate-400 mt-1'>Start building your project</p>
                </Link>

                <Link
                  href='/projects-page'
                  className='p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors group'
                >
                  <p className='text-sm text-slate-400 group-hover:text-slate-300'>
                    🏗️
                  </p>
                  <p className='text-white font-medium mt-2'>Define WBS</p>
                  <p className='text-sm text-slate-400 mt-1'>
                    Structure work breakdown
                  </p>
                </Link>

                <Link
                  href='/projects-page'
                  className='p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors group'
                >
                  <p className='text-sm text-slate-400 group-hover:text-slate-300'>
                    💰
                  </p>
                  <p className='text-white font-medium mt-2'>Set Budget</p>
                  <p className='text-sm text-slate-400 mt-1'>Plan project costs</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

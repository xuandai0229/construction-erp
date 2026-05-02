'use client';

import Sidebar from '../sidebar';

export default function DebtsPage() {
  return (
    <div className='flex h-screen bg-slate-900'>
      <Sidebar active='debts' />
      <main className='flex-1 flex flex-col'>
        <div className='bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 px-8 py-6'>
          <h1 className='text-3xl font-bold text-white'>Debts</h1>
          <p className='text-slate-400 mt-1'>Project debts management</p>
        </div>
        <div className='flex-1 p-8 text-slate-400'>
          <p>Coming soon...</p>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI của Construction ERP. Tôi có thể giúp gì cho bạn?' }
  ]);

  const quickQuestions = [
    'Dự án nào rủi ro nhất?',
    'Chi phí tháng này?',
    'Công nợ quá hạn?',
    'Dự báo tiến độ?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-500 transition-all active:scale-95"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex h-[500px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#020617] shadow-2xl animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center gap-3 bg-blue-600 px-5 py-4 text-white">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Trợ lý AI Chiến lược</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-800 bg-slate-900/50">
            {quickQuestions.map((q) => (
              <button 
                key={q} 
                className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
                onClick={() => setMessages([...messages, { role: 'user', text: q }])}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-900">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Hỏi về dữ liệu dự án..." 
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

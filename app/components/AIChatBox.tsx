'use client';


import { EnterpriseForm } from '@/app/components/ui-enterprise';
import { useState, useRef, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là **Trợ lý AI Phân tích Chiến lược** của bạn. Tôi được kết nối trực tiếp với **Python Analytics Engine** để phân tích dữ liệu dự án thời gian thực.\n\nBạn có thể hỏi tôi bất kỳ câu hỏi nào như:\n- *Tại sao chi phí dự án tăng?*\n- *Hạng mục nào đang vượt BOQ?*\n- *Dòng tiền tháng này thế nào?*\n- *Báo cáo công nợ & rủi ro thi công.*'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentProjectId } = useERPStore();

  const quickQuestions = [
    'Tại sao chi phí tăng?',
    'Khoản nào vượt BOQ?',
    'Dự án nào có rủi ro?',
    'Vì sao tiến độ chậm?',
    'Giải thích công nợ.',
    'Dòng tiền thế nào?'
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentProjectId) return;

    // Add user message
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          query: text
        })
      });

      const result = await response.json();

      if (result.success && result.data?.answer) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: result.data.answer,
          timestamp: result.data.timestamp
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Rất tiếc, đã xảy ra lỗi trong quá trình xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Lỗi kết nối tới máy chủ AI. Vui lòng kiểm tra lại đường truyền mạng.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic custom markdown formatter for clean visual presentation in browser
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formattedLine = line;

      // H3 headers
      if (formattedLine.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-black text-blue-400 mt-3 mb-2 tracking-tight uppercase">{formattedLine.replace('### ', '')}</h4>;
      }

      // Bullet points
      if (formattedLine.startsWith('• ') || formattedLine.startsWith('- ')) {
        const content = formattedLine.replace(/^(• |- )/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-blue-500 mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[12.5px] leading-relaxed text-[var(--text-secondary)]">{renderBoldText(content)}</span>
          </div>
        );
      }

      // Span text with bold/italic formatting
      return <p key={idx} className="text-[12.5px] leading-relaxed my-1.5 text-[var(--text-secondary)]">{renderBoldText(formattedLine)}</p>;
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-blue-400 font-bold not-italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button with Pulsing AI Ring */}
      <div className="relative group">
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-70 blur-md group-hover:opacity-100 transition-all duration-300 animate-pulse pointer-events-none" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-slate-700/80 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-10"
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Chat Window with Glassmorphism */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 flex h-[580px] w-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[#020617]/95 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">

          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 border-b border-[var(--border)] relative">
            <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] leading-tight">AI Executive Advisor</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none block mt-0.5">Python Analytics Engine</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none relative overflow-hidden'
                  }`}>
                  {m.role === 'assistant' && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/[0.01] rounded-full blur-md" />
                  )}
                  <div className="relative z-10 text-[12.5px] leading-relaxed">
                    {m.role === 'user' ? <p>{m.text}</p> : formatMarkdown(m.text)}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
                  <div className="flex items-center gap-1.5 h-4">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-5 py-2.5 flex gap-2 overflow-x-auto border-t border-[var(--border)]/60 bg-slate-900/35 select-none custom-scrollbar">
            {quickQuestions.map((q) => (
              <button
                key={q}
                className="whitespace-nowrap rounded-full border border-slate-800 bg-slate-900/70 hover:bg-slate-850 hover:border-blue-500/30 px-3.5 py-1.5 text-[10.5px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm shrink-0"
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-950 border-t border-[var(--border)]">
            <EnterpriseForm
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentProjectId ? "Hỏi Trợ lý AI về chi phí, WBS, công nợ..." : "Đang tải dữ liệu dự án..."}
                disabled={isLoading || !currentProjectId}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4.5 py-3.5 pr-12 text-[12.5px] text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || !currentProjectId}
                className="absolute right-2.5 p-2 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </EnterpriseForm>
          </div>
        </div>
      )}
    </div>
  );
}

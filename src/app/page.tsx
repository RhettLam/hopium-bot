"use client";

import { useState, useRef, useEffect } from 'react';

export default function HopiumBot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userInput: userMsg,
          history: history
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botContent = '';

      setMessages(prev => [...prev, { role: 'bot', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        botContent += chunk;
        
        setMessages(prev => {
          const last = prev[prev.length - 1];
          const others = prev.slice(0, -1);
          return [...others, { ...last, content: botContent }];
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: '哎呀，出错了，可能主力在干扰我的信号...🤦‍♂️' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans">
      {/* 顶部导航栏 */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-center shrink-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-amber-500 tracking-wide">💊 Hopium Bot</h1>
      </header>

      {/* 聊天消息区 */}
      <main className="flex-1 overflow-y-auto p-4 w-full max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl mb-4">📉</div>
            <h2 className="text-xl font-medium text-slate-400">感觉被割了？还是卖飞了？</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              告诉我你的股票代码和现状，我来帮你找回自信。
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] px-5 py-3 rounded-2xl shadow-md text-sm md:text-base leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
            }`}>
              <div className="whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 底部输入框 */}
      <footer className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 pb-safe">
        <form 
          className="max-w-3xl mx-auto flex gap-3 items-end"
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        >
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的持仓和烦恼..." 
            rows="1"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 resize-none min-h-[50px] max-h-[120px] text-sm md:text-base"
          />
          <button 
            type="submit"
            disabled={isTyping || !input.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold rounded-2xl px-5 py-3 h-[50px] transition-colors flex items-center justify-center shrink-0 text-sm md:text-base"
          >
            发送
          </button>
        </form>
      </footer>
    </div>
  );
}

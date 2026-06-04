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
      // Format history for the API
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
      setMessages(prev => [...prev, { role: 'bot', content: '哎呀，出错了，可能主力在干扰我的信号...' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
            💊
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Hopium Bot</h1>
            <p className="text-xs text-zinc-400">你的股票情绪按摩大师</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="text-5xl mb-4">📉</div>
              <h2 className="text-xl font-medium text-zinc-400">感觉被割了？还是卖飞了？</h2>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                告诉我你的股票代码和现状，我来帮你找回自信。
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user' 
                ? 'bg-orange-600 text-white rounded-tr-none' 
                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-zinc-700">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="例如：持有 600519 跌惨了，求安慰..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-200 placeholder-zinc-500"
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            发送
          </button>
        </div>
      </footer>
    </div>
  );
}

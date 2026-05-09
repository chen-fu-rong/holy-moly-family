"use client";

import { useChat } from '@ai-sdk/react';
import { Send, Loader2, Sparkles, Bot, ChevronLeft } from 'lucide-react';
import { useVaultStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function AIPage() {
  const transactions = useVaultStore(state => state.transactions);
  const family = useVaultStore(state => state.family);
  const currency = useVaultStore(state => state.currency);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prepare a minified context to send to the AI
  const getContextData = () => {
    // Only send the last 30 days to save tokens and improve speed
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTxs = transactions
      .filter(tx => new Date(tx.transaction_date) >= thirtyDaysAgo)
      .map(tx => ({
        d: tx.transaction_date.split('T')[0],
        a: tx.amount,
        c: tx.category,
        t: tx.type, // income/expense
        s: tx.spender,
        b: tx.is_business_overhead ? 1 : 0
      }));

    return {
      family_name: family?.family_name,
      currency: currency,
      recent_transactions_last_30_days: recentTxs,
      budgets: family?.budget_limits
    };
  };

  const { messages = [], sendMessage, status, error: chatError } = useChat({
    api: '/api/chat',
    body: {
      contextData: getContextData()
    }
  });

  const [input, setInput] = useState('');
  const isLoading = status !== 'ready';

  // EXTREMELY SAFE message handling
  const safeMessages = messages && Array.isArray(messages) ? messages : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    try {
      // Use the explicit role/content format which is more likely to be included in the messages array
      sendMessage({ role: 'user', content: input });
      setInput('');
    } catch (err) {
      console.error("Chat Send Error:", err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [safeMessages]);

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transform-gpu">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-500/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
            <ChevronLeft size={24} />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 dark:text-white text-lg">Ask Holy Moly</h1>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Sparkles size={10} className="text-indigo-500" /> Powered by Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4">
        {safeMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-4 opacity-50">
            <Bot size={64} className="text-indigo-500 mb-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Personal Financial Advisor</h2>
            <p className="text-sm font-medium max-w-xs">Ask me about your spending trends, check your budget limits, or summarize your recent transactions!</p>
          </div>
        )}
        
        {safeMessages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-tl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] rounded-tl-sm px-5 py-3.5 flex items-center gap-2 shadow-sm">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500 font-medium">Analyzing data...</span>
            </div>
          </div>
        )}
        {chatError && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {chatError.message}
          </div>
        )}
        <div ref={messagesEndRef} className="h-20" />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shrink-0 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        <form onSubmit={handleSubmit} className="relative flex items-center max-w-3xl mx-auto">
          <input
            value={input || ''}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How was my spending this month?"
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input || !input.trim()}
            className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
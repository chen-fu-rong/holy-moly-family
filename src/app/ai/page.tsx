"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useVaultStore } from "@/lib/store";
import { Send, Bot, User, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function FinanceAIPage() {
  const transactions = useVaultStore(state => state.transactions);
  const family = useVaultStore(state => state.family);
  const currency = useVaultStore(state => state.currency);
  const myName = typeof window !== 'undefined' ? localStorage.getItem("my_name") || "User" : "User";

  // Chat state management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${myName}! I'm your Holy Moly Finance Manager ✨. I've analyzed your recent transactions and budgets. How can I help you optimize your money today?`
    }
  ]);
  const [localInput, setLocalInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const financialContext = useMemo(() => {
    if (!transactions || transactions.length === 0) return "No transactions recorded yet.";
    const expenses = transactions.filter(t => t.type === 'expense').slice(0, 50); 
    const incomes = transactions.filter(t => t.type === 'income').slice(0, 20);
    const totalExp = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalInc = incomes.reduce((sum, t) => sum + Number(t.amount), 0);
    const budgetLimits = family?.budget_limits || {};
    
    // Aggregate spending by member AND category for better AI precision
    const spendingDetail: Record<string, { total: number, categories: Record<string, number> }> = {};
    
    // Use all available transactions for the summary (up to 500)
    transactions.filter(t => t.type === 'expense').forEach(t => {
      if (!spendingDetail[t.spender]) {
        spendingDetail[t.spender] = { total: 0, categories: {} };
      }
      spendingDetail[t.spender].total += Number(t.amount);
      spendingDetail[t.spender].categories[t.category] = (spendingDetail[t.spender].categories[t.category] || 0) + Number(t.amount);
    });
    
    return `
User Name: ${myName}
Family Members: ${JSON.stringify(family?.members || [])}
Currency: ${currency}
Monthly Expected Income: ${family?.expected_monthly_income || 'Not set'}
Total Income (recent): ${totalInc}
Total Expenses (recent): ${totalExp}
Detailed Spending Summary: ${JSON.stringify(spendingDetail)}
Budget Limits: ${JSON.stringify(budgetLimits)}
Recent Transactions (detailed): ${JSON.stringify(expenses.map(t => ({ who: t.spender, cat: t.category, amt: t.amount, note: t.notes, date: t.transaction_date })))}
    `.trim();
  }, [transactions, family, currency, myName]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: localInput
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setLocalInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          data: { context: financialContext }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();
      let messageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Add or update assistant message as text streams in
        if (!messageAdded) {
          setMessages(prev => [...prev, {
            id: assistantId,
            role: 'assistant',
            content: assistantContent
          }]);
          messageAdded = true;
        } else {
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = assistantContent;
            }
            return updated;
          });
        }
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      console.error('Chat error:', errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex items-center gap-3 shadow-sm">
        <Link href="/" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95 transition-transform text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 dark:text-white leading-tight">Finance AI</h1>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Smart Advisor</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {messages && messages.map(m => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={m.id} 
            className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${m.role === 'user' ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white'}`}>
              {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'}`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Bot size={16} className="text-white" />
            </div>
            <div className="p-4 rounded-[1.5rem] rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-2 shadow-sm">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500 font-medium">Analyzing data...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="p-4 rounded-[1.5rem] rounded-tl-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm shadow-sm">
              Something went wrong: {error.message || "Please check your Gemini API key."}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-950 dark:via-gray-950 to-transparent pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <form 
          onSubmit={handleFormSubmit}
          className="max-w-4xl mx-auto relative flex items-center shadow-2xl rounded-full overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
        >
          <input
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Ask about your budget..."
            className="w-full py-4 pl-6 pr-14 bg-transparent outline-none text-base md:text-sm text-gray-900 dark:text-white placeholder-gray-400 font-medium"
          />
          <button 
            type="submit" 
            className={`absolute right-2 p-2.5 text-white rounded-full transition-colors flex items-center justify-center ${(!localInput || !localInput.trim() || isLoading) ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-indigo-600 active:scale-95'}`}
          >
            <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useVaultStore } from "@/lib/store";
import { generateInsights, Insight } from "@/lib/insights";
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, Target, Wallet, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const IconMap: Record<string, any> = {
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Wallet
};

export default function FinanceInsights() {
  const transactions = useVaultStore(state => state.transactions);
  const loans = useVaultStore(state => state.loans);
  const savingsGoals = useVaultStore(state => state.savingsGoals);
  const family = useVaultStore(state => state.family);
  const currency = useVaultStore(state => state.currency);

  const insights = useMemo(() => {
    const budgetLimits = family?.budget_limits || {};
    return generateInsights(transactions, loans, savingsGoals, budgetLimits, currency);
  }, [transactions, loans, savingsGoals, family, currency]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
        <Lightbulb size={20} className="text-amber-500" /> 
        Smart Insights
      </h3>
      
      <div className="flex flex-col gap-3">
        {insights.map((insight, idx) => {
          const Icon = IconMap[insight.icon] || Lightbulb;
          const colors = {
            positive: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
            neutral: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
            negative: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800",
            warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className={`p-4 rounded-2xl border flex gap-4 items-start ${colors[insight.type]}`}
            >
              <div className="mt-1">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-0.5">{insight.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed font-medium">
                  {insight.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Loader2, Scale, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "../../lib/supabase";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e", "#0ea5e9"];

export default function ReportsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false); // Compare Toggle
  
  const [myName, setMyName] = useState("Me");
  const [partnerName, setPartnerName] = useState("Partner");

  useEffect(() => {
    const currentName = localStorage.getItem("my_name") || "Me";
    setMyName(currentName);
    fetchExpenses(currentName);
  }, []);

  const fetchExpenses = async (currentName: string) => {
    setLoading(true);
    // Expense (ထွက်ငွေ) သီးသန့်ဆွဲမည်
    const { data, error } = await supabase.from("transactions").select("amount, category, spender").eq("type", "expense");

    if (!error && data) {
      let detectedPartner = "Partner";
      const groupedPie: any = {};
      const groupedCompare: any = {};

      data.forEach((tx) => {
        const category = tx.category;
        const amount = Math.abs(tx.amount);
        let spender = tx.spender || "Unknown";
        
        // Partner Name ရှာဖွေခြင်း
        if (spender !== currentName && spender !== "Unknown" && spender !== "Shared") {
          detectedPartner = spender;
        }

        // 1. Pie Chart အတွက် စုစုပေါင်းပေါင်းခြင်း (Total Expenses by Category)
        groupedPie[category] = (groupedPie[category] || 0) + amount;

        // 2. Bar Chart အတွက် လူအလိုက် ခွဲပေါင်းခြင်း (Compare Mode)
        if (!groupedCompare[category]) {
          groupedCompare[category] = { category: category, [currentName]: 0, Partner: 0 };
        }
        
        if (spender === currentName) {
          groupedCompare[category][currentName] += amount;
        } else {
          groupedCompare[category]["Partner"] += amount; // Partner's amount
        }
      });

      setPartnerName(detectedPartner);

      // Pie Data Format
      const formattedPie = Object.keys(groupedPie).map((key) => ({
        name: key,
        value: groupedPie[key],
      })).sort((a, b) => b.value - a.value);
      setChartData(formattedPie);

      // Compare Data Format (Replace "Partner" with actual detected name)
      const formattedCompare = Object.values(groupedCompare).map((item: any) => {
        const newItem = { category: item.category, [currentName]: item[currentName], [detectedPartner]: item["Partner"] };
        return newItem;
      });
      setCompareData(formattedCompare);
    }
    setLoading(false);
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-bold text-gray-900 dark:text-white mb-1">{payload[0].name}</p>
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{payload[0].value.toLocaleString()} Ks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto pb-24">
      
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-gray-500 font-medium">Analytics & Reports</p>
          <h2 className="text-3xl font-bold tracking-tight">Expense Reports</h2>
        </div>
        
        {/* 🟢 Compare Toggle Button */}
        <button 
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors ${isCompareMode ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-100 dark:border-gray-700'}`}
        >
          {isCompareMode ? <PieIcon size={18} /> : <Scale size={18} />}
          {isCompareMode ? "Overall View" : "Compare"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900/40 rounded-3xl p-6 lg:p-8 border border-gray-100 dark:border-gray-800 shadow-sm w-full">
        <h3 className="text-xl font-bold mb-8 text-center md:text-left">
          {isCompareMode ? "Expense Comparison by Category" : "Overall Expenses by Category"}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
        ) : chartData.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-gray-500">No expenses recorded yet.</div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
            
            {/* 🟢 ဇယားများ ပြသမည့်အပိုင်း */}
            <div className="w-full md:w-2/3 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {!isCompareMode ? (
                  // OVERALL PIE CHART
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                ) : (
                  // COMPARE BAR CHART
                  <BarChart data={compareData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="category" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey={myName} fill="#6366f1" radius={[4, 4, 0, 0]} name={`${myName}'s Spend`} />
                    <Bar dataKey={partnerName} fill="#f43f5e" radius={[4, 4, 0, 0]} name={`${partnerName}'s Spend`} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* List Details (Overall View အတွက်သာ ပြမည်) */}
            {!isCompareMode && (
              <div className="w-full md:w-1/3 space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <p className="font-semibold text-sm truncate max-w-[120px]">{item.name}</p>
                    </div>
                    <p className="font-bold text-sm">{item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
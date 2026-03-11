"use client";

import { Home, PieChart, Plus, Settings, WalletCards, HandCoins } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddModal from "./AddModal";

export default function BottomNav() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleOpenEdit = (e: any) => {
      setEditData(e.detail);
      setIsAddOpen(true);
    };
    window.addEventListener("open-edit-modal", handleOpenEdit);
    return () => window.removeEventListener("open-edit-modal", handleOpenEdit);
  }, []);

  return (
    <>
      {/* Mobile Bottom Navigation - Fixed UI */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-safe">
        <div className="flex justify-between items-center h-[72px] px-2 relative max-w-xl mx-auto">
          
          <Link href="/" className={`flex-1 flex flex-col items-center transition-colors ${pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}`}>
            <Home size={22} /><span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          
          <Link href="/reports" className={`flex-1 flex flex-col items-center transition-colors ${pathname === '/reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}`}>
            <PieChart size={22} /><span className="text-[10px] mt-1 font-medium">Reports</span>
          </Link>
          
          {/* Floating Action Button (Centered) */}
          <div className="flex-1 flex justify-center">
            <div className="absolute -top-6">
              <button 
                onClick={() => { setEditData(null); setIsAddOpen(true); }} 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={28} />
              </button>
            </div>
          </div>

          <Link href="/loans" className={`flex-1 flex flex-col items-center transition-colors ${pathname === '/loans' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}`}>
            <HandCoins size={22} /><span className="text-[10px] mt-1 font-medium">Loans</span>
          </Link>
          
          <Link href="/settings" className={`flex-1 flex flex-col items-center transition-colors ${pathname === '/settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}`}>
            <Settings size={22} /><span className="text-[10px] mt-1 font-medium">Settings</span>
          </Link>
          
        </div>
      </div>

      {/* Desktop Side Navigation */}
      <div className="hidden md:flex fixed top-0 left-0 bottom-0 w-24 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex-col items-center py-8 z-[60]">
        <div className="flex-1 flex flex-col gap-6 w-full">
           <Link href="/" className={`flex flex-col items-center p-2 w-full border-r-4 ${pathname === '/' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-indigo-500'}`}><Home size={28} /><span className="text-xs mt-2 font-medium">Home</span></Link>
           <Link href="/reports" className={`flex flex-col items-center p-2 w-full border-r-4 ${pathname === '/reports' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-indigo-500'}`}><PieChart size={28} /><span className="text-xs mt-2 font-medium">Reports</span></Link>
           <Link href="/loans" className={`flex flex-col items-center p-2 w-full border-r-4 ${pathname === '/loans' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-indigo-500'}`}><HandCoins size={28} /><span className="text-xs mt-2 font-medium">Loans</span></Link>
           <Link href="/wallets" className={`flex flex-col items-center p-2 w-full border-r-4 ${pathname === '/wallets' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-indigo-500'}`}><WalletCards size={28} /><span className="text-xs mt-2 font-medium">Wallets</span></Link>
        </div>
        <div className="mb-8">
          <button onClick={() => { setEditData(null); setIsAddOpen(true); }} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={28} /></button>
        </div>
        <Link href="/settings" className={`flex flex-col items-center p-2 w-full border-r-4 ${pathname === '/settings' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-indigo-500'}`}><Settings size={28} /><span className="text-xs mt-2 font-medium">Settings</span></Link>
      </div>

      <AddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} editData={editData} />
    </>
  );
}
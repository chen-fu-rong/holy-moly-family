"use client";

import { Home, PieChart, Wallet, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Reports", href: "/reports", icon: PieChart },
    // The center gap is left for the massive "+" button
    { name: "Wallets", href: "/wallets", icon: Wallet },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleOpenAddModal = () => {
    // This broadcasts a signal that our AddModal will listen for
    window.dispatchEvent(new Event("open-add-modal"));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto relative flex justify-between items-center h-16 px-6">
        
        {/* Left Side Navigation */}
        <div className="flex w-2/5 justify-between">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full mt-1 group">
                <Icon size={22} className={`mb-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* The Big Center FAB (Floating Action Button) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
          <button
            onClick={handleOpenAddModal}
            className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-600/40 active:translate-y-0 transition-all border-4 border-white dark:border-gray-900"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Side Navigation */}
        <div className="flex w-2/5 justify-between">
          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full mt-1 group">
                <Icon size={22} className={`mb-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
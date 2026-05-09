"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Plus, HandCoins, PieChart, type LucideIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Wallets", href: "/wallets", icon: Wallet },
    { name: "Add", href: "#", icon: Plus, isAction: true },
    { name: "Debts", href: "/loans", icon: HandCoins },
    { name: "Reports", href: "/reports", icon: PieChart },
  ];

  const renderNavPill = (item: { name: string; href: string; icon: LucideIcon; isAction?: boolean }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link 
        key={item.name} 
        href={item.href} 
        onClick={() => triggerHaptic('light')}
        className="relative group z-10"
      >
        <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300 ease-out transform-gpu ${
          isActive
            ? "bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
        }`}>
          <Icon 
            size={20} 
            strokeWidth={isActive ? 2.5 : 2} 
            className={`transition-transform duration-300 transform-gpu ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
          />
          <span className={`font-bold text-[11px] tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${
            isActive ? "max-w-[70px] opacity-100" : "max-w-0 opacity-0"
          }`}>
            {item.name}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Floating Glass Dock */}
      <nav 
        className="md:hidden fixed left-4 right-4 z-[45] transition-all duration-300 transform-gpu"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] rounded-[2rem] px-2 py-2 flex justify-between items-center relative">
          
          {/* Left Side Items */}
          <div className="flex items-center gap-1">
            {navItems.slice(0, 2).map(renderNavPill)}
          </div>

          {/* Center Floating Action Button (+) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20">
            <button 
              onClick={(e) => {
                e.preventDefault();
                // THIS triggers the AddModal globally!
                window.dispatchEvent(new Event("open-add-modal"));
              }}
              className="bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white p-3.5 rounded-full shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:scale-110 hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.7)] transition-all duration-300 transform-gpu active:scale-95"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center gap-1">
            {navItems.slice(3, 5).map(renderNavPill)}
          </div>

        </div>
      </nav>

      {/* Desktop Floating Side Dock */}
      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-800 shadow-2xl rounded-[2rem] py-4 px-2 flex flex-col items-center gap-3">
          {navItems.map((item) => {
            
            // Desktop Action Button
            if (item.isAction) {
              return (
                <div key={item.name} className="my-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      // THIS triggers the AddModal globally!
                      window.dispatchEvent(new Event("open-add-modal"));
                    }}
                    className="bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white p-3.5 rounded-full shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] hover:scale-110 transition-all duration-300 transform-gpu active:scale-95"
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href} className="relative group" title={item.name}>
                <div className={`p-3 rounded-2xl transition-all duration-300 ease-out flex items-center justify-center transform-gpu ${
                  isActive
                    ? "bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-transform duration-300 transform-gpu ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
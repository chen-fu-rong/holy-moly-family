"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Plus, HandCoins, PieChart, Bot, type LucideIcon } from "lucide-react";
import { triggerHaptic } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/ai') return null;

  const navItems = [
    { name: "Home", href: "/", icon: Home, id: 1 },
    { name: "Wallets", href: "/wallets", icon: Wallet, id: 2 },
    { name: "Add", href: "#", icon: Plus, isAction: true, id: 3 },
    { name: "Debts", href: "/loans", icon: HandCoins, id: 4 },
    { name: "Reports", href: "/reports", icon: PieChart, id: 5 },
  ];

  const renderTabItem = (item: { name: string; href: string; icon: LucideIcon; isAction?: boolean; id: number }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const handleClick = (e: React.MouseEvent) => {
      if (item.isAction) {
        e.preventDefault();
        triggerHaptic('medium');
        window.dispatchEvent(new CustomEvent("open-add-modal", { detail: { transaction: null } }));
      } else {
        triggerHaptic('light');
      }
    };

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={handleClick}
        className="flex-1 flex flex-col items-center justify-center w-full min-h-[56px] md:min-h-[60px] transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-800 relative group"
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-b-full"></div>
        )}
        
        {/* Icon container */}
        <div className={`p-2 rounded-lg transition-all duration-200 transform-gpu ${
          isActive
            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        }`}>
          <Icon 
            size={item.isAction ? 28 : 24} 
            strokeWidth={isActive ? 2.5 : 2} 
            className={`transition-transform duration-200 ${isActive && !item.isAction ? 'scale-110' : ''}`}
          />
        </div>
        
        {/* Label - only show on active */}
        {isActive && (
          <span className="text-[10px] font-bold mt-0.5 text-gray-900 dark:text-white tracking-wider uppercase">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Bottom Navigation Tab Bar - iPhone 16 Pro Optimized */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.4)]"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0px)',
        }}
      >
        <div className="flex items-stretch w-full h-auto divide-x divide-gray-200 dark:divide-gray-800">
          {navItems.map(renderTabItem)}
        </div>
      </nav>

      {/* Floating Action Button - Separate from nav */}
      <div 
        className="md:hidden fixed right-4 z-35 transition-all duration-300 transform-gpu"
        style={{ bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 70px)' }}
      >
        <Link 
          href="/ai"
          onClick={() => triggerHaptic('light')}
          title="AI Assistant"
          className="flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-full shadow-[0_8px_24px_-5px_rgba(79,70,229,0.4)] border border-gray-100 dark:border-gray-700 hover:scale-110 transition-all duration-300 transform-gpu active:scale-95"
        >
          <Bot size={26} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Desktop Floating Side Dock */}
      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-800 shadow-2xl rounded-[2rem] py-6 px-3 flex flex-col items-center gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            const handleClick = (e: React.MouseEvent) => {
              if (item.isAction) {
                e.preventDefault();
                triggerHaptic('medium');
                window.dispatchEvent(new CustomEvent("open-add-modal", { detail: { transaction: null } }));
              } else {
                triggerHaptic('light');
              }
            };

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  title="Add Transaction"
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white rounded-full shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] hover:scale-110 transition-all duration-300 transform-gpu active:scale-95"
                >
                  <Plus size={28} strokeWidth={3} />
                </button>
              );
            }

            return (
              <Link 
                key={item.id}
                href={item.href}
                onClick={handleClick}
                title={item.name}
                className="relative group"
              >
                <div className={`w-12 h-12 rounded-2xl transition-all duration-300 ease-out flex items-center justify-center transform-gpu ${
                  isActive
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}>
                  <Icon 
                    size={26} 
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
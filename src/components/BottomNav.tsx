"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Plus, HandCoins, PieChart } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Wallet", href: "/wallets", icon: Wallet }, // Points to Settings now!
    { name: "Add", href: "#", icon: Plus, isAction: true },
    { name: "Loan", href: "/loans", icon: HandCoins },
    { name: "Report", href: "/reports", icon: PieChart }, // Ready for our next build
  ];

  // Helper function to render standard navigation pills
  const renderNavPill = (item: any) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link key={item.name} href={item.href} className="relative group z-10">
        <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-500 ease-out ${
          isActive
            ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-inner"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
        }`}>
          <Icon 
            size={20} 
            strokeWidth={isActive ? 2.5 : 2} 
            className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
          />
          <span className={`font-bold text-[11px] tracking-wide transition-all duration-500 overflow-hidden whitespace-nowrap ${
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
  className="md:hidden fixed left-4 right-4 z-50 transition-all duration-300"
  style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] rounded-full px-2 py-2 flex justify-between items-center relative">
          
          {/* Left Side Items */}
          <div className="flex items-center gap-1">
            {navItems.slice(0, 2).map(renderNavPill)}
          </div>

          {/* Center Floating Action Button (+) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20">
            <button 
              onClick={(e) => {
  e.preventDefault();
  window.dispatchEvent(new Event("open-add-modal"));
}}
              className="bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white p-3.5 rounded-full shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] hover:scale-110 hover:shadow-[0_20px_40px_-5px_rgba(79,70,229,0.8)] transition-all duration-300 active:scale-95"
            >
              <Plus size={30} strokeWidth={3} />
            </button>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center gap-1">
            {navItems.slice(3, 5).map(renderNavPill)}
          </div>

        </div>
      </nav>

      {/* Desktop Floating Side Dock */}
      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-full py-4 px-2 flex flex-col items-center gap-3">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key={item.name} className="my-2">
                  <button 
                    onClick={() => alert("Add Button Clicked!")}
                    className="bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white p-3.5 rounded-full shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] hover:scale-110 transition-all duration-300 active:scale-95"
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
                <div className={`p-3 rounded-full transition-all duration-500 ease-out flex items-center justify-center ${
                  isActive
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}>
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
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
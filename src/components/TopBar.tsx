"use  client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

export default function TopBar() {
  const pathname = usePathname();
  
  // Hide the settings button if we are already ON the settings page
  const isSettingsPage = pathname === "/settings";

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
          Holy Moly Family
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        {isSettingsPage ? (
          <Link 
            href="/" 
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            Done
          </Link>
        ) : (
          <Link 
            href="/settings" 
            className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
          >
            <Settings size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
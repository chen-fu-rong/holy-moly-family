"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Error ကင်းအောင် Client ပေါ်ရောက်မှ Render လုပ်ရန်
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
        Holy Moly Family
      </h1>
      <button
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
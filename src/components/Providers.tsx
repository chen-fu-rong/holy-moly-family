// src/components/Providers.tsx
"use client";

import { useState, useEffect } from "react";
import AddModal from "./AddModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Listen for the custom event sent by the BottomNav
    const handleOpen = () => setIsAddModalOpen(true);
    window.addEventListener("open-add-modal", handleOpen);
    
    return () => window.removeEventListener("open-add-modal", handleOpen);
  }, []);

  return (
    <>
      {children}
      <AddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
}
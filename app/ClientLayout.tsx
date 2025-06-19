"use client";
import { useEffect } from "react";
import { useUserStore } from "./components/useUserStore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { initFromStorage } = useUserStore();
  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);
  return <>{children}</>;
} 
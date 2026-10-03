"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // Monitor Online/Offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600/95 text-white text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>You are currently offline. Note changes cannot be saved until connection is restored.</span>
    </div>
  );
}
